import { query } from '../../models/db.js'
import { deleteAsset, getAssetForOrganization } from '../privateStorage.js'

export const SKILL_VERSION = 'sales-coach-core@2.0.0'
const validScenes = new Set(['new_sale', 'renewal'])
const validTaskStatuses = new Set(['pending', 'in_progress', 'completed', 'cancelled'])

function badRequest(message) { return Object.assign(new Error(message), { status: 400 }) }
function parseJson(value, fallback = null) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try { return JSON.parse(value) } catch { return fallback }
}
function transcriptText(transcript) {
  if (typeof transcript === 'string') return transcript.trim()
  if (transcript && typeof transcript.text === 'string') return transcript.text.trim()
  return ''
}

export function recognizeScene(transcript) {
  const text = transcriptText(transcript)
  const renewal = ['续费', '续课', '剩余课时', '课包到期', '升班', '下一阶段']
  const newSale = ['体验课', '试听', '首次', '报名', '新生', '第一次来']
  const hits = list => list.filter(word => text.includes(word))
  const renewalHits = hits(renewal); const newHits = hits(newSale)
  const scene = renewalHits.length > newHits.length ? 'renewal' : 'new_sale'
  const difference = Math.abs(renewalHits.length - newHits.length)
  const confidence = text ? Math.min(0.98, 0.45 + difference * 0.18) : 0
  return { scene, confidence, needsConfirmation: confidence < 0.7, evidence: [...renewalHits, ...newHits] }
}

export async function createRecording({ organizationId, userId, sellerLabel, scene, consentConfirmed, assetId }) {
  if (scene && !validScenes.has(scene)) throw badRequest('销售场景必须是 new_sale 或 renewal')
  if (!consentConfirmed) throw badRequest('未确认录音授权')
  if (assetId) {
    const asset = await getAssetForOrganization(assetId, organizationId)
    if (!asset || asset.status !== 'ready' || !String(asset.mime_type).startsWith('audio/')) throw badRequest('私有音频资产不存在、未就绪或类型无效')
  }
  const result = await query('INSERT INTO sales_recordings (organization_id, user_id, seller_label, scene, consent_confirmed, asset_id) VALUES (?, ?, ?, ?, 1, ?)', [organizationId, String(userId), sellerLabel || '匿名销售对象', scene || null, assetId || null])
  return (await query('SELECT * FROM sales_recordings WHERE id = ? AND organization_id = ?', [result.insertId, organizationId]))[0]
}
export async function getRecording(recordingId, organizationId) { return (await query('SELECT * FROM sales_recordings WHERE id = ? AND organization_id = ?', [recordingId, organizationId]))[0] || null }
export async function listRecordings(organizationId) { return query("SELECT * FROM sales_recordings WHERE organization_id = ? AND status <> 'deleted' ORDER BY created_at DESC", [organizationId]) }
export async function deleteRecording(recordingId, organizationId) {
  const recording = await getRecording(recordingId, organizationId)
  if (!recording) return null
  if (recording.asset_id) await deleteAsset(recording.asset_id)
  await query('UPDATE sales_recordings SET status = ?, asset_id = NULL WHERE id = ? AND organization_id = ?', ['deleted', recordingId, organizationId])
  return { id: Number(recordingId), deleted: true, originalAudioDeleted: true }
}
export async function createTranscriptionJob(recordingId) {
  const result = await query("INSERT INTO transcription_jobs (recording_id, status) VALUES (?, 'queued')", [recordingId])
  return (await query('SELECT * FROM transcription_jobs WHERE id = ?', [result.insertId]))[0]
}
export async function saveManualTranscript({ recordingId, organizationId, text }) {
  const recording = await getRecording(recordingId, organizationId)
  if (!recording) return null
  const clean = transcriptText(text)
  if (!clean) throw badRequest('手工转写文本不能为空')
  const payload = { text: clean, source: 'manual', segments: [] }
  const existing = await query('SELECT * FROM transcription_jobs WHERE recording_id = ? ORDER BY created_at DESC LIMIT 1', [recordingId])
  if (existing[0]) {
    await query("UPDATE transcription_jobs SET status = 'completed', transcript = ?, provider = 'manual', error_message = NULL WHERE id = ?", [JSON.stringify(payload), existing[0].id])
    return { ...existing[0], status: 'completed', transcript: payload, provider: 'manual' }
  }
  const result = await query("INSERT INTO transcription_jobs (recording_id, status, transcript, provider) VALUES (?, 'completed', ?, 'manual')", [recordingId, JSON.stringify(payload)])
  return { id: result.insertId, recording_id: recordingId, status: 'completed', transcript: payload, provider: 'manual' }
}
async function latestTranscript(recordingId) {
  const rows = await query("SELECT * FROM transcription_jobs WHERE recording_id = ? AND status = 'completed' ORDER BY created_at DESC LIMIT 1", [recordingId])
  return parseJson(rows[0]?.transcript, rows[0]?.transcript)
}

