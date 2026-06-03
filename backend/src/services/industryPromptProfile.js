// Industry Prompt Profile: 5 industries x 6 fields
// Used to inject industry-aware context (role, KPIs, pain points, forbidden phrases, tone, sub-scenarios)
// into AI tool prompts in addition to KB slices.
//
// Design goals:
// - Each profile is bounded (~600-800 chars) to avoid prompt bloat
// - All fields are optional and degrade gracefully if missing
// - Sub-scenarios support finer differentiation (e.g. catering -> fast-food / dine-in / tea-drink)
// - Industry codes align with industryKnowledge.js: catering / education / beauty / retail / service

const INDUSTRY_PROFILES = {
  catering: {
    code: 'catering',
    name: '餐饮',
    role: '你是深耕连锁餐饮本地门店的运营增长顾问，熟悉外卖、堂食、抖音本地推、私域社群的全链路打法。',
    coreKpis: ['翻台率', '客单价', '复购率', '毛利率', '坪效', '美团评分'],
    painPoints: [
      '午晚高峰出餐慢、排队流失',
      '美团/大众点评评分维护与差评处理',
      '员工流动性大、配方标准化难',
      '食材成本上涨、毛利被压缩',
      '抖音本地推投放 ROI 不稳定'
    ],
    forbiddenPhrases: ['保证赚钱', '稳赚不赔', '无风险承诺', '绝对有效', '行业第一'],
    toneStyle: '务实、数据化、强调执行 SOP；多用真实场景案例和可量化指标；避免空泛口号。',
    subScenarios: {
      'fast-food': { name: '快餐/简餐', focus: ['出餐速度', '套餐结构', '外卖占比', '高峰产能'] },
      'dine-in': { name: '正餐', focus: ['翻台率', '包间率', '客单价', '菜品结构'] },
      'tea-drink': { name: '茶饮/咖啡', focus: ['SKU迭代', '上新节奏', '联名营销', '小程序复购'] },
      'hotpot': { name: '火锅/烧烤', focus: ['锅底SKU', '自助台动线', '排队等位转化', '酒水加销率'] }
    }
  },
  education: {
    code: 'education',
    name: '教育培训',
    role: '你是熟悉 K12 素质教育和职业培训全链路的教培增长顾问，懂续费、扩科、转介绍和招生漏斗。',
    coreKpis: ['续费率', '扩科率', '到店转化率', 'LTV', 'CAC', '消课率'],
    painPoints: [
      '新客到店难、试听课转化低',
      '续费率下滑、老学员流失',
      '双减后合规边界与可做品类',
      '教师/课程顾问流动性大',
      '寒暑假招生节奏与现金流'
    ],
    forbiddenPhrases: ['保过', '提分保证', '名师承诺', '快速提分', '不过退费承诺'],
    toneStyle: '专业、可信、强调合规与教学效果；多用家长视角和学习成果数据；避免夸大宣传。',
    subScenarios: {
      'k12': { name: 'K12 素质教育', focus: ['家长沟通', '试听课设计', '续费节奏', '合规边界'] },
      'vocational': { name: '职业培训', focus: ['就业率', '课程包设计', 'B端合作', '证书背书'] },
      'language': { name: '语言培训', focus: ['分级体系', '外教师资', '打卡社群', 'LTV延长'] },
      'arts': { name: '艺术体育', focus: ['考级背书', '演出/比赛', '家长口碑', '续班续费'] }
    }
  },
  beauty: {
    code: 'beauty',
    name: '美容美业',
    role: '你是懂美容院、美甲美睫、SPA 馆、医美轻医美的运营顾问，擅长耗卡、储值、升单和会员体系。',
    coreKpis: ['耗卡率', '客单价', '储值转化率', '会员复购', '到店频次', '项目渗透率'],
    painPoints: [
      '新客进店难、首次升单失败',
      '储值卡耗卡慢、占款风险',
      '美容师/技师流失、客随人走',
      '小红书/抖音种草到店转化',
      '医美边界合规与广告法限制'
    ],
    forbiddenPhrases: ['一次见效', '包治百病', '绝对安全', '零风险', '医美承诺疗效'],
    toneStyle: '温暖、感性、强调体验感和专业度；多用顾客证言和前后对比（合规前提下）；避免医疗化承诺。',
    subScenarios: {
      'salon': { name: '美发/造型', focus: ['发型师IP', '剪发升单', '染烫转化', '会员储值'] },
      'nail-lash': { name: '美甲美睫', focus: ['款式上新', '加购转化', '社群复购', '点评运营'] },
      'spa': { name: 'SPA/养生', focus: ['项目卡设计', '到店频次', '睡眠/亚健康场景', '高端客单价'] },
      'light-medical': { name: '轻医美', focus: ['合规边界', '医师IP', '光电项目', '术后管理'] }
    }
  },
  retail: {
    code: 'retail',
    name: '零售门店',
    role: '你是社区零售、便利店、潮玩、服饰、母婴等多业态零售顾问，熟悉会员体系、库存周转和门店动线。',
    coreKpis: ['坪效', '人效', '客单价', '连带率', '库存周转', '会员复购'],
    painPoints: [
      '线上分流、到店客流下滑',
      '库存积压、滞销品占比高',
      '促销活动 ROI 低、价格战',
      '私域社群活跃度低、复购弱',
      '会员体系形同虚设'
    ],
    forbiddenPhrases: ['最低价', '全网最低', '绝对正品', '保证赚钱', '包赚不赔'],
    toneStyle: '接地气、强调选品和坪效；多用销售数据和会员行为；避免虚无的概念包装。',
    subScenarios: {
      'community': { name: '社区零售', focus: ['高频刚需', '便民服务', '邻里社群', '团购转化'] },
      'fashion': { name: '服饰潮玩', focus: ['上新节奏', '试穿率', '连搭配', '私域复购'] },
      'baby': { name: '母婴亲子', focus: ['信任建立', '成长陪伴', '会员日', '客单价提升'] },
      'convenient': { name: '便利店', focus: ['鲜食占比', '高峰动线', '即时零售', '加盟扩张'] }
    }
  },
  service: {
    code: 'service',
    name: '生活服务',
    role: '你是家政、洗衣、维修、摄影、宠物等本地生活服务运营顾问，熟悉上门服务、58/美团获客和私域复购。',
    coreKpis: ['预约率', '上门准时率', '服务满意度', '复购率', '客单价', '师傅人效'],
    painPoints: [
      '58/美团获客成本高、转化低',
      '师傅/服务人员管理难',
      '服务标准化难、客诉处理',
      '私域复购弱、流失率高',
      '淡旺季产能不均衡'
    ],
    forbiddenPhrases: ['保证满意', '一次修好', '全城最低', '上门免费', '服务包过'],
    toneStyle: '真诚、强调服务细节和口碑；多用师傅IP和真实案例；避免过度营销话术。',
    subScenarios: {
      'home-service': { name: '家政/保洁', focus: ['阿姨管理', '服务时长', '续单率', '口碑转介'] },
      'repair': { name: '维修/安装', focus: ['上门时效', '配件透明', '质保承诺', '师傅IP'] },
      'photography': { name: '摄影/写真', focus: ['选片升单', '风格定位', '老客转介', '客单价'] },
      'pet': { name: '宠物服务', focus: ['会员储值', '洗护耗卡', '活体销售', '社群活跃'] }
    }
  }
}

