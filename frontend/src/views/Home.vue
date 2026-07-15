<template>
  <div class="home-page">
    <section class="hero">
      <div class="container-wide hero-grid">
        <div class="hero-copy">
          <p class="hero-eyebrow">本地生活 AI 经营系统</p>
          <h1>
            <span>每天给老板一张</span>
            <span>能照着做的经营作战表</span>
          </h1>
          <p class="hero-desc">先诊断客流、内容、转化和复购卡点，再把问题拆成 15 天任务、执行工具和复盘指标。</p>
          <div class="hero-metrics workbench-metrics" aria-label="经营工作台能力">
            <article v-for="metric in operatingMetrics" :key="metric.label" class="workbench-metric-card">
              <span class="workbench-metric-label">{{ metric.label }}</span>
              <strong class="workbench-metric-value">{{ metric.value }}</strong>
              <span class="workbench-metric-note">{{ metric.note }}</span>
            </article>
          </div>
          <div class="hero-actions">
            <router-link to="/douyin/diagnosis" class="btn btn-primary btn-lg">开始经营体检</router-link>
            <router-link to="/douyin/quick-plan" class="btn btn-secondary btn-lg">查看作战计划</router-link>
            <router-link to="/douyin/video-diagnoser" class="btn btn-secondary btn-lg">记录今天的数据</router-link>
          </div>
        </div>

        <div class="hero-panel card">
          <div class="member-total">
            <strong class="member-total-number">3 步</strong>
            <span class="member-total-label">从诊断到执行复盘</span>
          </div>
          <div class="hero-flow">
            <router-link v-for="step in heroSteps" :key="step.title" :to="step.path" class="flow-step">
              <span class="flow-index">{{ step.index }}</span>
              <div>
                <strong>{{ step.title }}</strong>
                <span>{{ step.desc }}</span>
              </div>
            </router-link>
          </div>
          <router-link to="/diagnosis" class="growth-spotlight">
            <span class="growth-spotlight-label">系统诊断</span>
            <strong>不知道先改哪里，就从全景增长诊断开始</strong>
          </router-link>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container-wide">
        <div class="section-head workbench-section-header">
          <div>
            <p class="section-kicker">今日经营任务</p>
            <h2>今天先推进哪件事</h2>
          </div>
        </div>

        <div class="mission-grid">
          <router-link
            v-for="mission in missionCards"
            :key="mission.title"
            :to="mission.path"
            class="mission-card card"
          >
            <span class="mission-label">{{ mission.label }}</span>
            <h3>{{ mission.title }}</h3>
            <p>{{ mission.desc }}</p>
            <div class="module-cues">
              <span v-for="cue in mission.cues" :key="cue" class="module-cue">{{ cue }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="section section-subtle">
      <div class="container-wide">
        <div class="section-head workbench-section-header">
          <div>
            <p class="section-kicker">15 天作战表示例</p>
            <h2>餐饮门店抖音获客 5 天样例</h2>
          </div>
          <router-link to="/douyin/quick-plan" class="section-link">生成完整 15 天计划</router-link>
        </div>

        <BattlePlanPreview />
      </div>
    </section>

    <section class="section section-subtle">
      <div class="container-wide">
        <div class="section-head workbench-section-header">
          <div>
            <p class="section-kicker">专项作战入口</p>
            <h2>先测、再做、再复盘</h2>
          </div>
        </div>
        <div class="special-entry-grid">
          <router-link
            v-for="entry in specialEntries"
            :key="entry.title"
            :to="entry.path"
            class="special-entry card"
          >
            <div class="special-entry-top">
              <span class="mini-dot" :style="{ backgroundColor: entry.accent }"></span>
              <div>
                <strong>{{ entry.title }}</strong>
                <p>{{ entry.desc }}</p>
              </div>
            </div>
            <div class="special-entry-flow">
              <span v-for="step in entry.steps" :key="step">{{ step }}</span>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <section class="section membership-section">
      <div class="container-wide">
        <div class="section-head workbench-section-header">
          <div>
            <p class="section-kicker">经营权益</p>
            <h2>会员介绍</h2>
          </div>
        </div>

        <MembershipOutcomeMatrix />
      </div>
    </section>
  </div>
</template>

<script setup>
import BattlePlanPreview from '@/components/BattlePlanPreview.vue'
import MembershipOutcomeMatrix from '@/components/MembershipOutcomeMatrix.vue'

const heroSteps = [
  { index: '01', title: '先体检', desc: '抖音、小红书、私域和门店经营先找主短板', path: '/douyin/diagnosis' },
  { index: '02', title: '出计划', desc: '把诊断结论变成 15 天可执行动作', path: '/douyin/quick-plan' },
  { index: '03', title: '做复盘', desc: '记录视频和成交数据，持续校准动作', path: '/douyin/video-diagnoser' }
]

const operatingMetrics = [
  { label: '入口', value: '3 类', note: '体检、计划、复盘' },
  { label: '周期', value: '15 天', note: '每日任务和工具' },
  { label: '闭环', value: '4 段', note: '诊断到复盘校准' }
]

const missionCards = [
  { label: '体检', title: '开始经营体检', desc: '适合不知道先优化抖音、小红书、私域还是门店经营的老板。', path: '/douyin/diagnosis', cues: ['诊断依据', '主短板', '下一步动作'] },
  { label: '计划', title: '生成作战计划', desc: '把问题拆成 15 天执行节奏，直接衔接脚本、话术、投流和私域动作。', path: '/douyin/quick-plan', cues: ['15 天节奏', '每日任务', '工具推荐'] },
  { label: '复盘', title: '记录今天的数据', desc: '记录播放、互动、咨询和成交数据，让下一次诊断更准。', path: '/douyin/video-diagnoser', cues: ['视频数据', '成交复盘', '下一步建议'] }
]

const specialEntries = [
  {
    title: '抖音本地获客',
    desc: '适合想用短视频、团购和本地推拉新到店的门店。',
    path: '/douyin',
    accent: '#2563eb',
    steps: ['经营体检', '15 天计划', '视频复盘']
  },
  {
    title: '小红书种草转化',
    desc: '适合美业、教培、生活服务做内容种草和咨询转化。',
    path: '/xhs',
    accent: '#db2777',
    steps: ['账号体检', '起号计划', '笔记复盘']
  },
  {
    title: '私域复购承接',
    desc: '适合把到店客户、企微、社群和会员体系做成复购资产。',
    path: '/private',
    accent: '#0f766e',
    steps: ['私域体检', '承接动作', '复购复盘']
  }
]

</script>

<style scoped>
.home-page {
  background: var(--bg-workbench);
  padding-bottom: var(--space-8);
}

.hero,
.section {
  padding: var(--section-gap-md) 0;
}

.section-subtle {
  background: transparent;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  align-items: start;
  gap: var(--grid-gap-lg);
}

.hero-copy {
  max-width: 620px;
}

.hero-eyebrow {
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.hero-copy h1 {
  font-size: var(--text-display);
  line-height: 1.08;
  margin-bottom: var(--space-3);
}

.hero-copy h1 span {
  display: block;
}

.hero-desc,
.special-entry p {
  color: var(--text-secondary);
}

.hero-member-inline {
  color: var(--brand-primary);
  font-weight: var(--font-weight-bold);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.hero-panel {
  padding: var(--card-padding-lg);
  border: 1px solid var(--line-soft);
  box-shadow: var(--shadow-card-hover);
}

.member-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: var(--space-4);
}

.member-total-number {
  font-size: 52px;
  line-height: 1;
  font-weight: var(--font-weight-bold);
  color: var(--brand-primary);
}

.member-total-label {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--grid-gap-sm);
  margin-top: var(--space-5);
}

.hero-flow {
  display: grid;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.flow-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-3);
  align-items: center;
  padding: 14px;
  border-radius: var(--radius-card);
  background: var(--bg-panel);
  color: inherit;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.flow-step:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.flow-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--brand-primary);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-caption);
}

