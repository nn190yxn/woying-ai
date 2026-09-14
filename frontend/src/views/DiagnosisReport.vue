<template>
  <div class="report-page">
    <div class="container">
      <div class="report-header">
        <h1>{{ reportTitle }}</h1>
        <p v-if="aiUsed" class="ai-badge">根据你填写的信息整理，关键判断需要顾问确认</p>
        <p v-else>需要顾问确认</p>
      </div>

      <template v-if="isUnifiedResult">
        <div class="report-content">
          <!-- 判断依据 -->
          <section v-if="result.stage0" class="report-section card">
            <h2>判断依据</h2>
            <div class="profile-grid">
              <div class="profile-item">
                <span class="profile-label">城市</span>
                <span class="profile-value">{{ result.stage0.city?.name || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">城市线级</span>
                <span class="profile-value tier-tag" :class="result.stage0.city?.tier">
                  {{ result.stage0.city?.tierLabel || result.stage0.city?.tier || '-' }}
                </span>
              </div>
              <div class="profile-item">
                <span class="profile-label">行业</span>
                <span class="profile-value">{{ result.stage0.industry || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">团队规模</span>
                <span class="profile-value">{{ result.stage0.teamSize || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">客单价</span>
                <span class="profile-value">{{ result.stage0.priceRange || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">决策周期</span>
                <span class="profile-value">{{ result.stage0.decisionCycle || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">线上化</span>
                <span class="profile-value">{{ result.stage0.onlineLevel || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">竞争格局</span>
                <span class="profile-value">{{ result.stage0.competition || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">复购属性</span>
                <span class="profile-value">{{ result.stage0.repurchase || '-' }}</span>
              </div>
              <div class="profile-item">
                <span class="profile-label">业务范围</span>
                <span class="profile-value">{{ result.stage0.region || '-' }}</span>
              </div>
              <div class="profile-item full-width">
                <span class="profile-label">核心痛点</span>
                <span class="profile-value pain-point">{{ result.stage0.painPoint || '-' }}</span>
              </div>
            </div>

            <!-- 市场环境预判 -->
            <div v-if="result.stage0.marketEnv" class="market-preview">
              <h3>市场环境预判</h3>
              <div class="preview-list">
                <div v-for="(val, key) in result.stage0.marketEnv.features" :key="key" class="preview-item">
                  <span class="preview-key">{{ formatKey(key) }}</span>
                  <span class="preview-val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- 诊断侧重点 -->
            <div v-if="result.stage0.marketEnv?.strategies" class="focus-areas">
              <h3>诊断侧重点</h3>
              <div class="focus-grid">
                <div class="focus-card">
                  <span class="focus-label">获客策略</span>
                  <span>{{ result.stage0.marketEnv.strategies.acquisition }}</span>
                </div>
                <div class="focus-card">
                  <span class="focus-label">定价策略</span>
                  <span>{{ result.stage0.marketEnv.strategies.pricing }}</span>
                </div>
                <div class="focus-card">
                  <span class="focus-label">竞争策略</span>
                  <span>{{ result.stage0.marketEnv.strategies.competition }}</span>
                </div>
                <div class="focus-card">
                  <span class="focus-label">组织建议</span>
                  <span>{{ result.stage0.marketEnv.strategies.organization }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 可能原因 -->
          <section v-if="result.founder" class="report-section card">
            <h2>可能原因</h2>
            <div class="founder-stage">
              <div class="stage-info">
                <span class="stage-label">当前经营状态</span>
                <span class="stage-value">{{ result.founder.stage?.name || '需要顾问确认' }}</span>
              </div>
              <div class="stage-info">
                <span class="stage-label">校长当前主要精力</span>
                <span class="stage-value current">{{ result.founder.stage?.role }}</span>
              </div>
              <div class="stage-arrow">↓</div>
              <div class="stage-info">
                <span class="stage-label">下一步应调整为</span>
                <span class="stage-value target">{{ result.founder.stage?.targetRole }}</span>
              </div>
            </div>

            <!-- 校长经营能力 -->
            <h3 v-if="result.founder.scores">校长经营能力参考</h3>
            <div v-if="result.founder.scores" class="radar-grid">
              <div v-for="(val, key) in result.founder.scores" :key="key" class="radar-item">
                <span class="radar-name">{{ val.name || key }}</span>
                <span class="radar-score" :class="getScoreClass(val.score, 5)">{{ val.score }}/5</span>
                <div class="radar-bar">
                  <div class="radar-fill" :style="{ width: `${(val.score / 5) * 100}%` }" :class="getScoreClass(val.score, 5)"></div>
                </div>
              </div>
            </div>

            <div v-if="result.founder.average != null" class="founder-summary">
              <span>经营能力参考分：</span>
              <span class="avg-score" :class="getScoreClass(result.founder.average, 5)">{{ result.founder.average }}/5</span>
            </div>
          </section>

          <!-- 主要问题 -->
          <section v-if="result.rent" class="report-section card">
            <h2>主要问题</h2>
            <div class="rent-chart">
              <div class="rent-bar-wrap">
                <div class="rent-bar">
                  <div class="rent-labor" :style="{ width: `${result.rent.laborPercent}%` }">
                    <span v-if="result.rent.laborPercent > 15">依赖校长 {{ result.rent.laborPercent }}%</span>
                  </div>
                  <div class="rent-rent" :style="{ width: `${result.rent.rentPercent}%` }">
                    <span v-if="result.rent.rentPercent > 15">团队可执行 {{ result.rent.rentPercent }}%</span>
                  </div>
                </div>
              </div>
              <div class="rent-legend">
                <span class="legend-labor">■ 目前依赖校长亲自推进</span>
                <span class="legend-rent">■ 课程顾问和教练可按安排执行</span>
              </div>
            </div>
            <div class="rent-warning" v-if="result.rent.laborPercent > 60">
              <span class="warning-icon">风险</span>
              <span>招生和交付较依赖校长个人，建议先明确课程顾问、教练的负责人和完成标准</span>
            </div>
          </section>

          <!-- 四、快速扫描结果 -->
          <section v-if="result.scan" class="report-section card">
            <h2>观察指标</h2>
            <div class="scan-list">
              <div v-for="(val, key) in result.scan.scores" :key="key" class="scan-item">
                <span class="scan-name">{{ val.label || key }}</span>
                <span class="scan-loop-type" :class="val.loopType === '增强回路' ? 'loop-enhancing' : 'loop-regulating'">
                  {{ formatLoopType(val.loopType) }}
                </span>
                <span class="scan-score" :class="getScoreClass(val.score, 5)">{{ val.score }}/5</span>
                <div class="scan-bar">
                  <div class="scan-fill" :style="{ width: `${(val.score / 5) * 100}%` }" :class="getScoreClass(val.score, 5)"></div>
                </div>
              </div>
            </div>

            <!-- 回路分析 -->
            <div v-if="result.scan.loops" class="loop-analysis">
              <div class="loop-block">
                <h3>当前较弱的招生环节</h3>
                <div class="loop-item weakest">
                  <span class="loop-label">{{ result.scan.loops.flywheel?.weakest?.label }}</span>
                  <span class="loop-score">{{ result.scan.loops.flywheel?.weakest?.score }}/5</span>
                </div>
                <p class="loop-desc">连续记录七天，确认这一环是否持续影响咨询、到店或报名</p>
              </div>
              <div class="loop-block">
                <h3>限制执行的主要问题</h3>
                <div class="loop-item weakest">
                  <span class="loop-label">{{ result.scan.loops.ceiling?.weakest?.label }}</span>
                  <span class="loop-score">{{ result.scan.loops.ceiling?.weakest?.score }}/5</span>
                </div>
                <p class="loop-desc">如果七天后仍没有改善，联系顾问复核原因</p>
              </div>
            </div>
          </section>

          <!-- 暂时不要做（如触发） -->
          <section v-if="result.ip" class="report-section card">
            <h2>暂时不要做：盲目安排校长出镜</h2>
            <div class="ip-summary">
              <div class="ip-score">
                <span class="ip-label">校长出镜适合程度</span>
                <span class="ip-value">{{ result.ip.totalScore }}/25</span>
              </div>
              <div class="ip-judgment">
                <span>判定：</span>
                <span :class="getIPClass(result.ip.totalScore)">
                  {{ result.ip.judgment || '' }}
                </span>
              </div>
            </div>
            <div v-if="result.ip.recommendedForm" class="ip-recommendation">
              <h3>可参考的出镜方式</h3>
              <div class="ip-form-card">
                <span class="ip-form-name">{{ result.ip.recommendedForm.form }}</span>
                <p class="ip-form-desc">平台：{{ result.ip.recommendedForm.platforms }}</p>
                <p class="ip-form-desc">频率：{{ result.ip.recommendedForm.frequency }}</p>
                <p class="ip-form-desc">优势：{{ result.ip.recommendedForm.pros }}</p>
              </div>
            </div>
          </section>

          <!-- 六、AI 诊断详情 -->
          <section v-if="result.industryProfile || result.loopAnalysis || result.growthLevers" class="report-section card">
            <h2>补充判断说明</h2>

            <!-- 需要复核的经营关系 -->
            <div v-if="result.loopAnalysis" class="loop-diagram">
              <h3>需要复核的经营关系</h3>
              <div class="diagram-box">
                <pre class="diagram-text">{{ formatLoopDiagram(result.loopAnalysis) }}</pre>
              </div>
            </div>

            <!-- 增长杠杆 -->
            <div v-if="result.growthLevers && result.growthLevers.length" class="growth-levers">
              <h3>执行中需要留意</h3>
              <div v-for="(lever, i) in result.growthLevers" :key="i" class="lever-item" :class="`priority-${lever.priority || 'medium'}`">
                <h4>{{ lever.title || lever.phase || `第${i + 1}步` }}</h4>
                <p>{{ lever.description || lever.action || '' }}</p>
                <div v-if="lever.lagWarning || lever.timeRange" class="lag-warning">
                  <span class="lag-icon">提示</span>
                  <span>观察提醒：请在 {{ lever.lagWarning?.timeRange || lever.timeRange }} 后结合真实咨询、到店和报名记录再判断。</span>
                </div>
              </div>
            </div>

            <!-- 问题清单 -->
            <div v-if="result.riskNotes && result.riskNotes.length" class="risk-list">
              <h3>问题清单</h3>
              <div v-for="(note, i) in result.riskNotes" :key="i" class="risk-item" :class="getRiskClass(note)">
                {{ formatRiskNote(note) }}
              </div>
            </div>
          </section>

          <!-- 七、推荐下一步 -->
          <section class="report-section card">
            <h2>本周先做</h2>
            <p v-if="!result.nextSteps?.length">现有数据不足，优先动作需要顾问确认。</p>
            <div v-for="(step, i) in result.nextSteps.slice(0, 2)" :key="i" class="next-step" :class="`priority-${step.priority || 'medium'}`">
              <span class="step-priority">{{ getPriorityLabel(step.priority) }}</span>
              <h4>{{ step.title }}</h4>
                <p>{{ step.description }}</p>
                <div v-if="step.lagWarning" class="lag-warning">
                  <span class="lag-icon">提示</span>
                  <span>观察提醒：请在 {{ step.lagWarning.timeRange }} 后结合真实经营记录再判断，{{ step.lagWarning.desc }}</span>
                </div>
              </div>
          </section>

          <!-- 八、推荐工具 -->
          <section v-if="result.recommendedTools && result.recommendedTools.length" class="report-section card">
            <h2>本周可用的辅助工具</h2>
            <div class="tool-chips">
              <router-link
                v-for="toolCode in result.recommendedTools"
                :key="toolCode"
                :to="`/tools/${toolCode}`"
                class="tool-chip"
              >
                {{ getToolDisplayName(toolCode) }}
              </router-link>
            </div>
          </section>
        </div>
      </template>

      <template v-if="isUnifiedResult">
        <div class="report-content">
          <section class="report-section card">
            <h2>暂时不要做</h2>
            <p>不要同时铺开多个新渠道，也不要在没有连续七天记录前频繁更换主推课程、价格或招生话术。</p>
          </section>
          <section class="report-section card">
            <h2>停止或求助条件</h2>
            <p>连续七天执行后咨询、到店或报名没有改善，家长负面反馈增加，或数据相互矛盾时，先停止加量并联系顾问复核。</p>
          </section>
        </div>
      </template>

      <div class="report-actions">
        <button class="btn btn-secondary" @click="handleShare">
          分享本周建议
        </button>
        <router-link to="/diagnosis/history" class="btn btn-secondary">
          查看以前的记录
        </router-link>
        <router-link to="/diagnosis" class="btn btn-primary">
          返回经营体检
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getToolByCode } from '@/constants/toolCatalog'

const router = useRouter()

const result = ref({})
const isUnifiedResult = ref(false)
const reportTitle = ref('本周招生经营建议')
const aiUsed = ref(false)

function getScoreClass(score, maxScore) {
  const pct = maxScore ? score / maxScore : 0
  if (pct >= 0.7) return 'score-high'
  if (pct >= 0.5) return 'score-mid'
  return 'score-low'
}

function getPriorityLabel(priority) {
  return { high: '紧急', medium: '重要', low: '长期' }[priority] || '建议'
}

function getRiskClass(note) {
  const level = typeof note === 'object' && note
    ? String(note.level || note.severity || note.priority || note.type || '').toLowerCase()
    : ''
  const text = formatRiskNote(note)

  if (['urgent', 'high', 'critical', 'danger'].includes(level) || text.includes('紧急')) return 'risk-urgent'
  if (['important', 'medium', 'warning'].includes(level) || text.includes('重要')) return 'risk-important'
  return 'risk-normal'
}

function formatRiskNote(note) {
  const text = typeof note === 'string' ? note : (note?.text || note?.title || String(note || ''))
  return text.replace(/^[\s\u{1F534}\u{1F7E1}\u{1F7E2}]+/u, '')
}

function getIPClass(score) {
  if (score >= 20) return 'ip-mature'
  if (score >= 15) return 'ip-training'
  return 'ip-beginner'
}

function formatKey(key) {
  const map = {
    socialNetwork: '社会网络', consumption: '消费特征', acquisitionCost: '获客成本',
    talentMarket: '人才市场', innovation: '创新速度', regulation: '政策监管',
    talent: '人才供应', infrastructure: '基础设施', competition: '竞争态势',
    policy: '政策环境', management: '管理规范性', organization: '组织特征',
    priceSensitivity: '价格敏感度', online: '线上渗透', founder: '创始人特征',
    digital: '数字化程度', expansion: '扩张限制', profit: '利润空间'
  }
  return map[key] || key
}

function formatLoopType(loopType) {
  return loopType === '增强回路' ? '影响招生增长' : loopType === '调节回路' ? '限制团队执行' : '需要顾问确认'
}

function formatLoopDiagram(loopAnalysis) {
  if (typeof loopAnalysis === 'string') return '这部分经营关系需要顾问结合七天记录确认'
  if (loopAnalysis.flywheel && loopAnalysis.ceiling) {
    return `较弱的招生环节：
${loopAnalysis.flywheel.weakest?.label || '未知'}（${loopAnalysis.flywheel.weakest?.score}分）←—— 当前需要先观察

限制执行的环节：
${loopAnalysis.ceiling.weakest?.label || '未知'}（${loopAnalysis.ceiling.weakest?.score}分）←—— 七天后决定继续或求助`
  }
  return '现有数据不足，需要顾问确认'
}

function getToolDisplayName(toolCode) {
  return getToolByCode(toolCode)?.name || toolCode
}

async function handleShare() {
  const shareData = {
    title: reportTitle.value,
    text: '本周招生经营建议',
    url: window.location.href
  }

  if (navigator.share) {
    await navigator.share(shareData)
    return
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareData.url)
    window.alert('报告链接已复制')
  }
}

onMounted(() => {
  const state = history.state
  if (state?.result) {
    result.value = state.result
    isUnifiedResult.value = true
    reportTitle.value = state.title || '本周招生经营建议'
    aiUsed.value = state.aiUsed || false
    return
  }

  router.replace({ name: 'Diagnosis' })
})
</script>

<style scoped>
.report-page {
  padding: var(--space-6) 0 var(--space-9);
}

.report-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.report-header h1 {
  font-size: var(--text-h2);
  margin-bottom: var(--space-2);
}

.ai-badge {
  display: inline-block;
  font-size: var(--text-caption);
  padding: 2px 10px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1));
  color: var(--brand-primary);
}

.report-header p {
  color: var(--text-secondary);
}

.report-content {
  max-width: 800px;
  margin: 0 auto;
}

.report-section {
  padding: var(--space-5);
  margin-bottom: var(--space-5);
}

.report-section h2 {
  font-size: var(--text-h4);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--line-default);
}

.report-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-6);
  flex-wrap: wrap;
}

/* 行业画像 */
.profile-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.profile-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
}

.profile-item.full-width {
  grid-column: span 2;
}

.profile-label {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.profile-value {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
}

.pain-point {
  color: var(--state-danger);
  font-weight: var(--font-weight-semibold);
}

.tier-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: var(--text-caption);
}

.tier-tag.tier1 { background: #fee2e2; color: #dc2626; }
.tier-tag.newTier1 { background: #fef3c7; color: #d97706; }
.tier-tag.tier2 { background: #dbeafe; color: #2563eb; }
.tier-tag.tier3 { background: #dcfce7; color: #16a34a; }
.tier-tag.tier4 { background: #f3f4f6; color: #4b5563; }
.tier-tag.tier5 { background: #f9fafb; color: #6b7280; }

/* 市场环境预判 */
.market-preview, .focus-areas {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line-default);
}

.market-preview h3, .focus-areas h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-3);
}

.preview-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.preview-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  font-size: var(--text-body-sm);
}

.preview-key {
  color: var(--text-secondary);
}

.preview-val {
  font-weight: var(--font-weight-medium);
}

.focus-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.focus-card {
  padding: var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  text-align: center;
}

.focus-label {
  display: block;
  font-size: var(--text-caption);
  color: var(--text-muted);
  margin-bottom: 4px;
}

/* 创始人能力 */
.founder-stage {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stage-label {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.stage-value {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
}

.stage-value.current {
  color: var(--state-warning);
}

.stage-value.target {
  color: var(--state-success);
}

.stage-arrow {
  font-size: 20px;
  color: var(--brand-primary);
}

.radar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-3);
}

.radar-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
}

.radar-name {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.radar-score {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
}

.radar-bar {
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.radar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--duration-normal) var(--ease-out);
}

.founder-summary {
  margin-top: var(--space-4);
  text-align: center;
  font-size: var(--text-body-md);
}

.avg-score {
  font-weight: var(--font-weight-semibold);
  font-size: var(--text-body-lg);
}

/* 企业租评估 */
.rent-chart {
  margin-bottom: var(--space-3);
}

.rent-bar-wrap {
  margin-bottom: var(--space-2);
}

.rent-bar {
  display: flex;
  height: 32px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.rent-labor {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--state-danger);
  color: white;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  transition: width var(--duration-normal) var(--ease-out);
}

.rent-rent {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--state-success);
  color: white;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  transition: width var(--duration-normal) var(--ease-out);
}

.rent-legend {
  display: flex;
  justify-content: center;
  gap: var(--space-6);
  font-size: var(--text-caption);
}

.legend-labor { color: var(--state-danger); }
.legend-rent { color: var(--state-success); }

.rent-warning {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: rgba(239, 68, 68, 0.08);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  color: var(--state-danger);
}

.warning-icon {
  font-size: 18px;
}

/* 快速扫描 */
.scan-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.scan-item {
  display: grid;
  grid-template-columns: 80px 60px 50px 1fr;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
}

.scan-name {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
}

.scan-loop-type {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  text-align: center;
}

.loop-enhancing { background: rgba(34, 197, 94, 0.1); color: #16a34a; }
.loop-regulating { background: rgba(245, 158, 11, 0.1); color: #d97706; }

.scan-score {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  text-align: right;
}

.scan-bar {
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.scan-fill {
  height: 100%;
  border-radius: 3px;
  transition: width var(--duration-normal) var(--ease-out);
}

/* 回路分析 */
.loop-analysis {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line-default);
}

.loop-block h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-2);
}

.loop-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
}

.loop-item.weakest {
  border-left: 3px solid var(--state-danger);
}

.loop-label {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
}

.loop-score {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--state-danger);
}

.loop-desc {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

/* 创始人IP */
.ip-summary {
  display: flex;
  gap: var(--space-6);
  margin-bottom: var(--space-4);
}

.ip-score, .ip-judgment {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ip-label, .ip-judgment span:first-child {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.ip-value {
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
}

.ip-mature { color: var(--state-success); }
.ip-training { color: var(--state-warning); }
.ip-beginner { color: var(--state-danger); }

.ip-recommendation h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-2);
}

.ip-form-card {
  padding: var(--space-4);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
}

.ip-form-name {
  display: block;
  font-size: var(--text-body-md);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.ip-form-desc {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: 4px;
}

/* AI 深度分析 */
.loop-diagram {
  margin-bottom: var(--space-4);
}

.loop-diagram h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-2);
}

.diagram-box {
  padding: var(--space-4);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  overflow-x: auto;
}

.diagram-text {
  font-family: monospace;
  font-size: var(--text-body-sm);
  white-space: pre-wrap;
  margin: 0;
}

.growth-levers {
  margin-top: var(--space-4);
}

.growth-levers h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-3);
}

.lever-item {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid;
  margin-bottom: var(--space-3);
}

.priority-high { background: rgba(239, 68, 68, 0.08); border-color: var(--state-danger); }
.priority-medium { background: rgba(59, 130, 246, 0.08); border-color: var(--brand-primary); }
.priority-low { background: rgba(34, 197, 94, 0.08); border-color: var(--state-success); }

.lever-item h4 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-1);
}

.lever-item p {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.lag-warning {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: var(--space-2) var(--space-3);
  background: rgba(245, 158, 11, 0.08);
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
  color: #92400e;
}

.lag-icon {
  flex-shrink: 0;
}

.risk-list h3 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-3);
}

