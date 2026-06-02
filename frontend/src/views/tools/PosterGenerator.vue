<template>
  <div class="agent-page">
    <div class="agent-header container">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="agent-title">🎨 海报生成器</h1>
      <p class="agent-desc">8 大场景海报一键生成，智能匹配行业设计规范</p>
    </div>

    <div class="agent-content container">
      <!-- Steps indicator -->
      <div class="steps-bar">
        <div
          v-for="(step, index) in steps"
          :key="index"
          class="step-item"
          :class="{ active: currentStep === index, done: currentStep > index }"
          @click="index < currentStep && goToStep(index)"
        >
          <span class="step-num">{{ index + 1 }}</span>
          <span class="step-label">{{ step }}</span>
        </div>
      </div>

      <!-- Step 1: Select Type -->
      <div v-if="currentStep === 0" class="wizard-panel">
        <h3 class="panel-title">选择海报类型</h3>
        <p class="panel-subtitle">根据您的使用场景选择合适的海报类型</p>

        <div class="type-grid">
          <div
            v-for="type in posterTypes"
            :key="type.code"
            class="type-card"
            :class="{ selected: selectedType === type.code }"
            @click="selectedType = type.code"
          >
            <span class="type-icon">{{ type.icon }}</span>
            <h4 class="type-name">{{ type.name }}</h4>
            <p class="type-desc">{{ type.description }}</p>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">所属行业</label>
          <div class="industry-row">
            <button
              v-for="ind in industries"
              :key="ind.key"
              class="industry-btn"
              :class="{ active: industry === ind.key }"
              @click="industry = ind.key"
            >
              {{ ind.label }}
            </button>
          </div>
        </div>

        <button class="generate-btn" :disabled="!selectedType" @click="currentStep = 1">
          下一步
        </button>
      </div>

      <!-- Step 2: Fill Requirements -->
      <div v-if="currentStep === 1" class="wizard-panel">
        <h3 class="panel-title">填写海报需求</h3>
        <p class="panel-subtitle">{{ posterTypeInfo?.name }} - 请填写以下信息</p>

        <div class="form-grid">
          <div v-for="field in posterTypeInfo?.formFields" :key="field.key" class="form-group">
            <label class="form-label">
              {{ field.label }}
              <span v-if="field.required" class="required-mark">*</span>
            </label>

            <input
              v-if="field.type === 'text'"
              v-model="formData[field.key]"
              :placeholder="field.placeholder || '请输入'"
              class="form-input"
            />

            <textarea
              v-else-if="field.type === 'textarea'"
              v-model="formData[field.key]"
              :placeholder="field.placeholder || '请输入（每行一个）'"
              class="form-input"
              rows="3"
            />

            <input
              v-else-if="field.type === 'date'"
              v-model="formData[field.key]"
              type="date"
              class="form-input"
            />

            <input
              v-else-if="field.type === 'number'"
              v-model.number="formData[field.key]"
              type="number"
              :placeholder="field.placeholder"
              class="form-input"
            />

            <select
              v-else-if="field.type === 'select'"
              v-model="formData[field.key]"
              class="form-input"
            >
              <option value="">请选择</option>
              <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>

        <div class="btn-row">
          <button class="secondary-btn" @click="currentStep = 0">上一步</button>
          <button class="generate-btn" @click="generatePrompt">生成提示词</button>
        </div>
      </div>

      <!-- Step 3: Confirm Prompt -->
      <div v-if="currentStep === 2" class="wizard-panel">
        <h3 class="panel-title">确认提示词</h3>
        <p class="panel-subtitle">AI 将根据以下结构化提示词生成海报方案</p>

        <!-- Output structure preview -->
        <div class="structure-preview" v-if="promptStructure">
          <div class="structure-section">
            <h4 class="structure-title">一、文案内容</h4>
            <div class="structure-items">
              <div
                v-for="item in promptStructure.outputSections"
                :key="item.key"
                class="structure-item"
              >
                <span class="item-label">{{ item.label }}</span>
                <span class="item-desc">{{ item.desc }}</span>
              </div>
            </div>
          </div>

          <div class="structure-section">
            <h4 class="structure-title">二、设计建议</h4>
            <div class="structure-items">
              <div
                v-for="item in promptStructure.designAdvice"
                :key="item.key"
                class="structure-item"
              >
                <span class="item-label">{{ item.label }}</span>
                <span class="item-desc">{{ item.desc }}</span>
              </div>
            </div>
          </div>

          <div class="structure-section">
            <h4 class="structure-title">三、图片建议</h4>
            <div class="structure-items">
              <div
                v-for="item in promptStructure.imageAdvice"
                :key="item.key"
                class="structure-item"
              >
                <span class="item-label">{{ item.label }}</span>
                <span class="item-desc">{{ item.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Full prompt text (collapsible) -->
        <details class="prompt-details">
          <summary class="prompt-summary">查看完整提示词</summary>
          <div class="prompt-box">
            <pre>{{ generatedPrompt }}</pre>
          </div>
        </details>

        <div class="prompt-meta" v-if="promptMeta">
          <span>类型：{{ promptMeta.posterTypeName }}</span>
          <span>行业：{{ promptMeta.industryName }}</span>
          <span>知识库：{{ promptMeta.kbFilesUsed?.length || 0 }} 文件</span>
          <span>模式：{{ promptMeta.retrievalMode === 'mapping_only' ? '映射检索' : '双通道检索' }}</span>
        </div>

        <div class="btn-row">
          <button class="secondary-btn" @click="currentStep = 1">修改需求</button>
          <button class="generate-btn" @click="generatePoster">生成海报方案</button>
        </div>
      </div>

      <!-- Step 4: Result -->
      <div v-if="currentStep === 3" class="wizard-panel">
        <h3 class="panel-title">海报方案</h3>
        <p class="panel-subtitle">{{ posterTypeName }} - 生成完成</p>

        <div class="result-tabs">
          <button
            class="result-tab"
            :class="{ active: activeTab === 'copywriting' }"
            @click="activeTab = 'copywriting'"
          >
            文案内容
          </button>
          <button
            class="result-tab"
            :class="{ active: activeTab === 'design' }"
            @click="activeTab = 'design'"
          >
            设计建议
          </button>
          <button
            class="result-tab"
            :class="{ active: activeTab === 'image' }"
            @click="activeTab = 'image'"
          >
            图片建议
          </button>
          <button
            class="result-tab"
            :class="{ active: activeTab === 'raw' }"
            @click="activeTab = 'raw'"
          >
            完整原文
          </button>
        </div>

        <!-- Copywriting tab -->
        <div v-if="activeTab === 'copywriting'" class="result-panel">
          <div v-if="parsedContent.copywriting.length > 0" class="copywriting-list">
            <div
              v-for="item in parsedContent.copywriting"
              :key="item.label"
              class="copy-item"
            >
              <div class="copy-label">{{ item.label }}</div>
              <div class="copy-value" :class="{ 'is-headline': item.key === 'headline' }">
                {{ item.value }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>未解析到结构化文案，请查看"完整原文"标签</p>
          </div>
        </div>

        <!-- Design tab -->
        <div v-if="activeTab === 'design'" class="result-panel">
          <div v-if="parsedContent.design.length > 0" class="design-grid">
            <div v-for="item in parsedContent.design" :key="item.label" class="design-card">
              <h4 class="design-label">{{ item.label }}</h4>
              <pre class="design-value">{{ item.value }}</pre>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>未解析到设计建议，请查看"完整原文"标签</p>
          </div>
        </div>

        <!-- Image tab -->
        <div v-if="activeTab === 'image'" class="result-panel">
          <div v-if="parsedContent.image.length > 0" class="design-grid">
            <div v-for="item in parsedContent.image" :key="item.label" class="design-card">
              <h4 class="design-label">{{ item.label }}</h4>
              <pre class="design-value">{{ item.value }}</pre>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>未解析到图片建议，请查看"完整原文"标签</p>
          </div>
        </div>

        <!-- Raw tab -->
        <div v-if="activeTab === 'raw'" class="result-panel">
          <pre class="raw-content">{{ rawContent }}</pre>
        </div>

        <div class="btn-row">
          <button class="secondary-btn" @click="resetForm">重新生成</button>
          <button class="generate-btn" @click="copyResult">复制方案</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
const API_BASE = import.meta.env.VITE_API_BASE || ''
function getToken() { return localStorage.getItem('token') || '' }
async function apiCall(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } }
  const token = getToken()
  if (token) opts.headers['Authorization'] = 'Bearer ' + token
  if (body) opts.body = JSON.stringify(body)
  const resp = await fetch(API_BASE + path, opts)
  const data = await resp.json()
  if (!resp.ok) throw new Error(data.error || '请求失败')
  return data
}

const steps = ['选择类型', '填写需求', '确认提示词', '生成方案']
const currentStep = ref(0)
const activeTab = ref('copywriting')
const loading = ref(false)
const loadingMessage = ref('')

const posterTypes = ref([])
const selectedType = ref('')
const industry = ref('catering')
const formData = reactive({})

const generatedPrompt = ref('')
const promptMeta = ref(null)
const promptStructure = ref(null)
const posterTypeName = ref('')
const rawContent = ref('')
const parsedContent = reactive({
  copywriting: [],
  design: [],
  image: []
})

const industries = [
  { key: 'catering', label: '餐饮' },
  { key: 'beauty', label: '美业' },
  { key: 'education', label: '教培' },
  { key: 'service', label: '服务' }
]

const posterTypeInfo = computed(() => {
  return posterTypes.value.find(t => t.code === selectedType.value)
})

onMounted(async () => {
  try {
    const res = await apiCall('get', '/generate/poster/types')
    if (res.success) posterTypes.value = res.data
  } catch (err) {
    console.error('获取海报类型失败:', err)
  }
})

function goToStep(step) {
  currentStep.value = step
}

async function generatePrompt() {
  const fields = posterTypeInfo.value?.formFields || []
  for (const field of fields) {
    if (field.required && !formData[field.key]) {
      alert(`请填写：${field.label}`)
      return
    }
  }

  loading.value = true
  loadingMessage.value = '正在生成提示词...'

  try {
    const res = await apiCall('post', '/generate/poster/prompt', {
      type: selectedType.value,
      industry: industry.value,
      formData: { ...formData }
    })

    if (res.success) {
      generatedPrompt.value = res.data.prompt
      promptMeta.value = res.data.promptMeta
      promptStructure.value = res.data.promptStructure
      currentStep.value = 2
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message || '生成提示词失败')
  } finally {
    loading.value = false
  }
}

async function generatePoster() {
  loading.value = true
  loadingMessage.value = '正在生成海报方案...'

  try {
    const res = await apiCall('post', '/generate/poster/generate', {
      type: selectedType.value,
      industry: industry.value,
      formData: { ...formData },
      prompt: generatedPrompt.value
    })

    if (res.success) {
      rawContent.value = res.data.content
      posterTypeName.value = res.data.posterTypeName

      // Parse structured content based on prompt structure
      if (promptStructure.value && typeof res.data.content === 'string') {
        parseStructuredContent(res.data.content, promptStructure.value)
      } else if (typeof res.data.content === 'object') {
        // If backend returns structured object
        for (const key in res.data.content) {
          const section = findSectionByKey(key)
          if (section) {
            section.push({ key, label: key, value: res.data.content[key] })
          }
        }
      }

      activeTab.value = 'copywriting'
      currentStep.value = 3
    }
  } catch (err) {
    alert(err.response?.data?.error || err.message || '生成海报方案失败')
  } finally {
    loading.value = false
  }
}

function findSectionByKey(key) {
  if (!promptStructure.value) return null

  for (const item of promptStructure.value.outputSections) {
    if (item.key === key) return parsedContent.copywriting
  }
  for (const item of promptStructure.value.designAdvice) {
    if (item.key === key) return parsedContent.design
  }
  for (const item of promptStructure.value.imageAdvice) {
    if (item.key === key) return parsedContent.image
  }
  return null
}

function parseStructuredContent(content, structure) {
  // Clear previous parsed content
  parsedContent.copywriting = []
  parsedContent.design = []
  parsedContent.image = []

  // Parse copywriting sections
  for (const section of structure.outputSections) {
    const patterns = [
      new RegExp(`${section.label}[：:]\\s*([^\\n#]+)`, 'i'),
      new RegExp(`\\*\\*${section.label}\\*\\*[：:]?\\s*([^\\n#]+)`, 'i'),
      new RegExp(`-\\s*${section.label}[：:]?\\s*([^\\n#]+)`, 'i')
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        parsedContent.copywriting.push({
          key: section.key,
          label: section.label,
          value: match[1].trim()
        })
        break
      }
    }
  }

  // Parse design sections - find section header then extract content
  const designSection = content.match(/二、设计建议[：:]?\s*\n([\s\S]*?)(?=三、图片建议|$)/i)
  if (designSection && structure.designAdvice) {
    for (const item of structure.designAdvice) {
      const pattern = new RegExp(`${item.label}[：:]\\s*([^\\n-]+)`, 'i')
      const match = designSection[1].match(pattern)
      if (match) {
        parsedContent.design.push({
          key: item.key,
          label: item.label,
          value: match[1].trim()
        })
      }
    }
  }

  // Parse image sections
  const imageSection = content.match(/三、图片建议[：:]?\s*\n([\s\S]*?)$/i)
  if (imageSection && structure.imageAdvice) {
    for (const item of structure.imageAdvice) {
      const pattern = new RegExp(`${item.label}[：:]\\s*([^\\n-]+)`, 'i')
      const match = imageSection[1].match(pattern)
      if (match) {
        parsedContent.image.push({
          key: item.key,
          label: item.label,
          value: match[1].trim()
        })
      }
    }
  }

  // Fallback: if no structured parsing worked, try generic headline extraction
  if (parsedContent.copywriting.length === 0) {
    const titleMatch = content.match(/主标题[：:]\\s*(.+)/)
    if (titleMatch) {
      parsedContent.copywriting.push({
        key: 'headline',
        label: '主标题',
        value: titleMatch[1].trim()
      })
    }
  }
}

