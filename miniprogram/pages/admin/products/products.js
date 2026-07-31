// pages/admin/products/products.js — 商品管理
const api = require('../../../utils/api.js');
const auth = require('../../../utils/auth.js');

Page({
  data: {
    products: [],
    categories: [],
    loading: true,
    showForm: false,
    editMode: false,
    editId: '',
    filterCategoryId: '',     // 从分类页传入的筛选
    filterCategoryName: '',
    form: {
      name: '',
      price: '',
      categoryId: '',
      image: '',
      status: 'on'
    }
  },

  onLoad(options) {
    if (options.categoryId) {
      this.setData({
        filterCategoryId: options.categoryId,
        filterCategoryName: options.categoryName || ''
      });
      wx.setNavigationBarTitle({ title: options.categoryName + ' - 商品' });
    }
  },

  onShow() {
    if (!auth.isAdminLoggedIn()) {
      wx.switchTab({ url: '/pages/admin/login/login' });
      return;
    }
    this.loadData();
  },

  async loadData() {
    try {
      this.setData({ loading: true });
      const [productRes, categoryRes] = await Promise.all([
        api.manageProduct('list'),
        api.manageCategory('list')
      ]);
      // 如果有筛选分类，过滤商品
      let products = productRes.data || [];
      if (this.data.filterCategoryId) {
        products = products.filter(p => p.categoryId === this.data.filterCategoryId);
      }
      this.setData({
        products,
        categories: categoryRes.data || [],
        loading: false
      });
      // 添加表单默认使用筛选分类
      if (this.data.filterCategoryId && !this.data.form.categoryId) {
        this.setData({ 'form.categoryId': this.data.filterCategoryId });
      }
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  // 显示添加表单
  onAdd() {
    this.setData({
      showForm: true,
      editMode: false,
      editId: '',
      form: { name: '', price: '', categoryId: '', image: '', status: 'on' }
    });
  },

  // 显示编辑表单
  onEdit(e) {
    const product = e.currentTarget.dataset.product;
    const cat = this.data.categories.find(c => c._id === product.categoryId);
    this.setData({
      showForm: true,
      editMode: true,
      editId: product._id,
      selectedCategoryName: cat?.name || '',
      form: {
        name: product.name,
        price: String(product.price),
        categoryId: product.categoryId,
        image: product.image || '',
        status: product.status
      }
    });
  },

  // 表单输入
  onNameInput(e) {
    this.setData({ 'form.name': e.detail.value });
  },
  onPriceInput(e) {
    this.setData({ 'form.price': e.detail.value });
  },
  onCategoryChange(e) {
    const idx = e.detail.value;
    const cat = this.data.categories[idx];
    this.setData({
      'form.categoryId': cat?._id || '',
      selectedCategoryName: cat?.name || ''
    });
  },
  onStatusChange(e) {
    this.setData({ 'form.status': e.detail.value });
  },

  // 上传图片
  onUploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        wx.showLoading({ title: '上传中...' });
        wx.cloud.uploadFile({
          cloudPath: `product-images/${Date.now()}.jpg`,
          filePath: tempPath,
          success: (uploadRes) => {
            this.setData({ 'form.image': uploadRes.fileID });
            wx.hideLoading();
            wx.showToast({ title: '上传成功', icon: 'success' });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败', icon: 'none' });
          }
        });
      }
    });
  },

  // 提交表单
  async onSubmit() {
    const { name, price, categoryId, image, status } = this.data.form;

    if (!name.trim()) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' });
      return;
    }
    if (!price || isNaN(price) || Number(price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }
    if (!categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    try {
      const action = this.data.editMode ? 'update' : 'add';
      const data = {
        name: name.trim(),
        price: Number(price),
        categoryId,
        image,
        status
      };
      if (this.data.editMode) {
        data.productId = this.data.editId;
      }

      const result = await api.manageProduct(action, data);
      if (result.success) {
        wx.showToast({ title: this.data.editMode ? '修改成功' : '添加成功', icon: 'success' });
        this.setData({ showForm: false });
        this.loadData();
      } else {
        wx.showToast({ title: result.error || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 删除商品
  onDelete(e) {
    const product = e.currentTarget.dataset.product;
    wx.showModal({
      title: '确认删除',
      content: `确定删除「${product.name}」吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.manageProduct('delete', { productId: product._id });
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadData();
          } catch (err) {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 取消
  onCancel() {
    this.setData({ showForm: false });
  },

  // 切换分类筛选
  onSwitchCategory(e) {
    const idx = e.detail.value;
    const cat = this.data.categories[idx];
    if (cat) {
      this.setData({
        filterCategoryId: cat._id,
        filterCategoryName: cat.name,
        'form.categoryId': cat._id,
        selectedCategoryName: cat.name
      });
      wx.setNavigationBarTitle({ title: cat.name + ' - 商品' });
      this.loadData();
    }
  },

  // 清除分类筛选
  onClearFilter() {
    this.setData({ filterCategoryId: '', filterCategoryName: '', 'form.categoryId': '' });
    wx.setNavigationBarTitle({ title: '商品管理' });
    this.loadData();
  },

  // 导航切换
  onNavTap(e) {
    const page = e.currentTarget.dataset.page;
    if (page === 'orders') wx.redirectTo({ url: '/pages/admin/orders/orders' });
    else if (page === 'categories') wx.redirectTo({ url: '/pages/admin/categories/categories' });
  },

  // 退出
  onLogout() {
    wx.showModal({
      title: '退出管理', content: '确定退出吗？',
      success: (res) => { if (res.confirm) { auth.adminLogout(); wx.switchTab({ url: '/pages/admin/login/login' }); } }
    });
  }
});
