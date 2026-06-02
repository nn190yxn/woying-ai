import jwt from 'jsonwebtoken'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const TOKEN = process.env.TOKEN || jwt.sign(
  { userId: 0 },
  process.env.JWT_SECRET || 'test-secret-key-for-development',
  { issuer: 'woai-ai-backend', audience: 'woai-ai-clients', expiresIn: '10m' }
)

async function post(toolCode, payload) {
  const response = await fetch(`${BASE_URL}/api/generate/${toolCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  })

  const data = await response.json()
  return { status: response.status, data }
}

async function main() {
  const cases = [
    ['unknown-tool', {}, 400],
    ['fission', { industry: 'catering', budget: 'high' }, 200],
    ['marketing-plan', { industry: 'restaurant' }, 200]
  ]

  for (const [toolCode, payload, expectedStatus] of cases) {
    const result = await post(toolCode, payload)
    if (result.status !== expectedStatus) {
      throw new Error(`${toolCode} expected ${expectedStatus}, got ${result.status}: ${JSON.stringify(result.data)}`)
    }
  }

  console.log('VALIDATION_FLOW_OK')
}

main().catch((error) => {
  console.error('VALIDATION_FLOW_FAIL', error.message)
  process.exit(1)
})
