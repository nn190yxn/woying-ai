# 整站重构设计说明

## 总体设计

整站信息架构围绕经营闭环重新组织。现有工具能力继续保留在后台和工具库中，前台通过经营任务入口承接用户。第一阶段以抖音链路作为样板，形成可复制的页面结构和数据模型。

```text
首页经营入口
  -> 经营体检
  -> 诊断报告
  -> 15 天作战计划
  -> 每日执行工具
  -> 数据复盘
  -> 会员升级或下一轮计划
```

## 信息架构

### 顶部导航

建议导航项：

- 经营体检。
- 作战计划。
- 内容成交。
- 数据复盘。
- 经营数据表。
- 会员服务。

导航映射优先复用当前路由：

- 经营体检：抖音、小红书、私域体检入口聚合页或首页锚点。
- 作战计划：抖音 quick-plan、小红书 quick-start-plan、私域战略计划入口。
- 内容成交：内容脚本、标题、封面、话术、转化链路工具聚合。
- 数据复盘：抖音 data-diagnoser、小红书 account-review、私域相关复盘入口。
- 经营数据表：现有 Tools 页和表格模板体系。
- 会员服务：现有 Membership 页。

### 首页

首页模块顺序：

1. 首屏价值区：每天给老板一张能照着做的经营作战表。
2. 三个主入口：开始经营体检、查看作战计划、记录今天的数据。
3. 15 天作战表示例：展示餐饮或美业样例计划表的 3-5 天片段。
4. 诊断闭环说明：体检、报告、计划、执行、复盘。
5. 专项入口：抖音、小红书、私域。
6. 经营数据表入口：每日记录、客户管理、成本利润、营销复盘。
7. 会员权益引导：按经营结果表达。

首页主视觉聚焦经营作战表，能力数量作为信任信息放在辅助区域。

### 工具页

Tools 页改成经营数据表与工具库，结构为：

1. 经营数据表场景分组。
2. 诊断后推荐工具组。
3. 专项模块入口。
4. 全部能力索引。

推荐工具组按业务问题分组：内容生产、成交承接、投流评估、私域动作、经营计算。

### 专项 Hub

抖音、小红书、私域 Hub 使用同一种四段结构：

1. 先体检：展示体检入口、适用问题、预计用时。
2. 再计划：展示 15 天计划和 90 天战略。
3. 去执行：展示脚本、标题、封面、话术、投流等工具。
4. 看复盘：展示数据诊断、账号复盘、ROI 复盘等入口。

抖音 Hub 先落地完整样板。小红书和私域随后按同样结构调整排序和文案。

### 会员页

Membership 页首屏改为经营权益矩阵：

- 免费版：基础体检、少量内容/计算体验。
- 初阶版：15 天执行计划、高频内容工具。
- 进阶版：数据复盘、转化优化、投流评估。
- 高阶版：90 天战略、老板 IP、专家升级通道。

现有权限表保留为决策辅助区域。升级提示需要和诊断报告的问题类型关联，例如低播放推荐内容工具权益，低咨询推荐成交承接权益，投流亏损推荐投流评估权益。

## 数据模型

### 体检报告模型

抖音体检当前已有 `diagnosticProfile`、`weakestDimension`、`benchmarkSummary`、`dimensionDetails`、`dataBasis`、`confidence`、`suggestions`、`recommendedNext`。本次设计以这些字段作为样板。

通用报告字段建议：

```ts
type DiagnosisReport = {
  channel: 'douyin' | 'xhs' | 'private'
  industry: string
  mainProblem: string
  weakestDimension: string
  confidence: string | number
  dataBasis: string[]
  benchmarkSummary: string
  dimensionDetails: Array<{
    name: string
    score: number
    basis: string
    action: string
  }>
  suggestions: Array<{
    title: string
    reason: string
    action: string
    toolCode?: string
    route?: string
  }>
  recommendedNext: Array<{
    label: string
    route: string
    reason: string
  }>
}
```

