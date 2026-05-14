import { getFestival, getFissionBenchmarks } from '../services/industryKnowledge.js'
import { buildStructuredPrompt } from '../services/promptBuilder.js'

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

function parseBudget(budget) {
  const raw = String(budget || '').replace(/[^\d]/g, '')
  return Number(raw || 0)
}

function normalizeBudgetNumber(budget, fallback = 2000) {
  const map = {
    low: 500,
    mid: 2000,
    high: 5000,
    vip: 8000
  }

  if (typeof budget === 'string' && map[budget] !== undefined) {
    return map[budget]
  }

  return Number(budget) || fallback
}

export function createMarketingTools() {
  return {
    festival: {
      name: '节日营销策划',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includeFestival: true },
      systemPrompt: () => buildStructuredPrompt({
        role: '一个节假日营销文案专家，为中小企业老板生成节日营销文案',
        goals: ['结合行业特点，让文案有行业针对性', '促销文案要有紧迫感和吸引力', '不同内容类型用不同风格', '不要生成虚假的折扣数字，必须给出可执行表达'],
        outputSections: ['文案方向', '执行建议']
      }),
      userPromptTemplate: (formData, ind, knowledge) => {
        const fest = getFestival(formData.festival) || { name: formData.customFestival || formData.festival, marketingThemes: ['节日营销'], couponValue: '50-200元' }
        const goalMap = { promote: '促销推广', brand: '品牌宣传', customer: '客户关怀', product: '新品推广' }
        const contentTypeMap = { poster: '朋友圈海报文案', video: '短视频文案', group: '微信群发消息', article: '公众号推文' }
        return `节日：${fest.name}
节日营销主题方向：${fest.marketingThemes.join('、')}
建议优惠力度：${fest.couponValue}
行业：${ind.name}
营销目标：${goalMap[formData.goal] || formData.goal || '促销推广'}
内容形式：${contentTypeMap[formData.contentType] || formData.contentType || '朋友圈文案'}

${knowledge}

请生成2-3条不同角度的营销文案，并给出执行建议。`
      },
      temperature: 0.8,
      max_tokens: 3000,
      templateBuilder: async (formData, ind) => {
        const fest = getFestival(formData.festival) || { name: formData.customFestival || FESTIVAL_LABEL_MAP[formData.festival] || formData.festival || '节日活动', marketingThemes: ['节日营销'], couponValue: '50-200元' }
        const goalMap = { promote: '促销推广', brand: '品牌宣传', customer: '客户关怀', product: '新品推广' }
        const contentTypeMap = { poster: '朋友圈海报文案', video: '短视频文案', group: '微信群发消息', article: '公众号推文' }
        const goal = goalMap[formData.goal] || formData.goal || '促销推广'
        const contentType = contentTypeMap[formData.contentType] || formData.contentType || '朋友圈文案'

        return {
          summary: `「${fest.name}」${ind.name}${goal}方案已生成，内容形式为${contentType}`,
          sections: [
            {
              title: '活动定位',
              items: [
                `节日主题：${fest.name}`,
                `营销目标：${goal}`,
                `内容形式：${contentType}`,
                `主题方向：${fest.marketingThemes.join('、')}`,
                `建议优惠力度：${fest.couponValue}`
              ]
            },
            {
              title: '文案方向',
              items: [
                `${fest.name}限时福利：突出“现在行动”的理由，适合做转化型海报或群发消息`,
                `${fest.name}客户回馈：突出老客户专属权益，适合做会员召回和复购提醒`,
                `${fest.name}场景种草：结合${ind.name}真实消费场景，让客户知道这次活动适合谁`
              ]
            },
            {
              title: '可直接使用文案',
              items: [
                `【${fest.name}专属】这次我们准备了一份${ind.name}节日福利，适合近期有需求的客户，名额和时间都有限，想了解可以直接咨询。`,
                `${fest.name}期间，我们把最受欢迎的服务/产品做了一次节日组合，重点解决客户最关心的价格、效果和体验问题。`,
                `老客户专属提醒：${fest.name}活动已经开始，老客可优先预约/领取权益，截止前完成预约即可锁定本次福利。`
              ]
            },
            {
              title: '执行节奏',
              items: [
                '预热期：提前 2-3 天发布节日主题和适合人群，先收集意向客户',
                '集中期：围绕主权益、截止时间、预约路径进行密集触达',
                '收口期：用名额、档期、库存或赠品剩余情况推动最后转化',
                '复盘期：记录咨询量、预约量、成交量和老客唤醒数'
              ]
            },
            {
              title: '风险边界',
              items: [
                '优惠力度必须结合毛利和履约能力测算，避免活动越卖越亏',
                '文案必须写清适用条件、截止时间、预约方式和核销规则',
                '不同渠道使用同一套权益口径，避免售后投诉',
                '活动承诺必须和实际服务能力一致，尤其是效果类、教育类和美业类场景'
              ]
            }
          ],
          actions: [
            { priority: 'critical', title: '确定唯一主权益', description: '先选择一个客户最容易理解、员工最容易解释的主权益', owner: '运营负责人', timeline: '今天' },
            { priority: 'high', title: '同步渠道文案', description: '把朋友圈、社群、短视频和门店口播统一成同一套节日表达', owner: '运营人员', timeline: '活动前2天' },
            { priority: 'medium', title: '活动后复盘', description: '记录触达、咨询、预约、成交和复购数据，沉淀下一次节日活动模板', owner: '店长/运营', timeline: '活动结束后24小时' }
          ],
          recommendedTools: ['friend', 'headline', 'marketing-plan'],
          riskNotes: ['节日营销方案为规则增强兜底结果，正式投放前需结合真实毛利、库存、档期、人手和历史转化率复核。']
        }
      }
    },

    fission: {
      name: '裂变活动方案',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includeFission: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个熟悉${ind.name}行业、裂变增长路径和知识库方法论的增长顾问`,
        goals: ['必须结合知识库中的裂变基准、行业场景、客户规模和渠道结构生成方案', '根据预算、客单价和履约能力说明适用前提', '覆盖活动结构、预算拆分、传播路径、关键指标、风控边界和执行动作', '所有奖励、转介绍和拉新动作都必须可复核、可执行、可追踪'],
        outputSections: ['活动结构', '预算拆分', '传播路径', '关键指标', '风控边界', '执行动作']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
客户规模：${formData.customerScale || '未说明'}
主要渠道：${formData.channel || '未说明'}
产品价位：${formData.priceRange || '未说明'}
活动预算：${formData.budget || '未说明'}

知识库内容：
${knowledge}

请基于知识库和用户输入生成裂变活动方案，并输出 summary、sections、actions、riskNotes 和 recommendedTools。`,
      temperature: 0.8,
      max_tokens: 3000,
      templateBuilder: async (formData, ind) => {
        const benchmarks = getFissionBenchmarks(ind.key)
        const channelMap = {
          offline: '线下门店为主',
          online: '线上平台为主',
          mixed: '线上线下结合'
        }
        const priceMap = {
          low: '100元以下',
          mid: '100-1000元',
          high: '1000-5000元',
          vip: '5000元以上'
        }
        const budgetMap = {
          low: '500元以下',
          mid: '500-2000元',
          high: '2000-5000元',
          vip: '5000元以上'
        }
        const budgetNumber = normalizeBudgetNumber(formData.budget, 2000)
        const rewardBudget = Math.round(budgetNumber * 0.45)
        const contentBudget = Math.round(budgetNumber * 0.25)
        const channelBudget = Math.round(budgetNumber * 0.2)
        const reserveBudget = Math.max(budgetNumber - rewardBudget - contentBudget - channelBudget, 0)
        const channel = channelMap[formData.channel] || formData.channel || '当前渠道结构'

        return {
          summary: `「${ind.name}」裂变活动方案已生成，适配${channel}`,
          sections: [
            {
              title: '活动前提',
              items: [
                `客户规模：${formData.customerScale || '未知'}`,
                `主要渠道：${channel}`,
                `客单价范围：${priceMap[formData.priceRange] || formData.priceRange || '未说明'}`,
                `预算范围：${budgetMap[formData.budget] || formData.budget || '未说明'}`
              ]
            },
            {
              title: '活动结构',
              items: [
                `老客转介绍奖励：控制在 ${benchmarks.referralReward[0]}-${benchmarks.referralReward[1]} 元，让老客户有动力但不至于倒挂利润`,
                `新客首单激励：建议把首次体验门槛控制在 ${benchmarks.newUserGiftCost[0]}-${benchmarks.newUserGiftCost[1]} 元范围内，更利于快速决策`,
                '二次传播机制：让已成交客户在付款后立即触发分享动作'
              ]
            },
            {
              title: '预算拆分',
              items: [
                `客户激励预算：约 ${rewardBudget} 元（45%），用于老客奖励和新客首单权益`,
                `内容物料预算：约 ${contentBudget} 元（25%），用于海报、朋友圈图、短视频和门店物料`,
                `渠道触达预算：约 ${channelBudget} 元（20%），用于社群触达、员工转发激励或小额投放`,
                `机动预算：约 ${reserveBudget} 元（10%），用于补贴异常、临时加码或客服跟进`
              ]
            },
            {
              title: '传播路径',
              items: [
                '第一层：先从 20-50 位高满意度老客开始，不直接全量群发',
                '第二层：老客分享后，新客领取一个低门槛权益，再引导咨询或到店',
                '第三层：新客成交后立即触发二次分享，形成“老客-新客-再传播”闭环',
                `渠道重点：${channel}，所有入口都指向同一个活动规则和同一套权益口径`
              ]
            },
            {
              title: '执行节奏',
              items: [
                '第1步：先确定一个主活动主题，只做一个主奖励，避免规则太复杂',
                '第2步：同步准备海报、朋友圈文案、私聊话术、到店口播四件套',
                '第3步：先小范围投到老客群或核心会员群，观察分享率和咨询率',
                '第4步：48小时后根据到店率和成交率再决定是否放大预算'
              ]
            },
            {
              title: '关键指标',
              items: [
                '分享参与率：参与分享人数 / 触达老客人数',
                '新客到店率：新客到店人数 / 分享触达人数',
                '首单转化率：成交新客人数 / 到店新客人数',
                '裂变获客成本：总激励成本 / 成交新客人数'
              ]
            },
            {
              title: '风控边界',
              items: [
                '奖励必须绑定真实到店、预约或成交动作，避免只按转发截图发奖励',
                '同一手机号、同一微信或同一设备只能领取一次新客权益',
                '员工和客户话术必须统一，避免不同渠道出现不同承诺',
                '活动必须设置截止时间和名额上限，避免成本失控'
              ]
            }
          ],
          actions: [
            { priority: 'critical', title: '先做小样本测试', description: '先在20-50位老客中验证活动参与率', owner: '运营', timeline: '本周内' },
            { priority: 'high', title: '统一话术和权益', description: '确保门店员工、社群运营、朋友圈文案使用同一套活动表达和权益口径', owner: '店长/运营', timeline: '活动前' },
            { priority: 'medium', title: '48小时复盘', description: '根据分享参与率、新客到店率和首单转化率决定是否放大预算', owner: '运营', timeline: '活动启动后48小时' }
          ],
          recommendedTools: ['friend', 'headline', 'marketing-plan'],
          riskNotes: ['当前方案为规则增强版，适合先做小样本验证；正式放大前需要结合真实毛利、客单价和履约能力二次校准。']
        }
      }
    },

    'marketing-plan': {
      name: '营销方案生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个熟悉${ind.name}行业、渠道组合和知识库方法论的营销方案顾问`,
        goals: ['必须结合知识库中的营销方法、渠道节奏和用户业务输入生成方案', '围绕真实预算、周期、渠道和经营目标输出', '说明适用前提、风控边界和关键复盘指标', '包含方案概览、目标拆解、渠道动作、执行排期、预算分配和风险提示'],
        outputSections: ['方案概览', '目标拆解', '渠道动作', '执行排期', '预算分配', '风险边界']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
目标：${formData.goal || '未说明'}
预算：${formData.budget || '未说明'}
周期：${formData.duration || formData.period || '未说明'}
主渠道：${(ind.commonChannels || []).slice(0, 4).join('、') || '未说明'}

知识库内容：
${knowledge}

请基于知识库和用户输入生成完整营销方案，并输出 summary、sections、actions、riskNotes 和 recommendedTools。`,
      temperature: 0.78,
      max_tokens: 3500,
      templateBuilder: async (formData, ind) => {
        const goal = formData.goal || '提升销售额'
        const budget = String(formData.budget || '5000')
        const duration = formData.duration || formData.period || '1周'
        const budgetNumber = parseBudget(budget)
        const channels = ind.commonChannels?.slice(0, 4) || ['朋友圈', '社群', '短视频', '到店转化']
        const channelText = channels.join('、')
        const contentBudget = Math.round(budgetNumber * 0.25)
        const trafficBudget = Math.round(budgetNumber * 0.45)
        const incentiveBudget = Math.round(budgetNumber * 0.2)
        const reserveBudget = Math.max(budgetNumber - contentBudget - trafficBudget - incentiveBudget, 0)

        return {
          summary: `「${goal}」执行型营销方案已生成，预算${budget}，周期${duration}`,
          sections: [
            {
              title: '方案概览',
              items: [`行业：${ind.name}`, `目标：${goal}`, `预算：${budget}`, `周期：${duration}`, `主渠道：${channelText}`]
            },
            {
              title: '目标拆解',
              items: [
                '先把目标拆成触达、咨询、到店/留资、成交四个环节，避免只看最终销售额',
                `本轮主目标：围绕“${goal}”设置一个核心活动和一个核心转化动作`,
                '活动口径只保留一个主卖点、一个主权益和一个截止时间，降低客户理解成本',
                '每天记录曝光量、咨询量、到店/留资量和成交量，形成可复盘漏斗'
              ]
            },
            {
              title: '渠道动作',
              items: [
                `${channels[0] || '朋友圈'}：发布主活动海报和成交案例，重点解决客户为什么现在行动`,
                `${channels[1] || '社群'}：用限时提醒、名额提醒和客户问答承接咨询`,
                `${channels[2] || '短视频'}：用痛点开头、场景演示和结果对比获取新增触达`,
                `${channels[3] || '到店转化'}：员工统一口播，把线上咨询转成预约、到店或下单`
              ]
            },
            {
              title: '执行排期',
              items: [
                '前20%周期：预热和测试，先验证主卖点、主海报和主渠道反馈',
                '中间60%周期：集中放量，把预算优先打到咨询率和成交率更高的渠道',
                '最后20%周期：催单转化、老客召回和未成交客户二次触达',
                '活动结束后24小时：整理渠道数据、素材数据和成交数据，沉淀下次复用模板'
              ]
            },
            {
              title: '预算分配',
              items: budgetNumber > 0 ? [
                `内容制作：${contentBudget}元（25%），用于海报、短视频、案例素材和落地页文案`,
                `渠道投放：${trafficBudget}元（45%），优先投向转化链路最短的渠道`,
                `客户激励：${incentiveBudget}元（20%），用于首单权益、老客召回或转介绍奖励`,
                `机动预算：${reserveBudget}元（10%），用于临时加码、客服补偿或高转化渠道追加`
              ] : ['内容制作：25%', '渠道投放：45%', '客户激励：20%', '机动预算：10%']
            },
            {
              title: '复盘指标',
              items: [
                '触达效率：曝光量、阅读量、视频完播率或社群触达人数',
                '咨询效率：咨询量 / 触达人群，判断文案和权益是否有吸引力',
                '转化效率：成交量 / 咨询量，判断客服话术和产品承接是否有效',
                '预算效率：实际成交金额 / 总投入，至少每48小时复盘一次预算分配'
              ]
            },
            {
              title: '风险边界',
              items: ['不要同时做多个活动主题，避免员工解释成本和客户决策成本过高', '优惠力度不能突破毛利底线，所有权益都要先确认履约成本', '投放放大前必须先看咨询率和成交率，不能只因为曝光高就追加预算', '所有渠道承诺必须一致，避免售后投诉和线下履约冲突']
            }
          ],
          actions: [
            { priority: 'critical', title: '统一主活动', description: '先明确本轮只打一个核心活动、一个核心卖点和一个核心转化动作，避免渠道分散', owner: '运营负责人', timeline: '活动前3天' },
            { priority: 'high', title: '素材联动', description: '把朋友圈、社群、短视频和到店话术统一成同一套活动表达，并保留统一入口', owner: '运营人员', timeline: '活动前2天' },
            { priority: 'high', title: '预算复盘', description: '每48小时按咨询率、成交率和投入产出比调整一次渠道预算', owner: '数据分析', timeline: '活动期间' },
            { priority: 'medium', title: '沉淀复用模板', description: '活动结束后沉淀高转化文案、素材、话术和渠道数据，作为下次活动基线', owner: '运营负责人', timeline: '活动结束后24小时' }
          ],
          recommendedTools: ['friend', 'festival', 'headline'],
          riskNotes: ['当前方案为执行型营销模板，正式放大预算前需要结合真实毛利、库存、履约能力和历史转化率再次校准。']
        }
      }
    }
  }
}
