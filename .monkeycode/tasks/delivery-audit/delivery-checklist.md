# 我赢AI当前工作树交付清单

> 作者：Monkeycode  
> 日期：2026-08-29  
> 范围：只读盘点；未删除、未暂存、未提交、未推送、未部署、未迁移。

## 1. 当前基线

- 分支：`woai-ai-v1`
- HEAD：`272d223 docs-platform-foundation-design`
- 与 `origin/woai-ai-v1` 比较：本地领先2个提交，远端领先0个提交
- 暂存区：空
- 工作树：206个状态条目
  - 已跟踪修改：112个文件
  - 未跟踪：94个条目
- 已跟踪改动规模：约1405行新增、716行删除
- 主要目录分布：`frontend` 104项、`backend` 79项、`.monkeycode` 16项、`docs` 4项

## 2. 已验证交付能力

- 前端运营专项测试：34/34通过
- 前端生产构建：770 modules通过
- 后端 `scripts/*.test.js`：全部逐文件通过
- 浏览器检查：8条核心路由 × 桌面/平板/手机，共24次，无横向溢出
- 最终运营文案扫描：剩余38项，均已分类为内部实现、日志字段、测试fixture或内部枚举
- `git diff --check`：无格式错误，仅有LF/CRLF转换警告

## 3. 建议纳入交付的内容

### A. 平台基础能力

- 机构成员、角色权限、机构隔离和网点管理
- 私有文件存储、签名读取、安全校验和过期清理
- 异步任务状态机、幂等、重试、取消、租约和独立Worker
- 对应后端路由、服务、模型、专项测试和平台规格文档

### B. 知识与儿童培训经营闭环

- 知识治理、结构化检索、Skill注册和统一AI Runner
- 获客诊断、销售教练、顾问、服务交付、成果聚合及7天经营闭环
- 对应增长页面、API、Mock DB、验收测试和设计文档

### C. 全站运营语言与响应式体验

- 首页、校长工作台、诊断、抖音、小红书、私域、工具、会员和后台文案
- 中文经营状态、错误翻译、权限脱敏及AI边界说明
- 运营语言扫描器、专项测试和任务验收文档

## 4. 必须排除或先确认的内容

### 禁止直接提交

- `backend/storage/private/`：本地运行产生的私有存储文件；当前9个文件内容为测试字面量 `secret`（已加入 `.gitignore`）
- `frontend/audit-output.txt`：本地扫描输出（已加入 `.gitignore`）
- `frontend/build-final.txt`：本地构建输出（已加入 `.gitignore`）
- `.monkeycode/tmp-task10-browser.js`：一次性浏览器验收脚本（已加入 `.gitignore`）
- `.monkeycode/tmp-task10-screenshots.js`：一次性截图脚本（已加入 `.gitignore`）
- `.superpowers/**/state/`：本地进程状态文件（已加入 `.gitignore`）
- `.ohmyagent/settings.json`：包含本机工具权限规则，不属于产品代码（已加入 `.gitignore`）

### 提交前人工确认

- `.superpowers/brainstorm/*/content/`：若仅为设计过程草稿则排除；若作为正式原型交付则迁入明确文档目录
- `.monkeycode/specs/child-training-growth-platform/tasklist.draft.md`：草稿与正式清单并存，应只保留明确需要的版本
- `.monkeycode/任务记忆.md`：确认团队是否希望将本地任务历史纳入仓库
- `.ohmyagent/AGENTS.md`：项目规则可纳入仓库，但应与团队协作约定一致

## 5. 建议提交分组

由于公共入口文件存在交叉改动，不建议仅按目录机械拆分。推荐按依赖顺序分4组，并在每组暂存后复跑对应测试：

1. **平台基础设施**：机构、存储、异步任务、Worker、模型与专项测试
2. **知识和经营闭环**：知识治理、增长业务服务、顾问/销售/服务/成果及对应前端
3. **运营语言和界面**：全站公开文案、状态翻译、路由导航、响应式页面及专项扫描测试
4. **规格与验收文档**：设计、任务清单、README、风险和部署手册

`backend/src/index.js`、`backend/src/models/mockDb.js`、`frontend/src/router/index.js`、`README.md` 等交叉文件需要按补丁块审阅，不能简单按文件归入单一提交。

## 6. 提交前门禁

- 将本地生成物加入忽略规则或明确排除暂存
- 检查暂存区中不存在 `.env`、Token、签名URL、真实手机号、私有文件及本机权限配置
- 对每个提交运行最小相关测试
- 最终复跑前端34项专项、后端全量测试、前端构建和 `git diff --check`
- 查看 `git diff --cached --stat` 与 `git diff --cached` 后再提交
- 推送、部署和迁移均需单独确认

## 7. 当前结论

代码和验收证据具备交付条件，但工作树混合了多个阶段的大量代码、文档及本地生成物。当前最重要的下一步不是直接提交，而是先确认排除项并按依赖拆分暂存边界。
