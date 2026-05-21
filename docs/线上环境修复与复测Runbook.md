# 线上环境修复与复测 Runbook

## 目的

本 Runbook 用于修复线上 `backend/.env` 配置缺口，并在修复后快速验证数据库、AI 网关和核心接口状态。

## 当前已知状态

- 线上项目目录：`/home/ubuntu/woying-ai`
- 线上后端目录：`/home/ubuntu/woying-ai/backend`
- PM2 服务名：`woying-backend`
- 公网健康检查：`http://124.223.3.175/api/health`
- 当前 `npm run check:env` 已复现缺口：缺少 `NODE_ENV` 和数据库完整键组。
- 当前 `npm run smoke:core` 已验证核心接口 HTTP 通过，其中 `festival`、`fission`、`marketing-plan` 仍为 `degraded=true`。

## 安全边界

- 不在聊天、日志或文档中展示真实 `.env` 值。
- 只检查环境变量键名是否存在。
- 修改线上 `.env` 前保留现有文件副本，副本保存在服务器本机受控目录中。
- 修复完成后通过 `npm run check:env` 和 `npm run smoke:core` 验收。

## 需要补齐的键名

### 运行环境

```env
NODE_ENV=production
```

### 数据库配置

使用 `DB_*` 或 `MYSQL_*` 任一完整组合即可。

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=
```

或：

```env
MYSQL_HOST=
MYSQL_PORT=3306
MYSQL_USER=
MYSQL_PASSWORD=
MYSQL_DATABASE=
```

### AI 网关配置

当前线上已存在 AI 主键名，但接口返回 `403 Forbidden`。需要在平台或供应商侧更换为有效凭据，或修复当前凭据的权限、额度、模型访问范围。

```env
MCAI_LLM_API_KEY=
MCAI_LLM_BASE_URL=
MCAI_LLM_MODEL=gpt-5.5
```

可选 fallback：

```env
AI_FALLBACK_API_KEY=
AI_FALLBACK_BASE_URL=
AI_FALLBACK_MODEL=gpt-5.5
```

## 修复步骤

```bash
# 进入线上后端目录
cd /home/ubuntu/woying-ai/backend

# 查看当前键名完整性
npm run check:env

# 备份线上环境文件
cp .env .env.backup.$(date +%Y%m%d%H%M%S)

# 编辑线上环境文件
vim .env

# 再次检查键名完整性
npm run check:env

# 重启后端服务
pm2 restart woying-backend

# 查看服务状态
pm2 list

# 本机核心接口 smoke
npm run smoke:core

# 公网核心接口 smoke
BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core

# 严格验收：发现 degraded=true 时返回失败码
STRICT_DEGRADED=true BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core

# 可选：指定单接口超时时间，单位毫秒
SMOKE_TIMEOUT_MS=30000 STRICT_DEGRADED=true BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core
```

## 验收标准

- `npm run check:env` 中 `runtime` 为 `ok`。
- `npm run check:env` 中 `database` 为 `ok`。
- PM2 中 `woying-backend` 为 `online`。
- `http://124.223.3.175/api/health` 返回 `status=ok`。
- `npm run smoke:core` 所有检查 HTTP 状态为 `ok`。
- `festival`、`fission`、`marketing-plan` 的 `degraded=false`。
- `STRICT_DEGRADED=true BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core` 退出码为 0。
- PM2 日志中没有新的 `AI API error: 403 - Forbidden`。
- PM2 日志中没有新的 MySQL 默认 root 空密码连接失败信息。

## 复测命令

```bash
# 线上本机复测
cd /home/ubuntu/woying-ai/backend
npm run check:env
npm run smoke:core

# 公网复测
BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core

# 公网严格复测
STRICT_DEGRADED=true BASE_URL=http://124.223.3.175 HEALTH_PATH=/api/health npm run smoke:core
```

## 当前保留问题

- `frontend npm install` 报告 `2 moderate severity vulnerabilities`，需单独评估依赖升级影响。
- 线上 `backend/.env` 历史中出现过的真实密钥仍需要在外部控制台轮换。
- 代码仓库历史中的敏感文件清理需要单独评估 `git filter-repo` 或 BFG 流程。
