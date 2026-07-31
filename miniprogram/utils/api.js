// utils/api.js — 云函数调用封装

/**
 * 调用云函数
 * @param {string} name 云函数名称
 * @param {object} data 参数
 */
async function callFunction(name, data = {}) {
  try {
    wx.showLoading({ title: '加载中...', mask: true });
    const res = await wx.cloud.callFunction({ name, data });
    wx.hideLoading();
    return res.result;
  } catch (err) {
    wx.hideLoading();
    console.error(`云函数 [${name}] 调用失败:`, err);
    wx.showToast({ title: '请求失败，请重试', icon: 'none' });
    throw err;
  }
}

/**
 * 获取商品列表
 * @param {object} params { categoryId, keyword, pageSize, page }
 */
function getProducts(params = {}) {
  return callFunction('getProducts', params);
}

/**
 * 提交订单
 * @param {object} orderData
 */
function submitOrder(orderData) {
  return callFunction('submitOrder', { order: orderData });
}

/**
 * 获取订单列表
 * @param {object} params { status, isAdmin, pageSize, page }
 */
function getOrders(params = {}) {
  return callFunction('getOrders', params);
}

/**
 * 管理员认证
 * @param {string} password
 */
function adminAuth(password) {
  return callFunction('adminAuth', { action: 'login', password });
}

function changePassword(password, newPassword) {
  return callFunction('adminAuth', { action: 'changePassword', password, newPassword });
}

/**
 * 管理商品
 * @param {string} action add | update | delete | list
 * @param {object} data
 */
function manageProduct(action, data = {}) {
  return callFunction('manageProduct', { action, ...data });
}

/**
 * 管理分类
 * @param {string} action add | update | delete | list
 * @param {object} data
 */
function manageCategory(action, data = {}) {
  return callFunction('manageCategory', { action, ...data });
}

// 管理设置
function manageSettings(action, key, value) {
  return callFunction('manageSettings', { action, key, value });
}
// 获取设置（公告、服务时间）
function getSettings() {
  return callFunction('manageSettings', { action: 'get' });
}

// 清理过期订单
function cleanupOrders() {
  return callFunction('cleanupOrders', {});
}

module.exports = {
  callFunction,
  getProducts,
  submitOrder,
  getOrders,
  adminAuth,
  changePassword,
  manageProduct,
  manageCategory,
  manageSettings,
  getSettings,
  cleanupOrders
};
