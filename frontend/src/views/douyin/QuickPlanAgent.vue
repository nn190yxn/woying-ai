<template>
  <div class="agent-page">
    <div class="agent-header container-wide quick-plan-hero">
      <button class="back-btn" @click="$router.push('/douyin')">← 返回智能体矩阵</button>
      <h1 class="agent-title">15 天速胜计划</h1>
      <p class="agent-desc">生成短期打法节奏表，快速见效</p>
      <div class="task-flow-nav" aria-label="抖音经营链路">
        <router-link to="/douyin" class="task-flow-link">智能体矩阵</router-link>
        <router-link to="/douyin/diagnosis" class="task-flow-link">经营体检</router-link>
        <span class="task-flow-link current">15 天计划</span>
        <router-link to="/douyin/video-diagnoser" class="task-flow-link">数据复盘</router-link>
      </div>
    </div>
    <div class="agent-content container-wide quick-plan-workbench">
      <div class="wizard-panel quick-plan-panel">
        <div class="panel-heading">
          <span class="context-label">计划配置</span>
          <h2>生成可执行的 15 天动作表</h2>
          <p>先确认行业、目标、频率和投流方式，再把每天任务拆成内容、工具、承接和复盘。</p>
        </div>
        <div class="form-grid plan-form-grid">
          <div class="form-group">
            <label class="form-label">行业</label>
            <select v-model="form.industry" class="form-input">
              <option v-for="industry in industryOptions" :key="industry.value" :value="industry.value">{{ industry.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">核心目标</label>
            <select v-model="form.goal" class="form-input">
              <option v-for="goal in goalOptions" :key="goal.value" :value="goal.value">{{ goal.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">每日更新频率</label>
            <select v-model="form.frequency" class="form-input">
              <option value="1">1 条/天</option>
              <option value="2">2 条/天</option>
              <option value="3">3 条/天</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">是否配合投流</label>
            <select v-model="form.adSupport" class="form-input">
              <option value="no">纯自然流量</option>
              <option value="dou">DOU+ 辅助</option>
              <option value="local">本地推投放</option>
            </select>
          </div>
        </div>
        <button class="generate-btn" @click="generate">
          生成 15 天计划
        </button>
        <div v-if="errorMessage" class="error-state">{{ errorMessage }}</div>
        <div v-if="upgradeHint" class="upgrade-hint">{{ upgradeHint }}</div>
        <div v-if="saveMessage" class="saved-state">{{ saveMessage }}</div>

        <div v-if="diagnosisContext.source && !plan" class="diagnosis-context">
          <div>
            <span class="context-label">来自体检报告</span>
            <strong>{{ weaknessLabel }} · {{ diagnosisContext.profile || '经营诊断' }}</strong>
          </div>
          <p>置信度：{{ diagnosisContext.confidence || '待补充' }}；关键数据：{{ diagnosisContext.metrics || '暂无摘要' }}</p>
        </div>

        <div v-if="plan" class="plan-result">
          <div class="plan-header">
            <div class="plan-title-card">
              <span class="context-label">计划总览</span>
              <h3>{{ plan.title }}</h3>
              <p>{{ plan.summary }}</p>
            </div>
            <div class="plan-context-grid">
              <div v-if="diagnosisContext.source" class="plan-context-card diagnosis-summary-card">
                <span class="context-label">诊断上下文</span>
                <strong>{{ weaknessLabel }} · {{ diagnosisContext.profile || '经营诊断' }}</strong>
                <p>置信度：{{ diagnosisContext.confidence || '待补充' }}</p>
              </div>
              <div v-if="plan.researchBrief?.length" class="plan-context-card research-brief">
                <span class="context-label">调研依据</span>
                <ul>
                  <li v-for="item in plan.researchBrief" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div v-if="plan.riskBoundary?.length" class="plan-context-card risk-boundary">
                <span class="context-label">执行边界</span>
                <ul>
                  <li v-for="item in plan.riskBoundary" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
            <div class="status-legend" aria-label="任务状态说明">
              <span v-for="status in statusOptions" :key="status.value" :class="['status-pill', 'status-badge', status.className]">{{ status.value }}</span>
            </div>
            <div class="plan-actions">
              <button class="secondary-btn" type="button" :disabled="loadLoading" @click="loadSavedPlan">
                {{ loadLoading ? '加载中' : '加载已保存计划' }}
              </button>
              <button class="secondary-btn primary-action" type="button" :disabled="saveLoading" @click="savePlan">
                {{ saveLoading ? '保存中' : '保存当前计划' }}
              </button>
            </div>
          </div>
          <div class="plan-board">
            <article v-for="row in planRows" :key="row.key" class="day-card">
              <aside class="day-rail">
                <span class="day-number">Day {{ row.day }}</span>
                <span class="phase-pill">{{ row.phase }}</span>
                <select class="status-select" :value="row.status" @change="updateRowStatus(row.day, $event.target.value)">
                  <option v-for="status in statusOptions" :key="status.value" :value="status.value">{{ status.value }}</option>
                </select>
              </aside>
              <div class="day-main">
                <div class="day-heading">
                  <div>
                    <span class="context-label">{{ row.workType }} · {{ row.videoFunction }}</span>
                    <h4>{{ row.goal }}</h4>
                  </div>
                  <span :class="['status-pill', 'status-badge', row.statusClass]">{{ row.status }}</span>
                </div>
                <div class="day-meta-grid">
                  <div>
                    <span>拍摄方式</span>
                    <strong>{{ row.shootingMethod }}</strong>
                  </div>
                  <div>
                    <span>内容方向</span>
                    <strong>{{ row.content }}</strong>
                  </div>
                  <div>
                    <span>投流安排</span>
                    <strong>{{ row.ad }}</strong>
                  </div>
                </div>
                <section class="script-panel">
                  <span class="context-label">拍摄文案</span>
                  <strong>{{ row.script.hook }}</strong>
                  <p>{{ row.script.voiceover }}</p>
                  <ul v-if="row.script.shots.length">
                    <li v-for="shot in row.script.shots" :key="shot">{{ shot }}</li>
                  </ul>
                  <em>{{ row.script.cta }}</em>
                </section>
              </div>
              <aside class="day-actions">
                <div class="action-panel tool-panel">
                  <span class="action-label">执行工具</span>
                  <div class="tool-actions">
                    <button
                      v-for="tool in row.tools"
                      :key="tool.path"
                      class="tool-link"
                      type="button"
                      @click="openTool(tool, row)"
                    >
                      {{ tool.label }}
                    </button>
                  </div>
                </div>
                <div class="action-panel nurture-panel">
                  <span class="action-label">客户培育</span>
                  <p>{{ row.customerNurture }}</p>
                </div>
                <div class="action-panel review-panel">
                  <span class="action-label">复盘指标</span>
                  <p>{{ row.kpi }}</p>
                  <button class="review-link" type="button" :aria-label="`记录 Day ${row.day} 复盘`" @click="openReview(row)">记录复盘</button>
                </div>
              </aside>
            </article>
          </div>
          <div class="plan-upgrade-panel">
            <div class="upgrade-copy">
              <span class="context-label">高阶经营权益</span>
              <h4>把 15 天计划、复盘和 90 天战略接成闭环</h4>
              <p>适合已经开始执行计划，需要持续复盘每天结果、判断投流钱花在哪、下个 90 天怎么排、关键动作是否需要专家校准的老板。</p>
            </div>
            <div class="upgrade-benefits">
              <button
                v-for="benefit in upgradeBenefits"
                :key="benefit.path"
                class="benefit-card"
                type="button"
                @click="router.push(benefit.path)"
              >
                <strong>{{ benefit.title }}</strong>
                <span>{{ benefit.desc }}</span>
              </button>
            </div>
            <button class="upgrade-btn" @click="router.push('/membership')">查看会员服务</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'
import {
  normalizeQuickPlanIndustryCode,
  quickPlanGoalOptions,
  quickPlanIndustryOptions,
  quickPlanStatusOptions,
  quickPlanWeaknessGoalMap,
  quickPlanWeaknessLabelMap
} from '@/constants/douyinQuickPlan'
const route = useRoute()
const router = useRouter()
const plan = ref(null)
const errorMessage = ref('')
const upgradeHint = ref('')
const saveMessage = ref('')
const saveLoading = ref(false)
const loadLoading = ref(false)
const savedPlanMeta = ref(null)
const industryOptions = quickPlanIndustryOptions
const goalOptions = quickPlanGoalOptions
const statusOptions = quickPlanStatusOptions
const goalValueSet = new Set(goalOptions.map((item) => item.value))
const form = reactive({ industry: 'restaurant', goal: 'conversion', frequency: '1', adSupport: 'no' })
const diagnosisContext = reactive({
  source: String(route.query.source || ''),
  weakness: String(route.query.weakness || ''),
  profile: String(route.query.profile || ''),
  confidence: String(route.query.confidence || ''),
  metrics: String(route.query.metrics || ''),
  bottleneck: String(route.query.bottleneck || ''),
  mode: String(route.query.mode || ''),
  currentAction: String(route.query.currentAction || ''),
  targetAudience: String(route.query.targetAudience || ''),
  coreOffer: String(route.query.coreOffer || ''),
  offerPrice: String(route.query.offerPrice || ''),
  userObjection: String(route.query.userObjection || ''),
  proofAssets: String(route.query.proofAssets || ''),
  conversionPath: String(route.query.conversionPath || ''),
  painSummary: String(route.query.painSummary || ''),
  effectiveTypes: String(route.query.effectiveTypes || ''),
  reviewSuggestion: String(route.query.reviewSuggestion || '')
})

const emptyDiagnosisContext = Object.fromEntries(Object.keys(diagnosisContext).map((key) => [key, '']))

if (route.query.industry) form.industry = normalizeQuickPlanIndustryCode(route.query.industry)
if (route.query.goal && goalValueSet.has(String(route.query.goal))) form.goal = String(route.query.goal)

if (diagnosisContext.weakness && quickPlanWeaknessGoalMap[diagnosisContext.weakness]) {
  form.goal = quickPlanWeaknessGoalMap[diagnosisContext.weakness]
}

const weaknessLabel = computed(() => quickPlanWeaknessLabelMap[diagnosisContext.weakness] || diagnosisContext.weakness || '待识别短板')

const upgradeBenefits = [
  {
    title: '15 天计划',
    desc: '把体检短板拆成每天的内容、转化、投流和复盘任务。',
    path: '/douyin/quick-plan'
  },
  {
    title: '90 天战略',
    desc: '从 15 天快跑扩展到季度节奏、内容矩阵和成交目标。',
    path: '/douyin/full-strategy'
  },
  {
    title: '数据复盘',
    desc: '记录播放、完播、私信、核销和 ROI，判断下一轮动作。',
    path: '/douyin/video-diagnoser'
  },
  {
    title: '投流与专家校准',
    desc: '评估 DOU+、本地推预算和 ROI，再用专家校准关键动作。',
    path: '/douyin/ad-evaluator'
  }
]

const statusClassMap = Object.fromEntries(statusOptions.map((item) => [item.value, item.className]))

const normalizeStatus = (status, day) => {
  if (statusOptions.some((item) => item.value === status)) return status
  const text = String(status || '')
  if (/复盘/.test(text)) return '已复盘'
  if (/完成|done|finished/i.test(text)) return '已完成'
  if (/进行|执行|doing|active|progress/i.test(text)) return '进行中'
  return Number(day) === 1 ? '进行中' : '未开始'
}

const firstDisplayValue = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue
    const text = String(value).trim()
    if (text) return value
  }
  return ''
}

const syncFormFromPlanMeta = (nextPlan) => {
  const meta = nextPlan?.meta || {}
  if (meta.industryCode) form.industry = normalizeQuickPlanIndustryCode(meta.industryCode)
  if (meta.goalCode && goalValueSet.has(meta.goalCode)) form.goal = meta.goalCode
}

const getDefaultWorkType = (day, content = '') => {
  if (/复盘|数据|总结/.test(content)) return '复盘记录'
  if (/顾客|案例|证言|背书|效果/.test(content)) return '案例内容'
  if (/福利|套餐|限时|转化|留资|团购/.test(content)) return '转化内容'
  if (day <= 5) return '测试内容'
  if (day <= 10) return '赛马内容'
  return '成交内容'
}

const getDefaultVideoFunction = (goal, content = '') => {
  if (/团购|留资|转化|套餐/.test(content) || goal === 'conversion' || goal === 'leads') return '成交转化'
  if (/复盘|数据/.test(content)) return '数据复盘'
  if (goal === 'traffic') return '同城拉新'
  if (goal === 'live') return '直播蓄水'
  return '信任建立'
}

const getDefaultShootingMethod = (content = '') => {
  if (/后厨|过程|展示|效果|对比/.test(content)) return '门店实拍'
  if (/顾客|证言|案例/.test(content)) return '顾客案例'
  if (/知识|避坑|指南|内幕/.test(content)) return '老板口播'
  return '口播 + 门店画面'
}

const getDefaultTool = (day, goal) => {
  if (day % 5 === 0) return '视频数据诊断'
  if (goal === 'conversion' || goal === 'leads') return '脚本生成器 / 转化链路'
  if (goal === 'traffic') return '爆款选题库 / 标题优化器'
  if (goal === 'live') return '脚本生成器 / 直播复盘'
  return '脚本生成器'
}

const getDefaultNurture = (day, goal) => {
  if (goal === 'traffic') return day <= 5 ? '评论区收集问题' : '引导主页关注和私信'
  if (goal === 'leads') return '私信承接 + 企微跟进'
  if (goal === 'live') return '评论预约 + 直播提醒'
  return day <= 10 ? '评论互动 + 团购答疑' : '私信促单 + 到店提醒'
}

const normalizeScript = (day, goal, content, script = {}) => ({
  hook: script.hook || `第 ${day} 天先拍“${content}”，开头 3 秒直接说用户最关心的问题。`,
  voiceover: script.voiceover || `今天这条视频围绕“${content}”展开。先讲用户常见误区，再拍门店真实过程，最后给出一个明确行动指令。`,
  shots: Array.isArray(script.shots) ? script.shots.filter(Boolean).slice(0, 4) : [],
  cta: script.cta || (goal === 'traffic' ? '引导用户收藏并评论问题。' : '引导用户私信咨询或查看主页团购。'),
  duration: script.duration || '30-45 秒'
})

const toolCandidates = {
  script: { label: '脚本', path: '/douyin/script-generator' },
  title: { label: '标题', path: '/douyin/title-optimizer' },
  cover: { label: '封面', path: '/douyin/cover-helper' },
  localAd: { label: '本地推', path: '/douyin/local-ad-strategy' },
  adReview: { label: '投流评估', path: '/douyin/ad-evaluator' },
  conversion: { label: '私信/转化', path: '/douyin/conversion-path' },
  data: { label: '复盘', path: '/douyin/video-diagnoser' }
}

const getRowTools = (row) => {
  const text = `${row.executionTool || ''} ${row.content || ''} ${row.ad || ''} ${row.customerNurture || ''}`
  const tools = []
  if (/脚本|口播|拍摄|成交/.test(text)) tools.push(toolCandidates.script)
  if (/标题|选题|爆款|流量|点击/.test(text)) tools.push(toolCandidates.title)
  if (/封面|钩子/.test(text)) tools.push(toolCandidates.cover)
  if (/本地推/.test(text)) tools.push(toolCandidates.localAd)
  if (/投流|DOU\+|预算/.test(text)) tools.push(toolCandidates.adReview)
  if (/私信|企微|转化|团购|留资|促单|承接/.test(text)) tools.push(toolCandidates.conversion)
  if (/复盘|数据|指标/.test(text) || Number(row.day) % 5 === 0) tools.push(toolCandidates.data)
  if (tools.length === 0) tools.push(toolCandidates.script)
  return [...new Map(tools.map((tool) => [tool.path, tool])).values()].slice(0, 3)
}

const normalizeDisplayDay = ({ day, phase, phaseIndex, dayIndex }) => {
  const rowDay = Number(firstDisplayValue(day.day, dayIndex + 1)) || dayIndex + 1
  const goalText = firstDisplayValue(day.goal, day.action)
  const topicDirection = firstDisplayValue(day.topicDirection, day.content)
  const adPlan = firstDisplayValue(day.adPlan, day.ad, '自然流量')
  const reviewMetrics = firstDisplayValue(day.reviewMetrics, day.kpi, '记录播放、互动、咨询')
  const planGoalCode = plan.value?.meta?.goalCode || form.goal
  const row = {
    key: `${phaseIndex}-${rowDay}`,
    phase: firstDisplayValue(day.phase, phase.name, `阶段 ${phaseIndex + 1}`),
    day: rowDay,
    goal: firstDisplayValue(goalText, '待补充目标'),
    workType: firstDisplayValue(day.workType, getDefaultWorkType(rowDay, topicDirection || goalText)),
    videoFunction: firstDisplayValue(day.videoFunction, getDefaultVideoFunction(planGoalCode, topicDirection || goalText)),
    shootingMethod: firstDisplayValue(day.shootingMethod, getDefaultShootingMethod(topicDirection || goalText)),
    content: firstDisplayValue(topicDirection, '待补充内容方向'),
    executionTool: firstDisplayValue(day.executionTool, day.tool, getDefaultTool(rowDay, planGoalCode)),
    ad: adPlan,
    customerNurture: firstDisplayValue(day.customerNurture, getDefaultNurture(rowDay, planGoalCode)),
    kpi: reviewMetrics,
    script: normalizeScript(rowDay, planGoalCode, topicDirection || goalText, day.shootingScript || day.script || {}),
    status: normalizeStatus(day.status, rowDay)
  }
  return { ...row, statusClass: statusClassMap[row.status] || 'status-pending', tools: getRowTools(row) }
}

const planRows = computed(() => {
  if (!plan.value?.phases) return []
  return plan.value.phases.flatMap((phase, phaseIndex) => (phase.days || []).map((day, dayIndex) => {
    return normalizeDisplayDay({ day, phase, phaseIndex, dayIndex })
  }))
})

const openTool = (tool, row) => {
  router.push({
    path: tool.path,
    query: {
      source: 'quick-plan',
      industry: form.industry,
      goal: form.goal,
      day: row.day,
      phase: row.phase,
      topic: row.content,
      objective: row.goal,
      weakness: diagnosisContext.weakness || undefined
    }
  })
}

const buildReviewPlanContext = (row) => {
  const meta = plan.value?.meta || {}
  return JSON.stringify({
    title: plan.value?.title || '',
    summary: plan.value?.summary || '',
    planVersion: meta.planVersion || '',
    generationMode: meta.generationMode || '',
    inputHash: meta.inputHash || '',
    day: row.day,
    phase: row.phase,
    goal: row.goal,
    topicDirection: row.content,
    workType: row.workType,
    videoFunction: row.videoFunction,
    shootingMethod: row.shootingMethod,
    adPlan: row.ad,
    customerNurture: row.customerNurture,
    reviewMetrics: row.kpi,
    scriptHook: row.script?.hook || '',
    scriptCta: row.script?.cta || ''
  })
}

const openReview = (row) => {
  const meta = plan.value?.meta || {}
  const industryCode = meta.industryCode || form.industry
  const goalCode = meta.goalCode || form.goal
  router.push({
    path: '/douyin/video-diagnoser',
    query: {
      source: 'quick-plan-review',
      industry: industryCode,
      goal: goalCode,
      industryCode,
      goalCode,
      planVersion: meta.planVersion || undefined,
      inputHash: meta.inputHash || undefined,
      generationMode: meta.generationMode || undefined,
      day: row.day,
      phase: row.phase,
      objective: row.goal,
      topic: row.content,
      workType: row.workType,
      videoFunction: row.videoFunction,
      shootingMethod: row.shootingMethod,
      adPlan: row.ad,
      kpi: row.kpi || undefined,
      scriptHook: row.script?.hook || undefined,
      scriptCta: row.script?.cta || undefined,
      weakness: diagnosisContext.weakness || undefined,
      planContext: buildReviewPlanContext(row)
    }
  })
}

const applySavedPlan = (savedPlan) => {
  if (!savedPlan?.plan) return
  plan.value = savedPlan.plan
  syncFormFromPlanMeta(plan.value)
  savedPlanMeta.value = {
    id: savedPlan.id,
    updatedAt: savedPlan.updatedAt
  }
  if (!plan.value?.meta?.industryCode) form.industry = normalizeQuickPlanIndustryCode(savedPlan.industry || form.industry)
  if (!plan.value?.meta?.goalCode && goalValueSet.has(savedPlan.goal)) form.goal = savedPlan.goal
  form.frequency = savedPlan.frequency || form.frequency
  form.adSupport = savedPlan.adSupport || form.adSupport
  Object.assign(diagnosisContext, emptyDiagnosisContext, savedPlan.diagnosisContext || {})
}

const loadSavedPlan = async () => {
  loadLoading.value = true
  errorMessage.value = ''
  try {
    const response = await request.get('/douyin/quick-plan/saved')
    if (response.savedPlan) {
      applySavedPlan(response.savedPlan)
      saveMessage.value = `已加载上次保存的计划，更新时间：${new Date(response.savedPlan.updatedAt).toLocaleString()}`
      return
    }
    saveMessage.value = '暂无已保存计划，生成后可保存并跨设备继续执行。'
  } catch (error) {
    errorMessage.value = error.message || '读取已保存计划失败'
  } finally {
    loadLoading.value = false
  }
}

const savePlan = async () => {
  if (!plan.value) return
  saveLoading.value = true
  errorMessage.value = ''
  try {
    const response = await request.post('/douyin/quick-plan/saved', {
      ...form,
      industry: normalizeQuickPlanIndustryCode(form.industry),
      diagnosisContext: diagnosisContext.source ? { ...diagnosisContext } : {},
      plan: plan.value
    })
    if (response.savedPlan) {
      applySavedPlan(response.savedPlan)
      saveMessage.value = `计划已保存，更新时间：${new Date(response.savedPlan.updatedAt).toLocaleString()}`
    }
  } catch (error) {
    errorMessage.value = error.message || '保存计划失败'
  } finally {
    saveLoading.value = false
  }
}

const setPlanDayStatus = (day, status) => {
  for (const phase of plan.value?.phases || []) {
    for (const item of phase.days || []) {
      if (Number(item.day) === Number(day)) {
        item.status = status
      }
    }
  }
}

const updateRowStatus = async (day, status) => {
  setPlanDayStatus(day, status)
  saveMessage.value = savedPlanMeta.value ? '任务状态已更新，正在同步保存。' : '任务状态已更新，点击保存后可跨设备继续执行。'
  if (!savedPlanMeta.value) return

  try {
    const response = await request.patch('/douyin/quick-plan/saved/status', { day, status })
    if (response.savedPlan) {
      applySavedPlan(response.savedPlan)
      saveMessage.value = `任务状态已同步，更新时间：${new Date(response.savedPlan.updatedAt).toLocaleString()}`
    }
  } catch (error) {
    errorMessage.value = error.message || '同步任务状态失败'
  }
}

const generate = async () => {
  errorMessage.value = ''
  upgradeHint.value = ''
  saveMessage.value = ''
  savedPlanMeta.value = null
  plan.value = null
  try {
    const response = await request.post('/douyin/quick-plan', {
      ...form,
      industry: normalizeQuickPlanIndustryCode(form.industry),
      diagnosisContext: diagnosisContext.source ? { ...diagnosisContext } : undefined
    })
    plan.value = response.plan || response
    syncFormFromPlanMeta(plan.value)
    upgradeHint.value = response.upgradeHint || ''
  } catch (error) {
    errorMessage.value = error.message || '计划生成失败，请稍后重试'
  }
}

onMounted(() => {
  if (diagnosisContext.source) {
    generate()
    return
  }
  loadSavedPlan()
})
</script>

<style scoped>
@import './agent-common.css';

.quick-plan-hero {
  padding-top: 32px;
}

.quick-plan-workbench {
  max-width: var(--workbench-max-width);
}

.quick-plan-panel {
  padding: 28px;
  border-color: var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.panel-heading {
  margin-bottom: 18px;
}

.panel-heading h2 {
  margin: 4px 0 8px;
  color: var(--text-main);
  font-size: var(--text-h4);
}

.panel-heading p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.plan-form-grid .form-group {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.generate-btn {
  width: 100%;
  margin-top: 18px;
  padding: 12px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.error-state,
.upgrade-hint,
.saved-state {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: var(--radius-panel);
  font-size: var(--text-body-sm);
}

.error-state {
  background: var(--state-danger-bg);
  color: var(--state-danger);
}

.upgrade-hint {
  background: var(--state-warning-bg);
  color: var(--state-warning);
}

.saved-state {
  background: var(--state-success-bg);
  color: var(--state-success);
}

.diagnosis-context {
  display: grid;
  gap: 8px;
  margin-top: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(37, 99, 235, 0.22);
  border-radius: var(--radius-panel);
  background: var(--state-info-bg);
}

.diagnosis-context strong {
  display: block;
  margin-top: 4px;
  color: var(--text-main);
}

.diagnosis-context p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.context-label {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.plan-result {
  margin-top: 24px;
}

.plan-header {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.plan-title-card,
.plan-context-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: #fff;
}

.plan-context-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.plan-context-card strong {
  color: var(--text-main);
  line-height: 1.45;
}

.plan-header h3 {
  margin: 0 0 8px;
  font-size: var(--text-h4);
}

.plan-header p {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.research-brief,
.risk-boundary {
  border: 1px solid rgba(37, 99, 235, 0.22);
  background: var(--state-info-bg);
}

.risk-boundary {
  border-color: rgba(217, 119, 6, 0.22);
  background: var(--state-warning-bg);
}

.research-brief ul,
.risk-boundary ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.55;
}

.status-legend,
.plan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.secondary-btn {
  border: 1px solid var(--line-default);
  border-radius: var(--radius-btn);
  background: #fff;
  color: var(--text-main);
  padding: 9px 12px;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.secondary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.primary-action {
  border-color: var(--brand-primary);
  background: var(--brand-primary);
  color: #fff;
}

.plan-board {
  display: grid;
  gap: 16px;
}

.day-card {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr) minmax(260px, 320px);
  gap: 18px;
  align-items: start;
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: #fff;
  box-shadow: var(--shadow-card);
}

.day-rail {
  display: grid;
  gap: 10px;
}

.day-number {
  color: var(--brand-primary);
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
}

.phase-pill {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: var(--radius-pill);
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.day-main {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.day-heading {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.day-heading h4 {
  margin: 4px 0 0;
  color: var(--text-main);
  font-size: var(--text-body-lg);
  line-height: 1.45;
}

.day-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.day-meta-grid div {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border: 1px solid var(--line-default);
  border-radius: var(--radius-btn);
  background: var(--bg-panel);
}

.day-meta-grid span,
.action-label {
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.day-meta-grid strong {
  color: var(--text-main);
  font-size: var(--text-body-sm);
  line-height: 1.45;
}

.script-panel {
  display: grid;
  gap: 9px;
  padding: 14px;
  border: 1px solid rgba(22, 163, 74, 0.22);
  border-radius: var(--radius-panel);
  background: var(--state-success-bg);
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.script-panel strong {
  color: var(--text-main);
  font-size: var(--text-body-md);
  line-height: 1.5;
}

.script-panel p,
.script-panel ul {
  margin: 0;
}

.script-panel ul {
  display: grid;
  gap: 5px;
  padding-left: 18px;
}

.script-panel em {
  color: var(--state-success);
  font-style: normal;
  font-weight: var(--font-weight-semibold);
}

.day-actions {
  display: grid;
  gap: 10px;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.55;
}

.action-panel {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.day-actions p {
  margin: 0;
}

.tool-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tool-link,
.review-link,
.status-pill {
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.tool-link {
  border: 1px solid rgba(37, 99, 235, 0.26);
  background: var(--state-info-bg);
  color: var(--brand-primary);
  padding: 5px 10px;
  cursor: pointer;
}

.tool-link:hover {
  background: var(--brand-primary);
  color: #fff;
}

.review-link {
  justify-self: start;
  border: 1px solid rgba(22, 163, 74, 0.24);
  background: var(--state-success-bg);
  color: var(--state-success);
  padding: 5px 10px;
  cursor: pointer;
}

.review-link:hover {
  background: var(--state-success);
  color: #fff;
}

.status-pill {
  display: inline-flex;
  padding: 4px 8px;
}

.status-pending { background: var(--state-locked-bg); color: var(--state-locked); }
.status-active { background: var(--state-info-bg); color: var(--state-info); }
.status-done { background: var(--state-success-bg); color: var(--state-success); }
.status-reviewed { background: var(--state-warning-bg); color: var(--state-warning); }

.status-select {
  width: 100%;
  min-width: 86px;
  border: 1px solid var(--line-default);
  border-radius: var(--radius-btn);
  background: #fff;
  color: var(--text-main);
  padding: 6px 8px;
  font-size: var(--text-caption);
}

.plan-upgrade-panel {
  display: grid;
  gap: 16px;
  margin-top: 20px;
  padding: 18px;
  border: 1px solid rgba(217, 119, 6, 0.22);
  border-radius: var(--radius-panel);
  background: var(--state-warning-bg);
}

.upgrade-copy h4 {
  margin: 4px 0 8px;
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.upgrade-copy p {
  margin: 0;
  color: var(--state-warning);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.upgrade-benefits {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.benefit-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(217, 119, 6, 0.24);
  border-radius: var(--radius-panel);
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.benefit-card strong {
  color: var(--text-main);
  font-size: var(--text-body-md);
}

.benefit-card span {
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.benefit-card:hover {
  border-color: var(--brand-primary);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.upgrade-btn {
  justify-self: start;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-btn);
  background: var(--brand-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

@media (max-width: 1180px) {
  .form-grid,
  .upgrade-benefits,
  .plan-context-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .day-card {
    grid-template-columns: 120px minmax(0, 1fr);
  }

  .day-actions {
    grid-column: 2;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .quick-plan-hero {
    padding-top: 24px;
  }

  .quick-plan-panel {
    padding: 18px;
  }

  .form-grid,
  .plan-context-grid,
  .day-card,
  .day-meta-grid,
  .day-actions,
  .upgrade-benefits {
    grid-template-columns: 1fr;
  }

  .day-actions {
    grid-column: auto;
  }

  .day-rail {
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }

  .day-rail .status-select {
    grid-column: 1 / -1;
  }

  .day-heading {
    display: grid;
  }

  .tool-link,
  .review-link,
  .status-pill {
    justify-content: center;
    text-align: center;
    white-space: normal;
  }

  .upgrade-btn,
  .generate-btn,
  .plan-actions > * {
    width: 100%;
  }
}
</style>
