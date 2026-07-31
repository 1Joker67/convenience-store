// cloudfunctions/getProducts/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { categoryId, keyword } = event;
  console.log('getProducts 入参:', JSON.stringify(event));

  try {
    const condition = { status: 'on' };
    if (categoryId) condition.categoryId = categoryId;
    if (keyword) condition.name = db.RegExp({ regexp: keyword, options: 'i' });
    console.log('查询条件:', JSON.stringify(condition));

    const result = await db.collection('products')
      .where(condition)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    console.log('查询结果数量:', result.data.length);
    return { success: true, data: result.data };
  } catch (err) {
    console.error('getProducts error:', err.message, err.stack);
    return { success: false, error: err.message, data: [] };
  }
};
