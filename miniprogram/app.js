// app.js — 便利店下单小程序入口
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-d7gpimbzx945dc3da',
      traceUser: true
    });

    // 检查登录态
    this.checkLogin();
  },

  // 全局数据
  globalData: {
    userInfo: null,       // 微信用户信息
    userId: null,         // openid
    isAdmin: false,       // 是否管理员
    adminLoggedIn: false  // 管理端是否已登录
  },

  // 检查用户登录态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    const userId = wx.getStorageSync('userId');

    if (userInfo && userId) {
      this.globalData.userInfo = userInfo;
      this.globalData.userId = userId;
    }
  },

  // 微信授权登录
  async wxLogin() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于显示您的昵称和头像',
        success: async (res) => {
          const userInfo = res.userInfo;

          try {
            // 调用云函数获取 openid
            const result = await wx.cloud.callFunction({
              name: 'login',
              data: {
                nickName: userInfo.nickName,
                avatarUrl: userInfo.avatarUrl
              }
            });

            const { openid, userId } = result.result;

            this.globalData.userInfo = userInfo;
            this.globalData.userId = openid;

            // 本地缓存
            wx.setStorageSync('userInfo', userInfo);
            wx.setStorageSync('userId', openid);

            resolve({ userInfo, openid });
          } catch (err) {
            console.error('登录云函数调用失败:', err);
            reject(err);
          }
        },
        fail: (err) => {
          console.error('用户拒绝授权:', err);
          reject(err);
        }
      });
    });
  },

  // 管理员登录
  setAdmin(isAdmin) {
    this.globalData.isAdmin = isAdmin;
    this.globalData.adminLoggedIn = isAdmin;
    if (isAdmin) {
      wx.setStorageSync('adminLoggedIn', true);
    } else {
      wx.removeStorageSync('adminLoggedIn');
    }
  },

  // 退出管理员
  logoutAdmin() {
    this.globalData.isAdmin = false;
    this.globalData.adminLoggedIn = false;
    wx.removeStorageSync('adminLoggedIn');
  }
});
