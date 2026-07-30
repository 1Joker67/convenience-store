// cloudfunctions/payCallback/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  // 微信支付回调参数
  const { return_code, out_trade_no, transaction_id } = event;

  try {
    // 安全校验：仅处理来自微信支付的成功通知
    // 生产环境需增加签名验证，验证请求确实来自微信服务器
    if (return_code !== 'SUCCESS') {
      return { success: false, error: '支付未成功' };
    }

    if (!out_trade_no) {
      return { success: false, error: '缺少订单号' };
    }

    // 更新订单状态（仅 pending → paid）
    const orderRes = await db.collection('orders').doc(out_trade_no).get();
    if (!orderRes.data || orderRes.data.status !== 'pending') {
      return { success: false, error: '订单状态异常，无法更新' };
    }

    await db.collection('orders').doc(out_trade_no).update({
      data: {
        status: 'paid',
        payTransactionId: transaction_id || '',
        updatedAt: new Date().toISOString()
      }
    });

    return { success: true, message: 'ok' };
  } catch (err) {
    console.error('payCallback error:', err);
    return { success: false, error: err.message };
  }
};
