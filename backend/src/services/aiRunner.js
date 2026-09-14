import { query } from '../models/db.js'
import { resolveSkill, validateSkillOutput } from './skillRegistry.js'
import { retrieveLayeredKnowledge } from './kbService.js'

const sensitivePatterns = [/[1-9]\d{10}/g, /(?:姓名|孩子|宝宝|学员)\s*[:：]\s*[^,，。\n]+/g]
const sensitiveKeys = /^(name|姓名|孩子|宝宝|学员|childName|customerName|phone|mobile|telephone|联系方式)$/i

export function redactSensitive(value) {
  const sanitize = (item, key = '') => {
    if (sensitiveKeys.test(key)) return '[已脱敏]'
    if (Array.isArray(item)) return item.map(child => sanitize(child))
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([childKey, child]) => [childKey, sanitize(child, childKey)]))
    return item
  }
  const text = JSON.stringify(sanitize(typeof value === 'string' ? { value } : (value ?? {})))
  return sensitivePatterns.reduce((result, pattern) => result.replace(pattern, '[已脱敏]'), text)
}

export async function runStructuredSkill({ organizationId, skillCode, scene, channel, input, organizationBaseline = null, invoke }) {
  const skill = resolveSkill(skillCode, scene)
  const safeInput = redactSensitive(input)
  const base = { organizationId, productDomain: skill.productDomain, skillCode: skill.skillCode, skillVersion: skill.version, status: 'processing', inputSummary: JSON.stringify({ length: safeInput.length }) }
  const run = await query('INSERT INTO ai_runs (organization_id, product_domain, skill_code, skill_version, status, input_summary) VALUES (?, ?, ?, ?, ?, ?)', [base.organizationId, base.productDomain, base.skillCode, base.skillVersion, base.status, base.inputSummary])
  try {
    const knowledge = retrieveLayeredKnowledge({ industry: '儿童素质培训', productDomain: skill.productDomain, channel: channel || scene, scene, skillVersion: skill.version, organizationId })
    const context = { knowledgeContext: knowledge.context, knowledgeMeta: knowledge.meta, organizationBaseline: organizationBaseline || null, auditSummary: { redacted: true, inputLength: safeInput.length, knowledgeCount: knowledge.meta?.snippetCount || knowledge.meta?.count || 0 } }
    const output = await invoke(safeInput, skill, context)
    const validation = validateSkillOutput(skill, output)
    if (!validation.valid) {
      await query('UPDATE ai_runs SET status = ?, output_data = ? WHERE id = ?', ['needs_review', JSON.stringify({ errors: validation.errors }), run.insertId])
      return { status: 'needs_review', skill, output: null, errors: validation.errors, runId: run.insertId }
    }
    await query('UPDATE ai_runs SET status = ?, output_data = ? WHERE id = ?', ['succeeded', JSON.stringify(output), run.insertId])
    return { status: 'succeeded', skill, output, runId: run.insertId }
  } catch (error) {
    const status = error.retryable === false ? 'failed_final' : 'failed_retryable'
    await query('UPDATE ai_runs SET status = ?, output_data = ? WHERE id = ?', [status, JSON.stringify({ code: error.code || 'AI_RUN_FAILED' }), run.insertId])
    return {
      status,
      skill,
      output: null,
      error: '生成未完成：系统暂时无法处理本次请求。影响：当前结果不可用。下一步：请稍后重试；如仍失败，请联系管理员。',
      runId: run.insertId
    }
  }
}
