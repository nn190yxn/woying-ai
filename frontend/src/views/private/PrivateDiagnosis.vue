<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.push('/private')">← 返回智能体矩阵</button>
      <h1 class="agent-title">私域运营体检表</h1>
      <p class="agent-desc">勾选痛点，生成五维健康度雷达图与诊断结论</p>
    </div>

    <div class="agent-content container">
      <div class="wizard-steps">
        <div v-for="(step, index) in steps" :key="index" class="wizard-step" :class="{ active: currentStep === index, completed: currentStep > index }">
          <span class="step-num">{{ index + 1 }}</span>
          <span class="step-label">{{ step.label }}</span>
        </div>
      </div>

      <div class="wizard-panel">
        <div v-if="currentStep === 0" class="step-panel">
          <h2 class="panel-title">选择您的行业与私域模式</h2>
          <div class="form-grid">
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
              <label class="form-label">私域模式</label>
              <select v-model="form.mode" class="form-input">
                <option value="">请选择</option>
                <option value="wechat">企微导流（1v1 私聊转化）</option>
                <option value="community">社群运营（群内批量转化）</option>
                <option value="mixed">混合模式（企微 + 社群）</option>
              </select>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 1" class="step-panel">
          <h2 class="panel-title">勾选当前存在的痛点</h2>
          <p class="panel-hint">根据实际感受勾选，我们将生成健康度评分</p>
          <div class="pain-points">
            <div class="pain-category">
              <h3>引流力</h3>
              <label v-for="item in trafficPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.trafficPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
            <div class="pain-category">
              <h3>运营力</h3>
              <label v-for="item in operationPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.operationPains" :value="item" />
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
              <h3>裂变力</h3>
              <label v-for="item in fissionPains" :key="item" class="pain-item">
                <input type="checkbox" v-model="form.fissionPains" :value="item" />
                <span>{{ item }}</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="currentStep === 2" class="step-panel">
          <h2 class="panel-title">填写当前基础数据（可选）</h2>
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">企微好友总数</label>
              <input v-model.number="form.wechatFriends" class="form-input" type="number" placeholder="例如：500" />
            </div>
            <div class="form-group">
              <label class="form-label">社群总数</label>
              <input v-model.number="form.communityCount" class="form-input" type="number" placeholder="例如：5" />
            </div>
            <div class="form-group">
              <label class="form-label">月均私域成交额（元）</label>
              <input v-model.number="form.monthlyRevenue" class="form-input" type="number" placeholder="例如：20000" />
            </div>
            <div class="form-group">
              <label class="form-label">月均新增好友数</label>
              <input v-model.number="form.monthlyNewFriends" class="form-input" type="number" placeholder="例如：100" />
            </div>
          </div>
        </div>

        <div v-if="currentStep === 3" class="step-panel">
          <div v-if="loading" class="loading-state">
            <div class="loading-spinner"></div>
            <p>AI 正在基于知识库生成私域健康度诊断...</p>
          </div>
          <div v-else-if="errorMessage" class="error-state">{{ errorMessage }}</div>
          <div v-else-if="result" class="result-state">
            <div class="result-header">
              <div class="industry-badge">{{ result.industry }}</div>
              <div class="avg-score">{{ result.avgScore }}</div>
              <span class="score-label">综合健康分</span>
            </div>

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

            <div class="radar-container">
              <h3 class="radar-title">五维健康度雷达</h3>
              <div class="radar-chart">
                <div v-for="dim in result.radar" :key="dim.key" class="radar-item">
                  <div class="radar-label">{{ dim.name }}</div>
                  <div class="radar-bar-wrapper">
                    <div class="radar-bar">
                      <div class="radar-fill" :style="{ width: dim.score + '%', background: dim.color }"></div>
                    </div>
                    <div class="benchmark-line" :style="{ left: dim.benchmark + '%' }" title="行业基准"></div>
                  </div>
                  <div class="radar-score">
                    <span :class="dim.scoreClass">{{ dim.score }}</span>
                    <span class="benchmark-text">基准 {{ dim.benchmark }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="result.kpis && Object.keys(result.kpis).length" class="kpis-section">
              <h3>行业目标 KPI</h3>
              <div class="kpis-grid">
                <div v-for="(val, key) in result.kpis" :key="key" class="kpi-card">
                  <span class="kpi-label">{{ key }}</span>
                  <span class="kpi-value">{{ val }}</span>
                </div>
              </div>
            </div>

            <div class="diagnosis-summary">
              <h3>诊断结论</h3>
              <p>{{ result.diagnosis }}</p>
            </div>

            <div class="diagnosis-basis">
              <h3>诊断依据</h3>
              <ul>
                <li v-for="(basis, i) in result.dataBasis" :key="i">{{ basis }}</li>
              </ul>
            </div>

            <div v-if="result.dimensionDetails.length" class="dimension-details">
              <h3>评分说明</h3>
              <div v-for="item in result.dimensionDetails" :key="item.key" class="dimension-card" :class="{ weakest: item.key === result.weakestDimension }">
                <div class="dimension-card-head">
                  <strong>{{ item.name }}</strong>
                  <span>{{ item.score }}分 / 基准 {{ item.benchmark }}</span>
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

            <div class="upgrade-hint">
              <p>获取《15 天针对性私域提升方案》需成为进阶会员，或预约专家 1v1 深度诊断</p>
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
              <div class="upgrade-actions">
                <button class="btn-primary" @click="$router.push('/private/retention-plan')">生成复购留存方案</button>
                <button class="btn-secondary" @click="bookConsult">预约专家诊断</button>
              </div>
            </div>
          </div>
        </div>

        <div class="wizard-nav" v-if="currentStep < 3">
          <button v-if="currentStep > 0" class="nav-btn prev" @click="currentStep--">上一步</button>
          <button v-if="currentStep < 2" class="nav-btn next" @click="currentStep++" :disabled="!canProceed">下一步</button>
          <button v-if="currentStep === 2" class="nav-btn generate" @click="generate" :disabled="!canProceed">生成体检报告</button>
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
  { label: '痛点勾选' },
  { label: '基础数据' },
  { label: '体检报告' }
]

