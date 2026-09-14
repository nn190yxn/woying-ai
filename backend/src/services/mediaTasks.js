import crypto from 'node:crypto'
import { query } from '../models/db.js'
import { enqueueTask, registerTaskHandler } from './asyncTasks.js'
import { readAssetForOrganization, getAssetForOrganization } from './privateStorage.js'
import { recognizeImage, transcribeAudio } from './mediaAdapters.js'
import { getProject } from './acquisition/index.js'
import { getRecording } from './salesCoach/index.js'

function mediaInput(asset, buffer) { return { buffer, filename: asset.filename, mimeType: asset.mime_type } }

registerTaskHandler('sales.asr', async ({ recordingId, assetId, transcriptionJobId }, task) => {
  const recording = await getRecording(recordingId, task.organization_id)
  if (!recording || Number(recording.asset_id) !== Number(assetId)) throw Object.assign(new Error('录音资产不属于当前机构'), { code: 'ASSET_OWNERSHIP_MISMATCH', retryable: false })
  const { asset, buffer } = await readAssetForOrganization(assetId, task.organization_id)
  const result = await transcribeAudio(mediaInput(asset, buffer))
  if (result.status === 'needs_review') {
    await query("UPDATE transcription_jobs SET status = 'needs_review', error_message = ? WHERE id = ?", [result.reason, transcriptionJobId])
    return result
  }
  const transcript = { text: result.text, segments: result.segments, source: 'asr' }
  await query("UPDATE transcription_jobs SET status = 'completed', transcript = ?, provider = ?, error_message = NULL WHERE id = ?", [JSON.stringify(transcript), result.provider, transcriptionJobId])
  return { status: 'succeeded', transcriptionJobId, segmentCount: result.segments.length, hasText: Boolean(result.text) }
})

registerTaskHandler('acquisition.ocr', async ({ projectId, assetId, channelCode }, task) => {
  const project = await getProject(projectId, task.organization_id)
  if (!project) throw Object.assign(new Error('获客项目不属于当前机构'), { code: 'PROJECT_OWNERSHIP_MISMATCH', retryable: false })
  const { asset, buffer } = await readAssetForOrganization(assetId, task.organization_id)
  const result = await recognizeImage(mediaInput(asset, buffer))
  const input = { source: 'private_image', assetId: Number(assetId), ocr: result.status === 'succeeded' ? { text: result.text, blocks: result.blocks } : null }
  const output = result.status === 'succeeded'
    ? { userInput: { assetId: Number(assetId), channelCode: channelCode || null }, systemCalculated: { ocrBlockCount: result.blocks?.length || 0 }, aiJudgment: { conclusion: '截图已解析，可作为项目诊断输入', source: 'ocr' }, evidence: (result.blocks || []).slice(0, 20), actions: ['核对OCR文字和指标后发起项目诊断'], humanConfirmationItems: ['确认截图所属账号、统计周期和OCR结果'] }
    : { userInput: { assetId: Number(assetId), channelCode: channelCode || null }, systemCalculated: {}, aiJudgment: { conclusion: 'OCR未配置，请人工录入截图信息', source: 'needs_review' }, evidence: [], actions: ['人工录入截图中的汇总指标'], humanConfirmationItems: ['确认人工录入值'], reason: result.reason }
  const inserted = await query('INSERT INTO acquisition_diagnoses (project_id, channel_code, input_data, output_data, status, skill_version, source_type, source_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [projectId, channelCode || null, JSON.stringify(input), JSON.stringify(output), result.status === 'succeeded' ? 'needs_review' : 'needs_review', 'acquisition-ocr@1.0.0', 'private_asset', String(assetId)])
  return { status: result.status, diagnosisId: inserted.insertId, blockCount: result.blocks?.length || 0, reason: result.reason }
})

export async function submitRecordingTranscription({ recordingId, organizationId, userId }) {
  const recording = await getRecording(recordingId, organizationId)
  if (!recording) return null
  if (!recording.asset_id) throw Object.assign(new Error('录音未关联私有音频资产'), { status: 400 })
  const asset = await getAssetForOrganization(recording.asset_id, organizationId)
  if (!asset || !String(asset.mime_type).startsWith('audio/')) throw Object.assign(new Error('私有音频资产不存在、未就绪或类型无效'), { status: 400 })
  const jobResult = await query("INSERT INTO transcription_jobs (recording_id, status) VALUES (?, 'queued')", [recordingId])
  const nonce = crypto.randomUUID()
  const task = await enqueueTask({ organizationId, userId, type: 'sales.asr', payload: { recordingId: Number(recordingId), assetId: Number(recording.asset_id), transcriptionJobId: jobResult.insertId }, idempotencyKey: `sales-asr:${recordingId}:${nonce}`, resourceType: 'sales_recording', resourceId: String(recordingId) })
  return { task, transcriptionJobId: jobResult.insertId }
}

export async function submitAcquisitionOcr({ projectId, assetId, channelCode, organizationId, userId }) {
  if (!await getProject(projectId, organizationId)) return null
  const asset = await getAssetForOrganization(assetId, organizationId)
  if (!asset || asset.status !== 'ready' || !String(asset.mime_type).startsWith('image/')) throw Object.assign(new Error('私有图片资产不存在、未就绪或类型无效'), { status: 400 })
  await query('INSERT INTO acquisition_assets (project_id, asset_id, asset_type, metadata) VALUES (?, ?, ?, ?)', [projectId, assetId, 'diagnosis_screenshot', JSON.stringify({ channelCode: channelCode || null })])
  return enqueueTask({ organizationId, userId, type: 'acquisition.ocr', payload: { projectId: Number(projectId), assetId: Number(assetId), channelCode: channelCode || null }, idempotencyKey: `acquisition-ocr:${projectId}:${assetId}`, resourceType: 'acquisition_project', resourceId: String(projectId) })
}
