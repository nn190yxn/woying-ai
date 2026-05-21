# 用户指令记忆（精简版）

本文件只保留当前有效主线、硬约束、关键环境、已确认判断和少量历史归档。详细批次流水见 `docs/工程开发进度.md` 与 `docs/全工具公式与知识库基线.md`。

## 当前主线
- 本轮主线是"上线前工具架构收口"，已完成 7 个阶段全部执行。
- 收口重点：统一外层协议、Knowledge-AI 共享执行层、测试口径修正、鉴权 guest mode 统一、后续新增工具规则。
- 当前状态：小红书/抖音/私域端点均具备 `status/degraded/summary/sections/actions/riskNotes/meta/result` 双层结构。
- `result` 内层保留领域字段（radar/totalScore/diagnosis/suggestions/phases/recommendedTiers 等），前端页面不因结构收口而断裂。
- G/H/I/J 测试 payload 已与 CALCULATORS 输入协议对齐，missing 字段全部清零。
- `knowledge-ai` engine 已在 `engineRegistry.js` 注册，支持 KB 检索 + AI 生成 + fallback + 统一外层 + 领域内层。
- 本轮是上线前最后一次结构性调整，后续只允许做工具级优化，不再做全站结构改造。
- 上线前最后一次全局修复应先做 `generate` 工具输入协议治理，再做私域剩余旁路收口，所有线上执行必须具备备份、回测、回滚三件套。

## 上线后新增工具规则
- 新增普通工具必须走 `/api/generate/:toolCode`。
- 新增计算器必须登记 `CALCULATORS.inputs`，并同步测试 payload。
- 新增小红书/抖音/私域工具必须走 Knowledge-AI 共享执行层或已定义兼容层。
- 后续不得新增独立结果协议。
- 后续不得绕过统一外层协议。
- 后续不得新增独立工具执行体系。
- 后续不得把高阶 AI 工具降级成纯规则模板。

## 强约束
- 线上目录先冻结，不在线上直接盲改业务代码。
- 线上部署过程中如果发现线上代码、配置或结构与本地存在差异，必须先做备份，再做对应改动。
- 私钥可以用于 SSH / SCP，但不得读取、打印或展示私钥内容。
- 线上项目目录通常不是 Git 仓库，不在线上做 Git 操作。
- 任何工具恢复都必须逐一审核，不能只抽查重点。
- 每个工具都要核对：代码、知识库映射、公式、阈值、输出结构、恢复依据。
- 工作区必须持续维护 Markdown 基线文档和进度文档。
- 所有结构化结果都要保留升级定制引导文案。
- 所有回复与说明必须使用中文。

## 关键环境
- 线上项目目录：`/home/ubuntu/woying-ai`
- 线上后端目录：`/home/ubuntu/woying-ai/backend`
- 线上 PM2 服务名：`woying-backend`
- 公网健康检查：`http://124.223.3.175/api/health`
- 本地后端端口：3001

