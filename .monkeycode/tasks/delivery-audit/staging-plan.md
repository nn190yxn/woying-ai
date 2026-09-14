# 我赢AI逐文件暂存计划

> 作者：Monkeycode  
> 日期：2026-08-29  
> 说明：计划文件，不执行 `git add`、提交、推送、删除、部署或迁移。

## 使用原则

- 当前暂存区为空。
- 先按组查看 `git diff`，确认无敏感数据后再暂存。
- 公共交叉文件必须人工按补丁块审阅；不要用整文件自动归组。
- 已被 `.gitignore` 排除的本地生成物不进入暂存计划。

## 组一：平台基础设施

建议暂存路径：

```text
backend/src/models/advisorSchema.js
backend/src/models/featureSchema.js
backend/src/models/salesSchema.js
backend/src/models/serviceSchema.js
backend/src/routes/organizations.js
backend/src/routes/storage.js
backend/src/routes/asyncTasks.js
backend/src/routes/productEvents.js
backend/src/services/organization.js
backend/src/services/fileStorageAdapter.js
backend/src/services/fileCleanupTask.js
backend/src/services/privateStorage.js
backend/src/services/asyncTasks.js
backend/src/services/mediaTasks.js
backend/src/workers/asyncTaskWorker.js
backend/scripts/organization-*.test.js
backend/scripts/file-*.test.js
backend/scripts/async-task-*.test.js
backend/scripts/file-cleanup-task.test.js
backend/scripts/async-task-worker-lifecycle.test.js
```

人工按补丁块审阅：

```text
backend/src/index.js
backend/src/models/db.js
backend/src/models/mockDb.js
backend/package.json
```

## 组二：知识与儿童培训经营闭环

建议暂存路径：

```text
backend/src/data/childTrainingKnowledge.js
backend/src/routes/acquisition.js
backend/src/routes/advisor.js
backend/src/routes/results.js
backend/src/routes/salesCoach.js
backend/src/routes/services.js
backend/src/services/acquisition/
backend/src/services/advisor.js
backend/src/services/aiRunner.js
backend/src/services/growthReview.js
backend/src/services/knowledgeGovernance.js
backend/src/services/results.js
backend/src/services/salesCoach/
backend/src/services/serviceDelivery/
backend/src/services/skillRegistry.js
backend/scripts/knowledge-governance.test.js
backend/scripts/structured-kb.test.js
backend/scripts/core-business-loop.test.js
backend/scripts/business-loop-protocol.test.js
backend/scripts/growth-platform-acceptance.test.js
backend/scripts/local-life-acceptance.test.js
frontend/src/api/growth.js
frontend/src/stores/organization.js
frontend/src/views/growth/
```

人工按补丁块审阅：

```text
backend/src/services/kbService.js
backend/src/models/mockDb.js
backend/src/index.js
README.md
```

## 组三：运营语言与界面体验

建议暂存路径：

```text
frontend/src/components/
frontend/src/constants/operationsLanguage.js
frontend/src/constants/toolCatalog.js
frontend/src/views/Home.vue
frontend/src/views/Diagnosis.vue
frontend/src/views/DiagnosisQuestionnaire.vue
frontend/src/views/DiagnosisReport.vue
frontend/src/views/DouyinAgentHub.vue
frontend/src/views/Membership.vue
frontend/src/views/ModuleView.vue
frontend/src/views/PrivateAgentHub.vue
frontend/src/views/Tools.vue
frontend/src/views/douyin/
frontend/src/views/private/
frontend/src/views/tool/
frontend/src/views/tools/
frontend/src/views/xhs/
frontend/scripts/*operations*.test.js
frontend/scripts/layout-system-structure.test.js
frontend/src/api/request.js
frontend/index.html
frontend/package.json
```

人工按补丁块审阅：

```text
frontend/src/router/index.js
frontend/src/stores/user.js
backend/src/routes/admin.js
backend/src/routes/diagnosis.js
backend/src/routes/douyinAgents.js
backend/src/routes/generate.js
backend/src/routes/posterGenerator.js
backend/src/routes/user.js
backend/src/services/aiDiagnosis.js
backend/src/services/douyin/
backend/src/services/failover.js
backend/src/middleware/logger.js
```

## 组四：规格与验收文档

建议暂存路径：

```text
.monkeycode/docs/
.monkeycode/specs/platform-foundation/
.monkeycode/specs/local-life-knowledge-os/
.monkeycode/specs/sitewide-operations-copy/
.monkeycode/specs/child-training-growth-platform/README.md
.monkeycode/specs/child-training-growth-platform/tasklist.md
docs/superpowers/specs/2026-08-22-child-training-growth-platform/
docs/superpowers/specs/2026-08-23-child-training-7day-loop-design.md
docs/superpowers/specs/2026-08-23-sitewide-operations-copy-design.md
docs/superpowers/specs/2026-08-28-sitewide-operations-copy-task8-design.md
README.md
```

需要负责人确认后再暂存：

```text
.monkeycode/specs/child-training-growth-platform/tasklist.draft.md
.monkeycode/任务记忆.md
.ohmyagent/AGENTS.md
.superpowers/brainstorm/*/content/
```

## 永不加入暂存区

```text
backend/storage/private/
frontend/audit-output.txt
frontend/build-final.txt
.monkeycode/tmp-task10-browser.js
.monkeycode/tmp-task10-screenshots.js
.superpowers/**/state/
.ohmyagent/settings.json
```

这些路径已通过 `.gitignore` 保护；若其中任一文件已被历史跟踪，应另行执行 `git rm --cached`，不能在本计划中直接处理。

## 暂存前门禁

1. 确认本组文件没有真实凭证、手机号、签名URL或私有文件。
2. 检查公共交叉文件的补丁块，不要整文件暂存。
3. 暂存后执行 `git diff --cached --check`。
4. 查看 `git diff --cached --stat` 和敏感字段扫描结果。
5. 运行本组最小相关测试。
6. 负责人确认后，才进入提交或推送流程。

## 当前审阅结果

- 平台专项测试：29/29通过。
- `git diff --cached --check`：通过。
- 敏感字段扫描命中的是测试字面量 `secret`、取消令牌字段名、幂等键和开发环境默认签名密钥；未发现真实凭证、签名URL、手机号或用户隐私。该扫描命中属于实现/测试内容，提交前仍需人工确认。
- 当前仅平台基础设施明确新增文件和测试处于暂存区，交叉文件及其他组未暂存。
