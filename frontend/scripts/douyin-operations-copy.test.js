import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const hub = read('../src/views/DouyinAgentHub.vue')
const diagnosis = read('../src/views/douyin/DiagnosisAgent.vue')
const plan = read('../src/views/douyin/QuickPlanAgent.vue')
const review = read('../src/views/douyin/VideoDiagnoserAgent.vue')
const publicCopy = [hub, diagnosis, plan, review].join('\n')

test('保留路由和 API 兼容字符串', () => {
  for (const value of ['/douyin/quick-plan', '/douyin/video-diagnoser', '/douyin/review-records', '/douyin/diagnosis']) {
    assert.ok(publicCopy.includes(value), `缺少 ${value}`)
  }
})

test('经营文案覆盖校长工作流', () => {
  for (const value of ['主推课程', '家长问题', '拍摄安排', '发布检查', '咨询结果', '今天做什么', '谁负责', '什么时候完成', '完成标准', '登记结果', '到店/体验', '报名']) {
    assert.ok(publicCopy.includes(value), `缺少 ${value}`)
  }
})

test('诊断公开结构和来源边界完整，动作最多两项', () => {
  for (const value of ['主要问题', '判断依据', '可能原因', '本期先做（最多 2 项）', '暂时不要做', '观察指标', '停止或求助条件', '根据填写整理', '模型补充待核对', '需要顾问确认']) {
    assert.ok(diagnosis.includes(value), `缺少 ${value}`)
  }
  assert.match(diagnosis, /suggestions\.slice\(0, 2\)/)
})

test('禁用承诺和实现口吻不再公开', () => {
  for (const term of ['智能体矩阵', '五维健康度雷达图', '五维健康度雷达', '阶段骨架', 'AI 生成 80% 底稿', '速胜', '快速见效']) {
    assert.equal(publicCopy.includes(term), false, `仍公开禁词：${term}`)
  }
})

test('错误提示不透传 raw error', () => {
  assert.equal(publicCopy.includes("errorMessage.value = error.message"), false)
})
