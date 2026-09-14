export const BUSINESS_TERMS = Object.freeze({
  organization: '机构',
  campus: '校区',
  course: '课程',
  trialCourse: '体验课',
  coursePackage: '课包',
  owner: '校长',
  consultant: '课程顾问',
  coach: '教练',
  parent: '家长',
  student: '学员',
  consultation: '有效咨询',
  appointment: '预约体验',
  arrival: '实际到店',
  enrollment: '正价报名',
  renewal: '续费',
  referral: '老带新'
})

export const OPERATION_STATUS = Object.freeze({
  needs_review: { label: '需要顾问确认', description: '当前信息还需要结合校区实际情况核实。' },
  pending: { label: '待开始', description: '这项工作还没有开始。' },
  queued: { label: '待开始', description: '这项工作已经记录，等待开始。' },
  processing: { label: '进行中', description: '正在整理本周问题和行动建议。' },
  running: { label: '进行中', description: '正在整理本周问题和行动建议。' },
  completed: { label: '已完成', description: '这项工作已经完成，可以登记经营结果。' },
  succeeded: { label: '已完成', description: '这项工作已经完成，可以登记经营结果。' },
  failed: { label: '未完成', description: '本次没有完成，请检查原因后再试。' },
  failed_final: { label: '未完成', description: '多次尝试后仍未完成，建议联系服务人员。' },
  failed_retryable: { label: '等待再次尝试', description: '本次暂未完成，系统会按规则再次尝试。' },
  cancelled: { label: '已停止', description: '这项工作已经停止。' }
})

export const OPERATION_METRICS = Object.freeze({
  views: { label: '内容播放量', description: '本周期发布内容获得的播放次数。' },
  valid_leads: { label: '有效咨询人数', description: '真正询问课程、价格、时间或体验课的家长人数。' },
  appointments: { label: '预约体验人数', description: '已经约定具体到店日期和时间的家长人数。' },
  arrivals: { label: '实际到店人数', description: '按约到校并参加体验的孩子人数。' },
  trial_completed: { label: '完成体验人数', description: '已经完整参加体验课的孩子人数。' },
  new_sales: { label: '正价报名人数', description: '体验后购买正式课包的学员人数。' },
  renewals: { label: '完成续费人数', description: '本周期已经完成续费的学员人数。' },
  eligible_renewals: { label: '应续费人数', description: '课时即将结束、需要进入续费沟通的学员人数。' },
  spend: { label: '本期招生投入', description: '本周期用于内容、活动或投放的实际费用。' },
  cac: { label: '单个新生招生成本', description: '本期招生投入除以正价报名人数。', abbreviation: 'CAC' },
  ltv: { label: '单个学员在读总收入', description: '一名学员从首次报名到结课、续费带来的总收入。', abbreviation: 'LTV' },
  roi: { label: '招生投入产出', description: '每投入1元招生费用带来的报名收入。', abbreviation: 'ROI' }
})

export const OPERATION_ACTIONS = Object.freeze({
  diagnose: '看看问题出在哪',
  savePeriod: '保存本周期结果',
  createPlan: '制定7天行动',
  review: '回看这7天的结果',
  loadHistory: '查看以前的记录',
  download: '下载经营记录',
  retry: '再试一次',
  membership: '查看适合的服务方案'
})

export const AI_SERVICE_BOUNDARY = Object.freeze({
  basedOnInput: '以下内容根据你填写的信息整理。',
  referenceOnly: '建议作为经营参考，仍需结合校区实际情况确认。',
  consultantReview: '这项判断需要顾问确认。',
  compareAfterExecution: '请连续执行并记录结果，再决定继续还是调整。'
})

export const PUBLIC_FORBIDDEN_TERMS = Object.freeze([
  '智能体矩阵',
  '结构化协议',
  '系统回路',
  '增强回路',
  '调节回路',
  '前端已上线能力',
  '页面方案',
  '未知模块',
  '请求失败',
  'Mock 模式',
  'API Key',
  'Redis'
])

export function operationStatus(value) {
  const key = String(value || '').trim().toLowerCase()
  return OPERATION_STATUS[key] || { label: '状态待确认', description: '请联系服务人员确认当前进度。' }
}

function responseStatus(error) {
  return Number(error?.response?.status || error?.status || 0)
}

export function operationError(error, options = {}) {
  const action = String(options.action || '完成当前操作').trim()
  const status = responseStatus(error)
  const code = String(error?.response?.data?.code || error?.code || '')
  const result = (safeCode, impact, nextStep) => ({
    code: code || safeCode,
    currentAction: action,
    impact,
    nextStep,
    message: `${impact}${nextStep}`
  })

  if (status === 401) return result('LOGIN_REQUIRED', '登录状态已过期，当前操作尚未完成。', '请重新登录后继续。')
  if (status === 403) return result('ACCESS_DENIED', '当前账号暂时不能查看或修改这项内容。', '请联系机构管理员确认权限。')
  if (status === 404) return result('NOT_FOUND', '这项经营记录暂时找不到，当前操作尚未完成。', '请返回工作台重新选择。')
  if (status === 409) return result('CONFLICT', '这项记录已经发生变化，当前操作尚未保存。', '请刷新后再试。')
  if (status === 422 || status === 400) return result('INPUT_REQUIRED', `暂时不能${action}，当前内容未保存。`, '请检查填写内容后再试。')
  if (status === 429) return result('TOO_MANY_REQUESTS', `${action}暂时没有完成。`, '请稍后再试。')
  if (!error?.response) return result('NETWORK_UNAVAILABLE', `${action}暂时没有完成，内容未提交。`, '请检查网络后再试。')
  return result('SERVICE_UNAVAILABLE', `${action}暂时没有完成，内容未提交。`, '请稍后再试；如果多次出现，请联系服务人员。')
}
