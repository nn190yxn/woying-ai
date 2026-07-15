# 需求实施计划

- [x] 1. 建立 QuickPlan 重构模块边界
  - [x] 1.1 创建后端抖音计划服务目录和导出入口
    - 在 `backend/src/services/douyin/` 下创建 `quickPlanInput.js`、`quickPlanStrategies.js`、`quickPlanTemplates.js`、`quickPlanGenerator.js`、`quickPlanMigration.js`。
    - 保持 `backend/src/routes/douyinAgents.js` 继续承担路由、鉴权、请求响应和数据库读写职责。
    - 覆盖 Requirement 4.1、Requirement 8.1；对应设计 Components and Interfaces 的 Backend Modules。

  - [x] 1.2 创建前端抖音计划展示常量模块
    - 新增 `frontend/src/constants/douyinQuickPlan.js`，集中维护行业选项、目标选项、状态选项和字段标签。
    - 为 `QuickPlanAgent.vue` 后续移除重复归一化常量提供稳定引用。
    - 覆盖 Requirement 1.5、Requirement 6.1、Requirement 6.2；对应设计 Frontend Modules。

  - [x] 1.3 保留现有接口响应兼容字段
    - 规划 `goal/action`、`topicDirection/content`、`adPlan/ad`、`reviewMetrics/kpi` 的兼容输出位置。
    - 确保旧前端和旧保存计划仍能读取主要字段。
    - 覆盖 Requirement 3.2、Requirement 4.5、Requirement 6.5；对应设计 Data Models 的 QuickPlanResult。

- [x] 2. 实现标准计划输入和策略配置
  - [x] 2.1 实现计划输入归一化函数
    - 在 `quickPlanInput.js` 实现 `normalizeIndustryCode()`、`normalizeGoalCode()`、`normalizeQuickPlanInput()` 和 `createQuickPlanInputHash()`。
    - 支持 URL、体检报告、保存计划和手动表单的行业别名归一化。
    - 支持 goal 缺失时根据 `diagnosisContext.weakness` 推导目标。
    - 覆盖 Requirement 1.1、Requirement 1.2、Requirement 1.3、Requirement 8.1；对应设计 StandardQuickPlanInput。

  - [x] 2.2 实现行业策略包和目标策略包
    - 在 `quickPlanStrategies.js` 实现 `restaurant`、`beauty`、`education`、`service` 行业策略。
    - 实现 `traffic`、`conversion`、`leads`、`live` 目标策略。
    - 策略包包含行业名称、客户类型、默认产品、顾虑、证明素材、转化指标、行动入口、风险边界和禁用词。
    - 覆盖 Requirement 2.1、Requirement 2.2、Requirement 2.3、Requirement 2.4、Requirement 2.5、Requirement 2.6。

  - [x] 2.3 实现诊断上下文字段补齐
    - 在 `normalizeQuickPlanInput()` 中对 `targetAudience`、`coreOffer`、`offerPrice`、`userObjection`、`proofAssets`、`conversionPath`、`painSummary` 做默认值补齐。
    - 在输出上下文中标记补齐字段，供 `researchBrief` 使用。
    - 覆盖 Requirement 1.4、Requirement 8.4；对应设计 Runtime Flow 第 3 步。

  - [x]* 2.4 编写输入归一化单元测试
    - 使用 Node.js 内置 `node --test` 覆盖 restaurant、餐饮、美业、医美、education、教培、service 等别名。
    - 覆盖显式 goal 和 weakness 推导。
    - 覆盖 Requirement 1.2、Requirement 1.3；对应设计 Test Strategy 的 Unit Tests。

  - [x]* 2.5 编写输入归一化属性测试
    - 性质 P1：任意可识别行业别名都归一到策略包存在的 `industryCode`。
    - 性质 P2：任意标准计划输入都生成稳定 `inputHash`。
    - 覆盖 Requirement 1.1、Requirement 8.1；对应设计 Correctness Properties 的输入稳定性。

