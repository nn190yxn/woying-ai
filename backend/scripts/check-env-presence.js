import dotenv from 'dotenv'

dotenv.config({ path: process.env.ENV_FILE || '.env', override: false })

const groups = [
  {
    name: 'runtime',
    required: ['PORT', 'NODE_ENV', 'JWT_SECRET'],
    optional: ['GUEST_MODE', 'LOG_LEVEL', 'LOG_DIR']
  },
  {
    name: 'database',
    requiredAny: [
      ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'],
      ['MYSQL_HOST', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE']
    ],
    optional: ['DB_PORT', 'MYSQL_PORT']
  },
  {
    name: 'ai',
    requiredAny: [
      ['MCAI_LLM_API_KEY'],
      ['OPENAI_API_KEY']
    ],
    required: ['MCAI_LLM_BASE_URL', 'MCAI_LLM_MODEL'],
    optional: ['AI_REQUEST_TIMEOUT', 'AI_MAX_RETRIES', 'AI_FALLBACK_API_KEY', 'AI_FALLBACK_BASE_URL', 'AI_FALLBACK_MODEL']
  },
  {
    name: 'knowledge-base',
    optional: ['KB_ROOT_PATH', 'KB_MAX_CONTEXT_CHARS', 'KB_MAX_FILE_CHARS', 'KB_VECTOR_TOPK', 'KB_RETRIEVAL_MODE']
  },
  {
    name: 'redis',
    optional: ['USE_REAL_REDIS', 'REDIS_URL', 'REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD']
  },
  {
    name: 'payment-and-cron',
    optional: ['PAYMENT_CALLBACK_SECRET', 'FRONTEND_BASE_URL', 'CRON_SECRET']
  }
]

function isPresent(key) {
  return process.env[key] != null && process.env[key] !== ''
}

function checkGroup(group) {
  const missing = []
  const warnings = []

  for (const key of group.required || []) {
    if (!isPresent(key)) missing.push(key)
  }

  for (const alternatives of group.requiredAny || []) {
    const complete = alternatives.every(isPresent)
    if (!complete) warnings.push(alternatives.join(' + '))
  }

  const hasRequiredAnyFailure = group.requiredAny?.length
    ? !group.requiredAny.some(alternatives => alternatives.every(isPresent))
    : false

  return {
    name: group.name,
    ok: missing.length === 0 && !hasRequiredAnyFailure,
    missing,
    missingAlternativeSets: hasRequiredAnyFailure ? warnings : [],
    optionalPresent: (group.optional || []).filter(isPresent),
    optionalMissing: (group.optional || []).filter(key => !isPresent(key))
  }
}

const results = groups.map(checkGroup)

for (const result of results) {
  console.log(`[${result.ok ? 'ok' : 'missing'}] ${result.name}`)
  if (result.missing.length) {
    console.log(`  required missing: ${result.missing.join(', ')}`)
  }
  if (result.missingAlternativeSets.length) {
    console.log(`  require one complete set: ${result.missingAlternativeSets.join(' OR ')}`)
  }
  if (result.optionalMissing.length) {
    console.log(`  optional missing: ${result.optionalMissing.join(', ')}`)
  }
}

if (results.some(result => !result.ok)) {
  process.exitCode = 1
}
