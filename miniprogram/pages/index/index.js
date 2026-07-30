// pages/index/index.js — 首页
const api = require('../../utils/api.js');
const cart = require('../../utils/cart.js');

Page({
  data: {
    categories: [],        // 分类列表
    products: [],          // 商品列表
    activeCategoryId: '',  // 当前选中分类
    loading: true,
    cartCount: 0
  },

  onLoad() {
    this.loadCategories();
  },

  onShow() {
    // 更新购物车角标
    this.setData({ cartCount: cart.getTotalCount() });
  },

  // 加载分类
  async loadCategories() {
    try {
      const result = await api.manageCategory('list');
      const categories = result.data || [];
      this.setData({
        categories,
        activeCategoryId: categories.length > 0 ? categories[0]._id : '',
        loading: false
      });
      if (categories.length > 0) {
        this.loadProducts(categories[0]._id);
      }
    } catch (err) {
      console.error('加载分类失败:', err);
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' });
      this.setData({ loading: false });
    }
  async loadProducts(categoryId) {
    try {
      this.setData({ loading: true });
      const result = await api.getProducts({ categoryId });
      this.setData({
        products: result.data || [],
        loading: false
      });
    } catch (err) {
      console.error('加载商品失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  onCategoryTap(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({ activeCategoryId: categoryId });
    this.loadProducts(categoryId);
  },

  // 加入购物车
  onAddToCart(e) {
    const product = e.currentTarget.dataset.product;
    cart.addToCart(product);
    this.setData({ cartCount: cart.getTotalCount() });
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1000 });
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({ url: '/pages/search/search' });
  }
});
