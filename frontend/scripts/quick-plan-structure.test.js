import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const quickPlanSource = await readFile(new URL('../src/views/douyin/QuickPlanAgent.vue', import.meta.url), 'utf8')

test('quick plan page exposes expected plan structure anchors', () => {
  assert.match(quickPlanSource, /class="day-card"/)
  assert.match(quickPlanSource, /class="script-panel"/)
  assert.match(quickPlanSource, /class="status-select"/)
  assert.match(quickPlanSource, /v-for="row in planRows"/)
  assert.match(quickPlanSource, /plan\.value\.phases\.flatMap/)
})

test('quick plan page renders research brief and risk boundary sections', () => {
  assert.match(quickPlanSource, /调研依据/)
  assert.match(quickPlanSource, /执行边界/)
  assert.match(quickPlanSource, /researchBrief/)
  assert.match(quickPlanSource, /riskBoundary/)
})

test('quick plan page preserves status update and review entry points', () => {
  assert.match(quickPlanSource, /updateRowStatus/)
  assert.match(quickPlanSource, /openReview/)
  assert.match(quickPlanSource, /planContext/)
})
