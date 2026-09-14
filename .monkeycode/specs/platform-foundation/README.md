# 平台基础能力

作者：Monkeycode

## 项目简介

为我赢AI提供机构权限、服务器私有文件存储、异步任务可靠性与独立 Worker 基础能力。

## 使用方式

按 `tasklist.md` 查看实施范围；运行 `backend` 对应专项测试及 `frontend` 生产构建进行验收。

## 当前状态

任务1-4全部完成并通过三阶段集成验收；未部署、未执行线上迁移。

## 关键文件

- `tasklist.md`：实施与验收清单
- `../../../docs/superpowers/specs/2026-08-22-platform-foundation-design.md`：设计规格
- `../../../backend/src/services/organization.js`：机构服务
- `../../../backend/src/services/asyncTasks.js`：异步任务服务
- `../../../backend/src/workers/asyncTaskWorker.js`：独立 Worker

## 产出与依赖

依赖 Node.js、Express、MySQL/Mock DB；产出机构权限、私有存储及异步任务基础设施。

## 下次接着做什么

如进入上线阶段，单独制定数据库迁移、存储目录、Worker 进程和回滚方案，不直接复用本地验收步骤执行生产变更。
