import { buildDiagnosisFallback } from '../../routes/douyinAgents.js'
import { buildQuickPlanFromTemplates, normalizeQuickPlanInput } from '../douyin/index.js'
import { createActionPlan, createDiagnosis, createSnapshot, getProject } from './index.js'

const CAPABILITIES = {
  douyin: new Set(['diagnosis', 'quick_plan', 'review']),
  xhs: new Set(['account', 'content', 'growth'])
}

export async function runLegacyAcquisitionAdapter({ organizationId, projectId, channel, capability, input = {}, templateCode = null }) {
  if (!CAPABILITIES[channel]?.has(capability)) throw Object.assign(new Error('不支持的渠道能力'), { status: 400 })
  if (!await getProject(projectId, organizationId)) throw Object.assign(new Error('获客项目不存在或无权访问'), { status: 404 })
  if (channel === 'douyin' && capability === 'diagnosis') {
    const legacyResult = buildDiagnosisFallback(input)
    return { type: 'diagnosis', data: await createDiagnosis({ projectId, organizationId, channelCode: 'douyin', inputData: { ...input, legacyCapability: capability, legacyResult } }) }
  }
  if (channel === 'douyin' && capability === 'quick_plan') {
    const plan = buildQuickPlanFromTemplates(normalizeQuickPlanInput(input))
    return { type: 'action_plan', data: await createActionPlan({ projectId, organizationId, diagnosisId: input.diagnosisId, templateCode: templateCode || null, title: input.title || '抖音阶段行动计划', planData: plan }) }
  }
  if (channel === 'douyin' && capability === 'review') {
    return { type: 'snapshot', data: await createSnapshot({ projectId, organizationId, metrics: input.metrics || input, summary: input.summary || '抖音阶段复盘' }) }
  }
  // 小红书旧接口继续拥有账号/内容/增长业务逻辑；适配层只负责统一模型编排，避免复制规则。
  return { type: 'diagnosis', data: await createDiagnosis({ projectId, organizationId, channelCode: 'xhs', inputData: { ...input, legacyCapability: capability } }) }
}
