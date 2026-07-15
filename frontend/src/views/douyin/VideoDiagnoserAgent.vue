<template>
  <div class="agent-page">
    <div class="agent-header container-wide video-review-hero">
      <button class="back-btn" @click="$router.push('/douyin')">← 返回智能体矩阵</button>
      <h1 class="agent-title">视频数据复盘</h1>
      <p class="agent-desc">记录执行、内容、互动、咨询、成交和投流 ROI，判断下一步动作</p>
      <div class="task-flow-nav" aria-label="抖音经营链路">
        <router-link to="/douyin" class="task-flow-link">智能体矩阵</router-link>
        <router-link to="/douyin/diagnosis" class="task-flow-link">经营体检</router-link>
        <router-link to="/douyin/quick-plan" class="task-flow-link">15 天计划</router-link>
        <span class="task-flow-link current">数据复盘</span>
      </div>
    </div>
    <div class="agent-content container-wide video-review-workbench">
      <div class="wizard-panel video-review-panel">
        <div class="panel-heading">
          <span class="next-step-label">复盘录入</span>
          <h2>记录执行数据并判断下一步</h2>
          <p>把播放、互动、咨询、成交和投流数据放到同一张复盘表里，快速识别内容、承接或投流问题。</p>
        </div>
        <div class="data-input-grid">
          <div class="data-input-card">
            <label class="data-label">执行天数</label>
            <input v-model.number="form.executionDays" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">内容产出</label>
            <input v-model.number="form.contentCount" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">播放量</label>
            <input v-model.number="form.views" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">点赞数</label>
            <input v-model.number="form.likes" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">完播数</label>
            <input v-model.number="form.completes" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">收藏数</label>
            <input v-model.number="form.saves" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">转发数</label>
            <input v-model.number="form.shares" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">评论数</label>
            <input v-model.number="form.comments" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">私信数</label>
            <input v-model.number="form.messages" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">咨询数</label>
            <input v-model.number="form.inquiries" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">核销数</label>
            <input v-model.number="form.redemptions" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">成交额</label>
            <input v-model.number="form.revenue" class="data-input" type="number" placeholder="0" />
          </div>
          <div class="data-input-card">
            <label class="data-label">投流消耗</label>
            <input v-model.number="form.adSpend" class="data-input" type="number" placeholder="0" />
          </div>
        </div>

        <div class="form-grid review-context-grid">
          <div class="form-group">
            <label class="form-label">视频时长</label>
            <select v-model="form.duration" class="form-input">
              <option value="short">15 秒以内</option>
              <option value="medium">15-30 秒</option>
              <option value="long">30-60 秒</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">流量来源</label>
            <select v-model="form.trafficSource" class="form-input">
              <option value="recommend">推荐流为主</option>
              <option value="search">搜索为主</option>
              <option value="profile">主页访问为主</option>
            </select>
          </div>
          <div class="form-group full-span">
            <label class="form-label">有效内容类型</label>
            <input v-model="form.effectiveContentTypes" class="form-input" placeholder="例如：门店实拍、顾客案例、老板口播" />
          </div>
        </div>

        <button class="generate-btn" @click="diagnose" :disabled="!form.views">
          开始诊断
        </button>
        <div class="review-actions">
          <button class="secondary-btn" type="button" :disabled="loadLoading" @click="loadLatestReview">
            {{ loadLoading ? '加载中' : '加载最近复盘' }}
          </button>
          <button class="secondary-btn primary-action" type="button" :disabled="saveLoading || !result" @click="saveReviewRecord">
            {{ saveLoading ? '保存中' : '保存当前复盘' }}
          </button>
        </div>
        <div v-if="errorMessage" class="error-state">{{ errorMessage }}</div>
        <div v-if="saveMessage" class="saved-state">{{ saveMessage }}</div>

        <div v-if="result" class="diagnosis-result">
          <div class="review-summary">
            <div v-for="item in result.summary" :key="item.name" class="summary-card">
              <span>{{ item.name }}</span>
              <strong>{{ item.value }}</strong>
              <em>{{ item.desc }}</em>
            </div>
          </div>

          <div class="review-result-layout">
            <div class="review-analysis-column">
              <div class="traffic-level">
                <h3>当前流量池等级</h3>
                <div class="level-badge" :class="result.levelClass">{{ result.levelText }}</div>
                <p class="level-desc">{{ result.levelDesc }}</p>
              </div>

              <div class="metrics-analysis">
                <h3>核心指标分析</h3>
                <div v-for="m in result.metrics" :key="m.name" class="metric-row">
                  <span class="metric-name">{{ m.name }}</span>
                  <div class="metric-bar">
                    <div class="metric-fill" :style="{ width: m.percent + '%', background: m.color }"></div>
                  </div>
                  <span class="metric-value" :class="m.status">{{ m.value }} (基准: {{ m.benchmark }})</span>
                </div>
              </div>
            </div>

            <div class="review-action-column">
              <div class="diagnosis-conclusion">
                <h3>诊断结论</h3>
                <p>{{ result.conclusion }}</p>
              </div>

              <div class="next-step-panel">
                <div>
                  <span class="next-step-label">下一步建议</span>
                  <h3>{{ result.nextStep.title }}</h3>
                  <p>{{ result.nextStep.reason }}</p>
                </div>
                <button class="next-step-btn" @click="openNextStep(result.nextStep)">{{ result.nextStep.cta }}</button>
              </div>
            </div>
          </div>

          <div v-if="reviewInsights" class="insights-panel">
            <div class="insights-header">
              <div>
                <span class="next-step-label">复盘沉淀</span>
                <h3>{{ reviewInsights.nextRoundSuggestion.title }}</h3>
                <p>{{ reviewInsights.nextRoundSuggestion.reason }}</p>
              </div>
              <button class="next-step-btn" type="button" @click="openNextRoundPlan">生成下一轮计划</button>
            </div>
            <div class="content-type-grid">
              <div v-for="item in reviewInsights.topContentTypes" :key="item.type" class="content-type-card">
                <span>{{ item.type }}</span>
                <strong>{{ item.count }} 次</strong>
                <em>均播 {{ item.avgViews.toLocaleString() }} · 完播 {{ item.completionRate }}%</em>
              </div>
            </div>
            <ol class="insight-actions">
              <li v-for="action in reviewInsights.nextRoundSuggestion.actions" :key="action">{{ action }}</li>
            </ol>
          </div>

          <div class="action-plan">
            <h3>优化行动清单</h3>
            <ol>
              <li v-for="(action, i) in result.actions" :key="i">{{ action }}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const result = ref(null)
