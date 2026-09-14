import request from './request'

export function listAcquisitionProjects(config) { return request.get('/acquisition/projects', config) }
export function createAcquisitionProject(data, config) { return request.post('/acquisition/projects', data, config) }
export function createAcquisitionDiagnosis(projectId, data, config) { return request.post(`/acquisition/projects/${projectId}/diagnoses`, data, config) }
export function listAcquisitionDiagnoses(projectId, config) { return request.get(`/acquisition/projects/${projectId}/diagnoses`, config) }
export function createActionPlan(projectId, data, config) { return request.post(`/acquisition/projects/${projectId}/action-plans`, data, config) }
export function listActionPlans(projectId, config) { return request.get(`/acquisition/projects/${projectId}/action-plans`, config) }
export function createAcquisitionSnapshot(projectId, data, config) { return request.post(`/acquisition/projects/${projectId}/snapshots`, data, config) }
export function listAcquisitionSnapshots(projectId, config) { return request.get(`/acquisition/projects/${projectId}/snapshots`, config) }
export function createWeeklyGrowthReview(projectId, data, config) { return request.post(`/acquisition/projects/${projectId}/weekly-review`, data, config) }
export function listAdvisorOrganizations() { return request.get('/advisor/organizations') }
export function createWeeklyReview(projectId, data, config) { return request.post(`/acquisition/projects/${projectId}/weekly-review`, data, config) }
export function submitScreenshotOcr(projectId, assetId, channelCode, config) { return request.post(`/acquisition/projects/${projectId}/screenshots/ocr`, { assetId, channelCode }, config) }

export function createPrivateAsset(data, config) { return request.post('/storage/assets', data, config) }
export function uploadPrivateAsset(assetId, file, config = {}) { return request.put(`/storage/assets/${assetId}/content`, file, { ...config, headers: { ...(config.headers || {}), 'Content-Type': file.type || 'application/octet-stream' } }) }
export function deletePrivateAsset(assetId, config) { return request.delete(`/storage/assets/${assetId}`, config) }
export function getAsyncTask(taskId, config) { return request.get(`/async-tasks/${taskId}`, config) }
export function retryAsyncTask(taskId, config) { return request.post(`/async-tasks/${taskId}/retry`, {}, config) }

export function listSalesRecordings(config) { return request.get('/sales-coach/recordings', config) }
export function createSalesRecording(data, config) { return request.post('/sales-coach/recordings', data, config) }
export function getSalesRecording(recordingId, config) { return request.get(`/sales-coach/recordings/${recordingId}`, config) }
export function submitSalesTranscription(recordingId, config) { return request.post(`/sales-coach/recordings/${recordingId}/transcribe`, {}, config) }
export function deleteSalesRecording(recordingId, config) { return request.delete(`/sales-coach/recordings/${recordingId}`, config) }
export function createSalesAnalysis(recordingId, data, config) { return request.post(`/sales-coach/recordings/${recordingId}/analyse`, data, config) }
export function saveSalesTranscript(recordingId, text, config) { return request.put(`/sales-coach/recordings/${recordingId}/transcript`, { text }, config) }
export function getSalesAnalysis(analysisId, config) { return request.get(`/sales-coach/analyses/${analysisId}`, config) }
export function updateTrainingTask(taskId, status, config) { return request.patch(`/sales-coach/training-tasks/${taskId}`, { status }, config) }
export function listServicePrograms(config) { return request.get('/services/programs', config) }
export function createServiceProgram(data, config) { return request.post('/services/programs', data, config) }
export function listServiceAlerts(config) { return request.get('/services/alerts', config) }
export function getGrowthResults(config) { return request.get('/results', config) }
export function getServiceRecommendations(config) { return request.get('/services/recommendations', config) }
export function closeServiceAlert(alertId, config) { return request.patch(`/services/alerts/${alertId}/close`, {}, config) }
export function getAdvisorSummary(organizationId) { return request.get(`/advisor/organizations/${organizationId}/summary`) }
export function createAdvisorStageSummary(organizationId, data) { return request.post(`/advisor/organizations/${organizationId}/stage-summaries`, data) }
