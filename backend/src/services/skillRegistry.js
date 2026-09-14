const diagnosticContract = ['conclusion', 'basis', 'priorities', 'actions', 'risks', 'evidence', 'validationMetrics', 'stopConditions', 'knowledgeStatus']
const skills = new Map([
  ['acquisition.diagnosis', { skillCode: 'acquisition.diagnosis', version: '1.0.0', productDomain: 'acquisition', scenes: ['douyin', 'xhs', 'live', 'local'], output: ['conclusion', 'basis', 'priorities', 'actions', 'risks'] }],
  ...['growth.funnel_diagnosis','acquisition.douyin_diagnosis','acquisition.xhs_diagnosis','acquisition.offer_diagnosis','acquisition.content_plan','acquisition.traffic_experiment'].map(skillCode => [skillCode, { skillCode, version: '1.0.0', productDomain: skillCode.startsWith('growth') ? 'growth' : 'acquisition', scenes: ['douyin','xhs','local','weekly'], output: diagnosticContract }]),
  ['growth.weekly_review', { skillCode: 'growth.weekly_review', version: '1.0.0', productDomain: 'growth', scenes: ['weekly'], output: ['primaryIssue','evidence','actions','validationMetrics','stopConditions','knowledgeStatus'] }],
  ['service.consultant_escalation', { skillCode: 'service.consultant_escalation', version: '1.0.0', productDomain: 'service', scenes: ['service'], output: ['reason','evidence','severity','serviceType','humanConfirmation','knowledgeStatus'] }],
  ['sales.new_sale', { skillCode: 'sales.new_sale', version: '1.0.0', productDomain: 'sales', scenes: ['new_sale'], output: ['score', 'dimensions', 'risks', 'evidence', 'replacementScripts', 'trainingTasks'] }],
  ['sales.renewal', { skillCode: 'sales.renewal', version: '1.0.0', productDomain: 'sales', scenes: ['renewal'], output: ['score', 'dimensions', 'risks', 'evidence', 'replacementScripts', 'trainingTasks'] }]
])

export function registerSkill(definition) {
  if (!definition?.skillCode || !definition?.version) throw new Error('Skill必须包含skillCode和version')
  skills.set(definition.skillCode, { ...definition })
}

export function resolveSkill(skillCode, scene) {
  const skill = skills.get(skillCode)
  if (!skill || skill.enabled === false || (skill.scenes && !skill.scenes.includes(scene))) {
    throw Object.assign(new Error('Skill不存在、已禁用或不支持当前场景'), { code: 'SKILL_NOT_AVAILABLE', retryable: false })
  }
  return { ...skill }
}

export function listSkills() {
  return [...skills.values()].map(skill => ({ ...skill }))
}

export function validateSkillOutput(skill, value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { valid: false, errors: ['输出必须是对象'] }
  const errors = (skill.output || []).filter(field => value[field] === undefined).map(field => `缺少字段:${field}`)
  if (value.knowledgeStatus && !['verified','canonical','needs_review'].includes(value.knowledgeStatus)) errors.push('知识状态无效')
  if (skill.skillCode !== 'growth.weekly_review' && value.actions && !Array.isArray(value.actions)) errors.push('actions必须为数组')
  if (value.stopConditions && !Array.isArray(value.stopConditions)) errors.push('停止条件必须为数组')
  if (value.evidence && !Array.isArray(value.evidence)) errors.push('证据必须为数组')
  return { valid: errors.length === 0, errors }
}