const reviewInsights = ref(null)
const errorMessage = ref('')
const saveMessage = ref('')
const loadLoading = ref(false)
const saveLoading = ref(false)
const form = reactive({
  executionDays: 1,
  contentCount: 1,
  views: 0,
  likes: 0,
  completes: 0,
  saves: 0,
  shares: 0,
  comments: 0,
  messages: 0,
  inquiries: 0,
  redemptions: 0,
  revenue: 0,
  adSpend: 0,
  duration: 'medium',
  trafficSource: 'recommend',
  effectiveContentTypes: ''
})
const sourceContext = reactive({
  source: String(route.query.source || ''),
  industry: String(route.query.industry || ''),
  goal: String(route.query.goal || ''),
  industryCode: String(route.query.industryCode || route.query.industry || ''),
  goalCode: String(route.query.goalCode || route.query.goal || ''),
  planVersion: String(route.query.planVersion || ''),
  inputHash: String(route.query.inputHash || ''),
  generationMode: String(route.query.generationMode || ''),
  day: String(route.query.day || ''),
  phase: String(route.query.phase || ''),
  objective: String(route.query.objective || ''),
  topic: String(route.query.topic || ''),
  workType: String(route.query.workType || ''),
  videoFunction: String(route.query.videoFunction || ''),
  shootingMethod: String(route.query.shootingMethod || ''),
  adPlan: String(route.query.adPlan || ''),
  kpi: String(route.query.kpi || ''),
  scriptHook: String(route.query.scriptHook || ''),
  scriptCta: String(route.query.scriptCta || ''),
  weakness: String(route.query.weakness || ''),
  planContext: String(route.query.planContext || '')
})