- [x] 3. 实现 15 天模板生成和结果协议校验
  - [x] 3.1 抽出 Day 1 到 Day 15 日任务模板
    - 在 `quickPlanTemplates.js` 定义 15 个日任务模板，只保留执行意图、阶段、内容结构和字段组合方式。
    - 模板通过行业策略包和目标策略包注入行业词、目标词、CTA、复盘指标和风险边界。
    - 覆盖 Requirement 3.1、Requirement 3.2、Requirement 3.5；对应设计 Components and Interfaces 的 `quickPlanTemplates.js`。

  - [x] 3.2 实现规则计划生成器
    - 在 `quickPlanGenerator.js` 实现 `buildQuickPlanFromTemplates()`。
    - 生成 `title`、`summary`、`researchBrief`、`riskBoundary`、`phases` 和 `meta`。
    - 确保每个 day 包含展示字段、兼容字段和完整 `shootingScript`。
    - 覆盖 Requirement 3.1、Requirement 3.2、Requirement 3.3、Requirement 3.4、Requirement 4.1、Requirement 8.1。

  - [x] 3.3 实现 QuickPlanResult 校验和补齐函数
    - 在 `quickPlanGenerator.js` 实现 `validateQuickPlanResult()`。
    - 对 AI 输出和规则输出统一补齐 `researchBrief`、`riskBoundary`、`meta`、兼容字段、`shootingScript` 和状态字段。
    - 覆盖 Requirement 4.1、Requirement 4.3、Requirement 4.4、Requirement 6.5、Requirement 8.2。

  - [x] 3.4 将 `douyinAgents.js` 的规则生成逻辑切换到新生成器
    - 在 `/api/douyin/quick-plan` 中调用 `normalizeQuickPlanInput()`、`buildQuickPlanFromTemplates()` 和 `validateQuickPlanResult()`。
    - 保持诊断上下文路径快速返回规则计划。
    - 保持手动生成路径可走 AI，再进入统一校验补齐。
    - 覆盖 Requirement 4.2、Requirement 4.3、Requirement 4.4；对应设计 Runtime Flow 第 3 到第 5 步。

  - [x]* 3.5 编写生成器单元测试
    - 覆盖 3 行业和 3 目标组合的计划生成。
    - 验证每个计划包含 3 个阶段、15 个 day、完整 `riskBoundary` 和 `researchBrief`。
    - 覆盖 Requirement 3.1、Requirement 4.1；对应设计 Test Strategy 的 Unit Tests。

  - [x]* 3.6 编写 QuickPlanResult 属性测试
    - 性质 P3：每个 QuickPlanResult 恰好包含 3 个阶段和 15 个 day 项。
    - 性质 P4：每个 day 项必须拥有完整展示字段和兼容字段。
    - 性质 P5：每个 `shootingScript.shots` 必须包含 4 条镜头清单。
    - 覆盖 Requirement 3.1、Requirement 3.2、Requirement 3.4；对应设计 Correctness Properties 第 1、2、3 条。

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 5. 实现保存计划版本化和迁移
  - [x] 5.1 扩展保存计划表初始化逻辑
    - 在 `ensureQuickPlanTable()` 中兼容新增 `plan_version` 和 `input_hash` 字段。
    - 保持 `diagnosis_context` 和 `plan` 的现有 JSON 存储方式。
    - 覆盖 Requirement 5.1、Requirement 8.1；对应设计 Saved Plan Row Extension。

  - [x] 5.2 实现保存计划迁移函数
    - 在 `quickPlanMigration.js` 实现 `migrateSavedPlan()`。
    - 对旧计划补齐 `shootingScript`、`riskBoundary`、`researchBrief` 和 `meta`。
    - 保留旧计划已有 day status。
    - 覆盖 Requirement 5.2、Requirement 5.3、Requirement 8.3；对应设计 Correctness Properties 的保存计划迁移。

  - [x] 5.3 接入保存和读取接口版本字段
    - 在 `POST /api/douyin/quick-plan/saved` 写入 `planVersion`、`inputHash`、标准 `industryCode`、标准 `goalCode`、`diagnosisContext` 和 `plan`。
    - 在 `GET /api/douyin/quick-plan/saved` 返回迁移后的展示对象和 `meta.migrated`。
    - 覆盖 Requirement 5.1、Requirement 5.2、Requirement 5.3、Requirement 8.3。

  - [x] 5.4 保持日任务状态更新兼容
    - 调整 `PATCH /api/douyin/quick-plan/saved/status` 使用迁移后的计划结构更新 day status。
    - 更新后写回计划 JSON，并保留 `planVersion` 和 `inputHash`。
    - 覆盖 Requirement 6.3、Requirement 5.5；对应设计 Integration Tests 的状态更新路径。

  - [x]* 5.5 编写保存计划迁移单元测试
    - 覆盖旧计划缺 `shootingScript`、缺 `riskBoundary`、缺 `researchBrief` 的迁移。
    - 覆盖状态字段保留。
    - 覆盖 Requirement 5.2、Requirement 5.3；对应设计 Test Strategy 的 Unit Tests。

  - [x]* 5.6 编写保存计划接口集成测试
    - 覆盖保存 `planVersion` 和 `inputHash`。
    - 覆盖读取旧保存计划后返回迁移对象。
    - 覆盖状态更新后再次读取仍保留状态。
    - 覆盖 Requirement 5.1、Requirement 5.2、Requirement 6.3、Requirement 7.6；对应设计 Integration Tests。

