// cloudfunctions/getOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function isAdmin(openid) {
  try {
    const res = await db.collection('users').where({ openid }).get();
    return res.data.length > 0 && res.data[0].role === 'admin';
  } catch (err) { return false; }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { status, pageSize = 50, page = 1, all } = event;
  const safePage = Math.max(1, parseInt(page) || 1);
  const safeSize = Math.min(Math.max(1, parseInt(pageSize) || 50), 50);

  try {
    // 查看全部订单需要管理员权限
    if (all && !(await isAdmin(OPENID))) {
      return { success: false, error: '无操作权限', data: [] };
    }

    const condition = {};
    if (!all || !(await isAdmin(OPENID))) condition.userId = OPENID;
    if (status) condition.status = status;

    const skip = (safePage - 1) * safeSize;
    const query = db.collection('orders');
    const result = Object.keys(condition).length > 0
      ? await query.where(condition).orderBy('createdAt', 'desc').skip(skip).limit(safeSize).get()
      : await query.orderBy('createdAt', 'desc').skip(skip).limit(safeSize).get();

    return { success: true, data: result.data };
  } catch (err) {
    console.error('getOrders error:', err);
    return { success: false, error: '内部错误', data: [] };
  }
};
