<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.push('/xhs')">← 返回智能体矩阵</button>
      <h1 class="agent-title">🩺 账号体检表</h1>
      <p class="agent-desc">基于小红书五维健康度模型，快速定位账号问题</p>
    </div>

    <div class="agent-content container">
      <div class="wizard-steps">
        <div v-for="(step, index) in steps" :key="index" class="wizard-step" :class="{ active: currentStep === index, completed: currentStep > index }">
          <span class="step-num">{{ index + 1 }}</span>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>

      <div class="wizard-panel">
        <!-- Step 1: 行业与基础信息 -->
        <div v-if="currentStep === 0" class="step-panel">
          <h2 class="panel-title">选择您的赛道与现状</h2>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">主营赛道</label>
              <select v-model="form.industry" class="form-input">
                <option value="">请选择</option>
                <option value="beauty">美妆护肤</option>
                <option value="fashion">穿搭时尚</option>
                <option value="food">美食探店</option>
                <option value="travel">旅游出行</option>
                <option value="education">知识教育</option>
                <option value="home">家居家装</option>
                <option value="parenting">母婴育儿</option>
                <option value="fitness">运动健身</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">笔记类型</label>
              <select v-model="form.noteType" class="form-input">
                <option value="">请选择</option>
                <option value="图文">图文笔记</option>
                <option value="视频">视频笔记</option>
                <option value="mixed">图文+视频混合</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 2: 痛点勾选 -->
        <div v-if="currentStep === 1" class="step-panel">
          <h2 class="panel-title">勾选当前存在的痛点</h2>
          <p class="panel-hint">根据实际感受勾选，系统将生成五维健康度评分</p>
          <div class="pain-points">
            <div class="pain-category">
              <h3>📌 内容垂直度</h3>
              <label class="check-item" v-for="item in pains.verticality" :key="item">
                <input type="checkbox" v-model="form.verticalityPains" :value="item">
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>💬 互动质量</h3>
              <label class="check-item" v-for="item in pains.interaction" :key="item">
                <input type="checkbox" v-model="form.interactionPains" :value="item">
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>📅 发布活跃度</h3>
              <label class="check-item" v-for="item in pains.activity" :key="item">
                <input type="checkbox" v-model="form.activityPains" :value="item">
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>⚠️ 违规记录</h3>
              <select v-model="form.violationStatus" class="form-input">
                <option value="none">无违规记录</option>
                <option value="minor">轻微限流/警告</option>
                <option value="multiple">多次违规/禁言</option>
                <option value="severe">严重封号风险</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Step 3: 生成结果 -->
        <div v-if="currentStep === 2" class="step-panel">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>正在分析账号健康度...</p>
          </div>
          <div v-else-if="result" class="result-container">
            <div v-if="errorMessage" class="error-state">{{ errorMessage }}</div>
            <div class="diagnosis-overview">
              <div class="overview-item">
                <span>诊断类型</span>
                <strong>{{ result.diagnosticProfile }}</strong>
              </div>
              <div class="overview-item">
                <span>主短板</span>
                <strong>{{ weakestDimensionLabel }}</strong>
              </div>
              <div class="overview-item">
                <span>置信度</span>
                <strong>{{ result.confidence }}</strong>
              </div>
            </div>
            <div class="score-overview">
              <div class="score-circle" :style="{ borderColor: levelColor }">
                <span class="score-num">{{ result.totalScore }}</span>
                <span class="score-label">总评分</span>
              </div>
              <div class="level-badge" :style="{ backgroundColor: levelColor }">{{ result.level }}级 · {{ levelText }}</div>
            </div>
            <p class="diagnosis-text">{{ result.diagnosis }}</p>
            <div class="diagnosis-basis">
              <h3>诊断依据</h3>
              <ul>
                <li v-for="(basis, i) in result.dataBasis" :key="i">{{ basis }}</li>
              </ul>
            </div>
            <div v-if="result" class="radar-chart" ref="radarChart"></div>
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
            <div class="suggestion-list">
              <h3>优化建议</h3>
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
            <div class="next-actions">
              <h3>下一步动作</h3>
              <div class="next-action-grid">
                <button
                  v-for="action in recommendedActions"
                  :key="action.code"
                  type="button"
                  class="next-action-card"
                  @click="goRecommendedAction(action)"
                >
                  <span>{{ action.type }}</span>
                  <strong>{{ action.title }}</strong>
                  <em>{{ action.desc }}</em>
                </button>
              </div>
            </div>
          </div>
          <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>
        </div>
      </div>

      <div class="wizard-nav">
        <button v-if="currentStep > 0 && currentStep < 2" class="nav-btn secondary" @click="currentStep--">上一步</button>
        <button v-if="currentStep < 2" class="nav-btn primary" :disabled="!canNext" @click="nextStep">
          {{ currentStep === 1 ? '生成体检报告' : '下一步' }}
        </button>
        <button v-if="currentStep === 2" class="nav-btn primary" @click="$router.push('/membership')">升级会员，解锁完整优化方案 →</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'