- [x] 6. 精简前端计划页并接入标准协议
  - [x] 6.1 替换前端重复归一化常量
    - 让 `QuickPlanAgent.vue` 使用 `frontend/src/constants/douyinQuickPlan.js` 的行业选项、目标选项和状态选项。
    - 使用后端响应的 `meta.industryCode` 和 `meta.goalCode` 校准页面状态。
    - 覆盖 Requirement 1.5、Requirement 4.5；对应设计 Frontend Modules。

  - [x] 6.2 精简计划展示兜底逻辑
    - 调整 `QuickPlanAgent.vue` 优先展示 QuickPlanResult 主字段。
    - 将兼容字段派生限制在旧数据兜底路径。
    - 覆盖 Requirement 4.5、Requirement 6.1、Requirement 6.2、Requirement 6.5。

  - [x] 6.3 调整体检入口和保存计划优先级
    - 保持体检报告进入计划页时自动用当前诊断上下文生成新计划。
    - 保持用户手动点击读取保存计划时展示保存内容并保留执行状态。
    - 覆盖 Requirement 5.4、Requirement 5.5；对应设计 Correctness Properties 的页面优先级。

  - [x] 6.4 调整复盘跳转上下文
    - 在记录复盘跳转中携带 day、industryCode、goalCode 和 planContext。
    - 使用 QuickPlanResult meta 和 day 字段组装复盘页面 query。
    - 覆盖 Requirement 6.4；对应设计 Runtime Flow 和 Frontend Modules。

  - [x]* 6.5 编写前端页面结构验证脚本
    - 用页面结构验证脚本覆盖计划页 day card、script panel 和状态控件渲染入口。
    - 验证页面展示 `researchBrief` 和 `riskBoundary`。
    - 覆盖 Requirement 7.7、Requirement 6.1、Requirement 6.2；对应设计 Browser Tests。

- [x] 7. 补齐语义验收矩阵
  - [x] 7.1 新增 QuickPlan 语义测试脚本
    - 在 `backend/scripts/` 新增 QuickPlan 语义验收脚本。
    - 覆盖 restaurant、beauty、education 三个核心行业和 traffic、conversion、leads 三个核心目标。
    - 覆盖 Requirement 7.1、Requirement 7.2；对应设计 Semantic Matrix。

  - [x] 7.2 实现行业命中词和禁用词断言
    - 餐饮 conversion 断言命中团购、核销、套餐、到店。
    - 美业 conversion 断言命中预约、留资、体验卡、到店，并检测餐饮专属词残留。
    - 教培 leads 断言命中试听、测评课、家长反馈、留资。
    - 覆盖 Requirement 7.4、Requirement 7.5；对应设计 Semantic Matrix。

  - [x] 7.3 实现脚本文案唯一性断言
    - 统计每个计划的 `uniqueHooks`、`uniqueShots` 和 `uniqueCtas`。
    - 断言 15 天计划具备 15 个 hook、15 组 shots 和 15 个 cta。
    - 覆盖 Requirement 3.6、Requirement 7.3；对应设计 Correctness Properties 第 4 条。

  - [x] 7.4 实现深度调研字段覆盖断言
    - 构造包含 `coreOffer`、`offerPrice`、`userObjection`、`proofAssets`、`conversionPath` 的诊断上下文。
    - 断言这些字段进入不同阶段的 day 任务、脚本、CTA 或复盘指标。
    - 覆盖 Requirement 3.5、Requirement 8.4；对应设计 Semantic Matrix。

  - [x]* 7.5 编写语义矩阵属性测试
    - 性质 P6：行业策略包禁用词不得出现在其他行业输出中。
    - 性质 P7：保存计划迁移必须保留 day.status。
    - 性质 P8：从体检报告进入计划页时，当前诊断上下文优先生成新计划。
    - 覆盖 Requirement 7.4、Requirement 7.5、Requirement 5.5；对应设计 Correctness Properties 第 5、6、7 条。

- [x] 8. 检查点 - 确保所有测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 9. 完成代码收口和构建验证
  - [x] 9.1 清理 `douyinAgents.js` 中迁出的重复逻辑
    - 移除路由文件内重复的行业素材、目标命名、日脚本模板和旧计划补齐逻辑。
    - 保留路由层必要的请求校验、权限控制、AI 调用和数据库读写。
    - 覆盖 Requirement 2.3、Requirement 4.1；对应设计 Current Problems 的职责过重问题。

  - [x] 9.2 执行后端语法检查和核心测试命令
    - 对新增后端模块和 `backend/src/routes/douyinAgents.js` 执行 `node --check`。
    - 执行 `npm run test:douyin-diagnosis` 和 QuickPlan 语义验收脚本。
    - 覆盖 Requirement 7.1、Requirement 7.2、Requirement 7.3、Requirement 7.4、Requirement 7.5。

  - [x] 9.3 执行前端构建验证
    - 在 `frontend/` 执行 `npm run build`。
    - 修复由常量抽取、字段变更或页面兜底调整引起的构建问题。
    - 覆盖 Requirement 6.1、Requirement 6.2、Requirement 6.4。

  - [x]* 9.4 执行浏览器自动化验收
    - 验证从 `/douyin/diagnosis` 填写完整调研字段并跳转 `/douyin/quick-plan`。
    - 验证计划页 day card、script panel、researchBrief、riskBoundary 和状态更新路径。
    - 覆盖 Requirement 7.7、Requirement 5.4、Requirement 5.5；对应设计 Browser Tests。

- [x] 10. 检查点 - 确保所有测试通过
  - 确保所有测试通过,如有疑问请询问用户
