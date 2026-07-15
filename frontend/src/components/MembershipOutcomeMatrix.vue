<template>
  <div class="membership-grid">
    <div v-for="plan in membershipPlans" :key="plan.code" class="membership-card card" :class="{ recommended: plan.recommended, featured: plan.featured }">
      <div class="membership-top">
        <div>
          <h3>{{ plan.name }}</h3>
          <p class="sub-price">{{ plan.subPrice }}</p>
        </div>
        <span class="badge" :class="plan.badgeClass">{{ plan.badge }}</span>
      </div>
      <p class="price">{{ plan.price }}</p>
      <p class="coverage">覆盖 {{ plan.pillarCoverage }} 大模块</p>
      <router-link to="/membership" class="btn btn-block" :class="plan.recommended || plan.featured ? 'btn-primary' : 'btn-secondary'">{{ plan.cta }}</router-link>
    </div>
  </div>
</template>

<script setup>
import { pricingPlans } from '@/constants/toolCatalog'

const membershipPlans = pricingPlans.map(plan => {
  const coverageMap = { free: '3/8', starter: '5/8', pro: '7/8', annual: '8/8' }
  return {
    ...plan,
    pillarCoverage: coverageMap[plan.code] || '4/8'
  }
})
</script>

<style scoped>
.membership-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}

.membership-card {
  padding: 18px;
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.membership-card.recommended,
.membership-card.featured {
  border-color: rgba(30, 58, 138, 0.16);
  box-shadow: 0 16px 40px rgba(30, 58, 138, 0.08);
}

.membership-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.membership-card h3 {
  margin: var(--space-3) 0 6px;
  font-size: var(--text-h4);
}

.sub-price,
.coverage {
  color: var(--text-secondary);
}

.price {
  font-size: 30px;
  font-weight: var(--font-weight-bold);
  margin: var(--space-3) 0 2px;
}

.coverage {
  margin-bottom: var(--space-3);
}

.btn-block {
  width: 100%;
  margin-top: var(--space-3);
}

@media (max-width: 1023px) {
  .membership-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 639px) {
  .membership-grid {
    grid-template-columns: 1fr;
  }
}
</style>
