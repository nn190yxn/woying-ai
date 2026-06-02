<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.push('/douyin')">← 返回智能体矩阵</button>
      <h1 class="agent-title">🔍 视频数据诊断</h1>
      <p class="agent-desc">输入播放/点赞/完播数据，AI 判断问题</p>
    </div>
    <div class="agent-content container">
      <div class="wizard-panel">
        <div class="data-input-grid">
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
        </div>

        <div class="form-grid" style="margin-top: 20px;">
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
        </div>

        <button class="generate-btn" @click="diagnose" :disabled="!form.views" style="width:100%; margin-top:20px;">
          开始诊断
        </button>

        <div v-if="result" class="diagnosis-result">
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

          <div class="diagnosis-conclusion">
            <h3>诊断结论</h3>
            <p>{{ result.conclusion }}</p>
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
import { reactive, ref } from 'vue'
import request from '@/api/request'

const result = ref(null)
const loading = ref(false)
const form = reactive({ views: 0, likes: 0, completes: 0, saves: 0, shares: 0, comments: 0, duration: 'medium', trafficSource: 'recommend' })

const toPercentNumber = (value) => {
  const parsed = Number.parseFloat(String(value || '0').replace('%', ''))
  return Number.isFinite(parsed) ? parsed : 0
}

const diagnose = async () => {
  loading.value = true
  const v = form.views
  try {
    const response = await request.post('/douyin/data-diagnoser', {
      industry: 'restaurant',
      views: form.views,
      likes: form.likes,
      completes: form.completes,
      saves: form.saves,
      shares: form.shares,
      comments: form.comments
    })
    const analysis = response.result?.analysis || response.analysis || response.result || response
    const likeRate = toPercentNumber(analysis.viewRate)
    const completeRate = toPercentNumber(analysis.completeRate)
    const saveRate = toPercentNumber(analysis.saveRate)
    const interactionRate = toPercentNumber(analysis.interactionRate)

    let levelText = 'Level 1: 初始池'
    let levelClass = 'level-low'
    let levelDesc = '内容尚未触发推荐算法，需优化标签与封面'
    if (v >= 50000) {
      levelText = 'Level 4: 热门池'
      levelClass = 'level-hot'
      levelDesc = '爆款内容，建议趁热打追投'
    } else if (v >= 5000) {
      levelText = 'Level 3: 推荐池'
      levelClass = 'level-high'
      levelDesc = '表现良好，有机会冲击更大流量池'
    } else if (v >= 500) {
      levelText = 'Level 2: 同城池'
      levelClass = 'level-mid'
      levelDesc = '已进入同城推荐，但核心指标仍需继续优化'
    }

    result.value = {
      levelText,
      levelClass,
      levelDesc,
      metrics: [
        { name: '点赞率', value: analysis.viewRate || '0%', percent: Math.min(likeRate * 10, 100), color: likeRate >= 3 ? '#10b981' : '#ef4444', benchmark: '3-5%', status: likeRate >= 3 ? 'pass' : 'fail' },
        { name: '完播率', value: analysis.completeRate || '0%', percent: Math.min(completeRate * 2.5, 100), color: completeRate >= 25 ? '#10b981' : '#ef4444', benchmark: '25-40%', status: completeRate >= 25 ? 'pass' : 'fail' },
        { name: '收藏率', value: analysis.saveRate || '0%', percent: Math.min(saveRate * 12, 100), color: saveRate >= 5 ? '#10b981' : '#ef4444', benchmark: '5-8%', status: saveRate >= 5 ? 'pass' : 'fail' },
        { name: '互动率', value: analysis.interactionRate || '0%', percent: Math.min(interactionRate * 12, 100), color: interactionRate >= 5 ? '#10b981' : '#ef4444', benchmark: '5-8%', status: interactionRate >= 5 ? 'pass' : 'fail' }
      ],
      conclusion: (analysis.issues || []).length ? analysis.issues.join('；') + '。' : '各项指标均在健康范围内，建议保持内容质量稳定。',
      actions: analysis.suggestions || []
    }
  } catch (error) {
    console.error('诊断失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import './agent-common.css';
.data-input-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.data-input-card { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--bg-subtle); border-radius: 8px; }
.data-label { font-size: var(--text-caption); color: var(--text-muted); font-weight: var(--font-weight-semibold); }
.data-input { width: 100%; padding: 8px; border: 1px solid var(--border-light); border-radius: 6px; font-size: var(--text-h4); font-weight: var(--font-weight-bold); }
.form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.generate-btn { padding: 12px; background: var(--brand-primary); color: white; border: none; border-radius: 8px; font-weight: var(--font-weight-semibold); cursor: pointer; }
.generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.diagnosis-result { margin-top: 24px; }
.traffic-level { text-align: center; padding: 24px; background: var(--bg-subtle); border-radius: 12px; margin-bottom: 20px; }
.level-badge { display: inline-block; padding: 8px 24px; border-radius: 24px; font-size: var(--text-h4); font-weight: var(--font-weight-bold); margin: 8px 0; }
.level-low { background: #fee2e2; color: #dc2626; }
.level-mid { background: #fef3c7; color: #d97706; }
.level-high { background: #d1fae5; color: #059669; }
.level-hot { background: #dbeafe; color: #2563eb; }
.level-desc { font-size: var(--text-body-sm); color: var(--text-secondary); }
.metrics-analysis { margin-bottom: 20px; }
.metrics-analysis h3, .diagnosis-conclusion h3, .action-plan h3 { font-size: var(--text-body-lg); margin-bottom: 12px; }
.metric-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.metric-name { width: 60px; font-size: var(--text-body-sm); font-weight: var(--font-weight-semibold); }
.metric-bar { flex: 1; height: 8px; background: var(--bg-subtle); border-radius: 4px; overflow: hidden; }
.metric-fill { height: 100%; border-radius: 4px; }
.metric-value { width: 120px; font-size: var(--text-caption); text-align: right; }
.metric-value.pass { color: #059669; }
.metric-value.fail { color: #dc2626; }
.diagnosis-conclusion { padding: 16px; background: #fef3c7; border-radius: 8px; margin-bottom: 20px; }
.diagnosis-conclusion p { color: #92400e; }
.action-plan ol { margin: 0; padding-left: 20px; }
.action-plan li { margin-bottom: 8px; color: var(--text-secondary); }
</style>
