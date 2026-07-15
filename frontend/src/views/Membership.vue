<template>
  <div class="membership-page">
    <div class="container-wide workbench-stack">
      <div class="page-header text-center workbench-page-header">
        <p class="page-eyebrow">会员服务</p>
        <h1>按你要拿到的经营结果选择会员</h1>
        <p class="page-desc">从看清问题、开始执行、持续复盘到季度增长，把每一档会员对应到老板能落地的经营结果。</p>
      </div>

      <div class="plans-grid workbench-section">
        <div v-for="plan in outcomePricingPlans" :key="plan.code" class="plan-card card" :class="{ recommended: plan.recommended, featured: plan.featured }">
          <div v-if="plan.recommended" class="recommended-badge">推荐</div>
          <h3>{{ plan.name }}</h3>
          <p class="price">{{ plan.price }}</p>
          <p class="sub-price">{{ plan.subPrice }}</p>
          <p class="plan-outcome">{{ plan.outcome }}</p>
          <ul class="plan-features">
            <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
          </ul>
          <button class="btn" :class="plan.recommended || plan.featured ? 'btn-primary' : 'btn-secondary'" :disabled="creatingPlanCode === plan.code" @click="handleSelect(plan)">
            {{ creatingPlanCode === plan.code ? '处理中...' : plan.cta }}
          </button>
        </div>
      </div>

      <div class="privilege-section card workbench-section">
        <div class="section-head workbench-section-header">
          <div>
            <h2>权限说明</h2>
            <p>当前按前端已上线能力整理，可帮助你快速判断该开通哪一层。</p>
          </div>
        </div>
        <div class="privilege-table">
          <div class="privilege-row header">
            <div>能力</div>
            <div>免费版</div>
            <div>初阶版</div>
            <div>进阶版</div>
            <div>高阶版</div>
          </div>
          <div v-for="row in toolPrivileges" :key="row.name" class="privilege-row">
            <div class="tool-cell">
              <span class="tool-name">{{ row.name }}</span>
              <span class="badge" :class="row.badgeClass">{{ row.badge }}</span>
            </div>
            <div><span class="status-badge" :class="row.free ? 'status-success' : 'status-neutral'">{{ row.free ? '可用' : '锁定' }}</span></div>
            <div><span class="status-badge" :class="row.starter ? 'status-success' : 'status-neutral'">{{ row.starter ? '可用' : '锁定' }}</span></div>
            <div><span class="status-badge" :class="row.pro ? 'status-success' : 'status-neutral'">{{ row.pro ? '可用' : '锁定' }}</span></div>
            <div><span class="status-badge" :class="row.annual ? 'status-success' : 'status-neutral'">{{ row.annual ? '可用' : '锁定' }}</span></div>
          </div>
        </div>
      </div>

      <div class="faq-grid workbench-section">
        <div v-for="faq in faqs" :key="faq.q" class="faq-card card">
          <h3>{{ faq.q }}</h3>
          <p>{{ faq.a }}</p>
        </div>
      </div>

      <div class="feedback-section card workbench-section">
        <div>
          <p class="section-kicker">反馈协作</p>
          <h2>我要反馈</h2>
          <p class="feedback-desc">有任何需求建议或 Bug 报错，请告诉我们，我们会及时处理</p>
        </div>
        <div class="feedback-actions">
          <button class="btn btn-primary" @click="openFeedback('feature')">提交需求建议</button>
          <button class="btn btn-secondary" @click="openFeedback('bug')">提交 Bug 报错</button>
        </div>
      </div>

      <div class="my-feedback-section card workbench-section" v-if="myFeedbacks.length">
        <div class="section-head workbench-section-header">
          <div>
            <p class="section-kicker">处理进度</p>
            <h2>我的反馈记录</h2>
          </div>
        </div>
        <div class="feedback-list">
          <div v-for="fb in myFeedbacks" :key="fb.id" class="feedback-item">
            <span class="fb-type" :class="fb.type">{{ fb.type === 'feature' ? '需求' : 'Bug' }}</span>
            <span class="fb-title">{{ fb.title }}</span>
            <span class="fb-status" :class="fb.status">{{ statusText(fb.status) }}</span>
            <span class="fb-date">{{ formatDate(fb.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈弹窗 -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ feedbackForm.type === 'feature' ? '提交需求建议' : '提交 Bug 报错' }}</h3>
        <div class="form-group">
          <label>标题 *</label>
          <input v-model="feedbackForm.title" class="form-input" placeholder="简要描述你的反馈" maxlength="200" />
        </div>
        <div class="form-group">
          <label>详细描述</label>
          <textarea v-model="feedbackForm.description" class="form-textarea" rows="4" placeholder="请详细描述你的需求或遇到的问题..."></textarea>
        </div>
        <div class="form-group">
          <label>截图 URL（可选）</label>
          <input v-model="feedbackForm.image_url" class="form-input" placeholder="https://example.com/screenshot.png" />
          <p class="form-hint">可先将截图上传到图床，然后粘贴链接</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showModal = false">取消</button>
          <button class="btn btn-primary" @click="submitFeedback" :disabled="submitting">
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  MEMBER_LEVEL_ANNUAL,
  MEMBER_LEVEL_FREE,
  MEMBER_LEVEL_PRO,
  MEMBER_LEVEL_STARTER,
  canAccessLevel
} from '@/constants/membership'
import { allTools, pricingPlans, standaloneCapabilities } from '@/constants/toolCatalog'
import { createOrder } from '@/api/membership'
import request from '@/api/request'

