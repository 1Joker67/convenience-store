// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const ADMIN_PASSWORD = 'tf123456';

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { password } = event;

  if (!password) {
    return { success: false, error: '请输入密码' };
  }

  // 密码正确
  if (password === ADMIN_PASSWORD) {
    // 将该用户设为管理员
    try {
      const userRes = await db.collection('users').where({ openid: OPENID }).get();
      if (userRes.data.length > 0) {
        await db.collection('users').doc(userRes.data[0]._id).update({
          data: { role: 'admin', updatedAt: new Date().toISOString() }
        });
      } else {
        await db.collection('users').add({
          data: { openid: OPENID, role: 'admin', nickName: '管理员', avatarUrl: '', createdAt: new Date().toISOString() }
        });
      }
      return { success: true, message: '验证成功' };
    } catch (err) {
      // 即使更新角色失败，密码正确也允许登录
      return { success: true, message: '验证成功' };
    }
  }

  // 密码不匹配
  return { success: false, message: '密码错误' };
};
