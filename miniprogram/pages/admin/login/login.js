// pages/admin/login/login.js — 管理端登录
const auth = require('../../../utils/auth.js');

Page({
  data: {
    password: '',
    loading: false,
    errorMsg: ''
  },

  onShow() {
    // 如果已登录，直接跳转订单管理
    if (auth.isAdminLoggedIn()) {
      wx.redirectTo({ url: '/pages/admin/orders/orders' });
    }
  },

  // 输入密码
  onInput(e) {
    this.setData({ password: e.detail.value, errorMsg: '' });
  },

  // 登录验证
  async onLogin() {
    const password = this.data.password.trim();
    if (!password) {
      this.setData({ errorMsg: '请输入管理密码' });
      return;
    }

    try {
      this.setData({ loading: true, errorMsg: '' });
      const result = await auth.adminLogin(password);

      if (result.success) {
        wx.showToast({ title: '验证成功', icon: 'success' });
        wx.redirectTo({ url: '/pages/admin/orders/orders' });
      } else {
        this.setData({ errorMsg: '密码错误' });
      }
    } catch (err) {
      this.setData({ errorMsg: '验证失败，请重试' });
    } finally {
      this.setData({ loading: false });
    }
  }
});
