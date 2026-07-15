export const quickPlanIndustryOptions = [
  { value: 'restaurant', label: '餐饮' },
  { value: 'beauty', label: '美业' },
  { value: 'education', label: '教培' },
  { value: 'service', label: '生活服务' }
]

export const quickPlanGoalOptions = [
  { value: 'traffic', label: '快速起量（提播放）' },
  { value: 'conversion', label: '预约/成交转化（提到店）' },
  { value: 'leads', label: '线索收集（提私信）' },
  { value: 'live', label: '直播预热（提预约）' }
]

export const quickPlanStatusOptions = [
  { value: '未开始', className: 'status-pending' },
  { value: '进行中', className: 'status-active' },
  { value: '已完成', className: 'status-done' },
  { value: '已复盘', className: 'status-reviewed' }
]

export const quickPlanFieldLabels = {
  day: '天数',
  phase: '阶段',
  goal: '今日目标',
  workType: '作品类型',
  videoFunction: '视频功能',
  shootingMethod: '拍摄方式',
  topicDirection: '内容方向',
  executionTool: '执行工具',
  adPlan: '投流安排',
  customerNurture: '客户培育',
  reviewMetrics: '复盘指标',
  shootingScript: '拍摄文案',
  status: '任务状态'
}

export const quickPlanWeaknessGoalMap = {
  traffic: 'traffic',
  content: 'traffic',
  conversion: 'conversion',
  retention: 'conversion',
  ads: 'conversion'
}

export const quickPlanWeaknessLabelMap = {
  traffic: '流量力',
  content: '内容力',
  conversion: '转化力',
  retention: '留存力',
  ads: '投流力'
}

export const quickPlanIndustryAliasMap = {
  restaurant: 'restaurant',
  food: 'restaurant',
  catering: 'restaurant',
  '餐饮': 'restaurant',
  '餐饮店': 'restaurant',
  beauty: 'beauty',
  medical_beauty: 'beauty',
  '美业': 'beauty',
  '美容': 'beauty',
  '医美': 'beauty',
  '美甲': 'beauty',
  '美睫': 'beauty',
  education: 'education',
  edu: 'education',
  training: 'education',
  '教培': 'education',
  '教育': 'education',
  service: 'service',
  local_service: 'service',
  '生活服务': 'service',
  '同城服务': 'service'
}

export const normalizeQuickPlanIndustryCode = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  return quickPlanIndustryAliasMap[raw] || value || 'restaurant'
}
