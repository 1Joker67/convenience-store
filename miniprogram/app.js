// app.js — 便利店下单小程序入口
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-d7gpimbzx945dc3da',
      traceUser: true
    });

    // 检查本地登录缓存
    this.checkLogin();
  },

  globalData: {
    userInfo: null,
    userId: null,
    isAdmin: false,
    adminLoggedIn: false
  },

  // 检查本地缓存登录态
  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    const userId = wx.getStorageSync('userId');
    if (userInfo && userId) {
      this.globalData.userInfo = userInfo;
      this.globalData.userId = userId;
    }
  },

  // 静默登录（获取 openid，不弹授权框）
  async silentLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (loginRes) => {
          try {
            const result = await wx.cloud.callFunction({
              name: 'login',
              data: {
                nickName: '微信用户',
                avatarUrl: ''
              }
            });

            const { openid, role } = result.result;
            this.globalData.userId = openid;
            this.globalData.userInfo = this.globalData.userInfo || {
              nickName: '微信用户',
              avatarUrl: ''
            };

            wx.setStorageSync('userId', openid);
            wx.setStorageSync('userInfo', this.globalData.userInfo);

            resolve({ userInfo: this.globalData.userInfo, openid, role });
          } catch (err) {
            console.error('登录失败:', err);
            reject(err);
          }
        },
        fail: reject
      });
    });
  },

  // 获取用户头像昵称（需用户点击按钮触发）
  async getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于显示您的昵称和头像',
        success: (res) => {
          this.globalData.userInfo = res.userInfo;
          wx.setStorageSync('userInfo', res.userInfo);
          resolve(res.userInfo);
        },
        fail: reject
      });
    });
  },

  // 更新用户信息到云端
  async updateUserInfo(nickName, avatarUrl) {
    try {
      this.globalData.userInfo = { nickName, avatarUrl };
      wx.setStorageSync('userInfo', { nickName, avatarUrl });
      await wx.cloud.callFunction({
        name: 'login',
        data: { nickName, avatarUrl }
      });
    } catch (err) {
      console.error('更新用户信息失败:', err);
    }
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