const numberFromQuery = (key) => {
  const value = Number(route.query[key])
  return Number.isFinite(value) ? value : null
}

for (const key of ['views', 'completes', 'messages', 'inquiries', 'redemptions']) {
  const value = numberFromQuery(key)
  if (value !== null) form[key] = value
}
if (sourceContext.day) form.executionDays = Number(sourceContext.day) || form.executionDays

const percent = (part, total) => total > 0 ? (part / total * 100) : 0
const ratio = (part, total) => total > 0 ? (part / total) : 0

const buildNextStep = ({ completeRate, messageRate, inquiryRate, redemptionRate, roi, adSpend, avgViews }) => {
  if (completeRate < 25 || avgViews < 1000) {
    return {
      title: '先改内容钩子和选题',
      reason: '播放或完播没有过线时，继续做承接和投流放大会放大低效内容，先优化前 3 秒、标题和封面。',
      cta: '去优化标题',
      path: '/douyin/title-optimizer'
    }
  }
  if (messageRate < 0.5 || inquiryRate < 60 || redemptionRate < 30) {
    return {
      title: '优先修转化承接',
      reason: '内容已经产生互动后，私信、咨询或核销掉得太多，下一步要检查团购、私信和到店承接链路。',
      cta: '去查转化链路',
      path: '/douyin/conversion-path'
    }
  }
  if (adSpend > 0 && roi < 1.5) {
    return {
      title: '先复查投流效率',
      reason: '已经产生投流消耗，但 ROI 低于健康线，需要先评估素材、定向和预算分配。',
      cta: '去评估投流',
      path: '/douyin/ad-evaluator'
    }
  }
  return {
    title: '放大有效内容并进入下一轮计划',
    reason: '当前内容、承接和投流指标相对健康，可以把有效内容类型复制到下一轮 15 天作战表。',
    cta: '生成下一轮计划',
    path: '/douyin/quick-plan'
  }
}

const getEffectiveContentTypes = () => String(form.effectiveContentTypes || '')
  .split(/[，,、\n]/)
  .map((item) => item.trim())
  .filter(Boolean)

const buildReviewPayload = () => ({
  industry: sourceContext.industryCode || sourceContext.industry || null,
  goal: sourceContext.goalCode || sourceContext.goal || null,
  sourceContext: { ...sourceContext },
  inputData: {
    executionDays: Number(form.executionDays) || 0,
    contentCount: Number(form.contentCount) || 0,
    views: Number(form.views) || 0,
    likes: Number(form.likes) || 0,
    completes: Number(form.completes) || 0,
    saves: Number(form.saves) || 0,
    shares: Number(form.shares) || 0,
    comments: Number(form.comments) || 0,
    messages: Number(form.messages) || 0,
    inquiries: Number(form.inquiries) || 0,
    redemptions: Number(form.redemptions) || 0,
    revenue: Number(form.revenue) || 0,
    adSpend: Number(form.adSpend) || 0,
    duration: form.duration,
    trafficSource: form.trafficSource,
    effectiveContentTypes: getEffectiveContentTypes()
  },
  resultData: result.value,
  effectiveContentTypes: getEffectiveContentTypes(),
  nextActions: result.value?.actions || []
})

