import { query } from './db.js'

export async function initFeatureSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS acquisition_projects (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, name VARCHAR(160) NOT NULL, goal TEXT, status ENUM('active','archived') NOT NULL DEFAULT 'active', created_by VARCHAR(64) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_acq_project_org (organization_id, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS acquisition_channels (id BIGINT AUTO_INCREMENT PRIMARY KEY, project_id BIGINT NOT NULL, channel_code VARCHAR(64) NOT NULL, config JSON, status ENUM('active','archived') NOT NULL DEFAULT 'active', UNIQUE KEY uq_acq_channel (project_id, channel_code)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS acquisition_diagnoses (id BIGINT AUTO_INCREMENT PRIMARY KEY, project_id BIGINT NOT NULL, channel_code VARCHAR(64), input_data JSON, output_data JSON, status VARCHAR(32) NOT NULL DEFAULT 'needs_review', skill_version VARCHAR(64), source_type VARCHAR(64), source_id VARCHAR(128), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_acq_diag_source (project_id, source_type, source_id), INDEX idx_acq_diag_project (project_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS acquisition_action_plans (id BIGINT AUTO_INCREMENT PRIMARY KEY, project_id BIGINT NOT NULL, diagnosis_id BIGINT, title VARCHAR(160) NOT NULL, plan_data JSON NOT NULL, template_code VARCHAR(64), status VARCHAR(32) NOT NULL DEFAULT 'active', source_type VARCHAR(64), source_id VARCHAR(128), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_acq_plan_source (project_id, source_type, source_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS acquisition_snapshots (id BIGINT AUTO_INCREMENT PRIMARY KEY, project_id BIGINT NOT NULL, snapshot_date DATE NOT NULL, metrics JSON NOT NULL, summary TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_acq_snapshot (project_id, snapshot_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS acquisition_assets (id BIGINT AUTO_INCREMENT PRIMARY KEY, project_id BIGINT NOT NULL, asset_id BIGINT, asset_type VARCHAR(64) NOT NULL, metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS ai_runs (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, product_domain VARCHAR(64) NOT NULL, skill_code VARCHAR(128) NOT NULL, skill_version VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL, input_summary JSON, output_data JSON, model_version VARCHAR(128), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_ai_run_org (organization_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ]
  for (const statement of statements) await query(statement)
  const compatibilityColumns = [
    'ALTER TABLE acquisition_diagnoses ADD COLUMN source_type VARCHAR(64)',
    'ALTER TABLE acquisition_diagnoses ADD COLUMN source_id VARCHAR(128)',
    'ALTER TABLE acquisition_action_plans ADD COLUMN source_type VARCHAR(64)',
    'ALTER TABLE acquisition_action_plans ADD COLUMN source_id VARCHAR(128)',
    'ALTER TABLE acquisition_diagnoses ADD UNIQUE KEY uq_acq_diag_source (project_id, source_type, source_id)',
    'ALTER TABLE acquisition_action_plans ADD UNIQUE KEY uq_acq_plan_source (project_id, source_type, source_id)'
  ]
  for (const statement of compatibilityColumns) {
    try { await query(statement) } catch (error) {
      if (!['ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME'].includes(error?.code)) throw error
    }
  }
}
