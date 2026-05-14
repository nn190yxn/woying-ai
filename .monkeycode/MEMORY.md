# 用户指令记忆（精简版）

本文件只保留当前有效主线、硬约束、关键环境、已确认判断和少量历史归档。详细批次流水见 `docs/工程开发进度.md` 与 `docs/全工具公式与知识库基线.md`。

## 当前主线
- 本轮主线是“全量工具治理 / 回退恢复”，按逐一工具审核方式恢复本地、线上当前、线上深度备份三方差异。
- 恢复重点包括：工具智能体命名、公式与阈值、深度输出结构、知识库映射、基线文档。
- 当前已完成 53 个工具恢复：餐饮 9、教培 13、美业 20、营销推广 11。
- 第五批仍在继续；`festival`、`fission`、`marketing-plan` 已确认由 `backend/src/tools/marketing.js` 的 RAG 主链路承载，`meituan` 双链路已收口到后端 template。
- 当前核心判断：抖音、小红书、私域相关工具必须保持“知识库 + AI”主链路，不能误降级成纯模板或纯计算器。

## 强约束
- 线上目录先冻结，不在线上直接盲改业务代码。
- 私钥可以用于 SSH / SCP，但不得读取、打印或展示私钥内容。
- 线上项目目录通常不是 Git 仓库，不在线上做 Git 操作。
- 任何工具恢复都必须逐一审核，不能只抽查重点。
- 每个工具都要核对：代码、知识库映射、公式、阈值、输出结构、恢复依据。
- 工作区必须持续维护 Markdown 基线文档和进度文档。
- 所有结构化结果都要保留升级定制引导文案。
- 所有回复与说明必须使用中文。

## 关键环境
- 本地工作区：`E:\程序开发\我赢AI`
- 线上项目目录：`/home/ubuntu/woying-ai`
- 线上后端目录：`/home/ubuntu/woying-ai/backend`
- 线上 PM2 服务名：`woying-backend`
- 私钥文件：`D:\ChromeDownload\WOYING.pem`
- 本机健康检查：`http://127.0.0.1:3000/health`
- 公网健康检查：`http://124.223.3.175/api/health`
- 最近一次线上备份目录：`/home/ubuntu/woying-ai/backups/kb-ai-restore-20260513101303`

