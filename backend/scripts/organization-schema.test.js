import test from 'node:test'
import assert from 'node:assert/strict'
import { query } from '../src/models/db.js'
import { mockDb } from '../src/models/mockDb.js'

test('Mock DB supports organization audit records and idempotent organization collections', async () => {
  mockDb.organization_audit_logs.length = 0
  mockDb._idCounters.organization_audit_logs = 0
  const result = await query(
    'INSERT INTO organization_audit_logs (organization_id, actor_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?, ?)',
    [7, 'operator-1', 'member_role_changed', 'organization_member', 'member-1', JSON.stringify({ role: 'advisor' })]
  )
  assert.equal(result.insertId, 1)
  const rows = await query('SELECT * FROM organization_audit_logs WHERE organization_id = ?', [7])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].action, 'member_role_changed')
  assert.ok(Array.isArray(mockDb.institution_locations))
})