import { getRecommendedDiagnosisActions } from '@/constants/diagnosisRecommendations'

const router = useRouter()

const steps = [
  { label: '基础信息' },
  { label: '痛点勾选' },
  { label: '体检报告' }
]
const currentStep = ref(0)
const loading = ref(false)
const result = ref(null)
const radarChart = ref(null)
const errorMessage = ref('')

const pains = {
  verticality: ['内容杂乱，赛道不聚焦', '选题跟风，缺乏主线', '笔记类型混乱（图文/视频混发无规律）', '标签/话题使用不精准'],
  interaction: ['赞藏比低（点赞少/收藏少）', '评论区冷清，缺乏互动引导', '私信咨询转化率低', '粉丝增长缓慢/掉粉'],
  activity: ['更新频率低（<3篇/周）', '发布时间随机，无规律', '长期断更（>7天）', '缺乏系列化内容']
}

const form = reactive({
  industry: '',
  noteType: '',
  verticalityPains: [],
  interactionPains: [],
  activityPains: [],
  violationStatus: 'none'
})

const canNext = computed(() => {
  if (currentStep.value === 0) return form.industry && form.noteType
  if (currentStep.value === 1) return true
  return false
})

const levelColor = computed(() => {
  const l = result.value?.level || 'C'
  return l === 'A' ? '#10b981' : l === 'B' ? '#f59e0b' : l === 'C' ? '#f97316' : '#ef4444'
})

const levelText = computed(() => {
  const l = result.value?.level || 'C'
  return l === 'A' ? '健康' : l === 'B' ? '良好' : l === 'C' ? '预警' : '危险'
})

const dimensionLabelMap = {
  verticality: '内容垂直度',
  interaction: '互动质量',
  activity: '发布活跃度',
  violation: '违规记录',
  completeness: '账号完善度'
}

const weakestDimensionLabel = computed(() => {
  if (!result.value?.weakestDimension) return '待识别'
  return dimensionLabelMap[result.value.weakestDimension] || result.value.weakestDimension
})

const recommendedActions = computed(() => {
  return getRecommendedDiagnosisActions('xhs', {
    recommendedNext: result.value?.recommendedNext,
    weakestDimension: result.value?.weakestDimension
  })
})

const nextStep = async () => {
  if (currentStep.value === 1) {
    loading.value = true
    errorMessage.value = ''
    result.value = null
    currentStep.value++
    try {
      const response = await request.post('/xhs/account-diagnosis', form)
      const diagnosisResult = response.result || {}
      result.value = {
        radar: diagnosisResult.radar || [],
        totalScore: diagnosisResult.totalScore || 0,
        level: diagnosisResult.level || 'C',
        diagnosis: diagnosisResult.diagnosis || '小红书账号体检已生成，请优先处理最低分维度。',
        dataBasis: diagnosisResult.dataBasis || ['当前输入信息较少，本报告按已填痛点做初筛判断。'],
        confidence: diagnosisResult.confidence || '低',
        diagnosticProfile: diagnosisResult.diagnosticProfile || '账号综合诊断',
        weakestDimension: diagnosisResult.weakestDimension || '',
        dimensionDetails: diagnosisResult.dimensionDetails || [],
        suggestions: diagnosisResult.suggestions || [],
        recommendedNext: diagnosisResult.recommendedNext || [],
        nextQuestions: diagnosisResult.nextQuestions || [],
        riskBoundary: diagnosisResult.riskBoundary || []
      }
      await nextTick()
      await renderRadar(result.value.radar)
    } catch (error) {
      console.error('账号体检失败:', error)
      errorMessage.value = error.message || '账号体检失败，请稍后重试'
    } finally {
      loading.value = false
    }
    return
  }
  currentStep.value++
}

