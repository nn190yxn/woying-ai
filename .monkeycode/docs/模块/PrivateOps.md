# Private Ops 模块

## 职责

私域运营模块负责私域体检、会员体系、复购留存、社群 SOP、裂变、CAC vs LTV 和 90 天私域战略。前端入口是 `/private`，后端接口前缀是 `/api/private`。

## 前端入口

主要页面：

- `frontend/src/views/PrivateAgentHub.vue`：私域模块 Hub。
- `frontend/src/views/private/PrivateDiagnosis.vue`：私域运营体检。
- `frontend/src/views/private/MemberDesign.vue`：会员体系设计。
- `frontend/src/views/private/RetentionPlan.vue`：复购留存方案。
- `frontend/src/views/private/FissionPlan.vue`：裂变方案。
- `frontend/src/views/private/CommunitySop.vue`：社群 SOP。
- `frontend/src/views/private/CACvsLTV.vue`：CAC vs LTV 分析。
- `frontend/src/views/private/FullStrategy.vue`：90 天私域战略。
- 其他私域工具包括活动策划、活跃度提升、等级定价、忠诚度计划、储值方案、流失预警、沉睡客户激活、转介绍系统和私域数据看板。

## 后端入口

后端文件：`backend/src/routes/privateAgents.js`。

该模块会读取私域专项知识库目录：`knowledge-base/07_私域运营专项库`，并按理论层、实操场景、标准执行、案例库和话术库组织内容。

## 接口与权限

- `POST /api/private/diagnosis`：私域运营体检，`free`。
- `POST /api/private/member-design`：会员体系设计，`pro`。
- `POST /api/private/retention-plan`：复购留存，`pro`。
- `POST /api/private/fission-plan`：裂变方案，`annual`。
- `POST /api/private/community-sop`：社群 SOP，`starter`。
- `POST /api/private/cac-ltv`：CAC vs LTV，`free`。
- `POST /api/private/full-strategy`：90 天私域战略，`annual`。

## 行业基准

`privateAgents.js` 内置 `INDUSTRY_BENCHMARKS`，当前覆盖：

- 餐饮。
- 教培。
- 美业。
- 生活服务。

基准字段包括流量、运营、转化、留存、裂变、客单价、消费频次、留存目标、沉睡阈值、会员日和储值档位。

## 体检输出

私域体检会根据痛点数量、当前数据完整度和行业基准生成：

- 雷达评分。
- 最低维度。
- 平均分。
- 行业基准对比。
- 建议动作。
- 数据依据。
- 置信度。
- 后续追问。
- 风险边界。
- 推荐下一步工具。

## 知识库读取

模块内的 `loadKB()` 会读取：

- `理论层/*.md`
- `实操场景/*.md`
- `标准执行/*.md`
- `案例库/*.md`
- `话术库/*.md`

`parseKPIFromKB()` 会从匹配行业的知识库表格中提取核心 KPI。

## 变更注意点

- 私域知识库目录路径当前在代码中解析为 `backend/src/../../knowledge-base/07_私域运营专项库`，改动目录结构时需要同步检查路径。
- 私域体检与前端推荐动作共享 `diagnosisRecommendations.js`，改推荐逻辑时要同步抖音、小红书、私域三条链路。
- 高阶私域战略和裂变方案要求 `annual`，入口文案和接口权限应一致。
