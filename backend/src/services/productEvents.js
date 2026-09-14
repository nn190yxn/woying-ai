import { query } from '../models/db.js'

const EVENT_NAMES = new Set(['organization_created', 'organization_member_added', 'organization_member_role_changed', 'organization_member_revoked', 'first_diagnosis', 'recording_analyzed', 'report_viewed', 'service_recommended', 'consultation_submitted', 'service_plan_submitted'])
const PAYLOAD_FIELDS = new Set(['source', 'channel', 'projectId', 'diagnosisId', 'recordingId', 'analysisId', 'reportType', 'serviceType', 'programId', 'status', 'scene', 'version', 'role'])

export function sanitizeEventPayload(payload = {}) {
  const safe = {}
  for (const [key, value] of Object.entries(payload || {})) {
    if (!PAYLOAD_FIELDS.has(key)) continue
    if (!['string', 'number', 'boolean'].includes(typeof value)) continue
    safe[key] = typeof value === 'string' ? value.slice(0, 128) : value
  }
  return safe
}

export async function recordProductEvent({ organizationId = null, actorId, eventName, payload = {} }) {
  if (!EVENT_NAMES.has(eventName)) throw Object.assign(new Error('不支持的产品事件'), { status: 400 })
  const safePayload = sanitizeEventPayload(payload)
  await query('INSERT INTO product_events (organization_id, actor_id, event_name, payload) VALUES (?, ?, ?, ?)', [organizationId || null, String(actorId), eventName, JSON.stringify(safePayload)])
  return { eventName, payload: safePayload }
}

export async function writeAdminAudit({ actorId, action, targetType, targetId, metadata = {} }) {
  const safe = sanitizeEventPayload(metadata)
  await query('INSERT INTO admin_audit_logs (actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?)', [String(actorId), action, targetType, targetId == null ? null : String(targetId), JSON.stringify(safe)])
}
