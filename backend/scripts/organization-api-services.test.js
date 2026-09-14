import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { createOrganization, createOrganizationLocation, listOrganizationLocations, updateOrganizationLocation, archiveOrganizationLocation, addOrganizationMember } from '../src/services/organization.js'

test('机构网点支持创建、修改、归档和机构隔离', async () => {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb.institution_locations.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  mockDb._idCounters.institution_locations = 0
  const first = await createOrganization({ userId: 'location-owner', name: '网点机构A' })
  const second = await createOrganization({ userId: 'other-owner', name: '网点机构B' })
  const location = await createOrganizationLocation({ organizationId: first.id, actorUserId: 'location-owner', name: '中心校区', address: '测试路1号' })
  assert.equal(location.name, '中心校区')
  assert.equal((await listOrganizationLocations(second.id, 'other-owner')).length, 0)
  await assert.rejects(() => listOrganizationLocations(first.id, 'other-owner'), /无权访问该机构/)
  const updated = await updateOrganizationLocation({ organizationId: first.id, actorUserId: 'location-owner', locationId: location.id, name: '新中心校区', address: '测试路2号' })
  assert.equal(updated.name, '新中心校区')
  const archived = await archiveOrganizationLocation({ organizationId: first.id, actorUserId: 'location-owner', locationId: location.id })
  assert.equal(archived.status, 'archived')
  assert.equal((await listOrganizationLocations(first.id, 'location-owner')).length, 0)
})

test('非管理成员不能写入机构网点', async () => {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb.institution_locations.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  mockDb._idCounters.institution_locations = 0
  const organization = await createOrganization({ userId: 'location-owner-2', name: '权限机构' })
  await addOrganizationMember({ organizationId: organization.id, actorUserId: 'location-owner-2', userId: 'marketing-2', role: 'marketing_lead' })
  await assert.rejects(() => createOrganizationLocation({ organizationId: organization.id, actorUserId: 'marketing-2', name: '非法网点' }), /无权管理机构网点/)
})
