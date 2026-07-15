import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire('/usr/local/lib/node_modules/playwright/package.json')
const { chromium } = require('playwright')
const reportDir = path.resolve(__dirname, '../reports/entrepreneur-role-test-20260711')
const baseUrl = process.env.TEST_BASE_URL || 'https://woyai.cn'
const phone = process.env.TEST_PHONE || '19900000001'
const code = process.env.TEST_CODE || '123456'

const roles = [
  {
    key: 'restaurant',
    label: '餐饮老板',
    industryPath: '/industries/restaurant',
    mode: 'group-buy',
    goal: 'conversion',
    adSupport: 'local',
    frequency: '2',
    douyin: {
      industry: 'restaurant',
      mode: 'group-buy',
      goal: 'conversion',
      mainBottleneck: '附近白领知道门店但团购核销低，午市翻台率和晚市包间预订波动大',
      currentAction: '每周发 5 条套餐、后厨出餐和顾客评价视频，本地推月预算 3000 元',
      targetAudience: '周边 3 公里白领、亲子家庭、周末聚餐客',
      trafficPains: ['同城曝光不稳定', '自然流量忽高忽低'],
      contentPains: ['内容同质化', '缺少爆款选题'],
      conversionPains: ['团购核销率低', '私信咨询少'],
      retentionPains: ['复购提醒弱'],
      adsPains: ['投流 ROI 不清楚'],
      weeklyPosts: 5,
      avgViewsPerVideo: 1800,
      monthlyViews: 43000,
      monthlyFollowers: 360,
      monthlyInquiries: 92,
      monthlyConversions: 118,
      monthlyAdBudget: 3000
    },
    private: {
      industry: 'restaurant',
      mode: 'mixed',
      trafficPains: ['顾客到店后没有沉淀到企微', '活动只靠朋友圈临时通知'],
      operationPains: ['社群活跃低', '会员日缺少固定节奏'],
      conversionPains: ['储值转化弱'],
      retentionPains: ['老客复购提醒弱'],
      fissionPains: ['转介绍激励不清晰'],
      wechatFriends: 1800,
      communityCount: 8,
      monthlyRevenue: 96000,
      monthlyNewFriends: 260
    },
    member: { industry: 'restaurant', currentMembers: 680, avgOrderValue: 118, goal: 'retention' },
    retention: { industry: 'restaurant', currentRetention: 28, avgPurchaseCycle: 21, customerCount: 3600 }
  },
  {
    key: 'beauty',
    label: '医美/美业老板',
    industryPath: '/industries/beauty',
    mode: 'lead-gen',
    goal: 'leads',
    adSupport: 'local',
    frequency: '1',
    douyin: {
      industry: 'beauty',
      mode: 'lead-gen',
      goal: 'leads',
      mainBottleneck: '咨询多但有效到店少，高客单项目缺少信任铺垫和案例证明',
      currentAction: '每周发案例前后对比、院长科普和门店探访，本地推月预算 8000 元',
      targetAudience: '25-40 岁本地女性、皮肤管理复购客、轻医美初体验客',
      trafficPains: ['同城曝光成本升高'],
      contentPains: ['案例内容合规边界不清', '专家人设不稳定'],
      conversionPains: ['留资后到店率低', '高客单咨询转化慢'],
      retentionPains: ['疗程复购提醒不系统'],
      adsPains: ['线索质量不稳定'],
      weeklyPosts: 6,
      avgViewsPerVideo: 2600,
      monthlyViews: 78000,
      monthlyFollowers: 620,
      monthlyInquiries: 210,
      monthlyConversions: 42,
      monthlyAdBudget: 8000
    },
    private: {
      industry: 'beauty',
      mode: 'wechat',
      trafficPains: ['线索加微后分层不清晰'],
      operationPains: ['顾问跟进节奏依赖个人经验'],
      conversionPains: ['高客单项目成交周期长'],
      retentionPains: ['疗程结束后沉睡'],
      fissionPains: ['老客转介绍缺少可讲利益点'],
      wechatFriends: 5200,
      communityCount: 12,
      monthlyRevenue: 420000,
      monthlyNewFriends: 740
    },
    member: { industry: 'beauty', currentMembers: 1350, avgOrderValue: 680, goal: 'value' },
    retention: { industry: 'beauty', currentRetention: 36, avgPurchaseCycle: 45, customerCount: 6200 }
  },
  {
    key: 'education',
    label: '教培老板',
    industryPath: '/industries/education',
    mode: 'lead-gen',
    goal: 'leads',
    adSupport: 'dou',
    frequency: '1',
    douyin: {
      industry: 'education',
      mode: 'lead-gen',
      goal: 'leads',
      mainBottleneck: '试听课预约不少但到课率和续费率低，家长信任建立慢',
      currentAction: '每周发课堂片段、老师讲题和学员进步案例，少量 DOU+ 测试',
      targetAudience: '周边 5 公里小学家长、初中提分需求家庭、暑期班潜在客户',
      trafficPains: ['家长人群触达不稳定'],
      contentPains: ['课程卖点讲得抽象', '案例证据不足'],
      conversionPains: ['试听预约到课率低', '咨询后跟进弱'],
      retentionPains: ['续费节点缺少预警'],
      adsPains: ['投流素材测试少'],
      weeklyPosts: 4,
      avgViewsPerVideo: 1200,
      monthlyViews: 36000,
      monthlyFollowers: 280,
      monthlyInquiries: 130,
      monthlyConversions: 31,
      monthlyAdBudget: 2500
    },
    private: {
      industry: 'education',
      mode: 'community',
      trafficPains: ['试听名单进入社群后缺少分层'],
      operationPains: ['家长群内容节奏不稳定'],
      conversionPains: ['试听转正课链路长'],
      retentionPains: ['续费提醒滞后'],
      fissionPains: ['老带新活动缺少班级场景'],
      wechatFriends: 3100,
      communityCount: 18,
      monthlyRevenue: 260000,
      monthlyNewFriends: 410
    },
    member: { industry: 'education', currentMembers: 860, avgOrderValue: 1380, goal: 'retention' },
    retention: { industry: 'education', currentRetention: 42, avgPurchaseCycle: 90, customerCount: 2400 }
  }
]

