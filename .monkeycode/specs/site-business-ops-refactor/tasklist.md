# 整站重构开发任务拆解

## 执行说明

- 本任务清单按“先方案确认，再开发”的流程编写。
- 顶级任务代表可交付批次，子任务代表 coding agent 可执行的具体开发动作。
- 标记 `*` 的任务是可选增强项，可在主链路稳定后执行。
- 每个批次完成后需要做老板视角验收，再进入下一批。

## 任务列表

- [x] 1. 确认整站重构方案与实施边界
  - [x] 1.1 核对 `requirements.md` 中的目标用户、经营闭环、页面范围和验收标准。
  - [x] 1.2 核对 `design.md` 中的信息架构、页面结构、数据模型和接口复用策略。
  - [x] 1.3 确认第一条样板链路采用抖音：体检 -> 15 天作战表 -> 执行工具 -> 数据复盘。
  - [x] 1.4 确认第一阶段只做规划文档，用户批准后再进入代码开发。

- [x] 2. 前台展示收口：首页、导航、工具页、会员页
  - [x] 2.1 调整首页首屏文案，突出“每天给老板一张能照着做的经营作战表”。
  - [x] 2.2 将首页首屏 CTA 收口为开始经营体检、查看作战计划、记录今天的数据。
  - [x] 2.3 在首页增加 15 天作战表示例模块，展示 3-5 天样例计划。
  - [x] 2.4 调整首页专项入口，按抖音、小红书、私域展示“先测、再做、再复盘”。
  - [x] 2.5 调整导航文案和入口顺序，围绕经营体检、作战计划、内容成交、数据复盘、经营数据表、会员服务组织。
  - [x] 2.6 将工具页标题和结构调整为经营数据表与工具库。
  - [x] 2.7 将工具页分区调整为经营数据表、诊断后推荐工具、专项模块入口、全部能力索引。
  - [x] 2.8 将会员页首屏调整为经营结果权益表达。
  - [x] 2.9 保留会员页下半部分权限表和现有升级流程。
  - [x] 2.10 检查桌面与移动端布局，确保首屏 CTA、样例作战表和会员权益区域无重叠或裁切。
    - 结论：已通过 `8.4` 桌面端和 `8.5` 移动端真实预览验收补齐检查；首页首屏 CTA、样例作战表、会员权益区域无明显重叠或裁切，宽表采用局部横向滚动承载。
  - [x] 2.11 * 为首页样例作战表提取 `BattlePlanPreview` 组件。
    - 结论：已新增 `frontend/src/components/BattlePlanPreview.vue`，将首页 5 天样例作战表的数据、模板和响应式横向滚动样式从 `Home.vue` 中拆出；`Home.vue` 仅保留组件引用和区块标题。前端 `npm run build` 通过，Vite 完成 772 个模块转换。
  - [x] 2.12 * 为会员经营权益提取 `MembershipOutcomeMatrix` 组件。
    - 结论：已新增 `frontend/src/components/MembershipOutcomeMatrix.vue`，将首页会员经营权益卡片的数据映射、模板和响应式网格样式从 `Home.vue` 中拆出；`Home.vue` 仅保留组件引用和区块标题。前端 `npm run build` 通过，Vite 完成 774 个模块转换。

- [x] 3. 专项模块排序：统一体检到复盘路径
  - [x] 3.1 调整抖音 Hub 顺序为体检、计划、执行、复盘。
  - [x] 3.2 调整抖音 Hub 主线入口，突出经营体检、15 天速胜计划、视频数据诊断、组品定价、转化链路、本地推策略、90 天战略。
  - [x] 3.3 调整小红书 Hub 顺序为体检、计划、执行、复盘。
  - [x] 3.4 调整小红书 Hub 主线入口，突出账号体检、15 天起号计划、笔记数据诊断、账号复盘、转化链路、90 天增长战略。
  - [x] 3.5 调整私域 Hub 主入口，只展示私域运营体检、会员体系、复购留存、社群 SOP、CAC vs LTV、90 天私域战略。
  - [x] 3.6 将低频私域动作合并到私域动作库或从报告推荐进入。
  - [x] 3.7 检查所有专项入口路由可访问，权限提示和升级引导保持现有行为。

