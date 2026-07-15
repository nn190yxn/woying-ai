# Knowledge Base 模块

## 职责

`knowledge-base/` 是 AI 工具的业务知识来源。后端通过 `kbService` 按工具 code、会员等级和输入复杂度抽取相关 Markdown 片段，注入 AI prompt。

## 知识库结构

全局索引在 `knowledge-base/INDEX.md`。当前知识库按层组织：

- `00_原子知识库/`：跨行业可复用的知识原子、文案词汇和平台规则。
- `01_业务场景库/`：选题、标题、封面、正文、话术、引流、投放、直播、账号诊断等场景。
- `02_行业知识库/`：教培、美业、餐饮等行业资料。
- `03_品牌战略库/`：品牌定位、传播、管理、视觉、案例拆解。
- `04_方案模板库/`：营销方案框架。
- `05_抖音专项库/`：抖音增长和本地生活方法论。
- `06_通用支撑库/`：AI 应用、IP、人事、制度模板。
- `07_私域运营专项库/`：私域理论、SOP、话术、案例和实操场景。

## 后端读取服务

服务文件：`backend/src/services/kbService.js`。

核心能力：

- 读取 `backend/src/config/kb-mapping.json`。
- 根据工具 code 找到知识库文件和 section。
- 校验路径在知识库根目录内。
- 按 Markdown heading 抽取目标 section。
- 使用内存缓存减少重复文件读取。
- 根据会员等级和工具复杂度控制上下文长度。

## 路径配置

知识库根路径由 `KB_ROOT_PATH` 覆盖。默认值：

- 生产环境：`/home/ubuntu/woying-ai/knowledge-base`。
- 开发环境：仓库内 `knowledge-base/`。

上下文预算环境变量：

- `KB_MAX_CONTEXT_CHARS`
- `KB_MAX_FILE_CHARS`

## 映射配置

映射文件：`backend/src/config/kb-mapping.json`。

每个工具可配置：

- `name`：工具名称。
- `knowledgeFiles`：知识文件列表。
- `knowledgeFiles[].path`：相对知识库根目录的路径。
- `knowledgeFiles[].sections`：需要抽取的 Markdown section。
- `knowledgeFiles[].purpose`：注入目的。
- `knowledgeFiles[].memberLevel`：知识片段适用会员等级。
- `aiConfig`：温度和不同会员等级 token 预算。

已确认映射示例：

- `restaurant-health`：餐饮门店健康度诊断。
- `education-health`：校区健康度诊断。
- `beauty-health`：美业门店健康度诊断。
- `store-health`：门店运营健康度诊断。
- `douyin-growth`：抖音增长方案。

## 会员等级与上下文预算

`kbService` 内部按工具复杂度和会员等级控制上下文预算：

- `free`：低预算。
- `starter`：中低预算。
- `pro`：中高预算。
- `annual`：高预算。

输入内容较长时会提高预算，但受最大上下文限制约束。输入极短时会降低预算，避免过量注入。

## 变更注意点

- 新增知识文件后，应在 `knowledge-base/INDEX.md` 或对应目录索引中记录。
- 新增工具知识映射时，应更新 `backend/src/config/kb-mapping.json`。
- `sections` 必须匹配 Markdown 标题文本，否则抽取结果可能为空。
- 知识路径必须保持在知识库根目录内。
- AI prompt 中应说明知识库只是参考，关键业务结论仍需结合用户输入和规则兜底。
