// cloudfunctions/manageProduct/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 检查管理员权限（users 表不存在时容错通过）
async function requireAdmin(openid) {
  try {
    const res = await db.collection('users').where({ openid }).get();
    if (res.data.length > 0 && res.data[0].role !== 'admin') {
      throw new Error('无操作权限');
    }
  } catch (err) {
    if (err.message === '无操作权限') throw err;
    // 表不存在等其他错误：容错通过
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, productId, name, price, image, categoryId, status } = event;

  try {
    switch (action) {
      case 'list': return await listProducts();
      case 'add':
        await requireAdmin(OPENID);
        return await addProduct({ name, price, image, categoryId, status });
      case 'update':
        await requireAdmin(OPENID);
        return await updateProduct(productId, { name, price, image, categoryId, status });
      case 'delete':
        await requireAdmin(OPENID);
        return await deleteProduct(productId);
      default: return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageProduct error:', err);
    return { success: false, error: err.message };
  }
};

async function listProducts() {
  const result = await db.collection('products').orderBy('createdAt', 'desc').limit(200).get();
  return { success: true, data: result.data };
}

async function addProduct(data) {
  if (!data.name || data.price == null || !data.categoryId) {
    return { success: false, error: '名称、价格和分类不能为空' };
  }
  const priceVal = Number(data.price);
  if (isNaN(priceVal) || priceVal <= 0) return { success: false, error: '价格无效' };
  const result = await db.collection('products').add({
    data: {
      name: data.name, price: priceVal, image: data.image || '',
      categoryId: data.categoryId, status: data.status || 'on',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }
  });
  return { success: true, data: { _id: result._id } };
}

async function updateProduct(productId, data) {
  if (!productId) return { success: false, error: '缺少商品ID' };
  const updateData = { updatedAt: new Date().toISOString() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.price !== undefined) {
    const p = Number(data.price);
    if (isNaN(p) || p <= 0) return { success: false, error: '价格无效' };
    updateData.price = p;
  }
  if (data.image !== undefined) updateData.image = data.image;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.status !== undefined) updateData.status = data.status;
  await db.collection('products').doc(productId).update({ data: updateData });
  return { success: true };
}

async function deleteProduct(productId) {
  if (!productId) return { success: false, error: '缺少商品ID' };
  await db.collection('products').doc(productId).remove();
  return { success: true };
}
