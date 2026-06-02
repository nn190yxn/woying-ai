// Failover and retry mechanism for tool execution

import { logger } from '../middleware/logger.js'
import { createToolResult } from './resultSchema.js'

const FESTIVAL_LABEL_MAP = {
  newyear: '元旦/新年',
  spring: '春节',
  valentine: '情人节',
  lantern: '元宵节',
  woman: '妇女节',
  zhishu: '植树节',
  fool: '愚人节',
  qixi: '七夕节',
  midautumn: '中秋节',
  national: '国庆节',
  double11: '双十一',
  double12: '双十二',
  christmas: '圣诞节'
}

function getIndustryLabel(formData = {}) {
  const map = {
    catering: '餐饮',
    restaurant: '餐饮',
    education: '教培',
    beauty: '美业',
    service: '服务',
    retail: '零售',
    generic: '门店'
  }

  return map[formData.industry] || formData.industry || '门店'
}

function splitValues(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean)
  }

  return String(value || '')
    .split(/[\n,，、]/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function isAiAvailabilityError(error) {
  return error?.status === 401
    || error?.status === 403
    || error?.status === 408
    || error?.status === 429
    || error?.status >= 500
    || error?.code === 'timeout'
    || error?.code === 'network'
}

function buildRagFallbackResponse(toolConfig, formData = {}, error) {
  const industry = getIndustryLabel(formData)
  const keywords = splitValues(formData.keywords).slice(0, 3)
  const platform = formData.platform || splitValues(formData.platforms)[0] || '抖音'
  const toolCode = toolConfig.code || 'unknown'
  const goalLabelMap = {
    exposure: '曝光',
    acquisition: '获客',
    'boss-ip': '老板IP',
    conversion: '转化',
    repurchase: '复购',
    interaction: '互动涨粉'
  }

  switch (toolCode) {
    case 'headline': {
      const seed = keywords[0] || industry
      const platformLabelMap = { douyin: '抖音', xiaohongshu: '小红书', 'video-account': '视频号' }
      const platformLabel = platformLabelMap[platform] || platform
      const keywordText = keywords.length ? keywords.join('、') : seed
      const headlineSeeds = [
        `做${industry}，别只发优惠，先把${keywordText}讲清楚`,
        `${industry}老板必看：${seed}这样表达更容易被咨询`,
        `为什么你的${seed}内容有播放却没转化？`,
        `${platformLabel}上${industry}内容想起量，先避开这 3 个误区`,
        `客户选择${industry}前，真正想看的不是价格`,
        `同样做${industry}，为什么有的店更容易被记住？`,
        `${seed}怎么讲才不像硬广？直接给你一个思路`,
        `别再盲目拍${industry}日常了，先拍这个成交细节`,
        `一个让${industry}客户更愿意留言咨询的标题写法`,
        `把${keywordText}说具体，客户才知道为什么找你`
      ]
      return {
        summary: `已为您生成 10 条${industry}${platformLabel}标题备选`,
        sections: [
          {
            title: '标题建议',
            items: headlineSeeds
          },
          {
            title: '标题公式',
            items: [
              `痛点型：客户现在不敢下单，是因为没看懂${seed}的真实价值`,
              `对比型：同样是${industry}，为什么别人更容易让客户相信`,
              `结果型：把${keywordText}讲具体，咨询率会比空喊优惠更稳`,
              `避坑型：${platformLabel}标题不要只追热点，要保留行业词和行动理由`
            ]
          },
          {
            title: '使用建议',
            items: [
              '优先测试前 3 条标题，分别观察点击率、完播率和咨询率',
              `标题必须保留“${industry} + ${seed} + 行动理由”三个信息点`,
              '发布前把标题压缩到 20-28 字，避免过长导致重点丢失',
              `如果用于${platformLabel}，标题不要只写热闹，要让客户知道看完能解决什么问题`
            ]
          }
        ],
        actions: [
          { priority: 'high', title: '先测3条标题', description: '优先发布最贴近当前产品和客户痛点的 3 条标题', owner: '运营', timeline: '今天' }
        ],
        recommendedTools: ['hook', 'script', 'xiaohongshu'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'topic': {
      const rawGoal = splitValues(formData.goals)[0] || 'acquisition'
      const goal = goalLabelMap[rawGoal] || rawGoal || '获客'
      const count = Number(formData.count) || 10
      const contentType = splitValues(formData.contentTypes)[0] || 'real-shot'
      const scene = splitValues(formData.scenes)[0] || 'store'
      const platformLabelMap = { douyin: '抖音', xiaohongshu: '小红书', 'video-account': '视频号' }
      const typeLabelMap = { talking: '口播讲解', 'real-shot': '实拍记录', tutorial: '教程教学', case: '案例分享', drama: '剧情演绎', interactive: '互动挑战' }
      const sceneLabelMap = { store: '店内现场', kitchen: '后厨/交付现场', office: '办公室', outdoor: '户外场景', home: '居家场景' }
      const platformLabel = platformLabelMap[platform] || platform
      const typeLabel = typeLabelMap[contentType] || contentType
      const sceneLabel = sceneLabelMap[scene] || scene
      const topicSeeds = [
        `为什么${industry}老板做${goal}不能只发优惠`,
        `${industry}客户下单前最关心的 3 个问题`,
        `用一个真实案例讲清楚${industry}的信任感`,
        `${sceneLabel}里最容易被忽略的成交细节`,
        `${platformLabel}上${industry}内容怎么避免只热视频不转化`,
        `新客户第一次了解${industry}时最需要看到什么`,
        `${industry}老客户愿意复购的真实原因`,
        `把${industry}服务过程拍出来，客户会更容易相信你`,
        `同样做${industry}，为什么有的内容更容易被咨询`,
        `${industry}老板每天可以拍的一条低成本内容`
      ]
      const items = Array.from({ length: Math.min(count, 10) }, (_, index) => {
        const n = index + 1
        const title = topicSeeds[index] || `${industry}${goal}内容方向 ${n}`
        return `选题${n}：${title}\n拍摄方式：用${typeLabel}在${sceneLabel}呈现，开头先抛客户顾虑，中段给真实判断，结尾引导咨询或到店。\n推荐理由：这个选题能把${goal}目标和客户决策问题连起来，不只是追播放。\n标签：#${industry} #${goal} #${platformLabel}`
      })

      return {
        summary: `已为您生成 ${items.length} 个${industry}${platformLabel}选题方向`,
        sections: [
          { title: '选题清单', items },
          {
            title: '首发拍摄安排',
            items: [
              `第1条先拍“客户为什么不行动”，适合用${sceneLabel}真实画面承接`,
              `第2条拍“客户最常问的问题”，用${typeLabel}直接回答，避免绕弯`,
              '第3条拍“真实案例或服务过程”，用结果和细节建立信任'
            ]
          },
          {
            title: '执行建议',
            items: [`先从${sceneLabel}能直接拍到的内容开始，降低执行成本`, `每条内容只讲一个${goal}相关问题，不要把优惠、案例和老板观点混在一起`, `发布后重点看咨询率、收藏率和评论问题，而不是只看播放量`, '如果某条只有播放没有咨询，优先重写标题和结尾行动指令']
          }
        ],
        actions: [
          { priority: 'critical', title: '确定首发 3 条', description: '从清单中挑 3 个最接近当下经营目标的方向，按“顾虑-问题-案例”顺序拍摄', owner: '内容', timeline: '今天' },
          { priority: 'high', title: '复盘有效指标', description: '发布后重点看咨询率、收藏率、评论问题和私信关键词，不只看播放量', owner: '运营', timeline: '发布后48小时' }
        ],
        recommendedTools: ['headline', 'hook', 'script'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'festival': {
      const festival = FESTIVAL_LABEL_MAP[formData.festival] || formData.customFestival || formData.festival || '节日活动'
      const goalLabelMap = { promote: '促销转化', brand: '品牌曝光', customer: '客户关怀', product: '新品推广' }
      const contentTypeMap = { poster: '朋友圈海报文案', video: '短视频文案', group: '微信群发消息', article: '公众号推文' }
      const goal = goalLabelMap[formData.goal] || formData.goal || '促销转化'
      const contentType = contentTypeMap[formData.contentType] || formData.contentType || '朋友圈海报文案'
      const benefitMap = {
        '餐饮': ['节日限定套餐', '双人同行权益', '老客到店小礼'],
        '美业': ['节日护理体验价', '老客专属加赠项目', '到店咨询礼'],
        '教培': ['节日试听名额', '老生续报权益', '家长咨询资料包'],
        '零售': ['节日精选组合', '满额赠品', '会员专享折扣'],
        '生活服务': ['节日预约优先权', '老客复购权益', '套餐升级服务']
      }
      const benefits = benefitMap[industry] || ['节日专属权益', '老客回馈权益', '到店咨询礼']
      return {
        summary: `已为您生成 ${festival}${industry}${goal}活动执行方案`,
        sections: [
          {
            title: '文案方向',
            items: [
              `方向一：${festival}限时福利，突出“现在行动更划算”，适合${goal}目标`,
              `方向二：${festival}客户回馈，突出老客户专属权益，适合唤醒沉默客户`,
              `方向三：${festival}主题活动，突出氛围感和参与感，适合做${contentType}`
            ]
          },
          {
            title: '示例文案',
            items: [
              `${festival}到了，${industry}门店这次把权益说清楚：到店/咨询可享${benefits[0]}，适合最近正准备体验或复购的客户。`,
              `这次${festival}活动不只做低价，更想把${benefits[1]}讲明白，让客户知道为什么现在来更合适。`,
              `老客户可以重点关注这次${festival}专属安排，${benefits[2]}建议限时开放，既有回馈感，也方便集中转化。`
            ]
          },
          {
            title: '渠道节奏',
            items: [
              `预热期：提前 2-3 天用${contentType}讲清楚活动主题和适合人群`,
              '集中期：活动当天重点推权益、截止时间和到店/咨询路径',
              '收口期：活动结束前 6 小时提醒名额、库存或预约档期，推动最后转化'
            ]
          },
          {
            title: '执行建议',
            items: ['把活动利益点写成一句大白话，不要同时塞太多权益', '必须写清楚截止时间、适用人群和核销方式', '朋友圈、社群、短视频统一使用同一套主视觉和主文案', '活动结束后复盘咨询数、到店数、成交数和老客唤醒数']
          },
          {
            title: '转化指标',
            items: ['咨询数：有多少人主动问活动细节', '到店/预约数：有多少人完成到店、预约或下单动作', '成交数：有多少人实际付款或锁定名额', '老客唤醒数：有多少沉默老客重新互动或复购']
          }
        ],
        actions: [
          { priority: 'critical', title: '确定唯一主权益', description: `从${benefits.join('、')}中选一个主权益作为活动核心，不要同时推太多卖点`, owner: '运营', timeline: '今天' },
          { priority: 'high', title: '统一渠道话术', description: '把朋友圈、社群、短视频和到店口播统一成同一套活动表达', owner: '店长/运营', timeline: '活动前' },
          { priority: 'medium', title: '复盘转化数据', description: '活动结束后记录咨询数、到店数、成交数和老客唤醒数，作为下次活动基线', owner: '运营', timeline: '活动后24小时' }
        ],
        recommendedTools: ['friend', 'headline'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'business-plan': {
      const projectName = formData.projectName || '当前项目'
      return {
        summary: `已为您生成 ${projectName} 的商业计划基础框架`,
        sections: [
          { title: '项目定位', items: [`项目名称：${projectName}`, `所属行业：${industry}`, `目标客户：${formData.targetCustomer || '周边有明确消费需求的核心客群'}`, `核心产品/服务：${formData.product || '建议聚焦 1-2 个高频成交主打项'}`] },
          { title: '盈利逻辑', items: ['先做一个明确主打产品，确保流量入口清晰', '再通过复购、加购或组合销售提升单客价值', '把获客成本、毛利率和复购率作为前三个核心指标'] },
          { title: '90天推进计划', items: ['第1阶段：明确定位、产品结构和价格带', '第2阶段：搭建获客内容和转化话术', '第3阶段：复盘成交数据，优化高利润项目'] }
        ],
        actions: [
          { priority: 'high', title: '补充经营数据', description: '补齐实际投入、客单价、转化率和复购数据，再做第二轮细化', owner: '老板', timeline: '3天内' }
        ],
        recommendedTools: ['competitor', 'price-increase', 'diagnosis'],
        riskNotes: [`当前 AI 网关不可用，以上内容为可执行框架版，不是完整长文计划书。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'fission': {
      return {
        summary: `已为您生成 ${industry}裂变活动基础方案`,
        sections: [
          { title: '活动结构', items: ['老客转介绍奖励：给老客一个明确、低门槛、可即时兑现的奖励', '新客到店激励：把首次到店利益点做得足够直接', '成交后的二次传播：让已成交客户继续帮你扩散'] },
          { title: '执行步骤', items: ['先确定活动周期和奖品成本上限', '准备海报、朋友圈文案、私聊话术三件套', '每天统计：分享人数、到店人数、成交人数、转介绍率'] },
          { title: '关键指标', items: ['单个新客获取成本', '老客参与率', '到店转化率', '活动总 ROI'] }
        ],
        actions: [
          { priority: 'high', title: '先小范围测试', description: '先对 20-50 个老客户做第一轮测试，避免一上来大范围铺开', owner: '运营', timeline: '本周内' }
        ],
        recommendedTools: ['friend', 'headline', 'roi'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'friend': {
      const scene = formData.scene || `${industry}门店`
      const highlight = formData.highlight || '真实体验'
      const typeMap = {
        product: '产品推广',
        activity: '活动促销',
        personal: '个人分享',
        coupon: '优惠券推广'
      }
      const copyType = typeMap[formData.type] || formData.type || '日常发圈'
      return {
        summary: `已为您生成 3 条${scene}${copyType}朋友圈文案`,
        sections: [
          {
            title: '文案模板',
            items: [
              `${scene}今天主推「${highlight}」，不是简单做活动，而是把客户最在意的价值讲清楚。现在来咨询/到店，更容易感受到差异。`,
              `如果你最近在关注${scene}相关选择，这次我想重点推荐「${highlight}」这一点。很多客户最终下单，往往就是因为它更省心、更直接。`,
              `不是每次发圈都要喊优惠，这次更想把${scene}真正值得说的地方讲明白：${highlight}。看懂这一点，客户更容易产生信任。`
            ]
          },
          {
            title: '发布建议',
            items: ['首条突出卖点，第二条补场景，第三条给行动引导', '配图优先用门店实拍或真实服务场景', '标题和正文都尽量保留“行业 + 卖点 + 场景”三个信息点']
          }
        ],
        actions: [
          { priority: 'high', title: '补齐真实场景', description: '把文案中的门店场景和客户使用场景换成真实案例再发布', owner: '运营', timeline: '今天' }
        ],
        recommendedTools: ['selling-point', 'headline']
      }
    }

    case 'marketing-plan': {
      const goal = formData.goal || '提升营业额'
      const budget = formData.budget || '5000'
      const duration = formData.duration || formData.period || '1个月'
      return {
        summary: `已为您生成 ${industry}${goal}基础营销方案`,
        sections: [
          { title: '目标与边界', items: [`行业：${industry}`, `目标：${goal}`, `预算：${budget}`, `周期：${duration}`] },
          { title: '核心动作', items: ['先做活动利益点统一表达，再做渠道分发', '用朋友圈/社群/短视频三个入口做同一主题触达', '每天复盘咨询量、到店量、成交量，及时调预算和话术'] },
          { title: '执行节奏', items: ['前20%周期做预热和素材测试', '中间60%周期做集中放量', '最后20%周期做催单、复购和复盘'] }
        ],
        actions: [
          { priority: 'high', title: '先定唯一主活动', description: '本轮方案先围绕一个核心活动推进，不要多个活动并发分散预算', owner: '运营', timeline: '今天' }
        ],
        recommendedTools: ['friend', 'festival', 'headline']
      }
    }

    case 'salary': {
      const position = formData.position || '核心岗位'
      return {
        summary: `已为您生成 ${industry}${position} 薪酬设计框架`,
        sections: [
          { title: '建议结构', items: ['固定底薪：保障基本稳定性', '绩效提成：与成交、消耗、复购或服务质量挂钩', '团队奖金：绑定门店整体目标，避免只顾个人业绩'] },
          { title: '落地原则', items: ['员工必须能一眼看懂怎么拿钱', '不要设置过多复杂条件', '提成口径和结算周期要提前写清楚'] },
          { title: '示例口径', items: [`岗位：${position}`, '底薪占总收入 40%-60%', '绩效部分优先绑定最关键的 1-2 个经营指标'] }
        ],
        actions: [
          { priority: 'high', title: '补齐当地薪资基准', description: '结合当地招聘市场价格，给底薪和提成范围做二次校准', owner: '老板/店长', timeline: '3天内' }
        ],
        recommendedTools: ['schedule', 'labor-efficiency-education', 'salary-cost-ratio-restaurant'],
        riskNotes: [`当前 AI 网关不可用，以上内容为规则框架版。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'ip-agent': {
      return {
        summary: `已为您生成 ${industry}老板 IP 基础定位建议`,
        sections: [
          { title: '定位建议', items: ['先回答三个问题：你是谁、你最懂什么、客户为什么信你', '优先讲真实经历、真实案例、真实判断，不要空喊口号', '把“行业经验 + 个性表达 + 明确人群”组合成一句定位'] },
          { title: '内容方向', items: ['讲客户常见问题', '讲你做事的方法和标准', '讲真实经营复盘与踩坑经验'] },
          { title: '表达方式', items: ['说人话，不堆术语', '一条内容只讲一个观点', '尽量用门店现场和真实案例增强信任'] }
        ],
        actions: [
          { priority: 'high', title: '先定一句定位', description: '先写出一句 20-30 字的老板定位介绍，后续所有内容围绕它展开', owner: '老板', timeline: '今天' }
        ],
        recommendedTools: ['topic', 'headline', 'script'],
        riskNotes: [`当前 AI 网关不可用，以上内容为规则框架版。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'competitor': {
      const competitor = formData.competitor || '同区域同行'
      return {
        summary: `已为您生成 ${competitor} 的竞品分析框架`,
        sections: [
          { title: '优先观察项', items: ['对手主打产品和价格带', '对手主视觉、宣传话术和高频卖点', '对手线上内容更新频率和互动方式', '对手门店体验、服务速度和复购动作'] },
          { title: '差异化切入', items: ['不要全面对打，先找一个最容易被客户感知的优势点', '优先打“更快、更稳、更省心、更懂客户”中的一项', '把差异化点写进标题、海报、销售话术和到店体验'] },
          { title: '执行建议', items: ['做一张竞品对比表，每周更新一次', '每次只优化一个核心差异点，避免团队分散', '把客户最常提到的对手优势转成自己的补位动作'] }
        ],
        actions: [
          { priority: 'high', title: '做一版对比表', description: '列出自己与竞品在价格、产品、体验、内容上的差异', owner: '运营/老板', timeline: '2天内' }
        ],
        recommendedTools: ['price-increase', 'business-plan', 'diagnosis'],
        riskNotes: [`当前 AI 网关不可用，以上内容为规则框架版。错误信息：${error.message}`],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    default:
      return null
  }
}

export function createRagFallbackResult(toolConfig, formData = {}, error) {
  const toolCode = toolConfig.code || 'unknown'
  const ragFallback = buildRagFallbackResponse(toolConfig, formData, error)
  if (!ragFallback) return null

  return createToolResult(ragFallback, {
    degraded: true,
    engineType: toolConfig.engineType,
    toolCode,
    fallbackType: ragFallback.extra?.fallbackType || 'rule-based-rag',
    includeCTA: true,
    customizationCTA: '\n---\n如需针对您的具体场景做个性化定制方案，升级会员即可获得专属深度定制服务。'
  })
}

// Retry with exponential backoff
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    maxDelay = 5000,
    timeout = 15000,
    onRetry = null
  } = options

  let lastError

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('操作超时，请稍后重试')), timeout)
      })

      // Race between the operation and timeout
      const result = await Promise.race([fn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error

      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 500,
          maxDelay
        )

        logger.warn('failover', `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: error.message
        })

        if (onRetry) {
          onRetry(attempt + 1, error)
        }

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

// Fallback response for tool failures
export function getFallbackResponse(toolName, toolCode) {
  return createToolResult({
    status: 'fallback',
    summary: `${toolName}生成失败`,
    sections: [
      {
        title: '系统提示',
        items: [
          '抱歉，当前服务繁忙，未能完成生成。',
          '您可以稍后重试，或联系客服处理。',
          '如需稳定服务，建议升级会员享受优先处理通道。'
        ]
      }
    ],
    actions: [
      {
        priority: 'high',
        title: '稍后重试',
        description: '等待1-2分钟后再次尝试生成',
        owner: '用户',
        timeline: '立即'
      }
    ],
    recommendedTools: [],
    extra: { isFallback: true, toolCode }
  }, {
    degraded: true,
    toolCode,
    fallbackType: 'generic-fallback',
    includeCTA: true,
    customizationCTA: '\n---\n升级会员即可获得专属深度定制服务及优先处理通道。'
  })
}

// Wrap tool execution with failover
export async function executeWithFailover(toolConfig, formData, executeFn) {
  const toolName = toolConfig.name || toolConfig.code || '未知工具'
  const toolCode = toolConfig.code || 'unknown'
  const startTime = Date.now()

  try {
    const result = await retryWithBackoff(
      () => withTimeout(executeFn(toolConfig, formData), 25000),
      {
        maxRetries: 1,
        baseDelay: 500,
        timeout: 20000,
        onRetry: (attempt, error) => {
          logger.warn('failover', `Retrying ${toolCode}`, {
            attempt,
            error: error.message,
            toolCode
          })
        }
      }
    )

    const duration = Date.now() - startTime
    logger.toolSuccess(null, toolCode, duration)
    logger.info('generate', `${toolCode} | degraded=false | ${duration}ms`, { toolCode, degraded: false, duration })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.toolFailure(null, toolCode, error, duration)

    if (toolConfig.engineType === 'rag' && isAiAvailabilityError(error)) {
      const result = createRagFallbackResult(toolConfig, formData, error)
      if (result) {
        logger.info('generate', `${toolCode} | degraded=true | ${duration}ms`, { toolCode, degraded: true, duration })
        return result
      }
    }

    // Return fallback response instead of throwing
    const result = getFallbackResponse(toolName, toolCode)
    logger.info('generate', `${toolCode} | degraded=true | ${duration}ms`, { toolCode, degraded: true, duration })
    return result
  }
}

// Timeout wrapper for any async operation
export async function withTimeout(promise, timeoutMs, fallback = null) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (fallback !== null) {
        resolve(fallback)
      } else {
        reject(new Error('操作超时'))
      }
    }, timeoutMs)

    promise.then(
      result => {
        clearTimeout(timer)
        resolve(result)
      },
      err => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}
