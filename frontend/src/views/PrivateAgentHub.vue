<template>
  <div class="private-agent-hub">
    <div class="hub-header container-wide workbench-page-header">
      <p class="section-eyebrow">家长跟进工作台</p>
      <h1 class="hub-title">家长跟进与在读服务</h1>
      <p class="hub-desc">按家长当前状态安排联系、邀约、体验回访、报名和续费动作。</p>
    </div>

    <section class="mainline-section container-wide workbench-section">
      <div class="mainline-head workbench-section-header">
        <div>
          <p class="section-eyebrow">家长跟进顺序</p>
          <h2>新咨询 → 联系邀约 → 体验回访 → 报名与在读服务</h2>
        </div>
        <p>按顺序推进并记录：新咨询、待联系、待邀约、已约体验、体验后回访、已报名、暂未报名。</p>
      </div>
      <div class="parent-status-flow" aria-label="家长跟进状态顺序"><span v-for="status in parentStatuses" :key="status">{{ status }}</span></div>
      <div class="mainline-grid">
        <button
          v-for="agent in mainlineAgents"
          :key="agent.code"
          type="button"
          class="mainline-card"
          :class="{ locked: getAgentLocked(agent) }"
          @click="openAgent(agent)"
        >
          <span class="mainline-step">{{ agent.step }}</span>
          <strong>{{ agent.name }}</strong>
          <span>{{ agent.desc }}</span>
          <em :class="agent.levelClass">{{ agent.levelText }}</em>
          <small v-if="getAgentLocked(agent)" class="lock-hint">{{ getLockText(agent) }}</small>
        </button>
      </div>
    </section>

    <div class="hub-grid container-wide workbench-stack">
      <div v-for="group in agentGroups" :key="group.id" class="agent-group card workbench-section">
        <h2 class="group-title">
          <span class="group-icon">{{ group.icon }}</span>
          {{ group.name }}
        </h2>
        <div class="agent-cards">
          <div v-for="agent in group.agents" :key="agent.code" class="agent-card" :class="{ locked: getAgentLocked(agent) }" @click="openAgent(agent)">
            <div class="agent-card-header">
              <span class="agent-emoji">{{ agent.emoji }}</span>
              <span class="agent-name">{{ agent.name }}</span>
            </div>
            <p class="agent-desc">{{ agent.desc }}</p>
            <div class="agent-card-footer">
              <span class="agent-level" :class="agent.levelClass">{{ agent.levelText }}</span>
              <span v-if="agent.usageHint" class="agent-usage">{{ agent.usageHint }}</span>
            </div>
            <div v-if="getAgentLocked(agent)" class="agent-lock-overlay">
              <span class="lock-icon">🔒</span>
              <span class="lock-text">{{ getLockText(agent) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="action-library container-wide card workbench-section">
      <div class="library-header workbench-section-header">
        <div>
          <p class="library-kicker">诊断后推荐进入</p>
          <h2 class="library-title">家长服务动作库</h2>
        </div>
        <p class="library-desc">先做好家长跟进、在读服务和续费，再按实际问题选择动作。</p>
      </div>
      <div class="library-groups">
        <div v-for="group in actionLibraryGroups" :key="group.id" class="library-group">
          <h3 class="library-group-title">{{ group.name }}</h3>
          <div class="library-actions">
            <button
              v-for="agent in group.agents"
              :key="agent.code"
              type="button"
              class="library-action"
              :class="{ locked: getAgentLocked(agent) }"
              @click="openAgent(agent)"
            >
              <span class="library-action-name">{{ agent.name }}</span>
              <span class="library-action-level" :class="agent.levelClass">{{ agent.levelText }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="hub-cta container-wide">
      <div class="cta-card card workbench-action-panel">
        <h3>需要完整家长跟进方案？</h3>
        <p>系统整理沟通底稿，真人顾问结合机构情况确认重点和纠偏。</p>
        <button class="cta-btn" @click="bookConsultation">预约真人顾问沟通</button>
      </div>
    </div>

    <router-view />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { canAccessLevel, getMemberLevelLabel } from '@/constants/membership'

const router = useRouter()
const userStore = useUserStore()

const parentStatuses = ['新咨询', '待联系', '待邀约', '已约体验', '体验后回访', '已报名', '暂未报名']

const mainlineAgents = [
  { step: '01', code: 'diagnosis', name: '家长跟进检查', desc: '先判断家长跟进、在读服务、续费和报名短板', level: 'free', levelText: '免费体验', levelClass: 'level-free' },
  { step: '02', code: 'member-design', name: '在读家长服务', desc: '设计储值、等级权益、会员日和复购机制', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '03', code: 'retention-plan', name: '续费跟进', desc: '按咨询到续费过程安排跟进和重新联系', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '04', code: 'community-sop', name: '家长群服务安排', desc: '沉淀每日运营日历、互动动作和风险边界', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
  { step: '05', code: 'private-dashboard', name: '家长跟进看板', desc: '把家长联系、在读服务、续费和老带新记录放进复盘入口', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '06', code: 'full-strategy', name: '90 天战略', desc: '从单点动作升级为季度家长服务节奏', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
]

const agentGroups = [
  {
    id: 'core',
    icon: '📊',
    name: '家长服务核心入口',
    agents: [
      { code: 'diagnosis', name: '家长跟进检查', emoji: '🩺', desc: '先检查家长信息记录、社群互动、续费和报名跟进短板', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 2 次/天' },
      { code: 'member-design', name: '在读家长服务', emoji: '💳', desc: '设计在读服务、家长沟通、续费提醒和老带新安排', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'retention-plan', name: '续费跟进', emoji: '📈', desc: '按咨询到续费过程安排沟通节奏', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'community-sop', name: '家长群服务安排', emoji: '📋', desc: '生成每日家长群服务安排、互动动作和注意事项', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter', usageHint: '每日可用' },
      { code: 'cac-ltv', name: 'CAC vs LTV', emoji: '📐', desc: '对比获客成本和客户终身价值，判断增长是否健康', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 3 次/天' },
      { code: 'full-strategy', name: '90 天家长服务计划', emoji: '🗺️', desc: '把家长跟进检查结果拆成季度阶段目标和执行节奏', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
    ]
  }
]

const actionLibraryGroups = [
  {
    id: 'community-actions',
    name: '社群激活动作',
    agents: [
      { code: 'activity-planner', name: '社群活动策划', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
      { code: 'engagement-boost', name: '社群活跃度提升', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' }
    ]
  },
  {
    id: 'member-actions',
    name: '会员成交动作',
    agents: [
      { code: 'tier-pricing', name: '会员等级定价', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'loyalty-program', name: '忠诚度计划设计', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'recharge-design', name: '储值方案设计', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'retention-actions',
    name: '续费与重新联系',
    agents: [
      { code: 'churn-prevention', name: '家长续费预警', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'reactivation', name: '暂未报名家长再联系', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'growth-actions',
    name: '老带新与跟进记录',
    agents: [
      { code: 'fission-design', name: '老带新方案设计', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' },
      { code: 'referral-system', name: '老带新安排', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'viral-campaign', name: '家长推荐活动策划', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'private-dashboard', name: '家长跟进看板', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  }
]

const getAgentLocked = (agent) => {
  return !canAccessLevel(userStore.memberLevel, agent.level)
}

const getLockText = (agent) => {
  const requiredLabel = getMemberLevelLabel(agent.level)
  return userStore.isLoggedIn ? `需升级到${requiredLabel}` : `登录后查看${requiredLabel}权益`
}

const openAgent = (agent) => {
  if (getAgentLocked(agent)) {
    router.push('/membership')
    return
  }
  router.push(`/private/${agent.code}`)
}

const bookConsultation = () => {
  router.push('/consultation')
}
</script>

<style scoped>
.private-agent-hub {
  min-height: 100vh;
  background:
    radial-gradient(circle at 16% 0%, rgba(20, 184, 166, 0.08), transparent 28rem),
    var(--bg-workbench);
  padding-bottom: var(--space-10);
}

.hub-header {
  padding: var(--space-7) var(--space-5) var(--space-5);
  text-align: center;
}

.hub-title {
  font-size: var(--text-h2);
  font-weight: var(--font-weight-bold);
  color: var(--text-main);
  margin-bottom: var(--space-2);
}

.hub-desc {
  max-width: 760px;
  margin: 0 auto;
  font-size: var(--text-body);
  color: var(--text-secondary);
}

.section-eyebrow {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.mainline-section {
  padding: var(--space-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-card);
}

.mainline-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.mainline-head h2 {
  font-size: var(--text-h3);
  color: var(--text-main);
}

.mainline-head p:last-child {
  max-width: 420px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.parent-status-flow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.parent-status-flow span{padding:8px 12px;border-radius:9999px;background:var(--bg-card);border:1px solid var(--line-soft);font-weight:600}

.mainline-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-3);
}

.mainline-card {
  display: flex;
  min-width: 0;
  min-height: 184px;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.mainline-card:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 184, 166, 0.24);
  box-shadow: var(--shadow-card);
}

.mainline-card.locked {
  background: var(--state-warning-bg);
}

.mainline-step {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-bold);
}

.mainline-card strong {
  color: var(--text-main);
  font-size: var(--text-body-lg);
}

.mainline-card span:not(.mainline-step) {
  color: var(--text-secondary);
  font-size: var(--text-body-sm);
  line-height: 1.5;
}

.mainline-card em {
  width: fit-content;
  margin-top: auto;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: var(--text-caption);
  font-style: normal;
  font-weight: var(--font-weight-semibold);
}

.lock-hint {
  color: var(--state-warning);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  line-height: 1.4;
}

.hub-grid {
  margin-top: var(--space-5);
  padding: 0;
}

.agent-group {
  padding: var(--card-padding-md);
  border-color: var(--line-soft);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-card);
}

.group-title {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.group-icon {
  font-size: 20px;
}

.agent-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-4);
}

.agent-card {
  min-height: 176px;
  background: var(--bg-card);
  border-radius: var(--radius-card);
  padding: var(--space-4);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  border: 1px solid var(--line-soft);
  overflow: hidden;
}

.agent-card:hover {
  transform: translateY(-2px);
  border-color: rgba(20, 184, 166, 0.24);
  box-shadow: var(--shadow-card);
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.agent-emoji {
  font-size: 24px;
}

.agent-name {
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.agent-desc {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.5;
}

.agent-card-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-level {
  font-size: var(--text-caption);
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: var(--font-weight-semibold);
}

.level-free {
  background: var(--state-success-bg);
  color: var(--state-success);
}

.level-starter {
  background: var(--state-info-bg);
  color: var(--state-info);
}

.level-pro {
  background: rgba(99, 102, 241, 0.12);
  color: var(--brand-accent);
}

.level-annual {
  background: var(--state-warning-bg);
  color: var(--state-warning);
}

.agent-usage {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.agent-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.agent-card.locked .agent-lock-overlay {
  pointer-events: auto;
}

.lock-icon {
  font-size: 28px;
}

.lock-text {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-semibold);
  text-align: center;
}

.action-library {
  padding: var(--card-padding-md);
  margin-top: var(--space-5);
  border-color: var(--line-soft);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-card);
}

.library-header {
  display: flex;
  justify-content: space-between;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.library-kicker {
  margin-bottom: 4px;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  color: var(--brand-primary);
}

.library-title {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.library-desc {
  max-width: 420px;
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  line-height: 1.6;
}

.library-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
}

.library-group {
  min-width: 0;
  padding: var(--space-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
}

.library-group-title {
  margin-bottom: 12px;
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.library-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.library-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
  color: var(--text-main);
  cursor: pointer;
  text-align: left;
}

.library-action:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-card);
}

.library-action.locked {
  background: var(--state-warning-bg);
}

.library-action-name {
  min-width: 0;
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  overflow-wrap: anywhere;
}

.library-action-level {
  flex: 0 0 auto;
  font-size: var(--text-caption);
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: var(--font-weight-semibold);
}

.hub-cta {
  padding-top: var(--space-5);
}

.cta-card {
  background: linear-gradient(135deg, rgba(240, 253, 250, 0.95), rgba(255, 255, 255, 0.96));
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: var(--radius-panel);
  padding: var(--space-6);
  text-align: center;
  color: var(--text-main);
}

.cta-card h3 {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
  margin-bottom: 8px;
}

.cta-card p {
  font-size: var(--text-body);
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.cta-btn {
  min-height: var(--button-height-md);
  padding: 0 var(--space-6);
  background: var(--brand-primary);
  color: white;
  border: none;
  border-radius: var(--radius-btn);
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.2s;
}

.cta-btn:hover {
  background: var(--brand-primary-hover);
  box-shadow: var(--shadow-card);
}

@media (max-width: 1180px) {
  .parent-status-flow{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}.parent-status-flow span{padding:8px 12px;border-radius:9999px;background:var(--bg-card);border:1px solid var(--line-soft);font-weight:600}

.mainline-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .mainline-head,
  .library-header {
    flex-direction: column;
    gap: 8px;
  }

  .mainline-grid,
  .agent-cards {
    grid-template-columns: 1fr;
  }
}
</style>
