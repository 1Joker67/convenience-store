// utils/auth.js — 登录态管理

const app = getApp();

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  return !!(app.globalData.userId && app.globalData.userInfo);
}

/**
 * 执行微信授权登录
 * 如果已有缓存登录态，直接返回
 */
async function login() {
  if (isLoggedIn()) {
    return {
      userInfo: app.globalData.userInfo,
      openid: app.globalData.userId
    };
  }

  try {
    const result = await app.wxLogin();
    return result;
  } catch (err) {
    console.error('登录失败:', err);
    throw err;
  }
}

/**
 * 检查管理员登录状态
 */
function isAdminLoggedIn() {
  return app.globalData.adminLoggedIn;
}

/**
 * 管理员登录
 */
async function adminLogin(password) {
  const api = require('./api.js');
  const result = await api.adminAuth(password);
  if (result.success) {
    app.setAdmin(true);
  }
  return result;
}

/**
 * 退出管理员
 */
function adminLogout() {
  app.logoutAdmin();
}

module.exports = {
  isLoggedIn,
  login,
  isAdminLoggedIn,
  adminLogin,
  adminLogout
};
