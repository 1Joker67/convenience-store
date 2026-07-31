// cloudfunctions/submitOrder/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const MIN_AMOUNT = 20;

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { order } = event;

  if (!order || !order.items || order.items.length === 0) {
    return { success: false, error: '订单数据为空' };
  }
  try {
    // 服务端重新计算价格：逐项查商品表
    let computedTotal = 0;
    const validatedItems = [];
    for (const item of order.items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return { success: false, error: '商品参数错误' };
      }
      const prodRes = await db.collection('products').doc(item.productId).get();
      if (!prodRes.data || prodRes.data.status !== 'on') {
        return { success: false, error: '商品「' + (item.name || item.productId) + '」已下架或不存在' };
      }
      const realPrice = prodRes.data.price;
      const qty = Math.min(parseInt(item.quantity) || 1, 999);
      validatedItems.push({
        productId: item.productId,
        name: prodRes.data.name,
        price: realPrice,
        quantity: qty,
        image: prodRes.data.image || ''
      });
      computedTotal += realPrice * qty;
    }

    computedTotal = Math.round(computedTotal * 100) / 100;
    if (computedTotal < MIN_AMOUNT) {
      return { success: false, error: '满' + MIN_AMOUNT + '元起送' };
    }

    // 获取用户信息
    const userRes = await db.collection('users').where({ openid: OPENID }).get();
    const userInfo = userRes.data.length > 0
      ? { nickName: userRes.data[0].nickName, avatarUrl: userRes.data[0].avatarUrl }
      : { nickName: '匿名用户', avatarUrl: '' };

    const result = await db.collection('orders').add({
      data: {
        userId: OPENID,
        userInfo,
        items: validatedItems,
        totalAmount: computedTotal,
        address: String(order.address || '').slice(0, 200),
        phone: String(order.phone || '').slice(0, 20),
        remark: String(order.remark || '').slice(0, 500),
        status: 'pending',
        payTransactionId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    return { success: true, orderId: result._id, totalAmount: computedTotal, message: '下单成功' };
  } catch (err) {
    console.error('submitOrder error:', err);
    return { success: false, error: '下单失败' };
  }
};
