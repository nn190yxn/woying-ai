import { query } from '../../models/db.js'

const schedules = {
  acquisition_sprint_30: [{ type: 'kickoff', offset: 0 }, { type: 'day_15', offset: 15 }, { type: 'day_30', offset: 30 }],
  growth_coaching_90: [{ type: 'kickoff', offset: 0 }, { type: 'day_30', offset: 30 }, { type: 'day_60', offset: 60 }, { type: 'day_90', offset: 90 }]
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

function advisorSchedule(durationDays = 90) {
  const schedule = []
  for (let offset = 0; offset <= durationDays; offset += 14) schedule.push({ type: 'biweekly', offset })
  return schedule
}

async function ownedProgram(programId, organizationId) {
  const rows = await query('SELECT * FROM service_programs WHERE id = ? AND organization_id = ?', [programId, organizationId])
  if (!rows[0]) throw Object.assign(new Error('服务项目不存在'), { status: 404 })
  return rows[0]
}

export async function createProgram({ organizationId, type, startDate, durationDays = 90 }) {
  const schedule = type === 'founder_advisor' ? advisorSchedule(durationDays) : schedules[type]
  if (!schedule) throw Object.assign(new Error('不支持的陪跑服务类型'), { status: 400 })
  const days = type === 'acquisition_sprint_30' ? 30 : type === 'growth_coaching_90' ? 90 : durationDays
  const endDate = addDays(startDate, days)
  const result = await query('INSERT INTO service_programs (organization_id, program_type, start_date, end_date, config) VALUES (?, ?, ?, ?, ?)', [organizationId, type, startDate, endDate, JSON.stringify({ scheduleVersion: '1.1.0', durationDays: days })])
  const programId = result.insertId
  for (const item of schedule) await query('INSERT INTO service_touchpoints (program_id, touchpoint_type, due_date) VALUES (?, ?, ?)', [programId, item.type, addDays(startDate, item.offset)])
  const rows = await query('SELECT * FROM service_programs WHERE id = ? AND organization_id = ?', [programId, organizationId])
  return rows[0]
}

export async function listPrograms(organizationId) {
  return query('SELECT * FROM service_programs WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])
}

export async function listTouchpoints(programId, organizationId) {
  await ownedProgram(programId, organizationId)
  return query('SELECT t.* FROM service_touchpoints t JOIN service_programs p ON p.id = t.program_id WHERE t.program_id = ? AND p.organization_id = ? ORDER BY t.due_date ASC', [programId, organizationId])
}

export async function createConsultantNote({ organizationId, programId, authorId, content }) {
  await ownedProgram(programId, organizationId)
  const value = String(content || '').trim()
  if (!value) throw Object.assign(new Error('顾问备注不能为空'), { status: 400 })
  const result = await query('INSERT INTO consultant_notes (organization_id, program_id, author_id, content) VALUES (?, ?, ?, ?)', [organizationId, programId, authorId, value])
  const rows = await query('SELECT * FROM consultant_notes WHERE id = ? AND organization_id = ?', [result.insertId, organizationId])
  return rows[0]
}

export async function listConsultantNotes(programId, organizationId) {
  await ownedProgram(programId, organizationId)
  return query('SELECT * FROM consultant_notes WHERE program_id = ? AND organization_id = ? ORDER BY created_at DESC', [programId, organizationId])
}

export async function createAlert({ organizationId, programId, alertType, title, detail, dedupeKey }) {
  if (programId) await ownedProgram(programId, organizationId)
  if (!alertType || !String(title || '').trim()) throw Object.assign(new Error('异常类型和标题不能为空'), { status: 400 })
  if (dedupeKey) {
    const existing = await query('SELECT * FROM service_alerts WHERE organization_id = ? AND dedupe_key = ? LIMIT 1', [organizationId, dedupeKey])
    if (existing[0]) return { alert: existing[0], created: false }
  }
  const result = await query('INSERT INTO service_alerts (organization_id, program_id, alert_type, title, detail, dedupe_key) VALUES (?, ?, ?, ?, ?, ?)', [organizationId, programId || null, alertType, String(title).trim(), detail || null, dedupeKey || null])
  const rows = await query('SELECT * FROM service_alerts WHERE id = ? AND organization_id = ?', [result.insertId, organizationId])
  return { alert: rows[0], created: true }
}

export async function listAlerts(organizationId, status = 'open') {
  return query('SELECT * FROM service_alerts WHERE organization_id = ? AND status = ? ORDER BY created_at DESC', [organizationId, status])
}

export async function closeAlert(alertId, organizationId) {
  const result = await query("UPDATE service_alerts SET status = 'closed' WHERE id = ? AND organization_id = ?", [alertId, organizationId])
  if (!result.affectedRows) throw Object.assign(new Error('服务异常不存在'), { status: 404 })
  const rows = await query('SELECT * FROM service_alerts WHERE id = ? AND organization_id = ?', [alertId, organizationId])
  return rows[0]
}

export async function getServiceRecommendations(organizationId) {
  const [acquisition] = await query("SELECT COUNT(*) total, SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) active FROM acquisition_projects WHERE organization_id = ?", [organizationId])
  const [sales] = await query('SELECT AVG(score) average_score, COUNT(*) total FROM sales_score_snapshots WHERE organization_id = ?', [organizationId])
  const recommendations = []
  if (!Number(acquisition?.active || 0)) recommendations.push({ code: 'start_acquisition_sprint', serviceType: 'acquisition_sprint_30', reason: '当前缺少执行中的获客项目' })
  if (Number(sales?.total || 0) > 0 && Number(sales.average_score) < 70) recommendations.push({ code: 'improve_sales_execution', serviceType: 'growth_coaching_90', reason: '销售平均分低于70分' })
  if (!recommendations.length) recommendations.push({ code: 'founder_review', serviceType: 'founder_advisor', reason: '当前核心执行指标稳定，建议双周经营复盘' })
  return recommendations
}
