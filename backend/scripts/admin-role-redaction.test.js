import test from 'node:test'
import assert from 'node:assert/strict'
import { redactLogValue } from '../src/middleware/logger.js'
import { adminOnly, technicalAdminOnly } from '../src/routes/admin.js'
import { mockDb } from '../src/models/mockDb.js'

function checkTechnical(role, userId, env = {}) {
  const previous = process.env.TECHNICAL_ADMIN_USER_IDS
  if (env.TECHNICAL_ADMIN_USER_IDS === undefined) delete process.env.TECHNICAL_ADMIN_USER_IDS
  else process.env.TECHNICAL_ADMIN_USER_IDS = env.TECHNICAL_ADMIN_USER_IDS
  const req = { user: { userId }, platformRole: role }
  let status; const res = { status(code) { status = code; return { json() {} } } }
  let next = false
  technicalAdminOnly(req, res, () => { next = true })
  if (previous === undefined) delete process.env.TECHNICAL_ADMIN_USER_IDS
  else process.env.TECHNICAL_ADMIN_USER_IDS = previous
  return { status, next }
}

async function checkAdmin(userId) {
  const req = { user: { userId } }
  let status; const res = { status(code) { status = code; return { json() {} } } }
  let next = false
  await adminOnly(req, res, () => { next = true })
  return { status, next, role: req.platformRole }
}

test('后台入口从服务端角色表解析平台管理员', async () => {
  mockDb.platform_user_roles.length = 0
  mockDb.platform_user_roles.push(
    { user_id: 'db-admin', role: 'platform_admin', status: 'active' },
    { user_id: 'db-advisor', role: 'advisor', status: 'active' }
  )
  assert.deepEqual(await checkAdmin('db-admin'), { status: undefined, next: true, role: 'platform_admin' })
  assert.deepEqual(await checkAdmin('db-advisor'), { status: 403, next: false, role: undefined })
})

test('技术权限仅接受服务端解析的平台管理员或明确环境授权', () => {
  assert.deepEqual(checkTechnical('platform_admin', 'db-admin'), { status: undefined, next: true })
  assert.deepEqual(checkTechnical('advisor', 'advisor'), { status: 403, next: false })
  assert.deepEqual(checkTechnical('marketing_lead', 'ops'), { status: 403, next: false })
  assert.deepEqual(checkTechnical(null, 'tech-env', { TECHNICAL_ADMIN_USER_IDS: 'tech-env' }), { status: undefined, next: true })
})

test('递归日志脱敏移除敏感字段并安全处理循环引用', () => {
  const value = { phone: '13800138000', token: 'tok', apiKey: 'key', password: 'pw', prompt: '完整输入', body: { input: 'x' }, payload: '完整载荷', rawInput: '完整输入', safe: 'Bearer abc' }
  value.self = value
  const safe = redactLogValue(value)
  assert.equal(safe.phone, undefined); assert.equal(safe.token, undefined); assert.equal(safe.apiKey, undefined)
  assert.equal(safe.password, undefined); assert.equal(safe.prompt, undefined); assert.equal(safe.body, undefined)
  assert.equal(safe.payload, undefined); assert.equal(safe.rawInput, undefined)
  assert.match(safe.safe, /凭据已脱敏/); assert.equal(safe.self, '[循环引用已省略]')
})

test('后台职责标签完整且优先读取当前错误日志', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile('../frontend/src/views/Admin.vue', 'utf8')
  const adminRoute = await fs.readFile('./src/routes/admin.js', 'utf8')
  for (const label of ['机构运营', '陪跑交付', '客户服务', '财务管理', '技术设置']) assert.match(source, new RegExp(label))
  assert.match(source, /接口密钥/); assert.doesNotMatch(source, /API Key|Mock 模式|>Redis</)
  assert.match(adminRoute, /\['error\.log', 'backend-error\.log'\]/)
})
