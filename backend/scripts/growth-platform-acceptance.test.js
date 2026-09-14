import test from 'node:test'
import assert from 'node:assert/strict'
import { createOrganization, getOrganizationForUser } from '../src/services/organization.js'
import { createAsset, writeAsset, createSignedUrl, readSignedAsset, readAssetForOrganization, deleteAsset } from '../src/services/privateStorage.js'
import { enqueueTask, processNextTask, registerTaskHandler, retryTask } from '../src/services/asyncTasks.js'
import { runStructuredSkill } from '../src/services/aiRunner.js'
import { createProject, createSnapshot } from '../src/services/acquisition/index.js'
import { createProgram, listTouchpoints } from '../src/services/serviceDelivery/index.js'

process.env.NODE_ENV = 'test'

const nonce = `${Date.now()}-${Math.random()}`

test('机构资源、私有资产与删除均保持机构隔离', async () => {
  const a = await createOrganization({ userId: `owner-a-${nonce}`, name: 'A机构' })
  const b = await createOrganization({ userId: `owner-b-${nonce}`, name: 'B机构' })
  assert.equal(await getOrganizationForUser(a.id, `owner-b-${nonce}`), null)
  const asset = await createAsset({ organizationId: a.id, userId: `owner-a-${nonce}`, filename: 'proof.txt', mimeType: 'text/plain', size: 6 })
  await writeAsset(asset.id, Buffer.from('secret'))
  await assert.rejects(readAssetForOrganization(asset.id, b.id), { code: 'ASSET_NOT_AVAILABLE' })
  const signed = createSignedUrl(asset.id)
  assert.equal((await readSignedAsset(asset.id, signed.expiresAt, signed.signature)).buffer.toString(), 'secret')
  await deleteAsset(asset.id)
  await assert.rejects(readSignedAsset(asset.id, signed.expiresAt, signed.signature), { status: 404 })
})

test('异步任务提交幂等，成功结果唯一，可重试失败按状态约束', async () => {
  const org = await createOrganization({ userId: `task-${nonce}`, name: '任务机构' })
  const key = `idem-${nonce}`
  registerTaskHandler(`ok-${nonce}`, async () => ({ value: 1 }))
  const tasks = await Promise.all(Array.from({ length: 12 }, () => enqueueTask({ organizationId: org.id, userId: 'u', type: `ok-${nonce}`, payload: { x: 1 }, idempotencyKey: key })))
  assert.equal(new Set(tasks.map(item => item.id)).size, 1)
  const done = await processNextTask()
  assert.equal(done.status, 'succeeded')
  assert.deepEqual(JSON.parse(done.result), { value: 1 })
  await assert.rejects(retryTask(done.id, org.id), { status: 409 })
  registerTaskHandler(`retry-${nonce}`, async () => { throw Object.assign(new Error('temporary'), { code: 'TEMP' }) })
  const failed = await enqueueTask({ organizationId: org.id, userId: 'u', type: `retry-${nonce}`, idempotencyKey: `retry-${nonce}` })
  const attempted = await processNextTask()
  assert.equal(attempted.id, failed.id)
  assert.equal(attempted.status, 'failed_retryable')
  assert.equal((await retryTask(failed.id, org.id)).status, 'queued')
})

test('AI成功输出满足Schema并固定保存Skill版本；非法输出转人工复核', async () => {
  const org = await createOrganization({ userId: `ai-${nonce}`, name: 'AI机构' })
  const valid = await runStructuredSkill({ organizationId: org.id, skillCode: 'acquisition.diagnosis', scene: 'douyin', input: {}, invoke: async () => ({ conclusion: '结论', basis: [], priorities: [], actions: [], risks: [] }) })
  assert.equal(valid.status, 'succeeded')
  assert.match(valid.skill.version, /^\d+\.\d+\.\d+$/)
  const invalid = await runStructuredSkill({ organizationId: org.id, skillCode: 'acquisition.diagnosis', scene: 'douyin', input: {}, invoke: async () => ({}) })
  assert.equal(invalid.status, 'needs_review')
})

test('获客快照只持久化汇总白名单', async () => {
  const org = await createOrganization({ userId: `snapshot-${nonce}`, name: '获客机构' })
  const project = await createProject({ organizationId: org.id, userId: 'u', name: '项目' })
  const snapshot = await createSnapshot({ projectId: project.id, organizationId: org.id, metrics: { views: '10', leads: 2, customerName: '儿童甲', phone: '13800138000', rows: [{ phone: '1' }] } })
  assert.deepEqual(JSON.parse(snapshot.metrics), { views: 10, leads: 2 })
})

test('三类服务触点日期确定且无重复，跨机构顾问式访问拒绝', async () => {
  const org = await createOrganization({ userId: `svc-${nonce}`, name: '服务机构' })
  const other = await createOrganization({ userId: `other-${nonce}`, name: '其他机构' })
  for (const [type, expected] of [['acquisition_sprint_30', [0, 15, 30]], ['growth_coaching_90', [0, 30, 60, 90]], ['founder_advisor', [0, 14, 28, 42]]]) {
    const program = await createProgram({ organizationId: org.id, type, startDate: '2026-01-01', durationDays: type === 'founder_advisor' ? 42 : 90 })
    const points = await listTouchpoints(program.id, org.id)
    assert.equal(points.length, expected.length)
    assert.equal(new Set(points.map(item => `${item.touchpoint_type}:${item.due_date}`)).size, expected.length)
    await assert.rejects(listTouchpoints(program.id, other.id), { status: 404 })
  }
})