const rubrics = {
  new_sale: [
    ['needs_discovery', '需求探询', 25, ['目标', '需求', '希望', '为什么']], ['child_assessment', '孩子情况诊断', 20, ['年龄', '基础', '兴趣', '性格']],
    ['value_link', '价值匹配', 25, ['适合', '帮助', '改善', '提升']], ['objection_handling', '异议处理', 15, ['担心', '顾虑', '价格', '考虑']], ['close_next_step', '成交推进', 15, ['报名', '定金', '下一步', '安排']]
  ],
  renewal: [
    ['progress_review', '成长复盘', 30, ['进步', '成长', '变化', '阶段']], ['evidence_feedback', '成果证据', 20, ['数据', '测评', '视频', '老师反馈']],
    ['next_goal', '下阶段目标', 25, ['下一阶段', '目标', '计划', '继续']], ['renewal_risk', '续费顾虑处理', 15, ['顾虑', '时间', '价格', '续费']], ['renewal_close', '续费推进', 10, ['续费', '续课', '课包', '确认']]
  ]
}
function scoreTranscript(text, scene) {
  const dimensions = []; const evidence = []; const risks = []
  let total = 0
  for (const [key, label, weight, words] of rubrics[scene]) {
    const matched = words.find(word => text.includes(word))
    const points = matched ? weight : 0; total += points
    const item = matched
      ? { dimension: key, label, weight, score: points, reason: `文本命中“${matched}”`, evidence: matched }
      : { dimension: key, label, weight, score: 0, reason: '未在转写文本中定位到对应表达', evidence: null, evidenceUnavailable: true }
    dimensions.push(item)
    if (matched) evidence.push({ dimension: key, quote: matched, severity: 'positive', startSeconds: null, endSeconds: null })
    else {
      const risk = { dimension: key, severity: 'medium', reason: `${label}缺失`, evidence: null, evidenceUnavailable: true, locatorNote: '手工文本无时间轴，且未定位到对应表达' }
      risks.push(risk); evidence.push({ dimension: key, quote: '无法定位：转写文本中未出现对应表达；手工文本无时间轴', severity: 'medium', startSeconds: null, endSeconds: null })
    }
  }
  return { score: total, dimensions, evidence, risks }
}

