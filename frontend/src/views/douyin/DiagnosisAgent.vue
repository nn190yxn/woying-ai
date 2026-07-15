<template>
  <div class="agent-page">
    <div class="agent-header container-wide diagnosis-hero">
      <button class="back-btn" @click="$router.push('/douyin')">← 返回智能体矩阵</button>
      <h1 class="agent-title">行业体检表</h1>
      <p class="agent-desc">先回答几个顾问追问，再基于知识库生成五维健康度雷达图与诊断结论</p>
      <div class="task-flow-nav" aria-label="抖音经营链路">
        <router-link to="/douyin" class="task-flow-link">智能体矩阵</router-link>
        <span class="task-flow-link current">经营体检</span>
        <router-link to="/douyin/quick-plan" class="task-flow-link">15 天计划</router-link>
        <router-link to="/douyin/video-diagnoser" class="task-flow-link">数据复盘</router-link>
      </div>
    </div>

    <div class="agent-content container-wide diagnosis-workbench">
      <div class="wizard-steps">
        <div v-for="(step, index) in steps" :key="index" class="wizard-step" :class="{ active: currentStep === index, completed: currentStep > index }">
          <span class="step-num">{{ index + 1 }}</span>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>

      <div class="wizard-panel diagnosis-panel">
        <!-- Step 1: 行业与模式 -->
        <div v-if="currentStep === 0" class="step-panel">
          <div class="panel-heading">
            <span class="section-kicker">第一步</span>
            <h2 class="panel-title">选择您的行业与经营模式</h2>
            <p class="panel-hint">系统会按行业和经营模型匹配诊断口径，先确认这次体检的基础分轨。</p>
          </div>
          <div class="form-grid intro-grid">
            <div class="form-group">
              <label class="form-label">行业类型</label>
              <select v-model="form.industry" class="form-input">
                <option value="">请选择</option>
                <option value="restaurant">餐饮</option>
                <option value="beauty">美业</option>
                <option value="education">教培</option>
                <option value="service">生活服务</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">经营模式</label>
              <select v-model="form.mode" class="form-input">
                <option value="">请选择</option>
                <option value="group-buy">团购交易型（卖套餐券）</option>
                <option value="lead-gen">线索留资型（留电话/加微信）</option>
                <option value="brand">品牌曝光型</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: 顾问追问 -->
        <div v-if="currentStep === 1" class="step-panel">
          <div class="panel-heading">
            <span class="section-kicker">第二步</span>
            <h2 class="panel-title">顾问先追问 9 个关键问题</h2>
            <p class="panel-hint">回答越具体，知识库生成的诊断越接近真实经营场景。</p>
          </div>
          <div class="consult-questions">
            <div class="question-card">
              <label class="form-label">你这次最想优先解决什么？</label>
              <div class="choice-grid">
                <button
                  v-for="option in goalOptions"
                  :key="option.value"
                  type="button"
                  class="choice-pill"
                  :class="{ active: form.goal === option.value }"
                  @click="form.goal = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="question-card">
              <label class="form-label">目前最大的卡点是什么？</label>
              <textarea v-model="form.mainBottleneck" class="form-input textarea" placeholder="例如：视频有人看但没人买团购，私信也很少"></textarea>
            </div>
            <div class="question-card">
              <label class="form-label">现在主要怎么做抖音？</label>
              <textarea v-model="form.currentAction" class="form-input textarea" placeholder="例如：每周发 2 条探店视频，偶尔投 200 元本地推"></textarea>
            </div>
            <div class="question-card">
              <label class="form-label">你最想吸引哪类客户？</label>
              <input v-model="form.targetAudience" class="form-input" placeholder="例如：周边 3 公里宝妈、年轻白领、到店体验客" />
            </div>
            <div class="question-card">
              <label class="form-label">这 15 天最想推哪个产品或套餐？</label>
              <input v-model="form.coreOffer" class="form-input" placeholder="例如：98 元双人午餐、19.9 元体验课、基础护理体验卡" />
            </div>
            <div class="question-card">
              <label class="form-label">这个产品的价格、权益或限制是什么？</label>
              <textarea v-model="form.offerPrice" class="form-input textarea" placeholder="例如：98 元含 2 个招牌菜和饮品，仅工作日午市可用"></textarea>
            </div>
            <div class="question-card">
              <label class="form-label">客户下单前最犹豫什么？</label>
              <textarea v-model="form.userObjection" class="form-input textarea" placeholder="例如：怕分量少、怕停车不方便、怕到店排队、怕体验后被推销"></textarea>
            </div>
            <div class="question-card">
              <label class="form-label">门店现在有哪些能拍出来的证明素材？</label>
              <textarea v-model="form.proofAssets" class="form-input textarea" placeholder="例如：老客评价、出餐过程、后厨明档、团购核销截图、老师资质、前后对比"></textarea>
            </div>
            <div class="question-card">
              <label class="form-label">用户看完视频后希望他怎么行动？</label>
              <input v-model="form.conversionPath" class="form-input" placeholder="例如：点团购券、评论区打暗号、私信加微信、预约到店" />
            </div>
          </div>

          <h3 class="subsection-title">顺手勾选当前痛点</h3>
          <div class="pain-points">
            <div class="pain-category">
              <h3>流量力</h3>
              <label v-for="item in trafficPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.trafficPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>内容力</h3>
              <label v-for="item in contentPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.contentPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>转化力</h3>
              <label v-for="item in conversionPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.conversionPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>留存力</h3>
              <label v-for="item in retentionPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.retentionPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>投流力</h3>
              <label v-for="item in adsPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.adsPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Step 3: 当前基础数据 -->
        <div v-if="currentStep === 2" class="step-panel">
          <div class="panel-heading">
            <span class="section-kicker">第三步</span>
            <h2 class="panel-title">填写关键经营数据</h2>
            <p class="panel-hint">这些数据会直接影响雷达评分。填得越完整，报告置信度越高。</p>
          </div>
          <div class="form-grid metrics-input-grid">
            <div class="form-group metric-input-card">
              <label class="form-label">近 7 天发布条数</label>
              <input v-model.number="form.weeklyPosts" class="form-input" type="number" placeholder="例如：7" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">单条平均播放量</label>
              <input v-model.number="form.avgViewsPerVideo" class="form-input" type="number" placeholder="例如：1200" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">月均播放量</label>
              <input v-model.number="form.monthlyViews" class="form-input" type="number" placeholder="例如：50000" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">月均粉丝增长</label>
              <input v-model.number="form.monthlyFollowers" class="form-input" type="number" placeholder="例如：500" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">月均私信/评论咨询数</label>
              <input v-model.number="form.monthlyInquiries" class="form-input" type="number" placeholder="例如：80" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">月均团购核销/留资数</label>
              <input v-model.number="form.monthlyConversions" class="form-input" type="number" placeholder="例如：100" />
            </div>
            <div class="form-group metric-input-card">
              <label class="form-label">月均投流预算（元）</label>
              <input v-model.number="form.monthlyAdBudget" class="form-input" type="number" placeholder="例如：3000" />
            </div>
          </div>
        </div>

        <!-- Step 4: 结果 -->
        <div v-if="currentStep === 3" class="step-panel">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>AI 正在生成健康度诊断...</p>
          </div>
          <div v-else-if="errorMessage" class="error-state">
            {{ errorMessage }}
          </div>
          <div v-else-if="result" class="result-state">
            <div class="diagnosis-overview">
              <div class="overview-item">
                <span class="overview-label">诊断类型</span>
                <strong>{{ result.diagnosticProfile }}</strong>
              </div>
              <div class="overview-item">
                <span class="overview-label">主短板</span>
                <strong>{{ weakestDimensionLabel }}</strong>
              </div>
              <div class="overview-item">
                <span class="overview-label">置信度</span>
                <strong>{{ result.confidence }}</strong>
              </div>
            </div>

            <div class="result-layout">
              <div class="result-main">
                <div class="diagnosis-summary">
                  <span class="section-kicker">诊断结论</span>
                  <h3>经营短板判断</h3>
                  <p>{{ result.aiDiagnosis || result.diagnosis }}</p>
                </div>

                <div v-if="result.dimensionDetails.length" class="dimension-details">
                  <h3>评分说明</h3>
                  <div v-for="item in result.dimensionDetails" :key="item.key" class="dimension-card" :class="{ weakest: item.key === result.weakestDimension }">
                    <div class="dimension-card-head">
                      <strong>{{ item.name }}</strong>
                      <span>{{ item.score }}分</span>
                    </div>
                    <p>{{ item.basis }}</p>
                  </div>
                </div>

                <div class="suggestions">
                  <h3>优先优化建议</h3>
                  <ul>
                    <li v-for="(s, i) in result.suggestions" :key="i">{{ s }}</li>
                  </ul>
                </div>

                <div v-if="result.nextQuestions.length" class="follow-up-questions">
                  <h3>进入计划前建议补充</h3>
                  <ul>
                    <li v-for="(question, i) in result.nextQuestions" :key="i">{{ question }}</li>
                  </ul>
                </div>

                <div v-if="result.riskBoundary.length" class="risk-boundary">
                  <h3>风险边界</h3>
                  <ul>
                    <li v-for="(risk, i) in result.riskBoundary" :key="i">{{ risk }}</li>
                  </ul>
                </div>
              </div>

              <aside class="result-side">
                <div class="radar-container">
                  <h3 class="radar-title">五维健康度雷达</h3>
                  <div class="radar-chart">
                    <div v-for="dim in result.radar" :key="dim.name" class="radar-item">
                      <div class="radar-label">{{ dim.name }}</div>
                      <div class="radar-bar">
                        <div class="radar-fill" :style="{ width: dim.score + '%', background: dim.color }"></div>
                      </div>
                      <div class="radar-score" :class="dim.scoreClass">{{ dim.score }}分</div>
                    </div>
                  </div>
                </div>

                <div class="diagnosis-basis">
                  <div class="confidence-pill">诊断置信度：{{ result.confidence }}</div>
                  <p v-if="result.benchmarkSummary" class="benchmark-summary">{{ result.benchmarkSummary }}</p>
                  <h3>诊断依据</h3>
                  <ul>
                    <li v-for="(basis, i) in result.dataBasis" :key="i">{{ basis }}</li>
                  </ul>
                </div>
              </aside>
            </div>

            <div class="next-actions">
              <h3>下一步动作</h3>
              <p>体检报告已生成，建议按“作战计划、执行工具、数据复盘”继续推进，把低分维度拆成每天可执行的动作。</p>
              <div class="next-action-grid">
                <button
                  v-for="action in recommendedActions"
                  :key="action.code"
                  type="button"
                  class="next-action-card"
                  :class="{ primary: action.primary }"
                  @click="goRecommendedAction(action)"
                >
                  <span class="next-action-type">{{ action.type }}</span>
                  <strong>{{ action.title }}</strong>
                  <span>{{ action.desc }}</span>
                </button>
              </div>
              <div class="membership-recommendation">
                <div>
                  <span class="membership-label">{{ upgradeRecommendation.problem }}</span>
                  <h4>{{ upgradeRecommendation.title }}</h4>
                  <p>{{ upgradeRecommendation.desc }}</p>
                </div>
                <button type="button" class="membership-btn" @click="goMembership">{{ upgradeRecommendation.cta }}</button>
              </div>
              <div class="upgrade-actions">
                <button class="btn-primary" @click="goNextPlan">下一步：生成 15 天提升计划</button>
                <button class="btn-secondary" @click="currentStep = 2">返回修改信息</button>
                <button class="btn-secondary" @click="resetDiagnosis">重新体检</button>
                <button class="btn-secondary" @click="bookConsult">预约专家诊断</button>
              </div>
            </div>
          </div>
        </div>

        <!-- 导航 -->
        <div class="wizard-nav" v-if="currentStep < 3">
          <button v-if="currentStep > 0" class="nav-btn prev" @click="currentStep--">上一步</button>
          <button v-if="currentStep < 2" class="nav-btn next" @click="currentStep++" :disabled="!canProceed">下一步</button>
          <button v-if="currentStep === 2" class="nav-btn generate" @click="generate" :disabled="!canProceed || loading">
            {{ loading ? '正在生成...' : '生成体检报告' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { getRecommendedDiagnosisActions } from '@/constants/diagnosisRecommendations'

const router = useRouter()
const currentStep = ref(0)
const loading = ref(false)
const result = ref(null)
const errorMessage = ref('')

const steps = [
  { label: '行业分轨' },
  { label: '顾问追问' },
  { label: '基础数据' },
  { label: '体检报告' }
]

const recommendedActions = computed(() => {
  return getRecommendedDiagnosisActions('douyin', {
    recommendedNext: result.value?.recommendedNext,
    weakestDimension: result.value?.weakestDimension
  })
})

const upgradeRecommendationMap = {
  traffic: {
    problem: '内容问题',
    title: '适合开通初阶版：持续补选题、标题和封面',
    desc: '当前主要卡在流量获取，优先使用选题、标题、封面和脚本工具，把内容测试节奏固定下来。',
    cta: '查看内容权益'
  },
  content: {
    problem: '内容问题',
    title: '适合开通初阶版：把内容生产变成日常动作',
    desc: '当前主要卡在不会拍、完播低或内容同质化，先解锁脚本、选题、标题和封面能力。',
    cta: '查看内容权益'
  },
  conversion: {
    problem: '转化问题',
    title: '适合开通进阶版：补齐 15 天作战表和转化工具',
    desc: '当前主要卡在有流量无成交，建议用作战计划、组品定价、转化链路和数据复盘连续优化。',
    cta: '查看转化权益'
  },
  retention: {
    problem: '经营问题',
    title: '适合开通进阶版：把复购和私域承接接起来',
    desc: '当前主要卡在复购、老客和私域承接，需要用诊断、作战计划、复盘和私域工具形成经营闭环。',
    cta: '查看经营权益'
  },
  ads: {
    problem: '投流问题',
    title: '适合开通高阶版：校准投流、预算和 90 天节奏',
    desc: '当前主要卡在投流判断和 ROI，建议结合本地推策略、投流评估、90 天战略和专家校准。',
    cta: '查看投流权益'
  }
}

const upgradeRecommendation = computed(() => upgradeRecommendationMap[result.value?.weakestDimension] || {
  problem: '经营问题',
  title: '适合开通进阶版：从诊断进入执行和复盘',
  desc: '当前需要把诊断结论拆成计划、执行工具和复盘指标，持续校准经营动作。',
  cta: '查看会员权益'
})

const buildMetricsSummary = () => {
  const metrics = [
    ['weeklyPosts', form.weeklyPosts],
    ['avgViewsPerVideo', form.avgViewsPerVideo],
    ['monthlyViews', form.monthlyViews],
    ['monthlyFollowers', form.monthlyFollowers],
    ['monthlyInquiries', form.monthlyInquiries],
    ['monthlyConversions', form.monthlyConversions],
    ['monthlyAdBudget', form.monthlyAdBudget]
  ]
  return metrics
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
}

const buildDiagnosisQuery = () => ({
  industry: form.industry,
  mode: form.mode,
  source: 'diagnosis',
  weakness: result.value?.weakestDimension || '',
  profile: result.value?.diagnosticProfile || '',
  confidence: result.value?.confidence || '',
  metrics: buildMetricsSummary(),
  bottleneck: form.mainBottleneck || '',
  currentAction: form.currentAction || '',
  targetAudience: form.targetAudience || '',
  coreOffer: form.coreOffer || '',
  offerPrice: form.offerPrice || '',
  userObjection: form.userObjection || '',
  proofAssets: form.proofAssets || '',
  conversionPath: form.conversionPath || '',
  painSummary: Object.entries({
    traffic: form.trafficPains,
    content: form.contentPains,
    conversion: form.conversionPains,
    retention: form.retentionPains,
    ads: form.adsPains
  })
    .flatMap(([key, items]) => (items || []).map((item) => `${dimensionLabelMap[key] || key}:${item}`))
    .join('；'),
  goal: form.goal || ''
})

const form = reactive({
  industry: '',
  mode: '',
  trafficPains: [],
  contentPains: [],
  conversionPains: [],
  retentionPains: [],
  adsPains: [],
  goal: '',
  mainBottleneck: '',
  currentAction: '',
  targetAudience: '',
  coreOffer: '',
  offerPrice: '',
  userObjection: '',
  proofAssets: '',
  conversionPath: '',
  weeklyPosts: null,
  avgViewsPerVideo: null,
  monthlyViews: null,
  monthlyFollowers: null,
  monthlyInquiries: null,
  monthlyConversions: null,
  monthlyAdBudget: null
})

const trafficPains = ['播放量长期低于 500', '流量主要来自粉丝而非推荐', '同城流量覆盖不足', '流量波动大不稳定']
const contentPains = ['不知道拍什么', '视频完播率低', '缺乏爆款内容', '内容同质化严重', '更新频率低']
const conversionPains = ['有流量无转化', '团购核销率低', '私信回复不及时', '留资成本高', '客单价上不去']
const retentionPains = ['复购率低', '老客沉睡多', '会员体系未建立', '私域导流弱']
const adsPains = ['不敢投流', '投流 ROI 为负', '不知道投 DOU+ 还是本地推', '素材跑量差']
const goalOptions = [
  { value: 'traffic', label: '先把播放做起来' },
  { value: 'conversion', label: '提高团购/留资转化' },
  { value: 'content', label: '解决不会拍内容' },
  { value: 'ads', label: '投流少亏钱' },
  { value: 'retention', label: '老客复购和私域' }
]

const canProceed = computed(() => {
  if (currentStep.value === 0) return form.industry && form.mode
  if (currentStep.value === 1) return true
  if (currentStep.value === 2) return true
  return false
})

const scoreClass = (score) => score < 40 ? 'low' : score < 70 ? 'mid' : 'high'
const dimensionLabelMap = {
  traffic: '流量力',
  content: '内容力',
  conversion: '转化力',
  retention: '留存力',
  ads: '投流力'
}

const weakestDimensionLabel = computed(() => {
  if (!result.value?.weakestDimension) return '待识别'
  return dimensionLabelMap[result.value.weakestDimension] || result.value.weakestDimension
})

const buildRadar = (radarData = {}) => [
  { name: '流量力', score: radarData.traffic ?? 60, color: '#3b82f6' },
  { name: '内容力', score: radarData.content ?? 60, color: '#8b5cf6' },
  { name: '转化力', score: radarData.conversion ?? 60, color: '#f59e0b' },
  { name: '留存力', score: radarData.retention ?? 60, color: '#10b981' },
  { name: '投流力', score: radarData.ads ?? radarData.profit ?? 60, color: '#ef4444' }
].map(item => ({
  ...item,
  score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
  scoreClass: scoreClass(Number(item.score) || 0)
}))

const generate = async () => {
  if (loading.value) return
  loading.value = true
  result.value = null
  errorMessage.value = ''
  currentStep.value = 3
  try {
    const painPoints = {
      traffic: form.trafficPains,
      content: form.contentPains,
      conversion: form.conversionPains,
      retention: form.retentionPains,
      ads: form.adsPains
    }
    const response = await request.post(
      '/douyin/diagnosis',
      {
        industry: form.industry,
        mode: form.mode,
        interview: {
          goal: form.goal,
          mainBottleneck: form.mainBottleneck,
          currentAction: form.currentAction,
          targetAudience: form.targetAudience,
          coreOffer: form.coreOffer,
          offerPrice: form.offerPrice,
          userObjection: form.userObjection,
          proofAssets: form.proofAssets,
          conversionPath: form.conversionPath
        },
        painPoints,
        metrics: {
          weeklyPosts: form.weeklyPosts,
          avgViewsPerVideo: form.avgViewsPerVideo,
          monthlyViews: form.monthlyViews,
          monthlyFollowers: form.monthlyFollowers,
          monthlyInquiries: form.monthlyInquiries,
          monthlyConversions: form.monthlyConversions,
          monthlyAdBudget: form.monthlyAdBudget
        }
      },
      {
        timeout: 70000
      }
    )
    const diagnosisResult = response.result || {}
    result.value = {
      radar: buildRadar(diagnosisResult.radarData),
      diagnosis: diagnosisResult.diagnosis || '抖音经营诊断已生成，请优先处理分数最低的经营维度。',
      aiDiagnosis: diagnosisResult.aiDiagnosis || '',
      dataBasis: diagnosisResult.dataBasis || ['当前数据较少，本报告按已填信息和痛点勾选做初筛判断。'],
      confidence: diagnosisResult.confidence || '低',
      benchmarkSummary: diagnosisResult.benchmarkSummary || '',
      diagnosticProfile: diagnosisResult.diagnosticProfile || '综合经营诊断',
      weakestDimension: diagnosisResult.weakestDimension || '',
      scoringVersion: diagnosisResult.scoringVersion || '',
      dimensionDetails: diagnosisResult.dimensionDetails || [],
      suggestions: diagnosisResult.suggestions || [],
      nextQuestions: diagnosisResult.nextQuestions || [],
      riskBoundary: diagnosisResult.riskBoundary || [],
      recommendedNext: diagnosisResult.recommendedNext || []
    }
  } catch (error) {
    console.error('诊断失败:', error)
    errorMessage.value = error.message || '诊断失败，请稍后重试'
    currentStep.value = 3
  } finally {
    loading.value = false
  }
}

const goNextPlan = () => {
  router.push({
    path: '/douyin/quick-plan',
    query: buildDiagnosisQuery()
  })
}

const goRecommendedAction = (action) => {
  router.push({
    path: action.path,
    query: buildDiagnosisQuery()
  })
}

const resetDiagnosis = () => {
  currentStep.value = 0
  result.value = null
  errorMessage.value = ''
}

const bookConsult = () => {
  router.push('/consultation')
}

const goMembership = () => {
  router.push({ path: '/membership', query: { source: 'douyin-diagnosis', weakness: result.value?.weakestDimension || undefined } })
}
</script>

<style scoped>
@import './agent-common.css';

.diagnosis-hero {
  padding-top: 32px;
}

.diagnosis-workbench {
  max-width: var(--workbench-max-width);
}

.diagnosis-panel {
  padding: 28px;
  border-color: var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.wizard-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.wizard-step {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
  color: var(--text-secondary);
}

.wizard-step.active {
  border-color: rgba(37, 99, 235, 0.32);
  background: var(--state-info-bg);
  color: var(--brand-primary);
}

.wizard-step.completed {
  border-color: rgba(22, 163, 74, 0.26);
  background: var(--state-success-bg);
  color: var(--state-success);
}

.step-num {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: currentColor;
  color: #fff;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-bold);
}

.step-label {
  min-width: 0;
  overflow: hidden;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-heading {
  margin-bottom: 20px;
}

.section-kicker {
  display: inline-flex;
  margin-bottom: 8px;
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.panel-title {
  margin: 0 0 8px;
  color: var(--text-main);
  font-size: var(--text-h4);
}

.panel-hint {
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
}

.intro-grid {
  max-width: 760px;
}

.form-group {
  min-width: 0;
}

.pain-points {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.pain-category {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.consult-questions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;
}

.question-card {
  min-width: 0;
  padding: 14px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
}

.question-card:first-child,
.question-card:nth-child(2),
.question-card:nth-child(3) {
  grid-column: span 3;
}

.choice-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.choice-pill {
  padding: 8px 12px;
  border: 1px solid var(--line-soft);
  border-radius: 999px;
  background: var(--bg-card);
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.choice-pill.active {
  border-color: var(--brand-primary);
  color: var(--brand-primary);
  background: var(--state-info-bg);
}

.textarea {
  min-height: 76px;
  resize: vertical;
}

.subsection-title {
  margin: 8px 0 12px;
  font-size: var(--text-body-lg);
}

.pain-category h3 {
  font-size: var(--text-body-md);
  margin-bottom: 8px;
}

.pain-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 7px 0;
  cursor: pointer;
  font-size: var(--text-body-sm);
  line-height: 1.45;
}

.pain-item input {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
  margin-top: 2px;
}

.metrics-input-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.metric-input-card {
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.radar-container {
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
}

.diagnosis-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 14px;
}

.overview-item {
  padding: 14px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
}

.overview-label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: var(--text-body-sm);
}

.overview-item strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.result-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 16px;
  align-items: start;
}

.result-main,
.result-side {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.diagnosis-basis {
  padding: 16px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
}

.confidence-pill {
  display: inline-flex;
  margin-bottom: 10px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--state-info-bg);
  color: var(--brand-primary);
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
}

.diagnosis-basis h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 8px;
}

.benchmark-summary {
  margin: 0 0 12px;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.diagnosis-basis li {
  margin-bottom: 6px;
  color: var(--text-secondary);
}

.radar-title {
  font-size: var(--text-h4);
  margin-bottom: 16px;
}

.radar-chart {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.radar-label {
  width: 60px;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
}

.radar-bar {
  flex: 1;
  height: 12px;
  background: var(--bg-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.radar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s;
}

.radar-score {
  width: 50px;
  text-align: right;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-bold);
}

.radar-score.low { color: #dc2626; }
.radar-score.mid { color: #d97706; }
.radar-score.high { color: #059669; }

.dimension-details {
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
}

.dimension-details h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 12px;
}

.dimension-card {
  padding: 12px 14px;
  margin-bottom: 10px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.dimension-card.weakest {
  border-color: rgba(220, 38, 38, 0.28);
  background: var(--state-danger-bg);
}

.dimension-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.dimension-card-head span {
  font-weight: var(--font-weight-bold);
}

.dimension-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.error-state {
  margin-top: 20px;
  padding: 12px 16px;
  background: var(--state-danger-bg);
  color: var(--state-danger);
  border-radius: var(--radius-panel);
  font-size: var(--text-body-sm);
}

.diagnosis-summary {
  padding: 18px;
  background: var(--state-info-bg);
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: var(--radius-panel);
}

.next-actions {
  margin-top: 16px;
  padding: 18px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
}

.next-actions h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 8px;
}

.next-actions p {
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.next-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.next-action-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.next-action-card:hover {
  transform: translateY(-2px);
  border-color: rgba(30, 58, 138, 0.24);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.next-action-card.primary {
  border-color: rgba(30, 58, 138, 0.28);
  background: var(--state-info-bg);
}

.next-action-type {
  width: fit-content;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--bg-card);
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.next-action-card strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.next-action-card span:last-child {
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.diagnosis-summary h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 8px;
}

.diagnosis-summary p {
  color: var(--text-secondary);
}

.suggestions {
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
}

.suggestions h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 12px;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.risk-boundary,
.follow-up-questions {
  padding: 16px;
  border: 1px solid rgba(217, 119, 6, 0.22);
  border-radius: var(--radius-panel);
  background: var(--state-warning-bg);
}

.risk-boundary h3,
.follow-up-questions h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 10px;
}

.risk-boundary ul,
.follow-up-questions ul {
  margin: 0;
  padding-left: 20px;
}

.risk-boundary li,
.follow-up-questions li {
  margin-bottom: 8px;
  color: var(--state-warning);
}

.upgrade-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 12px;
}

.membership-recommendation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding: 16px;
  border: 1px solid rgba(217, 119, 6, 0.22);
  border-radius: var(--radius-panel);
  background: var(--state-warning-bg);
  text-align: left;
}

.membership-label {
  color: var(--state-warning);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.membership-recommendation h4 {
  margin: 4px 0 8px;
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.membership-recommendation p {
  margin: 0;
  color: var(--state-warning);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.membership-btn {
  flex: 0 0 auto;
  padding: 10px 16px;
  border: none;
  border-radius: var(--radius-btn);
  background: var(--brand-primary);
  color: #fff;
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.btn-primary {
  padding: 10px 24px;
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.btn-secondary {
  padding: 10px 24px;
  background: white;
  color: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.wizard-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 22px;
}

.nav-btn {
  min-height: 42px;
  padding: 10px 18px;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.nav-btn.prev {
  border: 1px solid var(--line-soft);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.nav-btn.next,
.nav-btn.generate {
  border: 1px solid var(--brand-primary);
  background: var(--brand-primary);
  color: #fff;
}

.nav-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 1100px) {
  .pain-points,
  .metrics-input-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .result-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .diagnosis-hero {
    padding-top: 24px;
  }

  .diagnosis-panel {
    padding: 18px;
  }

  .wizard-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .step-label {
    overflow: visible;
    text-overflow: clip;
    white-space: normal;
  }

  .consult-questions,
  .pain-points,
  .metrics-input-grid,
  .diagnosis-overview,
  .next-action-grid,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .question-card:first-child,
  .question-card:nth-child(2),
  .question-card:nth-child(3) {
    grid-column: auto;
  }

  .membership-recommendation {
    align-items: stretch;
    flex-direction: column;
  }

  .membership-btn {
    width: 100%;
  }

  .upgrade-actions,
  .wizard-nav {
    justify-content: stretch;
  }

  .upgrade-actions > *,
  .wizard-nav > * {
    width: 100%;
  }
}
</style>