const goRecommendedAction = (action) => {
  router.push({
    path: action.path,
    query: {
      industry: form.industry,
      noteType: form.noteType,
      source: 'account-diagnosis',
      weakness: result.value?.weakestDimension || '',
      profile: result.value?.diagnosticProfile || '',
      confidence: result.value?.confidence || ''
    }
  })
}

const renderRadar = async (radarData) => {
  await new Promise(r => setTimeout(r, 50))
  if (!radarChart.value) return
  const [echartsCore, charts, components, renderers] = await Promise.all([
    import('echarts/core'),
    import('echarts/lib/chart/radar'),
    import('echarts/lib/component/radar'),
    import('echarts/renderers')
  ])
  echartsCore.use([
    charts.RadarChart,
    components.RadarComponent,
    renderers.CanvasRenderer
  ])
  const chart = echartsCore.init(radarChart.value)
  chart.setOption({
    radar: {
      indicator: radarData.map(d => ({ name: d.name, max: 100 })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: { color: '#333' }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.map(d => d.score),
        name: '健康度',
        areaStyle: { color: 'rgba(255, 36, 66, 0.2)' },
        lineStyle: { color: '#ff2442' },
        itemStyle: { color: '#ff2442' }
      }]
    }]
  })
}

</script>

<style scoped>
@import '../agent-common.css';

.diagnosis-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.overview-item,
.diagnosis-basis,
.dimension-card,
.next-actions {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.overview-item {
  padding: var(--card-padding-md);
}

.overview-item span {
  display: block;
  margin-bottom: 6px;
  color: var(--text-muted);
  font-size: var(--text-body-sm);
}

.overview-item strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.diagnosis-basis,
.follow-up-questions,
.risk-boundary,
.next-actions {
  padding: var(--card-padding-md);
  margin: var(--space-4) 0;
}

.diagnosis-basis h3,
.dimension-details h3,
.follow-up-questions h3,
.risk-boundary h3,
.next-actions h3 {
  margin-bottom: 10px;
  font-size: var(--text-body-lg);
}

.diagnosis-basis ul,
.follow-up-questions ul,
.risk-boundary ul,
.suggestion-list ul {
  margin: 0;
  padding-left: 20px;
}

.diagnosis-basis li,
.follow-up-questions li,
.risk-boundary li,
.suggestion-list li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.risk-boundary {
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: var(--radius-panel);
  background: var(--state-warning-bg);
}

.risk-boundary li {
  color: #9a3412;
}

.dimension-details {
  margin: 18px 0;
}

.dimension-card {
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-3);
}

.dimension-card.weakest {
  border-color: rgba(220, 38, 38, 0.24);
  background: var(--state-danger-bg);
}

.dimension-card-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.dimension-card p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
}

.next-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.next-action-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
  color: var(--text-main);
  text-align: left;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.next-action-card:hover {
  border-color: rgba(255, 36, 66, 0.28);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.next-action-card span {
  width: fit-content;
  padding: 3px var(--space-2);
  border-radius: var(--radius-pill);
  background: var(--pillar-xiaohongshu-bg);
  color: #be123c;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.next-action-card em {
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  font-style: normal;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .diagnosis-overview,
  .next-action-grid {
    grid-template-columns: 1fr;
  }
}
</style>