const router = useRouter()
const userStore = useUserStore()
const creatingPlanCode = ref('')

const planOutcomeMap = {
  [MEMBER_LEVEL_FREE]: {
    outcome: '免费版：先看清经营卡点，知道今天该从哪里动手。',
    features: ['基础经营体检，找到获客、内容、转化或复购短板', '常用内容、话术和经营计算工具限量体验', '适合先验证问题方向和工具匹配度']
  },
  [MEMBER_LEVEL_STARTER]: {
    outcome: '初阶版：把每天该做的基础动作固定下来。',
    features: ['经营记录表、行业模板和基础执行工具', 'SOP、薪酬、排班、活动等门店基础管理能力', '适合建立每周固定执行节奏']
  },
  [MEMBER_LEVEL_PRO]: {
    outcome: '进阶版：从诊断进入 15 天作战表，持续提升获客和成交。',
    features: ['行业深度诊断和诊断后推荐动作', '15 天作战计划、专项执行工具和数据复盘', '适合系统提升抖音、小红书、私域和门店转化效率']
  },
  [MEMBER_LEVEL_ANNUAL]: {
    outcome: '高阶版：把短期执行升级成 90 天增长系统和专家校准。',
    features: ['包含进阶版全部诊断、计划、执行和复盘能力', '老板 IP、90 天战略、投流评估和高阶专项工具', '适合做长期品牌、增长节奏和关键动作校准']
  }
}

const outcomePricingPlans = computed(() => pricingPlans.map(plan => ({
  ...plan,
  ...(planOutcomeMap[plan.code] || {})
})))

const toolPrivileges = computed(() => {
  const capabilities = [...allTools, ...standaloneCapabilities]
  return capabilities.map(item => ({
    name: item.name,
    badge: item.badge,
    badgeClass: item.badgeClass,
    free: canAccessLevel(MEMBER_LEVEL_FREE, item.requiredLevel),
    starter: canAccessLevel(MEMBER_LEVEL_STARTER, item.requiredLevel),
    pro: canAccessLevel(MEMBER_LEVEL_PRO, item.requiredLevel),
    annual: canAccessLevel(MEMBER_LEVEL_ANNUAL, item.requiredLevel)
  }))
})

const faqs = [
  { q: '免费版适合谁？', a: '适合第一次接触产品、先想验证文案、计算和基础经营工具效果的老板。' },
  { q: '初阶版和进阶版差异是什么？', a: '初阶版偏行业模板和制度工具，进阶版开始进入更深的诊断分析、经营方案和平台经营能力。' },
  { q: '高阶版为什么更贵？', a: '高阶版包含老板 IP 打造、深度策略工具和更完整的长期经营支持能力。' },
  { q: '企业增长在哪一层？', a: '当前归在进阶版能力层，对应独立的企业增长全景顾问，适合已经想系统梳理经营问题的用户。' },
  { q: '升级后权限会自动叠加吗？', a: '会。高阶版包含前面所有层级能力，进阶版包含免费版和初阶版能力。' },
  { q: '现在显示的价格是最终版吗？', a: '不是最终合同价，而是当前 v4 页面方案中的公开定价展示。' }
]

async function handleSelect(plan) {
  if (plan.code === MEMBER_LEVEL_FREE) {
    router.push('/tools')
    return
  }

  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/membership' } })
    return
  }

  creatingPlanCode.value = plan.code
  try {
    const order = await createOrder(plan.code)
    if (order?.payUrl) {
      window.location.href = order.payUrl
      return
    }
    alert(order?.orderId ? `订单已创建，订单号：${order.orderId}` : '订单已创建，请按页面提示完成支付')
  } catch (error) {
    alert(error.message || '创建订单失败，请稍后重试')
  } finally {
    creatingPlanCode.value = ''
  }
}

// === 反馈相关 ===
const showModal = ref(false)
const submitting = ref(false)
const myFeedbacks = ref([])
const feedbackForm = ref({ type: 'feature', title: '', description: '', image_url: '' })

function openFeedback(type) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/membership' } })
    return
  }
  feedbackForm.value = { type, title: '', description: '', image_url: '' }
  showModal.value = true
}

async function submitFeedback() {
  if (!feedbackForm.value.title.trim()) {
    alert('请填写反馈标题')
    return
  }
  submitting.value = true
  try {
    await request.post('/user-feedback', feedbackForm.value)
    alert('反馈提交成功')
    showModal.value = false
    await loadMyFeedbacks()
  } catch (error) {
    alert(error.message || '网络异常，请重试')
  } finally {
    submitting.value = false
  }
}