const apiResults = []

async function ensureReportDir() {
  await fs.mkdir(reportDir, { recursive: true })
}

async function screenshot(page, name) {
  const file = path.join(reportDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true, timeout: 90000 })
  return file
}

async function postApi(page, endpoint, payload) {
  const requestOnce = () => page.evaluate(async ({ endpoint, payload }) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 90000)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      const body = await response.json().catch(() => ({}))
      return { ok: response.ok, status: response.status, body }
    } catch (error) {
      return { ok: false, status: 0, body: { error: error?.name || 'RequestError', message: error?.message || '请求失败' } }
    } finally {
      clearTimeout(timer)
    }
  }, { endpoint, payload })

  const first = await requestOnce()
  if (first.ok || first.body?.error !== 'AbortError') return first
  return requestOnce()
}

function unwrap(body) {
  return body?.result || body?.data?.result || body?.data || body || {}
}

function arrayLength(value) {
  return Array.isArray(value) ? value.length : 0
}

function scoreResult(endpoint, body) {
  const result = unwrap(body)
  const text = JSON.stringify(result)
  const hasAction = /建议|策略|行动|计划|SOP|优先|话术|复盘|提升/.test(text)
  const hasBenchmark = /基准|目标|行业|阈值|评分|复购率|预计|ROI|置信度/.test(text)
  const hasRisk = /风险|合规|边界|注意|避免|预警|沉睡/.test(text)
  const hasNext = /下一步|复盘|会员|留存|转化|跟进|执行/.test(text)
  const hasStructure = arrayLength(result.sections) > 0
    || arrayLength(result.actions) > 0
    || arrayLength(result.suggestions) > 0
    || arrayLength(result.strategies) > 0
    || arrayLength(result.recommendedTiers) > 0
    || arrayLength(result.plan) > 0
    || arrayLength(result.days) > 0
    || arrayLength(result.plan?.phases) > 0
    || arrayLength(result.plan?.phases?.[0]?.days) > 0
    || arrayLength(result.radar) > 0
    || arrayLength(result.retentionCalendar) > 0

  const score = [hasAction, hasBenchmark, hasRisk, hasNext, hasStructure].filter(Boolean).length
  return {
    endpoint,
    score,
    hasAction,
    hasBenchmark,
    hasRisk,
    hasNext,
    hasStructure,
    status: body?.status || body?.data?.status || 'unknown',
    degraded: Boolean(body?.degraded || body?.data?.degraded),
    summary: result.summary || result.plan?.summary || result.diagnosis || result.title || result.plan?.title || result.memberDay || result.targetRetention || ''
  }
}

async function waitForPage(page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => undefined)
}

