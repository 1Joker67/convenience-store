// cloudfunctions/adminAuth/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function getStoredPassword() {
  try {
    const res = await db.collection('settings').where({ key: 'admin_password' }).get();
    if (res.data.length > 0 && res.data[0].value) return res.data[0].value;
  } catch (e) {}
  return 'tf123456';
}

// 获取当前管理员会话
async function getAdminSession() {
  try {
    const res = await db.collection('settings').where({ key: 'admin_session' }).get();
    if (res.data.length > 0) return res.data[0].value || {};
  } catch (e) {}
  return {};
}

// 保存管理员会话
async function saveAdminSession(openid) {
  const res = await db.collection('settings').where({ key: 'admin_session' }).get();
  if (res.data.length > 0) {
    await db.collection('settings').doc(res.data[0]._id).update({
      data: { value: { openid, loginTime: new Date().toISOString() }, updatedAt: new Date().toISOString() }
    });
  } else {
    await db.collection('settings').add({
      data: { key: 'admin_session', value: { openid, loginTime: new Date().toISOString() }, createdAt: new Date().toISOString() }
    });
  }
}

// 清除管理员会话
async function clearAdminSession() {
  try {
    const res = await db.collection('settings').where({ key: 'admin_session' }).get();
    if (res.data.length > 0) {
      await db.collection('settings').doc(res.data[0]._id).remove();
    }
  } catch (e) {}
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

        // 检查是否已有其他管理员在线
        const session = await getAdminSession();
        if (session.openid && session.openid !== OPENID) {
          return { success: false, message: '管理员已在其他地方登录，请稍后再试' };
        }

        // 设置会话
        await saveAdminSession(OPENID);
        await promoteToAdmin(OPENID);
        return { success: true, message: '验证成功' };
      }

      case 'logout': {
        const session = await getAdminSession();
        if (session.openid === OPENID) {
          await clearAdminSession();
        }
        return { success: true, message: '已退出' };
      }

      case 'changePassword': {
        if (!password || !newPassword) return { success: false, message: '请填写旧密码和新密码' };
        if (newPassword.length < 6) return { success: false, message: '新密码至少6位' };
        const stored = await getStoredPassword();
        if (password !== stored) return { success: false, message: '旧密码错误' };

        // 保存新密码到 settings
        const pwRes = await db.collection('settings').where({ key: 'admin_password' }).get();
        if (pwRes.data.length > 0) {
          await db.collection('settings').doc(pwRes.data[0]._id).update({
            data: { value: newPassword, updatedAt: new Date().toISOString() }
          });
        } else {
          await db.collection('settings').add({
            data: { key: 'admin_password', value: newPassword, createdAt: new Date().toISOString() }
          });
        }
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
