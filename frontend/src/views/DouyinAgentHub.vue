<template>
  <div class="douyin-agent-hub">
    <div class="hub-header container-wide workbench-page-header">
      <p class="section-eyebrow">抖音经营工作台</p>
      <h1 class="hub-title">抖音增长智能体矩阵</h1>
      <p class="hub-desc">每个智能体专注一个环节，按体检、计划、执行、复盘的顺序推进。</p>
    </div>

    <section class="mainline-section container-wide workbench-section">
      <div class="mainline-head workbench-section-header">
        <div>
          <p class="section-eyebrow">主线作战路径</p>
          <h2>先体检，再计划，执行后复盘</h2>
        </div>
        <p>围绕本地生活老板最常用的抖音经营链路，优先使用这 7 个入口。</p>
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
        <h3>需要完整运营方案？</h3>
        <p>AI 生成 80% 底稿 + 专家沟通润色 = 您的专属定制报告</p>
        <button class="cta-btn" @click="bookConsultation">预约专家 1v1 咨询</button>
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
  { step: '01', code: 'diagnosis', name: '经营体检', desc: '先判断账号、内容、转化和复盘短板', level: 'free', levelText: '免费体验', levelClass: 'level-free' },
  { step: '02', code: 'quick-plan', name: '15 天速胜计划', desc: '把诊断结论拆成每天能做的动作', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '03', code: 'video-diagnoser', name: '数据复盘', desc: '记录播放、互动、咨询和成交，校准下一步动作', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '04', code: 'product-pricing', name: '组品定价', desc: '优化团购品、利润品和引流品结构', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '05', code: 'conversion-path', name: '转化链路', desc: '检查团购、私信、企微和到店承接', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '06', code: 'local-ad-strategy', name: '本地推策略', desc: '匹配投放目标、定向和素材方向', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
  { step: '07', code: 'full-strategy', name: '90 天战略', desc: '从短期执行进入季度增长节奏', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
]

const agentGroups = [
  {
    id: 'diagnosis',
    icon: '📊',
    name: '经营体检',
    agents: [
      { code: 'diagnosis', name: '行业体检表', emoji: '🩺', desc: '勾选痛点，生成五维健康度雷达图', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 2 次/天' }
    ]
  },
  {
    id: 'planning',
    icon: '📅',
    name: '作战计划',
    agents: [
      { code: 'quick-plan', name: '15 天速胜计划', emoji: '📅', desc: '生成短期打法节奏表，快速见效', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'full-strategy', name: '90 天周期战略', emoji: '🗺️', desc: '阶段骨架展示，详情引导 1v1', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
    ]
  },
  {
    id: 'content',
    icon: '🎬',
    name: '内容创作（高频）',
    agents: [
      { code: 'topic-generator', name: '爆款选题库', emoji: '💡', desc: '选行业 + 赛道，AI 推荐高潜力选题', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter', usageHint: '每日 10 个' },
      { code: 'script-generator', name: '脚本生成器', emoji: '📝', desc: '口播/剧情/种草模板，自动写分镜', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
      { code: 'title-optimizer', name: '标题优化器', emoji: '✍️', desc: '输入原标题，给出 5 个高点击率版本', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' },
      { code: 'cover-helper', name: '封面文案助手', emoji: '🎨', desc: '数字型/悬念型/痛点型钩子词', level: 'starter', levelText: '初阶会员', levelClass: 'level-starter' }
    ]
  },
  {
    id: 'conversion',
    icon: '💰',
    name: '转化经营',
    agents: [
      { code: 'product-pricing', name: '组品定价助手', emoji: '🛍️', desc: '交互式行业分轨，智能产品矩阵设计', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'conversion-path', name: '转化链路优化', emoji: '🔗', desc: '团购/私信/企微 SOP 检查表', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'competitor-analyzer', name: '竞对分析器', emoji: '🎯', desc: '输入对标特征，给差异化打法', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'ads',
    icon: '🚀',
    name: '投流专项',
    agents: [
      { code: 'dou-calculator', name: 'DOU+ 投放计算器', emoji: '💵', desc: '预算/目标输入，预期播放与转化', level: 'free', levelText: '免费体验', levelClass: 'level-free', usageHint: '限 3 次/天' },
      { code: 'local-ad-strategy', name: '本地推策略生成', emoji: '📍', desc: '选行业 + 目标，定向与素材建议', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
    ]
  },
  {
    id: 'ip',
    icon: '👤',
    name: 'IP 与人设',
    agents: [
      { code: 'ip-positioning', name: '老板 IP 定位器', emoji: '🌟', desc: '性格 + 行业，生成人设标签', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' },
      { code: 'ip-consistency', name: '人设一致性检查', emoji: '🔎', desc: '输入近期内容，评估人设是否跑偏', level: 'annual', levelText: '高阶专享', levelClass: 'level-annual' }
    ]
  },
  {
    id: 'review',
    icon: '📈',
    name: '数据复盘',
    agents: [
      { code: 'video-diagnoser', name: '视频数据复盘', emoji: '🔍', desc: '输入播放、互动、咨询和成交数据，AI 判断下一步', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'live-review', name: '直播复盘助手', emoji: '📺', desc: '分析人货场短板，给优化建议', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' },
      { code: 'ad-evaluator', name: '投流效果评估', emoji: '📊', desc: 'DOU+/本地推 ROI 健康度判断', level: 'pro', levelText: '进阶会员', levelClass: 'level-pro' }
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
  router.push(`/douyin/${agent.code}`)
}

const bookConsultation = () => {
  router.push('/consultation')
}
</script>

<style scoped>
.douyin-agent-hub {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 0%, rgba(239, 68, 68, 0.07), transparent 28rem),
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
  max-width: 680px;
  margin: 0 auto;
  font-size: var(--text-body);
  color: var(--text-secondary);
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
  grid-template-columns: repeat(7, minmax(0, 1fr));
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
  border-color: rgba(37, 99, 235, 0.22);
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
  border-color: rgba(37, 99, 235, 0.22);
  box-shadow: var(--shadow-card);
}

.agent-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
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
  margin-bottom: var(--space-3);
  line-height: 1.5;
}

.agent-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-level {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: var(--text-caption);
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
  color: var(--text-muted);
}

.agent-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.agent-card.locked .agent-lock-overlay {
  opacity: 1;
  pointer-events: auto;
}

.lock-icon {
  font-size: 32px;
}

.lock-text {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
  text-align: center;
}

.hub-cta {
  padding-top: var(--space-5);
}

.cta-card {
  background: linear-gradient(135deg, rgba(239, 246, 255, 0.96), rgba(255, 255, 255, 0.96));
  border-radius: var(--radius-panel);
  padding: var(--space-6);
  text-align: center;
  border: 1px solid rgba(59, 130, 246, 0.18);
}

.cta-card h3 {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
  color: var(--text-main);
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
  font-size: var(--text-body);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background 0.2s;
}

.cta-btn:hover {
  background: var(--brand-primary-hover);
}

@media (max-width: 1180px) {
  .mainline-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .mainline-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .mainline-grid,
  .agent-cards {
    grid-template-columns: 1fr;
  }
}
</style>