.flow-step strong,
.flow-step span:last-child {
  display: block;
}

.flow-step span:last-child {
  margin-top: 3px;
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.metric-card {
  padding: var(--space-3);
  border-radius: 12px;
  background: var(--bg-subtle);
}

.metric-card strong {
  display: block;
  margin-bottom: 2px;
  font-size: var(--text-h3);
  color: var(--brand-primary);
}

.metric-card span {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.growth-spotlight {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: var(--space-4);
  padding: 14px 16px;
  border-radius: var(--radius-panel);
  border: 1px solid var(--line-soft);
  background: var(--state-info-bg);
  color: inherit;
  text-decoration: none;
}

.growth-spotlight-label {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.section-head.compact {
  margin-bottom: var(--space-3);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.mission-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--grid-gap-md);
}

.module-card {
  padding: 18px;
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.mission-card {
  display: grid;
  align-content: start;
  min-height: 220px;
  padding: var(--card-padding-lg);
  color: inherit;
  text-decoration: none;
  border: 1px solid var(--line-soft);
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.module-card:hover,
.mission-card:hover,
.special-entry:hover,
.growth-spotlight:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: rgba(30, 58, 138, 0.12);
}

.mission-label {
  display: inline-flex;
  width: fit-content;
  min-height: var(--tag-height);
  align-items: center;
  padding: 0 var(--space-3);
  border-radius: var(--radius-pill);
  background: var(--brand-primary-soft);
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.module-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.module-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.module-icon :deep(svg) {
  width: 20px;
  height: 20px;
}

.module-count {
  font-size: var(--text-caption);
  color: var(--text-muted);
}

.module-card h3,
.mission-card h3 {
  margin: var(--space-3) 0 6px;
  font-size: var(--text-h4);
}

.mission-card p {
  min-height: 48px;
  color: var(--text-secondary);
}

.section-kicker {
  margin-bottom: 6px;
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.section-link {
  color: var(--brand-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

.module-cues {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.module-cue,
.mini-dot,
.industry-entry-count {
  font-size: var(--text-caption);
}

.module-cue {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--bg-panel);
  color: var(--text-secondary);
}

.mini-grid,
.special-entry-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}

.special-entry {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 180px;
  padding: var(--card-padding-lg);
  border-radius: var(--radius-card);
  border: 1px solid var(--line-soft);
  background: var(--bg-card);
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.special-entry-top {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
}

.special-entry-top strong,
.special-entry-top p {
  display: block;
}

.special-entry-top p {
  margin-top: 6px;
}

.special-entry-flow {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.special-entry-flow span {
  padding: 5px 10px;
  border-radius: var(--radius-pill);
  background: var(--bg-panel);
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.mini-dot {
  width: 10px;
  height: 10px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.special-entry strong {
  display: block;
}

@media (max-width: 1023px) {
  .hero-grid,
  .module-grid,
  .mission-grid,
  .special-entry-grid,
  .mini-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 639px) {
  .hero,
  .section {
    padding: var(--section-gap-sm) 0;
  }

  .hero-copy h1 {
    font-size: var(--text-h1);
  }

  .member-total-number {
    font-size: 42px;
  }

  .hero-actions,
  .hero-metrics,
  .module-grid,
  .mission-grid,
  .special-entry-grid,
  .mini-grid {
    grid-template-columns: 1fr;
  }

  .mission-card,
  .special-entry {
    min-height: auto;
    padding: var(--card-padding-md);
  }

  .hero-actions,
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
