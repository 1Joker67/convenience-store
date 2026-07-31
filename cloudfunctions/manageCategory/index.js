// cloudfunctions/manageCategory/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (!res.data.length || res.data[0].role !== 'admin') {
    throw new Error('无操作权限');
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, categoryId, name } = event;

  try {
    switch (action) {
      case 'list': return await list();
      case 'add': await requireAdmin(OPENID); return await add(name);
      case 'update': await requireAdmin(OPENID); return await update(categoryId, name);
      case 'delete': await requireAdmin(OPENID); return await del(categoryId);
      case 'moveUp': await requireAdmin(OPENID); return await move(categoryId, -1);
      case 'moveDown': await requireAdmin(OPENID); return await move(categoryId, 1);
      default: return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageCategory error:', err);
    if (err.message === '无操作权限') return { success: false, error: '无操作权限' };
    return { success: false, error: '内部错误' };
  }
};

async function list() {
  const r = await db.collection('categories').orderBy('sort', 'asc').limit(100).get();
  return { success: true, data: r.data };
}
async function add(name) {
  if (!name || !name.trim()) return { success: false, error: '名称不能为空' };
  const max = await db.collection('categories').orderBy('sort', 'desc').limit(1).get();
  const s = max.data.length > 0 ? (max.data[0].sort || 0) + 1 : 1;
  const r = await db.collection('categories').add({ data: { name: name.trim(), sort: s, createdAt: new Date().toISOString() } });
  return { success: true, data: { _id: r._id } };
}
async function update(id, name) {
  if (!id) return { success: false, error: '缺少ID' };
  if (!name || !name.trim()) return { success: false, error: '名称不能为空' };
  await db.collection('categories').doc(id).update({ data: { name: name.trim() } });
  return { success: true };
}
async function move(id, dir) {
  if (!id) return { success: false, error: '缺少ID' };
  const all = await db.collection('categories').orderBy('sort', 'asc').get();
  const idx = all.data.findIndex(c => c._id === id);
  if (idx < 0) return { success: false, error: '不存在' };
  const t = idx + dir;
  if (t < 0 || t >= all.data.length) return { success: true };
  const a = all.data[idx], b = all.data[t];
  await db.collection('categories').doc(a._id).update({ data: { sort: b.sort } });
  await db.collection('categories').doc(b._id).update({ data: { sort: a.sort } });
  return { success: true };
}
async function del(id) {
  if (!id) return { success: false, error: '缺少ID' };
  const p = await db.collection('products').where({ categoryId: id }).limit(1).get();
  if (p.data.length > 0) return { success: false, error: '该分类下还有商品' };
  await db.collection('categories').doc(id).remove();
  return { success: true };
}
