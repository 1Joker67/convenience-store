// cloudfunctions/manageCategory/index.js
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
  const { action, categoryId, name } = event;

  try {
    switch (action) {
      case 'list':
        return await listCategories();
      case 'add':
        await requireAdmin(OPENID);
        return await addCategory(name);
      case 'update':
        await requireAdmin(OPENID);
        return await updateCategory(categoryId, name);
      case 'delete':
        await requireAdmin(OPENID);
        return await deleteCategory(categoryId);
      case 'moveUp':
        await requireAdmin(OPENID);
        return await moveCategory(categoryId, -1);
      case 'moveDown':
        await requireAdmin(OPENID);
        return await moveCategory(categoryId, 1);
      default:
        return { success: false, error: '未知操作: ' + action };
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

async function addCategory(name) {
  if (!name || !name.trim()) return { success: false, error: '分类名称不能为空' };
  const max = await db.collection('categories').orderBy('sort', 'desc').limit(1).get();
  const nextSort = max.data.length > 0 ? (max.data[0].sort || 0) + 1 : 1;
  const result = await db.collection('categories').add({
    data: { name: name.trim(), sort: nextSort, createdAt: new Date().toISOString() }
  });
  return { success: true, data: { _id: result._id } };
}

async function updateCategory(categoryId, name) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  if (!name || !name.trim()) return { success: false, error: '名称不能为空' };
  await db.collection('categories').doc(categoryId).update({ data: { name: name.trim() } });
  return { success: true };
}

async function moveCategory(categoryId, direction) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  const all = await db.collection('categories').orderBy('sort', 'asc').get();
  const idx = all.data.findIndex(c => c._id === categoryId);
  if (idx < 0) return { success: false, error: '分类不存在' };

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= all.data.length) {
    return { success: true }; // 已在边界
  }

  // 交换 sort 值
  const a = all.data[idx];
  const b = all.data[targetIdx];
  await db.collection('categories').doc(a._id).update({ data: { sort: b.sort } });
  await db.collection('categories').doc(b._id).update({ data: { sort: a.sort } });
  return { success: true };
}

async function deleteCategory(categoryId) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  const products = await db.collection('products').where({ categoryId }).limit(1).get();
  if (products.data.length > 0) {
    return { success: false, error: '该分类下还有商品，请先删除或移走商品' };
  }
  await db.collection('categories').doc(categoryId).remove();
  return { success: true };
}