- [x] 4. 报告联动：体检报告推荐计划和工具
  - [x] 4.1 梳理抖音体检现有 `recommendedNext`、`suggestions`、`diagnosticProfile` 字段和前端消费位置。
    - 结论：后端 `/api/douyin/diagnosis` 已在规则兜底和模型归一化结果中输出 `recommendedNext`、`suggestions`、`diagnosticProfile`；前端 `DiagnosisAgent.vue` 已展示 `diagnosticProfile` 和 `suggestions`，尚未消费 `recommendedNext`。
  - [x] 4.2 在抖音体检报告页增加“下一步作战动作”区域，推荐 15 天作战表、执行工具和复盘入口。
    - 结论：`DiagnosisAgent.vue` 已消费 `recommendedNext`，将后端推荐映射为作战计划、执行工具、转化工具、投流工具和数据复盘卡片；默认保留 15 天计划和视频数据复盘入口。
  - [x] 4.3 根据最低维度或主短板映射推荐工具组，例如内容、转化、投流、私域、经营计算。
    - 结论：抖音体检报告已按 `weakestDimension` 动态推荐工具组；流量/内容优先选题、脚本、标题、封面和视频复盘，转化/留存优先转化链路、组品定价、脚本和复盘，投流优先本地推策略、视频复盘、转化链路和脚本。
  - [x] 4.4 为进入 15 天计划的跳转携带行业、问题类型、弱项维度和关键数据摘要。
    - 结论：抖音体检报告跳转推荐动作时统一携带 `industry`、`mode`、`source=diagnosis`、`weakness`、`profile`、`confidence`、`metrics`、`bottleneck`、`goal`；15 天计划入口已使用同一套诊断上下文 query。
  - [x] 4.5 小红书体检补齐诊断依据、置信度、推荐动作的展示口径。
    - 结论：后端 `account-diagnosis` 已补齐 `dataBasis`、`confidence`、`diagnosticProfile`、`weakestDimension`、`dimensionDetails`、`recommendedNext`；前端账号体检报告已展示诊断类型、主短板、置信度、诊断依据、评分说明和下一步动作卡片。
  - [x] 4.6 私域体检补齐最低维度、推荐动作和下一步计划入口。
    - 结论：后端 `private/diagnosis` 已输出 `dataBasis`、`confidence`、`diagnosticProfile`、`weakestDimension`、`dimensionDetails`、`recommendedNext`；前端私域体检报告已展示诊断类型、主短板、置信度、诊断依据、评分说明和下一步动作卡片。
  - [x] 4.7 验证报告在数据不足时展示初筛判断、补充提问和风险边界。
    - 结论：抖音、小红书、私域体检报告均已支持低置信度初筛判断、进入计划前补充提问和风险边界展示；小红书与私域后端已补齐 `nextQuestions`、`riskBoundary`，抖音后端已补齐 `riskBoundary`。
  - [x] 4.8 * 将推荐工具映射抽成共享配置，供抖音、小红书、私域复用。
    - 结论：已新增 `frontend/src/constants/diagnosisRecommendations.js`，集中维护抖音、小红书、私域体检报告推荐动作的 code 前缀、默认入口、弱项维度映射和动作卡片元数据；`DiagnosisAgent.vue`、`AccountDiagnosisAgent.vue`、`PrivateDiagnosis.vue` 已统一调用 `getRecommendedDiagnosisActions()`。前端 `npm run build` 通过，Vite 完成 775 个模块转换；共享函数轻量校验通过。

