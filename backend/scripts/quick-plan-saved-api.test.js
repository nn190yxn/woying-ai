import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import test, { after, before } from 'node:test'
import jwt from 'jsonwebtoken'

const port = 3131
const baseUrl = `http://127.0.0.1:${port}`
const jwtSecret = 'quick-plan-saved-api-test-secret'
let serverProcess

const token = jwt.sign({ userId: 1 }, jwtSecret, { expiresIn: '1h' })

const requestJson = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const body = await response.json()
  return { response, body }
}

const waitForServer = async () => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 5000) {
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Test server did not start in time')
}

before(async () => {
  serverProcess = spawn(process.execPath, ['src/index.js'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      NODE_ENV: 'test',
      TEST_SEED_ANNUAL_USER: '1',
      JWT_SECRET: jwtSecret,
      PORT: String(port)
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  await waitForServer()
})

after(() => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill()
  setImmediate(() => process.exit(process.exitCode || 0))
})

const diagnosisContext = {
  source: 'diagnosis',
  weakness: 'conversion',
  targetAudience: '附近想聚餐的顾客',
  coreOffer: '招牌双人套餐',
  offerPrice: '双人餐 128 元',
  userObjection: '怕分量少',
  proofAssets: '真实分量和老客评价',
  conversionPath: '点击团购券到店核销',
  painSummary: '播放有了但核销少'
}

test('saves, reads, and updates quick plan status through API routes', async () => {
  const generated = await requestJson('/api/douyin/quick-plan', {
    method: 'POST',
    body: JSON.stringify({
      industry: '餐饮',
      goal: 'conversion',
      frequency: 5,
      adSupport: 'dou',
      diagnosisContext
    })
  })

  assert.equal(generated.response.status, 200)
  assert.equal(generated.body.status, 'success')
  assert.equal(generated.body.plan.meta.industryCode, 'restaurant')
  assert.equal(generated.body.plan.meta.goalCode, 'conversion')

  const saved = await requestJson('/api/douyin/quick-plan/saved', {
    method: 'POST',
    body: JSON.stringify({
      industry: '餐饮',
      goal: 'conversion',
      frequency: 5,
      adSupport: 'dou',
      diagnosisContext,
      plan: generated.body.plan
    })
  })

  assert.equal(saved.response.status, 200)
  assert.equal(saved.body.status, 'success')
  assert.equal(saved.body.savedPlan.planVersion, generated.body.plan.meta.planVersion)
  assert.equal(saved.body.savedPlan.inputHash, generated.body.plan.meta.inputHash)
  assert.equal(saved.body.savedPlan.plan.meta.industryCode, 'restaurant')

  const mismatched = await requestJson('/api/douyin/quick-plan/saved', {
    method: 'POST',
    body: JSON.stringify({
      industry: 'beauty',
      goal: 'conversion',
      frequency: 5,
      adSupport: 'dou',
      diagnosisContext,
      plan: generated.body.plan
    })
  })

  assert.equal(mismatched.response.status, 409)
  assert.match(mismatched.body.message, /重新生成/)

  const read = await requestJson('/api/douyin/quick-plan/saved')

  assert.equal(read.response.status, 200)
  assert.equal(read.body.status, 'success')
  assert.equal(read.body.savedPlan.planVersion, generated.body.plan.meta.planVersion)
  assert.equal(read.body.savedPlan.inputHash, generated.body.plan.meta.inputHash)

  const updated = await requestJson('/api/douyin/quick-plan/saved/status', {
    method: 'PATCH',
    body: JSON.stringify({ day: 1, status: '已复盘' })
  })

  assert.equal(updated.response.status, 200)
  assert.equal(updated.body.status, 'success')
  assert.equal(updated.body.savedPlan.plan.phases[0].days[0].status, '已复盘')

  const reread = await requestJson('/api/douyin/quick-plan/saved')

  assert.equal(reread.body.savedPlan.plan.phases[0].days[0].status, '已复盘')
  assert.equal(reread.body.savedPlan.inputHash, generated.body.plan.meta.inputHash)
})
