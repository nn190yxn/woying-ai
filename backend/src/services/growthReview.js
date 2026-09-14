import { query } from '../models/db.js'

export function deriveWeeklyIssue(snapshot = {}) {
  const m = snapshot.metrics || snapshot
  const candidates = [
    [m.valid_leads > 0 && m.appointments === 0, '有效线索未形成预约'],
    [m.appointments > 0 && m.arrivals === 0, '预约未形成到店'],
    [m.arrivals > 0 && m.new_sales === 0, '到店未形成正价成交'],
    [m.trial_completed > 0 && m.new_sales === 0, '体验课成交承接需要复盘']
  ]
  return (candidates.find(([bad]) => bad) || [true, '补齐并连续记录机构聚合指标'])[1]
}

export async function createWeeklyReview({ projectId, organizationId, snapshot, baseline = null }) {
  const issue = deriveWeeklyIssue(snapshot)
  return { projectId, organizationId, primaryIssue: issue, evidence: [{ type: 'aggregate_snapshot', metrics: snapshot.metrics || snapshot }], actions: [{ title: `下周只验证：${issue}` }], validationMetrics: ['下一周期对应转化指标'], stopConditions: ['数据不足或隐私风险时停止并人工确认'], knowledgeStatus: 'needs_review', baseline }
}

export async function triggerConsultantEscalation({ organizationId, programId = null, alertType, title, detail, severity = 'medium', serviceType = 'growth_review', dedupeKey }) {
  const key = dedupeKey || `${alertType}:${programId || 'org'}`
  const existing = await query('SELECT * FROM service_alerts WHERE organization_id = ? AND dedupe_key = ? LIMIT 1', [organizationId, key])
  if (existing[0] && existing[0].status === 'open') return { alert: existing[0], created: false, requiresHuman: severity === 'high' }
  if (existing[0]) await query("UPDATE service_alerts SET status = 'open' WHERE id = ? AND organization_id = ?", [existing[0].id, organizationId])
  else await query('INSERT INTO service_alerts (organization_id, program_id, alert_type, title, detail, dedupe_key) VALUES (?, ?, ?, ?, ?, ?)', [organizationId, programId, alertType, title, JSON.stringify({ detail, severity, serviceType, humanConfirmation: severity === 'high' }), key])
  const rows = await query('SELECT * FROM service_alerts WHERE organization_id = ? AND dedupe_key = ? LIMIT 1', [organizationId, key])
  return { alert: rows[0], created: !existing[0], requiresHuman: severity === 'high' }
}
