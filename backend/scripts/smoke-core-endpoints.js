import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config()

const token = jwt.sign({ userId: 1, memberLevel: 'annual' }, process.env.JWT_SECRET, { expiresIn: '1h' })
const base = process.env.BASE_URL || 'http://127.0.0.1:3000'
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000)
const strictDegraded = process.env.STRICT_DEGRADED === 'true'

const checks = [
  { name: 'health', method: 'GET', path: '/health' },
  { name: 'xhs-quick-start-plan', method: 'POST', path: '/api/xhs/quick-start-plan', body: { industry: 'restaurant', audience: '本地顾客', topic: '新店起号' } },
  { name: 'xhs-grass-converter', method: 'POST', path: '/api/xhs/grass-converter', body: { industry: 'restaurant', product: '团购套餐', views: 12000, likes: 600, collects: 300, comments: 80, orders: 45, revenue: 4500, cost: 1200 } },
  { name: 'meituan', method: 'POST', path: '/api/generate/meituan', body: { industry: 'restaurant', monthlyOrders: 800, monthlySales: 64000, platformFeeRate: 18, reviewScore: 4.2, repeatRate: 20, issues: ['曝光低', '复购低'] } },
  { name: 'festival', method: 'POST', path: '/api/generate/festival', body: { industry: 'catering', festival: '端午节', goal: 'promote', contentType: 'poster' } },
  { name: 'fission', method: 'POST', path: '/api/generate/fission', body: { industry: 'catering', customerScale: '300', channel: 'wechat', priceRange: 'mid', budget: 2000 } },
  { name: 'marketing-plan', method: 'POST', path: '/api/generate/marketing-plan', body: { industry: 'catering', goal: '提升到店转化', budget: '5000', duration: '1周' } },
  { name: 'gross-margin-restaurant', method: 'POST', path: '/api/generate/gross-margin-restaurant', body: { storeName: '测试餐厅', categories: [{ name: '炒菜', revenue: 60000, cost: 22000 }, { name: '酒水', revenue: 20000, cost: 5000 }, { name: '主食', revenue: 20000, cost: 8000 }] } }
]

async function runCheck(check) {
  const headers = { ...(check.body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${token}` }
  const response = await fetch(`${base}${check.path}`, { method: check.method, headers, body: check.body ? JSON.stringify(check.body) : undefined, signal: AbortSignal.timeout(timeoutMs) })
  const text = await response.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { data = { summary: text.slice(0, 120) } }
  const degraded = data?.degraded === true || data?.status === 'fallback' || data?.isFallback === true
  const engineType = data?.meta?.engineType || data?.meta?.fallbackType || data?.meta?.parseMode || data?.agent || data?.status || 'n/a'
  const summary = data?.summary || data?.title || data?.status || data?.error || 'ok'
  return { name: check.name, httpStatus: response.status, ok: response.ok, degraded, engineType, summary: String(summary).replace(/\s+/g, ' ').slice(0, 120) }
}

let hasFailure = false
let hasDegraded = false

console.log(`baseUrl=${base}`)
console.log(`timeoutMs=${timeoutMs}`)

for (const check of checks) {
  try {
    const result = await runCheck(check)
    if (!result.ok) hasFailure = true
    if (result.degraded) hasDegraded = true
    console.log(`[${result.ok ? 'ok' : 'fail'}] ${result.name} http=${result.httpStatus} degraded=${result.degraded} engine=${result.engineType} summary=${result.summary}`)
  } catch (error) {
    hasFailure = true
    console.log(`[fail] ${check.name} error=${error.message}`)
  }
}

if (hasDegraded) {
  console.log('degraded=true detected. Check AI gateway and fallback logs before declaring RAG recovery complete.')
}

if (hasFailure || (strictDegraded && hasDegraded)) {
  process.exitCode = 1
}