// cloudfunctions/cleanupOrders/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const DEFAULT_DAYS = 30;

exports.main = async () => {
  try {
    // 读取保留天数设置
    let days = DEFAULT_DAYS;
    try {
      const res = await db.collection('settings').where({ key: 'order_retention_days' }).get();
      if (res.data.length > 0 && res.data[0].value) {
        days = parseInt(res.data[0].value) || DEFAULT_DAYS;
      }
    } catch (e) { /* 设置不存在用默认值 */ }

    // 计算截止日期
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // 删除过期订单（pending 状态的保留，避免误删未处理订单）
    const result = await db.collection('orders')
      .where({
        status: db.command.in(['paid', 'cancelled']),
        createdAt: db.command.lt(cutoff.toISOString())
      })
      .get();

    let deleted = 0;
    for (const order of result.data) {
      try {
        await db.collection('orders').doc(order._id).remove();
        deleted++;
      } catch (e) { /* 单条失败继续 */ }
    }

    return { success: true, deleted, total: result.data.length, cutoff: cutoff.toISOString(), retentionDays: days };
  } catch (err) {
    return { success: false, error: err.message, deleted: 0 };
  }
};
