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
  const result = await api.adminAuth(password);
  if (result.success) {
    getApp().setAdmin(true);
  }
  return result;
}

function adminLogout() {
  getApp().logoutAdmin();
}

module.exports = {
  isLoggedIn,
  login,
  isAdminLoggedIn,
  adminLogin,
  adminLogout
};
