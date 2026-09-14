import { query } from './db.js'

export async function initServiceSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS service_programs (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, program_type VARCHAR(64) NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'active', start_date DATE NOT NULL, end_date DATE, config JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_service_org (organization_id, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS service_touchpoints (id BIGINT AUTO_INCREMENT PRIMARY KEY, program_id BIGINT NOT NULL, touchpoint_type VARCHAR(64) NOT NULL, due_date DATE NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'pending', summary TEXT, completed_at DATETIME, UNIQUE KEY uq_service_touchpoint (program_id, touchpoint_type, due_date)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS service_alerts (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, program_id BIGINT, alert_type VARCHAR(64) NOT NULL, title VARCHAR(160) NOT NULL, detail TEXT, status VARCHAR(32) NOT NULL DEFAULT 'open', dedupe_key VARCHAR(160), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_service_alert_dedupe (organization_id, dedupe_key), INDEX idx_service_alert_org (organization_id, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS consultant_notes (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, program_id BIGINT, author_id VARCHAR(64) NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ]
  for (const statement of statements) await query(statement)
}
