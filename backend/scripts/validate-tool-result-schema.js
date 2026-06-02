import fs from 'fs'

function fail(message) {
  console.error(`SCHEMA_FAIL: ${message}`)
  process.exit(1)
}

function validateResult(name, data) {
  if (!data || typeof data !== 'object') fail(`${name} 不是对象`)
  if (data.status !== 'ok' && data.status !== 'fallback') fail(`${name} status 非法: ${data.status}`)
  if (typeof data.degraded !== 'boolean') fail(`${name} degraded 不是 boolean`)
  if (typeof data.summary !== 'string') fail(`${name} summary 不是 string`)
  if (!Array.isArray(data.sections)) fail(`${name} sections 不是数组`)
  if (!Array.isArray(data.actions)) fail(`${name} actions 不是数组`)
  if (!Array.isArray(data.recommendedTools)) fail(`${name} recommendedTools 不是数组`)
  if (!Array.isArray(data.riskNotes)) fail(`${name} riskNotes 不是数组`)
  if (!data.meta || typeof data.meta !== 'object') fail(`${name} meta 缺失`)
}

const filePath = process.argv[2] || './test-reports/generate-snapshots.json'

const raw = fs.readFileSync(filePath, 'utf8')
const json = JSON.parse(raw)

const target = Array.isArray(json)
  ? json
  : Array.isArray(json.results)
  ? json.results
  : json

if (Array.isArray(target)) {
  target.forEach((item, index) => validateResult(`result[${index}]`, item))
} else {
  validateResult('result', target)
}

console.log('SCHEMA_OK')
