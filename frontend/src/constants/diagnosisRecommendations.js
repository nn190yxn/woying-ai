const diagnosisRecommendationConfig = {
  douyin: {
    prefix: 'douyin-',
    defaultsBefore: ['quick-plan'],
    defaultsAfter: ['video-diagnoser'],
    limit: 5,
    dimensionActions: {
      traffic: ['topic-generator', 'title-optimizer', 'cover-helper', 'video-diagnoser'],
      content: ['topic-generator', 'script-generator', 'cover-helper', 'video-diagnoser'],
      conversion: ['conversion-path', 'product-pricing', 'script-generator', 'video-diagnoser'],
      retention: ['conversion-path', 'script-generator', 'product-pricing', 'video-diagnoser'],
      ads: ['local-ad-strategy', 'video-diagnoser', 'conversion-path', 'script-generator']
    },
    catalog: {
      'quick-plan': { code: 'quick-plan', type: '作战计划', title: '生成 15 天提升计划', desc: '把主短板拆成每天的内容、转化、投流和复盘动作。', path: '/douyin/quick-plan', primary: true },
      'script-generator': { code: 'script-generator', type: '执行工具', title: '生成短视频脚本', desc: '围绕诊断短板快速生成口播、剧情或探店脚本。', path: '/douyin/script-generator' },
      'topic-generator': { code: 'topic-generator', type: '执行工具', title: '查找高潜力选题', desc: '用行业和痛点生成下一批同城获客选题。', path: '/douyin/topic-generator' },
      'title-optimizer': { code: 'title-optimizer', type: '内容工具', title: '优化视频标题', desc: '把弱项对应的痛点改成更容易点击的标题。', path: '/douyin/title-optimizer' },
      'cover-helper': { code: 'cover-helper', type: '内容工具', title: '生成封面钩子', desc: '强化首屏卖点，提高同城用户停留和点击。', path: '/douyin/cover-helper' },
      'product-pricing': { code: 'product-pricing', type: '转化工具', title: '优化组品定价', desc: '重排引流品、利润品和复购品，减少有流量无成交。', path: '/douyin/product-pricing' },
      'conversion-path': { code: 'conversion-path', type: '转化工具', title: '优化转化链路', desc: '检查团购、私信、企微和到店承接的断点。', path: '/douyin/conversion-path' },
      'local-ad-strategy': { code: 'local-ad-strategy', type: '投流工具', title: '生成本地推策略', desc: '根据目标和素材状态匹配投放方向。', path: '/douyin/local-ad-strategy' },
      'video-diagnoser': { code: 'video-diagnoser', type: '数据复盘', title: '复盘视频数据', desc: '用播放、完播、互动和咨询数据判断下一轮优化点。', path: '/douyin/video-diagnoser' }
    }
  },
  xhs: {
    prefix: 'xhs-',
    defaultsBefore: ['quick-start-plan'],
    defaultsAfter: ['note-diagnoser'],
    limit: 4,
    catalog: {
      'quick-start-plan': { code: 'quick-start-plan', type: '作战计划', title: '生成 15 天起号计划', desc: '把账号短板拆成每日发布、互动和复盘动作。', path: '/xhs/quick-start-plan' },
      'topic-generator': { code: 'topic-generator', type: '内容工具', title: '查找爆款选题', desc: '围绕赛道和搜索意图生成下一批笔记选题。', path: '/xhs/topic-generator' },
      'title-generator': { code: 'title-generator', type: '内容工具', title: '生成高点击标题', desc: '用标题公式提升点击、收藏和搜索命中。', path: '/xhs/title-generator' },
      'cover-helper': { code: 'cover-helper', type: '内容工具', title: '优化封面文案', desc: '强化首图钩子和收藏理由。', path: '/xhs/cover-helper' },
      'script-generator': { code: 'script-generator', type: '执行工具', title: '生成正文脚本', desc: '把诊断短板转成图文或视频正文结构。', path: '/xhs/script-generator' },
      'note-diagnoser': { code: 'note-diagnoser', type: '数据复盘', title: '诊断笔记数据', desc: '用阅读、互动和收藏数据判断问题。', path: '/xhs/note-diagnoser' },
      'account-reviewer': { code: 'account-reviewer', type: '数据复盘', title: '账号复盘', desc: '按周/月复盘账号趋势和有效内容规律。', path: '/xhs/account-reviewer' },
      'conversion-optimizer': { code: 'conversion-optimizer', type: '转化工具', title: '优化转化链路', desc: '检查主页、私信、引流和成交承接。', path: '/xhs/conversion-optimizer' },
      'growth-strategy': { code: 'growth-strategy', type: '战略规划', title: '90 天增长战略', desc: '把账号体检结果扩展为季度增长节奏。', path: '/xhs/growth-strategy' }
    }
  },
  private: {
    prefix: 'private-',
    defaultsBefore: ['retention-plan'],
    limit: 4,
    catalog: {
      'retention-plan': { code: 'retention-plan', type: '作战计划', title: '生成复购留存方案', desc: '把沉睡客户、复购节奏和会员触达拆成执行动作。', path: '/private/retention-plan' },
      'community-sop': { code: 'community-sop', type: '运营工具', title: '生成社群 SOP', desc: '制定每日社群运营日历、互动动作和风险红线。', path: '/private/community-sop' },
      'member-design': { code: 'member-design', type: '会员工具', title: '设计会员体系', desc: '设计储值方案、等级权益和会员日机制。', path: '/private/member-design' },
      'cac-ltv': { code: 'cac-ltv', type: '经营计算', title: '计算 CAC vs LTV', desc: '判断私域增长是否具备可持续投入空间。', path: '/private/cac-ltv' },
      'full-strategy': { code: 'full-strategy', type: '战略规划', title: '90 天私域战略', desc: '把诊断结果扩展为季度私域增长节奏。', path: '/private/full-strategy' }
    }
  }
}

const normalizeActionCode = (code, prefix) => String(code || '').replace(new RegExp(`^${prefix}`), '')

export const getRecommendedDiagnosisActions = (channel, { recommendedNext = [], weakestDimension = '', limit } = {}) => {
  const config = diagnosisRecommendationConfig[channel]
  if (!config) return []

  const dimensionActions = config.dimensionActions?.[weakestDimension] || []
  const backendCodes = recommendedNext.map(code => normalizeActionCode(code, config.prefix))
  const codes = [
    ...(config.defaultsBefore || []),
    ...dimensionActions,
    ...backendCodes,
    ...(config.defaultsAfter || [])
  ]

  return [...new Set(codes)]
    .map(code => config.catalog[code])
    .filter(Boolean)
    .slice(0, limit || config.limit || 4)
}
