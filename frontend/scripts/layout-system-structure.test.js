import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const readSource = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

const [
  variablesCss,
  mainCss,
  navBar,
  home,
  tools,
  membership,
  douyinHub,
  xhsHub,
  privateHub,
  diagnosisAgent,
  quickPlanAgent,
  videoDiagnoserAgent,
  agentCommonCss,
  douyinAgentCommonCss,
  sheetTemplate,
  toolDetailComponent
] = await Promise.all([
  readSource('src/styles/variables.css'),
  readSource('src/styles/main.css'),
  readSource('src/components/NavBar.vue'),
  readSource('src/views/Home.vue'),
  readSource('src/views/Tools.vue'),
  readSource('src/views/Membership.vue'),
  readSource('src/views/DouyinAgentHub.vue'),
  readSource('src/views/XhsAgentHub.vue'),
  readSource('src/views/PrivateAgentHub.vue'),
  readSource('src/views/douyin/DiagnosisAgent.vue'),
  readSource('src/views/douyin/QuickPlanAgent.vue'),
  readSource('src/views/douyin/VideoDiagnoserAgent.vue'),
  readSource('src/views/agent-common.css'),
  readSource('src/views/douyin/agent-common.css'),
  readSource('src/components/SheetTemplate.vue'),
  readSource('src/components/ToolDetail.vue')
])

test('layout design tokens and shared workbench classes exist', () => {
  for (const token of [
    '--bg-workbench',
    '--bg-panel',
    '--state-success-bg',
    '--state-warning-bg',
    '--state-locked-bg',
    '--workbench-max-width',
    '--button-height-md',
    '--radius-panel',
    '--shadow-card'
  ]) {
    assert.match(variablesCss, new RegExp(token))
  }

  for (const className of [
    'workbench-page-header',
    'workbench-section-header',
    'workbench-metrics',
    'status-badge',
    'status-reviewed',
    'task-flow-nav'
  ]) {
    assert.match(mainCss, new RegExp(`\\.${className}`))
  }
})

test('global navigation preserves task links and responsive shell anchors', () => {
  assert.match(navBar, /grid-template-columns:\s*auto minmax\(0, 1fr\) auto/)
  assert.match(navBar, /class="navbar-links"/)
  assert.match(navBar, /class="mobile-actions"/)
  assert.match(navBar, /class="menu-toggle"/)
  assert.match(navBar, /数据复盘', path: '\/douyin\/video-diagnoser'/)
  assert.match(navBar, /@media \(max-width: 768px\)/)
})

test('public entry pages expose workbench headers, actions, and cards', () => {
  for (const source of [home, tools, membership]) {
    assert.match(source, /workbench-section/)
    assert.match(source, /class="btn/)
    assert.match(source, /class="[^"]*card/)
  }

  assert.match(home, /hero-grid/)
  assert.match(home, /mission-grid/)
  assert.match(home, /module-grid/)
  assert.match(tools, /workbench-page-header/)
  assert.match(tools, /templates-grid/)
  assert.match(tools, /index-filters/)
  assert.match(membership, /workbench-page-header/)
  assert.match(membership, /privilege-table/)
  assert.match(membership, /status-badge/)
})

test('hub pages share mainline, access, and locked state structure', () => {
  for (const source of [douyinHub, xhsHub, privateHub]) {
    assert.match(source, /mainline-card/)
    assert.match(source, /agent-card/)
    assert.match(source, /getAgentLocked/)
    assert.match(source, /agent-lock-overlay/)
    assert.match(source, /lock-hint/)
  }
})

test('douyin sample flow keeps diagnosis, plan, and review anchors', () => {
  for (const source of [diagnosisAgent, quickPlanAgent, videoDiagnoserAgent]) {
    assert.match(source, /task-flow-nav/)
    assert.match(source, /\/douyin\/diagnosis/)
    assert.match(source, /\/douyin\/quick-plan/)
  }

  assert.match(diagnosisAgent, /diagnosis-overview/)
  assert.match(diagnosisAgent, /result-layout/)
  assert.match(diagnosisAgent, /aiDiagnosis:\s*diagnosisResult\.aiDiagnosis/)
  assert.match(diagnosisAgent, /result\.aiDiagnosis \|\| result\.diagnosis/)
  assert.match(quickPlanAgent, /class="day-card"/)
  assert.match(quickPlanAgent, /class="script-panel"/)
  assert.match(quickPlanAgent, /status-select/)
  assert.match(videoDiagnoserAgent, /review-result-layout/)
  assert.match(videoDiagnoserAgent, /next-step-panel/)
})

test('task and tool result layouts keep request, permission, and error contracts', () => {
  for (const source of [agentCommonCss, douyinAgentCommonCss]) {
    assert.match(source, /\.agent-page/)
    assert.match(source, /\.agent-header/)
    assert.match(source, /\.form-grid/)
    assert.match(source, /\.error-state/)
    assert.match(source, /\.upgrade-hint/)
  }

  assert.match(sheetTemplate, /generateTool/)
  assert.match(sheetTemplate, /request/)
  assert.match(sheetTemplate, /sheet-table-wrap/)
  assert.match(sheetTemplate, /sheet-history/)
  assert.match(toolDetailComponent, /result-summary/)
  assert.match(toolDetailComponent, /card-upgrade/)
  assert.match(toolDetailComponent, /spreadsheet-result/)
})
