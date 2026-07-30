// cloudfunctions/manageProduct/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { action, productId, name, price, image, categoryId, status } = event;

  try {
    switch (action) {
      case 'list':
        return await listProducts();
      case 'add':
        return await addProduct({ name, price, image, categoryId, status });
      case 'update':
        return await updateProduct(productId, { name, price, image, categoryId, status });
      case 'delete':
        return await deleteProduct(productId);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageProduct error:', err);
    return { success: false, error: err.message };
  }
};

// 获取全部商品（含下架）
async function listProducts() {
  const result = await db.collection('products')
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get();
  return { success: true, data: result.data };
}

// 添加商品
async function addProduct(data) {
  if (!data.name || data.price == null || !data.categoryId) {
    return { success: false, error: '名称、价格和分类不能为空' };
  }
  const result = await db.collection('products').add({
    data: {
      name: data.name,
      price: Number(data.price),
      image: data.image || '',
      categoryId: data.categoryId,
      status: data.status || 'on',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  return { success: true, data: { _id: result._id } };
}

// 更新商品
async function updateProduct(productId, data) {
  if (!productId) return { success: false, error: '缺少商品ID' };

  const updateData = { updatedAt: new Date().toISOString() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.price !== undefined) updateData.price = Number(data.price);
  if (data.image !== undefined) updateData.image = data.image;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.status !== undefined) updateData.status = data.status;

  await db.collection('products').doc(productId).update({ data: updateData });
  return { success: true };
}

// 删除商品
async function deleteProduct(productId) {
  if (!productId) return { success: false, error: '缺少商品ID' };
  await db.collection('products').doc(productId).remove();
  return { success: true };
}
