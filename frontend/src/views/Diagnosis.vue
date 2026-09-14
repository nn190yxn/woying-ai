<template>
  <div class="diagnosis-center">
    <div class="container">
      <div class="diagnosis-header">
        <h1>校区招生经营诊断</h1>
        <p>根据校区和主推课程、本周招生数据，找出咨询、体验课、到店和报名中最影响结果的一环</p>
      </div>

      <!-- 核心模块：企业增长全景顾问 -->
      <div class="primary-diagnosis card" @click="startGrowthDiagnosis">
        <div class="primary-icon"><IconPillarDiagnosis /></div>
        <div class="primary-body">
          <div class="primary-badge">校长经营入口</div>
          <h3>看看本周招生问题出在哪</h3>
          <p class="primary-desc">填写校区、课程和家长招生情况，梳理体验课、到店与报名数据，确定本周最多两个优先动作，七天后回来复盘。</p>
          <div class="primary-meta">
            <span class="badge badge-free">免费版</span>
            <span>~15-30分钟</span>
            <span>五步完成</span>
          </div>
          <div class="flow-preview">
            <span class="flow-step">了解校区和主推课程</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">填写本周招生数据</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">找出最影响结果的一环</span>
            <span class="flow-arrow">→</span>
            <span class="flow-step">确定本周优先动作 → 七天后回来复盘</span>
          </div>
        </div>
        <button class="btn btn-primary" type="button">看看问题出在哪</button>
        <div class="card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </div>
      </div>

      <div class="section-divider">
        <span>五步经营诊断</span>
      </div>

      <!-- 诊断流程卡片 -->
      <div class="diagnosis-grid">
        <div class="module-card card">
          <div class="module-icon stage0"><span>0</span></div>
          <div class="module-body">
            <h3>了解校区和主推课程</h3>
            <p class="module-desc">填写校区所在城市、主推课程、目标家长和课程价格，先统一本周招生口径。</p>
            <div class="module-tags">
              <span class="tag">城市线级</span>
              <span class="tag">市场环境</span>
              <span class="tag">行业特征</span>
            </div>
          </div>
        </div>

        <div class="module-card card">
          <div class="module-icon founder"><span>F</span></div>
          <div class="module-body">
            <h3>填写本周招生数据</h3>
            <p class="module-desc">如实填写本周咨询、邀约、体验课、到店和报名情况；暂时没有数据也可以继续。</p>
            <div class="module-tags">
              <span class="tag">角色进化</span>
              <span class="tag">能力雷达</span>
              <span class="tag">直接/间接版</span>
            </div>
          </div>
        </div>

        <div class="module-card card">
          <div class="module-icon rent"><span>I</span></div>
          <div class="module-body">
            <h3>找出最影响结果的一环</h3>
            <p class="module-desc">对照咨询到报名过程，判断主要问题在咨询不足、邀约不到店，还是体验后未报名。</p>
            <div class="module-tags">
              <span class="tag">劳动占比</span>
              <span class="tag">租占比</span>
              <span class="tag">风险识别</span>
            </div>
          </div>
        </div>

        <div class="module-card card">
          <div class="module-icon scan"><span>1</span></div>
          <div class="module-body">
            <h3>确定本周优先动作</h3>
            <p class="module-desc">根据主要问题只选最多两个已有动作，明确负责人、完成时间和需要登记的结果。</p>
            <div class="module-tags">
              <span class="tag">优先动作</span>
              <span class="tag">执行条件</span>
              <span class="tag">结果登记</span>
            </div>
          </div>
        </div>

        <div class="module-card card optional">
          <div class="module-icon ip"><span>G</span></div>
          <div class="module-body">
            <div class="optional-badge">按需触发</div>
            <h3>七天后回来复盘</h3>
            <p class="module-desc">带着七天内的咨询、邀约、体验课、到店和报名记录回来，决定继续、调整或找顾问。</p>
            <div class="module-tags">
              <span class="tag">七天记录</span>
              <span class="tag">前后对比</span>
              <span class="tag">顾问确认</span>
            </div>
          </div>
        </div>

        <div class="module-card card optional">
          <div class="module-icon sop"><span>H</span></div>
          <div class="module-body">
            <div class="optional-badge">按需触发</div>
            <h3>校长需要准备什么</h3>
            <p class="module-desc">准备校区和课程基本信息，以及本周家长咨询、体验课、到店和报名的汇总数据。</p>
            <div class="module-tags">
              <span class="tag">成熟度</span>
              <span class="tag">覆盖率</span>
              <span class="tag">执行力</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 诊断输出说明 -->
      <div class="output-section card">
        <h2>完成后你会看到</h2>
        <div class="output-grid">
          <div class="output-item">
            <span class="output-icon">📊</span>
            <h4>主要问题</h4>
            <p>咨询、到店或报名中最影响结果的一环</p>
          </div>
          <div class="output-item">
            <span class="output-icon">👤</span>
            <h4>判断依据</h4>
            <p>根据校区、课程和本周招生记录说明判断理由</p>
          </div>
          <div class="output-item">
            <span class="output-icon">🔄</span>
            <h4>本周先做</h4>
            <p>最多两个优先动作，避免同时铺开太多事情</p>
          </div>
          <div class="output-item">
            <span class="output-icon">⏰</span>
            <h4>观察指标</h4>
            <p>连续登记咨询、体验课、到店和报名变化</p>
          </div>
          <div class="output-item">
            <span class="output-icon">🚀</span>
            <h4>停止或求助条件</h4>
            <p>七天没有改善或反馈变差时，停止加量并找顾问</p>
          </div>
          <div class="output-item">
            <span class="output-icon">📋</span>
            <h4>需要顾问确认</h4>
            <p>数据不足或相互矛盾时，不直接下结论</p>
          </div>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="upgrade-card card">
        <h3>登录后开始经营诊断</h3>
        <p>登录后填写校区和本周招生情况，查看本周应该先做什么</p>
        <router-link to="/login?redirect=/diagnosis" class="btn btn-primary">登录后看看问题出在哪</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { IconPillarDiagnosis } from '@/icons'

