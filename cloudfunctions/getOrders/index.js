// cloudfunctions/getOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 检查当前用户是否为管理员
async function checkAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  return res.data.length > 0 && res.data[0].role === 'admin';
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { status, pageSize = 50, page = 1 } = event;
  const safePage = Math.max(1, page);
  const safeSize = Math.min(pageSize, 50);

  try {
    const isAdmin = await checkAdmin(OPENID);

    const condition = {};
    if (!isAdmin) condition.userId = OPENID;
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
