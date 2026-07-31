// cloudfunctions/getOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { status, pageSize = 50, page = 1 } = event;
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeSize = Math.min(Math.max(1, parseInt(pageSize) || 50), 50);

  try {
    const condition = {};
    // 默认只查自己的订单；管理员页面通过密码登录后，前端传 all=true
    if (!event.all) condition.userId = OPENID;
    if (status) condition.status = status;

    const skip = (safePage - 1) * safeSize;
    const query = db.collection('orders');
    const result = Object.keys(condition).length > 0
      ? await query.where(condition).orderBy('createdAt', 'desc').skip(skip).limit(safeSize).get()
      : await query.orderBy('createdAt', 'desc').skip(skip).limit(safeSize).get();

    return { success: true, data: result.data };
  } catch (err) {
    console.error('getOrders error:', err);
    return { success: false, error: err.message, data: [] };
  }
};
