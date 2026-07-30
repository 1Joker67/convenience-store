// cloudfunctions/manageCategory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 检查管理员权限
async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (res.data.length === 0 || res.data[0].role !== 'admin') {
    throw new Error('无操作权限');
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, categoryId, name, sort } = event;

  try {
    switch (action) {
      case 'list':
        return await listCategories();
      case 'add':
        await requireAdmin(OPENID);
        return await addCategory({ name, sort });
      case 'update':
        await requireAdmin(OPENID);
        return await updateCategory(categoryId, { name, sort });
      case 'delete':
        await requireAdmin(OPENID);
        return await deleteCategory(categoryId);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageCategory error:', err);
    return { success: false, error: err.message };
  }
};

async function listCategories() {
  const result = await db.collection('categories').orderBy('sort', 'asc').limit(100).get();
  return { success: true, data: result.data };
}

async function addCategory(data) {
  if (!data.name) return { success: false, error: '分类名称不能为空' };
  const result = await db.collection('categories').add({
    data: { name: data.name, sort: data.sort || 0, createdAt: new Date().toISOString() }
  });
  return { success: true, data: { _id: result._id } };
}

async function updateCategory(categoryId, data) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sort !== undefined) updateData.sort = data.sort;
  if (Object.keys(updateData).length === 0) return { success: false, error: '没有要更新的字段' };
  await db.collection('categories').doc(categoryId).update({ data: updateData });
  return { success: true };
}

async function deleteCategory(categoryId) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  // 检查是否有商品引用此分类
  const products = await db.collection('products').where({ categoryId }).limit(1).get();
  if (products.data.length > 0) {
    return { success: false, error: '该分类下还有商品，请先删除或移走商品' };
  }
  await db.collection('categories').doc(categoryId).remove();
  return { success: true };
}
