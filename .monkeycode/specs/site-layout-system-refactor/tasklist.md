# 需求实施计划

- [x] 1. 建立全站工作台设计基础
  - [x] 1.1 扩展前端设计令牌
    - 修改 `frontend/src/styles/variables.css`，补齐工作台背景、状态色、卡片密度、页面宽度、断点和组件尺寸令牌
    - 覆盖设计文档 Requirement 2.1、2.4、5.1、5.2、5.3、6.2

  - [x] 1.2 收口全局基础样式
    - 修改 `frontend/src/styles/main.css`，统一 `.container`、按钮、卡片、徽章、表单、页面区块和移动端基础规则
    - 覆盖设计文档 Requirement 1.3、2.1、4.4、5.4、6.3

  - [x] 1.3 创建或抽取工作台基础组件
    - 新增页面标题区、区块标题、状态标签、指标卡、键值列表、操作面板、分段标签等共享组件或共享 CSS 类
    - 覆盖设计文档 Requirement 1.1、2.2、2.3、3.2、6.1、6.3

  - [x]* 1.4 编写设计令牌和基础组件结构测试
    - 新增前端静态测试，验证共享类或组件存在并包含关键布局锚点
    - 校验 Property P1、P4、P5，对应 Requirement 1.1、4.4、6.3

- [x] 2. 重构全局导航和页面定位框架
  - [x] 2.1 调整全局导航桌面布局
    - 修改 `frontend/src/components/NavBar.vue`，统一经营任务导航、登录区和激活态样式
    - 覆盖设计文档 Requirement 3.1、3.4

  - [x] 2.2 调整全局导航移动端菜单
    - 优化移动端菜单展开、触控尺寸、登录入口和导航项间距
    - 覆盖设计文档 Requirement 3.4、5.3、5.4

  - [x] 2.3 为任务页建立页面级返回和下一步入口规范
    - 在诊断、计划、复盘和工具结果页中统一返回路径、页面任务说明和下一步操作位置
    - 覆盖设计文档 Requirement 3.2、4.4、6.1

  - [x]* 2.4 编写导航响应式属性测试
    - 验证导航在 375px、768px、1200px 下不产生页面级横向溢出
    - 校验 Property P2，对应 Requirement 5.1、5.2、5.3、5.4

- [x] 3. 重构公开入口页面工作台布局
  - [x] 3.1 重构首页为经营工作台入口
    - 修改 `frontend/src/views/Home.vue`，统一首屏任务、三主入口、作战表示例和会员引导的层级
    - 覆盖设计文档 Requirement 1.1、1.2、1.4、2.4

  - [x] 3.2 重构工具页为数据表与工具工作台
    - 修改 `frontend/src/views/Tools.vue`，统一筛选区、数据表卡片、推荐工具和专项入口的密度与状态表达
    - 覆盖设计文档 Requirement 1.3、2.3、3.1、6.3

  - [x] 3.3 重构会员页为经营权益工作台
    - 修改 `frontend/src/views/Membership.vue`，统一会员卡、权限矩阵、FAQ 和反馈区的视觉层级
    - 覆盖设计文档 Requirement 1.1、2.1、2.4、4.4

  - [x]* 3.4 编写公开入口页面结构测试
    - 验证首页、工具页、会员页包含页面标题区、主操作和统一卡片锚点
    - 校验 Property P1、P4，对应 Requirement 1.1、1.4、4.4

- [x] 4. 统一三类专项 Hub 页面
  - [x] 4.1 重构抖音 Hub 工作台布局
    - 修改 `frontend/src/views/DouyinAgentHub.vue`，使用统一四段链路、主线入口和权限状态卡片
    - 覆盖设计文档 Requirement 1.2、1.3、3.1、6.3

  - [x] 4.2 重构小红书 Hub 工作台布局
    - 修改 `frontend/src/views/XhsAgentHub.vue`，对齐“体检 -> 计划 -> 执行 -> 复盘”的结构和卡片密度
    - 覆盖设计文档 Requirement 1.2、1.3、3.1、6.3

  - [x] 4.3 重构私域 Hub 工作台布局
    - 修改 `frontend/src/views/PrivateAgentHub.vue`，对齐专项入口、执行工具和复盘入口展示规则
    - 覆盖设计文档 Requirement 1.2、1.3、3.1、6.3

  - [x]* 4.4 编写 Hub 页面一致性测试
    - 验证三类 Hub 都包含四段链路、权限标签和主线入口
    - 校验 Property P1、P5，对应 Requirement 1.2、1.3、6.3

