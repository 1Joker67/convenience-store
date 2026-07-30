// cloudfunctions/login/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { nickName, avatarUrl } = event;

  try {
    // 查找已有用户
    const userRes = await db.collection('users').where({ openid: OPENID }).get();

    if (userRes.data.length > 0) {
      // 老用户，更新信息
      const user = userRes.data[0];
      await db.collection('users').doc(user._id).update({
        data: {
          nickName: nickName || user.nickName,
          avatarUrl: avatarUrl || user.avatarUrl,
          updatedAt: new Date().toISOString()
        }
      });
      return {
        success: true,
        openid: OPENID,
        userId: user._id,
        role: user.role || 'user',
        isNew: false
      };
    } else {
      // 新用户
      const result = await db.collection('users').add({
        data: {
          openid: OPENID,
          nickName: nickName || '新用户',
          avatarUrl: avatarUrl || '',
          role: 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      });
      return {
        success: true,
        openid: OPENID,
        userId: result._id,
        role: 'user',
        isNew: true
      };
    }
  } catch (err) {
    console.error('login error:', err);
    return { success: false, error: err.message };
  }
};
