import crypto from 'node:crypto'
import { query } from '../models/db.js'
import { getFileStorageAdapter } from './fileStorageAdapter.js'

const storage = getFileStorageAdapter()
export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024
const MIME_EXTENSIONS = Object.freeze({
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-wav': ['.wav'],
  'video/mp4': ['.mp4'],
  'video/quicktime': ['.mov']
})
const signingSecret = process.env.FILE_SIGNING_SECRET || process.env.JWT_SECRET || 'development-file-secret'

function safeName(name) {
  return String(name || 'upload.bin').replace(/[^a-zA-Z0-9._-]/g, '_')
}

export function validateFileMetadata({ filename, mimeType, size }) {
  const originalName = String(filename || '').trim()
  const normalizedMime = String(mimeType || '').trim().toLowerCase()
  const declaredSize = Number(size)
  if (!originalName || originalName.includes('\\') || originalName.includes('/') || originalName === '.' || originalName === '..') throw Object.assign(new Error('文件名无效'), { status: 400, code: 'INVALID_FILENAME' })
  if (!Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, normalizedMime)) throw Object.assign(new Error('文件类型不在允许范围内'), { status: 415, code: 'UNSUPPORTED_FILE_TYPE' })
  if (!Number.isSafeInteger(declaredSize) || declaredSize < 0) throw Object.assign(new Error('文件大小无效'), { status: 400, code: 'INVALID_FILE_SIZE' })
  if (declaredSize > MAX_FILE_SIZE_BYTES) throw Object.assign(new Error('文件超过大小限制'), { status: 413, code: 'FILE_TOO_LARGE' })
  const extension = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase() : ''
  if (!MIME_EXTENSIONS[normalizedMime].includes(extension)) throw Object.assign(new Error('文件扩展名与类型不匹配'), { status: 400, code: 'FILE_EXTENSION_MISMATCH' })
  return { filename: originalName, mimeType: normalizedMime, size: declaredSize }
}

function sign(assetId, expiresAt, organizationId) {
  const scope = organizationId == null ? `${assetId}` : `${organizationId}:${assetId}`
  return crypto.createHmac('sha256', signingSecret).update(`${scope}:${expiresAt}`).digest('hex')
}

