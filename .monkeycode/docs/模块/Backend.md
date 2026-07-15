# Backend 模块

## 职责

`backend/` 是我赢AI的 Express API 服务，负责用户认证、会员权限、工具执行、AI 生成、知识库注入、支付、数据持久化和运营后台接口。

## 技术栈

- Express 4
- mysql2
- ioredis
- jsonwebtoken
- bcryptjs
- express-validator
- dotenv
- morgan

## 应用入口

`backend/src/index.js` 创建 Express 应用并注册：

- CORS。
- JSON body parser，大小限制 1 MB。
- URL encoded parser。
- 请求日志中间件。
- 性能监控中间件。
- 各 API 路由。
- `/health` 和 `/api/health` 健康检查。
- 全局错误追踪中间件。

默认监听端口为 `process.env.PORT || 3001`。

## 路由模块

主要路由前缀：

- `/api/auth`：登录、注册、验证码和退出。
- `/api/user`：用户资料。
- `/api/tools`：工具列表、配额、运行和历史。
- `/api/generate`：通用工具生成。
- `/api/douyin`：抖音专项智能体。
- `/api/xhs`：小红书专项智能体。
- `/api/private`：私域专项智能体。
- `/api/membership`：会员。
- `/api/payment`：支付。
- `/api/referral`：推荐和返佣。
- `/api/admin`：运营后台。
- `/api/sheets`：用户表格。
- `/api/industries`：行业信息。
- `/api/analytics`：行为分析。
- `/api/token-monitor`：AI token 监控。
- `/api/security`：安全检查。

## 鉴权

通用中间件在 `backend/src/middleware/auth.js`：

- `authMiddleware()` 解析 `Authorization: Bearer <token>`。
- 开发环境默认可启用 guest mode，guest 会员等级为 `annual`。
- 生产环境缺少或无效 token 时返回 401。
- `optionalAuth()` 在存在合法 token 时附加用户信息。

`backend/src/routes/auth.js` 负责 JWT 签发。JWT payload 包含 `userId` 和 `phone`，过期时间来自 `JWT_EXPIRES_IN`，默认 `7d`。

抖音、小红书、私域专项路由内部各自实现 `checkAccess` 和 `requireLevel()`，会读取 JWT、查询用户会员等级并执行等级判断。

## 数据库

`backend/src/models/db.js` 封装 MySQL 连接池：

- 连接信息来自 `DB_*` 或 `MYSQL_*` 环境变量。
- 非生产环境连接失败时进入内存 mock 模式。
- 生产环境查询失败时抛错。

当前显式初始化的表：

- `user_sheets`
- `douyin_quick_plans`
- `douyin_review_records`

内存 mock 实现在 `backend/src/models/mockDb.js`，用于本地无 MySQL 时支撑核心链路运行。

`douyin_quick_plans` 初始化包含 `plan_version` 和 `input_hash`，并在已存在旧表时尝试补齐缺失字段。

## Redis

`backend/src/config/redis.js` 默认使用内存 mock。设置 `USE_REAL_REDIS=true` 后，会尝试通过 `REDIS_URL` 或 `REDIS_HOST` 连接真实 Redis。

验证码注册和登录使用 key `code:<phone>`，有效期 300 秒。

## AI 服务

`backend/src/services/ai.js` 封装 Chat Completions 调用：

- `createChatCompletion()`：底层请求。
- `generateText()`：单 prompt 文本生成。
- `generateStructured()`：system + user prompt 结构化生成。

项目级 AI 环境变量：

- `USER_LLM_API_KEY`
- `USER_LLM_BASE_URL`
- `USER_LLM_MODEL`
- `AI_REQUEST_TIMEOUT`

调用路径会在 base URL 后拼接 `/chat/completions`。

## 知识库服务

`backend/src/services/kbService.js` 负责：

- 根据工具 code 读取 `backend/src/config/kb-mapping.json`。
- 校验知识库路径，防止越界读取。
- 按 section 从 Markdown 中抽取相关内容。
- 基于会员等级和工具复杂度控制上下文长度。
- 使用 5 分钟文件缓存减少重复读取。

默认知识库路径：