const applyReviewRecord = (record) => {
  if (!record) return
  Object.assign(sourceContext, record.sourceContext || {})
  Object.assign(form, record.inputData || {})
  form.effectiveContentTypes = (record.effectiveContentTypes || record.inputData?.effectiveContentTypes || []).join('、')
  result.value = record.resultData || null
}

const loadLatestReview = async () => {
  loadLoading.value = true
  errorMessage.value = ''
  try {
    const response = await request.get('/douyin/review-records/latest')
    if (response.reviewRecord) {
      applyReviewRecord(response.reviewRecord)
      saveMessage.value = `已加载最近复盘，时间：${new Date(response.reviewRecord.createdAt).toLocaleString()}`
      return
    }
    saveMessage.value = '暂无已保存复盘，诊断后会自动保存。'
  } catch (error) {
    errorMessage.value = error.message || '读取最近复盘失败'
  } finally {
    loadLoading.value = false
  }
}

const loadReviewInsights = async () => {
  try {
    const response = await request.get('/douyin/review-records/insights')
    reviewInsights.value = response.insights?.recordCount ? response.insights : null
  } catch (error) {
    reviewInsights.value = null
  }
}

const saveReviewRecord = async ({ silent = false } = {}) => {
  if (!result.value) return
  saveLoading.value = true
  if (!silent) errorMessage.value = ''
  try {
    const response = await request.post('/douyin/review-records', buildReviewPayload())
    if (response.reviewRecord) {
      saveMessage.value = `复盘已保存，时间：${new Date(response.reviewRecord.createdAt).toLocaleString()}`
      await loadReviewInsights()
    }
  } catch (error) {
    errorMessage.value = error.message || '保存复盘记录失败'
  } finally {
    saveLoading.value = false
  }
}

