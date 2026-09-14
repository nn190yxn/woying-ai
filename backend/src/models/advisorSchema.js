import { query } from './db.js'

export async function initAdvisorSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS platform_user_roles (user_id VARCHAR(64) PRIMARY KEY, role ENUM('platform_admin','advisor') NOT NULL, status ENUM('active','revoked') NOT NULL DEFAULT 'active', granted_by VARCHAR(64), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS advisor_assignments (id BIGINT AUTO_INCREMENT PRIMARY KEY, advisor_user_id VARCHAR(64) NOT NULL, organization_id INT NOT NULL, status ENUM('active','revoked') NOT NULL DEFAULT 'active', assigned_by VARCHAR(64) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_advisor_org (advisor_user_id, organization_id), INDEX idx_assignment_org (organization_id, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS advisor_stage_summaries (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, program_id BIGINT, author_id VARCHAR(64) NOT NULL, stage_code VARCHAR(64) NOT NULL, summary TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_stage_summary_org (organization_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS admin_audit_logs (id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id VARCHAR(64) NOT NULL, action VARCHAR(64) NOT NULL, target_type VARCHAR(64) NOT NULL, target_id VARCHAR(128), metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_admin_audit_actor (actor_id, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS product_events (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT, actor_id VARCHAR(64) NOT NULL, event_name VARCHAR(64) NOT NULL, payload JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_product_event_org (organization_id, event_name, created_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ]
  for (const statement of statements) await query(statement)
}
