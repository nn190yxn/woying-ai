<template>
  <div class="sheet-page">
    <div class="sheet-header">
      <div class="sheet-header-left">
        <button class="btn-back" @click="goBack">&larr;</button>
        <div>
          <h1 class="sheet-title">{{ templateData.name }}</h1>
          <p class="sheet-desc">{{ templateData.summary }}</p>
        </div>
      </div>
      <div class="sheet-badge" :class="templateData.badgeClass">{{ templateData.badge }}</div>
    </div>

    <div class="sheet-meta">
      <div class="meta-item">
        <span class="meta-label">分组</span>
        <span class="meta-value">{{ templateData.group }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">类型</span>
        <span class="meta-value">{{ templateData.templateLabel }}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">字段数</span>
        <span class="meta-value">{{ templateData.keyFields.length }} 个</span>
      </div>
    </div>

    <div class="sheet-toolbar">
      <button class="btn btn-primary" @click="addRow">+ 新增一行</button>
      <button class="btn btn-outline" @click="loadExampleData" :disabled="loadingExample">
        {{ loadingExample ? '加载中...' : '加载示例数据' }}
      </button>
      <button class="btn btn-outline" @click="exportCSV">导出 CSV</button>
      <label class="btn btn-outline import-label">
        导入 CSV
        <input type="file" accept=".csv" class="import-input" @change="importCSV" />
      </label>
      <button class="btn btn-outline btn-save" @click="saveSheet" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
      <button class="btn btn-outline" @click="showHistory = !showHistory">
        加载历史
      </button>
    </div>

    <div class="sheet-history" v-if="showHistory">
      <div v-if="historyLoading" class="history-loading">加载中...</div>
      <div v-else-if="historyList.length === 0" class="history-empty">暂无保存记录</div>
      <div v-else>
        <div class="history-item" v-for="h in historyList" :key="h.id">
          <span class="history-time">{{ h.created_at }}</span>
          <button class="btn btn-sm btn-outline" @click="loadSheet(h.id)">加载</button>
        </div>
      </div>
    </div>

    <div class="sheet-table-wrap">
      <table class="sheet-table">
        <thead>
          <tr>
            <th class="col-index">#</th>
            <th v-for="f in allFields" :key="f.key" class="col-field">{{ f.label }}</th>
            <th class="col-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx">
            <td class="col-index">{{ idx + 1 }}</td>
            <td v-for="f in allFields" :key="f.key">
              <input v-if="f.type === 'number'" v-model.number="row[f.key]" type="number" class="cell-input" />
              <input v-else-if="f.type === 'date'" v-model="row[f.key]" type="date" class="cell-input" />
              <input v-else v-model="row[f.key]" type="text" class="cell-input" :placeholder="f.label" />
            </td>
            <td class="col-action">
              <button class="btn-delete" @click="removeRow(idx)">删除</button>
            </td>
          </tr>
          <tr v-if="rows.length === 0">
            <td :colspan="allFields.length + 2" class="empty-row">暂无数据，点击「新增一行」开始记录</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="sheet-stats" v-if="statsFields.length > 0 && rows.length > 0">
      <h3>数据统计</h3>
      <div class="stats-grid">
        <div v-for="sf in statsFields" :key="sf.key" class="stat-card">
          <span class="stat-label">{{ sf.label }}</span>
          <span class="stat-value">{{ medianCompact(computeStats(sf.key)) }}</span>
        </div>
      </div>
    </div>

    <div class="sheet-outputs" v-if="templateData.outputs && templateData.outputs.length">
      <h3>可生成的分析</h3>
      <div class="output-tags">
        <span v-for="o in templateData.outputs" :key="o" class="output-tag">{{ o }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getTemplateByCode } from '@/constants/toolCatalog'
import { generateTool } from '@/api/index.js'
import request from '@/api/request.js'

const props = defineProps({
  templateCode: { type: String, required: true },
  fields: { type: Array, default: () => [] }
})

const router = useRouter()
const templateData = computed(() => getTemplateByCode(props.templateCode) || {})

const allFields = computed(() => {
  if (props.fields.length) return props.fields
  if (templateData.value.keyFields) {
    return templateData.value.keyFields.map(f => ({ key: f, label: f, type: 'text' }))
  }
  return []
})

const rows = ref([])
const loadingExample = ref(false)
const saving = ref(false)
const showHistory = ref(false)
const historyList = ref([])
const historyLoading = ref(false)

// 数值字段统计
const statsFields = computed(() => allFields.value.filter(f => f.type === 'number'))

function goBack() { router.back() }

function addRow() {
  const row = {}
  allFields.value.forEach(f => { row[f.key] = f.type === 'number' ? null : '' })
  rows.value.push(row)
}

function removeRow(idx) { rows.value.splice(idx, 1) }

async function loadExampleData() {
  loadingExample.value = true
  try {
    const result = await generateTool(props.templateCode, {})
    if (result.extra && result.extra.type === 'spreadsheet') {
      const { headers, exampleRows } = result.extra
      rows.value = exampleRows.map(row => {
        const obj = {}
        headers.forEach((h, i) => {
          const field = allFields.value.find(f => f.label === h)
          if (field) {
            obj[field.key] = field.type === 'number' ? Number(row[i]) : row[i]
          }
        })
        return obj
      })
    }
  } catch (e) {
    // Silently fail - example data is optional
  } finally {
    loadingExample.value = false
  }
}

function exportCSV() {
  if (!rows.value.length) return
  const headers = allFields.value.map(f => f.label).join(',')
  const csvRows = rows.value.map(row =>
    allFields.value.map(f => {
      const v = row[f.key] ?? ''
      return typeof v === 'string' && v.includes(',') ? `"${v}"` : v
    }).join(',')
  )
  const csv = [headers, ...csvRows].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${templateData.value.name || 'sheet'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function importCSV(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target.result
    const lines = text.split('\n').filter(l => l.trim())
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const dataRows = lines.slice(1).map(line => {
      const vals = parseCSVLine(line)
      const obj = {}
      headers.forEach((h, i) => {
        const field = allFields.value.find(f => f.label === h)
        if (field) {
          obj[field.key] = field.type === 'number' ? Number(vals[i]) : (vals[i] || '')
        }
      })
      return obj
    })
    rows.value = dataRows
  }
  reader.readAsText(file, 'UTF-8')
  e.target.value = ''
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === ',' && !inQuote) { result.push(current.trim()); current = ''; continue }
    current += ch
  }
  result.push(current.trim())
  return result
}

