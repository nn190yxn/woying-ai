# 我赢AI分组审阅报告

> 作者：Monkeycode  
> 日期：2026-08-29  
> 性质：只读审阅；未执行 `git add`、提交、推送、删除、部署或迁移。

## 总体

当前工作树包含多个阶段的合并改动：112个已跟踪修改、94个未跟踪条目，暂存区为空。建议提交前按依赖和验收证据拆分，不按目录机械提交。

## 分组一：平台基础设施

**范围**：机构权限、私有文件存储、异步任务与Worker。

**代表文件**：

- `backend/src/services/organization.js`
- `backend/src/services/privateStorage.js`
- `backend/src/services/fileStorageAdapter.js`
- `backend/src/services/asyncTasks.js`
- `backend/src/workers/asyncTaskWorker.js`
- `backend/src/routes/organizations.js`
- `backend/src/routes/storage.js`
- `backend/src/routes/asyncTasks.js`
- `backend/src/models/db.js`
- `backend/src/models/mockDb.js`
- `backend/scripts/organization-*.test.js`
- `backend/scripts/file-*.test.js`
- `backend/scripts/async-task-*.test.js`

**证据**：平台基础能力任务1-4完成；异步专项、机构/存储/增长/媒体/渠道回归及Quick Plan回归通过；未执行线上迁移。

**审阅重点**：`backend/src/index.js`和`backend/src/models/mockDb.js`同时承载多个阶段改动，需按补丁块确认，不宜独立归组。

## 分组二：知识与儿童培训经营闭环

**范围**：知识治理、结构化检索、AI Runner、获客、销售教练、顾问、服务和成果。

**代表文件**：

- `backend/src/services/knowledgeGovernance.js`
- `backend/src/services/kbService.js`
- `backend/src/services/aiRunner.js`
- `backend/src/services/acquisition/`
- `backend/src/services/salesCoach/`
- `backend/src/services/advisor.js`
- `backend/src/services/serviceDelivery/`
- `backend/src/services/results.js`
- `backend/src/routes/acquisition.js`
- `backend/src/routes/salesCoach.js`
- `backend/src/routes/advisor.js`
- `backend/src/routes/services.js`
- `backend/src/routes/results.js`
- `backend/scripts/knowledge-governance.test.js`
- `backend/scripts/structured-kb.test.js`
- `backend/scripts/core-business-loop.test.js`
- `frontend/src/api/growth.js`
- `frontend/src/stores/organization.js`
- `frontend/src/views/growth/`

**证据**：知识系统任务1-8和儿童培训经营闭环已完成；知识、AI Runner、顾问触发、服务交付和前端闭环均有专项验收。

**审阅重点**：`backend/src/index.js`、`backend/src/models/mockDb.js`、`README.md`和导航路由同时包含平台与运营改动，需要保留完整依赖链。

## 分组三：运营语言与界面体验

**范围**：面向客户的经营语言、错误提示、导航、会员、诊断、抖音/小红书/私域/工具页面及响应式样式。

**代表文件**：

- `frontend/src/views/Home.vue`
- `frontend/src/views/Diagnosis*.vue`
- `frontend/src/views/Membership.vue`
- `frontend/src/views/DouyinAgentHub.vue`
- `frontend/src/views/douyin/`
- `frontend/src/views/xhs/`
- `frontend/src/views/private/`
- `frontend/src/views/tools/`
- `frontend/src/components/`
- `frontend/src/router/index.js`
- `frontend/src/constants/operationsLanguage.js`
- `frontend/scripts/*operations*.test.js`
- `backend/src/routes/diagnosis.js`
- `backend/src/routes/douyinAgents.js`
- `backend/src/services/douyin/`

**证据**：前端运营专项34/34、生产构建770 modules、最终扫描38项分类完成；浏览器8路由×3视口共24次检查，横向溢出均为0。

**审阅重点**：`frontend/src/router/index.js`同时承担权限保护和客户入口收口；抖音、小红书、私域旧路由需保留兼容，不应只按客户入口删除。

## 分组四：规格与验收文档

**范围**：设计规格、任务清单、项目README、运行手册、验收报告和交付记录。

**代表文件**：

- `.monkeycode/specs/platform-foundation/`
- `.monkeycode/specs/local-life-knowledge-os/`
- `.monkeycode/specs/sitewide-operations-copy/`
- `.monkeycode/specs/child-training-growth-platform/`
- `.monkeycode/docs/`
- `docs/superpowers/specs/`
- `README.md`
- `.monkeycode/tasks/delivery-audit/`

**审阅重点**：`tasklist.draft.md`属于草稿；`.superpowers/*/content/`属于设计过程产物；`.monkeycode/任务记忆.md`和`.ohmyagent/AGENTS.md`是否纳入正式交付需由负责人确认。

## 不纳入任何提交组

- `backend/storage/private/`：本地测试私有文件，已加入忽略规则
- `frontend/audit-output.txt`、`frontend/build-final.txt`：本地输出，已加入忽略规则
- `.monkeycode/tmp-task10-*.js`：一次性验收脚本，已加入忽略规则
- `.superpowers/**/state/`：本地进程状态，已加入忽略规则
- `.ohmyagent/settings.json`：本机工具设置，已加入忽略规则

## 推荐审阅顺序

1. 先确定四组的业务提交边界和交叉文件归属。
2. 对每组分别查看暂存后的补丁和最小测试证据。
3. 复核忽略文件、敏感字段和本地生成物。
4. 最后再决定是否暂存、提交、推送或发布。
