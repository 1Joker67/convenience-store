# 便利店下单小程序 — 实施方案

> 创建日期：2026-07-30

---

## 一、项目概述

一个在微信内运行的便利店下单小程序。用户浏览商品、加入购物车、在线支付下单；店主在同一小程序内通过密码进入管理后台，管理商品、分类和订单。

---

## 二、技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | 微信小程序原生框架 | WXML + WXSS + JavaScript |
| 后端/云服务 | 微信云开发 CloudBase | 云数据库 + 云函数 + 云存储 |
| 数据库 | 云开发数据库（NoSQL） | 文档型数据库 |
| 用户认证 | 微信授权登录 | wx.getUserProfile + 云函数解析 openid |
| 支付 | 微信支付 JSAPI | 云函数统一下单 + 回调处理 |
| 图片存储 | 云存储 | 商品图片上传/访问 |
| 开发工具 | 微信开发者工具 | 编译、预览、调试、上传 |

---

## 三、目录结构

```
miniprogram/
├── app.js                     # 云开发初始化、全局数据
├── app.json                   # 页面路由、窗口配置、tabBar
├── app.wxss                   # 全局样式（淡色主题）
├── project.config.json
│
├── components/                # 自定义组件
│   ├── product-card/          # 商品卡片
│   ├── cart-item/             # 购物车条目
│   ├── order-item/            # 订单条目
│   └── search-bar/            # 搜索栏
│
├── pages/
│   ├── index/                 # 首页（分类 + 商品）
│   ├── cart/                  # 购物车
│   ├── checkout/              # 下单结算 + 支付
│   ├── orders/                # 历史订单
│   ├── search/                # 搜索结果
│   └── admin/
│       ├── login/             # 管理端登录
│       ├── orders/            # 订单管理
│       ├── products/          # 商品管理
│       └── categories/        # 分类管理
│
├── utils/
│   ├── api.js                 # 云函数调用封装
│   ├── auth.js                # 登录态管理
│   └── cart.js                # 购物车操作
│
└── images/                    # 本地图片（tab icon）

cloudfunctions/
├── login/                     # 微信登录获取 openid
├── getProducts/               # 查询商品（分类/搜索）
├── submitOrder/               # 下单 + 微信支付
├── payCallback/               # 支付回调
├── getOrders/                 # 查询订单
├── adminAuth/                 # 管理端密码验证
├── manageProduct/             # 商品增删改
└── manageCategory/            # 分类增删改
```

---

## 四、页面路由

| 页面 | 路径 | Tab |
|------|------|-----|
| 首页（商品浏览） | pages/index/index | ✅ |
| 购物车 | pages/cart/cart | ✅ |
| 历史订单 | pages/orders/orders | ✅ |
| 管理后台 | pages/admin/login | ✅ |
| 下单结算 | pages/checkout/checkout | ❌ |
| 搜索结果 | pages/search/search | ❌ |
| 管理-订单 | pages/admin/orders | ❌ |
| 管理-商品 | pages/admin/products | ❌ |
| 管理-分类 | pages/admin/categories | ❌ |

---

## 五、数据结构

### categories（商品分类）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| name | string | 分类名称 |
| sort | number | 排序序号 |
| createdAt | string | 创建时间 |

### products（商品）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| name | string | 商品名称 |
| price | number | 价格（元） |
| image | string | 云存储 fileID |
| categoryId | string | 所属分类 _id |
| status | 'on' / 'off' | 上架/下架 |
| createdAt | string | 创建时间 |
| updatedAt | string | 更新时间 |

### orders（订单）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| userId | string | 下单用户 openid |
| userInfo | object | { nickName, avatarUrl } |
| items | array | [{ productId, name, price, quantity, image }] |
| totalAmount | number | 总金额（元） |
| address | string | 收货地址 |
| phone | string | 联系电话 |
| remark | string | 备注 |
| status | 'pending' / 'paid' / 'cancelled' | 订单状态 |
| payTransactionId | string | 微信支付交易号 |
| createdAt | string | 下单时间 |

