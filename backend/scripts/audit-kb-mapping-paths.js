// Audit script: kb-mapping.json vs actual KB files
// Detects: dangling refs, orphan files, section mismatches, CRLF issues
import fs from 'fs'
import path from 'path'

const KB_ROOT = '/home/ubuntu/woying-ai/knowledge-base'
const MAPPING = '/home/ubuntu/woying-ai/backend/src/config/kb-mapping.json'

// --- 1. 收集 kb-mapping 引用 ---
const mapping = JSON.parse(fs.readFileSync(MAPPING, 'utf8'))
const refByPath = new Map()        // path -> [{tool, memberLevel, sections, purpose}]
for (const [tool, cfg] of Object.entries(mapping)) {
  if (tool.startsWith('_')) continue
  for (const f of cfg.knowledgeFiles || []) {
    if (!refByPath.has(f.path)) refByPath.set(f.path, [])
    refByPath.get(f.path).push({ tool, memberLevel: f.memberLevel, sections: f.sections, purpose: f.purpose })
  }
}

// --- 2. 扫描 KB 目录所有 .md ---
function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && full.endsWith('.md')) out.push(full)
  }
  return out
}
const allFiles = walk(KB_ROOT)
const allRelPaths = new Set(allFiles.map(f => path.relative(KB_ROOT, f)))

// --- 3. 分类 ---
const dangling = []  // 引用但不存在
const existing = []  // 引用且存在
for (const [p, refs] of refByPath.entries()) {
  if (!allRelPaths.has(p)) dangling.push({ path: p, refs })
  else existing.push({ path: p, refs })
}

const orphan = []  // 存在但无引用
for (const p of allRelPaths) {
  if (!refByPath.has(p)) orphan.push(p)
}

// --- 4. 检测行尾 ---
const crlfFiles = []
for (const full of allFiles) {
  const buf = fs.readFileSync(full)
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0x0d) {  // \r
      crlfFiles.push(path.relative(KB_ROOT, full))
      break
    }
  }
}

// --- 5. 对 existing 检测 section 匹配 ---
const sectionMismatches = []
for (const { path: p, refs } of existing) {
  const full = path.join(KB_ROOT, p)
  let content = fs.readFileSync(full, 'utf-8').replace(/\r\n/g, '\n')
  const lines = content.split('\n')
  const headings = lines
    .filter(l => l.match(/^#{1,6}\s/))
    .map(l => l.match(/^#{1,6}\s+(.+)$/)?.[1]?.trim() || '')
    .filter(Boolean)
  for (const r of refs) {
    const matched = []
    const missed = []
    for (const sec of r.sections || []) {
      const hit = headings.some(h => h.includes(sec))
      if (hit) matched.push(sec)
      else missed.push(sec)
    }
    if (missed.length > 0) {
      sectionMismatches.push({ path: p, tool: r.tool, memberLevel: r.memberLevel, missed, matched })
    }
  }
}

// --- 6. 输出报告 ---
console.log('='.repeat(70))
console.log('  KB 路径一致性审计报告')
console.log('='.repeat(70))
console.log()
console.log(`KB 根目录:        ${KB_ROOT}`)
console.log(`映射配置:         ${MAPPING}`)
console.log(`总 .md 文件:      ${allFiles.length}`)
console.log(`被引用的 unique 路径: ${refByPath.size}`)
console.log()

console.log('--- 1. dangling refs (引用但文件不存在) ---')
if (dangling.length === 0) console.log('  ✓ 无')
else {
  console.log(`  ✗ ${dangling.length} 个路径不存在:`)
  for (const d of dangling) {
    const tools = d.refs.map(r => r.tool).join(', ')
    console.log(`    [${d.refs[0].memberLevel}] ${d.path}`)
    console.log(`         工具: ${tools} (${d.refs.length} 处引用)`)
  }
}
console.log()

console.log('--- 2. orphan files (文件存在但无任何工具引用) ---')
if (orphan.length === 0) console.log('  ✓ 无')
else {
  console.log(`  ⚠ ${orphan.length} 个文件未挂载到任何工具:`)
  // 按目录分组
  const byDir = new Map()
  for (const p of orphan) {
    const dir = path.dirname(p)
    if (!byDir.has(dir)) byDir.set(dir, [])
    byDir.get(dir).push(path.basename(p))
  }
  for (const [dir, files] of byDir) {
    console.log(`    ${dir}/ (${files.length})`)
    files.slice(0, 5).forEach(f => console.log(`      - ${f}`))
    if (files.length > 5) console.log(`      ... 还有 ${files.length - 5} 个`)
  }
}
console.log()

console.log('--- 3. CRLF 行尾文件 ---')
if (crlfFiles.length === 0) console.log('  ✓ 全部 LF')
else {
  console.log(`  ⚠ ${crlfFiles.length} 个文件用 CRLF 行尾:`)
  crlfFiles.forEach(f => console.log(`    - ${f}`))
}
console.log()

console.log('--- 4. section 不匹配 (文件存在但 sections 关键字找不到) ---')
if (sectionMismatches.length === 0) console.log('  ✓ 全部命中')
else {
  console.log(`  ⚠ ${sectionMismatches.length} 处不匹配:`)
  // 按 path 分组
  const byPath = new Map()
  for (const m of sectionMismatches) {
    if (!byPath.has(m.path)) byPath.set(m.path, [])
    byPath.get(m.path).push(m)
  }
  for (const [p, ms] of byPath) {
    console.log(`    ${p}`)
    for (const m of ms) {
      console.log(`      [${m.tool}/${m.memberLevel}] 未匹配: ${m.missed.join(', ')}`)
    }
  }
}
console.log()

console.log('--- 5. 健康度评分 ---')
const total = refByPath.size
const ok = existing.length - sectionMismatches.filter(m => byPathOf(m, sectionMismatches).every(x => x.missed.length === m.missed.length)).length
const danglingPct = (dangling.length / total * 100).toFixed(1)
const mismatchPct = (sectionMismatches.length / (total * 3) * 100).toFixed(1)  // 估 3 sections/path
function byPathOf(m, list) { return list.filter(x => x.path === m.path) }

console.log(`  dangling refs:        ${dangling.length}/${total} (${danglingPct}%)`)
console.log(`  CRLF files:           ${crlfFiles.length}/${allFiles.length} (${(crlfFiles.length/allFiles.length*100).toFixed(1)}%)`)
console.log(`  section mismatches:   ${sectionMismatches.length} 处`)
console.log(`  orphan files:         ${orphan.length}/${allFiles.length} (${(orphan.length/allFiles.length*100).toFixed(1)}%)`)
console.log()
console.log('='.repeat(70))