## 当前代码判断
- `backend/src/services/resultSchema.js` 已恢复统一工具结果 schema，工具结果应包含 `status/degraded/meta`。
- `backend/src/services/ai.js` 已恢复 `gpt-5.5` 默认模型、`AI_MAX_RETRIES`、fallback endpoint 和错误分类重试逻辑。
- `backend/src/services/engineRegistry.js` 已恢复 RAG JSON/文本解析、统一包装与 AI 不可用时的 RAG fallback。
- `backend/src/services/failover.js` 已恢复 `isAiAvailabilityError()`、`createRagFallbackResult()` 和 `rule-based-rag` 降级结构。
- `backend/src/routes/douyinAgents.js` 已恢复知识库 + AI 主链路，7 个抖音智能体输出 `engineType=knowledge-ai`、`degraded` 和知识库 meta。
- `backend/src/routes/generate.js` 已恢复 `createContentTools()`、`createMarketingTools()` 注册，`headline/topic/friend/hook/script/festival/fission/marketing-plan` 走 RAG 主链路。
- `backend/src/tools/content.js`、`backend/src/tools/marketing.js`、`backend/src/services/promptBuilder.js` 已从线上快照合并恢复，用于内容/营销 RAG 工具定义和结构化提示词。
- `generate.js` 使用 `getActorId()`、`hasPersistedUser()`、`normalizeToolPayload()` 兼容 guest mode 和前端字段缺省。
- `backend/src/routes/generate.js` 已把误降级工具恢复到 `rag` 覆盖表。
- `backend/src/tools/content.js` 中 `friend`、`hook`、`script` 已回到知识库 + AI 主链路。
- `backend/src/tools/marketing.js` 中 `fission`、`marketing-plan` 已回到知识库 + AI 主链路。
- `backend/src/services/failover.js` 已补齐这些工具的 `rule-based-rag` 兜底。
- `backend/src/routes/generate.js` 中 `meituan` 已补回知识库 + AI 覆盖。
- `festival`、`fission`、`marketing-plan` 当前前端通过 `/api/generate/:toolCode` 调用后端，实际生效定义来自 `backend/src/tools/marketing.js`；三者保持 RAG 主链路，`fission` 和 `marketing-plan` 的 template 兜底已补齐深度结构和风险提示层。
- `meituan` 已统一为前端 `MeituanDiagnoser.vue` 调用 `/api/generate/meituan`，后端 `generate.js` template 承载评分、问题诊断、行动清单、行业对标和风险提示。
- 通用 `roi`、`payback` 当前由前端组件本地计算承载，不走 `calculatorEngine.js`，也不走 `generate.js` 主链路。
- `calculatorEngine.js` 当前保持纯 JS 确定性计算，并在计算完成后用 `kbService.getKBContextWithMeta()` 接入 `kb-mapping.json` 做轻量 KB 增强解释；命中 KB 时追加“知识库参考”章节，并写入 `meta/extra.kbEnhanced` 等元信息。
- 环境变量文件治理：根 `.gitignore` 忽略 `**/.env` 并保留 `**/.env.example`；`backend/.env.example` 维护占位配置。`backend/.env` 已从 Git 索引移除且本地文件保留，后续仍需轮换历史中出现过的真实密钥。
- 新增审计脚本 `backend/scripts/audit-kb-ai-tool-modes.js`，当前结果 `findingCount=0`。
- 抖音智能体链路审计脚本 `backend/scripts/audit-douyin-agents-output.js` 当前结果仍为 0。
- `backend/src/routes/xhsAgents.js` 已恢复 13 个小红书原占位端点为规则知识库结构化输出，17 个 `/api/xhs/*` 后端端点当前均可返回结果。
- `frontend/src/views/xhs/GenericAgent.vue` 已接管 13 个小红书原占位路由，统一调用 `/api/xhs/*` 并渲染结构化结果；13 个旧占位组件文件也已改为 `GenericAgent.vue` 兼容包装，避免误引用时回到旧占位页。
- 小红书 4 个已有专项页 `AccountDiagnosisAgent.vue`、`TopicGeneratorAgent.vue`、`TitleGeneratorAgent.vue`、`ShutiaoCalculatorAgent.vue` 已从前端模拟改为调用后端 `/api/xhs/*`。
- 小红书专项 `/api/xhs/*` 已支持开发环境 guest mode，无 token 或无效 token 时按 `annual` 级别联调；后端本地运行依赖当前通过全局 npm 包和 `backend/node_modules` link 补齐。
- `backend/src/routes/posterGenerator.js` 是独立海报路由，属于知识库 + AI 链路，不走 `/api/generate/:toolCode`。

## 已完成进度
- 本地与线上语法检查已通过。
- 线上已完成最小文件部署、备份、`pm2 restart all`、`/health` 和 `/api/health` 验证。
- 小红书、抖音、私域相关工具的“知识库 + AI”判断已纠偏。
- 前端/后端关于工具降级的误判已通过审计脚本重新收口。

## 接续文件
- `docs/工程开发进度.md`
- `docs/全工具公式与知识库基线.md`
- `docs/5月13日回退恢复执行计划.md`
- `audit-freeze/盘点报告.md`
- `audit-freeze/tool-matrix.json`

## 历史归档
- 首页、导航、视觉结构、会员结构、工具目录等早期前台规则已归档，不再在这里保留逐条流水。
- 计算器、表格、诊断、首页结构等已完成阶段性批次的细节，统一以进度文档和基线文档为准。
- 早期“前 10 个工具无需再确认”这类临时推进规则已失效，不再作为当前约束。
