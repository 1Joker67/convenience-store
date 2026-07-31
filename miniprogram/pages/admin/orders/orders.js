// pages/admin/orders/orders.js — 管理端订单管理
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    orders: [], loading: true,
    statusFilter: '',
    newOrderCount: 0,       // 未读新订单数
    lastCheckTime: '',      // 上次刷新时间
    pollTimer: null         // 轮询定时器
  },

  onShow() {
    if (!auth.isAdminLoggedIn()) { wx.switchTab({ url: '/pages/admin/login/login' }); return; }
    this.loadOrders();
    this.startPolling();
  },

  onHide() {
    this.stopPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  startPolling() {
    this.stopPolling();
    // 每 30 秒自动刷新
    const timer = setInterval(() => {
      this.checkNewOrders();
    }, 30000);
    this.data.pollTimer = timer;
  },

  stopPolling() {
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
      this.data.pollTimer = null;
    }
  },

  // 静默检查新订单
  async checkNewOrders() {
    try {
      const result = await api.getOrders({ all: true, pageSize: 5 });
      if (result.success && result.data) {
        const newOrders = result.data.filter(o => {
          if (!this.data.lastCheckTime) return true;
          return new Date(o.createdAt) > new Date(this.data.lastCheckTime);
        });
        if (newOrders.length > 0) {
          this.setData({ newOrderCount: this.data.newOrderCount + newOrders.length });
          wx.showToast({ title: '有' + newOrders.length + '笔新订单', icon: 'none', duration: 2000 });
        }
      }
    } catch (err) { /* 静默 */ }
  },

  // 完整加载
  async loadOrders() {
    try {
      this.setData({ loading: true, newOrderCount: 0, lastCheckTime: new Date().toISOString() });
      const result = await api.getOrders({ all: true, status: this.data.statusFilter || undefined });
      this.setData({ orders: result.data || [], loading: false });
    } catch (err) { this.setData({ loading: false }); }
  },

  // 订阅新订单消息推送
  onSubscribe() {
    // 模板 ID 需在微信公众平台「订阅消息」中申请，填入下方
    const TEMPLATE_ID = ''; // TODO: 填入你的订阅消息模板ID
    if (!TEMPLATE_ID) {
      wx.showToast({ title: '请先在公众平台配置订阅消息模板', icon: 'none' });
      return;
    }
    wx.requestSubscribeMessage({
      tmplIds: [TEMPLATE_ID],
      success: (res) => {
        if (res[TEMPLATE_ID] === 'accept') {
          // 保存订阅状态到云数据库
          wx.cloud.callFunction({
            name: 'manageSettings',
            data: { action: 'update', key: 'admin_subscribe', value: { templateId: TEMPLATE_ID, subscribed: true } }
          });
          wx.showToast({ title: '订阅成功，有新订单将通知你', icon: 'success' });
        }
      },
      fail: (err) => {
        if (err.errCode === 20004) {
          wx.showToast({ title: '你关闭了订阅消息，可在设置中开启', icon: 'none' });
        }
      }
    });
  },

  onFilterTap(e) {
    const s = e.currentTarget.dataset.status;
    this.setData({ statusFilter: s }, () => this.loadOrders());
  },

  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'products') wx.redirectTo({ url: '/pages/admin/products/products' });
    else if (page === 'categories') wx.redirectTo({ url: '/pages/admin/categories/categories' });
    else if (page === 'settings') wx.redirectTo({ url: '/pages/admin/settings/settings' });
  },

  onOrderTap(e) {
    const order = e.currentTarget.dataset.order;
    let d = '用户：' + (order.userInfo?.nickName || '未知') + '\n';
    d += '电话：' + order.phone + '\n地址：' + order.address + '\n';
    d += '备注：' + (order.remark || '无') + '\n';
    d += '时间：' + order.createdAt + '\n状态：' + this.st(order.status) + '\n---\n';
    order.items.forEach(i => { d += i.name + ' ×' + i.quantity + ' ¥' + i.price + '\n'; });
    d += '合计：¥' + order.totalAmount;
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
