import { query } from '../../models/db.js'
import { createProject } from './index.js'

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return fallback }
}

async function getOrCreateLegacyProject(organizationId, userId) {
  const rows = await query(
    "SELECT * FROM acquisition_projects WHERE organization_id = ? AND created_by = ? AND name = '抖音历史资料（兼容）'",
    [organizationId, String(userId)]
  )
  return rows[0] || createProject({
    organizationId,
    userId,
    name: '抖音历史资料（兼容）',
    goal: '只读兼容旧版抖音计划与复盘，不作为新的固定周期',
    channels: ['douyin']
  })
}

export async function migrateLegacyDouyinData({ organizationId, userId }) {
  const plans = await query('SELECT * FROM douyin_quick_plans WHERE user_id = ? ORDER BY updated_at DESC', [String(userId)])
  const reviews = await query('SELECT * FROM douyin_review_records WHERE user_id = ? ORDER BY created_at DESC', [String(userId)])
  if (!plans.length && !reviews.length) return { projectId: null, plans: 0, reviews: 0 }

  const project = await getOrCreateLegacyProject(organizationId, userId)
  let migratedPlans = 0
  let migratedReviews = 0

  for (const item of plans) {
    const sourceId = String(item.id)
    const existing = await query('SELECT * FROM acquisition_action_plans WHERE project_id = ? AND source_type = ? AND source_id = ?', [project.id, 'douyin_quick_plan', sourceId])
    if (existing.length) continue
    const planData = {
      source: 'legacy_douyin_quick_plan',
      sourceVersion: Number(item.plan_version || 1),
      migratedWithoutMutation: true,
      legacyInput: { industry: item.industry, goal: item.goal, frequency: item.frequency, adSupport: item.ad_support },
      plan: parseJson(item.plan, item.plan)
    }
    await query(
      'INSERT INTO acquisition_action_plans (project_id, diagnosis_id, title, plan_data, template_code, status, source_type, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [project.id, null, `旧版抖音快速计划 v${Number(item.plan_version || 1)}`, JSON.stringify(planData), 'legacy-douyin-15-day', 'active', 'douyin_quick_plan', sourceId]
    )
    migratedPlans += 1
  }

  for (const item of reviews) {
    const sourceId = String(item.id)
    const existing = await query('SELECT * FROM acquisition_diagnoses WHERE project_id = ? AND source_type = ? AND source_id = ?', [project.id, 'douyin_review_record', sourceId])
    if (existing.length) continue
    await query(
      'INSERT INTO acquisition_diagnoses (project_id, channel_code, input_data, output_data, status, skill_version, source_type, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [project.id, 'douyin', JSON.stringify({ sourceContext: parseJson(item.source_context, {}), input: parseJson(item.input_data, {}) }), JSON.stringify({ source: 'legacy_douyin_review', result: parseJson(item.result_data, {}), nextActions: parseJson(item.next_actions, []) }), 'succeeded', 'legacy-douyin-review@1', 'douyin_review_record', sourceId]
    )
    migratedReviews += 1
  }

  return { projectId: project.id, plans: migratedPlans, reviews: migratedReviews }
}