const form = reactive({
  industry: '',
  mode: '',
  trafficPains: [],
  operationPains: [],
  conversionPains: [],
  retentionPains: [],
  fissionPains: [],
  wechatFriends: null,
  communityCount: null,
  monthlyRevenue: null,
  monthlyNewFriends: null
})

const trafficPains = ['公域流量无法沉淀到私域', '加粉率低于 5%', '企微好友增长缓慢', '社群入群率低']
const operationPains = ['社群活跃度低', '朋友圈打开率不足', '消息回复不及时', '缺乏内容规划', '客户标签缺失']
const conversionPains = ['私聊转化率低', '首单转化周期长', '客单价上不去', '缺乏转化钩子', '信任建立慢']
const retentionPains = ['复购率低', '老客沉睡多', '会员体系未建立', '储值推广难', '客户流失严重']
const fissionPains = ['转介绍率低', '裂变活动参与少', '缺乏激励机制', 'K 值小于 0.3']

const canProceed = computed(() => {
  if (currentStep.value === 0) return form.industry && form.mode
  if (currentStep.value === 1) return true
  if (currentStep.value === 2) return true
  return false
})

const dimensionLabelMap = {
  traffic: '引流力',
  operation: '运营力',
  conversion: '转化力',
  retention: '留存力',
  fission: '裂变力'
}

const weakestDimensionLabel = computed(() => {
  if (!result.value?.weakestDimension) return '待识别'
  return dimensionLabelMap[result.value.weakestDimension] || result.value.weakestDimension
})

const recommendedActions = computed(() => {
  return getRecommendedDiagnosisActions('private', {
    recommendedNext: result.value?.recommendedNext,
    weakestDimension: result.value?.weakestDimension
  })
})

const generate = async () => {
  loading.value = true
  result.value = null
  errorMessage.value = ''
  try {
    const data = await request.post('/private/diagnosis', {
      industry: form.industry,
      mode: form.mode,
      painPoints: {
        traffic: form.trafficPains,
        operation: form.operationPains,
        conversion: form.conversionPains,
        retention: form.retentionPains,
        fission: form.fissionPains
      },
      currentData: {
        wechatFriends: form.wechatFriends,
        communityCount: form.communityCount,
        monthlyRevenue: form.monthlyRevenue,
        monthlyNewFriends: form.monthlyNewFriends
      }
    })
    if (data.status === 'success') {
      const r = data.result
      r.radar = r.radar.map(d => ({
        ...d,
        color: getDimColor(d.key),
        scoreClass: d.score < 40 ? 'low' : d.score < 70 ? 'mid' : 'high'
      }))
      r.dataBasis = r.dataBasis || ['当前数据较少，本报告按已填痛点和基础数据做初筛判断。']
      r.confidence = r.confidence || '低'
      r.diagnosticProfile = r.diagnosticProfile || '私域综合诊断'
      r.weakestDimension = r.weakestDimension || r.radar[0]?.key || ''
      r.dimensionDetails = r.dimensionDetails || []
      r.recommendedNext = r.recommendedNext || []
      r.nextQuestions = r.nextQuestions || []
      r.riskBoundary = r.riskBoundary || []
      result.value = r
    }
    currentStep.value = 3
  } catch (error) {
    console.error('诊断失败:', error)
    errorMessage.value = error.message || '私域体检生成失败，请稍后重试'
    currentStep.value = 3
  } finally {
    loading.value = false
  }
}

const getDimColor = (key) => {
  const colors = { traffic: '#3b82f6', operation: '#8b5cf6', conversion: '#f59e0b', retention: '#10b981', fission: '#ef4444' }
  return colors[key] || '#6366f1'
}

const bookConsult = () => {
  router.push('/consultation')
}

