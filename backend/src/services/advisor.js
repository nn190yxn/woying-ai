import { query } from '../models/db.js'

const configuredAdmins = () => String(process.env.PLATFORM_ADMIN_USER_IDS || '').split(',').map(v => v.trim()).filter(Boolean)

export async function getPlatformRole(userId) {
  if (configuredAdmins().includes(String(userId))) return 'platform_admin'
  const rows = await query("SELECT role FROM platform_user_roles WHERE user_id = ? AND status = 'active'", [String(userId)])
  return rows[0]?.role || null
}

export async function requireAdvisorAccess(req, res, next) {
  try {
    const role = await getPlatformRole(req.user?.userId)
    if (!['platform_admin', 'advisor'].includes(role)) return res.status(403).json({ message: '仅平台管理员或顾问可访问' })
    req.platformRole = role
    next()
  } catch (error) { next(error) }
}

export async function canAccessAdvisorOrganization(userId, organizationId, role) {
  if (role === 'platform_admin') return true
  const rows = await query("SELECT id FROM advisor_assignments WHERE advisor_user_id = ? AND organization_id = ? AND status = 'active'", [String(userId), organizationId])
  return Boolean(rows[0])
}

export async function listAdvisorOrganizations(userId, role) {
  if (role === 'platform_admin') return query("SELECT id, name, industry, city, status, created_at FROM organizations WHERE status = 'active' ORDER BY created_at DESC")
  return query("SELECT o.id, o.name, o.industry, o.city, o.status, o.created_at FROM organizations o JOIN advisor_assignments aa ON aa.organization_id = o.id WHERE aa.advisor_user_id = ? AND aa.status = 'active' AND o.status = 'active' ORDER BY aa.created_at DESC", [String(userId)])
}

function redactSensitive(value) {
  if (Array.isArray(value)) return value.map(redactSensitive)
  if (!value || typeof value !== 'object') return value
  const blocked = /^(transcript|fullTranscript|audio|audioUrl|storageKey|phone|name|customerName)$/i
  return Object.fromEntries(Object.entries(value).filter(([key]) => !blocked.test(key)).map(([key, item]) => [key, redactSensitive(item)]))
}

export async function getAdvisorOrganizationSummary(organizationId) {
  const [organizations, projects, diagnoses, snapshots, analyses, programs, touchpoints, alerts, notes, summaries] = await Promise.all([
    query('SELECT id, name, industry, city, status, created_at FROM organizations WHERE id = ?', [organizationId]),
    query('SELECT id, name, goal, status, created_at FROM acquisition_projects WHERE organization_id = ? ORDER BY created_at DESC', [organizationId]),
    query('SELECT d.id, d.project_id, d.channel_code, d.status, d.skill_version, d.created_at FROM acquisition_diagnoses d JOIN acquisition_projects p ON p.id = d.project_id WHERE p.organization_id = ? ORDER BY d.created_at DESC', [organizationId]),
    query('SELECT snapshot_date, metrics, summary FROM acquisition_snapshots s JOIN acquisition_projects p ON p.id = s.project_id WHERE p.organization_id = ? ORDER BY snapshot_date DESC', [organizationId]),
    query('SELECT a.id, a.scene, a.status, a.score, a.level, a.skill_version, a.report, a.created_at FROM sales_analyses a JOIN sales_recordings r ON r.id = a.recording_id WHERE r.organization_id = ? ORDER BY a.created_at DESC', [organizationId]),
    query('SELECT * FROM service_programs WHERE organization_id = ? ORDER BY created_at DESC', [organizationId]),
    query('SELECT t.* FROM service_touchpoints t JOIN service_programs p ON p.id = t.program_id WHERE p.organization_id = ? ORDER BY t.due_date ASC', [organizationId]),
    query("SELECT * FROM service_alerts WHERE organization_id = ? AND status = 'open' ORDER BY created_at DESC", [organizationId]),
    query('SELECT id, organization_id, program_id, author_id, content, created_at FROM consultant_notes WHERE organization_id = ? ORDER BY created_at DESC', [organizationId]),
    query('SELECT * FROM advisor_stage_summaries WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])
  ])
  if (!organizations[0]) throw Object.assign(new Error('机构不存在'), { status: 404 })
  return redactSensitive({ organization: organizations[0], acquisition: { projects, diagnoses, snapshots }, salesFocusReports: analyses, service: { programs, touchpoints }, openAlerts: alerts, consultantNotes: notes, stageSummaries: summaries })
}
