# 开发者指南

## 环境准备

项目包含三个主要运行目录：

- `frontend/`：Vue 3 Web 前端。
- `backend/`：Express API 服务。
- `miniapp/`：uni-app 微信小程序。

需要准备 Node.js 运行环境。后端和前端都使用 ESM 模块。

## 前端开发

```bash
cd frontend
npm run dev
```

Vite 开发服务器配置：

- host：`0.0.0.0`
- port：`5173`
- allowedHosts：`.monkeycode-ai.online`
- API 代理：`/api` -> `VITE_API_TARGET` 或 `http://localhost:3000`

如果后端运行在默认 `3001`，本地联调推荐设置：

```bash
cd frontend
VITE_API_TARGET=http://localhost:3001 npm run dev
```

前端构建：

```bash
cd frontend
npm run build
```

构建产物输出到 `frontend/dist`。

## 后端开发

```bash
cd backend
npm run dev
```

后端默认端口为 `3001`，可通过 `PORT` 覆盖。

生产启动：

```bash
cd backend
npm start
```

## 小程序开发

```bash
cd miniapp
npm run dev:mp-weixin
```

小程序构建：

```bash
cd miniapp
npm run build:mp-weixin
```

## 关键环境变量

后端数据库：

- `DB_HOST` 或 `MYSQL_HOST`
- `DB_PORT` 或 `MYSQL_PORT`
- `DB_NAME` 或 `MYSQL_DATABASE`
- `DB_USER` 或 `MYSQL_USER`
- `DB_PASSWORD` 或 `MYSQL_PASSWORD`

JWT：

- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Redis：

- `USE_REAL_REDIS=true`
- `REDIS_URL` 或 `REDIS_HOST`

AI：

- `USER_LLM_API_KEY`：项目侧 AI Key。
- `USER_LLM_BASE_URL`：项目侧 AI 服务地址。
- `USER_LLM_MODEL`：项目侧 AI 模型名。
- `AI_REQUEST_TIMEOUT=60000`

知识库：

- `KB_ROOT_PATH=<PATH>`
- `KB_MAX_CONTEXT_CHARS=4500`
- `KB_MAX_FILE_CHARS=1800`

内测验证码：

- `INTERNAL_TEST_VERIFICATION_CODE=<CODE>`

正式公开发布前应清空内测验证码配置。

## 数据库行为

后端 `query()` 首次调用会创建 MySQL 连接池。非生产环境中，如果 MySQL 连接失败，会 fallback 到内存 mock DB。生产环境查询失败会抛错。

`initDB()` 负责准备基础业务表：

- `user_sheets`
- `douyin_quick_plans`
- `douyin_review_records`

抖音计划和复盘接口也包含懒初始化逻辑，接口首次访问时会确保对应表存在。

## 鉴权与会员

前端登录成功后把 token 写入 `localStorage.token`，会员等级写入 `localStorage.memberLevel`。Axios 请求拦截器会自动附加 JWT。

后端有两类鉴权：

- 通用工具使用 `backend/src/middleware/auth.js`。
- 抖音、小红书、私域专项路由内部实现 `checkAccess` 和 `requireLevel`。

会员等级顺序为 `free < starter < pro < annual`。修改权限时需要同步检查：

- `frontend/src/constants/membership.js`
- `backend/src/config/toolAccess.js`
- 专项路由中的 `requireLevel()` 调用
- Hub 页面入口锁定文案和跳转

## AI 工具开发流程

新增或调整 AI 工具时，推荐按以下顺序：

1. 明确工具所属模块和会员等级。
2. 在后端路由或 `generate.js` 中定义输入、权限和输出结构。
3. 如果使用知识库，在 `kbService` 可命中的映射中补齐工具 code。
4. 前端新增或调整页面表单、加载态、错误态和结果渲染。
5. 检查移动端宽表、结果卡片和升级提示是否可读。
6. 添加规则兜底，确保 AI 调用失败时仍返回可渲染结构。
7. 运行语法检查、前端构建和相关冒烟。

抖音样板链路的参考实现：

- 后端：`backend/src/routes/douyinAgents.js`
- 计划页：`frontend/src/views/douyin/QuickPlanAgent.vue`
- 复盘页：`frontend/src/views/douyin/VideoDiagnoserAgent.vue`
- 推荐动作共享配置：`frontend/src/constants/diagnosisRecommendations.js`

## 验证命令

后端语法检查示例：

```bash
node --check backend/src/routes/douyinAgents.js
node --check backend/src/models/db.js
node --check backend/src/models/mockDb.js
```

前端构建：

```bash
cd frontend
npm run build
```

抖音体检测试：

```bash
cd backend
npm run test:douyin-diagnosis
```

通用深测：

```bash
cd backend
npm run deep:test
```

## 线上部署检查

线上目录：`/home/ubuntu/woying-ai`。

PM2 服务：`woying-backend`。

部署前建议备份：

```bash
# 在服务器上创建备份目录
mkdir -p /home/ubuntu/woying-ai-backups/<TIMESTAMP>

# 备份前端构建产物和后端运行文件
tar -czf /home/ubuntu/woying-ai-backups/<TIMESTAMP>/runtime-before.tgz -C /home/ubuntu/woying-ai frontend/dist backend/src/routes/douyinAgents.js backend/src/models/db.js backend/src/models/mockDb.js
```

部署后检查：

```bash
# 检查后端服务状态
pm2 status woying-backend

# 检查健康接口
curl https://woyai.cn/api/health
```

冒烟建议覆盖：

- HTTPS health。
- 登录年费测试账号。
- 抖音 Hub、体检、15 天计划、脚本工具、复盘页面。
- 抖音体检报告生成。
- 诊断上下文生成 15 天计划。
- 计划保存与任务状态更新。
- 复盘保存、读取最近复盘、复盘洞察。

## 常见注意事项

- 前端本地代理默认指向 `http://localhost:3000`，后端默认端口为 `3001`，联调时需要显式设置 `VITE_API_TARGET`。
- `.env`、密钥、数据库密码、支付凭证和 AI Key 不应写入文档或提交记录。
- 工作区经常存在多批次未提交改动，修改前先确认目标文件和范围。
- 线上目录通常不是 Git 仓库，线上部署应通过备份、打包、解包和服务重启完成。
- 规则兜底输出必须保持前端可渲染结构，避免 AI 失败导致页面空结果。
