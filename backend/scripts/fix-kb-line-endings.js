// Convert all CRLF KB files to LF
// Run on server, in-place
import fs from 'fs'
import path from 'path'

const KB_ROOT = '/home/ubuntu/woying-ai/knowledge-base'

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(full))
    else if (e.isFile() && full.endsWith('.md')) out.push(full)
  }
  return out
}

const files = walk(KB_ROOT)
let converted = 0
let alreadyLF = 0
for (const f of files) {
  const buf = fs.readFileSync(f)
  // Check if any \r\n
  let hasCRLF = false
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] === 0x0d && buf[i+1] === 0x0a) { hasCRLF = true; break }
  }
  if (hasCRLF) {
    const content = buf.toString('utf-8').replace(/\r\n/g, '\n')
    fs.writeFileSync(f, content, 'utf-8')
    converted++
  } else {
    alreadyLF++
  }
}
console.log('KB files: ' + files.length)
console.log('CRLF -> LF converted: ' + converted)
console.log('Already LF: ' + alreadyLF)
process.exit(0)
