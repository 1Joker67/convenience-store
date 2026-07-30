// cloudfunctions/payCallback/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { return_code, out_trade_no, transaction_id } = event;

  try {
    if (return_code === 'SUCCESS') {
      // 支付成功，更新订单状态
      await db.collection('orders').doc(out_trade_no).update({
        data: {
          status: 'paid',
          payTransactionId: transaction_id || '',
          updatedAt: new Date().toISOString()
        }
      });

      // 发送订阅消息通知店主（需提前配置模板）
      // 此处预留通知逻辑

      return { success: true, message: '支付成功' };
    } else {
      return { success: false, message: '支付失败' };
    }
  } catch (err) {
    console.error('payCallback error:', err);
    return { success: false, error: err.message };
  }
};
