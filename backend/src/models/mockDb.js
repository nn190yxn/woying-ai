const seedAnnualUser = process.env.NODE_ENV === 'test' && process.env.TEST_SEED_ANNUAL_USER === '1'

const mockDb = {
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
  _idCounters: {
    users: seedAnnualUser ? 1 : 0,
    orders: 0,
    tool_usage: 0,
    tool_results: 0,
    diagnosis_reports: 0,
    douyin_quick_plans: 0,
    douyin_review_records: 0
  }
}

function getNextId(table) {
  mockDb._idCounters[table] = (mockDb._idCounters[table] || 0) + 1
  return mockDb._idCounters[table]
}

export function createMockQuery() {
  return async function mockQuery(sql, params) {
    sql = sql.trim()

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

    console.warn('[MockDB] Unhandled query:', sql.substring(0, 80))
    return []
  }
}