async function saveSheet() {
  if (!rows.value.length) return
  saving.value = true
  try {
    await request('/api/sheets/save', 'POST', {
      sheetCode: props.templateCode,
      data: rows.value
    })
    alert('保存成功')
  } catch (e) {
    alert('保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function loadHistory() {
  showHistory.value = true
  historyLoading.value = true
  try {
    const data = await request(`/api/sheets/list?sheetCode=${props.templateCode}`, 'GET')
    historyList.value = data.list || []
  } catch (e) {
    historyList.value = []
  } finally {
    historyLoading.value = false
  }
}

async function loadSheet(id) {
  try {
    const data = await request(`/api/sheets/load/${id}`, 'GET')
    if (data.data) {
      rows.value = JSON.parse(JSON.stringify(data.data))
    }
    showHistory.value = false
  } catch (e) {
    alert('加载失败')
  }
}

function computeStats(fieldKey) {
  const vals = rows.value.map(r => r[fieldKey]).filter(v => v !== null && v !== '' && !isNaN(Number(v))).map(Number)
  if (!vals.length) return { sum: 0, avg: 0, max: 0, min: 0, count: 0 }
  return {
    sum: vals.reduce((a, b) => a + b, 0),
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 100) / 100,
    max: Math.max(...vals),
    min: Math.min(...vals),
    count: vals.length
  }
}

function medianCompact(stats) {
  if (!stats.count) return '-'
  return `合计${stats.sum} | 平均${stats.avg} | 最大${stats.max} | 最小${stats.min}`
}

// Watch for history toggle
watch(showHistory, (val) => {
  if (val) loadHistory()
})
</script>

<style scoped>
.sheet-page {
  max-width: var(--workbench-max-width);
  min-height: 100vh;
  margin: 0 auto;
  padding: var(--space-6) var(--page-padding-mobile) var(--space-10);
  background: var(--bg-workbench);
}

.sheet-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.sheet-header-left {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  min-width: 0;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: var(--button-height-md);
  height: var(--button-height-md);
  border: 1px solid var(--line-default);
  border-radius: var(--radius-btn);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: var(--text-body-lg);
  cursor: pointer;
}

.sheet-title {
  margin: 0;
  color: var(--text-main);
  font-size: var(--text-h3);
  line-height: var(--leading-h3);
}

.sheet-desc {
  max-width: var(--content-readable-width);
  margin: var(--space-1) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: var(--leading-body-sm);
}

.sheet-badge {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: var(--tag-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--state-info-bg);
  color: var(--state-info);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.sheet-meta,
.sheet-history,
.sheet-table-wrap,
.sheet-stats,
.sheet-outputs {
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.sheet-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
  padding: var(--card-padding-md);
}

.meta-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
}

.meta-label {
  color: var(--text-muted);
  font-size: var(--text-caption);
}

.meta-value {
  color: var(--text-main);
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  overflow-wrap: anywhere;
}

.sheet-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: var(--button-height-md);
  padding: 0 var(--space-4);
  border-radius: var(--radius-btn);
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary,
.btn-save {
  border: 1px solid var(--brand-primary);
  background: var(--brand-primary);
  color: #fff;
}

.btn-outline {
  border: 1px solid var(--line-default);
  background: var(--bg-card);
  color: var(--text-main);
}

.btn-sm {
  min-height: var(--button-height-sm);
  padding: 0 var(--space-3);
  font-size: var(--text-caption);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.import-label {
  position: relative;
  cursor: pointer;
}

.import-input {
  position: absolute;
  inset: 0;
  width: 100%;
  cursor: pointer;
  opacity: 0;
}

.sheet-history {
  margin-bottom: var(--space-4);
  overflow: hidden;
}

.history-loading,
.history-empty {
  padding: var(--space-4);
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--line-soft);
}

.history-item:last-child {
  border-bottom: 0;
}

.history-time {
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.sheet-table-wrap {
  overflow-x: auto;
}

.sheet-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
}

.sheet-table th,
.sheet-table td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--line-soft);
  text-align: left;
  font-size: var(--text-body-sm);
}

