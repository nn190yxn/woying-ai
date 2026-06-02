import fs from 'fs'
import jwt from 'jsonwebtoken'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000'
const TOKEN = process.env.TOKEN || jwt.sign(
  { userId: 0 },
  process.env.JWT_SECRET || 'test-secret-key-for-development',
  { issuer: 'woai-ai-backend', audience: 'woai-ai-clients', expiresIn: '10m' }
)

const TEST_CASES = [
  ['friend', { type: 'activity', scene: '奶茶店', highlight: '第二杯半价' }],
  ['topic', { industry: 'education', goals: ['exposure', 'conversion'], contentTypes: ['talking', 'case'], duration: '30s', scenes: ['store'], platforms: ['douyin'], count: 5 }],
  ['festival', { festival: 'lantern', industry: 'beauty', goal: 'promote', contentType: 'poster' }],
  ['fission', { industry: 'service', customerScale: '100-500', channel: 'mixed', priceRange: 'mid', budget: 'high' }],
  ['marketing-plan', { industry: 'restaurant', goal: '提升营业额', budget: '5000', duration: '2周' }]
]

async function callTool(toolCode, payload) {
  const response = await fetch(`${BASE_URL}/api/generate/${toolCode}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    },
    body: JSON.stringify(payload)
  })

  const json = await response.json()
  if (!response.ok) {
    throw new Error(`${toolCode} failed: ${JSON.stringify(json)}`)
  }

  return json
}

async function main() {
  const results = []
  for (const [toolCode, payload] of TEST_CASES) {
    results.push(await callTool(toolCode, payload))
  }

  fs.mkdirSync('./test-reports', { recursive: true })
  fs.writeFileSync('./test-reports/generate-snapshots.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    results
  }, null, 2))

  console.log('SNAPSHOT_OK')
}

main().catch((error) => {
  console.error('SNAPSHOT_FAIL', error.message)
  process.exit(1)
})
