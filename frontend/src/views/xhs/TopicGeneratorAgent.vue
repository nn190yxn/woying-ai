<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.push('/xhs')">← 返回智能体矩阵</button>
      <h1 class="agent-title">💡 爆款选题库</h1>
      <p class="agent-desc">搜索意图 + 爆款公式，每日生成精准选题</p>
    </div>

    <div class="agent-content container">
      <div class="form-panel">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">主营赛道</label>
            <select v-model="form.industry" class="form-input">
              <option value="">请选择</option>
              <option value="beauty">美妆护肤</option>
              <option value="fashion">穿搭时尚</option>
              <option value="food">美食探店</option>
              <option value="education">知识教育</option>
              <option value="home">家居家装</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">目标受众</label>
            <select v-model="form.audience" class="form-input">
              <option value="">请选择</option>
              <option value="beginner">新手/小白</option>
              <option value="professional">专业人士/进阶</option>
              <option value="bargain">价格敏感型</option>
              <option value="quality">品质追求型</option>
            </select>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">选题方法</label>
            <div class="radio-group">
              <label class="radio-item" v-for="m in methods" :key="m.value">
                <input type="radio" v-model="form.method" :value="m.value">
                <span>{{ m.label }}</span>
              </label>
            </div>
          </div>
        </div>
        <button class="generate-btn" :disabled="!canGenerate || loading" @click="generate">
          {{ loading ? '正在生成选题...' : '生成今日选题' }}
        </button>
        <p v-if="error" class="error-text">{{ error }}</p>
      </div>

      <div v-if="topics.length" class="result-list">
        <h2 class="result-title">🔥 今日推荐选题 ({{ topics.length }}个)</h2>
        <div class="topic-cards">
          <div v-for="topic in topics" :key="topic.id" class="topic-card">
            <div class="topic-header">
              <span class="topic-rank">#{{ topic.id }}</span>
              <span class="topic-formula">{{ topic.formula }}</span>
            </div>
            <h3 class="topic-name">{{ topic.title }}</h3>
            <div class="topic-meta">
              <span class="meta-tag" v-for="t in topic.tags" :key="t">{{ t }}</span>
              <span class="meta-vol">搜索量 {{ (topic.searchVolume / 10000).toFixed(1) }}万/月</span>
            </div>
            <div class="topic-actions">
              <button class="action-btn" @click="useTopic(topic)">使用此选题</button>
              <span class="competition" :class="topic.competition === '低' ? 'good' : 'bad'">竞争: {{ topic.competition }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/api/request'

const router = useRouter()
const loading = ref(false)
const topics = ref([])
const error = ref('')

const methods = [
  { value: 'formula', label: '爆款公式法' },
  { value: 'search', label: '搜索意图法' },
  { value: 'hotspot', label: '热点借势法' }
]

const form = reactive({
  industry: '',
  audience: '',
  method: 'formula'
})

const canGenerate = computed(() => form.industry && form.audience)

const generate = async () => {
  loading.value = true
  error.value = ''
  try {
    const response = await request.post('/xhs/topic-generator', { ...form })
    topics.value = response.topics || []
  } catch (err) {
    error.value = err.message || '生成选题失败'
  } finally {
    loading.value = false
  }
}

const useTopic = (topic) => {
  router.push({ path: '/xhs/script-generator', query: { topic: topic.title } })
}
</script>

<style scoped>
@import '../agent-common.css';
.error-text { color: #dc2626; margin-top: 12px; }
</style>