export async function createAsset({ organizationId, userId, filename, mimeType, size, purpose, retentionDays = purpose === 'temporary' ? 1 : 90 }) {
  const metadata = validateFileMetadata({ filename, mimeType, size })
  const storageKey = `${organizationId}/${crypto.randomUUID()}-${safeName(metadata.filename)}`
  const expiresAt = new Date(Date.now() + retentionDays * 86400000)
  const result = await query(
    `INSERT INTO file_assets (organization_id, user_id, filename, mime_type, size_bytes, storage_key, purpose, status, retention_until)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    [organizationId, String(userId), metadata.filename, metadata.mimeType, metadata.size, storageKey, purpose || 'general', expiresAt]
  )
  return { id: result.insertId, storageKey, expiresAt }
}

export async function writeAsset(assetId, buffer) {
  const rows = await query('SELECT * FROM file_assets WHERE id = ?', [assetId])
  const asset = rows[0]
  if (!asset) throw Object.assign(new Error('文件资产不存在'), { status: 404 })
  if (asset.status !== 'pending') throw Object.assign(new Error('文件当前状态不可写入'), { status: 409, code: 'ASSET_NOT_WRITABLE' })
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw Object.assign(new Error('文件内容为空'), { status: 400, code: 'EMPTY_FILE' })
  if (buffer.length > MAX_FILE_SIZE_BYTES) throw Object.assign(new Error('文件超过大小限制'), { status: 413, code: 'FILE_TOO_LARGE' })
  if (Number(asset.size_bytes) > 0 && Number(asset.size_bytes) !== buffer.length) throw Object.assign(new Error('文件声明大小与实际内容不一致'), { status: 400, code: 'FILE_SIZE_MISMATCH' })
  await storage.put(asset.storage_key, buffer)
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')
  await query(`UPDATE file_assets SET size_bytes = ?, sha256 = ?, status = 'ready' WHERE id = ?`, [buffer.length, hash, assetId])
  return { ...asset, size_bytes: buffer.length, sha256: hash, status: 'ready' }
}

export async function getAsset(assetId) {
  const rows = await query('SELECT * FROM file_assets WHERE id = ?', [assetId])
  return rows[0] || null
}

export async function getAssetForOrganization(assetId, organizationId) {
  const rows = await query('SELECT * FROM file_assets WHERE id = ? AND organization_id = ?', [assetId, organizationId])
  return rows[0] || null
}

export async function listAssetsForOrganization(organizationId, { status, limit = 50, offset = 0 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100))
  const safeOffset = Math.max(0, Number(offset) || 0)
  const allowedStatuses = new Set(['pending', 'ready', 'deleted', 'expired'])
  const normalizedStatus = status ? String(status) : null
  if (normalizedStatus && !allowedStatuses.has(normalizedStatus)) throw Object.assign(new Error('文件状态无效'), { status: 400, code: 'INVALID_ASSET_STATUS' })
  const conditions = ['organization_id = ?']
  const params = [organizationId]
  if (normalizedStatus) { conditions.push('status = ?'); params.push(normalizedStatus) }
  params.push(safeLimit, safeOffset)
  return query(`SELECT id, organization_id, user_id, filename, mime_type, size_bytes, sha256, purpose, status, retention_until, deleted_at, created_at FROM file_assets WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`, params)
}

// Internal media processors must always supply the task organization. Never expose
// the storage path or buffer to logs/callers outside the processing boundary.
export async function readAssetForOrganization(assetId, organizationId) {
  const asset = await getAssetForOrganization(assetId, organizationId)
  if (!asset || asset.status !== 'ready') throw Object.assign(new Error('文件不存在、未就绪或无权访问'), { status: 404, code: 'ASSET_NOT_AVAILABLE', retryable: false })
  return { asset, buffer: await storage.get(asset.storage_key) }
}

export function createSignedUrl(assetId, ttlSeconds = 300, organizationId) {
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(30, Math.min(Number(ttlSeconds) || 300, 3600))
  return { expiresAt, organizationId, signature: sign(assetId, expiresAt, organizationId) }
}

export async function readSignedAsset(assetId, expiresAt, signature, organizationId) {
  const asset = await getAsset(assetId)
  const scopedOrganizationId = organizationId == null ? asset?.organization_id : organizationId
  const signatureOrganizationId = organizationId == null ? undefined : organizationId
  if (Number(expiresAt) < Math.floor(Date.now() / 1000) || !asset || sign(assetId, expiresAt, signatureOrganizationId) !== signature) {
    throw Object.assign(new Error('文件签名无效或已过期'), { status: 403 })
  }
  if (Number(asset.organization_id) !== Number(scopedOrganizationId) || asset.status !== 'ready' || (asset.retention_until && new Date(asset.retention_until).getTime() <= Date.now())) throw Object.assign(new Error('文件不存在、未就绪或已过期'), { status: 404 })
  try {
    return { asset, buffer: await storage.get(asset.storage_key) }
  } catch (error) {
    if (error.code === 'ENOENT') throw Object.assign(new Error('文件实体不存在'), { status: 404, code: 'ASSET_FILE_MISSING' })
    throw error
  }
}

export async function deleteAsset(assetId) {
  const asset = await getAsset(assetId)
  if (!asset || asset.status === 'deleted') return false
  await storage.remove(asset.storage_key)
  await query(`UPDATE file_assets SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [assetId])
  return true
}

export async function cleanupExpiredAssets(now = new Date(), organizationId = null) {
  const scope = organizationId == null ? '' : ' AND organization_id = ?'
  const params = organizationId == null ? [now] : [now, organizationId]
  const assets = await query(`SELECT * FROM file_assets WHERE retention_until <= ? AND status IN ('pending', 'ready')${scope}`, params)
  let cleaned = 0
  for (const asset of assets) {
    await storage.remove(asset.storage_key)
    await query(`UPDATE file_assets SET status = 'expired', deleted_at = CURRENT_TIMESTAMP WHERE id = ?`, [asset.id])
    cleaned += 1
  }
  return { scanned: assets.length, cleaned }
}
