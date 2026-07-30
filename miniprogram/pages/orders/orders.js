// pages/orders/orders.js — 订单列表
const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');

Page({
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
  },

  // 加载订单
  async loadOrders() {
    try {
      this.setData({ loading: true });

      // 确保已登录
      if (!auth.isLoggedIn()) {
        await auth.login();
      }

      const params = {};
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

  // 筛选状态
  onFilterTap(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({ statusFilter: status }, () => {
      this.loadOrders();
    });
  },

  // 展开订单详情
  onOrderTap(e) {
    const order = e.currentTarget.dataset.order;
    wx.showModal({
      title: '订单详情',
      content: this.buildOrderDetail(order),
      showCancel: false,
      confirmText: '知道了'
    });
  },

  buildOrderDetail(order) {
    let detail = `下单时间：${order.createdAt || '未知'}\n`;
    detail += `状态：${this.statusText(order.status)}\n`;
    detail += `地址：${order.address}\n`;
    detail += `电话：${order.phone}\n`;
    detail += `备注：${order.remark || '无'}\n`;
    detail += '----------\n';
    order.items.forEach(item => {
      detail += `${item.name} ×${item.quantity}  ¥${item.price}\n`;
    });
    detail += `合计：¥${order.totalAmount}`;
    return detail;
  },

  statusText(status) {
    const map = { pending: '待支付', paid: '已支付', cancelled: '已取消' };
    return map[status] || status;
  }
});
