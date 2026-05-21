// Failover and retry mechanism for tool execution

import { logger } from '../middleware/logger.js'
import { createToolResult } from './resultSchema.js'
import { getIndustryData } from './industryKnowledge.js'

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
  const platformLabelMap = { douyin: '抖音', xiaohongshu: '小红书', 'video-account': '视频号' }
  const platformLabel = platformLabelMap[platform] || platform
  const seed = keywords[0] || formData.product || formData.topic || industry

  switch (toolCode) {
    case 'headline': {
      const keywordText = keywords.length ? keywords.join('、') : seed
      return {
        summary: `已为您生成 10 条${industry}${platformLabel}标题备选`,
        sections: [
          {
            title: '标题建议',
            items: [
              `做${industry}，先把${keywordText}讲清楚`,
              `${industry}老板必看：${seed}这样表达更容易被咨询`,
              `${seed}内容有播放却没转化的 3 个原因`,
              `${platformLabel}上${industry}内容想起量，先避开这 3 个误区`,
              `客户选择${industry}前，真正想看的核心信息`,
              `同样做${industry}，为什么有的店更容易被记住？`,
              `${seed}怎么讲才像真实经验？直接给你一个思路`,
              `别再盲目拍${industry}日常了，先拍这个成交细节`,
              `一个让${industry}客户更愿意留言咨询的标题写法`,
              `把${keywordText}说具体，客户才知道为什么找你`
            ]
          },
          { title: '标题公式', items: [`痛点型：客户现在迟迟没行动，是因为没看懂${seed}的真实价值`, `对比型：同样是${industry}，为什么别人更容易让客户相信`, `结果型：把${keywordText}讲具体，咨询率会比空喊优惠更稳`] }
        ],
        actions: [
          { priority: 'high', title: '先测3条标题', description: '优先发布最贴近当前产品和客户痛点的 3 条标题', owner: '运营', timeline: '今天' },
          { priority: 'medium', title: '建立标题数据表', description: '记录每条标题的点击率、完播率、咨询率和评论关键词', owner: '运营', timeline: '发布后48小时' }
        ],
        recommendedTools: ['hook', 'script', 'xiaohongshu'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '标题需与正文和实际服务能力一致，尤其是美业、教培、健康等服务类内容。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'topic': {
      const goal = splitValues(formData.goals)[0] || '获客'
      const count = Math.min(Number(formData.count) || 10, 10)
      const items = Array.from({ length: count }, (_, index) => `选题${index + 1}：${industry}${goal}内容方向 ${index + 1}\n拍摄方式：用真实门店场景呈现，开头先抛客户顾虑，中段给真实判断，结尾引导咨询或到店。\n推荐理由：这个选题能把${goal}目标和客户决策问题连起来。`)
      return {
        summary: `已为您生成 ${items.length} 个${industry}${platformLabel}选题方向`,
        sections: [{ title: '选题清单', items }, { title: '执行建议', items: ['先从能直接拍到的真实场景开始', '每条内容只讲一个经营目标相关问题', '发布后重点看咨询率、收藏率和评论问题'] }],
        actions: [{ priority: 'critical', title: '确定首发 3 条', description: '从清单中挑 3 个最接近当下经营目标的方向', owner: '内容', timeline: '今天' }],
        recommendedTools: ['headline', 'hook', 'script'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '选题需基于真实服务、案例和客户问题展开。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'festival': {
      const festival = FESTIVAL_LABEL_MAP[formData.festival] || formData.customFestival || formData.festival || '节日活动'
      const goal = formData.goal || '促销转化'
      return {
        summary: `已为您生成 ${festival}${industry}${goal}活动执行方案`,
        sections: [
          { title: '文案方向', items: [`${festival}限时福利，突出现在行动的理由`, `${festival}客户回馈，突出老客户专属权益`, `${festival}主题活动，突出氛围感和参与感`] },
          { title: '渠道节奏', items: ['预热期提前 2-3 天讲清活动主题和适合人群', '集中期重点推权益、截止时间和咨询路径', '收口期提醒名额、库存或预约档期'] },
          { title: '转化指标', items: ['咨询数', '到店/预约数', '成交数', '老客唤醒数'] }
        ],
        actions: [{ priority: 'critical', title: '确定唯一主权益', description: '选择一个主权益作为活动核心', owner: '运营', timeline: '今天' }],
        recommendedTools: ['friend', 'headline'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '节日活动权益需写清适用条件、截止时间、核销方式和库存/名额限制。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }
    }

    case 'fission':
      return {
        summary: `已为您生成 ${industry}裂变活动基础方案`,
        sections: [{ title: '活动结构', items: ['老客转介绍奖励', '新客到店激励', '成交后的二次传播'] }, { title: '关键指标', items: ['单个新客获取成本', '老客参与率', '到店转化率', '活动总 ROI'] }],
        actions: [{ priority: 'high', title: '先小范围测试', description: '先对 20-50 个老客户做第一轮测试', owner: '运营', timeline: '本周内' }],
        recommendedTools: ['friend', 'headline', 'roi'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '裂变活动需明确奖励兑现条件和成本上限。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }

    case 'friend':
      return {
        summary: `已为您生成 3 条${industry}朋友圈文案`,
        sections: [{ title: '文案模板', items: [`${industry}今天主推「${seed}」，把客户最在意的价值讲清楚。`, `如果你最近在关注${industry}相关选择，这次重点看「${seed}」。`, `${industry}真正值得说的地方是：${seed}。看懂这一点，客户更容易产生信任。`] }],
        actions: [{ priority: 'high', title: '补齐真实场景', description: '把文案中的门店场景和客户使用场景换成真实案例再发布', owner: '运营', timeline: '今天' }],
        recommendedTools: ['selling-point', 'headline'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '朋友圈文案应基于真实活动、真实案例和真实服务能力。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }

    case 'marketing-plan':
      return {
        summary: `已为您生成 ${industry}${formData.goal || '提升营业额'}基础营销方案`,
        sections: [{ title: '目标与边界', items: [`行业：${industry}`, `目标：${formData.goal || '提升营业额'}`, `预算：${formData.budget || '5000'}`] }, { title: '执行节奏', items: ['前20%周期做预热和素材测试', '中间60%周期做集中放量', '最后20%周期做催单、复购和复盘'] }],
        actions: [{ priority: 'high', title: '先定唯一主活动', description: '本轮方案先围绕一个核心活动推进', owner: '运营', timeline: '今天' }],
        recommendedTools: ['friend', 'festival', 'headline'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '营销方案中的预算和目标需结合真实毛利、客单价和转化率复核。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
      }

    case 'hook':
    case 'script':
    case 'salary':
    case 'ip-agent':
    case 'competitor':
      return {
        summary: `已为您生成 ${industry}${toolConfig.name || toolCode}基础框架`,
        sections: [{ title: '核心建议', items: [`围绕${seed}提炼一个清晰主题`, '使用真实场景、真实案例和可执行动作承接内容', '发布或执行后记录咨询、转化和反馈数据'] }],
        actions: [{ priority: 'high', title: '补齐真实数据', description: '结合当前门店数据和客户反馈做二次细化', owner: '运营', timeline: '今天' }],
        recommendedTools: ['headline', 'topic', 'diagnosis'],
        riskNotes: [`当前 AI 网关不可用，以上内容由规则模板生成。错误信息：${error.message}`, '内容需基于真实经营能力和服务交付边界。'],
        extra: { isFallback: true, toolCode, fallbackType: 'rule-based-rag' }
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

async function createTemplateFallbackResult(toolConfig, formData = {}) {
  if (typeof toolConfig.templateBuilder !== 'function') return null

  const industry = getIndustryData(formData.industry || 'catering')
  const result = await toolConfig.templateBuilder(formData, industry)

  return createToolResult(result, {
    degraded: true,
    engineType: toolConfig.engineType,
    toolCode: toolConfig.code || 'unknown',
    fallbackType: 'template-fallback',
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

    const isDegraded = result?.degraded === true || result?.status === 'fallback'
    logger.toolSuccess(null, toolCode, duration)
    logger.info('generate', `${toolCode} | degraded=${isDegraded} | ${duration}ms`, { toolCode, degraded: isDegraded, duration })

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

    const templateFallback = await createTemplateFallbackResult(toolConfig, formData)
    if (templateFallback) {
      logger.info('generate', `${toolCode} | degraded=true | ${duration}ms`, { toolCode, degraded: true, duration, fallbackType: 'template-fallback' })
      return templateFallback
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
