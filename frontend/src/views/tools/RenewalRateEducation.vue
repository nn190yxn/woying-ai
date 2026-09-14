<template>
  <ToolDetail :tool-info="toolInfo" :result="result" @submit="handleSubmit">
    <template #inputs>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">到期学员数</label>
          <input v-model.number="form.expiredStudents" type="number" class="form-input" placeholder="本期课程到期的学员" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">续费学员数</label>
          <input v-model.number="form.renewedStudents" type="number" class="form-input" placeholder="到期后续费的学员" min="0" />
        </div>
      </div>
      <div class="form-row" style="margin-top: var(--space-4);">
        <div class="form-group">
          <label class="form-label">新学员数（可选）</label>
          <input v-model.number="form.newStudents" type="number" class="form-input" placeholder="本期新增学员" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">上期学员总数</label>
          <input v-model.number="form.totalStudents" type="number" class="form-input" placeholder="上期在校学员总数" min="1" />
        </div>
      </div>
    </template>
    <template #result>
      <div class="renewal-result" v-if="result">
        <div class="result-main">
          <div class="result-label">续费率</div>
          <div class="result-value numeral">{{ result.rate }}</div>
          <div class="result-status" :class="result.status">{{ result.statusText }}</div>
        </div>
        <div class="result-details">
          <div class="detail-item">
            <span>到期学员</span>
            <span class="numeral">{{ form.expiredStudents }} 人</span>
          </div>
          <div class="detail-item">
            <span>续费学员</span>
            <span class="numeral">{{ form.renewedStudents }} 人</span>
          </div>
          <div class="detail-item" v-if="form.newStudents">
            <span>新增学员</span>
            <span class="numeral">{{ form.newStudents }} 人</span>
          </div>
          <div class="detail-item">
            <span>总学员留存率</span>
            <span class="numeral">{{ result.retentionRate }}%</span>
          </div>
        </div>
        <div class="result-revenue" v-if="result.revenueLoss">
          <h4>收入影响估算</h4>
          <div class="revenue-row">
            <span>未续费损失</span>
            <span class="numeral warn">¥{{ result.revenueLoss }}</span>
          </div>
        </div>
        <div class="result-suggestion" v-if="result.suggestion">
          <h4>优化建议</h4>
          <p>{{ result.suggestion }}</p>
        </div>
        <div class="result-reference">
          <h4>行业参考</h4>
          <p>{{ result.reference }}</p>
        </div>
      </div>
    </template>
  </ToolDetail>
</template>

<script setup>
import { ref, reactive } from 'vue'
import ToolDetail from '@/components/ToolDetail.vue'
import { getToolByCode } from '@/constants/toolCatalog'

const toolInfo = getToolByCode('renewal-rate-education')

const form = reactive({
  expiredStudents: null,
  renewedStudents: null,
  newStudents: null,
  totalStudents: null
})

const result = ref(null)

function handleSubmit() {
  if (!form.expiredStudents || !form.renewedStudents || form.expiredStudents <= 0) {
    result.value = { error: '请输入有效的到期学员数和续费学员数' }
    return
  }
  if (form.renewedStudents > form.expiredStudents) {
    result.value = { error: '续费学员数不能大于到期学员数' }
    return
  }

  const rate = (form.renewedStudents / form.expiredStudents) * 100

  let retentionRate = null
  if (form.totalStudents && form.totalStudents > 0) {
    retentionRate = ((form.totalStudents - form.expiredStudents + form.renewedStudents + (form.newStudents || 0)) / form.totalStudents * 100).toFixed(1)
  }

  let status = 'warning'
  let statusText = '及格'
  let suggestion = ''
  let reference = '少儿体育机构可结合课程周期、出勤和剩余课时持续观察'

  if (rate >= 85) {
    status = 'success'
    statusText = '优秀'
    suggestion = '续费率优秀，说明在读服务获得家长认可。建议：1）整理训练表现和教练反馈；2）关注剩余课时；3）邀请满意家长参与老带新。'
  } else if (rate >= 70) {
    status = 'success'
    statusText = '达标'
    suggestion = '续费率在合理范围内。建议：1）结合出勤和训练表现跟进家长；2）关注剩余课时并提前沟通续费；3）持续提供教练反馈。'
  } else if (rate >= 50) {
    status = 'warning'
    statusText = '偏低'
    suggestion = '续费率偏低，学员流失较明显。建议：1）结合出勤、训练表现和教练反馈分析原因；2）按剩余课时提前沟通续费；3）确认家长当前顾虑。'
  } else {
    status = 'danger'
    statusText = '严重'
    suggestion = '续费率过低，大量学员流失！需要紧急排查：1）出勤是否异常；2）训练表现和教练反馈是否清楚；3）续费沟通是否及时。'
  }

  let revenueLoss = null
  if (form.newStudents) {
    const lost = form.expiredStudents - form.renewedStudents
    revenueLoss = (lost * 2000).toLocaleString()
  }

  result.value = {
    rate: rate.toFixed(1) + '%',
    retentionRate: retentionRate,
    status,
    statusText,
    suggestion,
    reference,
    revenueLoss
  }
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-label {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-input {
  padding: var(--space-3);
  border: 1px solid var(--line-default);
  border-radius: var(--radius-md);
  font-size: var(--text-body);
}

.renewal-result {
  padding: var(--space-4);
  background-color: var(--bg-base);
  border-radius: var(--radius-card);
}

.result-main {
  text-align: center;
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}

.result-label {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.result-value {
  font-size: 56px;
  font-weight: var(--font-weight-bold);
  color: var(--text-main);
  line-height: 1;
  margin-bottom: var(--space-3);
}

.result-status {
  display: inline-block;
  padding: var(--space-1) var(--space-4);
  border-radius: 9999px;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
}

.result-status.success {
  background-color: #dcfce7;
  color: #166534;
}

.result-status.warning {
  background-color: #fef3c7;
  color: #92400e;
}

.result-status.danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.result-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-top: var(--space-4);
  border-top: 1px solid var(--line-default);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
}

.result-revenue {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: white;
}

.result-revenue h4 {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.revenue-row {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-body-sm);
}

.revenue-row .warn {
  color: #dc2626;
  font-weight: var(--font-weight-semibold);
}

.result-suggestion,
.result-reference {
  margin-top: var(--space-4);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: white;
}

.result-suggestion h4,
.result-reference h4 {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.result-suggestion p,
.result-reference p {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  line-height: var(--leading-body-lg);
}
</style>
