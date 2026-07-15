const QUICK_PLAN_DEFAULT_INDUSTRY = 'restaurant'
const QUICK_PLAN_DEFAULT_GOAL = 'traffic'

export const industryStrategies = {
  restaurant: {
    code: 'restaurant',
    name: '餐饮',
    customerType: '附近想吃一顿省心饭的顾客',
    defaultProduct: '招牌菜或双人套餐',
    defaultOfferPrice: '套餐权益、使用时段、预约规则和核销限制',
    defaultObjection: '怕踩雷、怕排队、怕分量少',
    proofAssets: '食材新鲜度、出餐速度、真实分量、桌台翻台和老客评价',
    sceneAssets: '门头、后厨出餐、招牌菜特写和客人进店画面',
    conversionMetric: '团购/核销数',
    actionEntry: '下单、团购券或私信路径',
    conversionPath: '点击主页团购券或私信发送套餐关键词',
    riskBoundary: [
      '价格权益、适用时段和核销限制需要在视频和评论区讲清楚。',
      '高播放素材放量前需要同步观察到店、核销和咨询质量。',
      '避免使用夸大口味、虚假原价和无法兑现的限时承诺。'
    ],
    forbiddenTerms: ['体验卡', '疗程', '试听课', '测评课']
  },
  beauty: {
    code: 'beauty',
    name: '美业',
    customerType: '想变好看又担心踩坑的顾客',
    defaultProduct: '体验项目或护理套餐',
    defaultOfferPrice: '体验卡权益、适用项目、到店流程和升级规则',
    defaultObjection: '怕效果差、怕推销、怕卫生没保障',
    proofAssets: '操作流程、工具消毒、产品资质、服务细节和顾客反馈',
    sceneAssets: '门店环境、工具消毒、服务流程和前后对比画面',
    conversionMetric: '预约/留资数',
    actionEntry: '预约、留资或私信路径',
    conversionPath: '私信发送体验项目或点击预约到店',
    riskBoundary: [
      '涉及效果对比时需要使用真实案例和清晰边界表达。',
      '预约留资素材需要同步承接顾客顾虑、到店流程和体验卡规则。',
      '避免使用绝对效果、医疗承诺和无法证明的前后对比。'
    ],
    forbiddenTerms: ['团购核销', '套餐核销', '试听课', '升学']
  },
  education: {
    code: 'education',
    name: '教培',
    customerType: '正在给孩子选课的家长',
    defaultProduct: '试听课或测评课',
    defaultOfferPrice: '试听名额、测评内容、适合年级和课后反馈方式',
    defaultObjection: '怕老师不负责、怕孩子不适应、怕花钱没效果',
    proofAssets: '老师资质、课堂互动、学习成果、测评过程和家长反馈',
    sceneAssets: '课堂片段、老师讲解、学员练习和课后反馈画面',
    conversionMetric: '试听/留资数',
    actionEntry: '试听、留资或私信路径',
    conversionPath: '私信发送年级和学习问题，预约试听或测评课',
    riskBoundary: [
      '升学、提分和学习效果表达需要基于真实案例和测评边界。',
      '试听留资后需要明确老师反馈、适合年级和下一步课程建议。',
      '避免使用保分、保过、短期必提分等效果承诺。'
    ],
    forbiddenTerms: ['团购核销', '套餐核销', '医美', '疗程']
  },
  service: {
    code: 'service',
    name: '生活服务',
    customerType: '附近有明确服务需求的顾客',
    defaultProduct: '主推服务或体验套餐',
    defaultOfferPrice: '服务内容、报价范围、到店流程和售后边界',
    defaultObjection: '怕踩坑、怕价格不透明、怕体验不好',
    proofAssets: '服务流程、真实案例、客户评价和到店体验',
    sceneAssets: '门店环境、服务过程、工作人员讲解和客户反馈画面',
    conversionMetric: '预约/留资数',
    actionEntry: '预约、留资或私信路径',
    conversionPath: '私信发送需求或点击预约服务',
    riskBoundary: [
      '报价、服务范围和售后边界需要在素材中保持清晰。',
      '预约类内容需要把客户问题、服务流程和到店准备讲完整。',
      '避免使用无法兑现的低价承诺和夸大服务效果。'
    ],
    forbiddenTerms: ['团购核销', '试听课', '医美疗效']
  }
}

export const goalStrategies = {
  traffic: {
    code: 'traffic',
    name: '快速起量',
    phaseFocus: ['验证高停留选题', '复制高数据钩子', '固化内容 SOP'],
    reviewMetrics: ['播放量', '3 秒留存', '完播率', '互动率', '主页访问'],
    cta: '先收藏，评论区留下你的具体情况。'
  },
  conversion: {
    code: 'conversion',
    name: '成交转化',
    phaseFocus: ['讲清行动理由', '强化信任证据', '集中承接高意向用户'],
    reviewMetrics: ['私信数', '预约数', '到店数', '核销/留资数', '咨询转化率'],
    cta: '按视频里的路径行动，我帮你判断适合哪一档。'
  },
  leads: {
    code: 'leads',
    name: '线索收集',
    phaseFocus: ['设计低门槛线索钩子', '沉淀私信关键词', '分层跟进意向用户'],
    reviewMetrics: ['评论问题数', '私信关键词数', '表单数', '有效线索数', '跟进回复率'],
    cta: '私信发送你的需求，我把选择标准发你。'
  },
  live: {
    code: 'live',
    name: '直播预热',
    phaseFocus: ['预热直播主题', '收集直播问题', '引导预约和开播成交'],
    reviewMetrics: ['预约人数', '直播提醒点击', '评论问题数', '直播间停留', '直播成交/留资'],
    cta: '点预约，直播间我把细节讲透。'
  }
}

export const getIndustryStrategy = (industryCode = QUICK_PLAN_DEFAULT_INDUSTRY) => {
  return industryStrategies[industryCode] || industryStrategies[QUICK_PLAN_DEFAULT_INDUSTRY]
}

export const getGoalStrategy = (goalCode = QUICK_PLAN_DEFAULT_GOAL, industryCode = QUICK_PLAN_DEFAULT_INDUSTRY) => {
  const strategy = goalStrategies[goalCode] || goalStrategies[QUICK_PLAN_DEFAULT_GOAL]
  const industry = getIndustryStrategy(industryCode)
  if (goalCode !== 'conversion') return strategy

  return {
    ...strategy,
    name: industry.code === 'restaurant'
      ? '团购核销'
      : industry.code === 'education'
        ? '试听留资'
        : industry.code === 'beauty'
          ? '预约到店'
          : '预约留资',
    reviewMetrics: [industry.conversionMetric, '私信数', '到店数', '咨询转化率']
  }
}