async function login(page) {
  const result = await postApi(page, '/api/auth/login', { phone, code })
  if (!result.ok || !result.body?.token) {
    throw new Error(`登录失败: HTTP ${result.status} ${JSON.stringify(result.body)}`)
  }
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token)
    localStorage.setItem('memberLevel', user?.member_level || user?.memberLevel || 'annual')
    localStorage.setItem('user', JSON.stringify(user || {}))
  }, { token: result.body.token, user: result.body.user })
}

async function runRole(page, role) {
  const roleScreens = []
  const routes = [
    ['industry', role.industryPath],
    ['douyin-hub', '/douyin'],
    ['douyin-diagnosis', '/douyin/diagnosis'],
    ['douyin-quick-plan', `/douyin/quick-plan?industry=${role.key}`],
    ['private-hub', '/private'],
    ['private-diagnosis', '/private/diagnosis'],
    ['member-design', '/private/member-design'],
    ['retention-plan', '/private/retention-plan'],
    ['tools', '/tools']
  ]

  for (const [name, route] of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await waitForPage(page)
    roleScreens.push(await screenshot(page, `${role.key}-${name}`))
  }

  const requests = [
    ['抖音体检', '/api/douyin/diagnosis', role.douyin],
    ['15 天计划', '/api/douyin/quick-plan', { industry: role.key, goal: role.goal, frequency: role.frequency, adSupport: role.adSupport }],
    ['私域体检', '/api/private/diagnosis', role.private],
    ['会员体系', '/api/private/member-design', role.member],
    ['复购留存', '/api/private/retention-plan', role.retention]
  ]

  for (const [name, endpoint, payload] of requests) {
    const response = await postApi(page, endpoint, payload)
    const check = scoreResult(endpoint, response.body)
    apiResults.push({ role: role.label, name, ok: response.ok, httpStatus: response.status, check, body: response.body })
  }

  return roleScreens
}

function formatReport(screens) {
  const lines = [
    '# 三行业创业者链路验收报告',
    '',
    `- 站点：${baseUrl}`,
    `- 时间：${new Date().toISOString()}`,
    `- 账号：${phone}`,
    `- 口径：按行业创业者完成“行业入口 -> 抖音获客 -> 执行计划 -> 私域承接 -> 会员/复购 -> 工具库复盘”链路验收。`,
    '',
    '## 截图证据',
    ''
  ]

  for (const role of roles) {
    lines.push(`### ${role.label}`)
    for (const file of screens[role.key] || []) {
      lines.push(`- ${path.relative(path.resolve(__dirname, '..'), file)}`)
    }
    lines.push('')
  }

  lines.push('## API 结果与专业度检查', '')
  for (const item of apiResults) {
    const status = item.ok ? 'PASS' : 'FAIL'
    const professional = item.check.score >= 4 ? '可指导经营' : item.check.score >= 3 ? '需要人工补充' : '专业度不足'
    lines.push(`### ${item.role} - ${item.name}`)
    lines.push(`- 结果：${status}，HTTP ${item.httpStatus}，专业度：${professional}（${item.check.score}/5）`)
    lines.push(`- 结构：行动建议=${item.check.hasAction}，行业/基准=${item.check.hasBenchmark}，风险/边界=${item.check.hasRisk}，下一步=${item.check.hasNext}，结构化=${item.check.hasStructure}`)
    lines.push(`- 协议：status=${item.check.status}，degraded=${item.check.degraded}`)
    if (item.check.summary) lines.push(`- 摘要：${String(item.check.summary).replace(/\s+/g, ' ').slice(0, 180)}`)
    lines.push('')
  }

  lines.push('## 经营指导判断', '')
  for (const role of roles) {
    const items = apiResults.filter((item) => item.role === role.label)
    const avg = items.reduce((sum, item) => sum + item.check.score, 0) / Math.max(items.length, 1)
    const verdict = avg >= 4 ? '链路具备经营指导价值，可以帮助老板形成获客、转化、复购动作。' : '链路需要补充行业经营上下文后再用于真实决策。'
    lines.push(`- ${role.label}：平均专业度 ${avg.toFixed(1)}/5。${verdict}`)
  }

  return `${lines.join('\n')}\n`
}

async function main() {
  await ensureReportDir()
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } })
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await login(page)

  const screens = {}
  for (const role of roles) {
    screens[role.key] = await runRole(page, role)
  }

  await fs.writeFile(path.join(reportDir, 'api-results.json'), JSON.stringify(apiResults, null, 2))
  await fs.writeFile(path.join(reportDir, 'report.md'), formatReport(screens))
  await browser.close()
  console.log(`report=${path.join(reportDir, 'report.md')}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
