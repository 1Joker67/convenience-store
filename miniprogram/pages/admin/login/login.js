// pages/admin/login/login.js — 管理端登录
const auth = require('../../../utils/auth.js');

Page({
  data: { password: '', loading: false, errorMsg: '' },

  onShow() {
    if (auth.isAdminLoggedIn()) {
      wx.redirectTo({ url: '/pages/admin/orders/orders' });
    }
  },

  onInput(e) { this.setData({ password: e.detail.value, errorMsg: '' }); },

  async onLogin() {
    const password = this.data.password.trim();
    if (!password) { this.setData({ errorMsg: '请输入管理密码' }); return; }
    try {
      this.setData({ loading: true, errorMsg: '' });
      const result = await auth.adminLogin(password);
      if (result.success) {
        wx.showToast({ title: '验证成功', icon: 'success' });
        wx.redirectTo({ url: '/pages/admin/orders/orders' });
      } else {
        this.setData({ errorMsg: result.message || '密码错误' });
      }
    } catch (err) {
      this.setData({ errorMsg: '验证失败，请重试' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
