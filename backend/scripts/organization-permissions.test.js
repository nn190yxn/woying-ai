import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { addOrganizationMember, createOrganization, listOrganizationMembers, revokeOrganizationMember, setDefaultOrganization, updateOrganizationMemberRole } from '../src/services/organization.js'

test('机构成员服务支持角色管理、默认机构和撤销访问', async () => {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb.product_events.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  mockDb._idCounters.product_events = 0

  const organization = await createOrganization({ userId: 'owner-1', name: '测试机构' })
  const added = await addOrganizationMember({ organizationId: organization.id, actorUserId: 'owner-1', userId: 'advisor-1', role: 'advisor' })
  assert.equal(added.role, 'advisor')
  assert.equal((await listOrganizationMembers(organization.id, 'owner-1')).length, 2)

  const changed = await updateOrganizationMemberRole({ organizationId: organization.id, actorUserId: 'owner-1', memberUserId: 'advisor-1', role: 'marketing_lead' })
  assert.equal(changed.role, 'marketing_lead')
  const selected = await setDefaultOrganization({ userId: 'advisor-1', organizationId: organization.id })
  assert.equal(selected.is_default, 1)

  const revoked = await revokeOrganizationMember({ organizationId: organization.id, actorUserId: 'owner-1', memberUserId: 'advisor-1' })
  assert.equal(revoked.status, 'revoked')
  await assert.rejects(() => listOrganizationMembers(organization.id, 'advisor-1'), /无权访问该机构/)
})

test('非管理角色不能修改机构成员', async () => {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  const organization = await createOrganization({ userId: 'owner-2', name: '权限测试机构' })
  await addOrganizationMember({ organizationId: organization.id, actorUserId: 'owner-2', userId: 'marketing-1', role: 'marketing_lead' })
  await assert.rejects(
    () => addOrganizationMember({ organizationId: organization.id, actorUserId: 'marketing-1', userId: 'advisor-2', role: 'advisor' }),
    /无权管理机构成员/
  )
})
