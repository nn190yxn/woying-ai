export const CORE_GENERATE_TOOL_REGISTRY = {
  friend: {
    toolCode: 'friend',
    name: '朋友圈文案生成器',
    engineType: 'template',
    requiredLevel: 'free',
    frontendEntry: '/tools/friend',
    resultSchema: 'standard-tool-result',
    inputSchema: 'core-generate.friend'
  },
  topic: {
    toolCode: 'topic',
    name: '选题生成器',
    engineType: 'rag',
    requiredLevel: 'free',
    frontendEntry: '/tools/topic',
    resultSchema: 'standard-tool-result',
    inputSchema: 'core-generate.topic'
  },
  festival: {
    toolCode: 'festival',
    name: '节日营销策划',
    engineType: 'rag',
    requiredLevel: 'free',
    frontendEntry: '/tools/festival',
    resultSchema: 'standard-tool-result',
    inputSchema: 'core-generate.festival'
  },
  fission: {
    toolCode: 'fission',
    name: '裂变活动方案',
    engineType: 'template',
    requiredLevel: 'free',
    frontendEntry: '/tools/fission',
    resultSchema: 'standard-tool-result',
    inputSchema: 'core-generate.fission'
  },
  'marketing-plan': {
    toolCode: 'marketing-plan',
    name: '营销方案生成器',
    engineType: 'template',
    requiredLevel: 'free',
    frontendEntry: '/tools/marketing-plan',
    resultSchema: 'standard-tool-result',
    inputSchema: 'core-generate.marketing-plan'
  }
}

export function getCoreGenerateToolRegistry(toolCode) {
  return CORE_GENERATE_TOOL_REGISTRY[toolCode] || null
}

export function listCoreGenerateToolRegistry() {
  return Object.values(CORE_GENERATE_TOOL_REGISTRY)
}