- [x] 5. 重构抖音样板链路关键任务页
  - [x] 5.1 重构抖音体检页布局
    - 修改 `frontend/src/views/douyin/DiagnosisAgent.vue`，统一输入区、诊断报告、依据说明、风险边界和推荐动作区块
    - 覆盖设计文档 Requirement 1.2、2.2、4.3、6.1

  - [x] 5.2 重构 15 天计划页每日任务卡
    - 修改 `frontend/src/views/douyin/QuickPlanAgent.vue`，将每日任务拆为主内容、工具区、复盘区，避免窄列中文挤压
    - 覆盖设计文档 Requirement 2.2、4.1、4.4、5.4

  - [x] 5.3 重构 15 天计划页调研依据和执行边界
    - 将调研依据、执行边界和诊断上下文改为摘要、键值项或分组卡片
    - 覆盖设计文档 Requirement 2.2、2.3、4.1

  - [x] 5.4 重构视频数据复盘页工作台布局
    - 修改 `frontend/src/views/douyin/VideoDiagnoserAgent.vue`，将输入指标、核心分析、结论、沉淀和下一步动作分区展示
    - 覆盖设计文档 Requirement 2.3、4.2、4.4、5.4

  - [x]* 5.5 编写抖音链路结构和属性测试
    - 扩展 `frontend/scripts/quick-plan-structure.test.js` 或新增测试，检查计划页和复盘页工作台锚点
    - 校验 Property P1、P3、P4、P6，对应 Requirement 1.1、4.1、4.2、4.4

- [x] 6. 推广任务页和工具页统一结果布局
  - [x] 6.1 收口通用 Agent 页面基础样式
    - 修改 `frontend/src/views/agent-common.css` 和 `frontend/src/views/douyin/agent-common.css`，统一任务页标题、表单、结果、错误和升级提示样式
    - 覆盖设计文档 Requirement 2.1、4.4、6.3

  - [x] 6.2 重构主要小红书和私域任务页入口布局
    - 优先调整账号体检、私域体检和高频结果页的页面标题、表单区和结果区框架
    - 覆盖设计文档 Requirement 1.1、3.2、4.3、6.1

  - [x] 6.3 统一工具详情页和表格页结果区
    - 调整 `ToolDetail`、`SheetTemplate` 和常见工具页的卡片、表单、指标和操作按钮样式
    - 覆盖设计文档 Requirement 2.3、4.4、5.4、6.3

  - [x]* 6.4 编写任务页布局回归测试
    - 验证主要任务页保留 API 请求路径、权限跳转和错误状态展示
    - 校验 Property P6，对应 Requirement 3.1、6.3

- [x] 7. 检查点 - 确保所有测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 8. 完成响应式和视觉一致性收口
  - [x] 8.1 修复核心页面移动端布局
    - 逐页处理首页、工具页、会员页、三类 Hub、诊断、计划、复盘在 375px 和 768px 下的布局问题
    - 覆盖设计文档 Requirement 5.2、5.3、5.4

  - [x] 8.2 消除页面级横向溢出
    - 检查长文本、表格、按钮组、筛选项、任务卡和指标卡的换行、折叠或容器内滚动策略
    - 覆盖设计文档 Requirement 5.4

  - [x] 8.3 统一状态和会员权限视觉表达
    - 将锁定、可用、进行中、已完成、已复盘、升级提示等状态接入统一标签或共享样式
    - 覆盖设计文档 Requirement 1.3、4.4、6.3

  - [x]* 8.4 编写响应式 Playwright 或静态宽度测试
    - 覆盖 375px、768px、1200px，检查核心页面无横向溢出、主标题可见、主按钮可触达
    - 校验 Property P2、P3、P4，对应 Requirement 5.1、5.2、5.3、5.4

- [x] 9. 检查点 - 确保所有测试通过
  - 确保所有测试通过,如有疑问请询问用户

- [x] 10. 构建验证和文档同步
  - [x] 10.1 运行前端生产构建并修复构建问题
    - 执行 `cd frontend && npm run build`，处理 Vue、CSS 和路由懒加载相关报错
    - 覆盖设计文档 Test Strategy 和 Property P6

  - [x] 10.2 更新前端 Wiki 文档
    - 更新 `.monkeycode/docs/模块/Frontend.md` 和 `.monkeycode/docs/代码目录导览.md`，记录新的布局组件、样式入口和验证命令
    - 覆盖设计文档 Requirement 6.1、6.2、6.3

  - [x]* 10.3 执行核心页面浏览器截图验收
    - 使用本地预览检查首页、工具页、会员页、三类 Hub、诊断、计划、复盘在桌面和移动端的首屏表现
    - 校验 Property P1、P2、P3、P4、P5、P6，对应全部布局需求
