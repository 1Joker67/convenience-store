// cloudfunctions/getProducts/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 转义正则特殊字符
function escapeRegex(str) {
  return String(str || '').slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.main = async (event) => {
  const { categoryId, keyword } = event;
  try {
    const condition = { status: 'on' };
    if (categoryId) condition.categoryId = categoryId;
    if (keyword) condition.name = db.RegExp({ regexp: escapeRegex(keyword), options: 'i' });

    const result = await db.collection('products')
      .where(condition).orderBy('createdAt', 'desc').limit(100).get();

    return { success: true, data: result.data };
  } catch (err) {
    console.error('getProducts error:', err);
    return { success: false, error: '内部错误', data: [] };
  }
};
