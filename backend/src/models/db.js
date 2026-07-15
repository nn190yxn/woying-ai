import mysql from 'mysql2/promise'
import { createMockQuery } from './mockDb.js'
import { logger } from '../middleware/logger.js'

let pool = null
let useMock = false

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
      useMock = true
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
  } catch (err) {
    logger.warn('db', `table init skipped: ${err.message}`)
  }
}
