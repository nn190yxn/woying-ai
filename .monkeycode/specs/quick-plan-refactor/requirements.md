# Requirements Document

## Introduction

抖音体检报告到 15 天计划链路已经具备可用能力，但核心规则分散在前端页面、后端路由和保存计划补齐逻辑中。当前重构目标是把体检输入、行业目标归一化、计划生成、旧计划迁移、页面展示和语义验收整理成可维护的样板闭环，支撑餐饮、美业、教培和生活服务老板获得可直接执行的 15 天作战计划。

## Glossary

- **体检输入**: 用户在抖音体检页填写的行业、经营模式、目标、经营数据和顾问追问答案。
- **诊断上下文**: 从体检报告传入 15 天计划页的结构化字段，包含短板、客户、主推产品、顾虑、证明素材和承接路径。
- **标准计划输入**: 后端生成计划前完成归一化后的输入对象。
- **行业策略包**: 每个行业对应的行业名称、客户类型、证明素材、默认产品、合规边界、禁用词和转化指标配置。
- **目标策略包**: 每个计划目标对应的目标名称、阶段重点、复盘指标和 CTA 策略配置。
- **日任务模板**: Day 1 到 Day 15 的固定执行意图，包含阶段、内容任务、脚本意图、复盘动作和承接动作。
- **计划版本**: 保存计划时记录的生成协议版本，用于判断旧计划补齐、迁移和展示策略。
- **语义验收矩阵**: 针对行业、目标、输入字段、旧保存计划和页面渲染结果的自动化断言集合。

## Requirements

### Requirement 1: 标准计划输入

**User Story:** AS 本地生活老板, I want 体检结果稳定进入 15 天计划, so that 我填写的行业、客户、产品和顾虑能持续影响每天任务。

#### Acceptance Criteria

1. WHEN 前端提交 15 天计划请求, THE 后端 SHALL 生成标准计划输入对象，字段包含 industryCode、goalCode、mode、frequency、adSupport 和 diagnosisContext。
2. WHEN industry 来自 URL、体检报告、保存计划或手动表单, THE 后端 SHALL 使用同一份行业别名表输出标准 industryCode。
3. WHEN goal 为空且 diagnosisContext.weakness 存在, THE 后端 SHALL 使用短板到目标映射输出 goalCode。
4. IF 诊断上下文字段缺失, THE 后端 SHALL 使用行业策略包补齐可执行默认值，并在 researchBrief 中展示默认来源。
5. WHILE 前端展示计划表单, THE 前端 SHALL 使用后端返回的标准 industryCode 和 goalCode 更新页面状态。

### Requirement 2: 行业和目标策略配置

**User Story:** AS 产品负责人, I want 行业话术、转化指标和合规边界集中维护, so that 餐饮、美业、教培之间保持独立语义。

#### Acceptance Criteria

1. THE 系统 SHALL 为 restaurant、beauty、education、service 提供行业策略包。
2. THE 系统 SHALL 为 traffic、conversion、leads、live 提供目标策略包。
3. WHEN 生成计划标题、每日目标、脚本 CTA、复盘指标和风险边界, THE 系统 SHALL 从行业策略包和目标策略包读取术语。
4. IF 输出行业为 beauty, THE 系统 SHALL 使用预约、留资、到店和体验卡相关指标表达。
5. IF 输出行业为 restaurant, THE 系统 SHALL 使用团购、核销、到店和套餐相关指标表达。
6. IF 输出行业为 education, THE 系统 SHALL 使用试听、留资、测评课和家长反馈相关指标表达。

### Requirement 3: 15 天日任务生成

**User Story:** AS 本地生活老板, I want 每一天都有不同任务、脚本和复盘指标, so that 我能照着执行并判断结果。

#### Acceptance Criteria

1. WHEN 生成 15 天计划, THE 系统 SHALL 输出三个阶段和完整 15 个 day 项。
2. EACH day SHALL 包含 day、phase、goal、action、workType、videoFunction、shootingMethod、topicDirection、content、executionTool、adPlan、ad、customerNurture、reviewMetrics、kpi、shootingScript 和 status。
3. EACH shootingScript SHALL 包含 hook、shots、talkingPoints、voiceover、cta 和 duration。
4. EACH shootingScript.shots SHALL 包含 4 条镜头清单。
5. WHEN diagnosisContext 包含 coreOffer、offerPrice、userObjection、proofAssets 和 conversionPath, THE 系统 SHALL 在每个阶段至少使用这些字段各 1 次。
6. WHEN 生成 Day 1 到 Day 15, THE 系统 SHALL 保持 hook、shots 和 cta 的日级差异。

### Requirement 4: AI 生成和规则生成协议一致

**User Story:** AS 开发者, I want AI 生成和规则兜底返回同一协议, so that 前端展示和保存计划可以使用单一结构。

