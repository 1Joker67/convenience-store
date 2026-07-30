// pages/admin/categories/categories.js — 分类管理
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
    if (!auth.isAdminLoggedIn()) {
      wx.redirectTo({ url: '/pages/admin/login/login' });
      return;
    }
    this.loadCategories();
  },

  async loadCategories() {
    try {
      this.setData({ loading: true });
      const result = await api.manageCategory('list');
      this.setData({
        categories: result.data || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  // 显示添加
  onAdd() {
    this.setData({ showForm: true, editMode: false, editId: '', formName: '' });
  },

  // 显示编辑
  onEdit(e) {
    const cat = e.currentTarget.dataset.category;
    this.setData({ showForm: true, editMode: true, editId: cat._id, formName: cat.name });
  },

  onInput(e) {
    this.setData({ formName: e.detail.value });
  },

  // 提交
  async onSubmit() {
    const name = this.data.formName.trim();
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    try {
      const action = this.data.editMode ? 'update' : 'add';
      const data = { name };
      if (this.data.editMode) {
        data.categoryId = this.data.editId;
      }

      await api.manageCategory(action, data);
      wx.showToast({ title: this.data.editMode ? '修改成功' : '添加成功', icon: 'success' });
      this.setData({ showForm: false });
      this.loadCategories();
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 删除
  onDelete(e) {
    const cat = e.currentTarget.dataset.category;
    wx.showModal({
      title: '确认删除',
      content: `确定删除「${cat.name}」分类吗？\n该分类下的商品将变为未分类。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.manageCategory('delete', { categoryId: cat._id });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadCategories();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onCancel() {
    this.setData({ showForm: false });
  }
});
