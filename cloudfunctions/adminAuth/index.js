// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const ADMIN_PWD = 'tf123456';

exports.main = async (event) => {
  const { password } = event;
  if (!password) return { success: false, message: '请输入密码' };

  if (password === ADMIN_PWD) return { success: true, message: '验证成功' };
  return { success: false, message: '密码错误' };
};
