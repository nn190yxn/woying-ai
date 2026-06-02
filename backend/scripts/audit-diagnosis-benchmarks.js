import { generateDiagnosisReport } from '../src/services/diagnosisEngine.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

const answers = {
  gross_margin_range: '50-60%',
  net_profit_range: '1-3%',
  cost_control_feeling: '偶尔超支，大致可控',
  food_cost_ratio: '40-45%',
  labor_cost_ratio: '25-30%',
  rent_cost_ratio: '15-20%'
}

const report = generateDiagnosisReport('store-health', answers)
assert(Array.isArray(report.benchmarks), 'benchmarks should be an array')
assert(report.benchmarks.length > 0, 'benchmarks should contain completed dimensions')

for (const item of report.benchmarks) {
  assert(item.metric, 'benchmark item should expose metric for frontend display')
  assert(item.value, 'benchmark item should expose value for frontend display')
  assert(item.benchmark, 'benchmark item should expose benchmark text for frontend display')
  assert(item.industryAvg === null, 'industryAvg should not use a fake fixed value')
  assert(item.topQuartile === null, 'topQuartile should not use a fake fixed value')
  assert(item.benchmarkSource, 'benchmark item should expose benchmarkSource')
}

assert(
  report.benchmarkNotes?.some(note => note.includes('不再使用固定 70/85') || note.includes('暂缺可复核行业指标')),
  'report should include benchmarkNotes explaining benchmark source'
)

console.log(JSON.stringify({
  status: 'ok',
  benchmarkCount: report.benchmarks.length,
  sample: report.benchmarks[0]
}, null, 2))
