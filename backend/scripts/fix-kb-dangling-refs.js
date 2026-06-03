// Auto-fix script: find best replacement for each dangling kb-mapping path
// Strategy: tokenize path keywords, search KB dir, rank by keyword overlap
import fs from 'fs'
import path from 'path'

const KB_ROOT = '/home/ubuntu/woying-ai/knowledge-base'
const MAPPING = '/home/ubuntu/woying-ai/backend/src/config/kb-mapping.json'

// Tokenize Chinese + ASCII path: 拆词
function tokenize(p) {
  return p
    .replace(/\.md$/, '')
    .split(/[\/_\-\s\.]+/)
    .filter(t => t.length >= 2)
}

// Load
const mapping = JSON.parse(fs.readFileSync(MAPPING, 'utf8'))
const allFiles = (function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else if (e.isFile() && full.endsWith('.md')) out.push(full)
  }
  return out
})(KB_ROOT).map(f => path.relative(KB_ROOT, f))

// Build ref map
const refByPath = new Map()
for (const [tool, cfg] of Object.entries(mapping)) {
  if (tool.startsWith('_')) continue
  for (const f of cfg.knowledgeFiles || []) {
    if (!refByPath.has(f.path)) refByPath.set(f.path, [])
    refByPath.get(f.path).push({ tool, sections: f.sections, memberLevel: f.memberLevel })
  }
}

// For each dangling, find best match
console.log('='.repeat(80))
console.log('  Dangling refs 智能匹配建议')
console.log('='.repeat(80))
console.log()

const suggestions = []
for (const [missing, refs] of refByPath.entries()) {
  if (fs.existsSync(path.join(KB_ROOT, missing))) continue  // still exists
  const missTokens = new Set(tokenize(missing))
  const scores = []
  for (const candidate of allFiles) {
    const candTokens = new Set(tokenize(candidate))
    let hit = 0
    for (const t of missTokens) {
      if (candTokens.has(t)) hit += 1
      else {
        // Partial: check substring
        for (const ct of candTokens) {
          if (ct.includes(t) || t.includes(ct)) { hit += 0.5; break }
        }
      }
    }
    if (hit > 0) {
      scores.push({ path: candidate, score: hit / missTokens.size })
    }
  }
  scores.sort((a, b) => b.score - a.score)
  const top = scores.slice(0, 3)
  const tools = refs.map(r => r.tool).join(', ')
  const firstRef = refs[0]
  suggestions.push({ missing, tools, sections: firstRef.sections, top, firstTool: firstRef.tool, memberLevel: firstRef.memberLevel })
}

for (const s of suggestions) {
  console.log(`❌ ${s.missing}`)
  console.log(`   工具: ${s.tools}`)
  console.log(`   候选 (top 3):`)
  s.top.forEach((c, i) => {
    console.log(`     [${(c.score * 100).toFixed(0)}%] ${c.path}`)
  })
  console.log()
}

console.log('='.repeat(80))
console.log(`  共 ${suggestions.length} 个 dangling ref 待修复`)
console.log('='.repeat(80))
