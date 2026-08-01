// utils/auth.js — 登录态管理

function isLoggedIn() {
  return !!(getApp().globalData.userId);
}

async function login() {
  if (isLoggedIn()) {
    const app = getApp();
    return {
      userInfo: app.globalData.userInfo,
      openid: app.globalData.userId
    };
  }

  try {
    return await getApp().silentLogin();
  } catch (err) {
    console.error('登录失败:', err);
    throw err;
  }
}

function isAdminLoggedIn() {
  return getApp().globalData.adminLoggedIn;
}

async function adminLogin(password) {
  const api = require('./api.js');
  const result = await api.adminAuth(password);  // api.adminAuth 内部已传 action:'login'
  if (result.success) {
    getApp().setAdmin(true);
  }
  return result;
}

async function adminLogout() {
  try { await wx.cloud.callFunction({ name: 'adminAuth', data: { action: 'logout' } }); } catch (e) {}
  getApp().logoutAdmin();
}

module.exports = {
  isLoggedIn,
  login,
  isAdminLoggedIn,
  adminLogin,
  adminLogout
};
