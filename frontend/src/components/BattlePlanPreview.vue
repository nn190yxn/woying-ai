<template>
  <div class="battle-plan-card card">
    <div class="battle-plan-table">
      <div class="battle-plan-row header">
        <span>天数</span>
        <span>今日目标</span>
        <span>内容任务</span>
        <span>执行工具</span>
        <span>复盘指标</span>
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
  { day: 1, goal: '找出账号主短板', contentTask: '拍一条老板出镜的门店现状诊断视频', tool: '经营体检', toolPath: '/douyin/diagnosis', metrics: '播放、完播、评论' },
  { day: 2, goal: '测试信任内容', contentTask: '拍服务过程和真实顾客反馈', tool: '脚本生成', toolPath: '/douyin/script-generator', metrics: '完播、收藏、私信' },
  { day: 3, goal: '放大爆点选题', contentTask: '围绕高互动问题拍干货答疑', tool: '标题优化', toolPath: '/douyin/title-optimizer', metrics: '点击率、评论率' },
  { day: 4, goal: '推动团购咨询', contentTask: '拍套餐利益点和到店场景', tool: '组品定价', toolPath: '/douyin/product-pricing', metrics: '私信、咨询、核销' },
  { day: 5, goal: '复盘有效内容', contentTask: '整理前 4 天数据，确定下一轮方向', tool: '数据复盘', toolPath: '/douyin/video-diagnoser', metrics: '成交、ROI、有效类型' }
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
