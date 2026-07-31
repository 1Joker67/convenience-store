// cloudfunctions/manageProduct/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (!res.data.length || res.data[0].role !== 'admin') {
    throw new Error('无操作权限');
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, productId, name, price, image, categoryId, status } = event;

  try {
    switch (action) {
      case 'list': return await listProducts();
      case 'add': await requireAdmin(OPENID); return await addProduct(name, price, image, categoryId, status);
      case 'update': await requireAdmin(OPENID); return await updateProduct(productId, name, price, image, categoryId, status);
      case 'delete': await requireAdmin(OPENID); return await deleteProduct(productId);
      default: return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageProduct error:', err);
    if (err.message === '无操作权限') return { success: false, error: '无操作权限' };
    return { success: false, error: '内部错误' };
  }
};

async function listProducts() {
  const r = await db.collection('products').orderBy('createdAt', 'desc').limit(200).get();
  return { success: true, data: r.data };
}
async function addProduct(name, price, image, categoryId, status) {
  if (!name || price == null || !categoryId) return { success: false, error: '参数不全' };
  const p = Number(price);
  if (isNaN(p) || p <= 0) return { success: false, error: '价格无效' };
  if (!/^[a-zA-Z0-9+/=]+$/.test(categoryId) && categoryId.length < 16) return { success: false, error: '分类ID无效' };
  const r = await db.collection('products').add({
    data: { name: name.trim(), price: p, image: image || '', categoryId, status: status || 'on', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  });
  return { success: true, data: { _id: r._id } };
}
async function updateProduct(productId, name, price, image, categoryId, status) {
  if (!productId) return { success: false, error: '缺少商品ID' };
  const d = { updatedAt: new Date().toISOString() };
  if (name !== undefined) d.name = name.trim();
  if (price !== undefined) { const p = Number(price); if (isNaN(p) || p <= 0) return { success: false, error: '价格无效' }; d.price = p; }
  if (image !== undefined) d.image = image;
  if (categoryId !== undefined) d.categoryId = categoryId;
  if (status !== undefined && ['on', 'off'].includes(status)) d.status = status;
  await db.collection('products').doc(productId).update({ data: d });
  return { success: true };
}
async function deleteProduct(productId) {
  if (!productId) return { success: false, error: '缺少商品ID' };
  await db.collection('products').doc(productId).remove();
  return { success: true };
}
