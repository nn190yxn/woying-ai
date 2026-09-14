import { query } from '../models/db.js'
import { recordProductEvent } from './productEvents.js'

export const ORGANIZATION_ROLES = Object.freeze(['owner', 'principal', 'marketing_lead', 'advisor', 'platform_admin'])

const ROLE_PERMISSIONS = Object.freeze({
  owner: new Set(['organization:manage', 'members:read', 'members:manage', 'locations:manage', 'resources:read', 'resources:write', 'files:manage', 'tasks:manage', 'service:read', 'service:write']),
  principal: new Set(['organization:manage', 'members:read', 'members:manage', 'locations:manage', 'resources:read', 'resources:write', 'files:manage', 'tasks:manage', 'service:read', 'service:write']),
  marketing_lead: new Set(['members:read', 'resources:read', 'resources:write', 'files:manage', 'tasks:manage']),
  advisor: new Set(['members:read', 'resources:read', 'service:read', 'service:write']),
  platform_admin: new Set(['organization:manage', 'members:read', 'members:manage', 'locations:manage', 'resources:read', 'resources:write', 'files:manage', 'tasks:manage', 'service:read', 'service:write'])
})

function assertRole(role) {
  if (!ORGANIZATION_ROLES.includes(role)) throw new Error('无效的机构角色')
  return role
}

export function roleAllows(role, permission) {
  return ROLE_PERMISSIONS[role]?.has(permission) === true
}

async function requireMembership(organizationId, userId) {
  const organization = await getOrganizationForUser(organizationId, userId)
  if (!organization) throw Object.assign(new Error('无权访问该机构'), { statusCode: 403 })
  return organization
}

async function recordOrganizationAudit({ organizationId, actorId, action, targetType, targetId, metadata = {} }) {
  await query(
    `INSERT INTO organization_audit_logs (organization_id, actor_id, action, target_type, target_id, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [organizationId, String(actorId), action, targetType || null, targetId == null ? null : String(targetId), JSON.stringify(metadata)]
  )
}

function actorId(req) {
  return String(req.user?.userId ?? 'guest')
}

export async function listOrganizations(userId) {
  return query(
    `SELECT o.*, om.role, om.status AS membership_status
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE om.user_id = ? AND om.status = 'active' AND o.status = 'active'
     ORDER BY om.is_default DESC, o.created_at ASC`,
    [String(userId)]
  )
}

export async function getOrganizationForUser(organizationId, userId) {
  const rows = await query(
    `SELECT o.*, om.role, om.status AS membership_status
     FROM organizations o
     JOIN organization_members om ON om.organization_id = o.id
     WHERE o.id = ? AND om.user_id = ? AND om.status = 'active'`,
    [organizationId, String(userId)]
  )
  return rows[0] || null
}

export async function createOrganization({ userId, name, industry, city }) {
  const result = await query(
    `INSERT INTO organizations (name, industry, city, status, created_by)
     VALUES (?, ?, ?, 'active', ?)`,
    [name, industry || '儿童素质培训', city || null, String(userId)]
  )
  const organizationId = result.insertId
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role, is_default, status)
     VALUES (?, ?, 'owner', 1, 'active')`,
    [organizationId, String(userId)]
  )
  await recordProductEvent({ organizationId, actorId: userId, eventName: 'organization_created', payload: { source: 'organization_api' } })
  return getOrganizationForUser(organizationId, userId)
}

export async function ensureDefaultOrganization(userId) {
  const existing = await listOrganizations(userId)
  if (existing[0]) return existing[0]
  return createOrganization({ userId, name: '我的培训机构' })
}

export async function listOrganizationMembers(organizationId, actorUserId) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'members:read')) throw Object.assign(new Error('无权查看机构成员'), { statusCode: 403 })
  return query(
    `SELECT id, organization_id, user_id, role, is_default, status, created_at
     FROM organization_members WHERE organization_id = ? ORDER BY created_at ASC`,
    [organizationId]
  )
}

