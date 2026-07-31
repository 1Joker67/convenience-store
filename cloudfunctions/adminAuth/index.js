// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 密码统一存在 settings 集合中，key='admin_password'
async function getStoredPassword() {
  try {
    const res = await db.collection('settings').where({ key: 'admin_password' }).get();
    if (res.data.length > 0 && res.data[0].value) return res.data[0].value;
  } catch (e) {}
  return 'tf123456';
}

async function savePassword(pwd) {
  const res = await db.collection('settings').where({ key: 'admin_password' }).get();
  if (res.data.length > 0) {
    await db.collection('settings').doc(res.data[0]._id).update({
      data: { value: pwd, updatedAt: new Date().toISOString() }
    });
  } else {
    await db.collection('settings').add({
      data: { key: 'admin_password', value: pwd, createdAt: new Date().toISOString() }
    });
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, password, newPassword } = event;

  try {
    switch (action || 'login') {
      case 'login': {
        if (!password) return { success: false, message: '请输入密码' };
        const stored = await getStoredPassword();
        if (password !== stored) return { success: false, message: '密码错误' };
        try { await promoteToAdmin(OPENID); } catch (e) {}
        return { success: true, message: '验证成功' };
      }

      case 'changePassword': {
        if (!password || !newPassword) return { success: false, message: '请填写旧密码和新密码' };
        if (newPassword.length < 6) return { success: false, message: '新密码至少6位' };
        const stored = await getStoredPassword();
        if (password !== stored) return { success: false, message: '旧密码错误' };
        await savePassword(newPassword);
        return { success: true, message: '密码修改成功' };
      }

      default:
        return { success: false, message: '未知操作' };
    }
  } catch (err) {
    return { success: false, message: '操作失败' };
  }
};

async function promoteToAdmin(openid) {
  try {
    const userRes = await db.collection('users').where({ openid }).get();
    if (userRes.data.length > 0) {
      await db.collection('users').doc(userRes.data[0]._id).update({
        data: { role: 'admin', updatedAt: new Date().toISOString() }
      });
    } else {
      await db.collection('users').add({
        data: { openid, role: 'admin', nickName: '管理员', avatarUrl: '', createdAt: new Date().toISOString() }
      });
    }
  } catch (e) {}
}
