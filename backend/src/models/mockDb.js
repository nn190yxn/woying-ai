const seedAnnualUser = process.env.NODE_ENV === 'test' && process.env.TEST_SEED_ANNUAL_USER === '1'

export const mockDb = {
  users: seedAnnualUser ? [{
    id: 1,
    phone: '19900000001',
    password_hash: '',
    nickname: '年度测试用户',
    member_level: 'annual',
    member_expire_at: null,
    referral_code: 'TEST001',
    referred_by: null,
    referral_bonus_days: 0,
    created_at: new Date()
  }] : [],
  orders: [],
  tool_usage: [],
  tool_results: [],
  diagnosis_reports: [],
  douyin_quick_plans: [],
  douyin_review_records: [],
  organizations: [],
  organization_members: [],
  institution_locations: [],
  file_assets: [],
  async_tasks: [],
  acquisition_projects: [], acquisition_channels: [], acquisition_diagnoses: [], acquisition_action_plans: [], acquisition_snapshots: [], acquisition_assets: [], ai_runs: [],
  sales_recordings: [], transcription_jobs: [], sales_analyses: [], sales_evidence: [], training_tasks: [], sales_score_snapshots: [],
  service_programs: [], service_touchpoints: [], service_alerts: [], consultant_notes: [],
  platform_user_roles: [], advisor_assignments: [], advisor_stage_summaries: [], admin_audit_logs: [], organization_audit_logs: [], product_events: [],
  knowledge_evidence: [], knowledge_objects: [], knowledge_versions: [], knowledge_relations: [], knowledge_reviews: [],
  _idCounters: {
    users: seedAnnualUser ? 1 : 0,
    orders: 0,
    tool_usage: 0,
    tool_results: 0,
    diagnosis_reports: 0,
    douyin_quick_plans: 0,
    douyin_review_records: 0,
    organizations: 0,
    organization_members: 0,
    institution_locations: 0,
    file_assets: 0,
    async_tasks: 0,
    acquisition_projects: 0, acquisition_channels: 0, acquisition_diagnoses: 0, acquisition_action_plans: 0, acquisition_snapshots: 0, acquisition_assets: 0, ai_runs: 0,
    sales_recordings: 0, transcription_jobs: 0, sales_analyses: 0, sales_evidence: 0, training_tasks: 0, sales_score_snapshots: 0,
    service_programs: 0, service_touchpoints: 0, service_alerts: 0, consultant_notes: 0,
    platform_user_roles: 0, advisor_assignments: 0, advisor_stage_summaries: 0, admin_audit_logs: 0, organization_audit_logs: 0, product_events: 0,
    knowledge_evidence: 0, knowledge_objects: 0, knowledge_versions: 0, knowledge_relations: 0, knowledge_reviews: 0
  }
}

function getNextId(table) {
  mockDb._idCounters[table] = (mockDb._idCounters[table] || 0) + 1
  return mockDb._idCounters[table]
}

