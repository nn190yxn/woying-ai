import test from 'node:test'
import assert from 'node:assert/strict'
import { mockDb } from '../src/models/mockDb.js'
import { createOrganization, addOrganizationMember, requireOrganizationPermission, requireOrganizationRole } from '../src/services/organization.js'

function responseCapture() {
  const result = { statusCode: 200, body: null }
  return {
    result,
    status(code) { result.statusCode = code; return this },
    json(body) { result.body = body; return body }
  }
}

async function setup() {
  mockDb.organizations.length = 0
  mockDb.organization_members.length = 0
  mockDb._idCounters.organizations = 0
  mockDb._idCounters.organization_members = 0
  const organization = await createOrganization({ userId: 'owner-mw', name: '中间件测试机构' })
  await addOrganizationMember({ organizationId: organization.id, actorUserId: 'owner-mw', userId: 'marketing-mw', role: 'marketing_lead' })
  return organization
}

test('机构权限中间件先校验成员，再校验角色能力', async () => {
  const organization = await setup()
  const req = { user: { userId: 'marketing-mw' }, params: { organizationId: organization.id }, body: {}, query: {}, headers: {} }
  const res = responseCapture()
  let called = false
  requireOrganizationPermission('members:manage')(req, res, (error) => { if (error) throw error; called = true })
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(called, false)
  assert.equal(res.result.statusCode, 403)

  const allowedReq = { ...req, user: { userId: 'owner-mw' } }
  const allowedRes = responseCapture()
  await new Promise((resolve, reject) => {
    requireOrganizationPermission('members:manage')(allowedReq, allowedRes, (error) => { if (error) reject(error); else resolve() })
  })
  assert.equal(allowedReq.organizationId, organization.id)
  assert.equal(allowedReq.organization.role, 'owner')
})

test('角色中间件拒绝未授权成员和不存在机构', async () => {
  const organization = await setup()
  const deniedReq = { user: { userId: 'marketing-mw' }, params: { organizationId: organization.id }, body: {}, query: {}, headers: {} }
  const deniedRes = responseCapture()
  requireOrganizationRole('owner')(deniedReq, deniedRes, (error) => { if (error) throw error })
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(deniedRes.result.statusCode, 403)

  const missingReq = { user: { userId: 'nobody' }, params: { organizationId: organization.id }, body: {}, query: {}, headers: {} }
  const missingRes = responseCapture()
  requireOrganizationRole('owner')(missingReq, missingRes, (error) => { if (error) throw error })
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(missingRes.result.statusCode, 403)
})