const diagnose = () => {
  errorMessage.value = ''
  saveMessage.value = ''
  const v = form.views
  const likeRate = v > 0 ? (form.likes / v * 100) : 0
  const completeRate = percent(form.completes, v)
  const saveRate = percent(form.saves, v)
  const shareRate = percent(form.shares, v)
  const commentRate = percent(form.comments, v)
  const messageRate = percent(form.messages, v)
  const inquiryRate = percent(form.inquiries, Math.max(form.messages, 1))
  const redemptionRate = percent(form.redemptions, Math.max(form.inquiries, 1))
  const roi = form.adSpend > 0 ? ratio(form.revenue, form.adSpend) : 0
  const avgViews = ratio(v, Math.max(form.contentCount, 1))

  let level, levelClass, levelDesc
  if (v < 500) { level = 'Level 1: 初始池'; levelClass = 'level-low'; levelDesc = '内容尚未触发推荐算法，需优化标签与封面' }
  else if (v < 5000) { level = 'Level 2: 同城池'; levelClass = 'level-mid'; levelDesc = '已进入同城推荐，但核心指标未达标，卡在流量池边界' }
  else if (v < 50000) { level = 'Level 3: 推荐池'; levelClass = 'level-high'; levelDesc = '表现良好，有机会冲击更大流量池' }
  else { level = 'Level 4: 热门池'; levelClass = 'level-hot'; levelDesc = '爆款内容，建议趁热打追投' }

  const issues = []
  if (saveRate < 2) issues.push('收藏率偏低（< 2%），7 天长效赛马权重不足')
  if (likeRate < 3) issues.push('点赞率偏低，内容缺乏情绪共鸣')
  if (completeRate < 25) issues.push('完播率偏低，前 3 秒钩子或内容节奏需优化')
  if (shareRate < 0.5) issues.push('转发率偏低，缺乏社交货币属性')
  if (form.messages > 0 && inquiryRate < 60) issues.push('私信到有效咨询转化偏低，承接话术需优化')
  if (form.inquiries > 0 && redemptionRate < 30) issues.push('咨询到核销转化偏低，团购权益和到店提醒需优化')
  if (form.adSpend > 0 && roi < 1.5) issues.push('投流 ROI 偏低，需要复查素材、定向和承接链路')

  result.value = {
    levelText: level,
    levelClass,
    levelDesc,
    metrics: [
      { name: '单条播放', value: Math.round(avgViews).toLocaleString(), percent: Math.min(avgViews / 50, 100), color: avgViews >= 1000 ? '#10b981' : '#ef4444', benchmark: '1000+', status: avgViews >= 1000 ? 'pass' : 'fail' },
      { name: '点赞率', value: likeRate.toFixed(1) + '%', percent: Math.min(likeRate * 10, 100), color: likeRate >= 3 ? '#10b981' : '#ef4444', benchmark: '3-5%', status: likeRate >= 3 ? 'pass' : 'fail' },
      { name: '完播率', value: completeRate.toFixed(1) + '%', percent: Math.min(completeRate * 2.5, 100), color: completeRate >= 25 ? '#10b981' : '#ef4444', benchmark: '25-40%', status: completeRate >= 25 ? 'pass' : 'fail' },
      { name: '评论率', value: commentRate.toFixed(1) + '%', percent: Math.min(commentRate * 25, 100), color: commentRate >= 1 ? '#10b981' : '#ef4444', benchmark: '1-3%', status: commentRate >= 1 ? 'pass' : 'fail' },
      { name: '私信率', value: messageRate.toFixed(1) + '%', percent: Math.min(messageRate * 50, 100), color: messageRate >= 0.5 ? '#10b981' : '#ef4444', benchmark: '0.5-1%', status: messageRate >= 0.5 ? 'pass' : 'fail' },
      { name: '咨询率', value: inquiryRate.toFixed(1) + '%', percent: Math.min(inquiryRate, 100), color: inquiryRate >= 60 ? '#10b981' : '#ef4444', benchmark: '60%+', status: inquiryRate >= 60 ? 'pass' : 'fail' },
      { name: '核销率', value: redemptionRate.toFixed(1) + '%', percent: Math.min(redemptionRate * 2, 100), color: redemptionRate >= 30 ? '#10b981' : '#ef4444', benchmark: '30%+', status: redemptionRate >= 30 ? 'pass' : 'fail' },
      { name: '投流 ROI', value: form.adSpend > 0 ? roi.toFixed(2) : '未投流', percent: form.adSpend > 0 ? Math.min(roi * 30, 100) : 0, color: roi >= 1.5 || form.adSpend === 0 ? '#10b981' : '#ef4444', benchmark: '1.5+', status: roi >= 1.5 || form.adSpend === 0 ? 'pass' : 'fail' },
      { name: '收藏率', value: saveRate.toFixed(1) + '%', percent: Math.min(saveRate * 12, 100), color: saveRate >= 5 ? '#10b981' : '#ef4444', benchmark: '5-8%', status: saveRate >= 5 ? 'pass' : 'fail' },
      { name: '转发率', value: shareRate.toFixed(1) + '%', percent: Math.min(shareRate * 50, 100), color: shareRate >= 1 ? '#10b981' : '#ef4444', benchmark: '1-2%', status: shareRate >= 1 ? 'pass' : 'fail' }
    ],
    summary: [
      { name: '执行天数', value: `${form.executionDays || 0} 天`, desc: `${form.contentCount || 0} 条内容产出` },
      { name: '播放与完播', value: `${v.toLocaleString()} / ${completeRate.toFixed(1)}%`, desc: '播放总量 / 完播率' },
      { name: '互动反馈', value: `${form.comments || 0} 评论`, desc: `${form.messages || 0} 私信` },
      { name: '成交结果', value: `${form.redemptions || 0} 核销`, desc: `${form.inquiries || 0} 咨询，成交额 ${Number(form.revenue || 0).toLocaleString()} 元` },
      { name: '投流 ROI', value: form.adSpend > 0 ? roi.toFixed(2) : '未投流', desc: `投流消耗 ${Number(form.adSpend || 0).toLocaleString()} 元` }
    ],
    nextStep: buildNextStep({ completeRate, messageRate, inquiryRate, redemptionRate, roi, adSpend: form.adSpend, avgViews }),
    conclusion: issues.length > 0 ? issues.join('；') + '。' : '各项指标均在健康范围内，建议保持内容质量稳定。',
    actions: [
      saveRate < 2 ? '在 15-25s 插入干货清单画面，引导截图收藏' : null,
      likeRate < 3 ? '增加情绪化表达，使用"你""我"等人称代词拉近距离' : null,
      completeRate < 25 ? '前 3 秒设置更强钩子，砍掉冗余铺垫' : null,
      shareRate < 0.5 ? '加入社交货币元素："转发给需要的人""@你的 XX 来看"' : null,
      inquiryRate < 60 && form.messages > 0 ? '把私信首句改成问题确认 + 到店利益点，减少无效闲聊' : null,
      redemptionRate < 30 && form.inquiries > 0 ? '在团购页面和私信里补充到店提醒、预约规则和限时权益' : null,
      roi < 1.5 && form.adSpend > 0 ? '暂停放量，先用高完播素材做小预算复测，再扩大本地推预算' : null
    ].filter(Boolean)
  }
  saveReviewRecord({ silent: true })
}

