# 接口文档

## 通用约定

后端 API 统一挂载在 `/api` 下。前端 Axios 默认 `baseURL` 为 `/api`，请求拦截器会从 `localStorage.token` 注入 `Authorization: Bearer <token>`。

鉴权失败时，前端请求封装会清理本地 token 并跳转 `/login`。后端常见错误响应使用 `message` 或 `error` 字段，前端会规范化为 `error.normalized`。

## 健康检查

### `GET /api/health`

返回服务状态。

响应示例：

```json
{
  "status": "ok",
  "timestamp": "2026-07-10T00:00:00.000Z"
}
```

## 认证接口

### `POST /api/auth/send-code`

发送验证码。

请求体：

```json
{
  "phone": "13800000000"
}
```

### `POST /api/auth/register`

注册用户并返回 JWT。

请求体：

```json
{
  "phone": "13800000000",
  "code": "123456",
  "password": "<PASSWORD>",
  "nickname": "门店老板",
  "referralCode": "可选的邀请码"
}
```

### `POST /api/auth/login`

验证码登录并返回 JWT。

请求体：

```json
{
  "phone": "13800000000",
  "code": "123456"
}
```

响应包含：

- `token`
- `user.id`
- `user.phone`
- `user.nickname`
- `user.memberLevel`
- `user.memberExpireAt`

### `POST /api/auth/logout`

退出登录。

## 用户接口

- `GET /api/user/profile`
- `GET /api/user/info`
- `PUT /api/user/profile`

这些接口通过 `authMiddleware` 读取 JWT 用户信息。

## 工具与配额接口

### `GET /api/tools`

返回工具列表，并为每个工具附加会员权限元数据。

### `GET /api/tools/quotas`

返回当前登录用户各工具配额。需要登录。

### `GET /api/tools/:code/quota`

返回指定工具配额。需要登录。

### `POST /api/tools/:code/run`

运行指定工具。需要登录，并受会员等级与配额限制。

### `GET /api/tools/:code/history`

读取指定工具历史。需要登录。

### `GET /api/tools/history`

读取工具历史。需要登录。

## 通用生成接口

### `POST /api/generate/:toolCode`

通用工具生成入口。流程包括：

1. 查找工具定义。
2. 查询用户会员等级。
3. 校验工具访问权限。
4. 根据工具引擎类型执行输入校验。
5. 通过 failover 执行工具。
6. 记录使用和分析事件。

## 抖音专项接口

抖音专项接口前缀：`/api/douyin`。除体检外，大多数接口需要登录和对应会员等级。

### `POST /api/douyin/diagnosis`

会员等级：`free`。

生成抖音本地生活经营体检。输入包含行业、经营模式、痛点、基础数据和访谈信息。输出包含雷达评分、诊断分型、主短板、置信度、诊断依据、建议、风险边界和推荐下一步工具。

### `POST /api/douyin/quick-plan`

会员等级：`starter`。

生成 15 天速胜计划。输入包含行业、目标、发布频次、投流方式和诊断上下文。输出计划包含阶段和每日任务字段，例如阶段、今日目标、作品类型、视频功能、拍摄方式、选题方向、执行工具、投流计划、客户培育、复盘指标和任务状态。

### `GET /api/douyin/quick-plan/saved`

会员等级：`starter`。

读取当前用户最近保存的一份 15 天计划。

响应中的 `savedPlan` 包含 `planVersion`、`inputHash` 和迁移后的 `plan`。旧保存计划读取时会补齐为当前 QuickPlanResult，迁移状态位于 `savedPlan.plan.meta.migrated`。

### `POST /api/douyin/quick-plan/saved`

会员等级：`starter`。

保存或覆盖当前用户最近一份 15 天计划。

保存时后端会标准化行业、目标、诊断上下文和计划结构，并写入 `planVersion` 与 `inputHash`。

请求体核心字段：

```json
{
  "industry": "restaurant",
  "goal": "conversion",
  "frequency": "1",
  "adSupport": "local",
  "diagnosisContext": {},
  "plan": {}
}
```

### `PATCH /api/douyin/quick-plan/saved/status`

会员等级：`starter`。

更新保存计划中的每日任务状态。允许状态：`未开始`、`进行中`、`已完成`、`已复盘`。

更新时后端会先迁移保存计划为当前 QuickPlanResult，再写回完整计划 JSON，并同步保留 `planVersion` 和 `inputHash`。

请求体：

```json
{
  "day": 1,
  "status": "已复盘"
}
```

### `POST /api/douyin/data-diagnoser`

会员等级：`pro`。

根据播放、点赞、完播、收藏、分享、评论等数据生成视频数据诊断。

### `POST /api/douyin/review-records`

会员等级：`pro`。

保存复盘记录。记录按用户隔离，包含来源上下文、输入数据、诊断结果、有效内容类型和下一步动作。

请求体核心字段：

