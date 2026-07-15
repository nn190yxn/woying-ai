# Miniapp 模块

## 职责

`miniapp/` 是我赢AI的 uni-app 微信小程序目录，承接移动端登录、会员、工具、文案生成、推荐和支付相关能力。

## 技术栈

- uni-app
- Vue 3
- Vite
- 微信小程序构建目标 `mp-weixin`

## 入口文件

- `miniapp/src/main.js`：小程序应用入口。
- `miniapp/src/App.vue`：根组件。
- `miniapp/src/pages.json`：页面路由配置。
- `miniapp/src/manifest.json`：小程序 manifest。
- `miniapp/src/store/user.js`：用户状态。
- `miniapp/src/utils/request.js`：请求封装。

## 页面

当前页面目录包括：

- `miniapp/src/pages/home/index.vue`：首页。
- `miniapp/src/pages/login/index.vue`：登录。
- `miniapp/src/pages/register/index.vue`：注册。
- `miniapp/src/pages/user/index.vue`：用户中心。
- `miniapp/src/pages/membership/index.vue`：会员。
- `miniapp/src/pages/tools/index.vue`：工具。
- `miniapp/src/pages/copywriter/index.vue`：文案工具。
- `miniapp/src/pages/referral/index.vue`：推荐。
- `miniapp/src/pages/privacy/index.vue`：隐私页。

## API 模块

- `miniapp/src/api/auth.js`：认证。
- `miniapp/src/api/payment.js`：支付。
- `miniapp/src/api/referral.js`：推荐。
- `miniapp/src/api/security.js`：安全检查。

## 脚本

开发微信小程序：

```bash
cd miniapp
npm run dev:mp-weixin
```

构建微信小程序：

```bash
cd miniapp
npm run build:mp-weixin
```

## 与后端的关系

小程序复用后端 API，重点相关接口：

- `/api/auth/*`：登录注册。
- `/api/payment/create-miniprogram-order`：创建小程序订单。
- `/api/referral/*`：推荐关系。
- `/api/security/*`：安全检查。

## 变更注意点

- 小程序支付当前后端返回模拟支付参数，真实支付接入需要改 `backend/src/routes/payment.js`。
- 页面新增后需要同步 `miniapp/src/pages.json`。
- 小程序请求封装应保持 token 注入和错误处理一致。
- 会员套餐展示需要与 Web 端会员页和后端 `plans.js` 保持一致。
