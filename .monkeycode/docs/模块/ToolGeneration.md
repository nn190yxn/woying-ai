# Tool Generation 模块

## 职责

通用工具模块负责工具列表、会员权限、配额、通用生成、工具历史、表格保存和经营计算。相关后端文件包括 `routes/tool.js`、`routes/generate.js`、`routes/sheets.js` 和多个 `services/*Engine.js`。

## 工具列表

接口：`GET /api/tools`。

后端在 `backend/src/routes/tool.js` 中返回工具列表，并用 `getToolAccessMeta()` 附加：

- `requiredLevel`
- `badge`
- `badgeClass`

工具类别包括：

- 文案。
- 计算。
- 内容。
- 进阶。
- 诊断。
- 高阶。

## 权限配置

权限配置文件：`backend/src/config/toolAccess.js`。

核心函数：

- `normalizeMemberLevel(level)`。
- `canAccessLevel(memberLevel, requiredLevel)`。
- `getRequiredMemberLevel(toolCode)`。
- `getToolAccessMeta(toolCode)`。

## 配额接口

- `GET /api/tools/quotas`：返回当前用户全部工具配额。
- `GET /api/tools/:code/quota`：返回指定工具配额。

配额逻辑会读取 `tool_usage` 表中当天使用次数，按会员等级和工具配置计算剩余额度。

## 工具运行

- `POST /api/tools/:code/run`：工具运行入口之一。
- `POST /api/generate/:toolCode`：通用生成入口。

`/api/generate/:toolCode` 的执行流程：

1. 查找工具定义。
2. 查询用户会员等级。
3. 检查工具权限。
4. 根据工具引擎类型执行输入校验。
5. 通过 failover 执行工具。
6. 记录提交、成功、失败事件。
7. 记录工具使用次数。

## 工具定义

`backend/src/routes/generate.js` 中的 `TOOL_DEFINITIONS` 合并了：

- 内置文本和方案工具。
- `createCalculatorTools()`。
- `createSpreadsheetTools()`。

这意味着经营计算工具和表格工具会进入同一个通用生成入口。

## 表格保存

后端文件：`backend/src/routes/sheets.js`。

接口：

- `POST /api/sheets/save`：按用户保存表格数据。
- `GET /api/sheets/load/:id`：按 ID 读取当前用户表格。
- `GET /api/sheets/list`：读取当前用户最近 20 条表格记录，可按 `sheetCode` 过滤。

数据表：`user_sheets`。

唯一索引：`(user_id, sheet_code)`。同一用户同一 sheet code 保存会覆盖数据。

## 前端承接

通用工具前端主要入口：

- `frontend/src/views/Tools.vue`。
- `frontend/src/views/ToolPage.vue`。
- `frontend/src/views/tools/*.vue`。
- `frontend/src/api/tool.js`。

## 变更注意点

- 新增工具 code 时，需要同步工具列表、权限配置、前端入口、工具定义和知识库映射。
- 新增经营计算或表格工具时，需要确认 `createCalculatorTools()` 或 `createSpreadsheetTools()` 是否已经合并进 `TOOL_DEFINITIONS`。
- 工具输出结构要保持前端页面可渲染，失败时应提供兜底结果或明确错误。
- 配额接口和会员锁定提示要与实际后端权限一致。
