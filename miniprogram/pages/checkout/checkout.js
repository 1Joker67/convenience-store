// pages/checkout/checkout.js — 下单结算
const cart = require('../../utils/cart.js');
const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    cartList: [], totalAmount: 0,
    name: '', address: '', phone: '', remark: '',
    submitting: false
  },

  onLoad() {
    this.setData({
      cartList: cart.getCart(),
      totalAmount: cart.getTotalAmount().toFixed(2)
    });
    if (cart.getCart().length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
    }
    this.checkServiceTime();
  },

  // 被地址页回调
  setAddress(addr) {
    this.setData({ name: addr.name || '', phone: addr.phone || '', address: addr.address || '' });
  },

  // 选择地址
  onChooseAddress() {
    wx.navigateTo({ url: '/pages/address/address' });
  },

  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

  // 服务时间
  async checkServiceTime() {
    try {
      const result = await api.getSettings();
      if (result.success && result.data) {
        const st = result.data.service_time || {};
        if (st.enabled) {
          const now = new Date();
          const cur = now.getHours() * 60 + now.getMinutes();
          const s = parseInt(st.start) * 60 + parseInt(st.start.split(':')[1] || 0);
          const e = parseInt(st.end) * 60 + parseInt(st.end.split(':')[1] || 0);
          const ok = (s <= e) ? (cur >= s && cur <= e) : (cur >= s || cur <= e);
          if (!ok) {
            wx.showModal({ title: '不在服务时间', content: '服务时间 ' + st.start + '-' + st.end, showCancel: false, success: () => wx.navigateBack() });
          }
        }
      }
    } catch (err) {}
  },

  // 提交
  async onSubmit() {
    const { address, phone, cartList, totalAmount, remark, name } = this.data;
    if (!address.trim()) { wx.showToast({ title: '请选择收货地址', icon: 'none' }); return; }
    if (!phone.trim()) { wx.showToast({ title: '请选择收货地址', icon: 'none' }); return; }
    if (!/^1\d{10}$/.test(phone.trim())) { wx.showToast({ title: '手机号格式不对', icon: 'none' }); return; }
    if (cartList.length === 0) return;
    if (parseFloat(totalAmount) < 20) {
      wx.showToast({ title: '满20元起送', icon: 'none' }); return;
    }

    this.setData({ submitting: true });
    try {
      await auth.login();
      const result = await api.submitOrder({
        items: cartList.map(i => ({ productId: i._id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        totalAmount: parseFloat(totalAmount),
        address: (name ? name + '，' : '') + address.trim(),
        phone: phone.trim(), remark: remark.trim()
      });
      if (!result.success) { wx.showToast({ title: result.error || '下单失败', icon: 'none' }); return; }

      cart.clearCart();
      wx.showToast({ title: '下单成功', icon: 'success', duration: 1500,
        success: () => setTimeout(() => wx.switchTab({ url: '/pages/orders/orders' }), 1500) });
    } catch (err) {
      const msg = err.errMsg || err.message || '';
      wx.showToast({ title: msg.includes('cancel') || msg.includes('deny') ? '请先授权登录' : '下单失败', icon: 'none' });
    } finally { this.setData({ submitting: false }); }
  }
});
