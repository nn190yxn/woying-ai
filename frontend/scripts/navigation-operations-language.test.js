import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('客户侧行业入口聚焦儿童素质培训且保留其他行业代码', async () => {
  const catalog = await readFile(path.join(frontendRoot, 'src/constants/toolCatalog.js'), 'utf8')
  assert.match(catalog, /export const visibleIndustryEntries = industryEntries\.filter\(entry => entry\.slug === 'education'\)/)
  assert.match(catalog, /slug: 'restaurant'/)
  assert.match(catalog, /slug: 'beauty'/)
})

test('主导航使用校长经营语言，不暴露产品研发分类', async () => {
  const navbar = await readFile(path.join(frontendRoot, 'src/components/NavBar.vue'), 'utf8')
  for (const label of ['本周经营', '招生行动', '家长跟进', '经营复盘', '经营记录', '陪跑服务']) {
    assert.match(navbar, new RegExp(label))
  }
  assert.doesNotMatch(navbar, /经营体检.*作战计划.*内容成交.*数据复盘/s)
  assert.doesNotMatch(navbar, /智能体矩阵|模块编号|API Key|Redis/)
})

test('首页围绕儿童培训经营结果组织入口', async () => {
  const home = await readFile(path.join(frontendRoot, 'src/views/Home.vue'), 'utf8')
  for (const term of ['儿童培训机构经营工作台', '咨询', '预约体验', '到店', '报名', '续费', '7天']) {
    assert.match(home, new RegExp(term))
  }
  assert.doesNotMatch(home, /餐饮门店抖音获客|美业、教培、生活服务/)
})
