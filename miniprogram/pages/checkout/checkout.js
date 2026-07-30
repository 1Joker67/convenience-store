// pages/checkout/checkout.js — 下单结算
const cart = require('../../utils/cart.js');
const api = require('../../utils/api.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    cartList: [],
    totalAmount: 0,
    address: '',
    phone: '',
    remark: '',
    submitting: false
  },

  onLoad() {
    // 加载缓存地址
    const address = wx.getStorageSync('last_address') || '';
    const phone = wx.getStorageSync('last_phone') || '';
    this.setData({
      cartList: cart.getCart(),
      totalAmount: cart.getTotalAmount().toFixed(2),
      address,
      phone
    });
  },

  // 输入地址
  onAddressInput(e) {
    this.setData({ address: e.detail.value });
  },

  // 输入电话
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  // 提交订单
  async onSubmit() {
    const { address, phone, cartList, totalAmount, remark } = this.data;

    // 表单校验
    if (!address.trim()) {
      wx.showToast({ title: '请填写收货地址', icon: 'none' });
      return;
    }
    if (!phone.trim()) {
      wx.showToast({ title: '请填写联系电话', icon: 'none' });
      return;
    }
    if (!/^1\d{10}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (cartList.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      // 确保已登录
      await auth.login();

      // 调用下单云函数
      const result = await api.submitOrder({
        items: cartList.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: parseFloat(totalAmount),
        address: address.trim(),
        phone: phone.trim(),
        remark: remark.trim()
      });

      // 缓存地址和电话
      wx.setStorageSync('last_address', address.trim());
      wx.setStorageSync('last_phone', phone.trim());

      // 调起微信支付
      if (result.payParams) {
        wx.requestPayment({
          timeStamp: result.payParams.timeStamp,
          nonceStr: result.payParams.nonceStr,
          package: result.payParams.package,
          signType: result.payParams.signType || 'MD5',
          paySign: result.payParams.paySign,
          success: () => {
            cart.clearCart();
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                setTimeout(() => {
                  wx.switchTab({ url: '/pages/orders/orders' });
                }, 2000);
              }
            });
          },
          fail: (err) => {
            if (err.errMsg.indexOf('cancel') > -1) {
              wx.showToast({ title: '已取消支付', icon: 'none' });
            } else {
              wx.showToast({ title: '支付失败，请重试', icon: 'none' });
            }
          }
        });
      } else {
        // 无支付参数（如支付未配置时），直接完成下单
        cart.clearCart();
        wx.showToast({
          title: '下单成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            setTimeout(() => {
              wx.switchTab({ url: '/pages/orders/orders' });
            }, 2000);
          }
        });
      }
    } catch (err) {
      console.error('下单失败:', err);
      wx.showToast({ title: '下单失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
