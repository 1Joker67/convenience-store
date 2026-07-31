// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { password } = event;

  if (!password) return { success: false, message: '请输入密码' };

  try {
    // 从数据库读取管理密码
    const res = await db.collection('admin_config')
      .where({ key: 'admin_password' })
      .get();

    if (res.data.length === 0) {
      return { success: false, message: '管理密码未配置' };
    }

    const stored = res.data[0].value;
    if (password !== stored) {
      return { success: false, message: '密码错误' };
    }

    // 将该用户设为管理员
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
    console.error('adminAuth error:', err);
    return { success: false, message: '验证失败' };
  }
};