.sheet-table th {
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.col-index {
  width: 50px;
  text-align: center;
}

.col-action {
  width: 88px;
}

.cell-input {
  width: 100%;
  min-height: var(--button-height-sm);
  padding: 0 var(--space-2);
  border: 1px solid transparent;
  border-radius: var(--radius-input);
  background: transparent;
  color: var(--text-main);
  font-size: var(--text-body-sm);
}

.cell-input:focus {
  border-color: var(--brand-primary);
  outline: none;
  background: var(--bg-card);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.12);
}

.btn-delete {
  color: var(--state-danger);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
}

.empty-row {
  padding: var(--space-8);
  color: var(--text-secondary);
  text-align: center;
}

.sheet-stats,
.sheet-outputs {
  margin-top: var(--space-5);
  padding: var(--card-padding-md);
}

.sheet-stats h3,
.sheet-outputs h3 {
  margin-bottom: var(--space-3);
  color: var(--text-main);
  font-size: var(--text-h4);
  line-height: var(--leading-h4);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}

.stat-card {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: var(--bg-panel);
}

.stat-label {
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.stat-value {
  color: var(--text-main);
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--leading-body-sm);
}

.output-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.output-tag {
  display: inline-flex;
  align-items: center;
  min-height: var(--tag-height);
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--state-info-bg);
  color: var(--state-info);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

@media (max-width: 768px) {
  .sheet-page {
    padding-top: var(--space-5);
  }

  .sheet-header,
  .sheet-header-left {
    flex-direction: column;
  }

  .sheet-meta {
    grid-template-columns: 1fr;
  }

  .sheet-toolbar,
  .sheet-toolbar .btn,
  .import-label {
    width: 100%;
  }
}
</style>
