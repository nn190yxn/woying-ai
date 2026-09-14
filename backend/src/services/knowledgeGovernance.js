import { resolve, relative, sep } from 'path'

export const KNOWLEDGE_JSON_FIELDS = new Set([
  'knowledge_id', 'title', 'statement', 'industry', 'product_domain', 'channel', 'scene',
  'knowledge_type', 'source_refs', 'source_category', 'source_date', 'derived_from',
  'evidence_level', 'applicable_conditions', 'counterexamples', 'volatility',
  'last_verified', 'next_review', 'requires_verification', 'license_status', 'privacy_level',
  'status', 'supersedes', 'contradicts', 'canonical_topic', 'canonical_version',
  'skill_versions', 'organization_id', 'action_card', 'analogy_only'
])

const SENSITIVE_KEYS = /(?:token|secret|password|signature|signed_url|phone|mobile|email|user_?id|child|parent|ip(?:_address)?|name|contact)/i
const REDACTIONS = [
  [/(?:1[3-9]\d{9})/g, '[REDACTED_PHONE]'],
  [/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[REDACTED_EMAIL]'],
  [/(?:https?:\/\/\S+[?&](?:token|signature|x-amz-signature|expires)=)[^\s&]+/gi, '[REDACTED_SIGNED_URL]'],
  [/(?:bearer\s+|api[_-]?key\s*[:=]\s*|token\s*[:=]\s*)[A-Za-z0-9._~+\/-]{8,}/gi, '[REDACTED_TOKEN]'],
  [/(?<!\d)(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}(?!\d)/g, '[REDACTED_IP]']
]

export function safeRelativePath(root, candidate) {
  const base = resolve(root)
  const target = resolve(base, candidate)
  const rel = relative(base, target)
  if (rel === '..' || rel.startsWith(`..${sep}`) || resolve(target) === resolve(base, '..')) throw new Error('Path escapes knowledge root')
  return { absolute: target, relative: rel.split(sep).join('/') }
}

export function redactSensitive(value, key = '') {
  if (SENSITIVE_KEYS.test(key)) return '[REDACTED]'
  if (Array.isArray(value)) return value.map(item => redactSensitive(item))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactSensitive(v, k)]))
  if (typeof value !== 'string') return value
  return REDACTIONS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

export function whitelistKnowledgeJson(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Knowledge JSON must be an object')
  return redactSensitive(Object.fromEntries(Object.entries(input).filter(([key]) => KNOWLEDGE_JSON_FIELDS.has(key))))
}

export function validateKnowledgeObject(input) {
  const item = whitelistKnowledgeJson(input)
  const required = ['knowledge_id', 'title', 'statement', 'industry', 'product_domain', 'knowledge_type', 'source_refs', 'source_category', 'evidence_level', 'applicable_conditions', 'last_verified', 'status']
  const missing = required.filter(key => item[key] == null || item[key] === '' || (Array.isArray(item[key]) && item[key].length === 0))
  if (missing.length) throw new Error(`Missing knowledge fields: ${missing.join(', ')}`)
  if (item.volatility === 'high' && (!item.requires_verification || !item.next_review)) throw new Error('High-volatility knowledge requires verification and next_review')
  if (item.analogy_only && item.evidence_level !== 'cross_industry_analogy') throw new Error('Cross-industry material must use analogy evidence level')
  return item
}
