import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { createAnalysis, createRecording, createTranscriptionJob, deleteRecording, getAnalysis, getRecording, getScoreTrend, listRecordings, saveManualTranscript, updateTrainingTask } from '../services/salesCoach/index.js'
import { getRequestActorId, requireOrganization } from '../services/organization.js'
import { submitRecordingTranscription } from '../services/mediaTasks.js'

const router = express.Router()
router.use(authMiddleware, requireOrganization)

router.get('/recordings', async (req, res, next) => {
  try { res.json({ recordings: await listRecordings(req.organizationId) }) } catch (error) { next(error) }
})
router.post('/recordings', async (req, res, next) => {
  try {
    const recording = await createRecording({ organizationId: req.organizationId, userId: getRequestActorId(req), sellerLabel: req.body?.sellerLabel, scene: req.body?.scene, consentConfirmed: req.body?.consentConfirmed, assetId: req.body?.assetId })
    const transcription = await createTranscriptionJob(recording.id)
    const completedTranscription = req.body?.manualTranscript ? await saveManualTranscript({ recordingId: recording.id, organizationId: req.organizationId, text: req.body.manualTranscript }) : transcription
    res.status(201).json({ recording, transcription: completedTranscription })
  } catch (error) { next(error) }
})
router.get('/recordings/:recordingId', async (req, res, next) => {
  try { const recording = await getRecording(req.params.recordingId, req.organizationId); if (!recording || recording.status === 'deleted') return res.status(404).json({ message: '录音不存在' }); res.json({ recording }) } catch (error) { next(error) }
})
router.delete('/recordings/:recordingId', async (req, res, next) => {
  try { const deleted = await deleteRecording(req.params.recordingId, req.organizationId); if (!deleted) return res.status(404).json({ message: '录音不存在' }); res.json({ deleted }) } catch (error) { next(error) }
})
router.post('/recordings/:recordingId/transcribe', async (req, res, next) => {
  try {
    const submitted = await submitRecordingTranscription({ recordingId: req.params.recordingId, organizationId: req.organizationId, userId: getRequestActorId(req) })
    if (!submitted) return res.status(404).json({ message: '录音不存在' })
    res.status(202).json(submitted)
  } catch (error) { next(error) }
})
router.put('/recordings/:recordingId/transcript', async (req, res, next) => {
  try { const transcription = await saveManualTranscript({ recordingId: req.params.recordingId, organizationId: req.organizationId, text: req.body?.text }); if (!transcription) return res.status(404).json({ message: '录音不存在' }); res.json({ transcription }) } catch (error) { next(error) }
})
router.post('/recordings/:recordingId/analyse', async (req, res, next) => {
  try {
    const analysis = await createAnalysis({ recordingId: req.params.recordingId, organizationId: req.organizationId, scene: req.body?.scene, confirmedScene: req.body?.confirmedScene, transcript: req.body?.transcript })
    if (!analysis) return res.status(404).json({ message: '录音不存在' })
    res.status(201).json({ analysis })
  } catch (error) { next(error) }
})
router.get('/analyses/:analysisId', async (req, res, next) => {
  try { const analysis = await getAnalysis(req.params.analysisId, req.organizationId); if (!analysis) return res.status(404).json({ message: '分析不存在' }); res.json({ analysis }) } catch (error) { next(error) }
})
router.patch('/training-tasks/:taskId', async (req, res, next) => {
  try { const task = await updateTrainingTask({ taskId: req.params.taskId, organizationId: req.organizationId, status: req.body?.status }); if (!task) return res.status(404).json({ message: '训练任务不存在' }); res.json({ task }) } catch (error) { next(error) }
})
router.get('/score-trends', async (req, res, next) => {
  try { const snapshots = await getScoreTrend({ organizationId: req.organizationId, sellerLabel: req.query.sellerLabel, scene: req.query.scene, skillVersion: req.query.skillVersion }); res.json({ sellerLabel: req.query.sellerLabel, scene: req.query.scene, skillVersion: req.query.skillVersion, snapshots }) } catch (error) { next(error) }
})

export default router
