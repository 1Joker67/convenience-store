// pages/admin/settings/settings.js — 公告 + 服务时间
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    announcement: '',
    serviceTime: { start: '08:00', end: '22:00', enabled: false },
    retentionDays: 30,
    loading: true,
    saving: false
  },

  onShow() {
    if (!auth.isAdminLoggedIn()) { wx.switchTab({ url: '/pages/admin/login/login' }); return; }
    this.loadSettings();
  },

  async loadSettings() {
    try {
      this.setData({ loading: true });
      const result = await api.getSettings();
      if (result.success && result.data) {
        this.setData({
          announcement: result.data.announcement || '',
          serviceTime: result.data.service_time || { start: '08:00', end: '22:00', enabled: false },
          retentionDays: parseInt(result.data.order_retention_days) || 30,
          loading: false
        });
      }
    } catch (err) {
      console.error('加载设置失败:', err);
      this.setData({ loading: false });
    }
  },

  onAnnouncementInput(e) { this.setData({ announcement: e.detail.value }); },
  onStartChange(e) { this.setData({ 'serviceTime.start': e.detail.value }); },
  onEndChange(e) { this.setData({ 'serviceTime.end': e.detail.value }); },
  onRetentionInput(e) { this.setData({ retentionDays: parseInt(e.detail.value) || 30 }); },

  onToggleService(e) {
    this.setData({ 'serviceTime.enabled': e.detail.value });
  },

  // 保存公告
  async onSaveAnnouncement() {
    try {
      this.setData({ saving: true });
      await api.manageSettings('update', 'announcement', this.data.announcement.trim());
      wx.showToast({ title: '公告已保存', icon: 'success' });
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    finally { this.setData({ saving: false }); }
  },

  // 保存服务时间
  async onSaveServiceTime() {
    const { start, end, enabled } = this.data.serviceTime;
    if (!start || !end) { wx.showToast({ title: '请填写时间', icon: 'none' }); return; }
    try {
      this.setData({ saving: true });
      await api.manageSettings('update', 'service_time', { start, end, enabled });
      wx.showToast({ title: '服务时间已保存', icon: 'success' });
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    finally { this.setData({ saving: false }); }
  },

  // 导航
  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    const url = '/pages/admin/' + page + '/' + page;
    wx.redirectTo({ url });
  },

  // 保存订单保留天数
  async onSaveRetention() {
    try {
      this.setData({ saving: true });
      await api.manageSettings('update', 'order_retention_days', this.data.retentionDays);
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) { wx.showToast({ title: '保存失败', icon: 'none' }); }
    finally { this.setData({ saving: false }); }
  },

  onLogout() {
    wx.showModal({
      title: '退出管理', content: '确定退出吗？',
      success: (res) => { if (res.confirm) { auth.adminLogout(); wx.switchTab({ url: '/pages/admin/login/login' }); } }
    });
  }
});
