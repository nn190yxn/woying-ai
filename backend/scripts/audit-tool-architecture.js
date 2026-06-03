// Architecture-classified audit
// Classify each tool: hardcoded | rag+ai | ai_only | needs_prompt
// Then audit KB refs per class
import fs from 'fs'
import path from 'path'

const KB_ROOT = '/home/ubuntu/woying-ai/knowledge-base'
const MAPPING = '/home/ubuntu/woying-ai/backend/src/config/kb-mapping.json'
const TOOL_REGISTRY = '/home/ubuntu/woying-ai/backend/src/config/toolRegistry.js'

// Load all tool routes to find tool names
const routesDir = '/home/ubuntu/woying-ai/backend/src/routes'
const allRoutes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'))

// Load mapping
const mapping = JSON.parse(fs.readFileSync(MAPPING, 'utf8'))

// Heuristics for tool classification
const HARDCODED_HINTS = ['hardcoded', 'formula', 'calculator', '率', '公式']
const RAG_AI_HINTS = ['knowledge-ai', 'kbService', 'getKBContext']
const AI_HINTS = ['generate', 'ai', 'agent', 'diagnosis', 'planner']

function classifyTool(tool) {
  const cfg = mapping[tool]
  if (!cfg) return { type: 'unknown', reason: 'no mapping entry' }
  // Heuristic: if no KB files, it's not rag+ai
  const hasKB = (cfg.knowledgeFiles || []).length > 0
  // Engine hints
  const toolName = tool.toLowerCase()
  if (toolName.includes('calc') || toolName.includes('rate-') || toolName.includes('cac-') ||
      toolName.includes('roi') || toolName.includes('ltv') || toolName.includes('payback') ||
      toolName.includes('break-even') || toolName.includes('profit') || toolName.includes('cashflow') ||
      toolName.includes('shutiao') || toolName.includes('funnel') || toolName.includes('churn') ||
      toolName.includes('retention') || toolName.includes('labor') || toolName.includes('class-') ||
      toolName.includes('card-') || toolName.includes('cup') || toolName.includes('dish') ||
      toolName.includes('device-roi') || toolName.includes('venue')) {
    return { type: 'hardcoded', reason: 'formula/calculator naming' }
  }
  if (hasKB) return { type: 'rag+ai', reason: 'has KB files' }
  if (cfg.aiConfig || toolName.includes('agent') || toolName.includes('planner') || toolName.includes('strategy')) {
    return { type: 'ai_only', reason: 'has aiConfig or agent naming' }
  }
  return { type: 'needs_review', reason: 'no KB, no aiConfig' }
}

// Classify all
const tools = Object.keys(mapping).filter(t => !t.startsWith('_'))
const classified = {}
for (const t of tools) {
  classified[t] = classifyTool(t)
}

// Count
const counts = {}
for (const c of Object.values(classified)) {
  counts[c.type] = (counts[c.type] || 0) + 1
}

console.log('='.repeat(80))
console.log('  工具架构分类审计')
console.log('='.repeat(80))
console.log()
console.log('总工具数:', tools.length)
console.log()
console.log('--- 分类统计 ---')
for (const [type, n] of Object.entries(counts)) {
  console.log(`  ${type.padEnd(15)} ${n} 个`)
}
console.log()

// By type, list tools and check KB health
const byType = {}
for (const [tool, cls] of Object.entries(classified)) {
  if (!byType[cls.type]) byType[cls.type] = []
  byType[cls.type].push(tool)
}

for (const [type, list] of Object.entries(byType)) {
  console.log(`--- ${type} (${list.length}) ---`)
  // For each, check if kb-mapping has dangling refs
  const withDangling = []
  for (const t of list) {
    const cfg = mapping[t]
    for (const f of cfg.knowledgeFiles || []) {
      if (!fs.existsSync(path.join(KB_ROOT, f.path))) {
        withDangling.push(t)
        break
      }
    }
  }
  console.log(`  有 dangling refs: ${withDangling.length}/${list.length}`)
  if (list.length <= 30) {
    list.forEach(t => {
      const cfg = mapping[t]
      const kbf = (cfg.knowledgeFiles || []).length
      const dbg = withDangling.includes(t) ? '❌' : '✓'
      console.log(`    ${dbg} ${t} (${kbf} KB files)`)
    })
  } else {
    list.slice(0, 10).forEach(t => console.log(`    ${t}`))
    console.log(`    ... 还有 ${list.length - 10} 个`)
  }
  console.log()
}

console.log('--- 建议 ---')
console.log('  hardcoded 工具：不需要 KB，可从 kb-mapping.json 移除以减少噪音')
console.log('  rag+ai 工具：必须修 dangling refs 和 section mismatches')
console.log('  ai_only 工具：保留 aiConfig，确保行业 profile 注入')
console.log('  needs_review 工具：需要人工确认是哪种类型')
console.log()

// Write classification to JSON for next step
fs.writeFileSync('/tmp/tool-classification.json', JSON.stringify(classified, null, 2))
console.log('已写入 /tmp/tool-classification.json')
