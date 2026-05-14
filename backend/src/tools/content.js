import { buildStructuredPrompt } from '../services/promptBuilder.js'

function normalizeList(value) {
  if (Array.isArray(value)) return value
  if (value == null || value === '') return []
  return [value]
}

function getTopicGoalLabels(formData = {}) {
  const goalMap = {
    exposure: '增加曝光',
    acquisition: '获取客户',
    'boss-ip': '老板人设',
    conversion: '促进转化',
    repurchase: '复购留存',
    interaction: '互动涨粉'
  }
  const typeMap = {
    talking: '口播讲解',
    'real-shot': '实拍记录',
    tutorial: '教程教学',
    case: '案例分享',
    drama: '剧情演绎',
    interactive: '互动挑战'
  }
  const durMap = { '15s': '15秒以内', '30s': '30秒左右', '1min': '1分钟左右', '3min': '3分钟以上' }
  const platMap = { douyin: '抖音', xiaohongshu: '小红书', 'video-account': '视频号' }
  const sceneMap = { store: '店内', kitchen: '后厨', office: '办公室', outdoor: '户外', home: '居家' }

  return {
    goals: normalizeList(formData.goals).map(g => goalMap[g] || g).join('、'),
    types: normalizeList(formData.contentTypes).map(t => typeMap[t] || t).join('、'),
    scenes: normalizeList(formData.scenes).map(s => sceneMap[s] || s).join('、'),
    platforms: normalizeList(formData.platforms).map(p => platMap[p] || p).join('、'),
    duration: durMap[formData.duration] || formData.duration || '未说明'
  }
}

export function createContentTools() {
  return {
    headline: {
      name: '爆款标题生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includePlatform: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个内容营销标题专家，专门为${ind.name}行业老板生成高点击率短视频标题`,
        goals: ['每条标题不超过30字', '结合行业特点和用户痛点', '使用痛点共鸣、身份标签、反常识、数字对比、情感冲击等公式', '直接给出可用标题，避免同质化'],
        outputSections: ['标题建议', '使用建议']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
关键词：${Array.isArray(formData.keywords) ? formData.keywords.join('、') : String(formData.keywords || '').split(/[,，、]/).filter(Boolean).join('、')}
目标平台：${formData.platform || '抖音'}

${knowledge}

请生成10条针对这个行业的爆款标题。`,
      temperature: 0.9,
      max_tokens: 3000
    },

    topic: {
      name: '选题生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includePlatform: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个内容选题专家，专门为${ind.name}行业的中小企业老板生成短视频/图文选题方案`,
        goals: ['根据用户选择的目标、内容类型、时长、场景和平台生成精准选题', '每个选题包含标题、推荐理由和内容标签', '标题要有点击欲，理由要解释为什么会火，标签要便于检索', '输出内容必须和行业、平台、目标紧密绑定'],
        outputSections: ['选题清单', '执行建议']
      }),
      userPromptTemplate: (formData, ind, knowledge) => {
        const { goals, types, scenes, platforms, duration } = getTopicGoalLabels(formData)
        return `行业：${ind.name}
主要目标：${goals}
内容类型：${types}
视频时长：${duration}
拍摄场景：${scenes}
目标平台：${platforms}
生成数量：${formData.count || 10}个

${knowledge}

请生成 ${formData.count || 10} 个选题，每个包含标题、推荐理由和2-3个标签。`
      },
      temperature: 0.85,
      max_tokens: 3000
    },

    friend: {
      name: '朋友圈文案生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includePlatform: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个熟悉${ind.name}行业私域成交和朋友圈表达的文案顾问`,
        goals: ['必须结合知识库内容、真实门店场景和用户卖点生成文案', '文案要有人味、有场景、有行动引导', '避免虚构客户反馈、夸张承诺和空泛套话', '输出朋友圈文案、发布建议、风险提示和执行动作'],
        outputSections: ['文案模板', '发布建议', '执行动作', '风险提示']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
场景：${formData.scene || '当前业务'}
核心卖点：${formData.highlight || '核心卖点'}
文案类型：${formData.type || formData.purpose || '日常种草'}
语气：${formData.tone || 'natural'}

知识库内容：
${knowledge}

请基于知识库和用户输入生成 3 条朋友圈文案，并输出 summary、sections、actions、riskNotes 和 recommendedTools。`,
      temperature: 0.82,
      max_tokens: 3200
    },

    hook: {
      name: '钩子文案生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includePlatform: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个熟悉${ind.name}行业短视频开头钩子和客户决策心理的内容顾问`,
        goals: ['必须结合知识库和用户主题生成可测试钩子', '钩子要绑定行业场景、客户顾虑和转化动作', '不要输出泛化标题党', '给出使用建议、执行动作和风险提示'],
        outputSections: ['短视频开头钩子', '海报/标题钩子', '钩子公式', '使用建议']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
主题：${formData.topic || formData.product || '提高内容转化'}
平台：${formData.platform || '抖音/小红书/视频号'}

知识库内容：
${knowledge}

请基于知识库和用户输入生成钩子文案，并输出 summary、sections、actions、riskNotes 和 recommendedTools。`,
      temperature: 0.85,
      max_tokens: 3000
    },

    script: {
      name: '短视频脚本生成器',
      engineType: 'rag',
      knowledgeScope: { includeIndustry: true, includePlatform: true },
      systemPrompt: (ind) => buildStructuredPrompt({
        role: `一个熟悉${ind.name}行业、短视频内容结构和知识库方法论的脚本策划顾问`,
        goals: ['必须结合知识库内容、平台表达规则和用户业务输入生成可拍摄脚本', '脚本要包含开头钩子、主体内容、镜头/画面建议和行动引导', '体现行业场景、客户顾虑和真实转化动作', '所有效果判断都要说明适用前提'],
        outputSections: ['脚本结构', '完整脚本', '拍摄建议', '执行动作', '风险提示']
      }),
      userPromptTemplate: (formData, ind, knowledge) => `行业：${ind.name}
视频类型：${formData.videoType || formData.type || '未说明'}
主题：${formData.topic || '未说明'}
平台：${formData.platform || '抖音/小红书/视频号'}
产品/服务：${formData.product || formData.service || '未说明'}

知识库内容：
${knowledge}

请基于知识库和用户输入生成一套可拍摄短视频脚本，包含分秒结构、镜头建议、口播稿、actions、riskNotes 和 recommendedTools。`,
      temperature: 0.82,
      max_tokens: 3500
    }
  }
}
