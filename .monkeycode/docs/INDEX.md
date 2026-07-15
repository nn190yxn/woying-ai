# 我赢AI项目 Wiki

## 项目概览

我赢AI是面向本地生活经营者的 AI 经营工具平台，核心链路围绕“经营体检 -> 作战计划 -> 执行工具 -> 数据复盘 -> 会员升级”组织。当前代码库包含 Vue 3 前端、Express 后端、知识库、微信小程序目录和项目规范文档。

## 快速入口

- 架构文档：`.monkeycode/docs/ARCHITECTURE.md`
- 接口文档：`.monkeycode/docs/INTERFACES.md`
- 响应协议与错误口径：`.monkeycode/docs/响应协议与错误口径.md`
- 开发者指南：`.monkeycode/docs/DEVELOPER_GUIDE.md`
- 架构决策记录：`.monkeycode/docs/架构决策记录.md`
- 术语表：`.monkeycode/docs/术语表.md`
- 新成员接手清单：`.monkeycode/docs/新成员接手清单.md`
- Wiki 文档维护指南：`.monkeycode/docs/Wiki 文档维护指南.md`
- 代码目录导览：`.monkeycode/docs/代码目录导览.md`
- 数据模型：`.monkeycode/docs/数据模型.md`
- 数据治理与隐私边界：`.monkeycode/docs/数据治理与隐私边界.md`
- 核心数据流：`.monkeycode/docs/核心数据流.md`
- 端到端业务流程：`.monkeycode/docs/端到端业务流程.md`
- 前后端路由映射：`.monkeycode/docs/前后端路由映射.md`
- 环境配置清单：`.monkeycode/docs/环境配置清单.md`
- 变更影响面指南：`.monkeycode/docs/变更影响面指南.md`
- 部署运行手册：`.monkeycode/docs/部署运行手册.md`
- 测试验收手册：`.monkeycode/docs/测试验收手册.md`
- 验收场景矩阵：`.monkeycode/docs/验收场景矩阵.md`
- 质量门禁清单：`.monkeycode/docs/质量门禁清单.md`
- 发布验收记录模板：`.monkeycode/docs/发布验收记录模板.md`
- 排错手册：`.monkeycode/docs/排错手册.md`
- 日志与可观测性手册：`.monkeycode/docs/日志与可观测性手册.md`
- 安全与配置边界：`.monkeycode/docs/安全与配置边界.md`
- 风险登记与后续治理：`.monkeycode/docs/风险登记与后续治理.md`
- 前端模块：`.monkeycode/docs/模块/Frontend.md`
- 前端状态管理手册：`.monkeycode/docs/前端状态管理手册.md`
- 后端模块：`.monkeycode/docs/模块/Backend.md`
- 后端路由维护手册：`.monkeycode/docs/后端路由维护手册.md`
- 抖音经营闭环模块：`.monkeycode/docs/模块/DouyinBusinessLoop.md`
- 小红书增长模块：`.monkeycode/docs/模块/XhsGrowth.md`
- 私域运营模块：`.monkeycode/docs/模块/PrivateOps.md`
- 通用工具模块：`.monkeycode/docs/模块/ToolGeneration.md`
- 运营后台与支付模块：`.monkeycode/docs/模块/AdminPayment.md`
- 小程序模块：`.monkeycode/docs/模块/Miniapp.md`
- 知识库模块：`.monkeycode/docs/模块/KnowledgeBase.md`
- 会员与权限概念：`.monkeycode/docs/专有概念/MembershipAndAccess.md`
- 会员权限矩阵维护手册：`.monkeycode/docs/会员权限矩阵维护手册.md`
- 经营闭环概念：`.monkeycode/docs/专有概念/BusinessOpsLoop.md`
- 复盘沉淀概念：`.monkeycode/docs/专有概念/ReviewInsights.md`
- 会员权限架构：`.monkeycode/docs/membership-permission-architecture.md`
- 行业工具权限矩阵：`.monkeycode/docs/industry-tool-access-matrix.md`
- 工具专业度深测方案：`docs/全量工具专业度深度测试方案.md`
- 整站重构规格：`.monkeycode/specs/site-business-ops-refactor/`

## 仓库结构

```text
woying-ai/
  backend/                 Express API 服务
  frontend/                Vue 3 + Vite Web 应用
  miniapp/                 uni-app 微信小程序目录
  knowledge-base/          AI 工具知识库
  docs/                    人工验收、测试和运营文档
  .monkeycode/docs/        项目 Wiki 与专题技术文档
  .monkeycode/specs/       需求、设计和任务清单
```

## 核心业务模块

- 前台经营入口：首页、工具页、会员页、抖音 Hub、小红书 Hub、私域 Hub。
- 抖音样板链路：体检诊断、15 天作战计划、脚本/标题/封面/转化/投流工具、视频数据复盘、复盘洞察。
- 小红书链路：账号体检、起号计划、选题、脚本、标题、封面、笔记诊断、账号复盘、投放和 IP 工具。
- 私域链路：私域体检、会员体系、复购留存、社群 SOP、CAC vs LTV、90 天私域战略。
- 通用工具库：经营计算、内容生成、营销方案、海报生成、表格工具、行业专版工具。

## 运行形态

- 前端本地开发默认端口：`5173`。
- 后端默认端口：`3001`，但前端 Vite 代理默认指向 `http://localhost:3000`，本地联调时需要通过 `VITE_API_TARGET` 对齐实际后端端口。
- 线上主站：`https://woyai.cn/`。
- 线上健康检查：`https://woyai.cn/api/health`。
- 线上 PM2 服务名：`woying-backend`。

## 常用命令

```bash
# 前端开发
cd frontend
npm run dev

# 前端构建
cd frontend
npm run build

# 后端开发
cd backend
npm run dev

# 后端启动
cd backend
npm start

# 后端关键测试
cd backend
npm run test:douyin-diagnosis
```

## 文档维护原则

- 本 Wiki 只记录从代码、配置、测试和规格文件可确认的信息。
- 接口、权限和运行命令以当前代码为准。
- 涉及密钥、数据库密码、支付凭证、AI Key 的内容统一使用占位符，不写入真实值。
