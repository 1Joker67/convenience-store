// cloudfunctions/manageCategory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { action, categoryId, name, sort } = event;

  try {
    switch (action) {
      case 'list':
        return await listCategories();
      case 'add':
        return await addCategory({ name, sort });
      case 'update':
        return await updateCategory(categoryId, { name, sort });
      case 'delete':
        return await deleteCategory(categoryId);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageCategory error:', err);
    return { success: false, error: err.message };
  }
};

// 获取全部分类
async function listCategories() {
  const result = await db.collection('categories')
    .orderBy('sort', 'asc')
    .limit(100)
    .get();
  return { success: true, data: result.data };
}

// 添加分类
async function addCategory(data) {
  if (!data.name) {
    return { success: false, error: '分类名称不能为空' };
  }
  const result = await db.collection('categories').add({
    data: {
      name: data.name,
      sort: data.sort || 0,
      createdAt: new Date().toISOString()
    }
  });
  return { success: true, data: { _id: result._id } };
}

// 更新分类
async function updateCategory(categoryId, data) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.sort !== undefined) updateData.sort = data.sort;

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: '没有要更新的字段' };
  }

  await db.collection('categories').doc(categoryId).update({ data: updateData });
  return { success: true };
}

// 删除分类
async function deleteCategory(categoryId) {
  if (!categoryId) return { success: false, error: '缺少分类ID' };
  await db.collection('categories').doc(categoryId).remove();
  return { success: true };
}