export function createMockQuery() {
  return async function mockQuery(sql, params) {
    sql = sql.trim()
    if (/^(CREATE|ALTER|DROP)\s/i.test(sql)) return []

    if (sql.startsWith('SELECT') && sql.includes('FROM users')) {
      if (sql.includes('WHERE phone')) {
        const phone = params[0]
        const user = mockDb.users.find(u => u.phone === phone)
        return user ? [user] : []
      }
      if (sql.includes('WHERE id')) {
        const id = Number(params[0])
        const user = mockDb.users.find(u => u.id === id)
        return user ? [user] : []
      }
      if (sql.includes('WHERE referral_code')) {
        const code = params[0]
        const user = mockDb.users.find(u => u.referral_code === code)
        return user ? [user] : []
      }
      if (sql.includes('WHERE referred_by')) {
        const referrerId = Number(params[0])
        const referredUsers = mockDb.users.filter(u => u.referred_by === referrerId)
        return referredUsers
      }
      return [mockDb.users]
    }

    if (sql.startsWith('INSERT INTO users')) {
      const [phone, passwordHash, nickname, memberLevel, referredBy] = params
      const id = getNextId('users')
      const user = {
        id,
        phone,
        password_hash: passwordHash,
        nickname,
        member_level: memberLevel || 'free',
        member_expire_at: null,
        referral_code: null,
        referred_by: referredBy || null,
        referral_bonus_days: 0,
        created_at: new Date()
      }
      mockDb.users.push(user)
      return { insertId: id }
    }

    if (sql.startsWith('UPDATE users') && sql.includes('member_expire_at') && !sql.includes('member_level')) {
      const [memberExpireAt, userId] = params
      const user = mockDb.users.find(u => u.id === Number(userId))
      if (user) {
        user.member_expire_at = memberExpireAt
      }
      return { affectedRows: user ? 1 : 0 }
    }

    if (sql.startsWith('UPDATE users') && sql.includes('member_level')) {
      const [memberLevel, memberExpireAt, userId] = params
      const user = mockDb.users.find(u => u.id === Number(userId))
      if (user) {
        user.member_level = memberLevel
        user.member_expire_at = memberExpireAt
      }
      return { affectedRows: user ? 1 : 0 }
    }

    if (sql.startsWith('UPDATE users') && sql.includes('referral_code')) {
      const [referralCode, userId] = params
      const user = mockDb.users.find(u => u.id === Number(userId))
      if (user) {
        user.referral_code = referralCode
      }
      return { affectedRows: user ? 1 : 0 }
    }

    if (sql.startsWith('UPDATE users') && sql.includes('referral_bonus_days')) {
      const [bonusDays, userId] = params
      const user = mockDb.users.find(u => u.id === Number(userId))
      if (user) {
        user.referral_bonus_days = Number(bonusDays)
      }
      return { affectedRows: user ? 1 : 0 }
    }

    if (sql.startsWith('INSERT INTO orders')) {
      const [userId, planCode, amount, status] = params
      const id = getNextId('orders')
      const order = { id, user_id: userId, plan_code: planCode, amount, status, paid_at: null, created_at: new Date() }
      mockDb.orders.push(order)
      return { insertId: id }
    }

    if (sql.startsWith('UPDATE orders') && sql.includes('status')) {
      const [status, orderId] = params
      const order = mockDb.orders.find(o => o.id === Number(orderId))
      if (order) {
        order.status = status
        if (status === 'paid') order.paid_at = new Date()
      }
      return { affectedRows: order ? 1 : 0 }
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM orders')) {
      const orderId = params[0]
      const order = mockDb.orders.find(o => o.id === Number(orderId))
      return order ? [order] : []
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM tool_usage')) {
      return [{ count: 0 }]
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM tool_results')) {
      return []
    }

    if (sql.startsWith('INSERT INTO tool_usage')) {
      return { insertId: getNextId('tool_usage') }
    }

    if (sql.startsWith('INSERT INTO tool_results')) {
      return { insertId: getNextId('tool_results') }
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM diagnosis_reports')) {
      if (sql.includes('WHERE id')) {
        const id = Number(params[0])
        const report = mockDb.diagnosis_reports.find(r => r.id === id)
        return report ? [report] : []
      }
      if (sql.includes('WHERE user_id')) {
        const userId = Number(params[0])
        const reports = mockDb.diagnosis_reports
          .filter(r => r.user_id === userId)
          .sort((a, b) => b.created_at - a.created_at)
        return reports
      }
      return []
    }

    if (sql.startsWith('SELECT') && sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
      return [{ count: 1 }]
    }

    if (sql.startsWith('INSERT INTO diagnosis_reports')) {
      const [userId, answersJson, analysisJson] = params
      const id = getNextId('diagnosis_reports')
      const report = {
        id,
        user_id: Number(userId),
        answers_json: answersJson,
        analysis_json: analysisJson,
        created_at: new Date()
      }
      mockDb.diagnosis_reports.push(report)
      return { insertId: id }
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM douyin_quick_plans')) {
      const userId = String(params[0])
      const plan = mockDb.douyin_quick_plans.find(item => item.user_id === userId)
      return plan ? [plan] : []
    }

    if (sql.startsWith('INSERT INTO douyin_quick_plans')) {
      const hasVersionFields = sql.includes('plan_version') && sql.includes('input_hash')
      const [userId, industry, goal, frequency, adSupport] = params
      const planVersion = hasVersionFields ? params[5] : 1
      const inputHash = hasVersionFields ? params[6] : null
      const diagnosisContext = hasVersionFields ? params[7] : params[5]
      const plan = hasVersionFields ? params[8] : params[6]
      const existing = mockDb.douyin_quick_plans.find(item => item.user_id === String(userId))
      const now = new Date()
      if (existing) {
        Object.assign(existing, {
          industry,
          goal,
          frequency,
          ad_support: adSupport,
          plan_version: Number(planVersion || 1),
          input_hash: inputHash || null,
          diagnosis_context: diagnosisContext,
          plan,
          updated_at: now
        })
        return { insertId: existing.id, affectedRows: 2 }
      }

      const id = getNextId('douyin_quick_plans')
      mockDb.douyin_quick_plans.push({
        id,
        user_id: String(userId),
        industry,
        goal,
        frequency,
        ad_support: adSupport,
        plan_version: Number(planVersion || 1),
        input_hash: inputHash || null,
        diagnosis_context: diagnosisContext,
        plan,
        created_at: now,
        updated_at: now
      })
      return { insertId: id, affectedRows: 1 }
    }

    if (sql.startsWith('UPDATE douyin_quick_plans') && sql.includes('SET plan')) {
      const hasVersionFields = sql.includes('plan_version') && sql.includes('input_hash')
      const [plan] = params
      const planVersion = hasVersionFields ? params[1] : null
      const inputHash = hasVersionFields ? params[2] : null
      const userId = hasVersionFields ? params[3] : params[1]
      const existing = mockDb.douyin_quick_plans.find(item => item.user_id === String(userId))
      if (existing) {
        existing.plan = plan
        if (hasVersionFields) {
          existing.plan_version = Number(planVersion || existing.plan_version || 1)
          existing.input_hash = inputHash || null
        }
        existing.updated_at = new Date()
      }
      return { affectedRows: existing ? 1 : 0 }
    }

    if (sql.startsWith('SELECT') && sql.includes('FROM douyin_review_records')) {
      if (sql.includes('WHERE id')) {
        const id = Number(params[0])
        const userId = String(params[1])
        const record = mockDb.douyin_review_records.find(item => item.id === id && item.user_id === userId)
        return record ? [record] : []
      }
      const userId = String(params[0])
      const records = mockDb.douyin_review_records
        .filter(item => item.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      if (sql.includes('LIMIT 1')) return records.slice(0, 1)
      return records
    }

    if (sql.startsWith('INSERT INTO douyin_review_records')) {
      const [userId, industry, goal, sourceContext, inputData, resultData, effectiveContentTypes, nextActions] = params
      const now = new Date()
      const id = getNextId('douyin_review_records')
      mockDb.douyin_review_records.push({
        id,
        user_id: String(userId),
        industry,
        goal,
        source_context: sourceContext,
        input_data: inputData,
        result_data: resultData,
        effective_content_types: effectiveContentTypes,
        next_actions: nextActions,
        created_at: now,
        updated_at: now
      })
      return { insertId: id, affectedRows: 1 }
    }

    if (sql.startsWith('INSERT INTO organizations')) {
      const [name, industry, city, createdBy] = params
      const id = getNextId('organizations')
      mockDb.organizations.push({ id, name, industry, city, status: 'active', created_by: createdBy, created_at: new Date() })
      return { insertId: id }
    }
    if (sql.startsWith('INSERT INTO organization_members')) {
      const [organizationId, userId, role, isDefault] = params
      const existing = mockDb.organization_members.find(member => member.organization_id === Number(organizationId) && member.user_id === String(userId))
      if (existing && existing.status === 'active') return { insertId: existing.id, affectedRows: 0 }
      const id = existing?.id || getNextId('organization_members')
      const member = { id, organization_id: Number(organizationId), user_id: String(userId), role: role || 'owner', is_default: isDefault === undefined ? 1 : Number(isDefault), status: 'active', created_at: existing?.created_at || new Date() }
      if (existing) Object.assign(existing, member)
      else mockDb.organization_members.push(member)
      return { insertId: id, affectedRows: 1 }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM organization_members')) {
      let rows = [...mockDb.organization_members]
      if (sql.includes('organization_id = ?')) rows = rows.filter(row => Number(row.organization_id) === Number(params[0]))
      if (sql.includes('user_id = ?')) {
        const index = sql.includes('organization_id = ?') ? 1 : 0
        rows = rows.filter(row => String(row.user_id) === String(params[index]))
      }
      if (sql.includes("status = 'active'")) rows = rows.filter(row => row.status === 'active')
      if (sql.includes("role = 'owner'")) rows = rows.filter(row => row.role === 'owner')
      return rows
    }
    if (sql.startsWith('UPDATE organization_members')) {
      let affected = 0
      if (sql.includes('SET is_default = 0')) {
        const userId = String(params[0])
        for (const member of mockDb.organization_members) {
          if (String(member.user_id) === userId && member.status === 'active') { member.is_default = 0; affected += 1 }
        }
      } else if (sql.includes('SET role = ?')) {
        const [role, organizationId, userId] = params
        const member = mockDb.organization_members.find(row => Number(row.organization_id) === Number(organizationId) && String(row.user_id) === String(userId) && row.status === 'active')
        if (member) { member.role = role; affected = 1 }
      } else if (sql.includes("status = 'revoked'")) {
        const [organizationId, userId] = params
        const member = mockDb.organization_members.find(row => Number(row.organization_id) === Number(organizationId) && String(row.user_id) === String(userId) && row.status === 'active')
        if (member) { member.status = 'revoked'; member.is_default = 0; affected = 1 }
      } else {
        const [organizationId, userId] = params
        const member = mockDb.organization_members.find(row => Number(row.organization_id) === Number(organizationId) && String(row.user_id) === String(userId) && row.status === 'active')
        if (member) { member.is_default = 1; affected = 1 }
      }
      return { affectedRows: affected }
    }
    if (sql.startsWith('INSERT INTO institution_locations')) {
      const [organizationId, name, address] = params
      const id = getNextId('institution_locations')
      mockDb.institution_locations.push({ id, organization_id: Number(organizationId), name, address: address || null, status: 'active', created_at: new Date() })
      return { insertId: id, affectedRows: 1 }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM institution_locations')) {
      let rows = [...mockDb.institution_locations]
      if (sql.includes('id = ?')) rows = rows.filter(row => Number(row.id) === Number(params[0]))
      if (sql.includes('organization_id = ?')) {
        const index = sql.includes('id = ?') ? 1 : 0
        rows = rows.filter(row => Number(row.organization_id) === Number(params[index]))
      }
      if (sql.includes("status = 'active'")) rows = rows.filter(row => row.status === 'active')
      return rows
    }
    if (sql.startsWith('UPDATE institution_locations')) {
      const row = mockDb.institution_locations.find(item => Number(item.id) === Number(params[params.length - 2]) && Number(item.organization_id) === Number(params[params.length - 1]))
      if (!row || (sql.includes("status = 'active'") && row.status !== 'active')) return { affectedRows: 0 }
      if (sql.includes('SET name = ?')) { row.name = params[0]; row.address = params[1] }
      if (sql.includes("SET status = 'archived'")) row.status = 'archived'
      return { affectedRows: 1 }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM organizations o') && sql.includes('JOIN advisor_assignments')) {
      const advisorId = String(params[0])
      return mockDb.organizations.filter(org => org.status === 'active' && mockDb.advisor_assignments.some(item => Number(item.organization_id) === Number(org.id) && String(item.advisor_user_id) === advisorId && item.status === 'active'))
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM organizations WHERE')) {
      let rows = [...mockDb.organizations]
      if (sql.includes('id = ?')) rows = rows.filter(org => Number(org.id) === Number(params[0]))
      if (sql.includes("status = 'active'")) rows = rows.filter(org => org.status === 'active')
      return rows
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM organizations o')) {
      const hasId = sql.includes('WHERE o.id = ?')
      const userId = String(params[hasId ? 1 : 0])
      const organizationId = hasId ? Number(params[0]) : null
      return mockDb.organizations
        .filter(org => (organizationId == null || Number(org.id) === organizationId) && mockDb.organization_members.some(member => member.organization_id === org.id && member.user_id === userId && member.status === 'active'))
        .map(org => ({ ...org, ...mockDb.organization_members.find(member => member.organization_id === org.id && member.user_id === userId) }))
    }
    if (sql.startsWith('INSERT INTO acquisition_projects')) {
      const [organizationId, name, goal, createdBy] = params
      const id = getNextId('acquisition_projects')
      mockDb.acquisition_projects.push({ id, organization_id: Number(organizationId), name, goal, status: 'active', created_by: createdBy, created_at: new Date(), updated_at: new Date() })
      return { insertId: id, affectedRows: 1 }
    }
    if (sql.startsWith('INSERT INTO acquisition_channels')) {
      const [projectId, channelCode, config] = params
      const id = getNextId('acquisition_channels')
      mockDb.acquisition_channels.push({ id, project_id: Number(projectId), channel_code: channelCode, config, status: 'active', created_at: new Date() })
      return { insertId: id, affectedRows: 1 }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM acquisition_projects')) {
      let rows = [...mockDb.acquisition_projects]
      const hasIdFilter = sql.includes('WHERE id = ?')
      if (hasIdFilter) rows = rows.filter(row => Number(row.id) === Number(params[0]))
      if (sql.includes('organization_id = ?')) rows = rows.filter(row => Number(row.organization_id) === Number(params[hasIdFilter ? 1 : 0]))
      if (sql.includes('created_by = ?')) rows = rows.filter(row => String(row.created_by) === String(params[1]))
      if (sql.includes("name = '抖音历史资料（兼容）'")) rows = rows.filter(row => row.name === '抖音历史资料（兼容）')
      if (sql.includes("status = 'active'")) rows = rows.filter(row => row.status === 'active')
      return rows
    }
    if (sql.startsWith('UPDATE acquisition_projects')) {
      const id = Number(params[params.length - 1]); const row = mockDb.acquisition_projects.find(item => Number(item.id) === id)
      if (row && sql.includes('status = ?')) row.status = params[0]
      return { affectedRows: row ? 1 : 0 }
    }

    if (sql.startsWith('INSERT INTO file_assets')) {
      const [organizationId, userId, filename, mimeType, sizeBytes, storageKey, purpose, retentionUntil] = params
      const id = getNextId('file_assets')
      mockDb.file_assets.push({ id, organization_id: Number(organizationId), user_id: String(userId), filename, mime_type: mimeType, size_bytes: Number(sizeBytes), storage_key: storageKey, purpose, status: 'pending', retention_until: retentionUntil, created_at: new Date() })
      return { insertId: id }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM file_assets')) {
      if (sql.includes('retention_until <= ?')) return mockDb.file_assets.filter(item => item.retention_until <= params[0] && (!sql.includes('organization_id = ?') || Number(item.organization_id) === Number(params[1])) && ['pending', 'ready'].includes(item.status))
      if (!sql.includes('WHERE id = ?')) {
        let rows = mockDb.file_assets.filter(item => Number(item.organization_id) === Number(params[0]))
        if (sql.includes('status = ?')) rows = rows.filter(item => item.status === params[1])
        const limit = Number(params[params.length - 2]); const offset = Number(params[params.length - 1])
        return rows.sort((a, b) => b.created_at - a.created_at).slice(offset, offset + limit)
      }
      const asset = mockDb.file_assets.find(item => Number(item.id) === Number(params[0]) && (!sql.includes('organization_id = ?') || Number(item.organization_id) === Number(params[1])))
      return asset ? [asset] : []
    }
    if (sql.startsWith('UPDATE file_assets')) {
      const id = Number(params[params.length - 1])
      const asset = mockDb.file_assets.find(item => Number(item.id) === id)
      if (asset) {
        if (sql.includes('sha256')) { asset.size_bytes = Number(params[0]); asset.sha256 = params[1]; asset.status = 'ready' }
        else if (sql.includes("status = 'expired'")) { asset.status = 'expired'; asset.deleted_at = new Date() }
        else { asset.status = 'deleted'; asset.deleted_at = new Date() }
      }
      return { affectedRows: asset ? 1 : 0 }
    }
    if (sql.startsWith('INSERT INTO async_tasks')) {
      const [organizationId, userId, type, key, resultIdempotencyKey, cancelToken, payload, resourceType, resourceId] = params
      const id = getNextId('async_tasks')
      const now = new Date()
      mockDb.async_tasks.push({ id, organization_id: Number(organizationId), user_id: String(userId), task_type: type, status: 'queued', idempotency_key: key, cancel_token: cancelToken, cancel_requested_at: null, failure_category: null, result_idempotency_key: resultIdempotencyKey, payload, result: null, resource_type: resourceType, resource_id: resourceId, progress: 0, attempts: 0, error_code: null, error_message: null, locked_by: null, locked_at: null, lease_expires_at: null, next_run_at: now, started_at: null, finished_at: null, created_at: now, updated_at: now })
      return { insertId: id }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM async_tasks')) {
      if (sql.includes('locked_by = ?')) return mockDb.async_tasks.filter(task => task.locked_by === params[0] && task.status === 'processing').sort((a, b) => b.locked_at - a.locked_at).slice(0, 1)
      if (sql.includes('idempotency_key')) return mockDb.async_tasks.filter(task => task.organization_id === Number(params[0]) && task.idempotency_key === params[1])
      if (sql.includes('WHERE id = ?')) return mockDb.async_tasks.filter(task => Number(task.id) === Number(params[0]))
      if (sql.includes('WHERE id = ? AND organization_id')) return mockDb.async_tasks.filter(task => Number(task.id) === Number(params[0]) && task.organization_id === Number(params[1]))
      if (sql.includes("status = 'queued'")) return mockDb.async_tasks.filter(task => task.status === 'queued').slice(0, 1)
      return mockDb.async_tasks.filter(task => task.organization_id === Number(params[0])).sort((a, b) => b.created_at - a.created_at)
    }
    if (sql.startsWith('UPDATE async_tasks') && sql.includes("status = 'cancelled'") && sql.includes('cancel_requested_at')) {
      const task = mockDb.async_tasks.find(item => Number(item.id) === Number(params[0]) && Number(item.organization_id) === Number(params[1]) && !['succeeded', 'failed_final', 'needs_review', 'cancelled'].includes(item.status))
      if (!task) return { affectedRows: 0 }
      task.status = 'cancelled'; task.cancel_requested_at = new Date(); task.locked_by = null; task.lease_expires_at = null; task.updated_at = new Date()
      return { affectedRows: 1 }
    }
    if (sql.startsWith('UPDATE async_tasks') && sql.includes('failure_category = ?') && sql.includes('next_run_at = DATE_ADD')) {
      const taskId = params[params.length - 2]
      const task = mockDb.async_tasks.find(item => Number(item.id) === Number(taskId) && item.status === 'processing' && item.locked_by === params[params.length - 1])
      if (!task) return { affectedRows: 0 }
      const now = new Date()
      task.status = params[0]; task.error_code = params[1]; task.error_message = params[2]; task.failure_category = params[3]; task.next_run_at = new Date(now.getTime() + Number(params[4]) * 1000); task.finished_at = now; task.locked_by = null; task.lease_expires_at = null; task.updated_at = now
      return { affectedRows: 1 }
    }
    if (sql.startsWith('UPDATE async_tasks') && sql.includes('SET result = ?') && sql.includes('result_idempotency_key = ?') && sql.includes('result_idempotency_key IS NULL')) {
      const task = mockDb.async_tasks.find(item => Number(item.id) === Number(params[2]) && Number(item.organization_id) === Number(params[3]) && item.status === 'processing' && item.locked_by === params[4])
      if (!task) return { affectedRows: 0 }
      if (task.result_idempotency_key && task.result_idempotency_key !== params[5]) return { affectedRows: 0 }
      if (task.result == null) task.result = params[0]
      task.result_idempotency_key = params[1]
      task.updated_at = new Date()
      return { affectedRows: 1 }
    }
    if (sql.startsWith('UPDATE async_tasks') && sql.includes("SET progress = ?")) {
      const task = mockDb.async_tasks.find(item => Number(item.id) === Number(params[1]) && Number(item.organization_id) === Number(params[2]) && item.status === 'processing' && item.locked_by === params[3])
      if (!task) return { affectedRows: 0 }
      task.progress = Number(params[0]); task.updated_at = new Date()
      return { affectedRows: 1 }
    }
    if (sql.startsWith('UPDATE async_tasks') && sql.includes('lease_expires_at = DATE_ADD')) {
      const workerId = params[0]
      const now = new Date()
      const task = mockDb.async_tasks.filter(item => (['queued', 'failed_retryable'].includes(item.status) && (!item.next_run_at || item.next_run_at <= now)) || (item.status === 'processing' && item.lease_expires_at && item.lease_expires_at <= now)).sort((a, b) => a.created_at - b.created_at)[0]
      if (!task) return { affectedRows: 0 }
      task.status = 'processing'; task.locked_by = workerId; task.locked_at = now; task.lease_expires_at = new Date(now.getTime() + Number(params[1]) * 1000); task.attempts += 1; task.started_at = task.started_at || now; task.updated_at = now
      return { affectedRows: 1 }
    }
    if (sql.startsWith('UPDATE async_tasks')) {
      const taskId = sql.includes('AND locked_by = ?') ? params[params.length - 2] : params[params.length - 1]
      const task = mockDb.async_tasks.find(item => Number(item.id) === Number(taskId))
      if (sql.includes('AND locked_by = ?') && (!task || task.status !== 'processing' || task.locked_by !== params[params.length - 1])) return { affectedRows: 0 }
      if (task) {
        if (sql.includes("status = 'processing'") && sql.includes('attempts = attempts + 1')) { task.status = 'processing'; task.attempts += 1 }
        else if (sql.includes("status = 'succeeded'")) { task.status = 'succeeded'; task.result = params[0]; task.progress = 100 }
        else if (sql.includes('status = ?') && (sql.includes('result = ?') || sql.includes('COALESCE(result'))) { task.status = params[0]; task.result = task.result ?? params[1]; task.progress = 100; task.locked_by = null; task.lease_expires_at = null; task.finished_at = new Date() }
        else if (sql.includes('status = ?')) { task.status = params[0]; task.error_code = params[1]; task.error_message = params[2]; task.locked_by = null; task.lease_expires_at = null; task.finished_at = new Date() }
        else if (sql.includes("status = 'queued'")) { task.status = 'queued'; task.error_code = null; task.error_message = null; task.failure_category = null; task.next_run_at = new Date() }
        else if (sql.includes("status = 'cancelled'")) task.status = 'cancelled'
      }
      return { affectedRows: task ? 1 : 0 }
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM advisor_assignments')) {
      let rows = [...mockDb.advisor_assignments]
      if (sql.includes('advisor_user_id = ?')) rows = rows.filter(row => String(row.advisor_user_id) === String(params[0]))
      if (sql.includes('organization_id = ?')) rows = rows.filter(row => Number(row.organization_id) === Number(params[1]))
      if (sql.includes("status = 'active'")) rows = rows.filter(row => row.status === 'active')
      return rows
    }
    if (sql.startsWith('UPDATE advisor_assignments')) {
      const [advisorUserId, organizationId] = params
      const row = mockDb.advisor_assignments.find(item => String(item.advisor_user_id) === String(advisorUserId) && Number(item.organization_id) === Number(organizationId))
      if (!row) return { affectedRows: 0 }
      row.status = 'revoked'
      return { affectedRows: 1 }
    }
    const tables = ['organization_audit_logs','acquisition_projects','acquisition_channels','acquisition_diagnoses','acquisition_action_plans','acquisition_snapshots','acquisition_assets','ai_runs','sales_recordings','transcription_jobs','sales_analyses','sales_evidence','training_tasks','sales_score_snapshots','service_programs','service_touchpoints','service_alerts','consultant_notes','platform_user_roles','advisor_assignments','advisor_stage_summaries','admin_audit_logs','product_events','knowledge_evidence','knowledge_objects','knowledge_versions','knowledge_relations','knowledge_reviews']
    if (sql.startsWith('SELECT') && sql.includes('FROM sales_analyses a') && sql.includes('JOIN sales_recordings')) {
      const analysisId = sql.includes('a.id = ?') ? Number(params[0]) : null
      const organizationId = Number(params[analysisId == null ? 0 : 1])
      return mockDb.sales_analyses.filter(item => (analysisId == null || Number(item.id) === analysisId) && mockDb.sales_recordings.some(recording => Number(recording.id) === Number(item.recording_id) && Number(recording.organization_id) === organizationId))
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM service_touchpoints t') && sql.includes('JOIN service_programs')) {
      const programId = sql.includes('t.program_id = ?') ? Number(params[0]) : null
      const organizationId = Number(params[programId == null ? 0 : 1])
      return mockDb.service_touchpoints.filter(item => (programId == null || Number(item.program_id) === programId) && mockDb.service_programs.some(program => Number(program.id) === Number(item.program_id) && Number(program.organization_id) === organizationId))
    }
    for (const table of tables) {
      if (sql.startsWith(`INSERT INTO ${table}`)) {
        const columns = sql.match(/INSERT INTO\s+\w+\s*\(([^)]+)\)/i)?.[1].split(',').map(item => item.trim()) || []
        const row = { id: getNextId(table), created_at: new Date(), updated_at: new Date() }
        columns.forEach((column, index) => { row[column] = params[index] })
        if (table === 'sales_recordings') Object.assign(row, { organization_id: Number(params[0]), user_id: String(params[1]), seller_label: params[2], scene: params[3], consent_confirmed: 1, asset_id: params[4], status: 'uploaded' })
        if (table === 'transcription_jobs') Object.assign(row, { recording_id: Number(params[0]), status: sql.includes("'completed'") ? 'completed' : 'queued', transcript: sql.includes("'completed'") ? params[1] : null, provider: sql.includes("'manual'") ? 'manual' : null })
        if (table === 'service_programs') row.status = 'active'
        if (table === 'service_touchpoints') row.status = 'pending'
        if (table === 'service_alerts') row.status = 'open'
        if (['platform_user_roles', 'advisor_assignments'].includes(table)) row.status = 'active'
        mockDb[table].push(row)
        return { insertId: row.id, affectedRows: 1 }
      }
      if (sql.startsWith(`UPDATE ${table}`)) {
        const idIndex = sql.includes('WHERE id = ?') ? (sql.includes('organization_id = ?') ? params.length - 2 : params.length - 1) : -1
        const row = idIndex >= 0 ? mockDb[table].find(item => Number(item.id) === Number(params[idIndex])) : null
        if (!row) return { affectedRows: 0 }
        if (sql.includes('status = ?')) row.status = params[0]
        if (sql.includes("status = 'completed'")) row.status = 'completed'
        if (sql.includes("status = 'closed'")) row.status = 'closed'
        if (sql.includes("status = 'open'")) row.status = 'open'
        if (sql.includes('transcript = ?')) row.transcript = params[0]
        if (sql.includes("provider = 'manual'")) row.provider = 'manual'
        if (sql.includes('output_data = ?')) row.output_data = params[1]
        row.updated_at = new Date()
        return { affectedRows: 1 }
      }
      if (sql.startsWith('SELECT') && sql.includes(`FROM ${table}`)) {
        let rows = [...mockDb[table]]
        const hasOrgFilter = sql.includes('organization_id = ?')
        if (hasOrgFilter) rows = rows.filter(row => Number(row.organization_id) === Number(params[hasOrgFilter && sql.includes('WHERE id = ?') ? 1 : 0]))
        if (sql.includes('project_id = ?')) rows = rows.filter(row => Number(row.project_id) === Number(params[0]))
        if (sql.includes('recording_id = ?')) rows = rows.filter(row => Number(row.recording_id) === Number(params[0]))
        if (sql.includes('advisor_user_id = ?')) rows = rows.filter(row => String(row.advisor_user_id) === String(params[0]))
        else if (sql.includes('user_id = ?')) rows = rows.filter(row => String(row.user_id) === String(params[0]))
        if (sql.includes('created_by = ?')) rows = rows.filter(row => String(row.created_by) === String(params[1]))
        if (sql.includes("name = '抖音历史资料（兼容）'")) rows = rows.filter(row => row.name === '抖音历史资料（兼容）')
        if (sql.includes('source_type = ?') && sql.includes('source_id = ?')) rows = rows.filter(row => row.source_type === params[1] && String(row.source_id) === String(params[2]))
        if (sql.includes('WHERE id = ?')) rows = rows.filter(row => Number(row.id) === Number(params[0]))
        return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }
    }

    console.warn('[MockDB] Unhandled query:', sql.substring(0, 80))
    return []
  }
}