const openNextStep = (nextStep) => {
  router.push({
    path: nextStep.path,
    query: {
      source: 'video-review',
      industry: sourceContext.industry || undefined,
      goal: sourceContext.goal || undefined,
      views: form.views || undefined,
      completes: form.completes || undefined,
      messages: form.messages || undefined,
      inquiries: form.inquiries || undefined,
      redemptions: form.redemptions || undefined,
      roi: form.adSpend > 0 ? (form.revenue / form.adSpend).toFixed(2) : undefined,
      effectiveTypes: reviewInsights.value?.nextRoundSuggestion?.focusContentTypes?.join('、') || getEffectiveContentTypes().join('、') || undefined,
      reviewSuggestion: reviewInsights.value?.nextRoundSuggestion?.title || undefined
    }
  })
}

const openNextRoundPlan = () => {
  const suggestion = reviewInsights.value?.nextRoundSuggestion || {}
  router.push({
    path: '/douyin/quick-plan',
    query: {
      source: 'video-review',
      industry: sourceContext.industry || undefined,
      goal: suggestion.recommendedGoal || sourceContext.goal || 'conversion',
      weakness: suggestion.shortfall || undefined,
      metrics: reviewInsights.value ? `近 ${reviewInsights.value.recordCount} 次复盘，总播放 ${reviewInsights.value.metrics.totalViews}，完播率 ${reviewInsights.value.metrics.completionRate}%` : undefined,
      effectiveTypes: suggestion.focusContentTypes?.join('、') || getEffectiveContentTypes().join('、') || undefined,
      reviewSuggestion: suggestion.title || undefined
    }
  })
}

onMounted(() => {
  if (!sourceContext.source) loadLatestReview()
  loadReviewInsights()
})
</script>

<style scoped>
@import './agent-common.css';

.video-review-hero {
  padding-top: 32px;
}

.video-review-workbench {
  max-width: var(--workbench-max-width);
}

.video-review-panel {
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

.data-input-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.data-input-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
}

.data-label {
  font-size: var(--text-caption);
  color: var(--text-muted);
  font-weight: var(--font-weight-semibold);
}

.data-input {
  width: 100%;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--line-default);
  border-radius: var(--radius-btn);
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.review-context-grid {
  margin-top: 18px;
}

