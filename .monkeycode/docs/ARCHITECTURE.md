# 系统架构

## 总体架构

项目采用前后端分离架构。前端是 Vue 3 单页应用，负责路由、会员入口、工具表单和结果展示；后端是 Express API 服务，负责鉴权、会员权限、AI 调用、知识库检索、工具执行、持久化和支付相关接口。

```text
Browser
  -> Vue 3 + Vite frontend
  -> /api request proxy or production gateway
  -> Express backend
  -> MySQL or in-memory mock DB
  -> Redis or in-memory mock Redis
  -> AI chat completions provider
  -> knowledge-base markdown files
```

## 前端架构

前端目录：`frontend/`。

主要技术栈：

- Vue 3
- Vue Router 4
- Pinia
- Axios
- ECharts
- Vite

关键文件：

- `frontend/src/main.js`：前端入口。
- `frontend/src/router/index.js`：路由配置、标题设置、登录和管理员入口拦截。
- `frontend/src/api/request.js`：Axios 实例，默认 `baseURL` 为 `/api`，自动注入 `Authorization: Bearer <token>`。
- `frontend/src/stores/user.js`：用户登录状态、会员等级、管理员判断。
- `frontend/src/stores/quota.js`：工具配额读取与本地扣减状态。
- `frontend/src/constants/membership.js`：前端会员等级顺序和访问判断。
- `frontend/vite.config.js`：Vite 别名、开发服务器、API 代理和构建分包配置。

前端核心路由：

- `/`：首页。
- `/tools`：工具库。
- `/membership`：会员页。
- `/douyin`：抖音增长智能体 Hub。
- `/douyin/diagnosis`：抖音体检。
- `/douyin/quick-plan`：15 天速胜计划。
- `/douyin/video-diagnoser`：视频数据复盘。
- `/xhs`：小红书增长智能体 Hub。
- `/private`：私域运营智能体 Hub。
- `/admin`：运营后台，路由层要求登录且会员等级达到 annual。

## 后端架构

后端目录：`backend/`。

主要技术栈：

- Express 4
- mysql2
- ioredis
- jsonwebtoken
- bcryptjs
- express-validator
- dotenv

关键文件：

- `backend/src/index.js`：Express 应用入口，注册中间件、路由和健康检查。
- `backend/src/models/db.js`：MySQL 连接池、mock DB fallback、基础表初始化。
- `backend/src/models/mockDb.js`：本地内存 mock 数据库。
- `backend/src/middleware/auth.js`：通用 JWT 鉴权中间件，开发环境可启用 guest mode。
- `backend/src/routes/auth.js`：注册、登录、验证码、退出。
- `backend/src/routes/tool.js`：工具列表、配额、运行和历史。
- `backend/src/routes/generate.js`：通用工具生成入口 `/api/generate/:toolCode`。
- `backend/src/routes/douyinAgents.js`：抖音专项智能体和复盘持久化。
- `backend/src/routes/xhsAgents.js`：小红书专项智能体。
- `backend/src/routes/privateAgents.js`：私域专项智能体。
- `backend/src/services/ai.js`：AI Chat Completions 调用封装。
- `backend/src/services/kbService.js`：知识库检索和 prompt 上下文注入。

后端注册的 API 前缀：

- `/api/auth`
- `/api/user`
- `/api/tools`
- `/api/membership`
- `/api/payment`
- `/api/referral`
- `/api/diagnosis`
- `/api/admin`
- `/api/cron`
- `/api/generate`
- `/api/generate/poster`
- `/api/sheets`
- `/api/analytics`
- `/api/industries`
- `/api/douyin`
- `/api/xhs`
- `/api/private`
- `/api/user-feedback`
- `/api/poster-generator`
- `/api/feedback`
- `/api/token-monitor`
- `/api/security`

## 数据层

后端通过 `backend/src/models/db.js` 连接 MySQL。默认连接配置读取项目环境变量：

- `DB_HOST` 或 `MYSQL_HOST`
- `DB_PORT` 或 `MYSQL_PORT`
- `DB_NAME` 或 `MYSQL_DATABASE`
- `DB_USER` 或 `MYSQL_USER`
- `DB_PASSWORD` 或 `MYSQL_PASSWORD`

当 MySQL 在非生产环境不可用时，代码会切换到 `mockDb.js` 的内存实现。生产环境查询失败会抛错。

当前 `initDB()` 会确保以下表存在：

- `user_sheets`：用户表格数据。
- `douyin_quick_plans`：登录用户最近一份抖音 15 天计划。
- `douyin_review_records`：登录用户抖音复盘记录。

`douyinAgents.js` 内也会在接口访问时懒初始化 `douyin_quick_plans` 和 `douyin_review_records`，确保新增抖音链路能独立落表。

## 缓存与验证码

`backend/src/config/redis.js` 默认使用内存 mock Redis。设置 `USE_REAL_REDIS=true` 后，会尝试通过 `REDIS_URL` 或 `REDIS_HOST` 连接真实 Redis。

验证码登录和注册会把验证码写入 `code:<phone>`，有效期 300 秒。开发环境允许测试验证码；线上内测验证码由 `INTERNAL_TEST_VERIFICATION_CODE` 控制，正式公开发布前应清空。

## AI 与知识库

AI 调用集中在 `backend/src/services/ai.js`。项目侧应优先配置：

- `USER_LLM_API_KEY`
- `USER_LLM_BASE_URL`
- `USER_LLM_MODEL`
- `AI_REQUEST_TIMEOUT`

接口使用 Chat Completions 格式，并在 base URL 后拼接 `/chat/completions`。

知识库服务位于 `backend/src/services/kbService.js`。生产环境默认知识库路径为 `/home/ubuntu/woying-ai/knowledge-base`，开发环境默认使用仓库内 `knowledge-base/`。可通过 `KB_ROOT_PATH` 覆盖。

## 权限模型

会员等级从低到高：

- `free`
- `starter`
- `pro`
- `annual`

前端用 `frontend/src/constants/membership.js` 判断页面和入口是否可访问。后端通用工具用 `backend/src/config/toolAccess.js` 判断工具所需等级。抖音、小红书、私域专项路由各自实现 `checkAccess` 和 `requireLevel`，基于 JWT 中的 `userId` 查询用户会员等级。

## 抖音样板链路

抖音模块是当前重构后的样板闭环：

1. `/douyin/diagnosis` 调用 `/api/douyin/diagnosis` 生成经营体检。
2. 体检报告携带诊断上下文跳转 `/douyin/quick-plan`。
3. `/api/douyin/quick-plan` 输出 15 天表格型作战计划。
4. `/api/douyin/quick-plan/saved` 按用户保存最近一份计划。
5. 每日任务可跳到脚本、标题、封面、投流、转化和复盘工具。
6. `/douyin/video-diagnoser` 调用 `/api/douyin/data-diagnoser` 做复盘诊断。
7. `/api/douyin/review-records` 保存复盘记录。
8. `/api/douyin/review-records/insights` 基于最近 20 条复盘输出有效内容类型和下一轮计划建议。

## 部署形态

线上目录：`/home/ubuntu/woying-ai`。

线上后端服务由 PM2 管理，服务名为 `woying-backend`。前端构建产物来自 `frontend/dist`，由线上 Web 服务承载。

部署前应备份线上 `frontend/dist` 和被覆盖的后端运行文件。最近一次部署使用的备份目录格式为 `/home/ubuntu/woying-ai-backups/<timestamp>/`。
