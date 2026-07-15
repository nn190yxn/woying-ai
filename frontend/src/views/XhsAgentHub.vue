<template>
  <div class="xhs-agent-hub">
    <div class="hub-header container-wide workbench-page-header">
      <p class="section-eyebrow">小红书经营工作台</p>
      <h1 class="hub-title">小红书增长智能体矩阵</h1>
      <p class="hub-desc">按账号体检、起号计划、内容执行、数据复盘推进，从种草到变现形成闭环。</p>
    </div>

    <section class="mainline-section container-wide workbench-section">
      <div class="mainline-head workbench-section-header">
        <div>
          <p class="section-eyebrow">主线作战路径</p>
          <h2>先体检，再起号，执行后复盘</h2>
        </div>
        <p>围绕本地生活老板的小红书获客链路，优先使用这 6 个入口。</p>
      </div>
      <div class="mainline-grid">
        <button
          v-for="agent in mainlineAgents"
          :key="agent.code"
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

    <div class="hub-cta container-wide">
      <div class="cta-card card workbench-action-panel">
        <h3>17 个智能体还不够？</h3>
        <p>资深小红书运营专家 1 对 1 指导，为您量身定制完整增长方案</p>
        <button class="cta-btn" @click="$router.push('/membership')">升级会员，预约专家咨询</button>
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

