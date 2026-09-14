import mysql from 'mysql2/promise'
import { createMockQuery } from './mockDb.js'
import { logger } from '../middleware/logger.js'

let pool = null
let useMock = process.env.NODE_ENV === 'test' || process.env.MOCK_DB === 'true'

async function ensureColumn(tableName, columnName, definition) {
  const rows = await query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  )
  const exists = Number(rows?.[0]?.count || rows?.[0]?.COUNT || 0) > 0
  if (!exists) await query(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`)
}

export async function query(sql, params) {
  if (useMock) {
    return createMockQuery()(sql, params)
  }

  if (!pool) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
        port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
        database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'woai_ai',
        user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
        password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 3000
      })
      const connection = await pool.getConnection()
      connection.release()
      logger.info('db', 'MySQL connected')
    } catch (err) {
      logger.warn('db', `MySQL unavailable, using in-memory mock: ${err.message}`)
      const failedPool = pool
      pool = null
      useMock = true
      await failedPool?.end().catch(() => {})
      return createMockQuery()(sql, params)
    }
  }

  try {
    const [results] = await pool.execute(sql, params)
    return results
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('db', `Query failed in production: ${err.message}`)
      throw err
    }
    logger.warn('db', `Query failed, falling back to mock: ${err.message}`)
    useMock = true
    return createMockQuery()(sql, params)
  }
}

export async function getConnection() {
  if (useMock || !pool) {
    throw new Error('Database connection not available')
  }
  return pool.getConnection()
}

export async function initDB() {
  logger.info('db', 'initDB called (MySQL mode)')
  try {
    await query(`CREATE TABLE IF NOT EXISTS user_sheets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      sheet_code VARCHAR(128) NOT NULL,
      sheet_data JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_user_sheet (user_id, sheet_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    logger.info('db', 'user_sheets table ready')

    await query(`CREATE TABLE IF NOT EXISTS douyin_quick_plans (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      industry VARCHAR(64) NOT NULL,
      goal VARCHAR(64) NOT NULL,
      frequency VARCHAR(16) NOT NULL,
      ad_support VARCHAR(32) NOT NULL,
      plan_version INT NOT NULL DEFAULT 1,
      input_hash VARCHAR(64),
      diagnosis_context JSON,
      plan JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE INDEX idx_user_douyin_quick_plan (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await ensureColumn('douyin_quick_plans', 'plan_version', 'plan_version INT NOT NULL DEFAULT 1')
    await ensureColumn('douyin_quick_plans', 'input_hash', 'input_hash VARCHAR(64)')
    logger.info('db', 'douyin_quick_plans table ready')

    await query(`CREATE TABLE IF NOT EXISTS douyin_review_records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      industry VARCHAR(64),
      goal VARCHAR(64),
      source_context JSON,
      input_data JSON NOT NULL,
      result_data JSON NOT NULL,
      effective_content_types JSON,
      next_actions JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_douyin_review_created (user_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    logger.info('db', 'douyin_review_records table ready')
    await query(`CREATE TABLE IF NOT EXISTS organizations (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(128) NOT NULL, industry VARCHAR(64) NOT NULL DEFAULT '儿童素质培训', city VARCHAR(64), status ENUM('active','archived') NOT NULL DEFAULT 'active', created_by VARCHAR(64) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX idx_org_created_by (created_by)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS organization_members (id INT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, user_id VARCHAR(64) NOT NULL, role ENUM('owner','principal','marketing_lead','advisor','platform_admin') NOT NULL DEFAULT 'owner', is_default TINYINT(1) NOT NULL DEFAULT 0, status ENUM('active','revoked') NOT NULL DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_org_member (organization_id, user_id), INDEX idx_member_user (user_id), INDEX idx_member_default (user_id, is_default, status), CONSTRAINT fk_member_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await ensureColumn('organization_members', 'role', "role VARCHAR(32) NOT NULL DEFAULT 'owner'")
    await ensureColumn('organization_members', 'is_default', 'is_default TINYINT(1) NOT NULL DEFAULT 0')
    await ensureColumn('organization_members', 'status', "status VARCHAR(16) NOT NULL DEFAULT 'active'")
    await query(`CREATE TABLE IF NOT EXISTS institution_locations (id INT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, name VARCHAR(128) NOT NULL, address VARCHAR(255), status ENUM('active','archived') NOT NULL DEFAULT 'active', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_location_org (organization_id), CONSTRAINT fk_location_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await ensureColumn('institution_locations', 'status', "status VARCHAR(16) NOT NULL DEFAULT 'active'")
    await query(`CREATE TABLE IF NOT EXISTS organization_audit_logs (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, actor_id VARCHAR(64) NOT NULL, action VARCHAR(64) NOT NULL, target_type VARCHAR(64), target_id VARCHAR(128), metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_org_audit (organization_id, created_at), INDEX idx_org_audit_actor (actor_id, created_at), CONSTRAINT fk_org_audit_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS file_assets (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, user_id VARCHAR(64) NOT NULL, filename VARCHAR(255) NOT NULL, mime_type VARCHAR(128) NOT NULL, size_bytes BIGINT NOT NULL DEFAULT 0, sha256 CHAR(64), storage_key VARCHAR(512) NOT NULL, purpose VARCHAR(64) NOT NULL DEFAULT 'general', status ENUM('pending','ready','deleted','expired') NOT NULL DEFAULT 'pending', retention_until DATETIME, deleted_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_asset_org (organization_id), INDEX idx_asset_retention (retention_until)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS async_tasks (id BIGINT AUTO_INCREMENT PRIMARY KEY, organization_id INT NOT NULL, user_id VARCHAR(64) NOT NULL, task_type VARCHAR(128) NOT NULL, status ENUM('queued','processing','succeeded','failed_retryable','failed_final','needs_review','cancelled') NOT NULL DEFAULT 'queued', idempotency_key VARCHAR(128) NOT NULL, result_idempotency_key VARCHAR(128), payload JSON, result JSON, resource_type VARCHAR(64), resource_id VARCHAR(128), progress TINYINT UNSIGNED NOT NULL DEFAULT 0, attempts TINYINT UNSIGNED NOT NULL DEFAULT 0, error_code VARCHAR(64), error_message TEXT, locked_by VARCHAR(128), locked_at DATETIME, lease_expires_at DATETIME, next_run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, started_at DATETIME, finished_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_task_idempotency (organization_id, idempotency_key), INDEX idx_task_status (status, next_run_at, created_at), INDEX idx_task_claim (status, next_run_at, lease_expires_at), INDEX idx_task_result_idempotency (organization_id, result_idempotency_key), INDEX idx_task_org (organization_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await ensureColumn('async_tasks', 'result_idempotency_key', 'result_idempotency_key VARCHAR(128) NULL')
    await ensureColumn('async_tasks', 'locked_by', 'locked_by VARCHAR(128) NULL')
    await ensureColumn('async_tasks', 'locked_at', 'locked_at DATETIME NULL')
    await ensureColumn('async_tasks', 'lease_expires_at', 'lease_expires_at DATETIME NULL')
    await ensureColumn('async_tasks', 'next_run_at', 'next_run_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP')
    await ensureColumn('async_tasks', 'cancel_token', 'cancel_token VARCHAR(128) NULL')
    await ensureColumn('async_tasks', 'cancel_requested_at', 'cancel_requested_at DATETIME NULL')
    await ensureColumn('async_tasks', 'failure_category', "failure_category VARCHAR(32) NULL")
    await query(`CREATE TABLE IF NOT EXISTS knowledge_evidence (id BIGINT AUTO_INCREMENT PRIMARY KEY, evidence_key VARCHAR(128) NOT NULL, source_path VARCHAR(768), source_type VARCHAR(32) NOT NULL, sha256 CHAR(64), source_date DATE, license_status VARCHAR(32) NOT NULL DEFAULT 'internal', privacy_level VARCHAR(32) NOT NULL DEFAULT 'restricted', metadata JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_evidence_key (evidence_key), INDEX idx_evidence_sha (sha256)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS knowledge_objects (id BIGINT AUTO_INCREMENT PRIMARY KEY, knowledge_id VARCHAR(128) NOT NULL, title VARCHAR(255) NOT NULL, statement TEXT NOT NULL, industry VARCHAR(64) NOT NULL, product_domain VARCHAR(64) NOT NULL, channel JSON, scene JSON, knowledge_type VARCHAR(64) NOT NULL, evidence_level VARCHAR(64) NOT NULL, applicable_conditions JSON, volatility VARCHAR(32) NOT NULL DEFAULT 'stable', last_verified DATE, next_review DATE, requires_verification TINYINT(1) NOT NULL DEFAULT 0, license_status VARCHAR(32) NOT NULL, privacy_level VARCHAR(32) NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'raw', organization_id BIGINT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_knowledge_id (knowledge_id), INDEX idx_knowledge_retrieval (industry, product_domain, knowledge_type, status), INDEX idx_knowledge_org (organization_id, status), INDEX idx_knowledge_review (next_review, volatility)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS knowledge_versions (id BIGINT AUTO_INCREMENT PRIMARY KEY, knowledge_object_id BIGINT NOT NULL, canonical_topic VARCHAR(128) NOT NULL, version VARCHAR(32) NOT NULL, payload JSON NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'pending_review', published_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_knowledge_version (knowledge_object_id, version), INDEX idx_current_canonical (canonical_topic, status)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS knowledge_relations (id BIGINT AUTO_INCREMENT PRIMARY KEY, from_knowledge_id VARCHAR(128) NOT NULL, to_knowledge_id VARCHAR(128) NOT NULL, relation_type ENUM('derived_from','supersedes','contradicts') NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_knowledge_relation (from_knowledge_id, to_knowledge_id, relation_type), INDEX idx_relation_target (to_knowledge_id, relation_type)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    await query(`CREATE TABLE IF NOT EXISTS knowledge_reviews (id BIGINT AUTO_INCREMENT PRIMARY KEY, knowledge_id VARCHAR(128) NOT NULL, reviewer_id VARCHAR(64) NOT NULL, decision VARCHAR(32) NOT NULL, reason VARCHAR(512), reviewed_at DATETIME NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_review_knowledge (knowledge_id, reviewed_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`)
    logger.info('db', 'knowledge governance tables ready')
    logger.info('db', 'organization, storage and async task tables ready')
  } catch (err) {
    logger.warn('db', `table init skipped: ${err.message}`)
  }
}
