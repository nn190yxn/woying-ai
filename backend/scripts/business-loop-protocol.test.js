import test from 'node:test'
import assert from 'node:assert/strict'
import { buildBusinessDiagnosis, compareBusinessPeriods, validateBusinessInput } from '../src/services/acquisition/businessLoop.js'
import { CHILD_TRAINING_LOOP_FIXTURES } from './fixtures/child-training-loop-fixtures.js'

test('四类匿名样本得到不同且符合漏斗数据的主问题', () => {
  const results = CHILD_TRAINING_LOOP_FIXTURES.map(fixture => ({ fixture, result: buildBusinessDiagnosis(fixture.input) }))
  assert.equal(new Set(results.map(item => item.result.output.conclusion)).size, 4)
  for (const { fixture, result } of results) {
    assert.equal(result.status, 'needs_review')
    assert.equal(result.output.conclusion, fixture.expectedIssue)
    assert.ok(fixture.expectedBasis.every(id => result.output.basis.includes(id)))
    assert.ok(result.output.actions.length >= 1 && result.output.actions.length <= 2)
    assert.ok(result.output.validationMetrics.length >= 1)
    assert.ok(result.output.stopConditions.length >= 1)
  }
})

test('业务输入拒绝个人信息、负数和未知问题，并保留缺失指标警告', () => {
  const invalid = validateBusinessInput({ problem_code: 'sale_low', phone: '13800138000', new_sales: -1 })
  assert.equal(invalid.valid, false)
  assert.ok(invalid.errors.some(error => error.includes('phone')))
  assert.ok(invalid.errors.some(error => error.includes('new_sales')))
  const incomplete = validateBusinessInput({ problem_code: 'unknown', course_name: '少儿体能' })
  assert.equal(incomplete.valid, true)
  assert.equal(incomplete.warnings.length, 1)
})

test('七天复盘根据执行状态和指标变化选择四态建议', () => {
  assert.equal(compareBusinessPeriods({ valid_leads: 10 }, { valid_leads: 12 }, true).decision, 'continue')
  assert.equal(compareBusinessPeriods({ valid_leads: 10 }, { valid_leads: 10 }, true).decision, 'adjust')
  assert.equal(compareBusinessPeriods({ valid_leads: 10 }, { valid_leads: 8 }, true).decision, 'stop')
  assert.equal(compareBusinessPeriods({ valid_leads: 10 }, {}, true).decision, 'consultant')
  assert.equal(compareBusinessPeriods({ valid_leads: 10 }, { valid_leads: 12 }, false).decision, 'adjust')
})