.risk-item {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-2);
  font-size: var(--text-body-sm);
  border-left: 4px solid;
}

.risk-urgent { background: rgba(239, 68, 68, 0.08); border-color: var(--state-danger); }
.risk-important { background: rgba(245, 158, 11, 0.08); border-color: var(--state-warning); }
.risk-normal { background: var(--bg-subtle); border-color: var(--text-muted); }

/* 推荐下一步 */
.next-step {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid;
  margin-bottom: var(--space-3);
}

.next-step h4 {
  font-size: var(--text-body-md);
  margin-bottom: var(--space-1);
}

.next-step p {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.step-priority {
  font-size: var(--text-caption);
  padding: 1px 6px;
  border-radius: 8px;
  color: white;
}

.priority-high .step-priority { background: var(--state-danger); }
.priority-medium .step-priority { background: var(--brand-primary); }
.priority-low .step-priority { background: var(--state-success); }

/* 工具推荐 */
.tool-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tool-chip {
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  font-size: var(--text-body-sm);
  color: var(--brand-primary);
  transition: all var(--duration-fast) var(--ease-out);
}

.tool-chip:hover {
  background: var(--brand-primary);
  color: white;
}

/* 评分颜色 */
.score-high { color: var(--state-success); }
.score-mid { color: var(--state-warning); }
.score-low { color: var(--state-danger); }

@media (max-width: 640px) {
  .profile-grid, .preview-list, .focus-grid, .radar-grid, .loop-analysis {
    grid-template-columns: 1fr;
  }

  .profile-item.full-width {
    grid-column: span 1;
  }

  .scan-item {
    grid-template-columns: 60px 50px 40px 1fr;
  }

  .report-actions {
    flex-direction: column;
  }

  .founder-stage {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-arrow {
    transform: rotate(90deg);
  }

  .ip-summary {
    flex-direction: column;
    gap: var(--space-3);
  }
}
</style>
