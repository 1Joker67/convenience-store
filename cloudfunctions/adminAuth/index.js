// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { password } = event;

  if (!password) {
    return { success: false, error: '请输入密码' };
  }

  try {
    const res = await db.collection('admin_config')
      .where({ key: 'admin_password' })
      .get();

    if (res.data.length === 0) {
      // 密码未初始化，需要由已有管理员在数据库中手动设置
      return { success: false, error: '管理密码未配置，请在云开发控制台 admin_config 集合中设置' };
    }

    const stored = res.data[0].value;
    return {
      success: password === stored,
      message: password === stored ? '验证成功' : '密码错误'
    };
  } catch (err) {
    console.error('adminAuth error:', err);
    return { success: false, error: err.message };
  }
};
