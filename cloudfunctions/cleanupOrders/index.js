// cloudfunctions/cleanupOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const DEFAULT_DAYS = 30;

async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (!res.data.length || res.data[0].role !== 'admin') {
    throw new Error('无操作权限');
  }
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();

  try {
    await requireAdmin(OPENID);

    let days = DEFAULT_DAYS;
    try {
      const res = await db.collection('settings').where({ key: 'order_retention_days' }).get();
      if (res.data.length > 0 && res.data[0].value) {
        days = parseInt(res.data[0].value) || DEFAULT_DAYS;
      }
    } catch (e) {}

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await db.collection('orders')
      .where({
        status: db.command.in(['paid', 'cancelled']),
        createdAt: db.command.lt(cutoff.toISOString())
      })
      .get();

    let deleted = 0;
    for (const order of result.data) {
      try { await db.collection('orders').doc(order._id).remove(); deleted++; } catch (e) {}
    }

    return { success: true, deleted, retentionDays: days };
  } catch (err) {
    if (err.message === '无操作权限') return { success: false, error: '无操作权限', deleted: 0 };
    return { success: false, error: '内部错误', deleted: 0 };
  }
};
