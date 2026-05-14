<template>
  <ToolDetail :tool-info="toolInfo" :quota-info="quotaInfo" :result="result" @submit="handleSubmit" @load-quota="loadQuota">
    <template #inputs>
      <div class="meituan-form">
        <div class="form-group">
          <label class="form-label">行业类型</label>
          <select v-model="form.industry" class="form-input">
            <option value="restaurant">餐饮</option>
            <option value="retail">零售</option>
            <option value="service">生活服务</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">月均订单量</label>
          <input
            v-model="form.monthlyOrders"
            type="number"
            class="form-input"
            placeholder="美团平台月均有效订单数"
            min="0"
          />
        </div>
        <div class="form-group">
          <label class="form-label">月均营业额（元）</label>
          <input
            v-model="form.monthlySales"
            type="number"
            class="form-input"
            placeholder="美团平台月均营业额"
            min="0"
          />
        </div>
        <div class="form-group">
          <label class="form-label">平台抽成比例（%）</label>
          <input
            v-model="form.platformRate"
            type="number"
            class="form-input"
            placeholder="美团平台抽成比例"
            min="0"
            max="30"
            step="0.1"
          />
        </div>
        <div class="form-group">
          <label class="form-label">复购率（%）</label>
          <input
            v-model="form.repurchaseRate"
            type="number"
            class="form-input"
            placeholder="老客户占比"
            min="0"
            max="100"
          />
        </div>
        <div class="form-group">
          <label class="form-label">主要问题（可多选）</label>
          <div class="checkbox-group">
            <label class="checkbox-label" v-for="issue in issueOptions" :key="issue.value">
              <input type="checkbox" v-model="form.issues" :value="issue.value" />
              {{ issue.label }}
            </label>
          </div>
        </div>
      </div>
    </template>
  </ToolDetail>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ToolDetail from '@/components/ToolDetail.vue'
import { getToolByCode } from '@/constants/toolCatalog'
import { getToolQuota } from '@/api/tool'
import { generateTool } from '@/api/index.js'

const toolInfo = getToolByCode('meituan')

const quotaInfo = ref(null)
const result = ref(null)

const issueOptions = [
  { value: 'orders_low', label: '订单量少' },
  { value: 'price_high', label: '价格竞争力弱' },
  { value: 'review_bad', label: '差评多' },
  { value: 'exposure_low', label: '曝光不足' },
  { value: 'conversion_low', label: '转化率低' },
  { value: 'cost_high', label: '成本过高' }
]

const form = reactive({
  industry: 'restaurant',
  monthlyOrders: '',
  monthlySales: '',
  platformRate: '',
  repurchaseRate: '',
  issues: []
})

async function loadQuota() {
  try {
    const data = await getToolQuota('meituan')
    quotaInfo.value = data
  } catch (e) {
    // Silently fail
  }
}

async function handleSubmit() {
  try {
    result.value = await generateTool('meituan', {
      industry: form.industry,
      monthlyOrders: Number(form.monthlyOrders) || 0,
      monthlySales: Number(form.monthlySales) || 0,
      platformRate: Number(form.platformRate) || 0,
      repurchaseRate: Number(form.repurchaseRate) || 0,
      issues: [...form.issues]
    })
  } catch (e) {
    result.value = { error: e.message || '诊断失败，请稍后重试' }
  }
}
</script>

<style scoped>
.meituan-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  font-size: var(--text-body-sm);
  cursor: pointer;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
}
</style>
