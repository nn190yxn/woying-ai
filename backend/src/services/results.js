import { query } from '../models/db.js'

export async function getMyResults(organizationId) {
  const projects = await query('SELECT id, name, goal, status, created_at, updated_at FROM acquisition_projects WHERE organization_id = ? ORDER BY updated_at DESC', [organizationId])
  const diagnoses = await query('SELECT d.id, d.project_id, d.channel_code, d.output_data, d.status, d.skill_version, d.created_at FROM acquisition_diagnoses d JOIN acquisition_projects p ON p.id = d.project_id WHERE p.organization_id = ? ORDER BY d.created_at DESC', [organizationId])
  const plans = await query('SELECT a.id, a.project_id, a.diagnosis_id, a.title, a.plan_data, a.template_code, a.status, a.created_at FROM acquisition_action_plans a JOIN acquisition_projects p ON p.id = a.project_id WHERE p.organization_id = ? ORDER BY a.created_at DESC', [organizationId])
  const acquisitionSnapshots = await query('SELECT s.id, s.project_id, s.snapshot_date, s.metrics, s.summary, s.created_at FROM acquisition_snapshots s JOIN acquisition_projects p ON p.id = s.project_id WHERE p.organization_id = ? ORDER BY s.snapshot_date DESC', [organizationId])

  // Deliberately omit recording assets, transcription jobs/transcripts, and evidence quotes.
  const salesAnalyses = await query('SELECT a.id, a.recording_id, a.scene, a.status, a.score, a.level, a.skill_version, a.report, a.created_at FROM sales_analyses a JOIN sales_recordings r ON r.id = a.recording_id WHERE r.organization_id = ? ORDER BY a.created_at DESC', [organizationId])
  const trainingTasks = await query('SELECT id, analysis_id, title, content, status, due_date, created_at, updated_at FROM training_tasks WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])
  const salesTrends = await query('SELECT id, seller_label, scene, score, skill_version, analysis_id, created_at FROM sales_score_snapshots WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])

  const servicePrograms = await query('SELECT id, program_type, status, start_date, end_date, config, created_at FROM service_programs WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])
  const serviceTouchpoints = await query('SELECT t.id, t.program_id, t.touchpoint_type, t.due_date, t.status, t.summary, t.completed_at FROM service_touchpoints t JOIN service_programs p ON p.id = t.program_id WHERE p.organization_id = ? ORDER BY t.due_date DESC', [organizationId])
  const serviceAlerts = await query('SELECT id, program_id, alert_type, title, detail, status, dedupe_key, created_at FROM service_alerts WHERE organization_id = ? ORDER BY created_at DESC', [organizationId])

  return {
    acquisition: { projects, diagnoses, plans, snapshots: acquisitionSnapshots },
    sales: { analyses: salesAnalyses, trainingTasks, trends: salesTrends },
    service: { programs: servicePrograms, touchpoints: serviceTouchpoints, alerts: serviceAlerts }
  }
}