const router = useRouter()
const userStore = useUserStore()
const isAuthenticated = computed(() => userStore.isLoggedIn)

function startGrowthDiagnosis() {
  if (!isAuthenticated.value) {
    router.push('/login?redirect=/diagnosis/questionnaire/growth-diagnosis')
    return
  }
  router.push('/diagnosis/questionnaire/growth-diagnosis')
}
</script>

<style scoped>
.diagnosis-center {
  padding: var(--space-6) 0 var(--space-9);
}

.diagnosis-header {
  margin-bottom: var(--space-6);
}

.diagnosis-header h1 {
  font-size: var(--text-h2);
  margin-bottom: var(--space-2);
}

.diagnosis-header p {
  color: var(--text-secondary);
  font-size: var(--text-body-md);
}

/* 核心诊断卡片 */
.primary-diagnosis {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
  padding: var(--space-6);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
  margin-bottom: var(--space-6);
  border: 2px solid rgba(59, 130, 246, 0.2);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.03), rgba(168, 85, 247, 0.03));
}

.primary-diagnosis:hover {
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
  transform: translateY(-2px);
  border-color: var(--brand-primary);
}

.primary-icon {
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--brand-primary);
}

.primary-icon :deep(svg) {
  width: 32px;
  height: 32px;
}

.primary-body {
  flex: 1;
  min-width: 0;
}

.primary-badge {
  display: inline-block;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
  padding: 2px 10px;
  border-radius: 12px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--brand-primary);
  margin-bottom: var(--space-2);
}

.primary-body h3 {
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-2);
}

.primary-desc {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-3);
  line-height: var(--leading-body-md);
}

.primary-meta {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-caption);
  color: var(--text-muted);
  margin-bottom: var(--space-3);
}

.flow-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  font-size: var(--text-caption);
  color: var(--brand-primary);
}

.flow-step {
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.08);
  border-radius: 4px;
}

.flow-arrow {
  color: var(--text-muted);
}

/* 分割线 */
.section-divider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--line-default);
}

.section-divider span {
  font-size: var(--text-caption);
  color: var(--text-muted);
  white-space: nowrap;
}

/* 诊断流程卡片 */
.diagnosis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.module-card {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  padding: var(--space-5);
  position: relative;
}

.module-card.optional {
  border-left: 3px solid var(--state-warning);
}

.optional-badge {
  position: absolute;
  top: var(--space-2);
  right: var(--space-3);
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--state-warning);
  color: white;
}

.module-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 700;
  font-size: var(--text-body-lg);
  color: white;
}

.module-icon.stage0 { background: var(--brand-primary); }
.module-icon.founder { background: #a855f7; }
.module-icon.rent { background: #f59e0b; }
.module-icon.scan { background: #22c55e; }
.module-icon.ip { background: #ec4899; }
.module-icon.sop { background: #6366f1; }

.module-body {
  flex: 1;
  min-width: 0;
}

.module-body h3 {
  font-size: var(--text-body-md);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.module-desc {
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
  line-height: var(--leading-body-sm);
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  background: var(--bg-subtle);
  color: var(--text-muted);
}

/* 诊断输出说明 */
.output-section {
  padding: var(--space-6);
  margin-bottom: var(--space-6);
}

.output-section h2 {
  font-size: var(--text-h4);
  margin-bottom: var(--space-4);
}

.output-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--space-4);
}

.output-item {
  text-align: center;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--bg-subtle);
}

.output-icon {
  font-size: 28px;
  display: block;
  margin-bottom: var(--space-2);
}

.output-item h4 {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-semibold);
  margin-bottom: 4px;
}

.output-item p {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin: 0;
}

.badge {
  font-size: var(--text-caption);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: var(--font-weight-medium);
}

.badge-free {
  background-color: #dcfce7;
  color: #166534;
}

.badge-starter {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-pro {
  background-color: #dbeafe;
  color: #1e40af;
}

.card-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
  transition: color var(--duration-fast) var(--ease-out);
}

.primary-diagnosis:hover .card-arrow {
  color: var(--brand-primary);
}

.upgrade-card {
  max-width: 480px;
  margin: 0 auto;
  padding: var(--space-6);
  text-align: center;
}

.upgrade-card h3 {
  font-size: var(--text-h4);
  margin-bottom: var(--space-2);
}

.upgrade-card p {
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
  font-size: var(--text-body-sm);
}

@media (max-width: 640px) {
  .diagnosis-grid {
    grid-template-columns: 1fr;
  }

  .output-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .primary-diagnosis {
    flex-direction: column;
  }

  .flow-preview {
    font-size: 11px;
  }
}
</style>