const mainlineAgents = [
  { step: '01', code: 'account-diagnosis', name: '账号体检', desc: '先定位账号、内容、搜索和转化短板', level: 'free', levelText: '免费体验', levelClass: 'level-free' },
  { step: '02', code: 'quick-start-plan', name: '15 天起号计划', desc: '把账号问题拆成起号节奏和每日动作', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '03', code: 'note-diagnoser', name: '笔记数据诊断', desc: '用小眼睛、互动和收藏数据判断问题', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '04', code: 'account-reviewer', name: '账号复盘', desc: '按周/月复盘趋势，找到有效内容规律', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '05', code: 'conversion-optimizer', name: '转化链路', desc: '检查主页、私信、引流和成交承接', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '06', code: 'growth-strategy', name: '90 天增长战略', desc: '从起号动作进入季度增长节奏', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
]

const agentGroups = [
  {
    id: 'diagnosis', icon: '📊', name: '账号体检',
    agents: [
      { code: 'account-diagnosis', name: '账号体检表', emoji: '🩺', desc: '五维健康度评分，快速定位账号问题', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 2 次/天' }
    ]
  },
  {
    id: 'planning', icon: '📅', name: '作战计划',
    agents: [
      { code: 'quick-start-plan', name: '15 天起号计划', emoji: '📅', desc: '新号冷启动节奏表，快速建立标签', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'growth-strategy', name: '90 天增长战略', emoji: '🗺️', desc: '阶段骨架展示，详情引导 1v1', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
    ]
  },
  {
    id: 'content', icon: '📝', name: '内容创作（高频）',
    agents: [
      { code: 'topic-generator', name: '爆款选题库', emoji: '💡', desc: '5 大公式 + 搜索意图，精准选题', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter', usageHint: '每日 10 个' },
      { code: 'script-generator', name: '正文脚本生成', emoji: '📝', desc: '6 大结构模板，图文/视频全覆盖', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
      { code: 'title-generator', name: '标题生成器', emoji: '✍️', desc: '12 种公式 + 行业案例库', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
      { code: 'cover-helper', name: '封面文案助手', emoji: '🎨', desc: '3:4 规范 + 高点击钩子词', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' }
    ]
  },
  {
    id: 'conversion', icon: '💰', name: '转化经营',
    agents: [
      { code: 'conversion-optimizer', name: '转化链路优化', emoji: '🔗', desc: '合规 SOP 检查，安全引流', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'competitor-analyzer', name: '竞对分析器', emoji: '🎯', desc: '对标拆解 + 差异化定位', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' },
      { code: 'grass-converter', name: '种草转化计算器', emoji: '🧮', desc: '阅读→成交漏斗 ROI 计算', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'traffic', icon: '🚀', name: '流量专项',
    agents: [
      { code: 'shutiao-calculator', name: '薯条投放计算器', emoji: '🍟', desc: 'CPM/ROI 预估，判断值不值得投', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 3 次/天' },
      { code: 'juguang-strategy', name: '聚光投放策略', emoji: '🔦', desc: '专业投放指南，跑量获客', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'ip', icon: '👤', name: 'IP 与人设',
    agents: [
      { code: 'ip-positioning', name: '博主 IP 定位', emoji: '🌟', desc: '性格 + 行业，生成专属人设', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' },
      { code: 'ip-consistency', name: '人设一致性检查', emoji: '🔎', desc: '风格/语气/视觉评估', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
    ]
  },
  {
    id: 'review', icon: '📈', name: '数据复盘',
    agents: [
      { code: 'note-diagnoser', name: '笔记数据诊断', emoji: '🔍', desc: '小眼睛/互动/截图率多维分析', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'account-reviewer', name: '账号复盘助手', emoji: '📊', desc: '周/月趋势分析，找爆款规律', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'seo-optimizer', name: 'SEO 关键词优化', emoji: '🔎', desc: '搜索排名 + 长尾词挖掘', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
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
  router.push(`/xhs/${agent.code}`)
}
</script>

<style scoped>
@import './agent-common.css';

.xhs-agent-hub {
  min-height: 100vh;
  padding-bottom: var(--space-10);
  background:
    radial-gradient(circle at 88% 0%, rgba(244, 63, 94, 0.08), transparent 30rem),
    var(--bg-workbench);
}

.hub-header {
  padding: var(--space-7) var(--space-5) var(--space-5);
  margin-bottom: var(--space-5);
  color: var(--text-main);
  background: transparent;
  text-align: center;
}

.hub-title {
  margin-bottom: var(--space-2);
  color: var(--text-main);
}

.hub-desc {
  max-width: 720px;
  margin: 0 auto;
  color: var(--text-secondary);
  opacity: 1;
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

.section-eyebrow {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 6px;
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
  border-radius: var(--radius-card);
  border: 1px solid var(--line-soft);
  background: var(--bg-card);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.mainline-card:hover {
  transform: translateY(-2px);
  border-color: rgba(244, 63, 94, 0.24);
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
  border-radius: 20px;
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
  color: var(--text-main);
}

.agent-cards {
  gap: var(--space-4);
}

.agent-card {
  min-height: 176px;
  padding: var(--space-4);
  border-color: var(--line-soft);
  border-radius: var(--radius-card);
  background: var(--bg-card);
}

.agent-card:hover {
  border-color: rgba(244, 63, 94, 0.24);
  box-shadow: var(--shadow-card);
}

.agent-card.locked .agent-lock-overlay {
  opacity: 1;
  pointer-events: auto;
}

.agent-name,
.lock-text {
  color: var(--text-main);
}

.agent-desc,
.cta-card p {
  color: var(--text-secondary);
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
  color: var(--text-muted);
}

.hub-cta {
  padding: var(--space-5) 0 0;
}

.cta-card {
  padding: var(--space-6);
  border: 1px solid rgba(244, 63, 94, 0.18);
  border-radius: var(--radius-panel);
  background: linear-gradient(135deg, rgba(255, 241, 242, 0.95), rgba(255, 255, 255, 0.96));
}

.cta-card h3 {
  color: var(--text-main);
}

.cta-btn {
  min-height: var(--button-height-md);
  padding: 0 var(--space-6);
  border-radius: var(--radius-btn);
  background: var(--brand-primary);
}

.cta-btn:hover {
  background: var(--brand-primary-hover);
}

@media (max-width: 1180px) {
  .mainline-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .mainline-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .mainline-grid {
    grid-template-columns: 1fr;
  }
}
</style>