### 15 天作战计划模型

计划表可以先由前端适配现有 quick-plan 输出，后续再由后端统一生成结构化计划。建议目标结构：

```ts
type BattlePlanDay = {
  day: number
  stage: '定位测试' | '内容放大' | '成交优化'
  goal: string
  contentType: string
  videoFunction: string
  shootingMethod: string
  topicDirection: string
  tools: Array<{
    label: string
    route: string
    payloadHint?: Record<string, unknown>
  }>
  trafficPlan: string
  customerNurture: string
  reviewMetrics: string[]
  status: '未开始' | '进行中' | '已完成' | '已复盘'
}
```

### 复盘模型

复盘中心首期可以用用户输入和已有诊断接口结果组合展示。建议目标结构：

```ts
type ReviewSnapshot = {
  executedDays: number
  publishedContent: number
  views: number
  completionRate?: number
  comments: number
  privateMessages: number
  consultations: number
  redemptions?: number
  deals?: number
  adSpend?: number
  roi?: number
  effectiveContentTypes: string[]
  nextActions: string[]
}
```

## 前端实现策略

### 路由

优先复用当前 `frontend/src/router/index.js` 中已有路由。新增聚合页时，保持路由命名和已有专项页面风格一致。

可选新增路由：

- `/diagnosis`：经营体检聚合页。
- `/battle-plan`：作战计划聚合页。
- `/review-center`：数据复盘中心。

若第一阶段只做展示收口，可以先通过首页锚点和现有路由完成闭环，复盘中心作为后续任务。

### 组件

建议新增或提取以下轻量组件：

- `BattlePlanPreview`：首页样例作战表。
- `BusinessTaskEntry`：三主任务入口卡片。
- `JourneySteps`：体检到复盘路径。
- `RecommendedToolGroup`：诊断后推荐工具组。
- `MembershipOutcomeMatrix`：会员经营权益矩阵。

若现有页面改动较小，可先在页面内实现，再根据重复度提取组件。

### 状态与上下文

报告到计划的上下文传递优先采用路由 query、localStorage 或 Pinia 中已有模式。首期建议使用 route query + sessionStorage 保存最近一次诊断摘要，降低后端变更范围。

后续可增加后端持久化：诊断记录、计划记录、每日复盘记录、任务状态。

## 后端实现策略

第一阶段尽量复用已有接口：

- 抖音体检：`/api/douyin/diagnosis`。
- 抖音 15 天计划：现有 quick-plan 路由。
- 抖音执行工具：脚本、标题、封面、投流、私信话术等现有专项接口。
- 通用工具：`/api/generate/:toolCode`。

后端新增工作的优先级：

1. 给 quick-plan 类接口补齐表格型结构输出。
2. 给体检报告补齐推荐工具字段。
3. 给小红书和私域体检补齐诊断依据、置信度和推荐动作。
4. 增加复盘记录持久化接口。

## 权限与会员

权限继续沿用现有会员体系。新入口需要使用既有权限结果表达：可体验、需升级、已解锁。

升级引导按问题类型展示：

- 内容问题：升级获取 15 天计划、脚本、标题、封面和选题库。
- 转化问题：升级获取私信话术、转化链路和客户培育动作。
- 投流问题：升级获取投流评估、ROI 复盘和 90 天策略。
- 经营问题：升级获取经营数据表、利润计算和专家校准。

## 验证策略

- 前端构建：使用线上可构建环境或修复本地依赖后运行前端 build。
- 后端语法：对变更的后端文件运行 `node --check`。
- 抖音样板链路：运行 `npm run test:douyin-diagnosis` 并手动验证页面从体检到计划的跳转。
- 页面体验：桌面和移动端分别检查首页、工具页、会员页、抖音 Hub、体检报告、计划表。
- 老板视角验收：按需求文档中的 10 秒理解、报告可解释、计划可执行、复盘可判断、会员价值清晰五项检查。
