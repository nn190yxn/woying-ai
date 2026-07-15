# 会员与权限

## 概念

我赢AI用会员等级控制工具入口、接口调用和经营结果权益。等级顺序从低到高为：

- `free`：免费版。
- `starter`：初阶版。
- `pro`：进阶版。
- `annual`：高阶版。

`trial` 在前端会归一为 `free`。

## 前端判断

前端会员逻辑在 `frontend/src/constants/membership.js`：

- `memberLevelOrder` 定义等级顺序。
- `memberLevelLabels` 定义展示名称。
- `normalizeMemberLevel()` 归一化等级。
- `canAccessLevel()` 判断用户等级是否满足入口要求。

用户登录状态在 `frontend/src/stores/user.js`：

- token 保存在 `localStorage.token`。
- 会员等级保存在 `localStorage.memberLevel`。
- `isAdmin` 通过 `canAccessLevel(memberLevel, 'annual')` 判断。

## 后端判断

通用工具权限在 `backend/src/config/toolAccess.js`：

- `MEMBER_LEVEL_ORDER` 定义等级顺序。
- `TOOL_REQUIRED_LEVELS` 定义工具 code 所需等级。
- `getRequiredMemberLevel()` 返回工具要求。
- `getToolAccessMeta()` 返回 requiredLevel 和 badge 元数据。

专项路由中也有模块级权限：

- 抖音：`backend/src/routes/douyinAgents.js`。
- 小红书：`backend/src/routes/xhsAgents.js`。
- 私域：`backend/src/routes/privateAgents.js`。

这些路由会读取 JWT 中的 `userId`，再查询用户表的 `member_level`。

## 典型权益边界

- 免费版：体检、基础诊断、部分计算器和公开入口。
- 初阶版：15 天计划、脚本、标题、封面、社群 SOP 等执行工具。
- 进阶版：数据复盘、投流、组品定价、转化优化和高级分析。
- 高阶版：90 天战略、IP、深度竞对和专家校准相关能力。

## 变更同步点

调整会员等级或工具权限时，需要同步检查：

- `frontend/src/constants/membership.js`
- `backend/src/config/toolAccess.js`
- 抖音、小红书、私域专项路由的 `requireLevel()`
- Hub 页面入口锁定状态和升级文案
- `frontend/src/views/Membership.vue`
- `.monkeycode/docs/membership-permission-architecture.md`

## 验证建议

权限相关改动后，至少验证：

- 未登录访问需要登录的页面会跳转 `/login`。
- 免费用户看到升级提示。
- 初阶、进阶、高阶用户能访问对应工具。
- 后端接口直接调用时会返回 401 或 403。
- 前端入口锁定文案与后端 requiredLevel 一致。
