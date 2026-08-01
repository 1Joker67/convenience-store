// pages/orders/orders.js — 订单列表
const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');

Page({
  onShareAppMessage() {
    return { title: '便利店下单，轻松选购', path: '/pages/index/index' };
  },
  data: {
    orders: [],
    loading: true,
    statusFilter: '',
    statusOptions: [
      { value: '', label: '全部' },
      { value: 'pending', label: '待支付' },
      { value: 'paid', label: '已支付' },
      { value: 'cancelled', label: '已取消' }
    ]
  },

  onShow() {
    this.loadOrders();
    wx.cloud.callFunction({ name: 'cleanupOrders' }).catch(() => {});
  },

  async loadOrders() {
    try {
      this.setData({ loading: true });
      if (!auth.isLoggedIn()) { await auth.login(); }
      const params = {};
      if (this.data.statusFilter) { params.status = this.data.statusFilter; }
      const result = await api.getOrders(params);
      this.setData({ orders: result.data || [], loading: false });
    } catch (err) { this.setData({ loading: false }); }
  },

  onFilterTap(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => this.loadOrders());
  },

  onOrderTap(e) {
    const order = e.currentTarget.dataset.order;
    let d = '下单时间：' + (order.createdAt || '未知') + '\n';
    d += '状态：' + this.st(order.status) + '\n';
    d += '地址：' + order.address + '\n电话：' + order.phone + '\n';
    d += '备注：' + (order.remark || '无') + '\n----------\n';
    order.items.forEach(i => { d += i.name + ' ×' + i.quantity + ' ¥' + i.price + '\n'; });
    d += '合计：¥' + order.totalAmount;
    wx.showModal({ title: '订单详情', content: d, showCancel: false, confirmText: '关闭' });
  },

  st(s) { return { pending: '待支付', paid: '已支付', cancelled: '已取消' }[s] || s; }
});
