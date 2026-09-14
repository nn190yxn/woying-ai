import { query } from '../../models/db.js'
import { runStructuredSkill } from '../aiRunner.js'
import { buildBusinessDiagnosis, validateBusinessInput } from './businessLoop.js'

export async function listProjects(organizationId) {
  return query('SELECT * FROM acquisition_projects WHERE organization_id = ? AND status = \'active\' ORDER BY updated_at DESC', [organizationId])
}

export async function getProject(projectId, organizationId) {
  const rows = await query('SELECT * FROM acquisition_projects WHERE id = ? AND organization_id = ?', [projectId, organizationId])
  return rows[0] || null
}

export async function createProject({ organizationId, userId, name, goal, channels = [] }) {
  const result = await query('INSERT INTO acquisition_projects (organization_id, name, goal, created_by) VALUES (?, ?, ?, ?)', [organizationId, name, goal || null, String(userId)])
  const projectId = result.insertId
  for (const channel of [...new Set(channels)].slice(0, 8)) {
    await query('INSERT INTO acquisition_channels (project_id, channel_code, config) VALUES (?, ?, ?)', [projectId, channel, JSON.stringify({})])
  }
  return getProject(projectId, organizationId)
}

export async function createDiagnosis({ projectId, organizationId, channelCode, diagnosisType = 'funnel', inputData, knowledgeBasis = [] }) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  let output = { conclusion: '已接收输入，等待人工确认或AI运行配置', phenomenon: '数据待补齐', evidence: [], primaryCause: '需要人工核验', secondaryCauses: [], actionCards: [], validationMetrics: [], stopConditions: ['数据不足或出现隐私风险时停止'], basis: knowledgeBasis, basisType: 'structured_knowledge', lastVerified: new Date().toISOString().slice(0, 10), needs_review: true, priorities: [], actions: [], risks: [], source: 'needs_review' }
  let status = 'needs_review'
  const businessInput = inputData?.businessLoop
  if (businessInput) {
    const checked = validateBusinessInput(businessInput)
    if (!checked.valid) throw Object.assign(new Error(checked.errors.join('；')), { status: 400 })
    const deterministic = buildBusinessDiagnosis(businessInput)
    output = { ...output, ...(deterministic.output || {}), basis: knowledgeBasis.length ? knowledgeBasis : deterministic.output?.basis || [] }
  }
  if (process.env.USER_LLM_API_KEY || process.env.MCAI_LLM_API_KEY || process.env.OPENAI_API_KEY) {
    const run = await runStructuredSkill({ organizationId, skillCode: channelCode === 'douyin' ? 'acquisition.douyin_diagnosis' : channelCode === 'xhs' ? 'acquisition.xhs_diagnosis' : 'growth.funnel_diagnosis', scene: channelCode || 'local', channel: channelCode, input: { project: { name: project.name, goal: project.goal }, diagnosisType, knowledgeBasis, input: inputData }, invoke: async (safeInput, skill, context) => {
      const { generateStructured } = await import('../ai.js')
      const raw = await generateStructured({ systemPrompt: `你是儿童素质培训机构${skill.skillCode}顾问。只输出符合Skill契约的JSON。`, userPrompt: JSON.stringify({ input: safeInput, context }), responseFormat: { type: 'json_object' } })
      return JSON.parse(raw)
    } })
    output = run.output || { ...output, errors: run.errors, error: run.error }
    status = run.status
  }
  const result = await query('INSERT INTO acquisition_diagnoses (project_id, channel_code, input_data, output_data, status, skill_version) VALUES (?, ?, ?, ?, ?, ?)', [projectId, channelCode || null, JSON.stringify(inputData || {}), JSON.stringify(output), status, 'acquisition-core@1.0.0'])
  const rows = await query('SELECT * FROM acquisition_diagnoses WHERE id = ?', [result.insertId])
  return rows[0]
}

export async function updateProject(projectId, organizationId, patch = {}) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  const name = patch.name === undefined ? project.name : String(patch.name).trim()
  if (!name) throw Object.assign(new Error('项目名称不能为空'), { status: 400 })
  const status = patch.status === 'archived' ? 'archived' : 'active'
  await query('UPDATE acquisition_projects SET name = ?, goal = ?, status = ? WHERE id = ? AND organization_id = ?', [name, patch.goal === undefined ? project.goal : patch.goal, status, projectId, organizationId])
  return getProject(projectId, organizationId)
}

export async function listDiagnoses(projectId, organizationId) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  return query('SELECT * FROM acquisition_diagnoses WHERE project_id = ? ORDER BY created_at DESC', [projectId])
}

export async function listActionPlans(projectId, organizationId) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  return query('SELECT * FROM acquisition_action_plans WHERE project_id = ? ORDER BY created_at DESC', [projectId])
}