async function loadMyFeedbacks() {
  try {
    myFeedbacks.value = await request.get('/user-feedback/my')
  } catch (error) {}
}

function statusText(s) {
  return { pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }[s] || s
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => {
  if (userStore.isLoggedIn) loadMyFeedbacks()
})
</script>

<style scoped>
.membership-page {
  padding: var(--space-7) 0 var(--space-10);
  background:
    radial-gradient(circle at 82% 0%, rgba(14, 165, 233, 0.08), transparent 30rem),
    var(--bg-workbench);
}

.page-header {
  margin-bottom: 0;
}

.page-header h1 {
  margin-bottom: var(--space-2);
}

.page-desc {
  max-width: 760px;
  margin: 0 auto;
}

.page-eyebrow {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.page-desc,
.section-head p,
.faq-card p,
.plan-outcome,
.sub-price {
  color: var(--text-secondary);
}

.plans-grid,
.faq-grid {
  display: grid;
  gap: var(--space-4);
}

.plans-grid {
  grid-template-columns: repeat(4, 1fr);
  align-items: stretch;
}

.plan-card,
.privilege-section,
.faq-card,
.feedback-section,
.my-feedback-section {
  padding: var(--card-padding-md);
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  min-height: 420px;
  border-color: var(--line-soft);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.plan-card.recommended,
.plan-card.featured {
  border-color: var(--brand-primary);
  background: linear-gradient(180deg, rgba(239, 246, 255, 0.9), var(--bg-card) 36%);
}

.recommended-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  padding: 4px 10px;
  border-radius: 9999px;
  background: var(--brand-primary);
  color: white;
  font-size: var(--text-caption);
}

.price {
  font-size: var(--text-h2);
  font-weight: var(--font-weight-bold);
  color: var(--text-main);
}

.plan-outcome {
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.plan-features {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-left: 0;
  flex: 1;
  list-style: none;
}

.plan-features li {
  position: relative;
  padding-left: 18px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.plan-features li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.72em;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--state-success);
}

.section-head {
  margin-bottom: var(--space-4);
}

.section-kicker {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.privilege-section,
.feedback-section,
.my-feedback-section {
  border-color: var(--line-soft);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-card);
}

.privilege-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
}

.privilege-row {
  display: grid;
  grid-template-columns: 2.2fr repeat(4, 1fr);
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--line-soft);
  align-items: center;
}

.privilege-row.header {
  font-weight: var(--font-weight-semibold);
  background: var(--bg-panel);
  color: var(--text-secondary);
}

.privilege-row:last-child {
  border-bottom: 0;
}

.tool-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.faq-grid {
  grid-template-columns: repeat(3, 1fr);
}

.faq-card {
  min-height: 168px;
  border-color: var(--line-soft);
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.faq-card h3 {
  margin-bottom: var(--space-3);
}

@media (max-width: 1023px) {
  .plans-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .faq-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .privilege-row {
    grid-template-columns: 2fr repeat(4, 1fr);
  }
}

@media (max-width: 639px) {
  .plans-grid,
  .faq-grid {
    grid-template-columns: 1fr;
  }

  .feedback-section {
    align-items: flex-start;
    flex-direction: column;
  }

  .feedback-actions {
    justify-content: flex-start;
    width: 100%;
  }

  .privilege-table {
    overflow-x: auto;
  }

  .privilege-row {
    min-width: 760px;
  }
}

/* 反馈区块 */
.feedback-section,
.my-feedback-section {
  margin-top: 0;
}

.feedback-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.feedback-section h2,
.my-feedback-section h2 {
  margin-bottom: var(--space-3);
}

.feedback-desc {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}

.feedback-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.feedback-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
  font-size: var(--text-body-sm);
}

.fb-type {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
  font-weight: 600;
}

.fb-type.feature { background: #dbeafe; color: #1e40af; }
.fb-type.bug { background: #fee2e2; color: #991b1b; }

.fb-title { flex: 1; }

.fb-status {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: var(--text-caption);
}

.fb-status.pending { background: var(--state-warning-bg); color: var(--state-warning); }
.fb-status.processing { background: var(--state-info-bg); color: var(--state-info); }
.fb-status.resolved { background: var(--state-success-bg); color: var(--state-success); }
.fb-status.closed { background: var(--state-locked-bg); color: var(--state-locked); }

.fb-date { color: var(--text-secondary); font-size: var(--text-caption); }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  padding: var(--space-6);
  border-radius: var(--radius-modal);
  width: 90%;
  max-width: 500px;
}

.modal h3 { margin-bottom: var(--space-4); }

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  margin-bottom: var(--space-2);
  font-weight: 600;
  font-size: var(--text-body-sm);
}

.form-textarea {
  width: 100%;
  padding: var(--space-3);
  border: 1px solid var(--line-default);
  border-radius: var(--radius-input);
  font-family: inherit;
  font-size: var(--text-body-md);
  resize: vertical;
}

.form-hint {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  margin-top: var(--space-4);
}
</style>