export async function createAnalysis({ recordingId, organizationId, scene, confirmedScene, transcript = null }) {
  const recording = await getRecording(recordingId, organizationId)
  if (!recording) return null
  const source = transcript ?? await latestTranscript(recordingId)
  const text = transcriptText(source)
  const recognition = recognizeScene(text)
  const requestedScene = confirmedScene || scene || recording.scene || recognition.scene
  if (!validScenes.has(requestedScene)) throw badRequest('无法确定销售场景')
  const needsSceneConfirmation = !confirmedScene && !recording.scene && recognition.needsConfirmation
  const scoring = text ? scoreTranscript(text, requestedScene) : { score: null, dimensions: [], evidence: [], risks: [{ dimension: 'transcript', severity: 'high', reason: '无可用转写，无法评分', evidence: null, evidenceUnavailable: true, locatorNote: '尚无成功转写' }] }
  const status = (!text || needsSceneConfirmation) ? 'needs_review' : 'completed'
  const level = scoring.score == null ? '需要复核' : scoring.score >= 80 ? '优秀' : scoring.score >= 60 ? '合格' : '待提升'
  const report = { score: scoring.score, level, conclusion: !text ? '暂无转写，需人工补充。' : needsSceneConfirmation ? '场景识别置信度低，需人工确认后重跑评分。' : `按${requestedScene === 'renewal' ? '续费' : '新签'}确定性规则评分。`, sceneRecognition: recognition, dimensions: scoring.dimensions, risks: scoring.risks, evidence: scoring.evidence, replacementScripts: scoring.risks.map(r => ({ dimension: r.dimension, script: `建议补充${r.reason.replace('缺失', '')}的明确话术。` })), transcriptSource: parseJson(source, source)?.source || (transcript ? 'request' : 'stored'), trainingTasks: [] }
  const result = await query('INSERT INTO sales_analyses (recording_id, scene, status, score, level, skill_version, report) VALUES (?, ?, ?, ?, ?, ?, ?)', [recordingId, requestedScene, status, scoring.score, level, SKILL_VERSION, JSON.stringify(report)])
  const analysisId = result.insertId
  for (const item of scoring.evidence) await query('INSERT INTO sales_evidence (analysis_id, dimension, quote, start_seconds, end_seconds, severity) VALUES (?, ?, ?, ?, ?, ?)', [analysisId, item.dimension, item.quote, item.startSeconds, item.endSeconds, item.severity])
  for (const risk of scoring.risks) await query('INSERT INTO training_tasks (organization_id, analysis_id, title, content, status) VALUES (?, ?, ?, ?, ?)', [organizationId, analysisId, `改进：${risk.reason}`, JSON.stringify({ dimension: risk.dimension, evidence: risk.evidence, evidenceUnavailable: risk.evidenceUnavailable, locatorNote: risk.locatorNote }), 'pending'])
  if (scoring.score != null) await query('INSERT INTO sales_score_snapshots (organization_id, seller_label, scene, score, skill_version, analysis_id) VALUES (?, ?, ?, ?, ?, ?)', [organizationId, recording.seller_label, requestedScene, scoring.score, SKILL_VERSION, analysisId])
  return getAnalysis(analysisId, organizationId)
}
export async function getAnalysis(analysisId, organizationId) {
  const rows = await query('SELECT a.* FROM sales_analyses a INNER JOIN sales_recordings r ON r.id = a.recording_id WHERE a.id = ? AND r.organization_id = ?', [analysisId, organizationId])
  if (!rows[0]) return null
  const [evidence, tasks] = await Promise.all([query('SELECT * FROM sales_evidence WHERE analysis_id = ? ORDER BY id', [analysisId]), query('SELECT * FROM training_tasks WHERE analysis_id = ? AND organization_id = ? ORDER BY id', [analysisId, organizationId])])
  return { ...rows[0], report: parseJson(rows[0].report, {}), evidence, trainingTasks: tasks.map(t => ({ ...t, content: parseJson(t.content, {}) })) }
}
export async function updateTrainingTask({ taskId, organizationId, status }) {
  if (!validTaskStatuses.has(status)) throw badRequest('无效的训练任务状态')
  const result = await query('UPDATE training_tasks SET status = ? WHERE id = ? AND organization_id = ?', [status, taskId, organizationId])
  if (!result.affectedRows) return null
  return (await query('SELECT * FROM training_tasks WHERE id = ? AND organization_id = ?', [taskId, organizationId]))[0]
}
export async function getScoreTrend({ organizationId, sellerLabel, scene, skillVersion = SKILL_VERSION }) {
  if (!sellerLabel || !validScenes.has(scene) || !skillVersion) throw badRequest('sellerLabel、scene、skillVersion 均为必填且 scene 必须有效')
  return query('SELECT id, analysis_id, score, created_at FROM sales_score_snapshots WHERE organization_id = ? AND seller_label = ? AND scene = ? AND skill_version = ? ORDER BY created_at ASC', [organizationId, sellerLabel, scene, skillVersion])
}