.review-context-grid .form-group {
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.full-span {
  grid-column: 1 / -1;
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

.generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.review-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 12px;
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

.error-state,
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

.saved-state {
  background: var(--state-success-bg);
  color: var(--state-success);
}

.diagnosis-result {
  margin-top: 24px;
}

.review-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.summary-card {
  display: grid;
  min-width: 0;
  gap: 6px;
  padding: 14px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: #fff;
}

.summary-card span {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.summary-card strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.summary-card em {
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-style: normal;
  line-height: 1.4;
}

.review-result-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 16px;
  align-items: start;
}

.review-analysis-column,
.review-action-column {
  display: grid;
  min-width: 0;
  gap: 14px;
}

.traffic-level,
.metrics-analysis,
.diagnosis-conclusion,
.next-step-panel,
.insights-panel,
.action-plan {
  padding: 18px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: #fff;
}

.traffic-level {
  text-align: center;
  background: var(--bg-panel);
}

.traffic-level h3,
.metrics-analysis h3,
.diagnosis-conclusion h3,
.action-plan h3 {
  font-size: var(--text-body-lg);
  margin-bottom: 12px;
}

.level-badge {
  display: inline-block;
  padding: 8px 24px;
  border-radius: var(--radius-pill);
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
  margin: 8px 0;
}

.level-low { background: var(--state-danger-bg); color: var(--state-danger); }
.level-mid { background: var(--state-warning-bg); color: var(--state-warning); }
.level-high { background: var(--state-success-bg); color: var(--state-success); }
.level-hot { background: var(--state-info-bg); color: var(--state-info); }

.level-desc {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.metric-row {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr) 132px;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.metric-name {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
}

.metric-bar {
  height: 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  overflow: hidden;
}

.metric-fill {
  height: 100%;
  border-radius: 4px;
}

.metric-value {
  font-size: var(--text-caption);
  text-align: right;
}

.metric-value.pass { color: var(--state-success); }
.metric-value.fail { color: var(--state-danger); }

.diagnosis-conclusion {
  background: var(--state-warning-bg);
  border-color: rgba(217, 119, 6, 0.22);
}

.diagnosis-conclusion p {
  margin: 0;
  color: var(--state-warning);
  line-height: 1.6;
}

.next-step-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: var(--state-info-bg);
  border-color: rgba(37, 99, 235, 0.22);
}

.next-step-label {
  color: var(--state-info);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.next-step-panel h3,
.insights-header h3 {
  margin: 4px 0 8px;
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.next-step-panel p,
.insights-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.6;
}

.next-step-btn {
  flex: 0 0 auto;
  padding: 10px 14px;
  border: none;
  border-radius: var(--radius-btn);
  background: var(--brand-primary);
  color: #fff;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.insights-panel {
  display: grid;
  gap: 16px;
  margin-top: 16px;
  background: var(--state-success-bg);
  border-color: rgba(22, 163, 74, 0.22);
}

.insights-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.content-type-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.content-type-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(22, 163, 74, 0.22);
  border-radius: var(--radius-panel);
  background: #fff;
}

.content-type-card span {
  color: var(--state-success);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.content-type-card strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.content-type-card em {
  color: var(--text-secondary);
  font-size: var(--text-caption);
  font-style: normal;
  line-height: 1.4;
}

.insight-actions,
.action-plan ol {
  margin: 0;
  padding-left: 20px;
}

.insight-actions li,
.action-plan li {
  margin-bottom: 8px;
  color: var(--text-secondary);
}

.action-plan {
  margin-top: 16px;
}

@media (max-width: 1180px) {
  .data-input-grid,
  .review-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .review-result-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .video-review-hero {
    padding-top: 24px;
  }

  .video-review-panel {
    padding: 18px;
  }

  .data-input-grid,
  .form-grid,
  .review-summary,
  .content-type-grid {
    grid-template-columns: 1fr;
  }

  .metric-row {
    grid-template-columns: 1fr;
  }

  .metric-bar {
    width: 100%;
  }

  .metric-value {
    text-align: left;
  }

  .next-step-panel,
  .insights-header {
    align-items: stretch;
    flex-direction: column;
  }

  .next-step-btn,
  .generate-btn,
  .review-actions > * {
    width: 100%;
  }
}
</style>