```json
{
  "industry": "restaurant",
  "goal": "conversion",
  "sourceContext": {},
  "inputData": {},
  "resultData": {},
  "effectiveContentTypes": ["门店实拍"],
  "nextActions": ["把门店实拍安排到下一轮前 3 天"]
}
```

### `GET /api/douyin/review-records/latest`

会员等级：`pro`。

读取当前用户最近一条复盘记录。

### `GET /api/douyin/review-records`

会员等级：`pro`。

读取当前用户最近 20 条复盘记录。

### `GET /api/douyin/review-records/insights`

会员等级：`pro`。

基于最近 20 条复盘记录生成洞察，返回：

- `recordCount`
- `topContentTypes`
- `metrics.totalViews`
- `metrics.completionRate`
- `metrics.inquiryRate`
- `metrics.redemptionRate`
- `metrics.roi`
- `nextRoundSuggestion.title`
- `nextRoundSuggestion.focusContentTypes`
- `nextRoundSuggestion.shortfall`
- `nextRoundSuggestion.actions`

### 其他抖音工具接口

- `POST /api/douyin/product-pricing`：组品定价，`pro`。
- `POST /api/douyin/content-planner`：内容策划，`starter`。
- `POST /api/douyin/script-generator`：脚本生成，`starter`。
- `POST /api/douyin/title-optimizer`：标题优化，`starter`。
- `POST /api/douyin/cover-helper`：封面助手，`starter`。
- `POST /api/douyin/ad-calculator`：投流计算器，`pro`。
- `POST /api/douyin/conversion-path`：转化链路，`starter`。
- `POST /api/douyin/local-ad-strategy`：本地推策略，`pro`。
- `POST /api/douyin/ip-positioning`：IP 定位，`pro`。
- `POST /api/douyin/full-strategy`：90 天战略，`annual`。

## 小红书专项接口

小红书专项接口前缀：`/api/xhs`。

主要接口：

- `POST /api/xhs/account-diagnosis`：账号体检，`free`。
- `POST /api/xhs/topic-generator`：选题生成，`starter`。
- `POST /api/xhs/title-generator`：标题生成，`starter`。
- `POST /api/xhs/shutiao-calculator`：薯条计算器，`free`。
- `POST /api/xhs/quick-start-plan`：15 天起号计划，`pro`。
- `POST /api/xhs/growth-strategy`：增长战略，`annual`。
- `POST /api/xhs/script-generator`：正文脚本，`starter`。
- `POST /api/xhs/cover-helper`：封面助手，`starter`。
- `POST /api/xhs/note-diagnoser`：笔记诊断，`pro`。
- `POST /api/xhs/account-reviewer`：账号复盘，`pro`。
- `POST /api/xhs/seo-optimizer`：SEO 优化，`pro`。
- `POST /api/xhs/conversion-optimizer`：转化优化，`pro`。
- `POST /api/xhs/competitor-analyzer`：竞对分析，`annual`。
- `POST /api/xhs/grass-converter`：种草转化计算器，`pro`。
- `POST /api/xhs/juguang-strategy`：聚光投放策略，`pro`。
- `POST /api/xhs/ip-positioning`：博主 IP 定位，`annual`。
- `POST /api/xhs/ip-consistency`：人设一致性，`annual`。

## 私域专项接口

私域专项接口前缀：`/api/private`。

主要接口：

- `POST /api/private/diagnosis`：私域运营体检，`free`。
- `POST /api/private/member-design`：会员体系设计，`pro`。
- `POST /api/private/retention-plan`：复购留存，`pro`。
- `POST /api/private/fission-plan`：裂变方案，`annual`。
- `POST /api/private/community-sop`：社群 SOP，`starter`。
- `POST /api/private/cac-ltv`：CAC vs LTV，`free`。
- `POST /api/private/full-strategy`：90 天私域战略，`annual`。

## 支付、会员和运营接口

代码中注册了以下接口模块：

- `/api/membership`：会员相关接口。
- `/api/payment`：创建订单、小程序订单、支付回调、订单查询。
- `/api/referral`：邀请码和返佣统计。
- `/api/admin`：运营后台统计、用户、订单、工具使用、佣金、反馈、配置和导出。
- `/api/analytics`：分析事件。
- `/api/token-monitor`：AI token 使用监控。
- `/api/security`：文本和图片安全检查。

## 表格和行业接口

- `/api/sheets`：用户表格数据。
- `/api/industries`：行业列表、推荐和行业详情。
- `/api/generate/poster` 与 `/api/poster-generator`：海报生成相关接口。

## 权限等级参考

会员等级顺序：`free < starter < pro < annual`。

典型权限：

- 免费版：体检类、部分计算器、基础入口。
- 初阶版：15 天计划、脚本、标题、封面、内容执行工具。
- 进阶版：数据复盘、投流、组品定价、转化和高级分析。
- 高阶版：90 天战略、深度竞对、IP 和专家校准相关能力。
