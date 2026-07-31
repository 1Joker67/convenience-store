// pages/index/index.js — 首页（含购物车）
const api = require('../../utils/api.js');
const cart = require('../../utils/cart.js');

Page({
  data: {
    categories: [],
    products: [],
    activeCategoryId: '',
    loading: true,
    // 购物车
    showCart: false,
    cartList: [],
    cartTotalCount: 0,
    cartTotalAmount: 0,
    cartCanCheckout: false,
    checkoutBtnText: '去结算',
    isAdmin: false,
    // 公告 & 服务时间
    announcement: '',
    inServiceTime: true,
    serviceMsg: '',
    minAmount: 20
  },

  onLoad() {
    this.loadCategories();
    this.loadSettings();
  },

  onShow() {
    this.refreshCart();
    this.setData({ isAdmin: getApp().globalData.adminLoggedIn });
  },

  // 加载设置
  async loadSettings() {
    try {
      const result = await api.getSettings();
      if (result.success && result.data) {
        const st = result.data.service_time || {};
        const inService = this.checkServiceTime(st);
        this.setData({
          announcement: result.data.announcement || '',
          inServiceTime: inService,
          serviceMsg: st.enabled
            ? (inService ? '' : '⏰ 服务时间 ' + st.start + '-' + st.end + '，请在服务时间内下单')
            : ''
        });
      }
    } catch (err) { /* 静默 */ }
  },

  // 检查是否在服务时间内
  checkServiceTime(st) {
    if (!st.enabled) return true; // 未开启限制
    const now = new Date();
    const current = now.getHours() * 60 + now.getMinutes();
    const start = parseInt(st.start) * 60 + parseInt(st.start.split(':')[1] || 0);
    const end = parseInt(st.end) * 60 + parseInt(st.end.split(':')[1] || 0);
    if (start <= end) return current >= start && current <= end;
    return current >= start || current <= end; // 跨日
  },

  // ========== 分类 & 商品 ==========

  async loadCategories() {
    try {
      const result = await api.manageCategory('list');
      const categories = result.data || [];
      this.setData({ categories, loading: false });
      if (categories.length > 0) {
        this.setData({ activeCategoryId: categories[0]._id });
        this.loadProducts(categories[0]._id);
      }
    } catch (err) {
      console.error('加载分类失败:', err);
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async loadProducts(categoryId) {
    try {
      this.setData({ loading: true });
      // 先用 getProducts，失败则用 manageProduct list 兜底
      let data = [];
      try {
        const result = await api.getProducts({ categoryId });
        data = result.data || [];
      } catch (e) {
        // getProducts 失败，换用 manageProduct list
      }
      if (data.length === 0) {
        const allResult = await api.manageProduct('list');
        const all = allResult.data || [];
        // 前端按分类筛选
        data = all.filter(p => p.categoryId === categoryId);
      }
      this.setData({ products: data, loading: false });
    } catch (err) {
      console.error('加载商品失败:', err);
      wx.showToast({ title: '加载失败: ' + (err.message || ''), icon: 'none' });
      this.setData({ loading: false });
    }
  },

  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ activeCategoryId: categoryId });
    this.loadProducts(categoryId);
  },

  onSearchTap() { wx.navigateTo({ url: '/pages/search/search' }); },

  onAdminTap() {
    wx.navigateTo({ url: '/pages/admin/login/login' });
  },

  // ========== 购物车操作 ==========

  onAddToCart(e) {
    const product = e.currentTarget.dataset.product;
    cart.addToCart(product);
    this.refreshCart();
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 800 });
  },

  onCartBarTap() {
    this.setData({ showCart: !this.data.showCart });
  },

  onCloseCart() {
    this.setData({ showCart: false });
  },

  onIncrease(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.cartList.find(i => i._id === id);
    if (item) {
      cart.updateQuantity(id, item.quantity + 1);
      this.refreshCart();
    }
  },

  onDecrease(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.cartList.find(i => i._id === id);
    if (item && item.quantity > 1) {
      cart.updateQuantity(id, item.quantity - 1);
      this.refreshCart();
    }
  },

  onClearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确定清空吗？',
      success: (res) => {
        if (res.confirm) {
          cart.clearCart();
          this.refreshCart();
        }
      }
    });
  },

  onGoCheckout() {
    if (this.data.cartTotalCount === 0) return;
    if (!this.data.inServiceTime) {
      wx.showToast({ title: '请在服务时间内下单', icon: 'none' });
      return;
    }
    if (parseFloat(this.data.cartTotalAmount) < this.data.minAmount) {
      wx.showToast({ title: '满' + this.data.minAmount + '元起送', icon: 'none' });
      return;
    }
    this.setData({ showCart: false });
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  },

  refreshCart() {
    const cartList = cart.getCart();
    const total = cart.getTotalAmount();
    this.setData({
      cartList,
      cartTotalCount: cart.getTotalCount(),
      cartTotalAmount: total.toFixed(2),
      cartCanCheckout: cart.getTotalCount() > 0 && total >= this.data.minAmount,
      checkoutBtnText: cart.getTotalCount() > 0 && total < this.data.minAmount ? '¥' + this.data.minAmount + '起送' : '去结算'
    });
  }
});
