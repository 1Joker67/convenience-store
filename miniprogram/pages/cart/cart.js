// pages/cart/cart.js — 购物车
const cart = require('../../utils/cart.js');

Page({
  data: {
    cartList: [],
    totalAmount: 0,
    isEmpty: true
  },

  onShow() {
    this.refreshCart();
  },

  // 刷新购物车
  refreshCart() {
    const cartList = cart.getCart();
    const totalAmount = cart.getTotalAmount();
    this.setData({
      cartList,
      totalAmount: totalAmount.toFixed(2),
      isEmpty: cartList.length === 0
    });
  },

  // 加数量
  onIncrease(e) {
    const productId = e.currentTarget.dataset.id;
    const item = this.data.cartList.find(i => i._id === productId);
    if (item) {
      cart.updateQuantity(productId, item.quantity + 1);
      this.refreshCart();
    }
  },

  // 减数量
  onDecrease(e) {
    const productId = e.currentTarget.dataset.id;
    const item = this.data.cartList.find(i => i._id === productId);
    if (item && item.quantity > 1) {
      cart.updateQuantity(productId, item.quantity - 1);
      this.refreshCart();
    }
  },

  // 删除商品
  onRemove(e) {
    const productId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要移除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          cart.removeFromCart(productId);
          this.refreshCart();
        }
      }
    });
  },

  // 去结算
  onCheckout() {
    if (this.data.isEmpty) return;
    wx.navigateTo({ url: '/pages/checkout/checkout' });
  }
});
