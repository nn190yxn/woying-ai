# Admin Payment 模块

## 职责

运营后台与支付模块负责后台统计、用户和订单管理、佣金管理、反馈处理、会员订单创建、支付回调和会员状态更新。

## 运营后台

后端文件：`backend/src/routes/admin.js`。

前端入口：`/admin`，路由 meta 要求登录且会员等级达到 `annual`。

后端使用 `authMiddleware` 和 `adminOnly` 中间件。`adminOnly` 查询当前用户 `member_level`，只有 `annual` 可访问后台接口。

主要接口：

- `GET /api/admin/stats`：用户、付费用户、订单和收入汇总。
- `GET /api/admin/analytics`：工具统计和转化漏斗。
- `GET /api/admin/analytics/tool/:toolCode`：单工具成功率。
- `GET /api/admin/users`：用户列表。
- `GET /api/admin/orders`：最近订单。
- `GET /api/admin/tool-usage`：工具使用统计。
- `GET /api/admin/commissions`：返利列表。
- `PUT /api/admin/commissions/:id/status`：佣金状态更新。
- `PUT /api/admin/users/:id/member-level`：用户会员等级调整。
- `POST /api/admin/users/:id/extend-expire`：延长会员有效期。
- `GET /api/admin/error-logs`：错误日志。
- `GET /api/admin/user-feedbacks`：用户反馈列表。
- `PUT /api/admin/user-feedbacks/:id`：反馈处理。
- `GET /api/admin/config`：后台配置。
- `GET /api/admin/export/users`：导出用户。
- `GET /api/admin/export/orders`：导出订单。
- `GET /api/admin/export/commissions`：导出佣金。
- `GET /api/admin/export/feedbacks`：导出反馈。
- `GET /api/admin/tools`：后台工具信息。

## 支付

后端文件：`backend/src/routes/payment.js`。

主要接口：

- `POST /api/payment/create-order`：创建 Web 会员订单。
- `POST /api/payment/create-miniprogram-order`：创建小程序会员订单。
- `POST /api/payment/callback`：支付回调。
- `GET /api/payment/order/:orderId`：查询订单。

套餐价格和周期来自 `backend/src/config/plans.js`。

## 支付回调安全

支付回调使用 `PAYMENT_CALLBACK_SECRET` 做 HMAC SHA256 签名校验。签名 payload 为：

```text
<orderId>:<status>
```

回调状态只允许：

- `paid`
- `failed`
- `pending`

如果请求携带 `timestamp`，后端要求时间差在 5 分钟内，降低重放风险。

## 订单支付成功流程

当回调状态为 `paid`：

1. 获取数据库连接。
2. 开启事务。
3. 使用 `SELECT ... FOR UPDATE` 锁定订单。
4. 如果订单已经 paid，直接返回已处理。
5. 更新订单状态。
6. 更新用户会员等级和有效期。
7. 应用推荐返佣。
8. 提交事务。

## 小程序支付

`create-miniprogram-order` 当前返回模拟支付参数，代码中标注后续接入真实微信支付统一下单 API。

## 变更注意点

- 支付回调必须配置 `PAYMENT_CALLBACK_SECRET`。
- 修改会员套餐时，需要同步 `backend/src/config/plans.js`、前端会员页和小程序会员页。
- 后台权限当前以 `annual` 作为管理员判断，调整管理员模型时需要同步前端路由和后端 `adminOnly`。
- 支付和返佣改动后需要验证订单幂等、会员到期时间和佣金记录。
