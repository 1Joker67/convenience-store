// pages/search/search.js — 搜索商品
const api = require('../../utils/api.js');
const cart = require('../../utils/cart.js');

Page({
  data: {
    keyword: '',
    products: [],
    searched: false,
    loading: false,
    cartCount: 0
  },

  onShow() {
    this.setData({ cartCount: cart.getTotalCount() });
  },

  // 输入关键词
  onInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  // 搜索
  async onSearch() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    try {
      this.setData({ loading: true });
      const result = await api.getProducts({ keyword });
      this.setData({
        products: result.data || [],
        searched: true,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  // 确认搜索（键盘回车）
  onConfirm(e) {
    this.onSearch();
  },

  // 加入购物车
  onAddToCart(e) {
    const product = e.currentTarget.dataset.product;
    cart.addToCart(product);
    this.setData({ cartCount: cart.getTotalCount() });
    wx.showToast({ title: '已加入购物车', icon: 'success', duration: 1000 });
  },

  // 清除搜索
  onClear() {
    this.setData({
      keyword: '',
      products: [],
      searched: false
    });
  }
});
