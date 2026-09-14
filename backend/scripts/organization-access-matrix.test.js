import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { addOrganizationMember, createOrganization, listOrganizationMembers, roleAllows, revokeOrganizationMember, setDefaultOrganization } from '../src/services/organization.js'
import { canAccessAdvisorOrganization } from '../src/services/advisor.js'
import { query } from '../src/models/db.js'

test('角色允许矩阵覆盖机构核心能力', () => {
  assert.equal(roleAllows('owner', 'organization:manage'), true)
  assert.equal(roleAllows('principal', 'locations:manage'), true)
  assert.equal(roleAllows('marketing_lead', 'resources:write'), true)
  assert.equal(roleAllows('advisor', 'files:manage'), false)
  assert.equal(roleAllows('advisor', 'service:write'), true)
  assert.equal(roleAllows('marketing_lead', 'organization:manage'), false)
})

test('成员生命周期、默认机构和撤销访问保持隔离', async () => {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb.organization_audit_logs.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  mockDb._idCounters.organization_audit_logs = 0
  const first = await createOrganization({ userId: 'matrix-owner', name: '矩阵机构A' })
  const second = await createOrganization({ userId: 'matrix-owner', name: '矩阵机构B' })
  await addOrganizationMember({ organizationId: first.id, actorUserId: 'matrix-owner', userId: 'matrix-advisor', role: 'advisor' })
  await addOrganizationMember({ organizationId: second.id, actorUserId: 'matrix-owner', userId: 'matrix-advisor', role: 'advisor' })
  await setDefaultOrganization({ userId: 'matrix-owner', organizationId: second.id })
  const members = await listOrganizationMembers(first.id, 'matrix-owner')
  assert.equal(members.some(member => member.user_id === 'matrix-advisor'), true)
  const revoked = await revokeOrganizationMember({ organizationId: first.id, actorUserId: 'matrix-owner', memberUserId: 'matrix-advisor' })
  assert.equal(revoked.status, 'revoked')
  await assert.rejects(() => listOrganizationMembers(first.id, 'matrix-advisor'), /无权访问该机构/)
  assert.equal((await listOrganizationMembers(second.id, 'matrix-owner')).length, 2)
  assert.equal(mockDb.organization_audit_logs.some(log => log.action === 'member_revoked'), true)
})

test('顾问只能访问已分配且仍有效的机构', async () => {
  mockDb.advisor_assignments.length = 0
  mockDb._idCounters.advisor_assignments = 0
  await query('INSERT INTO advisor_assignments (advisor_user_id, organization_id, assigned_by, status) VALUES (?, ?, ?, ?)', ['matrix-advisor', 88, 'platform-admin', 'active'])
  assert.equal(await canAccessAdvisorOrganization('matrix-advisor', 88, 'advisor'), true)
  assert.equal(await canAccessAdvisorOrganization('matrix-advisor', 89, 'advisor'), false)
  await query("UPDATE advisor_assignments SET status = 'revoked' WHERE advisor_user_id = ? AND organization_id = ?", ['matrix-advisor', 88])
  assert.equal(await canAccessAdvisorOrganization('matrix-advisor', 88, 'advisor'), false)
})
