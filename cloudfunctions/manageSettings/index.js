// cloudfunctions/manageSettings/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

async function requireAdmin(openid) {
  const res = await db.collection('users').where({ openid }).get();
  if (!res.data.length || res.data[0].role !== 'admin') {
    throw new Error('无操作权限');
  }
}

// 允许的 key 白名单
const ALLOWED_KEYS = ['announcement', 'service_time'];

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { action, key, value } = event;

  try {
    switch (action) {
      case 'get':
        return await getSettings();
      case 'update':
        await requireAdmin(OPENID);
        return await updateSetting(key, value);
      default:
        return { success: false, error: '未知操作' };
    }
  } catch (err) {
    console.error('manageSettings error:', err);
    if (err.message === '无操作权限') return { success: false, error: '无操作权限' };
    return { success: false, error: '内部错误' };
  }
};

async function getSettings() {
  const res = await db.collection('settings').limit(100).get();
  const data = {};
  for (const doc of res.data) { data[doc.key] = doc.value; }
  if (!data.announcement) data.announcement = '';
  if (!data.service_time) data.service_time = { start: '08:00', end: '22:00', enabled: false };
  return { success: true, data };
}

async function updateSetting(key, value) {
  if (!key) return { success: false, error: '缺少key' };
  if (!ALLOWED_KEYS.includes(key)) return { success: false, error: '不允许的key' };
  // 校验 value 类型
  if (key === 'announcement' && typeof value !== 'string') return { success: false, error: '公告必须是字符串' };
  if (key === 'service_time') {
    if (!value || !value.start || !value.end) return { success: false, error: '服务时间格式错误' };
  }

  const res = await db.collection('settings').where({ key }).get();
  if (res.data.length > 0) {
    await db.collection('settings').doc(res.data[0]._id).update({
      data: { value, updatedAt: new Date().toISOString() }
    });
  } else {
    await db.collection('settings').add({
      data: { key, value, updatedAt: new Date().toISOString() }
    });
  }
  return { success: true };
}
