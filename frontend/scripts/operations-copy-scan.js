import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PUBLIC_FORBIDDEN_TERMS } from '../src/constants/operationsLanguage.js'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..', '..')
const DEFAULT_ROOTS = [path.join(projectRoot, 'frontend', 'src'), path.join(projectRoot, 'backend', 'src')]
const INCLUDED_EXTENSIONS = new Set(['.vue', '.js', '.mjs', '.ts'])
const EXCLUDED_FILES = new Set(['operationsLanguage.js'])
const TECHNICAL_SETTINGS_PATTERN = /[\\/](TechnicalSettings|technical-settings)(?:[.\\/]|$)/i
const TECHNICAL_SETTINGS_FILE_PATTERN = /(?:technicalsettings|technical-settings|runtimeconfig|diagnosticsettings)/i
const SENSITIVE_LITERAL_PATTERNS = [
  { code: 'plain-secret', pattern: /(?:api[_ -]?key|token|password|secret)\s*[:=]\s*['"][^'"<]{8,}/i },
  { code: 'phone-number', pattern: /\b1[3-9]\d{9}\b/ },
  { code: 'stack-trace', pattern: /(?:stack\s*[:=]|at\s+\w+[.(]|traceback)/i },
  { code: 'raw-error-forwarding', pattern: /^(?!.*logger\.error)(?:.*)(?:message|error|details)\s*:\s*(?:error|err)\.(?:message|stack)/i },
  { code: 'jwt-token', pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/ }
]

async function listSourceFiles(root) {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const absolute = path.join(root, entry.name)
    if (entry.isDirectory()) files.push(...await listSourceFiles(absolute))
    else if (INCLUDED_EXTENSIONS.has(path.extname(entry.name)) && !EXCLUDED_FILES.has(entry.name)) files.push(absolute)
  }
  return files
}

function lineFinding(file, line, lineNumber, term, category) {
  return {
    file: path.relative(projectRoot, file).replaceAll('\\', '/'),
    line: lineNumber,
    term,
    category,
    excerpt: line.trim().slice(0, 180)
  }
}

export async function scanOperationsCopy(options = {}) {
  const roots = options.roots?.length ? options.roots : DEFAULT_ROOTS
  const findings = []
  for (const root of roots) {
    const files = await listSourceFiles(path.resolve(root))
    for (const file of files) {
      const technicalSettings = TECHNICAL_SETTINGS_PATTERN.test(file) || TECHNICAL_SETTINGS_FILE_PATTERN.test(path.basename(file))
      const lines = (await readFile(file, 'utf8')).split(/\r?\n/)
      lines.forEach((line, index) => {
        const scope = technicalSettings ? 'technical-settings' : 'public'
        if (!technicalSettings) {
          for (const term of PUBLIC_FORBIDDEN_TERMS) {
            if (line.includes(term)) findings.push({ ...lineFinding(file, line, index + 1, term, 'public-technical-copy'), scope })
          }
        }
        // 技术设置可使用内部术语，但任何敏感明文或原始错误转发仍必须拦截。
        for (const rule of SENSITIVE_LITERAL_PATTERNS) {
          if (rule.pattern.test(line)) findings.push({ ...lineFinding(file, line, index + 1, rule.code, 'sensitive-literal'), scope })
        }
      })
    }
  }
  return findings.sort((a, b) => a.file.localeCompare(b.file, 'zh-CN') || a.line - b.line)
}

async function run() {
  const strict = process.argv.includes('--strict')
  const findings = await scanOperationsCopy()
  if (!findings.length) {
    console.log('运营语言扫描通过：未发现客户侧禁用技术词或明文敏感内容。')
    return
  }
  console.log(`运营语言扫描发现 ${findings.length} 处待治理内容：`)
  for (const finding of findings) {
    console.log(`${finding.file}:${finding.line} [${finding.category}] ${finding.term} | ${finding.excerpt}`)
  }
  if (strict) process.exitCode = 1
}

if (path.resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)) {
  run().catch(error => {
    console.error(`运营语言扫描暂时未能完成：${error.message}`)
    process.exitCode = 1
  })
}
