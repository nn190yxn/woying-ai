# 我赢 AI 三方一致性整合计划

## 目标

将我赢 AI 的三个状态统一到同一份可追溯代码：

- GitHub 主仓库：`https://github.com/nn190yxn/woying-ai`
- 目标分支：`woai-ai-v1`
- 线上目录：`/home/ubuntu/woying-ai`
- 当前本地工作区：`/workspace`

整合完成后，GitHub、线上服务器、本地工作区应满足：

- 源码一致。
- 构建产物由同一源码生成。
- 线上服务路径明确。
- 小牛育儿和我赢 AI 域名、目录、端口、PM2 服务保持隔离。

## 当前事实

- GitHub 基准提交：`b840a97 fix: miniapp audit issues (P0/P1/P2)`。
- 当前本地 `origin` 指向：`https://github.com/nn190yxn/Alex`。
- 当前本地 `woai-ai-v1` 提交：`6f7551f fix: optimize frontend build chunks`。
- 线上 `woying-backend` 运行路径：`/home/ubuntu/woying-ai/backend/src/index.js`。
- 线上 PM2 状态：`woying-backend` 为 `online`。
- 线上前端入口：`/assets/index-9rbXuo34.js`。
- 当前本地构建入口：`/assets/index-YURBIWAg.js`。
- 线上 `/home/ubuntu/woying-ai` 不是 Git 工作树。

## 已完成备份

服务器备份目录：`/home/ubuntu/woying-backups/20260627-consistency-audit`

- `woying-ai-before-consistency.tar.gz`：整合前我赢 AI 线上目录完整备份，排除 `node_modules` 和 `.git`。
- `api.woyai.cn.before`：整合前小牛 API 域名 Nginx 配置备份。
- `woying-ai.nginx.before`：整合前我赢 AI Nginx 配置备份。

## 三方差异摘要

线上 `/home/ubuntu/woying-ai` 对比 GitHub `nn190yxn/woying-ai:woai-ai-v1`：

- 线上多出关键源码文件：60 个。
- 线上缺少关键源码文件：17 个。
- 同名关键源码内容不同：153 个。

线上 `/home/ubuntu/woying-ai` 对比当前本地工作区：

- 线上多出关键源码文件：42 个。
- 线上缺少关键源码文件：15 个。
- 同名关键源码内容不同：69 个。

## 判定原则

每个不一致项按以下顺序判断归属：

1. 最新版本：优先参考最近完成、已验证、已上线或已构建通过的实现。
2. 功能深度：优先保留能覆盖实际业务链路、AI 生成、兜底、权限、展示闭环的实现。
3. 正确性和清晰度：优先保留逻辑更清晰、职责更单一、请求链路更统一、可维护性更高的实现。

当三个原则冲突时，按以下处理：

- 已上线且正在承载生产流量的能力先保留，再迁移到主仓库。
- 本地已构建通过且解决明确问题的能力优先合入主仓库。
- GitHub 中较旧但结构更清晰的代码作为对照基线，不直接覆盖线上可用能力。
- 疑似误混入项目的文件先标记隔离，不进入主仓库。

## 差异分类和处理策略

### A 类：必须保留并合入主仓库

符合任一条件即归为 A 类：

- 线上正在运行所依赖的我赢 AI 后端入口、路由、服务、配置。
- 当前本地近期完成且构建通过的请求统一、AI 智能体接入、Vite 分包优化。
- 我赢 AI 前端、后端、小程序中仍属于产品主线的功能代码。

处理方式：

- 以本地当前实现和线上可用实现为候选。
- 对同名差异逐文件决策。
- 合并到 `nn190yxn/woying-ai` 的新整合分支。
- 构建和接口验证通过后再部署。

### B 类：需要隔离或清理

符合任一条件即归为 B 类：

- 文件名和领域明显属于小牛育儿，如 `children`、`parenting`、`nutrition`、`milestone`。
- 线上残留备份文件，如 `.backup`、`.bak-*`。
- 旧路径重复文件，如 `frontend/src/ToolPage.vue`、`frontend/src/toolCatalog.js` 这类根层旧副本。