## 当前代码判断
- `backend/src/services/resultSchema.js` 新增 `createDomainToolResult()`，支持外层统一 + 内层领域保留。
- `backend/src/services/engineRegistry.js` 新增 `knowledge-ai` engine，支持 KB 检索 + AI 生成 + fallback + 双层结构。
- `backend/src/routes/xhsAgents.js` 所有端点已加 `createDomainToolResult` 包装，保留 `result` 领域字段。
- `backend/src/routes/douyinAgents.js` 所有端点已加 `createDomainToolResult` 包装，鉴权补齐 guest mode。
- `backend/src/routes/privateAgents.js` 所有端点已加 `createDomainToolResult` 包装，鉴权补齐 guest mode。
- `backend/src/routes/privateAgents.js` 中剩余的私域 KPI 解析已开始继续收口，当前通过 `getIndustrySceneDocs()` + `parseMarkdownTableMap()` 统一处理行业场景文档与 Markdown 表格提取。
- `backend/src/routes/privateAgents.js` 的私域知识库摘要访问已继续收口到 `getPrivateKbFileNames()` 和 `getSceneSummariesByIndustry()`，后续私域改动应优先复用这些辅助函数，继续减少对 `kb` 目录镜像的散落直读。
- 前端抖音/私域页面应优先复用 `@/api/request`，避免继续使用原生 `fetch('/api/...')` 手写 token 和错误处理；批次 C 已把主要页面请求层收平。
- `frontend/src/views/douyin/DiagnosisAgent.vue` 现已真实消费 `/douyin/diagnosis` 的统一结果协议，后续抖音体检页改动应围绕后端 `result.radarData` 到页面 `radar` 的映射继续演进。
- `backend/src/routes/douyinAgents.js` 中 `runKnowledgeAiAgent()` 已增加一次“解析失败重试”；后续若继续治理抖音诊断波动，优先从更强 JSON 约束或 AI SDK 结构化输出能力入手。
- `buildDiagnosisFallback()` 现在支持 `painPoints` 对象输入，后续同类 fallback 逻辑也应优先兼容对象型字段，而不是只按扁平数组处理。
- `backend/src/routes/douyinAgents.js` 的 `parseJsonObject()` 已增加轻量 JSON 脏输出清洗，优先处理代码块包裹、中文引号和尾随逗号；后续新增结构化 AI 路由时可复用同样思路。
- `backend/src/services/ai.js` 已支持可选 `responseFormat`；当前在 `douyin/diagnosis`、`douyin/product-pricing`、`douyin/content-planner`、`douyin/script-generator`、`douyin/data-diagnoser` 与 `douyin/full-strategy` 上接入 `responseFormat: { type: 'json_object' }` 均已验证有效，并且对不支持该参数的上游会自动回退为普通请求。
- `backend/src/routes/douyinAgents.js` 已增加 `STRUCTURED_OUTPUT_AGENTS` 集合，用于集中管理结构化输出推广路由；后续继续扩路由时优先沿用这条收口路径。
- 结构化输出推广顺序优先选择“输出 shape 简单、fallback 形状稳定、页面消费简单”的抖音 Knowledge-AI 路由；当前验证顺序为 `diagnosis -> product-pricing -> content-planner -> script-generator -> data-diagnoser -> full-strategy`。
- `frontend/src/views/douyin/ScriptGeneratorAgent.vue` 已接入 `/api/douyin/script-generator`，当前页面通过 `result.script` 映射 `title / duration / template / scenes / tips`。
- `frontend/src/views/douyin/VideoDiagnoserAgent.vue` 已接入 `/api/douyin/data-diagnoser`，当前页面通过 `result.analysis` 映射 `metrics / conclusion / actions / levelText`。
- `frontend/src/views/douyin/FullStrategyAgent.vue` 已接入 `/api/douyin/full-strategy`，当前页面通过 `result.phases / result.upgradePath` 映射阶段卡片结构。
- 抖音前端真实接线时，优先复用现有页面 UI，只做结果映射层改造，避免在同一批次同时重做视觉结构。
- 抖音前端真实接线完成后，线上轻量联调至少核对两类证据：页面 chunk 资源 `HTTP 200` 可访问，以及对应后端接口返回 `status=ok`、`degraded=false`、领域 `result` key 完整。
 - 当前阶段的最终工作节点以“可交付甲方团队进行全面人工内测”为标准；交付前需确保结构稳定、全接口稳定、无回退、无系统问题、无结构问题、无明显功能 bug，并以此口径组织批次目标、验收标准和回归要求。
 - 全项目 126 个接口（含核心业务 57 个、已挂载辅助 57 个、补挂 12 个）已完成逐一内测与修复，P1 路由挂载问题已闭环，当前达到全面内测交付条件。
 - `data-diagnoser` 在结构化输出推广首轮中出现过“稳定但领域 shape 被拍平”的情况；后续推广新路由时，除了检查 `degraded`，还要同步核对 `result` 内层 shape 是否与目标页面协议一致。
- `full-strategy` 在结构化输出推广中表现为“结构正确、低频尾部抖动”；这类长文本多阶段输出路由应以结构正确和多轮复查稳定为主要验收标准，不必为偶发单次抖动做过度调参。
- `backend/scripts/deep-test-runner.js` 已增加输入协议校验、领域结构识别、INPUT_MISMATCH/DEGRADED/STRUCTURE_COMPAT 状态。
- G/H/I/J 测试 payload 已修正为与 `CALCULATORS.inputs` 一致。
- 线上 `degraded=true` 生成类工具当前主因是输入缺参触发 failover，后续治理优先核对 `CALCULATORS.inputs`、前端表单字段和 smoke/deep-test payload 一致性。
- 输入协议治理应把运行时归一化和深测校验共用同一模块，当前已通过 `backend/src/services/toolPayloadNormalizer.js` 收口，避免运行链路和测试链路再次分叉。
- 线上最小同步应优先采用“只打本轮改动文件”的部署包策略；同步后必须同时执行本机 smoke、公网 strict smoke 和目标日志筛查，确认新请求已从 `degraded=true` 收敛到 `degraded=false`。

## 接续文件
- `docs/工程开发进度.md`
- `docs/全工具公式与知识库基线.md`
- `docs/上线前工具架构收口执行方案.md`
- `docs/全量工具专业度深度测试方案.md`
- `docs/线上环境修复与复测Runbook.md`
- `docs/线上验收执行记录.md`

## 历史归档
- 首页、导航、视觉结构、会员结构、工具目录等早期前台规则已归档。
- 计算器、表格、诊断、首页结构等已完成阶段性批次的细节，统一以进度文档和基线文档为准。
- 早期临时推进规则已失效，不再作为当前约束。
