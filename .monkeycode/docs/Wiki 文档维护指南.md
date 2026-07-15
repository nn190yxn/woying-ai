# Wiki 文档维护指南

## 目标

本指南说明 `.monkeycode/docs/` 的维护方式。Wiki 的作用是让后续开发者快速理解系统，定位影响面，并按同一质量口径交付。

## 文档目录分工

| 文档 | 维护内容 |
| --- | --- |
| `INDEX.md` | Wiki 入口、关键文档链接、项目概览和常用命令 |
| `ARCHITECTURE.md` | 系统架构、模块边界、运行链路 |
| `INTERFACES.md` | 后端 API、请求协议、权限和响应结构 |
| `DEVELOPER_GUIDE.md` | 本地开发、配置和常用操作 |
| `代码目录导览.md` | 目录职责和常见入口 |
| `核心数据流.md` | 登录、会员、工具、支付、AI 和日志的数据流 |
| `数据模型.md` | 数据表、字段语义和 mock 边界 |
| `前后端路由映射.md` | 页面、组件和 API 映射 |
| `端到端业务流程.md` | 用户从登录到付费和复盘的业务链路 |
| `变更影响面指南.md` | 各类开发任务的同步检查范围 |
| `环境配置清单.md` | 后端、前端、小程序和线上配置项 |
| `部署运行手册.md` | 本地运行、线上备份、部署和回滚 |
| `测试验收手册.md` | 测试命令、冒烟、深测和专业度标准 |
| `质量门禁清单.md` | 发布前固定质量检查项 |
| `发布验收记录模板.md` | 发布和内测交付记录模板 |
| `排错手册.md` | 常见故障的定位路径 |
| `安全与配置边界.md` | 鉴权、密钥、支付、内容安全和日志边界 |
| `术语表.md` | 产品、技术、数据、测试和运维术语 |
| `风险登记与后续治理.md` | 当前风险、缓解措施和治理计划 |
| `新成员接手清单.md` | 新成员接手项目的阅读和验证顺序 |
| `模块/*.md` | 单个业务或技术模块说明 |
| `专有概念/*.md` | 会员、闭环、复盘等核心概念 |

## 什么时候更新 Wiki

出现以下变更时，应同步更新 Wiki：

| 变更类型 | 必改文档 |
| --- | --- |
| 新增 API | `INTERFACES.md`、`前后端路由映射.md` |
| 新增页面 | `前后端路由映射.md`、相关模块文档 |
| 新增数据表 | `数据模型.md`、`核心数据流.md` |
| 修改会员权限 | `MembershipAndAccess.md`、`变更影响面指南.md` |
| 修改 AI 输出结构 | `INTERFACES.md`、`测试验收手册.md`、相关模块文档 |
| 修改部署流程 | `部署运行手册.md`、`发布验收记录模板.md` |
| 修改环境变量 | `环境配置清单.md`、`安全与配置边界.md` |
| 新增质量检查 | `质量门禁清单.md`、`测试验收手册.md` |
| 发现持续性风险 | `风险登记与后续治理.md` |
| 新增概念或业务词 | `术语表.md`、对应概念文档 |

## 写作原则

- 只写能从代码、配置、测试、规格或真实验收记录确认的信息。
- 使用占位符描述密钥、密码、token 和支付凭证。
- 命令示例中，注释放在命令上一行。
- 文档中的路径使用仓库相对路径。
- 状态值使用固定词：`PASS`、`FAIL`、`BLOCKED`、`N/A`。
- 风险状态使用固定词：`OPEN`、`WATCH`、`MITIGATED`、`ACCEPTED`。
- Mermaid 图标签保持单行，包含特殊字符时加双引号。
- 新增文档后同步 `INDEX.md`。

## 推荐更新流程

1. 阅读相关代码和现有文档。
2. 确认变更影响面。
3. 更新对应 Wiki 页面。
4. 更新 `INDEX.md`。
5. 运行空白检查和敏感内容检查。
6. 在交付说明中列出新增或更新的文档。

## 文档校验命令

```bash
# 检查 Markdown 空白和尾随空格
git diff --check -- .monkeycode/docs

# 检查常见真实敏感值写入风险
rg -n "(api[_-]?key|secret|password|token|JWT_SECRET|MYSQL_PASSWORD|DB_PASSWORD|USER_LLM_API_KEY)\s*[:=]\s*['\"]?[A-Za-z0-9_./+\-]{12,}" .monkeycode/docs

# 检查 INDEX 中的本地 Markdown 路径是否存在
node -e 'const fs=require("fs"); const s=fs.readFileSync(".monkeycode/docs/INDEX.md","utf8"); const re=/`([^`]+\.md)`/g; let m,bad=[]; while((m=re.exec(s))){ const p=m[1]; if(p.startsWith("docs/")) continue; if(!fs.existsSync(p)) bad.push(p); } if(bad.length){ console.log(bad.map(p=>"missing "+p).join("\n")); process.exit(1); }'
```

## 敏感信息边界

可以写入：

- 环境变量名。
- 占位符。
- 配置用途说明。
- 键名存在性检查要求。

严禁写入：

- 真实 API Key。
- 数据库密码。
- JWT 签名值。
- 支付密钥。
- SSH 私钥内容。
- `.env` 真实值。

## 结构同步规则

新增 Wiki 页面时：

- 文件放在 `.monkeycode/docs/`。
- 模块文档放在 `.monkeycode/docs/模块/`。
- 核心概念放在 `.monkeycode/docs/专有概念/`。
- 在 `INDEX.md` 增加入口。
- 在相关上游文档中增加交叉引用。

修改已有模块时：

- 先更新事实源最近的文档，例如接口先更新 `INTERFACES.md`。
- 再更新业务流程、路由映射和质量门禁。
- 风险或限制写入 `风险登记与后续治理.md`。

## 常见维护场景

| 场景 | 操作 |
| --- | --- |
| 新增抖音接口 | 更新 `INTERFACES.md`、`DouyinBusinessLoop.md`、`前后端路由映射.md` |
| 新增小红书页面 | 更新 `XhsGrowth.md`、`前后端路由映射.md`、`INDEX.md` |
| 新增私域持久化表 | 更新 `数据模型.md`、`核心数据流.md`、`PrivateOps.md` |
| 修改会员套餐 | 更新 `MembershipAndAccess.md`、`AdminPayment.md`、`环境配置清单.md` |
| 修改 AI prompt 输出 | 更新对应模块文档、`测试验收手册.md`、`风险登记与后续治理.md` |
| 调整部署方式 | 更新 `部署运行手册.md`、`发布验收记录模板.md`、`质量门禁清单.md` |

## 交付说明模板

```text
本轮文档更新：
- 新增：
- 更新：
- 校验：
- 未覆盖事项：
```

校验项至少包含：

- `git diff --check -- .monkeycode/docs`
- 赋值型敏感内容检查
- `INDEX.md` 本地路径检查