处理方式：

- 先记录清单。
- 确认无引用后移出运行路径或保留在备份中。
- 不合入 `nn190yxn/woying-ai` 主线。

### C 类：以 GitHub 基准为准

符合任一条件即归为 C 类：

- GitHub 中仍存在、线上缺失，但当前产品主线仍需要的文件。
- 当前小程序主线中迁移后的 `pages-sub`、`ai`、`generate` 能力。

处理方式：

- 从 GitHub 或本地当前分支恢复。
- 合入主仓库后统一部署。

### D 类：构建产物

包括：

- `frontend/dist`。
- 未来可能出现的小程序构建产物。

处理方式：

- 不作为源码判断依据。
- 由主仓库源码执行构建生成。
- 线上部署只接受构建后的产物覆盖。

## Nginx 域名隔离处理

当前 `api.woyai.cn` 的默认根路径：

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
}
```

该配置会让 `https://api.woyai.cn/` 返回我赢 AI 页面，造成域名边界混用。

建议改为直接返回 404，保留小牛育儿专属路径继续转发到 3002：

```nginx
location / {
    return 404;
}
```

保留路径：

- `/api/v1/` -> `127.0.0.1:3002/api/v1/`
- `/admin-api/v1/` -> `127.0.0.1:3002/admin-api/v1/`
- `/marketing/` -> `127.0.0.1:3002/marketing/`
- `/admin-console/` -> `127.0.0.1:3002/admin-console/`

验证项：

- `https://api.woyai.cn/` 返回 404。
- `https://api.woyai.cn/api/v1/health` 正常返回小牛健康响应。
- `https://woyai.cn/` 正常返回我赢 AI。
- `https://woyai.cn/api/health` 正常返回我赢 AI 健康响应。

## 执行计划

### 阶段 1：冻结和基线

1. 确认 `nn190yxn/woying-ai` 为唯一主仓库。
2. 将当前本地 remote 调整或新增为 `woying-ai`。
3. 从 `woying-ai:woai-ai-v1` 创建整合分支。
4. 保留服务器备份路径和差异清单。

### 阶段 2：差异归类

1. 逐文件审查线上多出的 60 个文件。
2. 逐文件审查线上缺少的 17 个文件。
3. 逐文件审查同名不同的 153 个文件。
4. 给每个文件标记 A/B/C/D 类和依据。

### 阶段 3：主仓库整合

1. 将 A 类文件合入整合分支。
2. 将 C 类文件保留或恢复。
3. 排除 B 类文件。
4. 确认 `.gitignore` 覆盖 `.env`、私钥、备份、构建临时文件。
5. 运行前端构建和后端语法检查。

### 阶段 4：线上部署

1. 再次创建部署前备份。
2. 上传整合分支源码或构建包到 `/home/ubuntu/woying-ai`。
3. 安装依赖时保持现有线上环境变量不变。
4. 执行 `frontend` 构建。
5. 重启 `woying-backend`。
6. 验证公网健康接口、首页、核心工具页、AI 智能体接口。

### 阶段 5：清理和固化

1. 清理或归档线上 B 类混杂文件。
2. 修正 `api.woyai.cn` 根路径默认转发。
3. 在健康接口加入 commit 或 build version。
4. 更新文档和最终差异报告。

## 回滚方案

如任一步失败：

1. 停止继续覆盖线上文件。
2. 使用 `/home/ubuntu/woying-backups/20260627-consistency-audit/woying-ai-before-consistency.tar.gz` 恢复我赢 AI 目录。
3. 使用 `api.woyai.cn.before` 和 `woying-ai.nginx.before` 恢复 Nginx 配置。
4. 重启对应 PM2 服务。
5. 执行健康检查。

## 当前建议

优先顺序：

1. 先修 `api.woyai.cn` 根路径隔离，风险低、收益明确。
2. 再创建 `nn190yxn/woying-ai` 整合分支。
3. 按 A/B/C/D 分类合并代码。
4. 构建验证通过后统一部署到线上。
5. 部署成功后清理线上混杂文件。
