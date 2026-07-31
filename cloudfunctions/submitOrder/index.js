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
    // 服务端重新计算价格 + 检查库存
    let computedTotal = 0;
    const validatedItems = [];
    const stockUpdates = []; // 待扣减库存记录

    for (const item of order.items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return { success: false, error: '商品参数错误' };
      }
      const prodRes = await db.collection('products').doc(item.productId).get();
      if (!prodRes.data || prodRes.data.status !== 'on') {
        return { success: false, error: '商品「' + (item.name || item.productId) + '」已下架或不存在' };
      }

      const stock = prodRes.data.stock !== undefined ? prodRes.data.stock : 999;
      const qty = Math.min(parseInt(item.quantity) || 1, 999);
      if (stock < qty) {
        return { success: false, error: '「' + prodRes.data.name + '」库存不足，仅剩' + stock + '件' };
      }

      const realPrice = prodRes.data.price;
      validatedItems.push({
        productId: item.productId,
        name: prodRes.data.name,
        price: realPrice,
        quantity: qty,
        image: prodRes.data.image || ''
      });
      computedTotal += realPrice * qty;
      stockUpdates.push({ id: item.productId, newStock: stock - qty });
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

    // 扣减库存
    for (const s of stockUpdates) {
      try {
        await db.collection('products').doc(s.id).update({
          data: { stock: s.newStock, updatedAt: new Date().toISOString() }
        });
      } catch (e) { /* 不影响下单 */ }
    }

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

    // 尝试发送订阅消息通知管理员
    try {
      const settingsRes = await db.collection('settings').where({ key: 'admin_subscribe' }).get();
      if (settingsRes.data.length > 0 && settingsRes.data[0].value && settingsRes.data[0].value.subscribed) {
        const adminRes = await db.collection('users').where({ role: 'admin' }).get();
        for (const admin of adminRes.data) {
          try {
            await cloud.openapi.subscribeMessage.send({
              touser: admin.openid,
              templateId: settingsRes.data[0].value.templateId,
              data: {
                thing1: { value: (validatedItems[0]?.name || '商品') + '等' + validatedItems.length + '件' },
                amount2: { value: '¥' + computedTotal },
                thing3: { value: String(order.address || '').slice(0, 20) },
                phrase4: { value: '待处理' }
              },
              page: 'pages/admin/orders/orders'
            });
          } catch (e) { /* 发送失败不阻塞下单 */ }
        }
      }
    } catch (e) { /* 通知失败不阻塞下单 */ }

    return { success: true, orderId: result._id, totalAmount: computedTotal, message: '下单成功' };
  } catch (err) {
    console.error('submitOrder error:', err);
    return { success: false, error: '下单失败' };
  }
};
