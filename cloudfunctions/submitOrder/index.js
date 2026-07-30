// cloudfunctions/submitOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { order } = event;

  if (!order || !order.items || order.items.length === 0) {
    return { success: false, error: '订单数据为空' };
  }
  try {
    // 获取用户信息
    const userRes = await db.collection('users').where({ openid: OPENID }).get();
    const nickInfo = userRes.data.length > 0
      ? { nickName: userRes.data[0].nickName, avatarUrl: userRes.data[0].avatarUrl }
      : { nickName: '匿名用户', avatarUrl: '' };

    // 创建订单
    const orderData = {
      userId: OPENID,
      userInfo: nickInfo,
      items: order.items,
      totalAmount: Number(order.totalAmount),
      address: order.address || '',
      phone: order.phone || '',
      remark: order.remark || '',
      status: 'pending',
      payTransactionId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('orders').add({ data: orderData });
    return { success: true, orderId: result._id, message: '下单成功' };
  } catch (err) {
    console.error('submitOrder error:', err);
    return { success: false, error: err.message };
  }
};
