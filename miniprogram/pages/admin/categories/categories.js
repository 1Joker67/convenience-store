// pages/admin/categories/categories.js
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    categories: [],
    loading: true,
    showForm: false,
    editMode: false,
    editId: '',
    formName: ''
  },

  onShow() {
    if (!auth.isAdminLoggedIn()) { wx.switchTab({ url: '/pages/admin/login/login' }); return; }
    this.loadCategories();
  },

  async loadCategories() {
    try {
      this.setData({ loading: true });
      const result = await api.manageCategory('list');
      this.setData({ categories: result.data || [], loading: false });
    } catch (err) {
      console.error('加载分类失败:', err);
      this.setData({ loading: false });
    }
  },

  onAdd() { this.setData({ showForm: true, editMode: false, editId: '', formName: '' }); },
  onEdit(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({ showForm: true, editMode: true, editId: cat._id, formName: cat.name });
  },
  onInput(e) { this.setData({ formName: e.detail.value }); },

  async onSubmit() {
    const name = this.data.formName.trim();
    if (!name) { wx.showToast({ title: '请输入分类名称', icon: 'none' }); return; }
    try {
      const action = this.data.editMode ? 'update' : 'add';
      const data = { name };
      if (this.data.editMode) data.categoryId = this.data.editId;
      const result = await api.manageCategory(action, data);
      wx.showToast({ title: this.data.editMode ? '已修改' : '已添加', icon: 'success' });
      this.setData({ showForm: false });
      this.loadCategories();
    } catch (err) {
      console.error('提交失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async onMoveUp(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '排序中...' });
    try {
      const result = await api.manageCategory('moveUp', { categoryId: id });
      wx.hideLoading();
      if (result.success) {
        this.loadCategories();
      } else {
        wx.showToast({ title: result.error || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('moveUp 异常:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  async onMoveDown(e) {
    const id = e.currentTarget.dataset.id;
    wx.showLoading({ title: '排序中...' });
    try {
      const result = await api.manageCategory('moveDown', { categoryId: id });
      wx.hideLoading();
      if (result.success) {
        this.loadCategories();
      } else {
        wx.showToast({ title: result.error || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('moveDown 异常:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  onGoProducts(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.redirectTo({ url: '/pages/admin/products/products?categoryId=' + id + '&categoryName=' + name });
  },

  async onDelete(e) {
    const cat = e.currentTarget.dataset.category;
    wx.showModal({
      title: '确认删除', content: '确定删除「' + cat.name + '」吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.manageCategory('delete', { categoryId: cat._id });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadCategories();
          } catch (err) { wx.showToast({ title: '删除失败', icon: 'none' }); }
        }
      }
    });
  },

  onCancel() { this.setData({ showForm: false }); },

  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'orders') wx.redirectTo({ url: '/pages/admin/orders/orders' });
    else if (page === 'products') wx.redirectTo({ url: '/pages/admin/products/products' });
    else if (page === 'settings') wx.redirectTo({ url: '/pages/admin/settings/settings' });
  },

  onLogout() {
    wx.showModal({
      title: '退出管理', content: '确定退出吗？',
      success: (res) => { if (res.confirm) { auth.adminLogout(); wx.switchTab({ url: '/pages/admin/login/login' }); } }
    });
  }
});
