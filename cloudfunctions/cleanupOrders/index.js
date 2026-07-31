// cloudfunctions/cleanupOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const DEFAULT_DAYS = 30;
const PENDING_MINUTES = 5;

async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (!res.data.length || res.data[0].role !== 'admin') throw new Error('无操作权限');
}

// 取消超时未支付订单（公开调用，无需管理员）
async function cancelExpiredPending() {
  const cutoff = new Date(Date.now() - PENDING_MINUTES * 60 * 1000);
  const res = await db.collection('orders')
    .where({
      status: 'pending',
      createdAt: db.command.lt(cutoff.toISOString())
    })
    .get();

  let cancelled = 0;
  for (const order of res.data) {
    try {
      await db.collection('orders').doc(order._id).update({
        data: { status: 'cancelled', updatedAt: new Date().toISOString() }
      });
      cancelled++;
    } catch (e) {}
  }
  return cancelled;
}

// 删除过期已支付/已取消订单（需管理员）
async function deleteExpiredOrders(days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const res = await db.collection('orders')
    .where({
      status: db.command.in(['paid', 'cancelled']),
      createdAt: db.command.lt(cutoff.toISOString())
    })
    .get();

  let deleted = 0;
  for (const order of res.data) {
    try { await db.collection('orders').doc(order._id).remove(); deleted++; } catch (e) {}
  }
  return deleted;
}

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();

  // 1. 取消超时未支付订单（任何用户触发都执行）
  const cancelled = await cancelExpiredPending();

  // 2. 删除过期订单（需管理员）
  let deleted = 0;
  try {
    await requireAdmin(OPENID);
    let days = DEFAULT_DAYS;
    try {
      const r = await db.collection('settings').where({ key: 'order_retention_days' }).get();
      if (r.data.length > 0 && r.data[0].value) days = parseInt(r.data[0].value) || DEFAULT_DAYS;
    } catch (e) {}
    deleted = await deleteExpiredOrders(days);
  } catch (e) {}

  return { success: true, cancelled, deleted };
};
