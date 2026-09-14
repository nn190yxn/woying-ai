import { readdirSync, statSync, createReadStream, mkdirSync, writeFileSync } from 'fs'
import { createHash } from 'crypto'
import { extname, join, relative, resolve, dirname, sep } from 'path'
import { fileURLToPath } from 'url'

const SCRIPT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.py', '.ps1', '.bat', '.cmd', '.sh', '.exe'])
const CONFIG_EXTENSIONS = new Set(['.env', '.ini', '.yaml', '.yml', '.toml'])
const ARCHIVES = new Set(['.zip', '.rar', '.7z', '.tar', '.gz'])
const ALLOWED = new Set(['.md', '.json', '.pdf', '.pptx', '.docx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.webp'])

export function classifyManifestPath(relativePath) {
  const normalized = relativePath.split(sep).join('/')
  const parts = normalized.split('/')
  const ext = extname(normalized).toLowerCase()
  if (parts.some(part => part.startsWith('.') || ['node_modules', '__pycache__', 'memory', '工作记忆'].includes(part))) return { included: false, reason: 'hidden_or_tool_directory', type: ext.slice(1) || 'unknown' }
  if (SCRIPT_EXTENSIONS.has(ext)) return { included: false, reason: 'script_or_executable', type: ext.slice(1) }
  if (CONFIG_EXTENSIONS.has(ext) || /(?:credential|secret|token|config)/i.test(normalized)) return { included: false, reason: 'config_or_credential', type: ext.slice(1) || 'config' }
  if (ARCHIVES.has(ext)) return { included: false, reason: 'archive', type: ext.slice(1) }
  if (!ALLOWED.has(ext)) return { included: false, reason: 'unsupported_type', type: ext.slice(1) || 'unknown' }
  return { included: true, reason: 'eligible_evidence', type: ext.slice(1) }
}

async function sha256(file) {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(file)) hash.update(chunk)
  return hash.digest('hex')
}

export async function buildManifest(sourceRoot) {
  const root = resolve(sourceRoot)
  const files = []
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))) {
      const absolute = join(dir, entry.name)
      if (entry.isDirectory()) walk(absolute)
      else if (entry.isFile()) files.push(absolute)
    }
  }
  walk(root)
  const entries = []
  for (const absolute of files) {
    const path = relative(root, absolute).split(sep).join('/')
    const classification = classifyManifestPath(path)
    entries.push({ path, type: classification.type, size: statSync(absolute).size, sha256: await sha256(absolute), status: classification.included ? 'included' : 'excluded', reason: classification.reason })
  }
  return { manifest_version: 1, source_root_label: 'configured-read-only-source', file_count: entries.length, included_count: entries.filter(x => x.status === 'included').length, entries }
}

async function main() {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
  const sourceRoot = process.argv[2] || process.env.LOCAL_LIFE_KB_SOURCE || 'E:\\知识库\\内容运营知识库\\本地生活'
  const output = resolve(projectRoot, process.argv[3] || '.monkeycode/manifests/local-life-knowledge-manifest.json')
  if (!output.startsWith(projectRoot + sep)) throw new Error('Manifest output must remain inside project')
  const manifest = await buildManifest(sourceRoot)
  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'w' })
  console.log(`Manifest written: ${output} (${manifest.included_count}/${manifest.file_count} included)`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1 })
