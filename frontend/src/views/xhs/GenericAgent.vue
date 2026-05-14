<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.push('/xhs')">← 返回智能体矩阵</button>
      <h1 class="agent-title">{{ config.icon }} {{ config.title }}</h1>
      <p class="agent-desc">{{ config.description }}</p>
    </div>

    <div class="agent-content container">
      <div class="form-panel">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">主营赛道</label>
            <select v-model="form.industry" class="form-input">
              <option value="beauty">美妆护肤</option>
              <option value="fashion">穿搭时尚</option>
              <option value="food">美食探店</option>
              <option value="education">知识教育</option>
              <option value="home">家居家装</option>
              <option value="parenting">母婴育儿</option>
              <option value="fitness">运动健身</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">目标人群</label>
            <input v-model="form.audience" class="form-input" placeholder="例如：新手妈妈、同城白领、餐饮老板" />
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">主题/产品/定位</label>
            <input v-model="form.topic" class="form-input" :placeholder="config.topicPlaceholder" />
          </div>
          <div class="form-group">
            <label class="form-label">阶段/目标</label>
            <input v-model="form.goal" class="form-input" :placeholder="config.goalPlaceholder" />
          </div>
        </div>

        <div v-if="config.metrics" class="form-grid">
          <div class="form-group">
            <label class="form-label">阅读量</label>
            <input v-model.number="form.views" class="form-input" type="number" placeholder="例如：10000" />
          </div>
          <div class="form-group">
            <label class="form-label">点赞数</label>
            <input v-model.number="form.likes" class="form-input" type="number" placeholder="例如：500" />
          </div>
          <div class="form-group">
            <label class="form-label">收藏数</label>
            <input v-model.number="form.collects" class="form-input" type="number" placeholder="例如：300" />
          </div>
          <div class="form-group">
            <label class="form-label">评论数</label>
            <input v-model.number="form.comments" class="form-input" type="number" placeholder="例如：80" />
          </div>
        </div>

        <div v-if="config.roi" class="form-grid">
          <div class="form-group">
            <label class="form-label">成交数</label>
            <input v-model.number="form.orders" class="form-input" type="number" placeholder="例如：20" />
          </div>
          <div class="form-group">
            <label class="form-label">成交金额</label>
            <input v-model.number="form.revenue" class="form-input" type="number" placeholder="例如：12000" />
          </div>
          <div class="form-group">
            <label class="form-label">投入成本</label>
            <input v-model.number="form.cost" class="form-input" type="number" placeholder="例如：3000" />
          </div>
        </div>

        <button class="generate-btn" :disabled="!canGenerate || loading" @click="generate">
          {{ loading ? '正在生成...' : config.buttonText }}
        </button>
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div v-if="result" class="result-list">
        <h2 class="result-title">{{ result.title || config.title }}</h2>
        <p class="summary-text">{{ result.summary }}</p>

        <div v-if="result.metrics" class="metric-grid">
          <div v-for="(value, key) in result.metrics" :key="key" class="metric-card">
            <span class="metric-label">{{ metricLabels[key] || key }}</span>
            <strong>{{ value }}</strong>
          </div>
        </div>

        <div v-for="section in result.sections" :key="section.title" class="result-card">
          <h3>{{ section.title }}</h3>
          <ul>
            <li v-for="item in section.items" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div v-if="result.actions?.length" class="result-card action-card">
          <h3>下一步动作</h3>
          <ul>
            <li v-for="action in result.actions" :key="action">{{ action }}</li>
          </ul>
        </div>

        <div v-if="result.titleExamples?.length" class="result-card">
          <h3>可复用标题公式</h3>
          <div class="example-list">
            <div v-for="example in result.titleExamples" :key="example.formula" class="example-item">
              <span>{{ example.formula }}</span>
              <p>{{ example.example }}</p>
            </div>
          </div>
        </div>

        <div v-if="result.riskNotes?.length" class="risk-note">
          <p v-for="note in result.riskNotes" :key="note">{{ note }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import request from '@/api/request'

const route = useRoute()
const loading = ref(false)
const result = ref(null)
const error = ref('')

const configs = {
  'quick-start-plan': { icon: '📅', title: '15 天起号计划', description: '新号冷启动节奏表，快速建立账号标签', topicPlaceholder: '例如：轻医美体验课、本地咖啡店', goalPlaceholder: '例如：15 天建立垂直标签', buttonText: '生成起号计划' },
  'growth-strategy': { icon: '🗺️', title: '90 天增长战略', description: '阶段骨架展示，详情引导专家 1v1 咨询', topicPlaceholder: '例如：同城美业种草账号', goalPlaceholder: '例如：90 天提升咨询量', buttonText: '生成增长战略' },
  'script-generator': { icon: '📝', title: '正文脚本生成', description: '6 大结构模板，图文/视频全覆盖', topicPlaceholder: '例如：换季护肤避坑', goalPlaceholder: '例如：提升收藏率', buttonText: '生成正文脚本' },
  'cover-helper': { icon: '🎨', title: '封面文案助手', description: '3:4 规范 + 高点击钩子词', topicPlaceholder: '例如：敏感肌护理', goalPlaceholder: '例如：提升封面点击率', buttonText: '生成封面建议' },
  'note-diagnoser': { icon: '🔍', title: '笔记数据诊断', description: '小眼睛/互动/截图率多维分析', topicPlaceholder: '例如：最近一篇爆款候选笔记', goalPlaceholder: '例如：判断是否值得加投', buttonText: '诊断笔记数据', metrics: true },
  'account-reviewer': { icon: '📊', title: '账号复盘助手', description: '周/月趋势分析，找爆款规律', topicPlaceholder: '例如：本月账号复盘', goalPlaceholder: '例如：找到下月选题方向', buttonText: '生成账号复盘', metrics: true },
  'seo-optimizer': { icon: '🔎', title: 'SEO 关键词优化', description: '搜索排名 + 长尾词挖掘', topicPlaceholder: '例如：儿童体适能', goalPlaceholder: '例如：提高搜索流量', buttonText: '生成关键词方案' },
  'conversion-optimizer': { icon: '🔗', title: '转化链路优化', description: '合规 SOP 检查，安全引流', topicPlaceholder: '例如：私信咨询到预约', goalPlaceholder: '例如：提高到店率', buttonText: '生成转化方案' },
  'competitor-analyzer': { icon: '🎯', title: '竞对分析器', description: '对标拆解 + 差异化定位', topicPlaceholder: '例如：同城头部美业账号', goalPlaceholder: '例如：找到差异化定位', buttonText: '生成竞对分析' },
  'grass-converter': { icon: '🧮', title: '种草转化计算器', description: '阅读到成交漏斗 ROI 计算', topicPlaceholder: '例如：体验课种草笔记', goalPlaceholder: '例如：测算投产', buttonText: '计算种草转化', metrics: true, roi: true },
  'juguang-strategy': { icon: '🔦', title: '聚光投放策略', description: '专业投放指南，跑量获客', topicPlaceholder: '例如：高收藏笔记放量', goalPlaceholder: '例如：降低咨询成本', buttonText: '生成投放策略', metrics: true, roi: true },
  'ip-positioning': { icon: '🌟', title: '博主 IP 定位', description: '性格 + 行业，生成专属人设', topicPlaceholder: '例如：懂经营的美业主理人', goalPlaceholder: '例如：建立专家信任感', buttonText: '生成 IP 定位' },
  'ip-consistency': { icon: '🔎', title: '人设一致性检查', description: '风格/语气/视觉评估', topicPlaceholder: '例如：主理人专业人设', goalPlaceholder: '例如：减少内容跑偏', buttonText: '检查人设一致性' }
}

const metricLabels = {
  views: '阅读量',
  orders: '成交数',
  revenue: '成交金额',
  cost: '投入成本',
  conversionRate: '转化率',
  roi: 'ROI',
  notes: '笔记数',
  avgViews: '平均阅读',
  interactionRate: '互动率',
  collectRate: '收藏率'
}

const form = reactive({
  industry: 'beauty',
  audience: '',
  topic: '',
  goal: '',
  views: 10000,
  likes: 500,
  collects: 300,
  comments: 80,
  orders: 20,
  revenue: 12000,
  cost: 3000
})

const agentCode = computed(() => route.meta.agentCode || route.params.agentCode || route.path.split('/').pop())
const config = computed(() => configs[agentCode.value] || configs['quick-start-plan'])
const canGenerate = computed(() => form.industry && form.topic)

watch(agentCode, () => {
  result.value = null
  error.value = ''
})

async function generate() {
  loading.value = true
  error.value = ''
  result.value = null
  try {
    result.value = await request.post(`/xhs/${agentCode.value}`, { ...form })
  } catch (err) {
    error.value = err.message || '生成失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@import '../agent-common.css';

.summary-text { color: #475569; font-size: 16px; margin: 0 0 20px; }
.error-text { color: #dc2626; margin-top: 12px; }
.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 18px; }
.metric-card { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 14px; }
.metric-label { display: block; color: #9f1239; font-size: 13px; margin-bottom: 6px; }
.result-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 18px; margin-bottom: 16px; }
.result-card h3 { margin: 0 0 12px; color: #111827; }
.result-card ul { margin: 0; padding-left: 20px; color: #475569; line-height: 1.8; }
.action-card { border-color: #fda4af; }
.example-list { display: grid; gap: 10px; }
.example-item { background: #f8fafc; border-radius: 10px; padding: 12px; }
.example-item span { color: #e11d48; font-size: 13px; font-weight: 700; }
.example-item p { margin: 6px 0 0; color: #334155; }
.risk-note { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px 14px; color: #92400e; }
.risk-note p { margin: 0; }
.risk-note p + p { margin-top: 6px; }
</style>
