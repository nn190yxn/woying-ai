import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '..')

const targets = [
  'src/services/calculatorEngine.js',
  'src/routes/generate.js'
]

const legacyBlockers = [
  '投流基准：ROI >= 100% 为及格线，>= 200% 为优秀',
  '基准：一般项目 6-12 个月回本为健康',
  '餐饮行业健康毛利基准：炒菜 60-70%，火锅 55-65%，酒水 70-80%',
  '行业参考：快餐>3000，中餐/火锅1500-3500，咖啡2000-4000，奶茶/小吃1500-3000 元/m²/月',
  '体验目标：转化率 >= 行业基准',
  '体验到店率：到店数/预约数（目标>=85%）',
  '体验转化率：正价报名数/体验数（目标>=30%）',
  '体验满意度：好评数/体验总数（目标>=90%）',
  '根据成本和行业基准设定体验价格',
  '曝光量目标：根据行业平均CPM估算',
  '笔记行业基准：CTR',
  '复购率每提升10%，利润可增长25-95%',
  '人工成本：${laborText}（基准 <=20%）',
  '人工占比：${laborRatio.toFixed(1)}% (基准:',
  '为了表达歉意，我们为您提供XXX补偿'
]

const riskPatterns = [
  { name: 'industryBenchmark', regex: /行业基准|行业参考|行业平均|健康标准/g },
  { name: 'benchmarkLabel', regex: /基准\s*[:：]|基准\s*<=|基准参考/g },
  { name: 'hardTarget', regex: /目标\s*>=|达标值|优秀|为健康/g },
  { name: 'hardThreshold', regex: />=?\s*\d+(\.\d+)?%|<\s*\d+(\.\d+)?%|低于\s*\d+(\.\d+)?%/g },
  { name: 'profitClaim', regex: /利润可增长|严重影响|客户流失严重/g }
]

const calibratedLanguage = /经验观察|经验参考|需看|需按|校准|复核|账号历史|历史均值|同类笔记|观察区间|不是统一|不能作为统一|明显低于经验|历史投放|近 30 天数据/

const findings = []
const blockers = []

for (const relativePath of targets) {
  const fullPath = path.join(backendRoot, relativePath)
  const content = fs.readFileSync(fullPath, 'utf8')
  const lines = content.split(/\r?\n/)

  for (const phrase of legacyBlockers) {
    if (content.includes(phrase)) {
      blockers.push({ file: relativePath, phrase })
    }
  }

  lines.forEach((line, index) => {
    const matches = riskPatterns
      .filter(pattern => {
        pattern.regex.lastIndex = 0
        return pattern.regex.test(line)
      })
      .map(pattern => pattern.name)

    if (matches.length > 0 && !calibratedLanguage.test(line)) {
      findings.push({
        file: relativePath,
        line: index + 1,
        patterns: matches,
        text: line.trim()
      })
    }
  })
}

const report = {
  status: blockers.length === 0 ? 'ok' : 'legacy_blockers_found',
  checkedFiles: targets,
  legacyBlockers: blockers,
  remainingStaticBenchmarkFindings: findings,
  summary: {
    blockerCount: blockers.length,
    remainingFindingCount: findings.length
  }
}

const reportDir = path.join(backendRoot, 'test-reports')
fs.mkdirSync(reportDir, { recursive: true })
const reportPath = path.join(reportDir, 'static-benchmark-language-audit.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log(JSON.stringify({
  status: report.status,
  blockerCount: report.summary.blockerCount,
  remainingFindingCount: report.summary.remainingFindingCount,
  reportPath: path.relative(backendRoot, reportPath)
}, null, 2))

if (blockers.length > 0) {
  process.exitCode = 1
}
