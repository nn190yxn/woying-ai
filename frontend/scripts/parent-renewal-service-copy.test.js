import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const template = source => source.match(/<template>([\s\S]*?)<\/template>/)?.[1] || ''

test('家长跟进状态按业务顺序完整展示', () => {
  const source = read('src/views/PrivateAgentHub.vue')
  const states = ['新咨询', '待联系', '待邀约', '已约体验', '体验后回访', '已报名', '暂未报名']
  let cursor = -1
  for (const state of states) {
    const next = source.indexOf(`'${state}'`, cursor + 1)
    assert.ok(next > cursor, `${state} 应按顺序出现`)
    cursor = next
  }
  assert.match(source, /router\.push\(`\/private\/\$\{agent\.code\}`\)/)
  assert.match(source, /canAccessLevel\(userStore\.memberLevel, agent\.level\)/)
})

test('家长沟通复盘保留接口和内部枚举且不公开实现词', () => {
  const source = read('src/views/growth/SalesCoach.vue')
  const publicCopy = template(source)
  for (const api of ['createSalesRecording', 'submitSalesTranscription', 'getAsyncTask', 'createSalesAnalysis']) assert.match(source, new RegExp(api))
  for (const value of ["'new_sale'", "'renewal'", "'queued'", "'processing'", "'succeeded'"]) assert.ok(source.includes(value))
  assert.match(publicCopy, /新家长报名沟通/)
  assert.match(publicCopy, /在读家长续费沟通/)
  assert.match(publicCopy, /已获得对话参与者授权/)
  for (const word of ['AI SALES COACH', 'AI销售教练', 'ASR', '供应商', '异步']) assert.ok(!publicCopy.includes(word), `公开区域不得出现 ${word}`)
  assert.doesNotMatch(source, /error\.value\s*=\s*e(?:rror)?\.message/)
})

test('少儿体育教学续费页面使用训练服务语言', () => {
  const sources = ['RenewalRateEducation.vue', 'ClassConsumptionRateEducation.vue', 'ClassRateEducation.vue'].map(name => read(`src/views/tools/${name}`)).join('\n')
  for (const word of ['出勤', '训练表现', '教练反馈', '剩余课时', '续费']) assert.ok(sources.includes(word), `应包含 ${word}`)
  assert.match(sources, /老带新/)
  for (const word of ['成绩', '提分', '知识点薄弱', 'K12学科类', '扩科']) assert.ok(!sources.includes(word), `不得出现 ${word}`)
  assert.match(sources, /remainingClasses/)
  assert.match(sources, /shouldConsume/)
})

test('会员与服务页明确系统和真人边界并隐藏研发口吻', () => {
  const membership = read('src/views/Membership.vue')
  const service = read('src/views/growth/ServiceCenter.vue')
  const matrix = read('src/components/MembershipOutcomeMatrix.vue')
  const combined = `${membership}\n${service}\n${matrix}`
  for (const word of ['看清问题', '照着执行', '持续复盘', '真人陪跑']) assert.ok(combined.includes(word), `应包含 ${word}`)
  assert.match(service, /系统负责整理信息、提醒节点和提供复盘参考/)
  assert.match(service, /真人顾问负责确认目标、复杂判断和执行纠偏/)
  assert.match(service, /programTypeText/)
  assert.match(service, /programStatusText/)
  assert.match(service, /program\.program_type/)
  assert.match(service, /program\.status/)
  assert.doesNotMatch(combined, /前端已上线能力|v4页面方案|Bug/)
  assert.doesNotMatch(combined, /message\.value\s*=\s*error\.message|alert\(error\.message/)
})
