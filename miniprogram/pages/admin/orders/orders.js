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
    // 校验管理员登录态
    if (!auth.isAdminLoggedIn()) {
      wx.redirectTo({ url: '/pages/admin/login/login' });
      return;
    }
    this.loadOrders();
  },

  async loadOrders() {
    try {
      this.setData({ loading: true });
      const params = { isAdmin: true };
      if (this.data.statusFilter) {
        params.status = this.data.statusFilter;
      }
      const result = await api.getOrders(params);
      this.setData({
        orders: result.data || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  // 筛选
  onFilterTap(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => {
      this.loadOrders();
    });
  },

  // 查看订单详情
  onOrderTap(e) {
    const order = e.currentTarget.dataset.order;
    wx.showModal({
      title: '订单详情',
      content: this.buildDetail(order),
      showCancel: false,
      confirmText: '关闭'
    });
  },

  buildDetail(order) {
    let d = `用户：${order.userInfo?.nickName || '未知'}\n`;
    d += `电话：${order.phone}\n`;
    d += `地址：${order.address}\n`;
    d += `备注：${order.remark || '无'}\n`;
    d += `时间：${order.createdAt}\n`;
    d += `状态：${this.statusText(order.status)}\n`;
    d += '---商品---\n';
    order.items.forEach(item => {
      d += `${item.name} ×${item.quantity} ¥${item.price}\n`;
    });
    d += `合计：¥${order.totalAmount}`;
    return d;
  },

  statusText(s) {
    return { pending: '待支付', paid: '已支付', cancelled: '已取消' }[s] || s;
  },

  // 退出管理
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出管理后台吗？',
      success: (res) => {
        if (res.confirm) {
          auth.adminLogout();
          wx.redirectTo({ url: '/pages/admin/login/login' });
        }
      }
    });
  }
});
