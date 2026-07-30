// cloudfunctions/getOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { status, isAdmin, pageSize = 50, page = 1 } = event;
  try {
    // 构建查询条件（合并到单个 where 对象中）
    const condition = {};
    if (!isAdmin) condition.userId = OPENID;
    if (status) condition.status = status;

    const skip = (page - 1) * pageSize;
    const query = db.collection('orders');

    // 如果无条件则查全部，否则加 where
    const result = Object.keys(condition).length > 0
      ? await query.where(condition).orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get()
      : await query.orderBy('createdAt', 'desc').skip(skip).limit(pageSize).get();

    return { success: true, data: result.data };
  } catch (err) {
    console.error('getOrders error:', err);
    return { success: false, error: err.message, data: [] };
  }
};
