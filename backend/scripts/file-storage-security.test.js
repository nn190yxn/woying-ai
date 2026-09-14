import test from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import { mockDb } from '../src/models/mockDb.js'
import { createAsset, createSignedUrl, getAsset, readSignedAsset, writeAsset } from '../src/services/privateStorage.js'
import { getFileStorageAdapter } from '../src/services/fileStorageAdapter.js'

function resetAssets() {
  mockDb.file_assets.length = 0
  mockDb._idCounters.file_assets = 0
}

test('文件安全验收：哈希、跨机构签名和过期资产均拒绝', async () => {
  resetAssets()
  const asset = await createAsset({ organizationId: 31, userId: 'security-owner', filename: 'secure.txt', mimeType: 'text/plain', size: 6 })
  await writeAsset(asset.id, Buffer.from('secret'))
  const stored = await getAsset(asset.id)
  assert.equal(stored.sha256, crypto.createHash('sha256').update('secret').digest('hex'))
})

test('文件安全验收：跨机构签名、过期和物理文件缺失均不可读取', async () => {
  resetAssets()
  const asset = await createAsset({ organizationId: 32, userId: 'security-owner-2', filename: 'secure.txt', mimeType: 'text/plain', size: 6 })
  await writeAsset(asset.id, Buffer.from('secret'))
  const scoped = createSignedUrl(asset.id, 300, 32)
  await assert.rejects(() => readSignedAsset(asset.id, scoped.expiresAt, scoped.signature, 33), { status: 403 })
  const row = mockDb.file_assets[0]
  row.retention_until = new Date(Date.now() - 1000)
  await assert.rejects(() => readSignedAsset(asset.id, scoped.expiresAt, scoped.signature, 32), { status: 404 })
  row.retention_until = new Date(Date.now() + 86400000)
  await getFileStorageAdapter().remove(row.storage_key)
  await assert.rejects(() => readSignedAsset(asset.id, scoped.expiresAt, scoped.signature, 32), { code: 'ASSET_FILE_MISSING' })
})

test('上传校验失败保留 pending 资产，避免产生未登记文件', async () => {
  resetAssets()
  const asset = await createAsset({ organizationId: 34, userId: 'security-owner-3', filename: 'pending.txt', mimeType: 'text/plain', size: 6 })
  await assert.rejects(() => writeAsset(asset.id, Buffer.from('short')), { code: 'FILE_SIZE_MISMATCH' })
  assert.equal((await getAsset(asset.id)).status, 'pending')
})