const goRecommendedAction = (action) => {
  router.push({
    path: action.path,
    query: {
      industry: form.industry,
      mode: form.mode,
      source: 'private-diagnosis',
      weakness: result.value?.weakestDimension || '',
      profile: result.value?.diagnosticProfile || '',
      confidence: result.value?.confidence || ''
    }
  })
}
</script>

<style scoped>
@import '../douyin/agent-common.css';

.pain-points {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.pain-category h3 {
  font-size: var(--text-body-md);
  margin-bottom: 8px;
}

.pain-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
  font-size: var(--text-body-sm);
}

.pain-item input {
  width: 16px;
  height: 16px;
}

.result-header {
  text-align: center;
  padding: 24px;
  background: linear-gradient(135deg, #f0f9ff, #e0e7ff);
  border-radius: 12px;
  margin-bottom: 24px;
}

.error-state {
  padding: 12px 16px;
  border: 1px solid rgba(220, 38, 38, 0.18);
  background: var(--state-danger-bg);
  color: var(--state-danger);
  border-radius: var(--radius-panel);
  font-size: var(--text-body-sm);
}

.industry-badge {
  display: inline-block;
  padding: 4px 16px;
  background: #3b82f6;
  color: white;
  border-radius: 20px;
  font-size: var(--text-body-sm);
  margin-bottom: 8px;
}

.avg-score {
  font-size: 48px;
  font-weight: var(--font-weight-bold);
  color: var(--text-main);
}

.score-label {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.diagnosis-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.overview-item,
.diagnosis-basis,
.dimension-card {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.overview-item {
  padding: 14px;
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

.radar-container {
  margin-bottom: 24px;
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

.radar-bar-wrapper {
  flex: 1;
  position: relative;
  height: 12px;
}

.radar-bar {
  height: 100%;
  background: var(--bg-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.radar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s;
}

.benchmark-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #dc2626;
  opacity: 0.6;
}

.radar-score {
  width: 100px;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-weight: var(--font-weight-bold);
}

.benchmark-text {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-normal);
  color: var(--text-muted);
}

.radar-score.low { color: #dc2626; }
.radar-score.mid { color: #d97706; }
.radar-score.high { color: #059669; }

.kpis-section {
  margin-bottom: 24px;
}

.kpis-section h3 {
  font-size: var(--text-h4);
  margin-bottom: 12px;
}

.kpis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 12px;
  background: var(--bg-subtle);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-label {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.kpi-value {
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.diagnosis-summary {
  padding: var(--card-padding-md);
  border: 1px solid rgba(37, 99, 235, 0.16);
  background: var(--state-info-bg);
  border-radius: var(--radius-panel);
  margin-bottom: 16px;
}

.diagnosis-summary h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 8px;
}

.diagnosis-summary p {
  color: var(--text-secondary);
}

.diagnosis-basis {
  padding: 16px;
  margin-bottom: 20px;
}

.follow-up-questions,
.risk-boundary {
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid rgba(217, 119, 6, 0.18);
  border-radius: var(--radius-panel);
  background: var(--state-warning-bg);
}

.diagnosis-basis h3,
.follow-up-questions h3,
.risk-boundary h3,
.dimension-details h3 {
  margin-bottom: 10px;
  font-size: var(--text-body-lg);
}

.diagnosis-basis ul,
.follow-up-questions ul,
.risk-boundary ul {
  margin: 0;
  padding-left: 20px;
}

.diagnosis-basis li,
.follow-up-questions li,
.risk-boundary li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.risk-boundary li {
  color: #9a3412;
}

.dimension-details {
  margin-bottom: 24px;
}

.dimension-card {
  padding: 12px 14px;
  margin-bottom: 10px;
}

.dimension-card.weakest {
  border-color: #fca5a5;
  background: #fef2f2;
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
  line-height: 1.5;
}

.suggestions {
  margin-bottom: 24px;
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

.upgrade-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 12px;
}

.next-action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 14px;
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
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease-out);
}

.next-action-card:hover {
  border-color: rgba(30, 58, 138, 0.24);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.next-action-card span {
  width: fit-content;
  padding: 3px 8px;
  border-radius: var(--radius-pill);
  background: #eef2ff;
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.next-action-card em {
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  font-style: normal;
  line-height: 1.5;
}

.btn-primary {
  min-height: var(--button-height-md);
  padding: 0 var(--space-5);
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.btn-secondary {
  min-height: var(--button-height-md);
  padding: 0 var(--space-5);
  background: white;
  color: var(--brand-primary);
  border: 1px solid var(--brand-primary);
  border-radius: var(--radius-btn);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
}

.nav-btn.prev {
  border: 1px solid var(--line-default);
  background: var(--bg-card);
  color: var(--text-secondary);
}

.nav-btn.next,
.nav-btn.generate {
  background: var(--brand-primary);
  color: #fff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 768px) {
  .diagnosis-overview,
  .form-grid,
  .next-action-grid {
    grid-template-columns: 1fr;
  }

  .radar-item {
    align-items: flex-start;
  }
}
</style>
