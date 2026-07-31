// pages/admin/orders/orders.js — 管理端订单管理
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    orders: [],
    loading: true,
    statusFilter: ''
  },

  onShow() {
    if (!auth.isAdminLoggedIn()) {
      wx.switchTab({ url: '/pages/admin/login/login' });
      return;
    }
    this.loadOrders();
  },

  async loadOrders() {
    try {
      this.setData({ loading: true });
      const params = { all: true };
      if (this.data.statusFilter) params.status = this.data.statusFilter;
      const result = await api.getOrders(params);
      this.setData({ orders: result.data || [], loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  onFilterTap(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => this.loadOrders());
  },

  // 顶部导航切换
  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'products') wx.redirectTo({ url: '/pages/admin/products/products' });
    else if (page === 'categories') wx.redirectTo({ url: '/pages/admin/categories/categories' });
    else if (page === 'settings') wx.redirectTo({ url: '/pages/admin/settings/settings' });
  },

  onOrderTap(e) {
    const order = e.currentTarget.dataset.order;
    let d = `用户：${order.userInfo?.nickName || '未知'}\n`;
    d += `电话：${order.phone}\n地址：${order.address}\n`;
    d += `备注：${order.remark || '无'}\n`;
    d += `时间：${order.createdAt}\n状态：${this.st(order.status)}\n---\n`;
    order.items.forEach(i => { d += `${i.name} ×${i.quantity} ¥${i.price}\n`; });
    d += `合计：¥${order.totalAmount}`;
    wx.showModal({ title: '订单详情', content: d, showCancel: false, confirmText: '关闭' });
  },

  st(s) { return { pending: '待支付', paid: '已支付', cancelled: '已取消' }[s] || s; },

  onLogout() {
    wx.showModal({
      title: '退出管理', content: '确定退出吗？',
      success: (res) => { if (res.confirm) { auth.adminLogout(); wx.switchTab({ url: '/pages/admin/login/login' }); } }
    });
  }
});
