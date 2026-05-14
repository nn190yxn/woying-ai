<template>
  <component :is="toolComponent" v-if="toolComponent" />
  <div v-else class="tool-not-found">
    <p>未找到该工具</p>
    <router-link to="/tools" class="btn btn-primary">返回表格中心</router-link>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const asyncView = loader => defineAsyncComponent(loader)

const toolComponents = {
  'headline': asyncView(() => import('./tools/HeadlineGenerator.vue')),
  'friend': asyncView(() => import('./tools/FriendPoster.vue')),
  'selling-point': asyncView(() => import('./tools/SellingPoint.vue')),
  'close-deal': asyncView(() => import('./tools/CloseDeal.vue')),
  'roi': asyncView(() => import('./tools/ROICalculator.vue')),
  'payback': asyncView(() => import('./tools/PaybackCalculator.vue')),
  'schedule': asyncView(() => import('./tools/ScheduleGenerator.vue')),
  'hook': asyncView(() => import('./tools/HookDesigner.vue')),
  'script': asyncView(() => import('./tools/ScriptGenerator.vue')),
  'xiaohongshu': asyncView(() => import('./tools/XiaohongshuGenerator.vue')),
  'xhs-title': asyncView(() => import('./tools/XhsTitle.vue')),
  'xhs-topic': asyncView(() => import('./tools/XhsTopic.vue')),
  'xhs-traffic': asyncView(() => import('./tools/XhsTraffic.vue')),
  'xhs-seo': asyncView(() => import('./tools/XhsSEO.vue')),
  'xhs-diagnosis': asyncView(() => import('./tools/XhsDiagnosis.vue')),
  'xhs-review': asyncView(() => import('./tools/XhsReview.vue')),
  'xhs-conversion': asyncView(() => import('./tools/XhsConversion.vue')),
  'meituan': asyncView(() => import('./tools/MeituanDiagnoser.vue')),
  'topic': asyncView(() => import('./tools/TopicGenerator.vue')),
  'festival': asyncView(() => import('./tools/FestivalMarketing.vue')),
  'salary': asyncView(() => import('./tools/SalaryDesigner.vue')),
  'fission': asyncView(() => import('./tools/FissionScheme.vue')),
  'sop': asyncView(() => import('./tools/SOPGenerator.vue')),
  'ip-agent': asyncView(() => import('./tools/IPAgent.vue')),
  'competitor': asyncView(() => import('./tools/CompetitorAnalyzer.vue')),
  'business-plan': asyncView(() => import('./tools/BusinessPlanGenerator.vue')),
  'membership-design': asyncView(() => import('./tools/MembershipDesign.vue')),
  'marketing-calendar': asyncView(() => import('./tools/MarketingCalendar.vue')),
  'marketing-plan': asyncView(() => import('./tools/MarketingPlan.vue')),
  'team-training': asyncView(() => import('./tools/TeamTraining.vue')),
  'employee-incentive': asyncView(() => import('./tools/EmployeeIncentive.vue')),
  'store-opening': asyncView(() => import('./tools/StoreOpening.vue')),
  'anniversary-event': asyncView(() => import('./tools/AnniversaryEvent.vue')),
  'offseason-traffic': asyncView(() => import('./tools/OffseasonTraffic.vue')),
  'experience-service': asyncView(() => import('./tools/ExperienceService.vue')),
  'price-increase': asyncView(() => import('./tools/PriceIncrease.vue')),
  'promotion-plan': asyncView(() => import('./tools/PromotionPlan.vue')),
  'complaint-handling': asyncView(() => import('./tools/ComplaintHandling.vue')),
  'competitor-strategy': asyncView(() => import('./tools/CompetitorStrategy.vue')),
  'boss-ip': asyncView(() => import('./tools/BossIP.vue')),
  'douyin-growth': asyncView(() => import('./tools/DouyinGrowth.vue')),
  'xiaohongshu-growth': asyncView(() => import('./tools/XiaohongshuGrowth.vue')),
  'gross-margin-restaurant': asyncView(() => import('./tools/GrossMarginRestaurant.vue')),
  'break-even-restaurant': asyncView(() => import('./tools/BreakEvenRestaurant.vue')),
  'turnover-rate-restaurant': asyncView(() => import('./tools/TurnoverRateRestaurant.vue')),
  'renewal-rate-education': asyncView(() => import('./tools/RenewalRateEducation.vue')),
  'class-consumption-rate-education': asyncView(() => import('./tools/ClassConsumptionRateEducation.vue')),
  'card-consumption-rate-beauty': asyncView(() => import('./tools/CardConsumptionRateBeauty.vue')),
  'salary-cost-ratio-restaurant': asyncView(() => import('./tools/SalaryCostRatioRestaurant.vue')),
  'dish-pricing': asyncView(() => import('./tools/DishPricing.vue')),
  'food-waste-rate': asyncView(() => import('./tools/FoodWasteRate.vue')),
  'food-yield-rate': asyncView(() => import('./tools/FoodYieldRate.vue')),
  'delivery-profit': asyncView(() => import('./tools/DeliveryProfit.vue')),
  'delivery-analysis': asyncView(() => import('./tools/DeliveryAnalysis.vue')),
  'inventory-turnover': asyncView(() => import('./tools/InventoryTurnover.vue')),
  'dish-contribution': asyncView(() => import('./tools/DishContribution.vue')),
  'repurchase-rate': asyncView(() => import('./tools/RepurchaseRate.vue')),
  'cup-efficiency': asyncView(() => import('./tools/CupEfficiency.vue')),
  'drink-cost': asyncView(() => import('./tools/DrinkCost.vue')),
  'payback-restaurant': asyncView(() => import('./tools/PaybackRestaurant.vue')),
  'cashflow-restaurant': asyncView(() => import('./tools/CashflowRestaurant.vue')),
  'profit-rate-restaurant': asyncView(() => import('./tools/ProfitRateRestaurant.vue')),
  'return-rate-restaurant': asyncView(() => import('./tools/ReturnRateRestaurant.vue')),
  'investment-budget': asyncView(() => import('./tools/InvestmentBudgetRestaurant.vue')),
  'gross-margin-education': asyncView(() => import('./tools/GrossMarginEducation.vue')),
  'break-even-education': asyncView(() => import('./tools/BreakEvenEducation.vue')),
  'salary-cost-ratio-education': asyncView(() => import('./tools/SalaryCostRatioEducation.vue')),
  'labor-efficiency-education': asyncView(() => import('./tools/LaborEfficiencyEducation.vue')),
  'venue-utilization-education': asyncView(() => import('./tools/VenueUtilizationEducation.vue')),
  'cac-education': asyncView(() => import('./tools/CACEducation.vue')),
  'payback-education': asyncView(() => import('./tools/PaybackEducation.vue')),
  'cashflow-education': asyncView(() => import('./tools/CashflowEducation.vue')),
  'profit-rate-education': asyncView(() => import('./tools/ProfitRateEducation.vue')),
  'return-rate-education': asyncView(() => import('./tools/ReturnRateEducation.vue')),
  'class-rate-education': asyncView(() => import('./tools/ClassRateEducation.vue')),
  'gross-margin-beauty': asyncView(() => import('./tools/GrossMarginBeauty.vue')),
  'break-even-beauty': asyncView(() => import('./tools/BreakEvenBeauty.vue')),
  'salary-cost-ratio-beauty': asyncView(() => import('./tools/SalaryCostRatioBeauty.vue')),
  'labor-efficiency-beauty': asyncView(() => import('./tools/LaborEfficiencyBeauty.vue')),
  'conversion-rate-beauty': asyncView(() => import('./tools/ConversionRateBeauty.vue')),
  'project-profit-beauty': asyncView(() => import('./tools/ProjectProfitBeauty.vue')),
  'project-structure-beauty': asyncView(() => import('./tools/ProjectStructureBeauty.vue')),
  'labor-structure-beauty': asyncView(() => import('./tools/LaborStructureBeauty.vue')),
  'card-debt-beauty': asyncView(() => import('./tools/CardDebtBeauty.vue')),
  'funnel-ltv-beauty': asyncView(() => import('./tools/FunnelLTVBeauty.vue')),
  'breakeven-profit-beauty': asyncView(() => import('./tools/BreakevenProfitBeauty.vue')),
  'device-roi-beauty': asyncView(() => import('./tools/DeviceROIBeauty.vue')),
  'member-card-design-beauty': asyncView(() => import('./tools/MemberCardDesignBeauty.vue')),
  'ltv-beauty': asyncView(() => import('./tools/LTVBeauty.vue')),
  'repurchase-rate-beauty': asyncView(() => import('./tools/RepurchaseRateBeauty.vue')),
  'payback-beauty': asyncView(() => import('./tools/PaybackBeauty.vue')),
  'cashflow-beauty': asyncView(() => import('./tools/CashflowBeauty.vue')),
  'profit-rate-beauty': asyncView(() => import('./tools/ProfitRateBeauty.vue')),
  'return-rate-beauty': asyncView(() => import('./tools/ReturnRateBeauty.vue')),
  // 营销推广新增
  'channel-cac': asyncView(() => import('./tools/ChannelCAC.vue')),
  'campaign-roi': asyncView(() => import('./tools/CampaignROI.vue')),
  'referral-roi': asyncView(() => import('./tools/ReferralROI.vue')),
  'conversion-funnel': asyncView(() => import('./tools/ConversionFunnel.vue')),
  'retention-rate': asyncView(() => import('./tools/RetentionRate.vue')),
  'marketing-budget': asyncView(() => import('./tools/MarketingBudget.vue')),
  'churn-rate': asyncView(() => import('./tools/ChurnRate.vue')),
  'ltv-restaurant': asyncView(() => import('./tools/LTVRestaurant.vue')),
  'ltv-education': asyncView(() => import('./tools/LTVEducation.vue')),
  'promotion-profit': asyncView(() => import('./tools/PromotionProfit.vue')),
  // 通用表格
  'daily-revenue-sheet': asyncView(() => import('./sheets/DailyRevenueSheet.vue')),
  'employee-attendance-sheet': asyncView(() => import('./sheets/EmployeeAttendanceSheet.vue')),
  'customer-info-sheet': asyncView(() => import('./sheets/CustomerInfoSheet.vue')),
  'service-schedule-sheet': asyncView(() => import('./sheets/ServiceScheduleSheet.vue')),
  'supplier-sheet': asyncView(() => import('./sheets/SupplierSheet.vue')),
  'inventory-sheet': asyncView(() => import('./sheets/InventorySheet.vue')),
  'member-sheet': asyncView(() => import('./sheets/MemberSheet.vue')),
  // 餐饮表格
  'daily-revenue-restaurant-sheet': asyncView(() => import('./sheets/DailyRevenueRestaurantSheet.vue')),
  'employee-attendance-restaurant-sheet': asyncView(() => import('./sheets/EmployeeAttendanceRestaurantSheet.vue')),
  'customer-info-restaurant-sheet': asyncView(() => import('./sheets/CustomerInfoRestaurantSheet.vue')),
  'reservation-sheet': asyncView(() => import('./sheets/ReservationSheet.vue')),
  'supplier-restaurant-sheet': asyncView(() => import('./sheets/SupplierRestaurantSheet.vue')),
  'inventory-restaurant-sheet': asyncView(() => import('./sheets/InventoryRestaurantSheet.vue')),
  'member-restaurant-sheet': asyncView(() => import('./sheets/MemberRestaurantSheet.vue')),
  'restaurant-food-cost-sheet': asyncView(() => import('./sheets/RestaurantFoodCostSheet.vue')),
  'restaurant-turnover-sheet': asyncView(() => import('./sheets/RestaurantTurnoverSheet.vue')),
  'menu-gross-margin-sheet': asyncView(() => import('./sheets/MenuGrossMarginSheet.vue')),
  'foot-traffic-sheet': asyncView(() => import('./sheets/FootTrafficSheet.vue')),
  // 教培表格
  'daily-revenue-education-sheet': asyncView(() => import('./sheets/DailyRevenueEducationSheet.vue')),
  'employee-attendance-education-sheet': asyncView(() => import('./sheets/EmployeeAttendanceEducationSheet.vue')),
  'customer-info-education-sheet': asyncView(() => import('./sheets/CustomerInfoEducationSheet.vue')),
  'course-schedule-sheet': asyncView(() => import('./sheets/CourseScheduleSheet.vue')),
  'supplier-education-sheet': asyncView(() => import('./sheets/SupplierEducationSheet.vue')),
  'inventory-education-sheet': asyncView(() => import('./sheets/InventoryEducationSheet.vue')),
  'member-education-sheet': asyncView(() => import('./sheets/MemberEducationSheet.vue')),
  'education-course-consumption-sheet': asyncView(() => import('./sheets/EducationCourseConsumptionSheet.vue')),
  'education-renewal-sheet': asyncView(() => import('./sheets/EducationRenewalSheet.vue')),
  'coach-performance-sheet': asyncView(() => import('./sheets/CoachPerformanceSheet.vue')),
  'trial-conversion-sheet': asyncView(() => import('./sheets/TrialConversionSheet.vue')),
  // 美业表格
  'daily-revenue-beauty-sheet': asyncView(() => import('./sheets/DailyRevenueBeautySheet.vue')),
  'employee-attendance-beauty-sheet': asyncView(() => import('./sheets/EmployeeAttendanceBeautySheet.vue')),
  'customer-info-beauty-sheet': asyncView(() => import('./sheets/CustomerInfoBeautySheet.vue')),
  'service-schedule-beauty-sheet': asyncView(() => import('./sheets/ServiceScheduleBeautySheet.vue')),
  'supplier-beauty-sheet': asyncView(() => import('./sheets/SupplierBeautySheet.vue')),
  'inventory-beauty-sheet': asyncView(() => import('./sheets/InventoryBeautySheet.vue')),
  'beauty-member-sheet': asyncView(() => import('./sheets/BeautyMemberSheet.vue')),
  'project-consumption-sheet': asyncView(() => import('./sheets/ProjectConsumptionSheet.vue')),
  'beauty-acquisition-sheet': asyncView(() => import('./sheets/BeautyAcquisitionSheet.vue')),
  'beautician-performance-sheet': asyncView(() => import('./sheets/BeauticianPerformanceSheet.vue')),
  'package-pricing-sheet': asyncView(() => import('./sheets/PackagePricingSheet.vue')),
  // 营销推广新增
  'marketing-activity-sheet': asyncView(() => import('./sheets/MarketingActivitySheet.vue')),
  'channel-comparison-sheet': asyncView(() => import('./sheets/ChannelComparisonSheet.vue')),
  'customer-retention-sheet': asyncView(() => import('./sheets/CustomerRetentionSheet.vue')),
  'referral-tracking-sheet': asyncView(() => import('./sheets/ReferralTrackingSheet.vue')),
  'marketing-budget-sheet': asyncView(() => import('./sheets/MarketingBudgetSheet.vue')),
  'promotion-profit-sheet': asyncView(() => import('./sheets/PromotionProfitSheet.vue'))
}

const toolComponent = computed(() => {
  const code = route.params.code
  return toolComponents[code] || null
})
</script>

<style scoped>
.tool-not-found {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  color: var(--text-secondary);
}
</style>