- 生产：`/home/ubuntu/woying-ai/knowledge-base`。
- 开发：仓库内 `knowledge-base/`。

## 工具执行

通用工具入口 `backend/src/routes/generate.js` 的 `/api/generate/:toolCode` 会执行：

1. 查找 `TOOL_DEFINITIONS`。
2. 查询用户会员等级。
3. 检查 `backend/src/config/toolAccess.js` 中的工具等级。
4. 基于工具引擎类型做输入校验。
5. 通过 `executeWithFailover()` 执行工具。
6. 记录工具提交、成功或失败事件。
7. 调用 `trackUsage()` 记录使用次数。

## 抖音计划服务边界

`backend/src/services/douyin/` 是抖音 15 天计划链路的服务目录，当前包含：

- `index.js`：抖音计划服务聚合导出入口。
- `quickPlanInput.js`：15 天计划输入归一化辅助，提供行业别名归一、目标推导、诊断上下文字段补齐、标准计划输入和 input hash。
- `quickPlanStrategies.js`：行业和目标策略包，维护餐饮、美业、教培、生活服务的客户类型、默认产品、顾虑、证明素材、转化指标、行动入口、风险边界和禁用词，以及快速起量、成交转化、线索收集、直播预热目标策略。
- `quickPlanTemplates.js`：Day 1 到 Day 15 日任务模板，按测试期、放大期、收割期维护执行意图、内容结构、工具、投流、私信承接和复盘指标意图。
- `quickPlanGenerator.js`：规则计划生成、结果校验和 `goal/action`、`topicDirection/content`、`adPlan/ad`、`reviewMetrics/kpi` 兼容字段补齐。`buildQuickPlanFromTemplates()` 会基于标准输入、行业策略、目标策略和 15 天模板生成完整 QuickPlanResult；`validateQuickPlanResult()` 会用规则计划作为基准补齐 AI 输出或旧结构缺失的顶层字段、每日任务字段、脚本、状态和 meta。
- `quickPlanMigration.js`：保存计划迁移函数，`migrateSavedPlan()` 会解析保存行中的计划 JSON 和诊断上下文，用当前 QuickPlanResult 校验补齐旧计划缺失的 `shootingScript`、`researchBrief`、`riskBoundary` 和 `meta`，并保留已有 day status。

当前 `backend/src/routes/douyinAgents.js` 仍负责抖音专项路由、鉴权、请求响应和数据库读写。`POST /api/douyin/quick-plan` 已调用 `normalizeQuickPlanInput()`、`buildQuickPlanFromTemplates()` 和 `validateQuickPlanResult()`；体检上下文路径快速返回规则计划，手动生成路径会把 AI 输出统一进入 QuickPlanResult 校验补齐。保存计划接口会写入 `plan_version` 和 `input_hash`，读取保存计划时通过 `migrateSavedPlan()` 返回迁移后的展示对象。路由文件内旧 QuickPlan fallback、行业别名归一和目标推导重复逻辑已移除，相关能力统一由 `backend/src/services/douyin/` 承接。

QuickPlan 后端测试入口包含聚合命令 `test:quick-plan`，以及分项命令 `test:quick-plan-input`、`test:quick-plan-generator`、`test:quick-plan-migration`、`test:quick-plan-saved-api`、`test:quick-plan-semantic` 和 `test:quick-plan-properties`。这些脚本覆盖输入归一化、规则生成器协议、保存计划迁移、保存/读取/状态更新接口、语义矩阵和属性断言。

QuickPlan 后端收口验证还需要对 `backend/src/routes/douyinAgents.js` 和 `backend/src/services/douyin/*.js` 执行 `node --check`，再运行 `npm run test:douyin-diagnosis` 与上述 QuickPlan 测试脚本。

## 变更注意点

- 新增后端路由时，需要在 `backend/src/index.js` 注册前缀。
- 新增工具时，需要同步工具定义、权限、前端入口、配额和测试。
- 生产环境数据库查询失败会直接影响接口返回，应先在线下用 mock 和 MySQL 两种路径验证。
- AI 输出必须有规则兜底，保证前端能渲染结构化结果。
- 接口返回错误时优先提供 `message` 或 `error`，便于前端统一展示。
