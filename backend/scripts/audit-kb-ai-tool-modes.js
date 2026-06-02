import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '..')
const mappingPath = path.join(backendRoot, 'src/config/kb-mapping.json')

const sourceFiles = [
  'src/routes/generate.js',
  'src/tools/content.js',
  'src/tools/marketing.js',
  'src/routes/posterGenerator.js'
]

const intentionalNonRagTools = new Set([
  'restaurant-health',
  'education-health',
  'beauty-health',
  'service-health',
  'retail-health',
  'store-health',
  'schedule'
])

const independentKnowledgeAiTools = {
  poster: [
    "getKBContextWithMeta('poster'",
    "generateStructured({",
    "toolCode: 'poster'",
    "engineType: 'rag'"
  ]
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findToolObject(content, toolCode) {
  const keyPattern = toolCode.includes('-')
    ? new RegExp(`['"]${escapeRegExp(toolCode)}['"]\\s*:\\s*\\{`)
    : new RegExp(`(?:^|[\\s,{])${escapeRegExp(toolCode)}\\s*:\\s*\\{`)
  const match = keyPattern.exec(content)
  if (!match) return null

  let start = content.indexOf('{', match.index)
  if (start < 0) return null

  let depth = 0
  let inString = false
  let quote = ''
  let escaped = false

  for (let i = start; i < content.length; i += 1) {
    const char = content[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true
      quote = char
      continue
    }

    if (char === '{') depth += 1
    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return content.slice(start, i + 1)
      }
    }
  }

  return null
}

function findAllToolObjects(content, toolCode) {
  const keyPattern = toolCode.includes('-')
    ? new RegExp(`['"]${escapeRegExp(toolCode)}['"]\\s*:\\s*\\{`, 'g')
    : new RegExp(`(?:^|[\\s,{])${escapeRegExp(toolCode)}\\s*:\\s*\\{`, 'g')
  const objects = []
  let match

  while ((match = keyPattern.exec(content))) {
    const startIndex = content.indexOf('{', match.index)
    if (startIndex < 0) continue

    const originalFind = findToolObject(content.slice(match.index), toolCode)
    if (originalFind) {
      objects.push(originalFind)
    }
  }

  return objects
}

function hasKnowledgeAiFactory(content, toolCode) {
  const key = toolCode.includes('-')
    ? `['"]${escapeRegExp(toolCode)}['"]`
    : `(?:^|[\\s,{])${escapeRegExp(toolCode)}`
  const pattern = new RegExp(`${key}\\s*:\\s*makeKnowledgeAiTool\\(`, 'm')
  return pattern.test(content)
}

function extractEngineType(toolObject) {
  if (!toolObject) return null
  const match = toolObject.match(/engineType\s*:\s*['"]([^'"]+)['"]/)
  return match?.[1] || null
}

function isKnowledgeAiFactoryObject(toolObject) {
  return typeof toolObject === 'string' && toolObject.includes('makeKnowledgeAiTool(')
}

const mapping = readJson(mappingPath)
const mappedTools = Object.entries(mapping)
  .filter(([toolCode, config]) => !toolCode.startsWith('_') && Array.isArray(config?.knowledgeFiles) && config.knowledgeFiles.length > 0)
  .map(([toolCode]) => toolCode)

const sourceContents = sourceFiles.map(file => ({
  file,
  content: fs.readFileSync(path.join(backendRoot, file), 'utf8')
}))

const findings = []

for (const toolCode of mappedTools) {
  if (intentionalNonRagTools.has(toolCode)) continue

  const independentPhrases = independentKnowledgeAiTools[toolCode]
  if (independentPhrases) {
    const sourceText = sourceContents.map(item => item.content).join('\n')
    const missingPhrases = independentPhrases.filter(phrase => !sourceText.includes(phrase))
    if (missingPhrases.length === 0) continue

    findings.push({
      toolCode,
      type: 'independent_kb_ai_route_missing_required_phrase',
      missingPhrases
    })
    continue
  }

  const matches = sourceContents
    .flatMap(({ file, content }) => {
      const records = []
      if (hasKnowledgeAiFactory(content, toolCode)) {
        records.push({ file, engineType: 'rag' })
      }

      const toolObjects = findAllToolObjects(content, toolCode)
      records.push(...toolObjects.map(toolObject => ({
        file,
        engineType: isKnowledgeAiFactoryObject(toolObject) ? 'rag' : extractEngineType(toolObject)
      })))

      return records
    })
    .filter(Boolean)

  const hasRagOrKnowledgeAi = matches.some(match => match.engineType === 'rag' || match.engineType === 'knowledge-ai')
  const templateMatches = matches.filter(match => match.engineType === 'template')

  if (!hasRagOrKnowledgeAi) {
    findings.push({
      toolCode,
      type: 'mapped_tool_without_rag_definition',
      matches
    })
    continue
  }

  if (!hasRagOrKnowledgeAi && templateMatches.length > 0) {
    for (const match of templateMatches) {
      findings.push({
        toolCode,
        type: 'source_template_definition_for_kb_tool',
        file: match.file,
        engineType: match.engineType
      })
    }
  }
}

const report = {
  status: findings.length === 0 ? 'ok' : 'issues_found',
  checkedFiles: sourceFiles,
  mappedToolCount: mappedTools.length,
  ignoredToolCodes: Array.from(intentionalNonRagTools),
  findings,
  summary: {
    findingCount: findings.length
  }
}

const reportDir = path.join(backendRoot, 'test-reports')
fs.mkdirSync(reportDir, { recursive: true })
const reportPath = path.join(reportDir, 'kb-ai-tool-modes-audit.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(JSON.stringify({
  status: report.status,
  findingCount: report.summary.findingCount,
  mappedToolCount: report.mappedToolCount,
  reportPath: path.relative(backendRoot, reportPath)
}, null, 2))

if (report.status !== 'ok') {
  process.exitCode = 1
}
