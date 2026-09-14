const METRIC_KEYS = ['views', 'valid_leads', 'appointments', 'arrivals', 'trial_completed', 'new_sales', 'renewals', 'eligible_renewals', 'spend']
const PROBLEM_CODES = new Set(['leads_low', 'arrival_low', 'sale_low', 'renewal_low', 'unknown'])
const SENSITIVE_KEYS = /^(name|姓名|孩子|宝宝|学员|childName|customerName|phone|mobile|telephone|联系方式)$/i

export const BUSINESS_PROBLEM_OPTIONS = [
  { code: 'leads_low', label: '有播放，没咨询' },
  { code: 'arrival_low', label: '有咨询/预约，没到店' },
  { code: 'sale_low', label: '到店了，没成交' },
  { code: 'renewal_low', label: '成交了，续费差' },
  { code: 'unknown', label: '不知道问题在哪里' }
]

export function validateBusinessInput(input = {}) {
  const source = input.businessLoop || input
  const errors = []
  const warnings = []
  const sanitized = {}
  const problemCode = String(source.problem_code || source.problemCode || 'unknown')
  if (!PROBLEM_CODES.has(problemCode)) errors.push('problem_code无效')
  sanitized.problem_code = problemCode
  for (const key of ['course_name', 'age_range', 'city', 'content_note', 'sales_note', 'delivery_note']) {
    if (source[key] !== undefined && source[key] !== null) sanitized[key] = String(source[key]).trim().slice(0, 500)
  }
  for (const key of METRIC_KEYS) {
    if (source[key] === undefined || source[key] === null || source[key] === '') continue
    const value = Number(source[key])
    if (!Number.isFinite(value) || value < 0) errors.push(`${key}必须是非负数字`)
    else sanitized[key] = value
  }
  for (const [key, value] of Object.entries(source)) {
    if (SENSITIVE_KEYS.test(key)) errors.push(`${key}不应填写个人信息`)
    if (key.includes('phone') || key.includes('mobile')) errors.push(`${key}不应填写联系方式`)
  }
  if (!Object.keys(sanitized).some(key => METRIC_KEYS.includes(key))) warnings.push('尚未填写经营指标，诊断只能作为待核验假设')
  return { valid: errors.length === 0, errors, warnings, value: sanitized }
}

function ratio(a, b) { return b > 0 ? a / b : null }

export function buildBusinessDiagnosis(input = {}) {
  const checked = validateBusinessInput(input)
  if (!checked.valid) return { status: 'needs_review', errors: checked.errors, warnings: checked.warnings, output: null }
  const m = checked.value
  const evidence = []
  let primaryIssue = '补齐并连续记录机构聚合指标'
  let basis = ['funnel-definition']
  let actions = [{ title: '连续记录一周完整经营漏斗', owner: 'principal', duration: '7天', metric: 'valid_leads/appointments/arrivals/new_sales' }]
  let excludedActions = ['数据不足前不扩大投流']
  if (m.problem_code === 'leads_low' || (m.valid_leads === 0 && m.views > 0)) {
    primaryIssue = '曝光未形成有效咨询'
    basis = ['funnel-traffic', 'content-action-card']
    evidence.push({ metric: 'valid_leads', value: m.valid_leads ?? null }, { metric: 'views', value: m.views ?? null })
    actions = [{ title: '只测试一个家长问题内容方向', owner: 'marketing_lead', duration: '7天', metric: 'valid_leads' }]
  } else if (m.problem_code === 'arrival_low' || (m.valid_leads > 0 && m.appointments > 0 && m.arrivals === 0)) {
    primaryIssue = '预约未形成到店'
    basis = ['funnel-traffic', 'trial-offer']
    evidence.push({ metric: 'appointments', value: m.appointments ?? null }, { metric: 'arrivals', value: m.arrivals ?? null })
    actions = [{ title: '重做预约确认与体验课到店提醒', owner: 'sales_lead', duration: '7天', metric: 'arrival_rate' }]
  } else if (m.problem_code === 'renewal_low' || (m.trial_completed > 0 && m.new_sales > 0 && m.renewals === 0 && m.eligible_renewals > 0)) {
    primaryIssue = '成交后续费承接不足'
    basis = ['funnel-renewal']
    evidence.push({ metric: 'renewals', value: m.renewals ?? null }, { metric: 'eligible_renewals', value: m.eligible_renewals ?? null })
    actions = [{ title: '建立一次成长反馈与续费沟通', owner: 'principal', duration: '7天', metric: 'renewal_rate' }]
  } else if (m.problem_code === 'sale_low' || (m.arrivals > 0 && m.new_sales === 0)) {
    primaryIssue = '到店未形成正价成交'
    basis = ['funnel-sale', 'trial-offer']
    evidence.push({ metric: 'arrivals', value: m.arrivals ?? null }, { metric: 'new_sales', value: m.new_sales ?? null })
    actions = [{ title: '重做体验课承接卡并记录家长异议', owner: 'principal', duration: '7天', metric: 'trial_to_sale' }]
  }
  if (m.spend > 0) excludedActions.push('在承接和利润口径确认前不扩大投流')
  const metrics = {
    appointment_rate: ratio(m.appointments, m.valid_leads),
    arrival_rate: ratio(m.arrivals, m.appointments),
    trial_conversion_rate: ratio(m.new_sales, m.trial_completed),
    renewal_rate: ratio(m.renewals, m.eligible_renewals)
  }
  return { status: 'needs_review', warnings: checked.warnings, output: { conclusion: primaryIssue, phenomenon: primaryIssue, primaryCause: primaryIssue, basis, basisType: 'structured_knowledge', evidence, actionCards: actions, actions, priorities: [primaryIssue], excludedActions, validationMetrics: Object.keys(metrics).filter(key => metrics[key] !== null), stopConditions: ['连续两轮无改善、预算超限或出现隐私风险时停止'], metrics, knowledgeStatus: 'needs_review', needs_review: true, source: 'deterministic_business_rule' } }
}

export function compareBusinessPeriods(previous = {}, current = {}, actionCompleted = false) {
  const prevSales = Number(previous.new_sales || 0)
  const currentSales = Number(current.new_sales || 0)
  const prevLeads = Number(previous.valid_leads || 0)
  const currentLeads = Number(current.valid_leads || 0)
  if (!Object.keys(current).length) return { decision: 'consultant', reason: '缺少下一周期数据' }
  if (!actionCompleted) return { decision: 'adjust', reason: '行动未完成，先补齐执行记录' }
  if (currentSales > prevSales || currentLeads > prevLeads) return { decision: 'continue', reason: '核心指标较上周期改善' }
  if (currentSales === prevSales && currentLeads === prevLeads) return { decision: 'adjust', reason: '核心指标未改善，调整当前行动' }
  return { decision: 'stop', reason: '核心指标下降，停止扩大动作并人工复核' }
}
