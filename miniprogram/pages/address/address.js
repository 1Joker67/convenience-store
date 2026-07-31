// pages/address/address.js — 地址管理
const addrStore = require('../../utils/address.js');

Page({
  data: {
    list: [],
    showForm: false, editId: '',
    form: { name: '', phone: '', address: '' }
  },

  onShow() {
    this.setData({ list: addrStore.getList() });
  },

  // 选择地址并返回下单页
  onSelect(e) {
    const addr = e.currentTarget.dataset.addr;
    const pages = getCurrentPages();
    const prev = pages[pages.length - 2]; // 上一个页面（下单页）
    if (prev && prev.setAddress) {
      prev.setAddress(addr);
    }
    wx.navigateBack();
  },

  // 新增
  onAdd() {
    this.setData({ showForm: true, editId: '', form: { name: '', phone: '', address: '' } });
  },

  // 编辑
  onEdit(e) {
    const addr = e.currentTarget.dataset.addr;
    this.setData({ showForm: true, editId: addr.id, form: { name: addr.name, phone: addr.phone, address: addr.address } });
  },

  // 删除
  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址', content: '确定删除吗？',
      success: (res) => {
        if (res.confirm) { addrStore.remove(id); this.setData({ list: addrStore.getList() }); }
      }
    });
  },

  // 表单输入
  onNameInput(e) { this.setData({ 'form.name': e.detail.value }); },
  onPhoneInput(e) { this.setData({ 'form.phone': e.detail.value }); },
  onAddrInput(e) { this.setData({ 'form.address': e.detail.value }); },

  // 保存
  onSave() {
    const { name, phone, address } = this.data.form;
    if (!phone.trim()) { wx.showToast({ title: '请填写电话', icon: 'none' }); return; }
    if (!address.trim()) { wx.showToast({ title: '请填写地址', icon: 'none' }); return; }
    if (!/^1\d{10}$/.test(phone.trim())) { wx.showToast({ title: '手机号格式不对', icon: 'none' }); return; }

    if (this.data.editId) {
      addrStore.update(this.data.editId, { name: name.trim(), phone: phone.trim(), address: address.trim() });
    } else {
      addrStore.add({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    }
    this.setData({ showForm: false, list: addrStore.getList() });
    wx.showToast({ title: this.data.editId ? '已更新' : '已保存', icon: 'success' });
  },

  onCancel() { this.setData({ showForm: false }); }
});