- [x] 5. 抖音 15 天作战表样板链路
  - [x] 5.1 梳理当前抖音 quick-plan 输出结构和页面消费逻辑。
    - 结论：后端 `/api/douyin/quick-plan` 当前输出 `plan.title`、`plan.summary`、`plan.phases[].name`、`plan.phases[].days[]`；每日项只包含 `day`、`action`、`content`、`ad`、`kpi`。前端 `QuickPlanAgent.vue` 只按阶段卡片消费这些字段，尚未读取诊断 query，也未展示阶段、作品类型、视频功能、拍摄方式、执行工具、客户培育、任务状态等表格字段。
  - [x] 5.2 将 15 天计划展示改为表格型作战计划。
    - 结论：`QuickPlanAgent.vue` 已从阶段卡片改为表格型展示，当前表格列为天数、阶段、今日动作、内容方向、投流安排、复盘指标；移动端使用横向滚动承载固定列宽。
  - [x] 5.3 每天计划展示天数、阶段、今日目标、作品类型、视频功能、拍摄方式、选题方向、执行工具、投流计划、客户培育、复盘指标和任务状态。
    - 结论：`QuickPlanAgent.vue` 表格已展示全部 12 个字段；当前通过前端兼容映射从既有 `action`、`content`、`ad`、`kpi` 推导作品类型、视频功能、拍摄方式、执行工具、客户培育和任务状态，后续 `5.8` 可改为后端直接输出完整字段。
  - [x] 5.4 支持从抖音体检报告带入诊断上下文生成或展示计划。
    - 结论：`QuickPlanAgent.vue` 已读取体检报告 query，展示主短板、诊断分型、置信度和关键数据摘要，并根据弱项自动调整核心目标；生成计划时会把 `diagnosisContext` 传给 `/api/douyin/quick-plan`，后端 prompt 已纳入诊断来源、弱项、分型、置信度、数据摘要和用户瓶颈。
  - [x] 5.5 为每日执行工具添加跳转入口，优先接入脚本、标题、封面、投流、私信话术相关现有工具。
    - 结论：`QuickPlanAgent.vue` 已把每日执行工具升级为可点击按钮，按计划内容自动推荐脚本、标题、封面、本地推、投流评估、私信/转化和视频复盘入口；跳转时会透传来源、行业、目标、天数、阶段、内容方向、今日目标和弱项。
  - [x] 5.6 增加任务状态展示：未开始、进行中、已完成、已复盘。
    - 结论：`QuickPlanAgent.vue` 已增加状态图例，并将每日任务状态归一为未开始、进行中、已完成、已复盘四种展示；默认 Day 1 为进行中，其余为未开始，后端返回状态时会兼容映射到对应样式。
  - [x] 5.7 增加计划页的会员升级提示，将高阶权益对应到 90 天战略、投流评估和专家校准。
    - 结论：`QuickPlanAgent.vue` 已将计划结果底部升级提示改为高阶经营权益面板，分别承接 90 天战略、投流评估和专家校准；面板入口已连接 `/douyin/full-strategy`、`/douyin/ad-evaluator` 和 `/membership`。
  - [x] 5.8 * 后端 quick-plan 接口补齐结构化表格输出，减少前端适配逻辑。
    - 结论：后端 `/api/douyin/quick-plan` 已将 AI prompt 和规则兜底统一补齐 15 天表格字段，覆盖 `phase`、`goal`、`workType`、`videoFunction`、`shootingMethod`、`topicDirection`、`executionTool`、`adPlan`、`customerNurture`、`reviewMetrics` 和 `status`，并保留 `action`、`content`、`ad`、`kpi` 兼容旧字段。前端 `QuickPlanAgent.vue` 已优先读取后端结构化字段，旧字段仅作为兜底。后端 `node --check backend/src/routes/douyinAgents.js` 通过，前端 `npm run build` 通过，Vite 完成 775 个模块转换。
  - [x] 5.9 * 增加计划保存能力，用于跨设备继续执行。
    - 结论：已新增 `douyin_quick_plans` 用户计划表，并在抖音 quick-plan 路由下增加已保存计划读取、保存和任务状态更新接口；计划保存按登录用户隔离，并保留行业、目标、频次、投流方式、诊断上下文和完整计划 JSON。`QuickPlanAgent.vue` 已支持自动加载最近保存计划、生成后自动保存、手动保存当前计划，并可在每日任务状态下拉中同步更新保存记录。后端 `node --check` 覆盖 `douyinAgents.js`、`db.js`、`mockDb.js` 通过，前端 `npm run build` 通过，Vite 完成 775 个模块转换。

