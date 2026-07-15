# Xhs Growth 模块

## 职责

小红书增长模块负责账号体检、起号计划、选题、标题、脚本、封面、笔记诊断、账号复盘、投放策略、转化优化、竞对分析和 IP 工具。前端入口是 `/xhs`，后端接口前缀是 `/api/xhs`。

## 前端入口

主要页面：

- `frontend/src/views/XhsAgentHub.vue`：小红书模块 Hub。
- `frontend/src/views/xhs/AccountDiagnosisAgent.vue`：账号体检。
- `frontend/src/views/xhs/QuickStartPlanAgent.vue`：15 天起号计划。
- `frontend/src/views/xhs/GrowthStrategyAgent.vue`：90 天增长战略。
- `frontend/src/views/xhs/TopicGeneratorAgent.vue`：爆款选题库。
- `frontend/src/views/xhs/ScriptGeneratorAgent.vue`：正文脚本。
- `frontend/src/views/xhs/TitleGeneratorAgent.vue`：标题生成器。
- `frontend/src/views/xhs/CoverHelperAgent.vue`：封面文案助手。
- `frontend/src/views/xhs/NoteDiagnoserAgent.vue`：笔记数据诊断。
- `frontend/src/views/xhs/AccountReviewerAgent.vue`：账号复盘。
- `frontend/src/views/xhs/SeoOptimizerAgent.vue`：SEO 关键词优化。
- `frontend/src/views/xhs/ConversionOptimizerAgent.vue`：转化链路优化。
- `frontend/src/views/xhs/CompetitorAnalyzerAgent.vue`：竞对分析器。
- `frontend/src/views/xhs/GrassConverterAgent.vue`：种草转化计算器。
- `frontend/src/views/xhs/ShutiaoCalculatorAgent.vue`：薯条投放计算器。
- `frontend/src/views/xhs/JuguangStrategyAgent.vue`：聚光投放策略。
- `frontend/src/views/xhs/IPPositioningAgent.vue`：博主 IP 定位。
- `frontend/src/views/xhs/IPConsistencyAgent.vue`：人设一致性检查。

## 后端入口

后端文件：`backend/src/routes/xhsAgents.js`。

该文件读取结构化知识文件：`knowledge-base/structured/xhs/xhs-knowledge.json`，并为多个工具提供规则兜底。

## 接口与权限

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

## 规则兜底

`xhsAgents.js` 中已实现多个兜底生成器：

- 选题兜底：基于行业、受众、方法和热点生成选题。
- 标题兜底：基于公式库生成标题。
- 起号计划兜底：按周拆分账号基建、放量和转化承接。
- 脚本兜底：按脚本模板拆分步骤。
- 封面兜底：输出色彩、布局、字体和 hook。

## 变更注意点

- 修改小红书知识结构时，需要同步检查 `knowledge-base/structured/xhs/xhs-knowledge.json` 的字段。
- 新增小红书工具要同步前端路由、Hub 卡片、后端权限和接口文档。
- 账号体检报告应保持诊断依据、置信度、主短板和下一步动作展示。
