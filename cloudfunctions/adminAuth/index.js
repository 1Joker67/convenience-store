// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { password } = event;

  if (!password) {
    return { success: false, error: '请输入密码' };
  }

  try {
    // 从 admin_config 获取管理密码
    const res = await db.collection('admin_config')
      .where({ key: 'admin_password' })
      .get();

    if (res.data.length === 0) {
      // 首次使用，初始化默认密码
      await db.collection('admin_config').add({
        data: {
          key: 'admin_password',
          value: 'tf123456',
          createdAt: new Date().toISOString()
        }
      });
      return {
        success: password === 'tf123456',
        message: password === 'tf123456' ? '验证成功' : '密码错误'
      };
    }

    const storedPassword = res.data[0].value;
    return {
      success: password === storedPassword,
      message: password === storedPassword ? '验证成功' : '密码错误'
    };
  } catch (err) {
    console.error('adminAuth error:', err);
    return { success: false, error: err.message };
  }
};