export async function createSnapshot({ projectId, organizationId, metrics = {}, summary = '' }) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  const metricKeys = ['views','likes','comments','shares','followers','leads','appointments','deals','spend','valid_leads','arrivals','trial_completed','new_sales','new_sale_revenue']
  const safeMetrics = Object.fromEntries(Object.entries(metrics).filter(([key, value]) => metricKeys.includes(key) && Number.isFinite(Number(value)) && Number(value) >= 0).map(([key, value]) => [key, Number(value)]))
  const div = (a, b) => b > 0 ? a / b : null
  const derived = {}
  const addRatio = (name, numerator, denominator, denominatorKey) => {
    if (Object.prototype.hasOwnProperty.call(safeMetrics, denominatorKey)) derived[name] = div(numerator, denominator)
  }
  addRatio('cost_per_valid_lead', safeMetrics.spend, safeMetrics.valid_leads, 'valid_leads')
  addRatio('cost_per_arrival', safeMetrics.spend, safeMetrics.arrivals, 'arrivals')
  addRatio('cost_per_sale', safeMetrics.spend, safeMetrics.new_sales, 'new_sales')
  addRatio('appointment_rate', safeMetrics.appointments, safeMetrics.valid_leads, 'valid_leads')
  addRatio('arrival_rate', safeMetrics.arrivals, safeMetrics.appointments, 'appointments')
  addRatio('trial_conversion_rate', safeMetrics.new_sales, safeMetrics.trial_completed, 'trial_completed')
  if (Object.prototype.hasOwnProperty.call(metrics, 'renewals') && Object.prototype.hasOwnProperty.call(metrics, 'eligible_renewals')) derived.renewal_rate = div(Number(metrics.renewals), Number(metrics.eligible_renewals))
  Object.assign(safeMetrics, derived)
  const result = await query('INSERT INTO acquisition_snapshots (project_id, snapshot_date, metrics, summary) VALUES (?, ?, ?, ?)', [projectId, new Date().toISOString().slice(0, 10), JSON.stringify(safeMetrics), String(summary || '').slice(0, 2000)])
  const rows = await query('SELECT * FROM acquisition_snapshots WHERE id = ?', [result.insertId])
  return rows[0]
}

export async function listSnapshots(projectId, organizationId) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  return query('SELECT s.* FROM acquisition_snapshots s JOIN acquisition_projects p ON p.id = s.project_id WHERE s.project_id = ? AND p.organization_id = ? ORDER BY s.snapshot_date DESC', [projectId, organizationId])
}

export async function createActionPlan({ projectId, organizationId, diagnosisId, templateCode = null, title = '阶段获客行动计划', planData: suppliedPlanData = null }) {
  const project = await getProject(projectId, organizationId)
  if (!project) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  if (diagnosisId) {
    const diagnosisRows = await query('SELECT * FROM acquisition_diagnoses WHERE id = ?', [diagnosisId])
    if (!diagnosisRows[0] || Number(diagnosisRows[0].project_id) !== Number(projectId)) throw Object.assign(new Error('诊断不存在或不属于当前机构项目'), { status: 404 })
  }
  let planData = suppliedPlanData
  if (!planData && diagnosisId) {
    const diagnosis = (await query('SELECT * FROM acquisition_diagnoses WHERE id = ?', [diagnosisId]))[0]
    let output = {}
    try { output = typeof diagnosis?.output_data === 'string' ? JSON.parse(diagnosis.output_data) : (diagnosis?.output_data || {}) } catch { output = {} }
    const actions = (output.actionCards || output.actions || []).slice(0, 2).map(action => typeof action === 'string' ? { title: action, completion: '提交执行结果或聚合指标' } : { ...action, completion: action.completion || action.validation || '提交执行结果或聚合指标', status: 'pending' })
    planData = { goal: `验证：${output.conclusion || '根据诊断执行下一阶段动作'}`, actions, validationMetrics: output.validationMetrics || [], stopConditions: output.stopConditions || [], executionStatus: 'pending' }
  }
  planData ||= { goal: '根据诊断执行下一阶段动作', actions: [{ title: '确认最高优先级问题', completion: '老板完成一次人工确认', status: 'pending' }, { title: '执行一项内容或活动动作', completion: '保存执行结果或汇总指标', status: 'pending' }, { title: '阶段复盘', completion: '提交截图或汇总数据', status: 'pending' }], validationMetrics: [], stopConditions: ['数据不足或出现隐私风险时停止'], executionStatus: 'pending' }
  const result = await query('INSERT INTO acquisition_action_plans (project_id, diagnosis_id, title, plan_data, template_code) VALUES (?, ?, ?, ?, ?)', [projectId, diagnosisId || null, title, JSON.stringify(planData), templateCode])
  const rows = await query('SELECT * FROM acquisition_action_plans WHERE id = ?', [result.insertId])
  return rows[0]
}
