import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createAsset, createSignedUrl, deleteAsset, getAssetForOrganization, listAssetsForOrganization, readSignedAsset, writeAsset } from '../services/privateStorage.js'
import { getRequestActorId, requireOrganizationPermission } from '../services/organization.js'

const router = express.Router()
router.use(authMiddleware)

router.get('/assets', requireOrganizationPermission('files:manage'), async (req, res, next) => {
  try {
    const assets = await listAssetsForOrganization(req.organizationId, { status: req.query.status, limit: req.query.limit, offset: req.query.offset })
    res.json({ assets })
  } catch (error) { next(error) }
})

router.post('/assets', requireOrganizationPermission('files:manage'), async (req, res, next) => {
  try {
    const filename = String(req.body?.filename || '').trim()
    const mimeType = String(req.body?.mimeType || 'application/octet-stream')
    const size = Number(req.body?.size || 0)
    if (!filename || size < 0) return res.status(400).json({ message: '文件元数据无效' })
    const asset = await createAsset({ organizationId: req.organizationId, userId: getRequestActorId(req), filename, mimeType, size, purpose: req.body?.purpose })
    res.status(201).json({ asset, uploadUrl: `/api/storage/assets/${asset.id}/content` })
  } catch (error) { next(error) }
})

router.put('/assets/:assetId/content', requireOrganizationPermission('files:manage'), express.raw({ type: '*/*', limit: '100mb' }), async (req, res, next) => {
  try {
    const owned = await getAssetForOrganization(req.params.assetId, req.organizationId)
    if (!owned) return res.status(404).json({ message: '文件不存在' })
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ message: '上传内容为空' })
    const asset = await writeAsset(req.params.assetId, req.body)
    res.json({ asset })
  } catch (error) { next(error) }
})

router.get('/assets/:assetId', requireOrganizationPermission('files:manage'), async (req, res, next) => {
  try {
    const asset = await getAssetForOrganization(req.params.assetId, req.organizationId)
    if (!asset) return res.status(404).json({ message: '文件不存在' })
    res.json({ asset })
  } catch (error) { next(error) }
})

router.get('/assets/:assetId/signature', requireOrganizationPermission('files:manage'), async (req, res, next) => {
  try {
    const asset = await getAssetForOrganization(req.params.assetId, req.organizationId)
    if (!asset) return res.status(404).json({ message: '文件不存在' })
    const signed = createSignedUrl(asset.id, req.query.ttl, req.organizationId)
    res.json({ ...signed, url: `/api/storage/assets/${asset.id}/content?organizationId=${req.organizationId}&expiresAt=${signed.expiresAt}&signature=${signed.signature}` })
  } catch (error) { next(error) }
})

router.get('/assets/:assetId/content', async (req, res, next) => {
  try {
    const { asset, buffer } = await readSignedAsset(req.params.assetId, req.query.expiresAt, req.query.signature, req.query.organizationId)
    res.type(asset.mime_type).send(buffer)
  } catch (error) { next(error) }
})

router.delete('/assets/:assetId', requireOrganizationPermission('files:manage'), async (req, res, next) => {
  try {
    const asset = await getAssetForOrganization(req.params.assetId, req.organizationId)
    if (!asset) return res.status(404).json({ message: '文件不存在' })
    const deleted = await deleteAsset(req.params.assetId)
    res.json({ deleted })
  } catch (error) { next(error) }
})

export default router
