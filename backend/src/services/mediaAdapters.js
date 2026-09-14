import path from 'node:path'

function config(kind) {
  const prefix = kind.toUpperCase()
  return {
    endpoint: String(process.env[`${prefix}_ENDPOINT`] || '').trim(),
    key: String(process.env[`${prefix}_API_KEY`] || '').trim()
  }
}

function normalize(kind, body) {
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const collection = kind === 'asr' ? body?.segments : body?.blocks
  return { text, [kind === 'asr' ? 'segments' : 'blocks']: Array.isArray(collection) ? collection : [] }
}

export async function processMedia(kind, { buffer, filename, mimeType }, fetchImpl = globalThis.fetch) {
  if (!['asr', 'ocr'].includes(kind)) throw new TypeError('不支持的媒体处理类型')
  const { endpoint, key } = config(kind)
  if (!endpoint) return { status: 'needs_review', reason: `${kind.toUpperCase()}_ENDPOINT_NOT_CONFIGURED` }
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), path.basename(filename || 'asset.bin'))
  const headers = key ? { Authorization: `Bearer ${key}` } : {}
  let response
  try { response = await fetchImpl(endpoint, { method: 'POST', headers, body: form }) } catch (cause) {
    throw Object.assign(new Error(`${kind.toUpperCase()} 服务连接失败`), { code: `${kind.toUpperCase()}_NETWORK_ERROR`, retryable: true, cause })
  }
  if (!response.ok) throw Object.assign(new Error(`${kind.toUpperCase()} 服务返回 HTTP ${response.status}`), { code: `${kind.toUpperCase()}_HTTP_ERROR`, retryable: response.status === 429 || response.status >= 500 })
  let body
  try { body = await response.json() } catch { throw Object.assign(new Error(`${kind.toUpperCase()} 服务响应不是有效 JSON`), { code: `${kind.toUpperCase()}_INVALID_RESPONSE`, retryable: false }) }
  const result = normalize(kind, body)
  if (!result.text && !result.segments?.length && !result.blocks?.length) throw Object.assign(new Error(`${kind.toUpperCase()} 服务响应缺少 text/结果分块`), { code: `${kind.toUpperCase()}_EMPTY_RESPONSE`, retryable: false })
  return { status: 'succeeded', provider: 'configured_endpoint', ...result }
}

export const transcribeAudio = (asset, fetchImpl) => processMedia('asr', asset, fetchImpl)
export const recognizeImage = (asset, fetchImpl) => processMedia('ocr', asset, fetchImpl)