export async function addOrganizationMember({ organizationId, actorUserId, userId, role = 'advisor' }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'members:manage')) throw Object.assign(new Error('无权管理机构成员'), { statusCode: 403 })
  const targetUserId = String(userId || '').trim()
  if (!targetUserId) throw Object.assign(new Error('成员用户ID不能为空'), { statusCode: 400 })
  assertRole(role)
  if (role === 'owner' && organization.role !== 'owner') throw Object.assign(new Error('只有机构所有者可以添加所有者'), { statusCode: 403 })
  await query(
    `INSERT INTO organization_members (organization_id, user_id, role, is_default, status)
     VALUES (?, ?, ?, 0, 'active')`,
    [organizationId, targetUserId, role]
  )
  await recordOrganizationAudit({ organizationId, actorId: actorUserId, action: 'member_added', targetType: 'organization_member', targetId: targetUserId, metadata: { role } })
  await recordProductEvent({ organizationId, actorId: actorUserId, eventName: 'organization_member_added', payload: { targetUserId, role } })
  const rows = await query(
    `SELECT id, organization_id, user_id, role, is_default, status, created_at
     FROM organization_members WHERE organization_id = ? AND user_id = ?`,
    [organizationId, targetUserId]
  )
  return rows[0] || null
}

export async function updateOrganizationMemberRole({ organizationId, actorUserId, memberUserId, role }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'members:manage')) throw Object.assign(new Error('无权管理机构成员'), { statusCode: 403 })
  assertRole(role)
  const targetUserId = String(memberUserId)
  const targetRows = await query(`SELECT * FROM organization_members WHERE organization_id = ? AND user_id = ? AND status = 'active'`, [organizationId, targetUserId])
  if (!targetRows[0]) throw Object.assign(new Error('成员不存在'), { statusCode: 404 })
  if (targetRows[0].role === 'owner' && organization.role !== 'owner') throw Object.assign(new Error('不能修改所有者角色'), { statusCode: 403 })
  if (role === 'owner' && organization.role !== 'owner') throw Object.assign(new Error('只有机构所有者可以授予所有者角色'), { statusCode: 403 })
  if (targetRows[0].role === 'owner' && role !== 'owner') {
    const owners = await query(`SELECT id FROM organization_members WHERE organization_id = ? AND role = 'owner' AND status = 'active'`, [organizationId])
    if (owners.length <= 1) throw Object.assign(new Error('机构至少需要一名所有者'), { statusCode: 400 })
  }
  await query(`UPDATE organization_members SET role = ? WHERE organization_id = ? AND user_id = ? AND status = 'active'`, [role, organizationId, targetUserId])
  await recordOrganizationAudit({ organizationId, actorId: actorUserId, action: 'member_role_changed', targetType: 'organization_member', targetId: targetUserId, metadata: { role } })
  await recordProductEvent({ organizationId, actorId: actorUserId, eventName: 'organization_member_role_changed', payload: { targetUserId, role } })
  return { ...targetRows[0], role }
}

export async function revokeOrganizationMember({ organizationId, actorUserId, memberUserId }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'members:manage')) throw Object.assign(new Error('无权管理机构成员'), { statusCode: 403 })
  const targetUserId = String(memberUserId)
  const targetRows = await query(`SELECT * FROM organization_members WHERE organization_id = ? AND user_id = ? AND status = 'active'`, [organizationId, targetUserId])
  if (!targetRows[0]) throw Object.assign(new Error('成员不存在'), { statusCode: 404 })
  if (targetRows[0].role === 'owner' && organization.role !== 'owner') throw Object.assign(new Error('不能移除所有者'), { statusCode: 403 })
  if (targetRows[0].role === 'owner') {
    const owners = await query(`SELECT id FROM organization_members WHERE organization_id = ? AND role = 'owner' AND status = 'active'`, [organizationId])
    if (owners.length <= 1) throw Object.assign(new Error('机构至少需要一名所有者'), { statusCode: 400 })
  }
  await query(`UPDATE organization_members SET status = 'revoked', is_default = 0 WHERE organization_id = ? AND user_id = ? AND status = 'active'`, [organizationId, targetUserId])
  await recordOrganizationAudit({ organizationId, actorId: actorUserId, action: 'member_revoked', targetType: 'organization_member', targetId: targetUserId })
  await recordProductEvent({ organizationId, actorId: actorUserId, eventName: 'organization_member_revoked', payload: { targetUserId } })
  return { ...targetRows[0], status: 'revoked', is_default: 0 }
}

export async function setDefaultOrganization({ userId, organizationId }) {
  const organization = await requireMembership(organizationId, userId)
  await query(`UPDATE organization_members SET is_default = 0 WHERE user_id = ? AND status = 'active'`, [String(userId)])
  await query(`UPDATE organization_members SET is_default = 1 WHERE organization_id = ? AND user_id = ? AND status = 'active'`, [organizationId, String(userId)])
  await recordOrganizationAudit({ organizationId, actorId: userId, action: 'default_organization_changed', targetType: 'organization', targetId: organizationId })
  return { ...organization, is_default: 1 }
}