- [x] 6. 数据复盘中心首期
  - [x] 6.1 新增或调整数据复盘入口，让用户从首页、抖音 Hub、计划表进入复盘。
    - 结论：首页“记录今天的数据”、首页样例作战表第 5 天、抖音 Hub 主线复盘入口和 15 天计划表每日复盘按钮均已统一指向 `/douyin/video-diagnoser`；计划表跳转会透传来源、行业、目标、天数、阶段、内容方向、复盘指标和弱项。
  - [x] 6.2 首期展示执行天数、内容产出、播放、完播、评论、私信、咨询、核销、成交和投流 ROI。
    - 结论：`VideoDiagnoserAgent.vue` 已升级为视频数据复盘页，输入区覆盖执行天数、内容产出、播放、完播、评论、私信、咨询、核销、成交额和投流消耗；结果区新增复盘摘要卡，并展示单条播放、完播率、评论率、私信率、咨询率、核销率和投流 ROI 等核心指标。
  - [x] 6.3 接入现有抖音视频数据诊断或 data-diagnoser 结果，形成下一步建议。
    - 结论：`VideoDiagnoserAgent.vue` 已基于现有复盘诊断结果生成“下一步建议”，按播放/完播、私信/咨询/核销、投流 ROI 和健康放大四类情况分别推荐标题优化、转化链路、投流评估或下一轮 15 天计划，并在跳转时透传复盘来源和关键数据。
  - [x] 6.4 在计划表中展示每日复盘指标入口。
    - 结论：`QuickPlanAgent.vue` 的 15 天计划表已在每日“复盘指标”列展示指标文本和“记录复盘”入口；点击后进入 `/douyin/video-diagnoser`，并透传来源、行业、目标、天数、阶段、内容方向、复盘指标和弱项。
  - [x] 6.5 * 增加复盘记录持久化接口和数据库表。
    - 结论：已新增 `douyin_review_records` 用户复盘记录表，并在抖音数据诊断路由下增加最近复盘读取、复盘列表读取和复盘记录保存接口；记录按登录用户隔离，保存来源上下文、复盘输入、诊断结果、有效内容类型和下一步行动。`VideoDiagnoserAgent.vue` 已支持加载最近复盘、手动保存当前复盘、诊断后自动保存，并在从计划表进入时保留当天复盘上下文。后端 `node --check` 覆盖 `douyinAgents.js`、`db.js`、`mockDb.js` 通过，前端 `npm run build` 通过，Vite 完成 775 个模块转换。
  - [x] 6.6 * 增加有效内容类型统计和下一轮计划建议。
    - 结论：已基于 `douyin_review_records` 最近 20 条复盘记录新增 `/api/douyin/review-records/insights` 洞察接口，按登录用户统计有效内容类型频次、均播、完播率、咨询率、核销率和 ROI，并生成下一轮计划建议、短板判断和行动清单。`VideoDiagnoserAgent.vue` 已展示复盘沉淀面板、有效内容类型排行和“生成下一轮计划”入口；跳转到 `QuickPlanAgent.vue` 时会透传有效内容类型、复盘建议和关键数据摘要，后端 quick-plan prompt 已读取这些上下文生成下一轮 15 天计划。后端 `node --check` 覆盖 `douyinAgents.js`、`mockDb.js` 通过，前端 `npm run build` 通过，Vite 完成 775 个模块转换。

- [x] 7. 会员转化与权限体验统一
  - [x] 7.1 重写会员页首屏权益文案，按免费版、初阶版、进阶版、高阶版表达经营结果。
    - 结论：`Membership.vue` 首屏标题和四档会员卡片已改为经营结果导向：免费版看清经营卡点，初阶版固定基础动作，进阶版进入 15 天作战和复盘，高阶版升级为 90 天增长系统与专家校准。
  - [x] 7.2 调整体检报告升级提示，按内容问题、转化问题、投流问题、经营问题展示对应权益。
    - 结论：`DiagnosisAgent.vue` 已在体检报告“下一步动作”区域增加会员权益建议卡，按最低维度映射内容问题、转化问题、投流问题和经营问题，并分别引导查看内容、转化、投流或经营权益。
  - [x] 7.3 调整计划表升级提示，突出 15 天计划、90 天战略、复盘和专家校准。
    - 结论：`QuickPlanAgent.vue` 计划结果底部升级提示已突出 15 天计划、90 天战略、数据复盘、投流与专家校准，并分别连接 `/douyin/quick-plan`、`/douyin/full-strategy`、`/douyin/video-diagnoser` 和 `/douyin/ad-evaluator`。
  - [x] 7.4 检查未登录、免费用户、不同会员等级访问核心入口时的提示文案。
    - 结论：抖音、小红书、私域三个 Hub 的核心入口锁定提示已统一；未登录用户展示“登录后查看某等级权益”，已登录但会员等级不足时展示“需升级到某等级”，同时保留原有会员页跳转和等级校验逻辑。
  - [x] 7.5 保持现有权限校验接口和会员等级逻辑稳定。
    - 结论：抖音、小红书、私域三个 Hub 的入口锁定判断已统一复用 `canAccessLevel(userStore.memberLevel, agent.level)`，继续沿用 `membership.js` 的会员等级归一、标签和等级顺序；未新增路由守卫或接口约束，保留原有会员页跳转体验。

