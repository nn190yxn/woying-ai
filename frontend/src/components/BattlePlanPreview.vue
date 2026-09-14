<template>
  <div class="battle-plan-card card">
    <div class="battle-plan-table">
      <div class="battle-plan-row header">
        <span>天数</span>
        <span>本日重点</span>
        <span>招生动作</span>
        <span>记录入口</span>
        <span>要登记的结果</span>
      </div>
      <div v-for="day in battlePlanPreview" :key="day.day" class="battle-plan-row">
        <span class="day-pill">第 {{ day.day }} 天</span>
        <strong>{{ day.goal }}</strong>
        <span>{{ day.contentTask }}</span>
        <router-link :to="day.toolPath" class="tool-link">{{ day.tool }}</router-link>
        <span>{{ day.metrics }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
const battlePlanPreview = [
  { day: 1, goal: '找出招生主要问题', contentTask: '整理本周咨询、预约和到店记录', tool: '经营体检', toolPath: '/diagnosis', metrics: '有效咨询、预约体验' },
  { day: 2, goal: '明确家长关心的问题', contentTask: '准备一条课程体验或教练专业度内容', tool: '内容安排', toolPath: '/douyin/script-generator', metrics: '咨询、预约体验' },
  { day: 3, goal: '提高有效咨询', contentTask: '围绕家长常问问题发布一条内容', tool: '内容复盘', toolPath: '/douyin/title-optimizer', metrics: '有效咨询、家长问题' },
  { day: 4, goal: '提高体验课到店', contentTask: '逐一确认已预约家长的到店时间', tool: '家长跟进', toolPath: '/private', metrics: '预约体验、实际到店' },
  { day: 5, goal: '登记本周经营结果', contentTask: '整理咨询、到店、报名和续费，确定下周动作', tool: '招生数据复盘', toolPath: '/douyin/video-diagnoser', metrics: '到店、报名、续费' }
]
</script>

<style scoped>
.battle-plan-card {
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.battle-plan-table {
  display: grid;
  min-width: 860px;
}

.battle-plan-row {
  display: grid;
  grid-template-columns: 90px 1fr 1.35fr 120px 150px;
  gap: var(--space-3);
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.battle-plan-row:last-child {
  border-bottom: 0;
}

.battle-plan-row.header {
  background: #f8fafc;
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.day-pill {
  display: inline-flex;
  justify-content: center;
  padding: 6px 10px;
  border-radius: 9999px;
  background: rgba(30, 58, 138, 0.08);
  color: var(--brand-primary);
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.tool-link {
  color: var(--brand-primary);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
}

@media (max-width: 639px) {
  .battle-plan-card {
    overflow-x: auto;
  }
}
</style>
