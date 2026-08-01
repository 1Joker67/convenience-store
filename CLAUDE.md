# 便利店下单小程序

> 创建：2026-07-30 | 更新：2026-08-01

---

## 一、项目概述

便利店微信小程序。用户浏览商品 → 加入购物车 → 填写地址 → 下单支付。店主通过密码进入管理后台，管理商品、分类、订单和系统设置。

**AppID**: `wx16eb9ed2c220b5d0`
**云环境**: `cloud1-d7gpimbzx945dc3da`
**仓库**: https://github.com/1Joker67/convenience-store

---

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生（WXML + WXSS + JS） |
| 后端 | 云开发 CloudBase（云函数 + 云数据库 + 云存储） |
| 用户认证 | wx.login 静默登录 + openid |
| 管理员认证 | 密码登录 + 云端会话锁 |
| 支付 | 微信支付 JSAPI（需微信认证后才能接入） |

---

## 三、项目结构

```
e:\小程序\
├── CLAUDE.md
├── project.config.json
├── miniprogram/
│   ├── app.js / app.json / app.wxss
│   ├── components/
│   │   ├── product-card/       # 商品卡片
│   │   ├── cart-item/          # 购物车条目
│   │   ├── order-item/         # 订单条目
│   │   └── search-bar/         # 搜索栏
│   ├── pages/
│   │   ├── index/              # 首页（分类+商品+购物车）
│   │   ├── cart/               # 购物车（备用）
│   │   ├── checkout/           # 下单结算
│   │   ├── orders/             # 用户订单
│   │   ├── search/             # 搜索
│   │   ├── address/            # 地址管理
│   │   └── admin/
│   │       ├── login/          # 管理登录
│   │       ├── orders/         # 订单管理
│   │       ├── products/       # 商品管理
│   │       ├── categories/     # 分类管理
│   │       └── settings/       # 系统设置
│   ├── utils/
│   │   ├── api.js              # 云函数封装
│   │   ├── auth.js             # 登录态管理
│   │   ├── cart.js             # 购物车操作
│   │   └── address.js          # 地址管理
│   └── images/                 # Tab 图标
└── cloudfunctions/
    ├── login/                  # 微信登录
    ├── getProducts/            # 查询商品
    ├── submitOrder/            # 下单+扣库存
    ├── payCallback/            # 支付回调
    ├── getOrders/              # 查询订单
    ├── adminAuth/              # 管理员认证+会话锁
    ├── manageProduct/          # 商品CRUD
    ├── manageCategory/         # 分类CRUD+排序
    ├── manageSettings/         # 系统设置
    └── cleanupOrders/          # 订单清理+自动取消
```

---

## 四、数据库

| 集合 | 说明 | 关键字段 |
|------|------|---------|
| categories | 商品分类 | name, sort |
| products | 商品 | name, price, stock, image, categoryId, status |
| orders | 订单 | userId, items, totalAmount, address, phone, status, createdAt |
| users | 用户 | openid, nickName, role |
| settings | 系统配置 | key, value（公告/服务时间/密码/保留天数等） |

---

## 五、已完成功能

### 用户端
- [x] 首页：左分类 + 右商品 + 底部购物车栏
- [x] 购物车弹出层：加减数量、清空、去结算
- [x] 搜索商品
- [x] 下单：选择地址 → 填写备注 → 提交
- [x] 地址管理：新增/编辑/删除收货地址
- [x] 历史订单：按状态筛选、查看详情
- [x] 静默登录：wx.login 无需用户操作
- [x] 满20起送
- [x] 服务时间限制
- [x] 公告展示

### 管理端
- [x] 密码登录（数据库存储+兜底密码）
- [x] 云端会话锁（同一时间只允许一个管理员）
- [x] 自动登录（重启小程序无需重输密码）
- [x] 修改密码
- [x] 订单管理：查看全部、按状态筛选、详情
- [x] 商品管理：增删改、图片上传、库存管理
- [x] 分类管理：增删改、▲▼排序、分类内商品入口
- [x] 系统设置：公告编辑、服务时间、订单保留天数
- [x] 新订单通知：30秒轮询+红色角标+订阅消息预留

### 自动化
- [x] 待支付订单5分钟自动取消（恢复库存）
- [x] 超期订单自动清理（管理员可配天数）
- [x] 下单时服务端验价+扣库存

---

## 六、需微信认证后才能实现

| 功能 | 所需条件 | 代码状态 |
|------|---------|---------|
| 微信支付 | 微信认证(300元/年) + 商户号 + API密钥 | 前端+云函数已预留 |
| 订阅消息推送 | 公众平台配置模板ID | 前端+云函数已预留 |

---

## 七、部署云函数清单

全部 10 个云函数需在微信开发者工具中逐个右键部署：

`login` `getProducts` `submitOrder` `payCallback` `getOrders` `adminAuth` `manageProduct` `manageCategory` `manageSettings` `cleanupOrders`

---

## 八、初始配置

| 项目 | 值 |
|------|-----|
| 管理密码 | `tf123456`（登录后可修改） |
| 默认分类 | 生活用品、烟、酒、水、饮料、零食 |
| 订单保留 | 默认30天 |
| 待支付超时 | 5分钟 |
| 起送金额 | ¥20 |

---

## 九、安全要点

- 所有管理操作服务端验证（fail-closed）
- getOrders 按 openid 隔离用户数据
- manageSettings.get 过滤敏感 key
- 管理员会话锁防多人同时登录
- 下单价格服务端重算，客户端不可信
- 搜索正则转义防注入
