import jwt from 'jsonwebtoken'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const TOKEN = process.env.TOKEN || jwt.sign(
  { userId: 0 },
  process.env.JWT_SECRET || 'test-secret-key-for-development',
  { issuer: 'woai-ai-backend', audience: 'woai-ai-clients', expiresIn: '10m' }
)

async function main() {
  const response = await fetch(`${BASE_URL}/api/generate/topic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify({
      industry: 'education',
      goals: ['exposure'],
      contentTypes: ['talking'],
      duration: '30s',
      scenes: ['store'],
      platforms: ['douyin'],
      count: 3
    })
  })

  const json = await response.json()
  if (!response.ok) {
    console.error('FALLBACK_TEST_HTTP_FAIL', JSON.stringify(json))
    process.exit(1)
  }

  if (typeof json.degraded !== 'boolean') {
    console.error('FALLBACK_TEST_SCHEMA_FAIL')
    process.exit(1)
  }

  console.log(JSON.stringify({
    status: json.status,
    degraded: json.degraded,
    summary: json.summary,
    meta: json.meta
  }, null, 2))
}

main().catch((error) => {
  console.error('FALLBACK_TEST_ERROR', error.message)
  process.exit(1)
})