#### Acceptance Criteria

1. THE 系统 SHALL 定义 QuickPlanResult 协议，字段包含 title、summary、researchBrief、riskBoundary、phases 和 meta。
2. WHEN 诊断上下文来自体检报告, THE 系统 SHALL 使用规则生成器快速返回 QuickPlanResult。
3. WHEN 手动生成触发 AI 生成, THE 系统 SHALL 校验 AI 输出并补齐 QuickPlanResult 必填字段。
4. IF AI 输出解析失败, THE 系统 SHALL 返回规则生成的 QuickPlanResult，并在 meta 标记 generationMode 为 ruleFallback。
5. WHILE 前端渲染 QuickPlanResult, THE 前端 SHALL 优先展示后端返回字段。

### Requirement 5: 保存计划版本化和迁移

**User Story:** AS 已登录用户, I want 旧保存计划能平滑升级, so that 历史执行状态可以保留，新字段也能展示完整。

#### Acceptance Criteria

1. WHEN 保存计划, THE 系统 SHALL 写入 planVersion、inputHash、industryCode、goalCode、diagnosisContext 和 plan。
2. WHEN 读取旧保存计划且 planVersion 低于当前版本, THE 系统 SHALL 生成迁移后的展示对象。
3. WHEN 旧计划缺少 shootingScript、riskBoundary 或 researchBrief, THE 系统 SHALL 使用标准计划输入补齐缺失字段。
4. WHEN 用户从体检报告跳转 15 天计划页, THE 前端 SHALL 基于当前诊断上下文发起新生成请求。
5. WHEN 用户手动点击读取已保存计划, THE 前端 SHALL 展示保存计划并保留已完成、已复盘等执行状态。

### Requirement 6: 页面展示和执行记录

**User Story:** AS 本地生活老板, I want 计划页面按天展示行动卡片, so that 我能快速找到今天要拍什么、怎么承接和怎么复盘。

#### Acceptance Criteria

1. WHILE 展示 15 天计划, THE 前端 SHALL 使用按天执行卡片展示 day 项。
2. EACH day card SHALL 展示今日目标、作品类型、视频功能、拍摄方式、内容方向、拍摄文案、执行工具、投流安排、客户培育和复盘指标。
3. WHEN 用户更新日任务状态, THE 系统 SHALL 保存对应 day 的 status。
4. WHEN 用户点击记录复盘, THE 前端 SHALL 携带 day、industryCode、goalCode 和 planContext 跳转复盘页面。
5. IF QuickPlanResult 缺少某个兼容字段, THE 前端 SHALL 使用协议内的主字段派生展示值。

### Requirement 7: 语义验收矩阵

**User Story:** AS 维护者, I want 自动化测试覆盖行业、目标和页面语义, so that 后续修改能暴露串词、重复脚本和旧计划污染。

#### Acceptance Criteria

1. THE 测试矩阵 SHALL 覆盖 restaurant、beauty、education 三个核心行业。
2. THE 测试矩阵 SHALL 覆盖 traffic、conversion、leads 三个核心目标。
3. THE 测试矩阵 SHALL 断言每个计划包含 15 天、3 个阶段、15 个 hook、15 组 shots 和 15 个 cta。
4. THE 测试矩阵 SHALL 断言 beauty 输出命中预约或留资语义，并检测餐饮专属词的跨行业残留。
5. THE 测试矩阵 SHALL 断言 restaurant 输出命中团购或核销语义，并检测美业专属词的跨行业残留。
6. THE 测试矩阵 SHALL 断言旧保存计划读取后包含 shootingScript、riskBoundary 和 researchBrief。
7. THE 测试矩阵 SHALL 通过浏览器验证页面存在 15 个 day card 和 15 个 script panel。

### Requirement 8: 可观测性和失败解释

**User Story:** AS 运维和产品团队, I want 快速知道计划来自哪种生成路径, so that 线上问题能定位到输入、AI、模板或保存计划。

#### Acceptance Criteria

1. THE 系统 SHALL 在 QuickPlanResult.meta 中返回 planVersion、generationMode、industryCode、goalCode、inputHash 和 migrated。
2. WHEN AI 生成降级到规则生成, THE 系统 SHALL 记录错误类别并返回稳定业务结果。
3. WHEN 保存计划迁移发生, THE 系统 SHALL 在响应 meta 中标记 migrated 为 true。
4. WHEN 计划输入缺少关键调研字段, THE 系统 SHALL 在 researchBrief 中标记补齐字段。

## Out Of Scope

- 新增 30 天或 90 天计划能力。
- 重做抖音体检评分算法。
- 新增数据库表以外的会员权限体系调整。
- 改造小红书和私域模块。
- 引入新的 AI 服务供应商。