### users（用户）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| openid | string | 微信 openid |
| nickName | string | 微信昵称 |
| avatarUrl | string | 微信头像 |
| role | 'user' / 'admin' | 角色 |
| createdAt | string | 注册时间 |

### admin_config（管理配置）
| 字段 | 类型 | 说明 |
|------|------|------|
| _id | string | 自动生成 |
| key | string | 配置键 |
| value | string | 配置值 |

---

## 六、实施步骤

### 阶段 1：项目初始化

| 步骤 | 内容 |
|------|------|
| 1.1 | 在微信开发者工具中创建小程序项目，填写 AppID |
| 1.2 | 开通云开发环境，初始化数据库和云函数 |
| 1.3 | 配置 app.json：页面路由、tabBar |
| 1.4 | 编写 app.js：云开发初始化、全局用户状态 |
| 1.5 | 编写 app.wxss：全局样式变量 |

### 阶段 2：云函数 + 数据库

| 步骤 | 内容 |
|------|------|
| 2.1 | login — 获取 openid，写入/更新 users 表 |
| 2.2 | getProducts — 按分类ID查询、关键词搜索 |
| 2.3 | submitOrder — 创建订单 + 微信支付统一下单 |
| 2.4 | payCallback — 接收支付回调，更新订单状态 |
| 2.5 | getOrders — 查询订单 |
| 2.6 | adminAuth — 验证管理密码 |
| 2.7 | manageProduct — 商品增删改 |
| 2.8 | manageCategory — 分类增删改 |
| 2.9 | 创建数据库集合并设置权限 |

### 阶段 3：用户端页面

| 步骤 | 内容 |
|------|------|
| 3.1 | 首页 — 左侧分类列表 + 右侧商品网格 |
| 3.2 | 搜索页 — 关键词搜索商品 |
| 3.3 | 购物车页 — 加减数量、去结算 |
| 3.4 | 下单页 — 地址/电话/备注 + 微信支付 |
| 3.5 | 订单页 — 当前用户订单列表 |

### 阶段 4：管理端页面

| 步骤 | 内容 |
|------|------|
| 4.1 | 管理登录页 — 密码验证 |
| 4.2 | 订单管理页 — 全部订单，可按状态筛选 |
| 4.3 | 商品管理页 — 增删改 + 图片上传 |
| 4.4 | 分类管理页 — 增删改 |

---

## 七、核心业务流程

### 下单支付流程
```
用户选商品 → 加入购物车 → 去结算
  → 填写地址电话备注
  → 提交订单
  → 云函数创建订单 + 调用微信支付
  → 用户输入密码支付
  → 微信回调更新订单状态为"已支付"
  → 新订单通知推送给店主
```

### 用户登录流程
```
进入小程序 → wx.login 获取 code
  → 云函数用 code 换 openid
  → 新用户：创建记录
  → 老用户：返回已有信息
  → 全局存储用户信息
```

---

## 八、费用预估

| 项目 | 费用 |
|------|------|
| 小程序注册 | 0 元 |
| 微信认证 | 300 元/年 |
| 云开发（个人版） | 19.9 元/月（≈239 元/年） |
| 微信支付手续费 | 每笔 0.6%（小微 0.54%） |
| 上线首年总计 | ≈ 539 元 |

---

## 九、配置参数

| 参数 | 值 |
|------|-----|
| 管理端初始密码 | `tf123456` |
| 主题色 | 淡色系（待定） |
| 初始分类 | 生活用品、烟、酒、水、饮料、零食 |
| 订单通知 | 微信服务通知 |

---

## 十、开发备忘

- 购物车使用本地存储（wx.Storage），不经过云数据库
- 商品图片存储在云存储 `product-images/` 目录
- 数据库权限需设置为云函数调用模式
- 微信支付需要在商户平台配置回调地址
- 管理端密码上线后可在 admin_config 中修改
