# Douyin Business Loop 模块

## 职责

抖音经营闭环是当前站点的样板链路，覆盖“经营体检 -> 15 天计划 -> 执行工具 -> 数据复盘 -> 下一轮计划”。核心代码集中在 `backend/src/routes/douyinAgents.js` 和 `frontend/src/views/douyin/`。

## 前端页面

- `frontend/src/views/DouyinAgentHub.vue`：抖音模块入口。
- `frontend/src/views/douyin/DiagnosisAgent.vue`：行业体检表。
- `frontend/src/views/douyin/QuickPlanAgent.vue`：15 天速胜计划。
- `frontend/src/constants/douyinQuickPlan.js`：15 天计划展示选项、状态样式、字段标签、行业归一化别名和短板目标映射。
- `frontend/src/views/douyin/VideoDiagnoserAgent.vue`：视频数据复盘。
- `frontend/src/views/douyin/ScriptGeneratorAgent.vue`：脚本生成。
- `frontend/src/views/douyin/TitleOptimizerAgent.vue`：标题优化。
- `frontend/src/views/douyin/CoverHelperAgent.vue`：封面助手。
- `frontend/src/views/douyin/ConversionPathAgent.vue`：转化链路。
- `frontend/src/views/douyin/LocalAdStrategyAgent.vue`：本地推策略。
- `frontend/src/views/douyin/AdEvaluatorAgent.vue`：投流效果评估。
- `frontend/src/views/douyin/FullStrategyAgent.vue`：90 天周期战略。

## 后端接口

接口前缀：`/api/douyin`。

后端路由仍集中在 `backend/src/routes/douyinAgents.js`。抖音 15 天计划链路的拆分服务目录为 `backend/src/services/douyin/`，当前提供输入归一化、行业/目标策略、15 天日任务模板、计划生成校验、兼容字段补齐和保存计划迁移的模块边界与聚合导出入口。`douyinAgents.js` 内旧 QuickPlan fallback 和重复归一化逻辑已清理，路由层保留权限、请求响应、AI 调用和数据库读写编排。

浏览器验收链路从 `/douyin/diagnosis` 填写餐饮团购体检表，生成体检报告后点击“下一步：生成 15 天提升计划”进入 `/douyin/quick-plan`。计划页应渲染 15 天任务卡、拍摄文案、调研依据、执行边界和状态更新控件。

`quickPlanInput.js` 提供 `normalizeIndustryCode()`、`normalizeGoalCode()`、`normalizeQuickPlanInput()` 和 `createQuickPlanInputHash()`，用于把 URL、体检报告、保存计划和手动表单输入整理为标准计划输入。`normalizeQuickPlanInput()` 会从行业策略包补齐 `targetAudience`、`coreOffer`、`offerPrice`、`userObjection`、`proofAssets`、`conversionPath`、`painSummary`，并在 `diagnosisContext.filledFields` 记录默认来源字段。

`quickPlanStrategies.js` 维护 restaurant、beauty、education、service 四个行业策略和 traffic、conversion、leads、live 四个目标策略。策略包集中提供行业名称、客户类型、默认产品、顾虑、证明素材、转化指标、行动入口、风险边界和禁用词。

`quickPlanTemplates.js` 维护 15 个日任务模板和 3 个阶段模板。模板只保存执行意图、阶段、内容结构和字段组合方式，后续由计划生成器注入行业策略、目标策略、CTA、复盘指标和风险边界。

`quickPlanGenerator.js` 负责规则计划生成、QuickPlanResult 校验和兼容字段补齐。`buildQuickPlanFromTemplates()` 会生成 `title`、`summary`、`researchBrief`、`riskBoundary`、3 个阶段、15 个 day、完整 `shootingScript` 和 `meta`；`validateQuickPlanResult()` 会用规则计划作为补齐基准，统一补齐 AI 输出或旧结构缺失的顶层字段、每日任务字段、脚本、状态和 meta；兼容字段补齐已接入 AI 生成结果、保存计划写入和保存计划读取路径。

QuickPlan 验收脚本位于 `backend/scripts/quick-plan-*.test.js` 和 `frontend/scripts/quick-plan-structure.test.js`，覆盖输入归一化、规则生成器、保存计划迁移、保存计划接口、语义矩阵、属性断言和前端页面结构锚点。

`POST /quick-plan` 已切换到新生成链路：先标准化输入，再按来源选择规则计划或 AI 生成，最终统一输出 QuickPlanResult。保存计划写入前和保存计划读取补齐也会经过 `validateQuickPlanResult()`。

`quickPlanMigration.js` 的 `migrateSavedPlan()` 用于旧保存计划升级：支持保存行中的 JSON 字符串或对象计划，兼容早期扁平 `days` 结构，补齐脚本、调研摘要、风险边界和 meta，并按 day 保留原执行状态。

状态更新接口会基于迁移后的计划结构修改指定 day 的 `status`，再写回完整计划 JSON，同时同步保存 `plan_version` 和 `input_hash`。

前端计划页使用 `douyinQuickPlan.js` 的行业、目标和状态常量渲染表单与状态选择，并在生成或读取计划后使用 QuickPlanResult 的 `meta.industryCode`、`meta.goalCode` 校准当前页面状态。计划页展示层优先读取 QuickPlanResult 主字段，旧保存计划的兼容字段只在主字段缺失时兜底；页面顶部直接展示 `researchBrief` 和 `riskBoundary`。从体检或复盘上下文进入计划页时，页面优先生成当前上下文计划；点击“加载已保存计划”时，保存计划覆盖当前展示并保留已保存的 day status。点击记录复盘会把标准行业目标、计划版本、输入哈希、生成模式、当天目标、内容方向、脚本摘要和精简 `planContext` 传给 `VideoDiagnoserAgent.vue`，复盘保存时写入 `sourceContext`。

