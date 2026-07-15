# Frontend 模块

## 职责

`frontend/` 是我赢AI的 Web 前端，负责用户访问入口、工具表单、AI 结果展示、会员升级提示、路由权限和本地登录态维护。

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Axios
- ECharts
- Vite

## 入口文件

- `frontend/src/main.js`：应用入口。
- `frontend/src/App.vue`：根组件。
- `frontend/src/router/index.js`：页面路由、标题设置、登录校验、管理员入口校验。
- `frontend/src/api/request.js`：统一请求实例和错误规范化。
- `frontend/src/stores/user.js`：用户、token、会员等级和管理员状态。
- `frontend/src/stores/quota.js`：工具配额状态。
- `frontend/src/constants/membership.js`：会员等级顺序、标签和访问判断。
- `frontend/src/constants/douyinQuickPlan.js`：抖音 15 天计划展示选项、状态样式、字段标签和行业归一化别名。

## 路由组织

前端路由主要分为：

- 公开入口：`/`、`/tools`、`/membership`、`/login`、`/register`。
- 通用诊断：`/diagnosis`、`/diagnosis/questionnaire/:code`、`/diagnosis/report`、`/diagnosis/history`。
- 抖音专项：`/douyin` 与 `/douyin/*`。
- 小红书专项：`/xhs` 与 `/xhs/*`。
- 私域专项：`/private` 与 `/private/*`。
- 工具详情：`/tools/:code`。
- 运营后台：`/admin`。

`router.beforeEach()` 会基于 route meta 设置页面标题。带 `requiresAuth` 的页面需要本地存在 `token`。带 `requiresAdmin` 的页面需要本地会员等级可访问 `annual`。

## 请求封装

`frontend/src/api/request.js` 创建 Axios 实例：

- 默认 `baseURL`：`import.meta.env.VITE_API_BASE_URL || '/api'`。
- 默认超时：30 秒。
- 请求前从 `localStorage.token` 注入 `Authorization`。
- 401 响应会清理 token 并跳转 `/login`。
- 错误会统一写入 `error.normalized`，包含 `code`、`message` 和 `details`。

## 会员状态

登录成功后，`frontend/src/stores/user.js` 会写入：

- `localStorage.token`
- `localStorage.memberLevel`

前端用 `normalizeMemberLevel()` 把空值或 `trial` 映射为 `free`。`canAccessLevel()` 用等级顺序判断入口是否可访问。

## 构建配置

`frontend/vite.config.js` 配置了：

- `@` 指向 `src`。
- 开发服务器端口 `5173`。
- `allowedHosts: ['.monkeycode-ai.online']`。
- `/api` 代理到 `VITE_API_TARGET` 或 `http://localhost:3000`。
- 生产构建按 Vue、ECharts、工具目录等拆分 chunk。

后端默认端口是 `3001`，本地联调时建议通过 `VITE_API_TARGET=http://localhost:3001` 对齐。

## 主要页面模块

- 首页：`frontend/src/views/Home.vue`。
- 工具页：`frontend/src/views/Tools.vue`。
- 会员页：`frontend/src/views/Membership.vue`。
- 抖音 Hub：`frontend/src/views/DouyinAgentHub.vue`。
- 小红书 Hub：`frontend/src/views/XhsAgentHub.vue`。
- 私域 Hub：`frontend/src/views/PrivateAgentHub.vue`。
- 抖音体检：`frontend/src/views/douyin/DiagnosisAgent.vue`。
- 抖音 15 天计划：`frontend/src/views/douyin/QuickPlanAgent.vue`。
- 抖音复盘：`frontend/src/views/douyin/VideoDiagnoserAgent.vue`。

## 工作台布局系统

全站经营工作台布局的基础入口：

- `frontend/src/styles/variables.css`：工作台背景、状态色、页面宽度、断点、卡片密度、圆角、按钮高度和阴影令牌。
- `frontend/src/styles/main.css`：全局容器、按钮、卡片、状态标签、徽章、表单、`workbench-*` 共享类、`task-flow-nav` 页面级任务链路和移动端兜底规则。
- `frontend/src/views/agent-common.css`：小红书和部分私域任务页复用的 Agent 页面基础样式。
- `frontend/src/views/douyin/agent-common.css`：抖音和部分私域任务页复用的 Agent 页面基础样式。

本次工作台重构覆盖公开入口页、三类专项 Hub、抖音体检、15 天计划、视频复盘、主要小红书/私域体检页、`SheetTemplate` 表格模板和工具详情结果区。页面状态表达统一使用 `.badge`、`.status-badge`、`.status-*`、锁定态和升级提示样式，会员权限矩阵使用统一状态标签表达可用和锁定。

布局系统规格位于 `.monkeycode/specs/site-layout-system-refactor/`。前端验证命令：

```bash
cd frontend
npm run test:layout-structure
npm run test:quick-plan-structure
npm run build
```

## 近期重构新增组件

- `frontend/src/components/BattlePlanPreview.vue`：首页 15 天样例作战表。
- `frontend/src/components/MembershipOutcomeMatrix.vue`：首页会员经营权益矩阵。
- `frontend/src/constants/diagnosisRecommendations.js`：抖音、小红书、私域体检报告推荐动作映射。
- `frontend/src/constants/douyinQuickPlan.js`：抖音 15 天计划页面的行业、目标、状态、字段展示常量、行业别名归一化和短板到目标映射。`QuickPlanAgent.vue` 使用该模块渲染行业、目标和状态选项，并用后端返回的 `plan.meta.industryCode`、`plan.meta.goalCode` 校准页面状态。计划页通过标准字段优先的展示行归一化渲染每日卡片，旧保存计划的 `action`、`content`、`ad`、`kpi`、`script` 仅作为兼容兜底，并直接展示 QuickPlanResult 的 `researchBrief` 和 `riskBoundary`。从体检或复盘上下文进入时优先生成当前上下文计划；用户点击“加载已保存计划”后，保存计划和其诊断上下文覆盖当前展示并保留 day status。记录复盘入口会携带标准 `industryCode`、`goalCode`、计划 meta、当天任务字段和精简 `planContext`，供复盘记录追溯具体计划来源。

QuickPlan 前端收口验证使用 `cd frontend && npm run build` 和 `npm run test:quick-plan-structure`，重点覆盖常量抽取、标准字段优先展示、保存计划兜底、复盘上下文跳转和页面结构锚点。

QuickPlan 浏览器验收使用前端预览入口 `/douyin/diagnosis`，登录具备 starter 以上权限的测试用户后，填写餐饮团购体检表并跳转 `/douyin/quick-plan`。验收重点是计划页渲染 15 个 day card、15 个 script panel、15 个状态选择控件，并展示 `researchBrief` 对应的“调研依据”和 `riskBoundary` 对应的“执行边界”。

## 变更注意点

- 调整会员入口时，同步检查前端 Hub 锁定提示、会员页文案和后端权限。
- 调整 AI 结果结构时，前端结果区需要保留规则兜底兼容。
- 表格型页面需要考虑移动端横向滚动，避免页面级横向溢出。
- 新增 API 调用应走 `frontend/src/api/request.js`，复用 token 注入和错误规范化。
