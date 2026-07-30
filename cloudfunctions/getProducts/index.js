// cloudfunctions/getProducts/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event) => {
  const { categoryId, keyword, pageSize = 50, page = 1 } = event;
  try {
    // 构建查询条件（不能链式 .where()，需合并到一个对象）
    const condition = { status: 'on' };
    if (categoryId) condition.categoryId = categoryId;
    if (keyword) condition.name = db.RegExp({ regexp: keyword, options: 'i' });

    const skip = (page - 1) * pageSize;
    const result = await db.collection('products')
      .where(condition)
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    return { success: true, data: result.data };
  } catch (err) {
    console.error('getProducts error:', err);
    return { success: false, error: err.message, data: [] };
  }
};
