const common = {
  industry: '儿童素质培训', source_refs: ['design:2026-08-22-local-life-knowledge-os'], source_category: 'multi_source_consensus',
  source_date: '2026-08-22', evidence_level: 'fused_rule', applicable_conditions: ['机构级聚合数据', '儿童培训获客与经营场景'],
  counterexamples: [], volatility: 'stable', last_verified: '2026-08-22', next_review: '2026-11-22', requires_verification: false,
  license_status: 'internal_canonical', privacy_level: 'public_summary', status: 'canonical', canonical_version: '1.0.0', skill_versions: ['1.0.0'], organization_id: null
}

const rule = (id, title, statement, fields = {}) => ({ ...common, knowledge_id: id, title, statement, product_domain: 'acquisition', channel: ['local'], scene: ['diagnosis'], knowledge_type: 'diagnostic_rule', canonical_topic: id, ...fields })

export const CHILD_TRAINING_KNOWLEDGE = [
  rule('funnel-traffic', '漏斗瓶颈：流量不足', '先检查人群、服务半径和内容基础，不立即增加预算。'),
  rule('funnel-engagement', '漏斗瓶颈：互动有但咨询少', '检查痛点、适龄、地域、信任证据与行动钩子。', { product_domain: 'content' }),
  rule('funnel-arrival', '漏斗瓶颈：预约多但到店少', '检查预约确认、距离、时间、体验说明和提醒。', { product_domain: 'arrival' }),
  rule('funnel-sale', '漏斗瓶颈：到店多但成交少', '检查体验质量、教练反馈、课程适配、价格梯度和销售承接。', { product_domain: 'conversion' }),
  rule('funnel-renewal', '漏斗瓶颈：成交尚可但续费低', '转入教学交付、成长反馈、出勤和家长沟通诊断。', { product_domain: 'renewal', scene: ['renewal'] }),
  rule('douyin-model', '抖音5A/A3仅作概念模型', '播放量不能直接等同A3；POI、搜索和体验产品应以到店结果复盘。', { channel: ['douyin'], scene: ['cold_start', 'daily_acquisition'], knowledge_type: 'principle' }),
  rule('douyin-dynamic', '抖音动态规则需复核', '平台算法、入口、固定半径、CTR与ROI只作为待验证假设。', { channel: ['douyin'], knowledge_type: 'platform_fact', volatility: 'high', requires_verification: true, next_review: '2026-09-21', evidence_level: 'single_source_experience' }),
  rule('xhs-six-dimensions', '小红书六维诊断', '依次检查账号基建、SEO关键词、标题封面、内容价值、私信或体验课承接、到店成交。', { product_domain: 'content', channel: ['xhs'], scene: ['cold_start', 'daily_acquisition'] }),
  rule('trial-offer', '体验课货盘口径', '体验产品需明确适龄、目标、过程、教练反馈、正价课衔接和退款边界。', { product_domain: 'offer', scene: ['trial_class'], knowledge_type: 'sop' }),
  rule('content-action-card', '内容行动卡', '内容优先覆盖家长问题、课堂过程、教练专业、成长证据与负责人信任人格，并给出明确下一步。', { product_domain: 'content', channel: ['douyin', 'xhs'], knowledge_type: 'action_card', action_card: { action_id: 'content-next-step', trigger_problem: '内容无有效咨询', goal: '验证单一内容方向的有效咨询能力', steps: ['选一个家长问题', '制作含本地与适龄信息的内容', '加入明确体验咨询动作', '按聚合指标复盘'], owner_role: 'marketing_lead', duration: '7天', baseline_metric: 'valid_leads', success_metric: '有效咨询较基线改善', stop_condition: '连续两轮无改善或出现合规风险', required_evidence: ['发布记录', '聚合咨询数据'], review_at: '第7天' } }),
  rule('traffic-experiment', '小额投流实验', '按基建检查、自然验证、承接检查、利润测算、小额试验、复盘后再决定放大。', { product_domain: 'paid_traffic', channel: ['douyin', 'xhs'], scene: ['experiment'], knowledge_type: 'action_card', action_card: { action_id: 'small-budget-test', trigger_problem: '自然内容已验证且需扩大样本', goal: '验证获客成本与到店结果', steps: ['检查基建', '确认自然内容信号', '检查承接', '测算单客利润', '设置预算上限后小额试验'], owner_role: 'principal', duration: '3-7天', baseline_metric: 'cost_per_valid_lead', success_metric: '成本与到店达到机构预设边界', stop_condition: '承接无效、利润不清、超预算或数据异常立即停止', required_evidence: ['利润口径', '预算上限', '聚合到店数据'], review_at: '试验结束后24小时内' } }),
  rule('traffic-prohibition', '禁止扩大投流条件', '没有有效承接、利润口径、预算上限、验证周期和停止条件时，禁止建议扩大投流。', { product_domain: 'paid_traffic', scene: ['experiment'], knowledge_type: 'risk' }),
  rule('cross-industry-limit', '跨行业材料限制', '餐饮、团购、医美材料只能作为低优先级类比，不得生成儿童培训强制动作。', { evidence_level: 'cross_industry_analogy', source_category: 'cross_industry_analogy', applicable_conditions: ['仅用于提出待验证假设'], analogy_only: true, knowledge_type: 'risk' }),
  rule('funnel-definition', '儿童培训统一经营漏斗', '曝光→点击/阅读→有效咨询→预约→到店→完成体验→正价报名→教学交付→续费/转介绍。', { product_domain: 'metrics', knowledge_type: 'formula' })
]

export function transitionKnowledge(item, nextStatus, { reviewerId, reason = '', now = new Date() } = {}) {
  const allowed = { raw: ['pending_review'], pending_review: ['verified', 'revoked'], verified: ['canonical', 'conflicted', 'archived'], canonical: ['conflicted', 'expired', 'revoked', 'archived'], conflicted: ['verified', 'revoked', 'archived'], expired: ['verified', 'revoked', 'archived'], revoked: ['archived'], archived: [] }
  if (!allowed[item.status]?.includes(nextStatus)) throw new Error(`Invalid knowledge transition: ${item.status} -> ${nextStatus}`)
  if (['verified', 'canonical'].includes(nextStatus) && !reviewerId) throw new Error('Reviewer is required')
  return { ...item, status: nextStatus, review: { reviewer_id: reviewerId || null, decision: nextStatus, reason, reviewed_at: now.toISOString() } }
}

export function assertUniqueCanonicalVersion(items) {
  const seen = new Set()
  for (const item of items.filter(x => x.status === 'canonical')) {
    const key = `${item.canonical_topic}:${item.canonical_version}`
    if (seen.has(key)) throw new Error(`Duplicate canonical version: ${key}`)
    seen.add(key)
  }
  return true
}
