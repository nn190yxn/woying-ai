# 我赢 AI 三方差异决策矩阵

## 基准

- 主仓库：`https://github.com/nn190yxn/woying-ai`
- 基准分支：`woai-ai-v1`
- GitHub 基准提交：`b840a97`
- 线上目录：`/home/ubuntu/woying-ai`
- 本地工作区：`/workspace`
- 线上备份：`/home/ubuntu/woying-backups/20260627-consistency-audit`

## 模块级结论

| 模块 | 线上 vs GitHub | 线上 vs 本地 | 初步决策 | 依据 |
| --- | --- | --- | --- | --- |
| `backend/src/index.js` | 不同 | 一致 | 采用本地/线上 | 线上正在运行，当前本地结构包含新增路由挂载 |
| `backend/src/routes/generate.js` | 不同 | 一致 | 采用本地/线上 | 当前工具链和 AI/RAG 链路更完整 |
| `backend/src/routes/douyinAgents.js` | 不同 | 不同 | 逐段合并 | 线上已部署一版，本地有后续 AI 接入修复 |
| `backend/src/routes/xhsAgents.js` | 不同 | 不同 | 逐段合并 | 线上已部署一版，本地有后续小红书占位收口 |
| `backend/src/routes/privateAgents.js` | 不同 | 一致 | 采用本地/线上 | 私域链路当前更完整 |
| `backend/src/routes/diagnosis.js` | 不同 | 不同 | 采用本地优先 | 本地包含 `stage0` 归一修复 |
| `backend/src/routes/posterGenerator.js` | 不同 | 不同 | 采用本地优先 | 本地包含 AI 失败兜底修复 |
| `frontend/src/api/request.js` | 不同 | 不同 | 采用本地优先 | 本地移除 router 动态导入，统一鉴权和错误处理 |
| `frontend/src/api/index.js` | 线上缺少于 GitHub比较之外 | 不同 | 采用本地优先 | 本地已迁移到集中 `request` |
| `frontend/src/views/ToolPage.vue` | 不同 | 不同 | 采用本地优先 | 本地已做异步组件和 Vite 分包优化 |
| `frontend/vite.config.js` | 不同 | 不同 | 采用本地优先 | 本地已加 `manualChunks` 与预览域名配置 |
| `frontend/src/views/private/*` | 大量不同 | 大量不同 | 采用本地优先 | 本地统一到 `/private/*` 请求链路 |
| `frontend/src/views/xhs/*` | 大量不同 | 大量不同 | 采用本地优先，逐页验接口 | 本地完成占位页接后端 |
| `frontend/src/views/douyin/*` | 大量不同 | 大量不同 | 采用本地优先，逐页验接口 | 本地完成多路由收口 |
| `miniapp/src/*` | 部分缺失/不同 | 线上落后 | 采用 GitHub/本地新版 | 小程序新主线迁移到 `pages-sub` 和 AI 轻营销结构 |

## 线上多出文件初筛

### 归档清理类

- `backend/src/routes/auth.js.bak-20260621-2243`
- `backend/src/services/calculatorEngine.js.backup`
- `frontend/src/views/tools/GrossMarginEducation.vue.backup`

处理：保留在备份归档中，整合主线不保留。

### 疑似小牛育儿混入类

- `backend/src/routes/children.js`
- `backend/src/routes/parenting.js`
- `backend/src/routes/nutrition.js`
- `backend/src/routes/milestone.js`
- `backend/src/routes/assessments.js`
- `backend/src/data/milestoneData.js`
- `backend/src/routes/recommendations.js`

处理：不合入我赢 AI 主线。线上清理前先检查 `backend/src/index.js` 是否引用。

### 旧路径重复类

- `frontend/src/SheetTemplate.vue`
- `frontend/src/ToolDetail.vue`
- `frontend/src/ToolPage.vue`
- `frontend/src/Tools.vue`
- `frontend/src/toolCatalog.js`
- `frontend/src/user.js`

处理：不合入主线。保留 `frontend/src/components/*`、`frontend/src/views/*`、`frontend/src/constants/*` 下的新路径。

### 线上功能候选类

- `backend/src/routes/sheets.js`
- `backend/src/routes/calculatorTools.js`
- `backend/src/routes/spreadsheetTools.js`
- `frontend/src/views/sheets/*ServiceSheet.vue`
- `frontend/src/views/tools/*DouyinGenerator.vue`
- `frontend/src/views/tools/*XiaohongshuGenerator.vue`

处理：若本地已有同名或新版，采用本地；若 GitHub 缺失但线上有功能价值，迁入主线并补路由和目录引用验证。

## 线上缺失文件初筛

### GitHub 旧结构候选

- `backend/src/routes/security.js`
- `miniapp/src/api/security.js`
- `backend/src/services/promptBuilder.js`
- `backend/src/services/resultSchema.js`
- `backend/src/services/toolPayloadNormalizer.js`
- `backend/src/tools/content.js`
- `backend/src/tools/marketing.js`

处理：仅在当前本地和线上仍有引用时恢复；若已被新链路替代，则保留删除状态。

### 小程序新版必须补齐

- `miniapp/src/api/generate.js`
- `miniapp/src/components/ResultCard.vue`
- `miniapp/src/constants/marketing.js`
- `miniapp/src/pages-sub/*`
- `miniapp/src/pages/ai/index.vue`
- `miniapp/src/utils/miniapp.js`

处理：采用 GitHub/本地新版，后续部署小程序时统一同步。

## 直接处理建议

1. 立即修复 `api.woyai.cn` 根路径默认转发，改为 `return 404`。
2. 创建 `woying-ai` 整合分支，以当前本地已验证功能为主要候选，以线上可用代码为补充。
3. 将当前本地 remote 增加 `woying`，指向 `https://github.com/nn190yxn/woying-ai`。
4. 将本地当前修复 cherry-pick 或 patch 到 `woying-ai:woai-ai-v1` 派生分支。
5. 清理线上混入文件前先完成主仓库整合和部署验证。
