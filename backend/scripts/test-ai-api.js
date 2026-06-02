import dotenv from 'dotenv'
import axios from 'axios'

dotenv.config()

const url = (process.env.MCAI_LLM_BASE_URL || 'https://proxy.monkeycode-ai.com/v1') + '/chat/completions'
const key = process.env.MCAI_LLM_API_KEY
const model = process.env.MCAI_LLM_MODEL || 'gpt-5.5'

try {
  const r = await axios.post(url, {
    model,
    messages: [{ role: 'user', content: 'hi' }],
    max_tokens: 10
  }, {
    headers: { Authorization: `Bearer ${key}` },
    timeout: 15000
  })
  console.log(`AI_STATUS=${r.status}`)
  console.log(`AI_MODEL=${r.data?.model || 'unknown'}`)
  console.log(`AI_CONTENT=${(r.data?.choices?.[0]?.message?.content || 'empty').slice(0, 80)}`)
} catch (e) {
  console.log(`AI_ERROR=${e.message}`)
  console.log(`AI_HTTP=${e.response?.status || 'n/a'}`)
  if (e.response?.data) {
    const dataStr = typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)
    console.log(`AI_BODY=${dataStr.slice(0, 200)}`)
  }
}