export async function listOrganizationLocations(organizationId, actorUserId) {
  await requireMembership(organizationId, actorUserId)
  return query(`SELECT id, organization_id, name, address, status, created_at FROM institution_locations WHERE organization_id = ? AND status = 'active' ORDER BY created_at ASC`, [organizationId])
}

export async function createOrganizationLocation({ organizationId, actorUserId, name, address }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'locations:manage')) throw Object.assign(new Error('无权管理机构网点'), { statusCode: 403 })
  const locationName = String(name || '').trim()
  if (!locationName) throw Object.assign(new Error('网点名称不能为空'), { statusCode: 400 })
  const result = await query(`INSERT INTO institution_locations (organization_id, name, address, status) VALUES (?, ?, ?, 'active')`, [organizationId, locationName, address ? String(address).trim().slice(0, 255) : null])
  const rows = await query(`SELECT id, organization_id, name, address, status, created_at FROM institution_locations WHERE id = ? AND organization_id = ?`, [result.insertId, organizationId])
  return rows[0] || null
}

export async function updateOrganizationLocation({ organizationId, actorUserId, locationId, name, address }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'locations:manage')) throw Object.assign(new Error('无权管理机构网点'), { statusCode: 403 })
  const locationName = String(name || '').trim()
  if (!locationName) throw Object.assign(new Error('网点名称不能为空'), { statusCode: 400 })
  const result = await query(`UPDATE institution_locations SET name = ?, address = ? WHERE id = ? AND organization_id = ? AND status = 'active'`, [locationName, address ? String(address).trim().slice(0, 255) : null, locationId, organizationId])
  if (!result.affectedRows) throw Object.assign(new Error('网点不存在'), { statusCode: 404 })
  const rows = await query(`SELECT id, organization_id, name, address, status, created_at FROM institution_locations WHERE id = ? AND organization_id = ?`, [locationId, organizationId])
  return rows[0] || null
}

export async function archiveOrganizationLocation({ organizationId, actorUserId, locationId }) {
  const organization = await requireMembership(organizationId, actorUserId)
  if (!roleAllows(organization.role, 'locations:manage')) throw Object.assign(new Error('无权管理机构网点'), { statusCode: 403 })
  const result = await query(`UPDATE institution_locations SET status = 'archived' WHERE id = ? AND organization_id = ? AND status = 'active'`, [locationId, organizationId])
  if (!result.affectedRows) throw Object.assign(new Error('网点不存在'), { statusCode: 404 })
  return { id: Number(locationId), organization_id: Number(organizationId), status: 'archived' }
}

function requestOrganizationId(req) {
  return req.params.organizationId || req.body?.organizationId || req.query?.organizationId || req.headers['x-organization-id']
}

export function requireOrganization(req, res, next) {
  const organizationId = requestOrganizationId(req)
  if (!organizationId) return res.status(400).json({ message: '缺少机构ID' })
  getOrganizationForUser(organizationId, actorId(req))
    .then((organization) => {
      if (!organization) return res.status(403).json({ message: '无权访问该机构' })
      req.organization = organization
      req.organizationId = organization.id
      next()
    })
    .catch(next)
}

export function requireOrganizationPermission(permission) {
  return (req, res, next) => {
    requireOrganization(req, res, (error) => {
      if (error) return next(error)
      if (!roleAllows(req.organization.role, permission)) return res.status(403).json({ message: '当前角色无权执行该操作' })
      next()
    })
  }
}

export function requireOrganizationRole(...roles) {
  const allowedRoles = new Set(roles.flat())
  for (const role of allowedRoles) assertRole(role)
  return (req, res, next) => {
    requireOrganization(req, res, (error) => {
      if (error) return next(error)
      if (!allowedRoles.has(req.organization.role)) return res.status(403).json({ message: '当前角色无权执行该操作' })
      next()
    })
  }
}

export function requireAssignedAdvisor(req, res, next) {
  requireOrganization(req, res, async (error) => {
    if (error) return next(error)
    if (req.organization.role !== 'advisor') return next()
    const rows = await query(
      `SELECT id FROM advisor_assignments
       WHERE organization_id = ? AND advisor_user_id = ? AND status = 'active'`,
      [req.organizationId, actorId(req)]
    )
    if (!rows[0]) return res.status(403).json({ message: '顾问尚未分配至该机构' })
    next()
  })
}

export function getRequestActorId(req) {
  return actorId(req)
}
