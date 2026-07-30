// utils/cart.js — 购物车本地存储操作

const CART_KEY = 'cart_data';

/**
 * 获取购物车全部数据
 */
function getCart() {
  return wx.getStorageSync(CART_KEY) || [];
}

/**
 * 保存购物车数据
 */
function saveCart(cart) {
  wx.setStorageSync(CART_KEY, cart);
}

/**
 * 添加商品到购物车
 * @param {object} product { _id, name, price, image }
 * @param {number} quantity 数量，默认 1
 */
function addToCart(product, quantity = 1) {
  const cart = getCart();
  const index = cart.findIndex(item => item._id === product._id);

  if (index > -1) {
    cart[index].quantity += quantity;
  } else {
    cart.push({
      _id: product._id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity
    });
  }

  saveCart(cart);
  return cart;
}

/**
 * 更新商品数量
 */
function updateQuantity(productId, quantity) {
  const cart = getCart();
  const index = cart.findIndex(item => item._id === productId);

  if (index > -1) {
    if (quantity <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = quantity;
    }
  }

  saveCart(cart);
  return cart;
}

/**
 * 从购物车移除商品
 */
function removeFromCart(productId) {
  const cart = getCart().filter(item => item._id !== productId);
  saveCart(cart);
  return cart;
}

/**
 * 清空购物车
 */
function clearCart() {
  saveCart([]);
}

/**
 * 获取购物车总金额
 */
function getTotalAmount() {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

/**
 * 获取购物车总数量
 */
function getTotalCount() {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}

/**
 * 检查商品是否已在购物车
 */
function isInCart(productId) {
  const cart = getCart();
  return cart.some(item => item._id === productId);
}

module.exports = {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalAmount,
  getTotalCount,
  isInCart
};
