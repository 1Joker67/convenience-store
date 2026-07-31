// pages/admin/login/login.js — 管理端登录
const auth = require('../../../utils/auth.js');

Page({
  data: {
    password: '',
    loading: false,
    errorMsg: '',
    debugInfo: ''  // 调试信息
  },

  onShow() {
    if (auth.isAdminLoggedIn()) {
      wx.redirectTo({ url: '/pages/admin/orders/orders' });
    }
  },

  onInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '', debugInfo: '' });
  },

  async onLogin() {
    const password = this.data.password.trim();
    if (!password) {
      this.setData({ errorMsg: '请输入管理密码' });
      return;
    }

    try {
      this.setData({ loading: true, errorMsg: '', debugInfo: '正在验证...' });

      // 直接调用云函数，绕过 auth 模块
      const res = await wx.cloud.callFunction({
        name: 'adminAuth',
        data: { password }
      });

      const result = res.result;
      this.setData({
        debugInfo: JSON.stringify(result, null, 2)
      });

      if (result.success) {
        getApp().setAdmin(true);
        wx.showToast({ title: '验证成功', icon: 'success' });
        wx.redirectTo({ url: '/pages/admin/orders/orders' });
      } else {
        this.setData({
          errorMsg: result.error || result.message || '密码错误'
        });
      }
    } catch (err) {
      this.setData({
        errorMsg: '调用失败',
        debugInfo: 'catch: ' + (err.message || JSON.stringify(err))
      });
    } finally {
      this.setData({ loading: false });
    }
  }
});
