import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '..')
const target = 'src/routes/douyinAgents.js'
const fullPath = path.join(backendRoot, target)
const content = fs.readFileSync(fullPath, 'utf8')
const lines = content.split(/\r?\n/)

const literalBlockers = [
  'TODO:',
  '别再 XXX',
  '调用 AI 生成诊断报告',
  '实际调用 AI 接口',
  "engineType: 'rule-based'",
  '规则化经营建议',
  '规则化经营初稿',
  'AI 生成草稿',
  '核销率 > 70%',
  '到店率 > 60%',
  '留资率 > 80%',
  '7 天内升单率 > 25%',
  '老客复购 > 40%',
  '线索成本 < 80 元',
  '到店转化率 > 40%',
  'CPA 健康，可适当加投'
]

const userVisibleHardClaims = []
const stringLiteralPattern = /(['"`])(?:(?!\1).)*\1/g
const hardClaimPattern = /(核销率|到店率|留资率|升单率|老客复购|线索成本|到店转化率|CPA)\s*[<>]\s*\d+|健康，可适当加投|别再\s+XXX|AI 生成草稿/
const calibratedPattern = /历史|观察线|复核|知识库|校准|输入目标|样本|基线/

const requiredPhrases = [
  "import { generateStructured } from '../services/ai.js'",
  "import { getKBContextWithMeta, getMaxTokensForLevel, getTemperatureForTool } from '../services/kbService.js'",
  'async function runKnowledgeAiAgent',
  "engineType: 'knowledge-ai'",
  "fallbackType: 'rule-based-rag'",
  'getKBContextWithMeta(kbToolCode'
]

lines.forEach((line, index) => {
  const literals = line.match(stringLiteralPattern) || []
  for (const literal of literals) {
    if (hardClaimPattern.test(literal) && !calibratedPattern.test(literal)) {
      userVisibleHardClaims.push({
        file: target,
        line: index + 1,
        text: literal.slice(1, -1)
      })
    }
  }
})

const blockers = literalBlockers
  .filter(phrase => content.includes(phrase))
  .map(phrase => ({ file: target, phrase }))

const missingRequiredPhrases = requiredPhrases
  .filter(phrase => !content.includes(phrase))
  .map(phrase => ({ file: target, phrase }))

const report = {
  status: blockers.length === 0 && userVisibleHardClaims.length === 0 && missingRequiredPhrases.length === 0 ? 'ok' : 'issues_found',
  checkedFiles: [target],
  blockers,
  missingRequiredPhrases,
  userVisibleHardClaims,
  summary: {
    blockerCount: blockers.length,
    missingRequiredPhraseCount: missingRequiredPhrases.length,
    hardClaimCount: userVisibleHardClaims.length
  }
}

const reportDir = path.join(backendRoot, 'test-reports')
fs.mkdirSync(reportDir, { recursive: true })
const reportPath = path.join(reportDir, 'douyin-agents-output-audit.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(JSON.stringify({
  status: report.status,
  blockerCount: report.summary.blockerCount,
  missingRequiredPhraseCount: report.summary.missingRequiredPhraseCount,
  hardClaimCount: report.summary.hardClaimCount,
  reportPath: path.relative(backendRoot, reportPath)
}, null, 2))

if (report.status !== 'ok') {
  process.exitCode = 1
}
