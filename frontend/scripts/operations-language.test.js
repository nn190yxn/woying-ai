import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  AI_SERVICE_BOUNDARY,
  OPERATION_METRICS,
  OPERATION_STATUS,
  OPERATION_ACTIONS,
  BUSINESS_TERMS,
  PUBLIC_FORBIDDEN_TERMS,
  operationError,
  operationStatus
} from '../src/constants/operationsLanguage.js'
import { scanOperationsCopy } from './operations-copy-scan.js'

test('所有公开状态都有中文经营名称和处理说明', () => {
  for (const [status, copy] of Object.entries(OPERATION_STATUS)) {
    assert.ok(copy.label, `${status} 缺少中文名称`)
    assert.ok(copy.description, `${status} 缺少处理说明`)
    assert.doesNotMatch(copy.label, /^[a-z_]+$/i)
  }
  assert.equal(operationStatus('needs_review').label, '需要顾问确认')
  assert.equal(operationStatus('unknown').label, '状态待确认')
})

test('专业指标缩写均提供中文业务名称和口径', () => {
  for (const [metric, copy] of Object.entries(OPERATION_METRICS)) {
    assert.ok(copy.label, `${metric} 缺少中文业务名称`)
    assert.ok(copy.description, `${metric} 缺少业务口径`)
  }
  for (const metric of ['cac', 'ltv', 'roi']) {
    assert.ok(OPERATION_METRICS[metric].abbreviation)
    assert.match(OPERATION_METRICS[metric].description, /招生|学员|报名|收入/)
  }
})

test('错误翻译按用户动作给出下一步且不泄露技术细节', () => {
  const secretError = {
    response: {
      status: 500,
      data: {
        code: 'MYSQL_FAILURE',
        error: 'Redis password=secret-token phone=13800138000',
        details: { stack: 'at query database' }
      }
    }
  }
  const translated = operationError(secretError, { action: '保存本周数据' })
  assert.match(translated.message, /保存本周数据/)
  assert.doesNotMatch(translated.message, /Redis|password|token|13800138000|stack|database/i)
  assert.match(operationError({ response: { status: 403 } }).message, /机构管理员/)
  const network = operationError({ code: 'ERR_NETWORK' }, { action: '打开经营记录' })
  assert.match(network.message, /打开经营记录|检查网络/)
  assert.equal(network.currentAction, '打开经营记录')
  assert.ok(network.impact)
  assert.ok(network.nextStep)
  const thirdParty = operationError({ response: { status: 502, data: { message: 'provider secret' } } }, { action: '生成建议' })
  assert.doesNotMatch(thirdParty.message, /provider|secret/)
  assert.match(thirdParty.message, /生成建议/)
})

test('未知错误也提供当前动作、影响和下一步', () => {
  const translated = operationError(new Error('第三方原始错误'), { action: '保存记录' })
  assert.equal(translated.currentAction, '保存记录')
  assert.match(translated.message, /保存记录/)
  assert.ok(translated.impact)
  assert.ok(translated.nextStep)
})

test('AI边界文案不承诺自动获客或保证效果', () => {
  const copy = Object.values(AI_SERVICE_BOUNDARY).join('；')
  assert.match(copy, /填写的信息|经营参考|顾问确认|记录结果/)
  assert.doesNotMatch(copy, /精准诊断|自动获客|快速见效|保证提升|最优方案/)
})

test('公开运营文案包含儿童培训经营对象或明确动作', () => {
  const copy = Object.values(OPERATION_STATUS).flatMap(item => [item.label, item.description])
    .concat(Object.values(OPERATION_ACTIONS))
    .join('；')
  assert.match(copy, /机构|校区|课程|家长|学员|报名|体验|保存|查看|制定|回看|下载|再试|服务/)
  assert.doesNotMatch(copy, new RegExp(PUBLIC_FORBIDDEN_TERMS.join('|')))
  assert.ok(Object.values(BUSINESS_TERMS).every(term => /[\u4e00-\u9fff]/.test(term)))
})

test('扫描脚本返回可定位的禁用词和敏感明文', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'operations-copy-'))
  try {
    const file = path.join(root, 'Demo.vue')
    const settings = path.join(root, 'TechnicalSettings.vue')
    await writeFile(file, '<template>智能体矩阵 请求失败</template>\n<script>const phone = "13800138000"; const payload = { message: error.message }</script>', 'utf8')
    await writeFile(settings, '<template>Redis API Key</template>\n<script>const stack = error.stack</script>', 'utf8')
    const findings = await scanOperationsCopy({ roots: [root] })
    assert.ok(findings.some(item => item.term === '智能体矩阵' && item.scope === 'public'))
    assert.ok(findings.some(item => item.term === '请求失败' && item.scope === 'public'))
    assert.ok(findings.some(item => item.term === 'phone-number' && item.scope === 'public'))
    assert.ok(findings.some(item => item.term === 'raw-error-forwarding'))
    assert.ok(!findings.some(item => item.term === 'Redis'))
    assert.ok(findings.some(item => item.term === 'stack-trace' && item.scope === 'technical-settings'))
    assert.ok(findings.every(item => item.file && item.line >= 1 && item.excerpt && item.scope))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})
