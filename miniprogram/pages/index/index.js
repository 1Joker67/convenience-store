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
    cartTotalAmount: 0
  },

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    this.refreshCart();
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
        console.log('getProducts 返回:', JSON.stringify(result));
        data = result.data || [];
      } catch (e) {
        console.log('getProducts 失败，换用 manageProduct list');
      }
      // 如果 getProducts 返回空，尝试 manageProduct
      if (data.length === 0) {
        const allResult = await api.manageProduct('list');
        console.log('manageProduct list 返回:', JSON.stringify(allResult));
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

  onSearchTap() {
    wx.navigateTo({ url: '/pages/search/search' });
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
    this.setData({ showCart: false });
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  },

  refreshCart() {
    const cartList = cart.getCart();
    this.setData({
      cartList,
      cartTotalCount: cart.getTotalCount(),
      cartTotalAmount: cart.getTotalAmount().toFixed(2)
    });
  }
});
