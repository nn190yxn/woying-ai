import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

const t = fs.readFileSync('.env', 'utf8')
const keyMatch = t.match(/^MCAI_LLM_API_KEY=(.*)$/m)
if (!keyMatch) { console.log('KEY_LINE_NOT_FOUND'); process.exit() }
const v = keyMatch[1]
const urlMatch = t.match(/^MCAI_LLM_BASE_URL=(.*)$/m)
const sq = String.fromCharCode(39)

console.log('KEY_LENGTH=' + v.length)
console.log('HAS_QUOTES=' + (v.startsWith('"') || v.startsWith(sq)))
console.log('HAS_TRAILING_SPACE=' + (v !== v.trimEnd()))
console.log('HAS_NEWLINE=' + v.includes('\n'))
console.log('STARTS_WITH_SK=' + v.startsWith('sk-'))
console.log('BASE_URL=' + (urlMatch ? urlMatch[1] : 'n/a'))
console.log('DOTENV_LOADED_KEY_LENGTH=' + (process.env.MCAI_LLM_API_KEY || '').length)
console.log('DOTENV_KEY_STARTS_SK=' + (process.env.MCAI_LLM_API_KEY || '').startsWith('sk-'))