核心闭环接口：

- `POST /diagnosis`：经营体检，`free`。
- `POST /quick-plan`：生成 15 天计划，`starter`。
- `GET /quick-plan/saved`：读取已保存计划，`starter`。
- `POST /quick-plan/saved`：保存计划，`starter`。
- `PATCH /quick-plan/saved/status`：更新每日任务状态，`starter`。
- `POST /data-diagnoser`：视频数据诊断，`pro`。
- `POST /review-records`：保存复盘记录，`pro`。
- `GET /review-records/latest`：读取最近复盘，`pro`。
- `GET /review-records`：读取最近 20 条复盘，`pro`。
- `GET /review-records/insights`：生成复盘洞察，`pro`。

执行工具接口：

- `POST /script-generator`：脚本生成，`starter`。
- `POST /title-optimizer`：标题优化，`starter`。
- `POST /cover-helper`：封面助手，`starter`。
- `POST /conversion-path`：转化链路，`starter`。
- `POST /local-ad-strategy`：本地推策略，`pro`。
- `POST /product-pricing`：组品定价，`pro`。
- `POST /ad-calculator`：投流计算器，`pro`。
- `POST /full-strategy`：90 天战略，`annual`。

## 数据表

### `douyin_quick_plans`

保存登录用户最近一份 15 天计划。

关键字段：

- `user_id`
- `industry`
- `goal`
- `frequency`
- `ad_support`
- `plan_version`
- `input_hash`
- `diagnosis_context`
- `plan`
- `created_at`
- `updated_at`

`user_id` 有唯一索引，同一用户保存会覆盖最近计划。

`plan_version` 默认 1，`input_hash` 用于判断当前体检上下文与保存计划是否一致。保存接口会写入当前 QuickPlanResult 的 `meta.planVersion` 和 `meta.inputHash`，读取接口会返回迁移后的展示计划和 `meta.migrated`。表初始化会兼容已存在的旧表补列。

### `douyin_review_records`

保存登录用户的多条复盘记录。

关键字段：

- `user_id`
- `industry`
- `goal`
- `source_context`
- `input_data`
- `result_data`
- `effective_content_types`
- `next_actions`
- `created_at`
- `updated_at`

按 `(user_id, created_at)` 建索引，用于读取最近 20 条记录和洞察。

## 数据流

```text
DiagnosisAgent
  -> POST /api/douyin/diagnosis
  -> recommendedNext + diagnosticProfile + weakestDimension
  -> route query to QuickPlanAgent

QuickPlanAgent
  -> POST /api/douyin/quick-plan
  -> POST /api/douyin/quick-plan/saved
  -> PATCH /api/douyin/quick-plan/saved/status
  -> route query to execution tools or VideoDiagnoserAgent

VideoDiagnoserAgent
  -> POST /api/douyin/data-diagnoser
  -> POST /api/douyin/review-records
  -> GET /api/douyin/review-records/latest
  -> GET /api/douyin/review-records/insights
  -> route query back to QuickPlanAgent
```

## 15 天计划结构

计划按 `phases[].days[]` 渲染。每日任务字段包括：

- `day`
- `phase`
- `goal`
- `workType`
- `videoFunction`
- `shootingMethod`
- `topicDirection`
- `executionTool`
- `adPlan`
- `customerNurture`
- `reviewMetrics`
- `shootingScript`
- `status`

兼容字段：

- `action`
- `content`
- `ad`
- `kpi`

## 复盘洞察

`buildReviewInsights()` 基于最近复盘记录聚合：

- 有效内容类型出现频次。
- 平均播放。
- 完播率。
- 咨询率。
- 核销率。
- ROI。

短板判断顺序：

1. 完播率低于 25%，判为内容完播不足。
2. 咨询率低于 0.5%，判为私信咨询不足。
3. 核销率低于 30%，判为到店核销不足。
4. ROI 存在且低于 1.5，判为投流效率不足。
5. 其他情况判为有效内容可放大。

## 验证建议

抖音链路改动后，至少验证：

- `node --check backend/src/routes/douyinAgents.js`
- `node --check backend/src/services/douyin/quickPlanInput.js`
- `node --check backend/src/services/douyin/quickPlanStrategies.js`
- `node --check backend/src/services/douyin/quickPlanTemplates.js`
- `node --check backend/src/services/douyin/quickPlanGenerator.js`
- `node --check backend/src/models/db.js`
- `node --check backend/src/models/mockDb.js`
- `cd backend && npm run test:deep-runner`
- `cd backend && npm run test:douyin-diagnosis`
- `cd backend && npm run test:quick-plan-input`
- `cd backend && npm run test:quick-plan-generator`
- `cd backend && npm run test:quick-plan-migration`
- `cd backend && npm run test:quick-plan-saved-api`
- `cd backend && npm run test:quick-plan-semantic`
- `cd backend && npm run test:quick-plan-properties`
- `cd backend && npm run test:quick-plan`
- `cd frontend && npm run test:quick-plan-structure`
- `cd frontend && npm run build`
- 线上或本地接口冒烟：体检、计划生成、计划保存、状态更新、复盘保存、洞察读取。
