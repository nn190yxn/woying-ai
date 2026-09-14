import test from 'node:test'
import assert from 'node:assert/strict'
import { getFileStorageAdapter } from '../src/services/fileStorageAdapter.js'
import { cleanupExpiredAssets, createAsset, deleteAsset, listAssetsForOrganization, validateFileMetadata, writeAsset } from '../src/services/privateStorage.js'
import { mockDb } from '../src/models/mockDb.js'

test('本地文件适配器拒绝绝对路径和目录穿越', () => {
  const storage = getFileStorageAdapter()
  assert.throws(() => storage.resolve('../outside.bin'), { code: 'INVALID_STORAGE_KEY' })
  assert.throws(() => storage.resolve('a/../../outside.bin'), { code: 'INVALID_STORAGE_KEY' })
  assert.throws(() => storage.resolve('C:\\outside.bin'), { code: 'INVALID_STORAGE_KEY' })
  assert.ok(storage.resolve('12/asset.bin').endsWith('12\\asset.bin') || storage.resolve('12/asset.bin').endsWith('12/asset.bin'))
})

test('文件元数据校验 MIME、扩展名和大小', () => {
  assert.deepEqual(validateFileMetadata({ filename: 'proof.txt', mimeType: 'text/plain', size: 4 }), { filename: 'proof.txt', mimeType: 'text/plain', size: 4 })
  assert.throws(() => validateFileMetadata({ filename: 'proof.exe', mimeType: 'text/plain', size: 4 }), { code: 'FILE_EXTENSION_MISMATCH' })
  assert.throws(() => validateFileMetadata({ filename: 'proof.txt', mimeType: 'application/x-msdownload', size: 4 }), { code: 'UNSUPPORTED_FILE_TYPE' })
  assert.throws(() => validateFileMetadata({ filename: '../proof.txt', mimeType: 'text/plain', size: 4 }), { code: 'INVALID_FILENAME' })
  assert.throws(() => validateFileMetadata({ filename: 'proof.txt', mimeType: 'text/plain', size: 100 * 1024 * 1024 + 1 }), { code: 'FILE_TOO_LARGE' })
})

test('文件资产支持待上传、就绪、删除和过期清理状态', async () => {
  mockDb.file_assets.length = 0
  mockDb._idCounters.file_assets = 0
  const pending = await createAsset({ organizationId: 1, userId: 'file-owner', filename: 'pending.txt', mimeType: 'text/plain', size: 4, retentionDays: -1 })
  const ready = await createAsset({ organizationId: 1, userId: 'file-owner', filename: 'ready.txt', mimeType: 'text/plain', size: 4, retentionDays: -1 })
  await writeAsset(ready.id, Buffer.from('data'))
  const result = await cleanupExpiredAssets(new Date())
  assert.equal(result.cleaned, 2)
  assert.equal(mockDb.file_assets.every(asset => asset.status === 'expired'), true)
  assert.equal(await deleteAsset(pending.id), true)
  assert.equal(await deleteAsset(pending.id), false)
})

test('资产列表按机构和状态过滤，不接受非法状态', async () => {
  mockDb.file_assets.length = 0
  mockDb._idCounters.file_assets = 0
  await createAsset({ organizationId: 10, userId: 'list-owner', filename: 'a.txt', mimeType: 'text/plain', size: 1 })
  await createAsset({ organizationId: 11, userId: 'other-owner', filename: 'b.txt', mimeType: 'text/plain', size: 1 })
  assert.equal((await listAssetsForOrganization(10)).length, 1)
  assert.equal((await listAssetsForOrganization(10, { status: 'ready' })).length, 0)
  await assert.rejects(() => listAssetsForOrganization(10, { status: 'unknown' }), { code: 'INVALID_ASSET_STATUS' })
})
