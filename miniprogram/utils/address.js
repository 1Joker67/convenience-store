// utils/address.js — 地址管理（本地存储）
const ADDRESS_KEY = 'saved_addresses';

function getList() {
  return wx.getStorageSync(ADDRESS_KEY) || [];
}

function saveList(list) {
  wx.setStorageSync(ADDRESS_KEY, list);
}

// 添加地址
function add(addr) {
  const list = getList();
  const item = {
    id: Date.now().toString(),
    address: addr.address || '',
    phone: addr.phone || '',
    name: addr.name || '',
    createdAt: new Date().toISOString()
  };
  list.unshift(item);
  saveList(list);
  return item;
}

// 更新地址
function update(id, data) {
  const list = getList();
  const idx = list.findIndex(a => a.id === id);
  if (idx > -1) {
    list[idx] = { ...list[idx], ...data };
    saveList(list);
  }
}

// 删除地址
function remove(id) {
  saveList(getList().filter(a => a.id !== id));
}

module.exports = { getList, add, update, remove };