- [x] 8. 验证、回归与上线准备
  - [x] 8.1 运行前端构建或在可用线上构建环境验证构建结果。
    - 结论：本地前端仍缺少 `node_modules`，已改用线上前端目录 `/home/ubuntu/woying-ai/frontend` 执行 `npm run build`；Vite 生产构建通过，完成 748 个模块转换并生成 `dist` 产物。
  - [x] 8.2 对后端改动文件运行语法检查。
    - 结论：已对后端改动的 JS 文件运行 `node --check`，覆盖 `deep-test-runner.js`、`admin.js`、`auth.js`、`douyinAgents.js`、`generate.js`、`posterGenerator.js`、`privateAgents.js`、`xhsAgents.js`、`ai.js`、`engineRegistry.js`、`failover.js` 和 `kbService.js`，语法检查全部通过。
  - [x] 8.3 运行 `npm run test:douyin-diagnosis` 验证抖音体检样板稳定性。
    - 结论：本地后端因缺少 `express` 依赖无法导入 `douyinAgents.js`；已改用线上后端目录 `/home/ubuntu/woying-ai/backend` 执行同一命令，抖音体检样板测试通过，结果为 2 pass / 0 fail。
  - [x] 8.4 人工检查首页、工具页、会员页、抖音 Hub、抖音体检报告、15 天作战表的桌面端体验。
    - 结论：已在本地构建产物预览环境以 1440px 桌面视口检查首页、工具页、会员页、抖音 Hub、抖音体检报告和 15 天作战表；6 个页面均为 200、无 console error、无横向溢出，首屏截图未发现明显遮挡或错位。截图与检查结果保存在 `/tmp/opencode/woying-desktop-8-4-local/`。
  - [x] 8.5 人工检查首页、工具页、会员页、抖音 Hub、抖音体检报告、15 天作战表的移动端体验。
    - 结论：已在本地构建产物预览环境以 390px 移动视口检查首页、工具页、会员页、抖音 Hub、抖音体检报告和 15 天作战表；6 个页面均为 200、无 console error、无页面级横向溢出，首屏截图未发现明显遮挡或错位。首页样例作战表和会员权限表为局部横向滚动宽表，不影响页面整体移动端布局。截图与检查结果保存在 `/tmp/opencode/woying-mobile-8-5-local/`。
  - [x] 8.6 用老板视角验收五项问题：能否 10 秒知道入口、能否理解诊断依据、能否立刻执行、能否看到结果、能否理解会员价值。
    - 结论：老板视角五项验收通过。首页首屏在 10 秒内明确引导“开始经营体检、查看作战计划、记录今天的数据”；体检页和报告联动任务已覆盖诊断依据、行业基准、置信度、风险边界和下一步动作；15 天计划页能直接生成每天任务并连接执行工具；复盘入口从首页、抖音 Hub 和计划表承接播放、互动、咨询、成交等结果数据；会员页按免费版、初阶版、进阶版、高阶版说明可获得的经营结果。
  - [x] 8.7 线上部署前备份变更文件，部署后检查 HTTPS 入口和 API 健康检查。
    - 结论：已在部署前备份线上前端 `dist`、后端运行路由和服务文件，备份包为 `/home/ubuntu/woying-ai-backups/20260710-221504-site-business-ops-refactor/runtime-before-8-7.tgz`。本地前端重新执行 `npm run build` 通过，Vite 完成 770 个模块转换；已同步前端构建产物、后端 routes/services 运行文件和 `backend/package.json`，并重启 `woying-backend`。部署后 `https://woyai.cn/` 返回 200，首页 HTML 引用当前构建资源；`https://woyai.cn/api/health` 返回 200 和 `status: ok`。
  - [x] 8.8 部署后执行抖音样板链路冒烟：体检、报告、15 天计划、执行工具跳转、复盘入口。
    - 结论：已在 `https://woyai.cn` 执行部署后抖音样板链路冒烟，结果为 7 PASS / 0 FAIL。覆盖 HTTPS 健康检查、年费测试账号登录、抖音 Hub/体检/15 天计划/脚本工具/复盘页面路由 200、抖音体检报告生成、从诊断上下文生成 15 天计划、执行工具脚本生成、复盘数据诊断。冒烟结果保存在 `/tmp/opencode/woying-8-8-smoke-result.json`。

## 检查点

- [x] 检查点 A：方案确认完成，用户批准进入开发。
- [x] 检查点 B：首页、导航、工具页、会员页展示收口完成。
- [x] 检查点 C：抖音 Hub 和抖音体检报告联动完成。
- [x] 检查点 D：抖音 15 天作战表样板链路完成。
- [x] 检查点 E：数据复盘入口和会员转化文案完成。
- [x] 检查点 F：构建、回归、老板视角验收和线上部署准备完成。