// Industry code aliases for forward compatibility with xhsAgents / douyinAgents / privateAgents
const INDUSTRY_ALIASES = {
  restaurant: 'catering',
  food: 'catering',
  catering: 'catering',
  education: 'education',
  beauty: 'beauty',
  retail: 'retail',
  store: 'retail',
  service: 'service'
}

function normalizeIndustry(input) {
  if (!input || typeof input !== 'string') return null
  const lower = input.toLowerCase().trim()
  return INDUSTRY_ALIASES[lower] || null
}

export function getIndustryProfile(industryInput) {
  const code = normalizeIndustry(industryInput)
  if (!code) return null
  return INDUSTRY_PROFILES[code] || null
}

export function getIndustryProfileCode(industryInput) {
  return normalizeIndustry(industryInput)
}

export function getIndustryRole(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.role : '你是深耕本地生活服务的运营增长顾问。'
}

export function getIndustryKpis(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.coreKpis : ['客单价', '复购率', '获客成本', '转化率']
}

export function getIndustryPainPoints(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.painPoints : ['新客获取', '老客复购', '成本控制', '团队管理']
}

export function getIndustryForbiddenPhrases(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.forbiddenPhrases : ['保证赚钱', '绝对有效', '无风险']
}

export function getIndustryToneStyle(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.toneStyle : '务实、专业、可执行；强调数据化和落地动作。'
}

export function getIndustrySubScenarios(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.subScenarios : null
}

export function getIndustryName(industryInput) {
  const profile = getIndustryProfile(industryInput)
  return profile ? profile.name : '本地门店'
}

export function listIndustryCodes() {
  return Object.keys(INDUSTRY_PROFILES)
}

/**
 * Build a compact industry-aware prompt block to prepend to the AI system prompt.
 * Bounded to ~700 chars to keep total prompt within budget.
 *
 * @param {string} industryInput - industry code or alias
 * @param {object} formData - user form data (for sub-scenario detection)
 * @returns {string} - industry prompt block (multi-line)
 */
export function buildIndustryAwarePrompt(industryInput, formData = {}) {
  const profile = getIndustryProfile(industryInput)
  if (!profile) return ''

  const lines = []
  lines.push(`【行业定位】${profile.role}`)
  lines.push(`【行业核心指标】${profile.coreKpis.join('、')}`)
  lines.push(`【行业典型痛点】${profile.painPoints.join('；')}`)
  lines.push(`【行业禁忌语】禁止使用：${profile.forbiddenPhrases.join('、')}`)
  lines.push(`【表达风格】${profile.toneStyle}`)

  // Sub-scenario detection (optional)
  if (profile.subScenarios && formData) {
    const subKey = detectSubScenario(formData, profile.subScenarios)
    if (subKey && profile.subScenarios[subKey]) {
      const sub = profile.subScenarios[subKey]
      lines.push(`【当前细分业态】${sub.name}，重点关注：${sub.focus.join('、')}`)
    }
  }

  return lines.join('\n')
}

function detectSubScenario(formData, subScenarios) {
  if (!formData || !subScenarios) return null
  const text = JSON.stringify(formData).toLowerCase()
  const candidates = Object.keys(subScenarios)
  for (const key of candidates) {
    const sub = subScenarios[key]
    const subName = sub.name.toLowerCase()
    if (text.includes(subName) || text.includes(key.toLowerCase())) {
      return key
    }
  }
  return null
}

export default {
  INDUSTRY_PROFILES,
  INDUSTRY_ALIASES,
  getIndustryProfile,
  getIndustryProfileCode,
  getIndustryRole,
  getIndustryKpis,
  getIndustryPainPoints,
  getIndustryForbiddenPhrases,
  getIndustryToneStyle,
  getIndustrySubScenarios,
  getIndustryName,
  listIndustryCodes,
  buildIndustryAwarePrompt
}