function resetForm() {
  currentStep.value = 0
  activeTab.value = 'copywriting'
  selectedType.value = ''
  industry.value = 'catering'
  for (const key in formData) delete formData[key]
  generatedPrompt.value = ''
  promptMeta.value = null
  promptStructure.value = null
  rawContent.value = ''
  parsedContent.copywriting = []
  parsedContent.design = []
  parsedContent.image = []
}

function copyResult() {
  const text = rawContent.value || JSON.stringify(parsedContent, null, 2)
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
  }).catch(() => {
    alert('复制失败，请手动选择复制')
  })
}
</script>

<style scoped>
@import '../douyin/agent-common.css';

.panel-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.panel-subtitle {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
}

.steps-bar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #999;
  cursor: default;
}

.step-item.active {
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 600;
}

.step-item.done {
  color: #22c55e;
  cursor: pointer;
}

.step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  background: #e5e7eb;
  color: #666;
}

.step-item.active .step-num {
  background: #4338ca;
  color: #fff;
}

.step-item.done .step-num {
  background: #22c55e;
  color: #fff;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

@media (max-width: 900px) {
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .type-grid {
    grid-template-columns: 1fr;
  }
}

.type-card {
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.type-card:hover {
  border-color: #6366f1;
  background: #f5f3ff;
}

.type-card.selected {
  border-color: #6366f1;
  background: #ede9fe;
}

.type-icon {
  font-size: 32px;
  display: block;
}

.type-name {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 4px;
}

.type-desc {
  font-size: 12px;
  color: #888;
}

.industry-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.industry-btn {
  padding: 8px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.industry-btn.active {
  background: #6366f1;
  color: #fff;
  border-color: #6366f1;
}

.btn-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.secondary-btn {
  padding: 10px 24px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

/* Structure preview */
.structure-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.structure-section {
  margin-bottom: 16px;
}

.structure-section:last-child {
  margin-bottom: 0;
}

.structure-title {
  font-size: 14px;
  font-weight: 600;
  color: #4338ca;
  margin-bottom: 8px;
}

.structure-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.structure-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
}

.item-label {
  font-weight: 500;
  color: #374151;
}

.item-desc {
  color: #999;
}

/* Prompt details */
.prompt-details {
  margin-bottom: 12px;
}

.prompt-summary {
  cursor: pointer;
  color: #6366f1;
  font-size: 13px;
  padding: 8px 0;
}

.prompt-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.prompt-box pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

.prompt-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  font-size: 12px;
  color: #888;
}

/* Result tabs */
.result-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  padding: 4px;
}

.result-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.result-tab.active {
  background: #fff;
  color: #4338ca;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.result-panel {
  min-height: 200px;
}

/* Copywriting list */
.copywriting-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.copy-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.copy-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.copy-value {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.copy-value.is-headline {
  font-size: 20px;
  font-weight: 700;
  color: #4338ca;
}

/* Design grid */
.design-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .design-grid {
    grid-template-columns: 1fr;
  }
}

.design-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

.design-label {
  font-size: 13px;
  font-weight: 600;
  color: #4338ca;
  margin-bottom: 8px;
}

.design-value {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  white-space: pre-wrap;
  margin: 0;
}

/* Raw content */
.raw-content {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 14px;
  line-height: 1.6;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
  margin: 0;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

/* Required mark */
.required-mark {
  color: #ef4444;
}

/* Date input */
.form-input[type="date"] {
  color: #374151;
}
</style>
