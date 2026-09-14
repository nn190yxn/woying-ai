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

test('公共工具目录使用经营问题语言并解释教培核心指标', async () => {
  const catalog = await source('src/constants/toolCatalog.js')
  assert.match(catalog, /新生招生成本（CAC）/)
  assert.match(catalog, /学员长期价值（LTV）/)
  assert.match(catalog, /招生投入产出比（ROI）/)
  assert.match(catalog, /教练人效/)
  assert.match(catalog, /场地利用率/)
  assert.doesNotMatch(catalog, /智能体|生成器|分析器|企业增长全景顾问|系统回路/)
})

test('经营表格按钮说明具体动作并提供可继续的空状态', async () => {
  const sheet = await source('src/components/SheetTemplate.vue')
  for (const copy of ['需要填写', '下载经营记录', '导入已有记录', '保存本次记录', '查看以前的记录']) {
    assert.match(sheet, new RegExp(copy))
  }
  assert.match(sheet, /还没有填写内容.+新增一行.+开始记录本周经营情况/)
  assert.match(sheet, /还没有以前的记录.+先保存本次填写内容/)
  assert.doesNotMatch(sheet, /字段数|加载历史|导出 CSV|未知错误|保存失败|加载失败/)
})

test('工具详情统一使用填写、建议、记录和陪跑语言', async () => {
  const detail = await source('src/components/ToolDetail.vue')
  for (const copy of ['填写这次经营情况', '整理经营建议', '今日可用', '本次经营建议', '下载经营记录', '保存到以前的记录']) {
    assert.match(detail, new RegExp(copy))
  }
  assert.match(detail, /顾问结合你的校区情况.+确认问题和行动安排/)
  assert.doesNotMatch(detail, /输入信息|立即生成|处理中|今日额度|生成结果|导出 CSV|保存到历史/)
})

test('服务方案不再按模块数量证明价值', async () => {
  const matrix = await source('src/components/MembershipOutcomeMatrix.vue')
  assert.match(matrix, /适合解决.+经营问题/)
  assert.doesNotMatch(matrix, /大模块|3\/8|5\/8|7\/8|8\/8/)
})
