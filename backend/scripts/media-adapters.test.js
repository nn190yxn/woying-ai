import test from 'node:test'
import assert from 'node:assert/strict'
import { processMedia } from '../src/services/mediaAdapters.js'

test('无 endpoint 时明确降级 needs_review，且不调用网络', async () => {
  const previous = process.env.ASR_ENDPOINT
  delete process.env.ASR_ENDPOINT
  let called = false
  const result = await processMedia('asr', { buffer: Buffer.from('audio'), filename: 'a.wav', mimeType: 'audio/wav' }, async () => { called = true })
  assert.deepEqual(result, { status: 'needs_review', reason: 'ASR_ENDPOINT_NOT_CONFIGURED' })
  assert.equal(called, false)
  if (previous === undefined) delete process.env.ASR_ENDPOINT; else process.env.ASR_ENDPOINT = previous
})

test('适配器使用 file multipart 与可选 Bearer，并接受标准响应', async () => {
  const oldEndpoint = process.env.OCR_ENDPOINT; const oldKey = process.env.OCR_API_KEY
  process.env.OCR_ENDPOINT = 'https://provider.example/ocr'; process.env.OCR_API_KEY = 'secret'
  const result = await processMedia('ocr', { buffer: Buffer.from('image'), filename: '../shot.png', mimeType: 'image/png' }, async (url, options) => {
    assert.equal(url, 'https://provider.example/ocr')
    assert.equal(options.headers.Authorization, 'Bearer secret')
    assert.ok(options.body.get('file') instanceof Blob)
    return new Response(JSON.stringify({ text: '识别内容', blocks: [{ text: '识别内容' }] }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
  assert.equal(result.status, 'succeeded'); assert.equal(result.blocks.length, 1)
  if (oldEndpoint === undefined) delete process.env.OCR_ENDPOINT; else process.env.OCR_ENDPOINT = oldEndpoint
  if (oldKey === undefined) delete process.env.OCR_API_KEY; else process.env.OCR_API_KEY = oldKey
})
