import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const frontendRoot = path.resolve(scriptDir, '..')

async function source(relativePath) {
  return readFile(path.join(frontendRoot, relativePath), 'utf8')
}

function template(sourceText) {
  const start = sourceText.indexOf('<template>')
  const end = sourceText.lastIndexOf('</template>')
  return (start >= 0 && end > start ? sourceText.slice(start + '<template>'.length, end) : '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

function visibleText(sourceText) {
  return template(sourceText).replace(/<[^>]+>/g, ' ')
}

const forbiddenPromises = /精准诊断|自动获客|快速见效|最优方案|保证提升|一键解决招生问题/
const forbiddenProductTerms = /智能体矩阵|结构化协议|系统回路|阶段0|阶段1|模块F|模块G|模块H|模块I|企业增长全景顾问|AI获客引擎/

test('校长工作台围绕本周问题、招生数据和两个优先动作', async () => {
  const sourceText = await source('src/views/growth/OwnerWorkbench.vue')
  const page = template(sourceText)
  const copy = visibleText(sourceText)
  for (const copy of ['本周经营工作台', '主推课程', '家长咨询', '预约体验', '到店', '报名', '优先动作上限']) {
    assert.match(page, new RegExp(copy))
  }
  assert.match(page, /优先动作上限[\s\S]*?<strong>2<\/strong>/)
  assert.doesNotMatch(copy, forbiddenProductTerms)
  assert.doesNotMatch(copy, forbiddenPromises)
})

test('招生闭环说明判断依据、优先动作、观察指标和求助条件', async () => {
  const sourceText = await source('src/views/growth/AcquisitionEngine.vue')
  const page = template(sourceText)
  const copy = visibleText(sourceText)
  for (const copy of ['本周招生行动', '当前最需要解决的问题', '判断依据', '可能原因', '本周先做', '观察指标', '停止或求助条件', '需要顾问确认']) {
    assert.match(page, new RegExp(copy))
  }
  assert.match(page, /只填聚合数据，不需要录入儿童姓名或联系方式/)
  assert.match(page, /actionCards\|\|d\.output_data\?\.actions\|\|\[\]\)\.slice\?\.\(0,2\)/)
  assert.doesNotMatch(copy, forbiddenProductTerms)
  assert.doesNotMatch(copy, forbiddenPromises)
})

test('经营体检入口和问卷采用五步业务流程', async () => {
  const entrySource = await source('src/views/Diagnosis.vue')
  const entry = template(entrySource)
  const entryCopy = visibleText(entrySource)
  const questionnaire = await source('src/views/DiagnosisQuestionnaire.vue')
  const combined = `${entry}\n${questionnaire}`
  for (const copy of ['了解校区和主推课程', '填写本周招生数据', '找主要问题', '确定本周行动', '七天后复盘']) {
    assert.match(combined, new RegExp(copy))
  }
  for (const copy of ['校区', '课程', '家长', '体验课', '到店', '报名']) {
    assert.match(combined, new RegExp(copy))
  }
  assert.doesNotMatch(entryCopy, forbiddenProductTerms)
  assert.doesNotMatch(entryCopy, forbiddenPromises)
})

test('经营建议报告保持固定结构且最多展示两个优先动作', async () => {
  const report = await source('src/views/DiagnosisReport.vue')
  const publicTemplate = template(report)
  const reportCopy = visibleText(report)
  for (const copy of ['主要问题', '判断依据', '可能原因', '本周先做', '暂时不要做', '观察指标', '停止或求助条件', '需要顾问确认']) {
    assert.match(publicTemplate, new RegExp(copy))
  }
  assert.match(publicTemplate, /result\.nextSteps\.slice\(0, 2\)/)
  assert.doesNotMatch(reportCopy, forbiddenProductTerms)
  assert.doesNotMatch(reportCopy, forbiddenPromises)
})

test('核心经营页面不直接展示英文处理状态或原始错误', async () => {
  const acquisition = await source('src/views/growth/AcquisitionEngine.vue')
  assert.match(acquisition, /operationStatus\(/)
  assert.match(acquisition, /operationError\(/)
  assert.doesNotMatch(visibleText(acquisition), /\{\{d\.status\}\}|加载失败|请求失败|pending|processing|completed|failed/)
})
