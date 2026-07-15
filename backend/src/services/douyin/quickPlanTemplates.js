export const quickPlanPhaseTemplates = [
  { key: 'test', name: '第 1-5 天：测试期（验证内容模型）', phase: '测试期', dayRange: [1, 5] },
  { key: 'scale', name: '第 6-10 天：放大期（赛马放量）', phase: '放大期', dayRange: [6, 10] },
  { key: 'convert', name: '第 11-15 天：收割期（转化变现）', phase: '收割期', dayRange: [11, 15] }
]

export const quickPlanDayTemplates = [
  {
    day: 1,
    phaseKey: 'test',
    status: '进行中',
    workType: '测试内容',
    videoFunction: '信任建立',
    shootingMethod: '老板口播',
    goalIntent: '发布第 1 条主推产品避坑视频',
    topicIntent: '围绕用户顾虑讲主推产品的避坑指南',
    executionTool: '脚本生成器 / 标题优化器',
    adIntent: '小额测试或自然流量观察 3 秒留存',
    nurtureIntent: '评论区收集目标客户对主推产品的顾虑',
    metricIntent: '完播率、评论问题和用户顾虑命中'
  },
  {
    day: 2,
    phaseKey: 'test',
    status: '未开始',
    workType: '测试内容',
    videoFunction: '同城拉新',
    shootingMethod: '门店实拍',
    goalIntent: '发布主推产品真实过程视频',
    topicIntent: '拍证明素材并解释价格权益',
    executionTool: '脚本生成器 / 封面助手',
    adIntent: '自然流量测试真实过程内容',
    nurtureIntent: '置顶评论引导用户按转化路径行动',
    metricIntent: '点赞率、主页访问和行动点击'
  },
  {
    day: 3,
    phaseKey: 'test',
    status: '未开始',
    workType: '复盘记录',
    videoFunction: '数据复盘',
    shootingMethod: '数据表复盘',
    goalIntent: '复盘前 2 条数据并确定高潜力方向',
    topicIntent: '对比顾虑内容和证明素材内容的数据',
    executionTool: '视频数据诊断',
    adIntent: '暂停放量，先完成数据判断',
    nurtureIntent: '整理围绕主推产品的高频问题用于私信承接',
    metricIntent: '确定 1 个保留方向和 1 个淘汰方向'
  },
  {
    day: 4,
    phaseKey: 'test',
    status: '未开始',
    workType: '赛马内容',
    videoFunction: '同城拉新',
    shootingMethod: '口播 + 门店画面',
    goalIntent: '发布用户顾虑深化视频',
    topicIntent: '延续高数据模板并替换为用户顾虑切入',
    executionTool: '脚本生成器 / 标题优化器',
    adIntent: '对高数据视频追投或观察推荐流量放大',
    nurtureIntent: '评论区承接咨询并引导转化路径',
    metricIntent: '播放量、私信数和顾虑问题增长'
  },
  {
    day: 5,
    phaseKey: 'test',
    status: '未开始',
    workType: '转化内容',
    videoFunction: '成交转化',
    shootingMethod: '口播 + 门店画面',
    goalIntent: '发布主推产品行动引导视频',
    topicIntent: '讲清价格权益并引导用户执行转化路径',
    executionTool: '转化链路 / 视频数据诊断',
    adIntent: '自然流量验证转化话术',
    nurtureIntent: '围绕主推产品做私信促单和权益答疑',
    metricIntent: '转化率和咨询到行动链路'
  },
  {
    day: 6,
    phaseKey: 'scale',
    status: '未开始',
    workType: '赛马内容',
    videoFunction: '同城拉新',
    shootingMethod: '口播 + 门店画面',
    goalIntent: '把主推产品拆成 3 条变体',
    topicIntent: '用顾虑、证明素材和价格权益三个角度赛马',
    executionTool: '脚本生成器 / 标题优化器',
    adIntent: '对跑量素材开启小预算赛马或集中发布高潜力方向',
    nurtureIntent: '把评论问题沉淀成私信回复模板',
    metricIntent: '至少 1 条进入下一级流量池'
  },
  {
    day: 7,
    phaseKey: 'scale',
    status: '未开始',
    workType: '赛马内容',
    videoFunction: '信任建立',
    shootingMethod: '老板口播',
    goalIntent: '复制高数据钩子继续讲主推产品',
    topicIntent: '复用已验证钩子并替换为具体消费场景',
    executionTool: '脚本生成器 / 封面助手',
    adIntent: '自然流量复制高表现模板',
    nurtureIntent: '引导用户收藏并执行转化路径',
    metricIntent: '收藏率和私信关键词数量增长'
  },
  {
    day: 8,
    phaseKey: 'scale',
    status: '未开始',
    workType: '测试内容',
    videoFunction: '成交转化',
    shootingMethod: '顾客案例',
    goalIntent: '交叉测试剧情或福利方向',
    topicIntent: '用目标客户场景测试价格权益吸引力',
    executionTool: '脚本生成器 / 转化链路',
    adIntent: '用小样本判断新方向可行性',
    nurtureIntent: '转化路径加权益答疑',
    metricIntent: '新方向可行性和咨询成本'
  },
  {
    day: 9,
    phaseKey: 'scale',
    status: '未开始',
    workType: '复盘记录',
    videoFunction: '数据复盘',
    shootingMethod: '数据表复盘',
    goalIntent: '复盘数据并淘汰低效内容类型',
    topicIntent: '聚焦能推动转化路径的高 ROI 方向',
    executionTool: '视频数据诊断 / 投流评估',
    adIntent: '加大高转化素材预算或保留高互动内容模板',
    nurtureIntent: '把高意向用户分为待了解、待行动和待复购',
    metricIntent: '主力内容方向和下一轮预算分配'
  },
  {
    day: 10,
    phaseKey: 'scale',
    status: '未开始',
    workType: '案例内容',
    videoFunction: '信任建立',
    shootingMethod: '顾客案例',
    goalIntent: '发布案例背书视频',
    topicIntent: '展示证明素材并回应用户顾虑',
    executionTool: '脚本生成器 / 视频数据诊断',
    adIntent: '自然流量验证案例信任素材',
    nurtureIntent: '私信发送案例清单和到店提醒',
    metricIntent: '互动率提升和案例内容带来的咨询'
  },
  {
    day: 11,
    phaseKey: 'convert',
    status: '未开始',
    workType: '转化内容',
    videoFunction: '成交转化',
    shootingMethod: '口播 + 门店画面',
    goalIntent: '发布强转化视频',
    topicIntent: '价格权益加紧迫感话术，明确购买理由',
    executionTool: '脚本生成器 / 转化链路',
    adIntent: '转化目标投放或评论区置顶福利信息',
    nurtureIntent: '转化路径加到店提醒',
    metricIntent: '转化指标、行动数和咨询转化率'
  },
  {
    day: 12,
    phaseKey: 'convert',
    status: '未开始',
    workType: '案例内容',
    videoFunction: '信任建立',
    shootingMethod: '顾客案例',
    goalIntent: '发布信任背书视频',
    topicIntent: '证明素材、用户反馈和门店实力组合',
    executionTool: '脚本生成器 / 封面助手',
    adIntent: '自然流量承接犹豫用户',
    nurtureIntent: '向犹豫用户发送案例背书',
    metricIntent: '主页访问和私信成交意向增加'
  },
  {
    day: 13,
    phaseKey: 'convert',
    status: '未开始',
    workType: '转化内容',
    videoFunction: '成交转化',
    shootingMethod: '口播 + 门店画面',
    goalIntent: '发布最后冲刺促单视频',
    topicIntent: '最后行动理由并集中回应用户顾虑',
    executionTool: '脚本生成器 / 投流评估',
    adIntent: '最后冲刺投放或集中回复评论和私信',
    nurtureIntent: '转化路径加未行动用户二次提醒',
    metricIntent: '转化率、核销或到店预约提升'
  },
  {
    day: 14,
    phaseKey: 'convert',
    status: '未开始',
    workType: '复盘记录',
    videoFunction: '数据复盘',
    shootingMethod: '数据表复盘',
    goalIntent: '全量复盘 15 天数据并评估 ROI',
    topicIntent: '对比起始数据并评估播放、咨询、成交和投流 ROI',
    executionTool: '视频数据诊断 / 投流评估',
    adIntent: '停止低效素材并保留高转化路径',
    nurtureIntent: '标记已行动用户、犹豫用户和复购用户',
    metricIntent: '整体目标达成率、ROI 和下一轮短板'
  },
  {
    day: 15,
    phaseKey: 'convert',
    status: '未开始',
    workType: '复盘记录',
    videoFunction: '数据复盘',
    shootingMethod: '数据表复盘',
    goalIntent: '制定下一周期计划并固化 SOP',
    topicIntent: '固化成功内容 SOP，规划新内容方向和预算节奏',
    executionTool: '15 天计划 / 90 天战略',
    adIntent: '保留有效动作并规划下一轮预算节奏',
    nurtureIntent: '将成交用户纳入复购提醒和私域跟进',
    metricIntent: '3 个保留动作和 2 个优化动作'
  }
]

export const getQuickPlanDayTemplates = () => quickPlanDayTemplates.map((template) => ({ ...template }))

export const getQuickPlanPhaseTemplates = () => quickPlanPhaseTemplates.map((template) => ({ ...template }))

export const groupQuickPlanTemplatesByPhase = () => {
  const templates = getQuickPlanDayTemplates()
  return getQuickPlanPhaseTemplates().map((phase) => ({
    ...phase,
    days: templates.filter((template) => template.phaseKey === phase.key)
  }))
}
