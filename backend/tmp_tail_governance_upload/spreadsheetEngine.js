// Spreadsheet engine: structured table data for B-class tools
// Generates CSV-compatible data that can be exported to Excel

export const SPREADSHEETS = {
  // ====== 通用表格 ======

  'customer-info-sheet': {
    name: '客户信息登记表',
    headers: ['客户姓名', '联系电话', '性别', '年龄', '行业/职业', '来源渠道', '初次到店日期', '消费金额', '备注'],
    exampleRows: [
      ['张三', '13800138000', '男', '35', '餐饮老板', '抖音', '2026-01-15', '5000', '首次体验'],
      ['李四', '13900139000', '女', '28', '白领', '朋友介绍', '2026-01-20', '3000', '复购客户'],
      ['王五', '13700137000', '男', '42', '企业高管', '美团', '2026-02-01', '8000', 'VIP客户']
    ]
  },

  'daily-revenue-sheet': {
    name: '日营收登记表',
    headers: ['日期', '营业额', '订单数', '客单价', '现金', '微信', '支付宝', '会员卡', '备注'],
    exampleRows: [
      ['2026-01-01', '8500', '45', '189', '1200', '4000', '2300', '1000', '元旦'],
      ['2026-01-02', '6200', '32', '194', '800', '3000', '1600', '800', ''],
      ['2026-01-03', '7800', '40', '195', '1000', '3500', '2000', '1300', '']
    ]
  },

  'inventory-sheet': {
    name: '库存管理表',
    headers: ['物品名称', '类别', '当前库存', '单位', '最低库存', '采购价', '供应商', '最后盘点日期', '备注'],
    exampleRows: [
      ['大米', '食材', '200', 'kg', '50', '4.5', 'XX粮油', '2026-01-15', ''],
      ['猪肉', '食材', '80', 'kg', '30', '22', 'XX肉业', '2026-01-15', ''],
      ['洗洁精', '耗材', '15', '瓶', '5', '12', 'XX日化', '2026-01-10', '']
    ]
  },

  'supplier-sheet': {
    name: '供应商管理表',
    headers: ['供应商名称', '联系人', '电话', '主营品类', '合作开始日期', '月均采购额', '结算方式', '信用等级', '备注'],
    exampleRows: [
      ['XX粮油公司', '王经理', '138xxxx1111', '米面油', '2025-06-01', '15000', '月结', 'A', ''],
      ['XX肉业', '李总', '139xxxx2222', '肉类', '2025-03-15', '25000', '周结', 'A', ''],
      ['XX蔬菜基地', '赵姐', '137xxxx3333', '蔬菜', '2025-09-01', '8000', '现结', 'B', '']
    ]
  },

  'employee-attendance-sheet': {
    name: '员工考勤表',
    headers: ['姓名', '部门', '日期', '上班打卡', '下班打卡', '工时', '迟到/早退', '请假类型', '备注'],
    exampleRows: [
      ['张三', '后厨', '2026-01-15', '09:00', '21:00', '12', '否', '', ''],
      ['李四', '前厅', '2026-01-15', '10:30', '22:00', '11.5', '迟到30分钟', '', ''],
      ['王五', '后厨', '2026-01-15', '09:00', '21:00', '12', '否', '病假', '']
    ]
  },

  'service-schedule-sheet': {
    name: '服务排班表',
    headers: ['日期', '班次', '服务人员', '负责区域', '预约客户数', '备注'],
    exampleRows: [
      ['2026-01-15', '早班(9:00-15:00)', '张三、李四', 'A区', '12', ''],
      ['2026-01-15', '晚班(15:00-21:00)', '王五、赵六', 'B区', '15', ''],
      ['2026-01-16', '早班(9:00-15:00)', '张三、钱七', 'A区', '10', '']
    ]
  },

  'reservation-sheet': {
    name: '预约登记表',
    headers: ['预约日期', '客户姓名', '联系电话', '服务项目', '预约时段', '状态', '备注'],
    exampleRows: [
      ['2026-01-15', '张先生', '138xxxx1111', '招牌套餐', '10:00-12:00', '已确认', ''],
      ['2026-01-15', '李女士', '139xxxx2222', '双人套餐', '12:00-14:00', '已确认', '带小孩'],
      ['2026-01-16', '王先生', '137xxxx3333', '商务宴请', '18:00-20:00', '待确认', '包厢']
    ]
  },

  'foot-traffic-sheet': {
    name: '客流登记表',
    headers: ['日期', '时段', '进店人数', '成交人数', '成交率', '平均消费', '备注'],
    exampleRows: [
      ['2026-01-15', '11:00-14:00', '35', '18', '51.4%', '85', '午高峰'],
      ['2026-01-15', '14:00-17:00', '15', '8', '53.3%', '65', '下午茶'],
      ['2026-01-15', '17:00-21:00', '50', '30', '60.0%', '120', '晚高峰']
    ]
  },

  'trial-conversion-sheet': {
    name: '试课转化登记表',
    headers: ['日期', '学员姓名', '年龄', '试课课程', '授课教师', '试听评价', '是否报名', '备注'],
    exampleRows: [
      ['2026-01-15', '小明', '8', '钢琴入门', '张老师', '兴趣浓厚', '是', '报名季度班'],
      ['2026-01-15', '小红', '6', '舞蹈基础', '李老师', '活泼好动', '否', '需再考虑'],
      ['2026-01-16', '小刚', '10', '编程入门', '王老师', '专注度高', '是', '报名半年班']
    ]
  },

  // ====== 餐饮专属表格 ======

  'customer-info-restaurant-sheet': {
    name: '餐饮客户信息表',
    headers: ['客户姓名', '联系电话', '人数', '偏好菜系', '消费频次', '平均消费', '会员等级', '最后到店日期', '备注'],
    exampleRows: [
      ['张三', '138xxxx1111', '4', '川菜', '每周2次', '200', '银卡', '2026-01-15', ''],
      ['李四', '139xxxx2222', '2', '日料', '每月1次', '500', '金卡', '2026-01-10', '过生日']
    ]
  },

  'daily-revenue-restaurant-sheet': {
    name: '餐饮日营收表',
    headers: ['日期', '堂食营收', '外卖营收', '总营收', '订单数', '客单价', '退单数', '备注'],
    exampleRows: [
      ['2026-01-15', '6500', '3200', '9700', '78', '124', '2', ''],
      ['2026-01-16', '7200', '2800', '10000', '82', '122', '1', '周末']
    ]
  },

  'inventory-restaurant-sheet': {
    name: '餐饮库存表',
    headers: ['食材名称', '类别', '当前库存', '单位', '保质期至', '采购价', '供应商', '备注'],
    exampleRows: [
      ['五花肉', '肉类', '25', 'kg', '2026-01-20', '18', 'XX肉业', ''],
      ['大米', '粮油', '150', 'kg', '2026-06-01', '4.5', 'XX粮油', '']
    ]
  },

  'supplier-restaurant-sheet': {
    name: '餐饮供应商表',
    headers: ['供应商', '联系人', '电话', '品类', '合作日期', '月采购额', '结算方式', '备注'],
    exampleRows: [
      ['XX肉业', '李总', '139xxxx', '肉类', '2025-03', '25000', '周结', ''],
      ['XX蔬菜', '王姐', '138xxxx', '蔬菜', '2025-06', '12000', '日结', '']
    ]
  },

  'employee-attendance-restaurant-sheet': {
    name: '餐饮员工考勤表',
    headers: ['姓名', '岗位', '日期', '上班', '下班', '工时', '考勤状态', '备注'],
    exampleRows: [
      ['张三', '厨师长', '2026-01-15', '08:00', '20:00', '12', '正常', ''],
      ['李四', '服务员', '2026-01-15', '10:00', '22:00', '12', '迟到10分钟', '']
    ]
  },

  'menu-gross-margin-sheet': {
    name: '菜品毛利率表',
    headers: ['菜品名称', '售价', '食材成本', '毛利', '毛利率', '销量', '毛利排名', '备注'],
    exampleRows: [
      ['宫保鸡丁', '38', '12', '26', '68.4%', '120', 'A', '爆款'],
      ['水煮鱼', '58', '22', '36', '62.1%', '85', 'B', ''],
      ['米饭', '3', '0.8', '2.2', '73.3%', '200', 'S', '引流']
    ]
  },

  'restaurant-food-cost-sheet': {
    name: '食材成本核算表',
    headers: ['菜品名称', '食材清单', '单项成本', '合计成本', '售价', '毛利率', '备注'],
    exampleRows: [
      ['宫保鸡丁', '鸡肉200g+花生50g+调料', '8+3+1', '12', '38', '68.4%', ''],
      ['麻婆豆腐', '豆腐300g+肉末50g+调料', '2+4+1', '7', '22', '68.2%', '']
    ]
  },

  'restaurant-turnover-sheet': {
    name: '翻台率统计表',
    headers: ['日期', '时段', '桌数', '接待人数', '翻台率', '平均用餐时长', '备注'],
    exampleRows: [
      ['2026-01-15', '午市', '20', '85', '4.25', '35分钟', ''],
      ['2026-01-15', '晚市', '20', '72', '3.60', '45分钟', '']
    ]
  },

  // ====== 教培专属表格 ======

  'customer-info-education-sheet': {
    name: '教培学员信息表',
    headers: ['学员姓名', '年龄', '联系电话', '家长姓名', '报读课程', '课时数', '剩余课时', '到期日期', '备注'],
    exampleRows: [
      ['小明', '8', '138xxxx1111', '张先生', '钢琴入门', '48', '36', '2026-07-01', ''],
      ['小红', '6', '139xxxx2222', '李女士', '舞蹈基础', '24', '18', '2026-06-15', '']
    ]
  },

  'daily-revenue-education-sheet': {
    name: '教培日营收表',
    headers: ['日期', '新招收入', '续费收入', '教材费', '总收入', '学员人数', '备注'],
    exampleRows: [
      ['2026-01-15', '5000', '3000', '200', '8200', '12', ''],
      ['2026-01-16', '3000', '4500', '150', '7650', '10', '']
    ]
  },

  'inventory-education-sheet': {
    name: '教培物料管理表',
    headers: ['物品名称', '类别', '库存量', '单位', '单价', '用途', '最后采购日期', '备注'],
    exampleRows: [
      ['钢琴教材', '教材', '50', '本', '45', '钢琴课', '2026-01-01', ''],
      ['舞蹈服', '服装', '20', '套', '120', '舞蹈课', '2025-12-15', '']
    ]
  },

  'supplier-education-sheet': {
    name: '教培供应商表',
    headers: ['供应商', '联系人', '电话', '品类', '合作日期', '月采购额', '备注'],
    exampleRows: [
      ['XX出版社', '王编辑', '138xxxx', '教材', '2025-06', '3000', ''],
      ['XX乐器行', '李经理', '139xxxx', '乐器', '2025-03', '8000', '']
    ]
  },

  'employee-attendance-education-sheet': {
    name: '教培员工考勤表',
    headers: ['姓名', '岗位', '日期', '上班', '下班', '课时数', '考勤状态', '备注'],
    exampleRows: [
      ['张老师', '钢琴教师', '2026-01-15', '09:00', '18:00', '8', '正常', ''],
      ['李老师', '舞蹈教师', '2026-01-15', '10:00', '20:00', '6', '正常', '']
    ]
  },

  'course-schedule-sheet': {
    name: '课程排课表',
    headers: ['日期', '时段', '课程名称', '授课教师', '教室', '学员人数', '状态', '备注'],
    exampleRows: [
      ['2026-01-15', '09:00-10:30', '钢琴入门', '张老师', '钢琴室1', '6', '已排', ''],
      ['2026-01-15', '10:30-12:00', '舞蹈基础', '李老师', '舞蹈室', '12', '已排', '']
    ]
  },

  'education-course-consumption-sheet': {
    name: '课时消耗统计表',
    headers: ['日期', '学员', '课程', '教师', '消耗课时', '剩余课时', '备注'],
    exampleRows: [
      ['2026-01-15', '小明', '钢琴入门', '张老师', '1', '35', ''],
      ['2026-01-15', '小红', '舞蹈基础', '李老师', '1', '17', '']
    ]
  },

  'education-renewal-sheet': {
    name: '续费管理表',
    headers: ['学员姓名', '课程', '到期日期', '剩余课时', '续费状态', '跟进人', '备注'],
    exampleRows: [
      ['小明', '钢琴入门', '2026-02-01', '4', '待跟进', '张老师', '提前2周联系'],
      ['小红', '舞蹈基础', '2026-01-20', '2', '已续费', '李老师', '续费季度班']
    ]
  },

  'member-education-sheet': {
    name: '会员管理表（教培）',
    headers: ['会员姓名', '会员等级', '入会日期', '累计消费', '剩余课时', '推荐人', '备注'],
    exampleRows: [
      ['张先生', '银卡', '2025-06-01', '12000', '20', '', '小明家长'],
      ['李女士', '金卡', '2025-03-15', '28000', '8', '', '小红家长']
    ]
  },

  'coach-performance-sheet': {
    name: '教师绩效表',
    headers: ['教师姓名', '课程', '课时数', '学员数', '续费率', '满意度', '绩效评分', '备注'],
    exampleRows: [
      ['张老师', '钢琴', '120', '30', '85%', '4.8', '92', ''],
      ['李老师', '舞蹈', '96', '48', '78%', '4.5', '88', '']
    ]
  },

  // ====== 美业专属表格 ======

  'customer-info-beauty-sheet': {
    name: '美业客户信息表',
    headers: ['客户姓名', '联系电话', '皮肤类型', '关注问题', '消费频次', '累计消费', '会员等级', '最后到店', '备注'],
    exampleRows: [
      ['王小姐', '138xxxx1111', '混合肌', '补水保湿', '每月2次', '8500', '银卡', '2026-01-15', ''],
      ['陈女士', '139xxxx2222', '敏感肌', '抗衰', '每周1次', '25000', '金卡', '2026-01-12', '']
    ]
  },

  'daily-revenue-beauty-sheet': {
    name: '美业日营收表',
    headers: ['日期', '到店人数', '成交人数', '营业额', '客单价', '新客数', '老客数', '备注'],
    exampleRows: [
      ['2026-01-15', '18', '12', '9600', '800', '5', '7', ''],
      ['2026-01-16', '22', '15', '12000', '800', '8', '7', '周末']
    ]
  },

  'inventory-beauty-sheet': {
    name: '美业产品库存表',
    headers: ['产品名称', '品牌', '库存量', '单位', '进价', '售价', '保质期', '备注'],
    exampleRows: [
      ['玻尿酸精华', 'XX品牌', '30', '瓶', '120', '380', '2027-06', ''],
      ['面膜', 'YY品牌', '200', '片', '8', '68', '2026-12', '']
    ]
  },

  'supplier-beauty-sheet': {
    name: '美业供应商表',
    headers: ['供应商', '联系人', '电话', '品类', '合作日期', '月采购额', '备注'],
    exampleRows: [
      ['XX美妆', '王经理', '138xxxx', '护肤品', '2025-06', '15000', ''],
      ['YY美容仪器', '李总', '139xxxx', '设备', '2025-03', '5000', '']
    ]
  },

  'employee-attendance-beauty-sheet': {
    name: '美业员工考勤表',
    headers: ['姓名', '岗位', '日期', '上班', '下班', '服务客户数', '营业额', '备注'],
    exampleRows: [
      ['张美容师', '美容师', '2026-01-15', '10:00', '20:00', '8', '6400', ''],
      ['李顾问', '前台顾问', '2026-01-15', '09:00', '18:00', '', '2000', '']
    ]
  },

  'beauty-acquisition-sheet': {
    name: '美业获客登记表',
    headers: ['日期', '客户姓名', '电话', '来源渠道', '体验项目', '是否成交', '备注'],
    exampleRows: [
      ['2026-01-15', '王小姐', '138xxxx', '抖音', '面部补水体验', '是', '购买季度卡'],
      ['2026-01-15', '陈女士', '139xxxx', '朋友介绍', '抗衰体验', '否', '考虑中']
    ]
  },

  'beauty-member-sheet': {
    name: '美业会员管理表',
    headers: ['会员姓名', '卡项', '开卡日期', '卡内余额/次数', '累计消费', '等级', '备注'],
    exampleRows: [
      ['王小姐', '季度护理卡', '2026-01-01', '10次', '5000', '银卡', ''],
      ['陈女士', '年度VIP卡', '2025-06-01', '¥8000', '25000', '金卡', '']
    ]
  },

  'beautician-performance-sheet': {
    name: '美容师绩效表',
    headers: ['美容师', '服务客户数', '营业额', '办卡数', '续卡率', '满意度', '绩效', '备注'],
    exampleRows: [
      ['张美容师', '60', '32000', '12', '85%', '4.8', '9500', ''],
      ['李美容师', '45', '25000', '8', '78%', '4.5', '7200', '']
    ]
  },

  'service-schedule-beauty-sheet': {
    name: '美业服务排班表',
    headers: ['日期', '时段', '美容师', '房间', '预约客户', '服务项目', '备注'],
    exampleRows: [
      ['2026-01-15', '10:00-11:30', '张美容师', 'VIP1', '王小姐', '面部补水', ''],
      ['2026-01-15', '14:00-16:00', '李美容师', 'VIP2', '陈女士', '抗衰护理', '']
    ]
  },

  'member-sheet': {
    name: '通用会员管理表',
    headers: ['会员姓名', '会员等级', '入会日期', '累计消费', '余额', '积分', '到期日期', '备注'],
    exampleRows: [
      ['张三', '银卡', '2025-06-01', '12000', '3000', '1500', '2026-06-01', ''],
      ['李四', '金卡', '2025-03-15', '28000', '8000', '5000', '2026-03-15', '']
    ]
  },

  'member-restaurant-sheet': {
    name: '餐饮会员管理表',
    headers: ['会员姓名', '电话', '会员等级', '开卡日期', '累计消费', '余额', '最近到店', '偏好菜品', '备注'],
    exampleRows: [
      ['张三', '138xxxx1111', '银卡', '2025-06-01', '8000', '500', '2026-01-15', '宫保鸡丁', ''],
      ['李四', '139xxxx2222', '金卡', '2025-03-15', '25000', '2000', '2026-01-12', '水煮鱼', '']
    ]
  },

  'project-consumption-sheet': {
    name: '美业项目消耗表',
    headers: ['日期', '客户姓名', '项目名称', '美容师', '消耗次数', '剩余次数', '金额', '备注'],
    exampleRows: [
      ['2026-01-15', '王小姐', '面部补水', '张美容师', '1', '9', '280', ''],
      ['2026-01-15', '陈女士', '抗衰护理', '李美容师', '1', '5', '580', '']
    ]
  },

  'package-pricing-sheet': {
    name: '套餐定价表',
    headers: ['套餐名称', '包含项目', '原价', '套餐价', '折扣', '适用人群', '有效期', '备注'],
    exampleRows: [
      ['新客体验套餐', '面部清洁+补水', '398', '198', '5折', '新客户', '开卡后30天', '限首次'],
      ['季度护理卡', '12次面部护理', '5800', '3980', '6.9折', '所有会员', '开卡后90天', '']
    ]
  },

  // ====== 营销推广表格 ======

  'marketing-activity-sheet': {
    name: '营销活动记录表',
    headers: ['日期', '活动名称', '投入金额', '带来线索', '到店人数', '成交单数', '成交额', 'ROI', '复盘总结'],
    exampleRows: [
      ['2026-01-15', '春节促销', '5000', '200', '80', '35', '28000', '460%', '活动效果好，到店率高'],
      ['2026-02-14', '情人节套餐', '3000', '150', '45', '18', '12600', '320%', '套餐受欢迎，但到店率偏低'],
      ['2026-03-08', '女神节特惠', '2000', '100', '30', '12', '7200', '260%', '折扣力度大，利润偏低']
    ]
  },

  'channel-comparison-sheet': {
    name: '渠道效果对比表',
    headers: ['渠道名称', '投入金额', '线索数量', '到店人数', '成交单数', '获客成本', '到店率', '成交率', 'ROI'],
    exampleRows: [
      ['抖音投放', '8000', '300', '90', '30', '267', '30.0%', '33.3%', '300%'],
      ['地推派单', '2000', '200', '40', '10', '200', '20.0%', '25.0%', '250%'],
      ['老客转介绍', '1500', '80', '60', '45', '33', '75.0%', '75.0%', '2000%'],
      ['美团团购', '5000', '400', '120', '35', '143', '30.0%', '29.2%', '400%']
    ]
  },

  'customer-retention-sheet': {
    name: '客户留存追踪表',
    headers: ['客户姓名', '首次消费日期', '最近消费日期', '消费次数', '消费总额', '平均间隔(天)', '流失预警', '最后跟进'],
    exampleRows: [
      ['张三', '2025-06-01', '2026-01-15', '18', '3600', '12', '正常', '2026-01-10'],
      ['李四', '2025-08-15', '2025-12-20', '5', '1200', '35', '预警', '2025-12-25'],
      ['王五', '2025-03-01', '2025-11-10', '12', '4800', '25', '沉睡', '2025-11-15']
    ]
  },

  'referral-tracking-sheet': {
    name: '转介绍效果追踪表',
    headers: ['推荐人', '被推荐人', '推荐日期', '联系方式', '试课/体验', '成交状态', '奖励金额', '发放状态'],
    exampleRows: [
      ['张三', '赵六', '2026-01-10', '138xxxx', '2026-01-12', '已成交', '200', '已发放'],
      ['李四', '钱七', '2026-01-15', '139xxxx', '2026-01-18', '待体验', '0', '未发放'],
      ['王五', '孙八', '2026-01-08', '137xxxx', '2026-01-10', '已成交', '200', '已发放']
    ]
  },

  'marketing-budget-sheet': {
    name: '营销预算执行表',
    headers: ['渠道/项目', '预算金额', '占比', '预期线索', '预期成交', '预期 ROI', '实际投入', '实际效果', '偏差'],
    exampleRows: [
      ['抖音投放', '10000', '35%', '300', '30', '300%', '9500', '28', '-5%'],
      ['地推派单', '4000', '15%', '200', '15', '250%', '4200', '18', '+5%'],
      ['转介绍激励', '5000', '20%', '100', '70', '500%', '5000', '80', '+14%'],
      ['体验活动', '4000', '15%', '80', '20', '400%', '3800', '22', '+10%'],
      ['社群运营', '2500', '10%', '50', '15', '350%', '2500', '12', '-20%'],
      ['内容制作', '1500', '5%', '-', '-', '-', '1500', '-', '-']
    ]
  },

  'promotion-profit-sheet': {
    name: '促销活动利润记录表',
    headers: ['活动名称', '原价', '折扣价', '毛利率', '单件原毛利', '单件折后毛利', '日均销量', '预计增量%', '保本增量', '活动利润'],
    exampleRows: [
      ['春节8折', '100', '80', '60%', '60', '40', '50', '60%', '75', '+1200/天'],
      ['满减50', '200', '150', '55%', '110', '72.5', '30', '40%', '38', '+450/天'],
      ['买一送一', '80', '40', '50%', '40', '0', '40', '150%', '80', '持平']
    ]
  }
}

// Spreadsheet engine handler
export async function spreadsheetEngine(toolConfig, formData) {
  const code = toolConfig.code
  const sheet = SPREADSHEETS[code]
  if (!sheet) {
    throw new Error(`未找到表格模板: ${code}`)
  }

  const sections = [
    { title: '表格结构', items: [`共 ${sheet.headers.length} 个字段`, `字段：${sheet.headers.join(' | ')}`] },
    { title: '示例数据', items: sheet.exampleRows.map(row => row.join(' | ')) },
    { title: '使用说明', items: [
      '点击下载按钮可导出 CSV 文件',
      'CSV 文件可用 Excel/WPS/Google Sheets 打开',
      '示例数据仅供参考，请根据实际情况填写'
    ]}
  ]

  let actions = []
  let riskNotes = []

  // 为 B1 工具添加特定的 actions 和 riskNotes
  if (code === 'customer-info-sheet') {
    actions = [
      { priority: 'critical', title: '统一客户信息收集字段', description: '确保线上线下数据一致，避免信息碎片化', owner: '运营', timeline: '本周内' },
      { priority: 'high', title: '建立客户标签体系', description: '按消费频次和金额分层管理，提升精准营销能力', owner: '店长', timeline: '本月内' }
    ]
    riskNotes = [
      '客户手机号、生日等敏感信息需获得客户授权才能收集',
      '建议定期清理无效客户数据，避免营销资源浪费'
    ]
  } else if (code === 'daily-revenue-sheet') {
    actions = [
      { priority: 'critical', title: '每日营业结束后 1 小时内完成营收数据录入', description: '确保数据及时性和准确性，便于当日复盘', owner: '收银员', timeline: '每日' },
      { priority: 'high', title: '建立日营收趋势图', description: '识别异常波动并分析原因，优化经营策略', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '日营收数据需包含现金、移动支付、会员卡等所有支付方式',
      '建议与 POS 系统数据交叉验证，避免手工录入错误'
    ]
  } else if (code === 'inventory-sheet') {
    actions = [
      { priority: 'critical', title: '建立库存盘点制度', description: '每周核对实际库存与系统数据，确保账实相符', owner: '仓管', timeline: '每周' },
      { priority: 'high', title: '设置库存预警线', description: '自动触发采购流程，避免缺货或积压', owner: '采购', timeline: '本月内' }
    ]
    riskNotes = [
      '库存数据需包含损耗、报损等调整项，避免账实不符',
      '建议定期清理呆滞库存，避免资金占用和过期损失'
    ]
  } else if (code === 'employee-attendance-sheet') {
    actions = [
      { priority: 'critical', title: '每日考勤数据当日录入', description: '确保薪资计算准确性，避免员工纠纷', owner: 'HR', timeline: '每日' },
      { priority: 'high', title: '分析考勤异常模式', description: '优化排班和管理制度，提升团队效率', owner: '店长', timeline: '每月' }
    ]
    riskNotes = [
      '考勤数据涉及员工隐私，需获得授权并妥善保管',
      '建议与薪资系统对接，避免手工录入错误影响员工收入'
    ]
  } else if (code === 'supplier-sheet') {
    actions = [
      { priority: 'critical', title: '建立供应商评估体系', description: '按质量、价格、服务维度打分，确保供应链稳定', owner: '采购', timeline: '本月内' },
      { priority: 'high', title: '设置供应商分级管理', description: '核心供应商签订长期合作协议，降低采购风险', owner: '店长', timeline: '本季度' }
    ]
    riskNotes = [
      '供应商信息涉及商业合作条款，需获得授权并保密处理',
      '建议定期评估供应商绩效，避免过度依赖单一供应商'
    ]
  } else if (code === 'daily-revenue-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '每日营业结束后及时录入美业营收数据', description: '包含项目、产品、服务分类，确保数据完整性', owner: '收银员', timeline: '每日' },
      { priority: 'high', title: '分析美业营收结构', description: '识别高毛利项目并重点推广，优化收入构成', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '美业营收需区分服务收入、产品销售、会员卡充值等不同类型',
      '建议与预约系统数据交叉验证，确保项目完成率和营收匹配'
    ]
  } else if (code === 'course-schedule-sheet') {
    actions = [
      { priority: 'critical', title: '建立课程排期标准化流程', description: '确保教室、教师、教材资源协调，避免冲突', owner: '教务', timeline: '本周内' },
      { priority: 'high', title: '分析课程排期利用率', description: '优化资源配置和排班效率，提高教室和教师使用率', owner: '运营', timeline: '每月' }
    ]
    riskNotes = [
      '课程排期涉及教师个人信息和课程安排，需获得授权并保密处理',
      '建议定期评估排期合理性，避免教室闲置或教师超负荷'
    ]
  } else if (code === 'member-education-sheet') {
    actions = [
      { priority: 'critical', title: '每日更新学员信息', description: '包含报名、上课、续费、转介绍状态，确保数据实时性', owner: '顾问', timeline: '每日' },
      { priority: 'high', title: '分析学员生命周期', description: '识别高价值学员并提供个性化服务，提升满意度和续费率', owner: '教务', timeline: '每周' }
    ]
    riskNotes = [
      '学员信息涉及个人隐私（姓名、电话、age等），需获得授权并符合数据保护法规',
      '建议与 CRM 系统对接，避免手工录入错误影响学员服务'
    ]
  } else if (code === 'restaurant-food-cost-sheet') {
    actions = [
      { priority: 'critical', title: '每日记录食材采购和消耗数据', description: '确保成本核算准确性，及时发现异常损耗', owner: '仓管', timeline: '每日' },
      { priority: 'high', title: '分析食材成本结构', description: '识别高损耗环节并优化，降低整体食材成本', owner: '厨师长', timeline: '每周' }
    ]
    riskNotes = [
      '食材成本数据涉及供应商价格信息，需获得授权并保密处理',
      '建议定期盘点实际库存，避免账实不符影响成本分析'
    ]
  } else if (code === 'restaurant-turnover-sheet') {
    actions = [
      { priority: 'critical', title: '每餐段结束后及时录入翻台数据', description: '包含桌号、用餐时长、客人数，确保数据完整性', owner: '收银员', timeline: '每餐段' },
      { priority: 'high', title: '分析翻台率与客单价的关系', description: '优化座位配置和套餐设计，平衡翻台效率与收入', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '翻台数据需区分不同座位类型（包间、散台、吧台），不同类型翻台标准不同',
      '建议与 POS 系统数据对接，确保翻台数据与营收数据匹配'
    ]
  } else if (code === 'service-schedule-sheet') {
    actions = [
      { priority: 'critical', title: '每日更新服务排期', description: '确保顾问、客户、项目时间协调，避免冲突', owner: '顾问', timeline: '每日' },
      { priority: 'high', title: '分析服务排期利用率', description: '优化顾问排班和项目安排，提高资源使用效率', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '服务排期涉及客户个人信息和预约时间，需获得授权并保密处理',
      '建议设置缓冲时间，避免顾问连续服务导致疲劳影响服务质量'
    ]
  } else if (code === 'reservation-sheet') {
    actions = [
      { priority: 'critical', title: '实时录入预约信息', description: '包含客户、时间、项目、备注，确保预约数据完整准确', owner: '前台', timeline: '实时' },
      { priority: 'high', title: '分析预约转化率', description: '优化预约提醒和确认流程，减少爽约率', owner: '运营', timeline: '每周' }
    ]
    riskNotes = [
      '预约信息涉及客户隐私（姓名、电话、预约项目），需获得授权并符合数据保护法规',
      '建议设置预约确认机制，减少爽约率对运营的影响'
    ]
  } else if (code === 'foot-traffic-sheet') {
    actions = [
      { priority: 'critical', title: '每小时统计客流量', description: '分析高峰低谷时段和客流来源，优化门店运营', owner: '店员', timeline: '每日' },
      { priority: 'high', title: '基于客流数据分析营销活动效果', description: '优化门店布局和人员配置，提升转化效率', owner: '运营', timeline: '每周' }
    ]
    riskNotes = [
      '客流量数据涉及门店运营敏感信息，需获得授权并保密处理',
      '建议结合转化率分析，避免只关注客流数量而忽视实际转化效果'
    ]
  } else if (code === 'trial-conversion-sheet') {
    actions = [
      { priority: 'critical', title: '实时录入试听学员信息', description: '包含试听时间、课程、反馈，确保数据完整准确', owner: '顾问', timeline: '实时' },
      { priority: 'high', title: '分析试听转化漏斗', description: '识别流失环节并优化跟进策略，提高招生转化率', owner: '教务', timeline: '每周' }
    ]
    riskNotes = [
      '试听信息涉及学员隐私（姓名、电话、试听课程），需获得授权并符合数据保护法规',
      '建议设置试听后24小时跟进机制，提高转化效率'
    ]
  } else if (code === 'customer-info-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '统一餐饮客户信息收集字段', description: '确保线上线下数据一致，避免信息碎片化', owner: '运营', timeline: '本周内' },
      { priority: 'high', title: '建立客户标签体系', description: '按消费频次、客单价、偏好进行分层管理，提升精准营销能力', owner: '店长', timeline: '本月内' }
    ]
    riskNotes = [
      '客户信息涉及个人隐私（姓名、电话、消费记录），需获得授权并符合数据保护法规',
      '建议定期清理无效客户数据，避免营销资源浪费'
    ]
  } else if (code === 'menu-gross-margin-sheet') {
    actions = [
      { priority: 'critical', title: '每日更新菜单毛利数据', description: '包含菜品销量、成本、毛利，确保数据及时准确', owner: '厨师长', timeline: '每日' },
      { priority: 'high', title: '分析高毛利菜品销售情况', description: '优化菜单结构和推广策略，提升整体盈利能力', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '菜单毛利数据需区分直接成本和间接成本，避免成本核算偏差',
      '建议结合客户反馈和销量数据，避免只关注毛利而忽视客户满意度'
    ]
  } else if (code === 'daily-revenue-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '每日营业结束后及时录入餐饮营收数据', description: '包含堂食、外卖、会员卡等分类，确保数据完整性', owner: '收银员', timeline: '每日' },
      { priority: 'high', title: '分析日营收趋势和结构', description: '识别高毛利时段和品类，优化经营策略', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '日营收数据涉及门店经营敏感信息，需获得授权并保密处理',
      '建议与 POS 系统数据交叉验证，避免手工录入错误影响经营决策'
    ]
  } else if (code === 'customer-info-education-sheet') {
    actions = [
      { priority: 'critical', title: '统一教培学员信息收集字段', description: '确保线上线下数据一致，避免信息碎片化', owner: '顾问', timeline: '本周内' },
      { priority: 'high', title: '建立学员标签体系', description: '按学习进度、续费意向、转介绍潜力分层管理，提升精准服务能力', owner: '教务', timeline: '本月内' }
    ]
    riskNotes = [
      '学员信息涉及个人隐私（姓名、电话、学习记录），需获得授权并符合数据保护法规',
      '建议定期清理无效学员数据，避免营销资源浪费'
    ]
  } else if (code === 'inventory-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '建立食材库存盘点制度', description: '每周核对实际库存与系统数据，确保账实相符', owner: '仓管', timeline: '每周' },
      { priority: 'high', title: '设置库存预警线', description: '自动触发采购流程避免缺货或积压', owner: '采购', timeline: '本月内' }
    ]
    riskNotes = [
      '库存数据涉及供应商价格信息，需获得授权并保密处理',
      '建议定期清理呆滞库存，避免资金占用和过期损失'
    ]
  } else if (code === 'inventory-education-sheet') {
    actions = [
      { priority: 'critical', title: '建立教材和教具库存盘点制度', description: '按课程、班级和校区核对领用记录，避免教材短缺或重复采购', owner: '教务', timeline: '每周' },
      { priority: 'high', title: '设置开班前库存预警线', description: '结合新班开课计划提前备货，保障招生和开课交付', owner: '运营', timeline: '每月' }
    ]
    riskNotes = [
      '教培库存需区分可复用教具和一次性教材，否则会高估实际消耗成本。',
      '教材库存与学员报名、退费和转班相关，建议与班级名单交叉核对。'
    ]
  } else if (code === 'supplier-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '建立核心食材供应商分级表', description: '按质量稳定性、到货准时率和账期条件评估供应风险', owner: '采购', timeline: '本月内' },
      { priority: 'high', title: '为关键品类准备备用供应商', description: '避免肉类、蔬菜、包装等关键物料因单一供应商导致断供', owner: '店长', timeline: '本季度' }
    ]
    riskNotes = [
      '供应商报价需结合损耗率、配送频次和账期一起看，不能只比较单价。',
      '食材供应数据涉及商业合作条款，应限制查看权限并定期更新。'
    ]
  } else if (code === 'supplier-education-sheet') {
    actions = [
      { priority: 'critical', title: '建立教材和教具供应商评估表', description: '按供货稳定性、版权合规、售后响应和账期条件评估合作质量', owner: '教务', timeline: '本月内' },
      { priority: 'high', title: '为核心课程准备备用供应商', description: '避免教材、乐器、耗材缺货影响招生交付和课程进度', owner: '运营', timeline: '本季度' }
    ]
    riskNotes = [
      '教培供应商需关注教材版权和教具安全合规，不能只比较采购价格。',
      '供应商联系人、报价和账期属于商业信息，应限制查看权限并定期复核。'
    ]
  } else if (code === 'employee-attendance-education-sheet') {
    actions = [
      { priority: 'critical', title: '每日核对教师考勤和实际课时', description: '确保薪资、课时费和绩效计算口径一致，减少结算争议', owner: 'HR', timeline: '每日' },
      { priority: 'high', title: '按岗位分析考勤异常和排课负荷', description: '识别教师超负荷、空档过多和班级调课问题，优化排班', owner: '教务', timeline: '每周' }
    ]
    riskNotes = [
      '教培考勤需同时核对到岗时间和授课课时，单看打卡可能无法反映真实工作量。',
      '考勤数据涉及员工隐私和薪资结算，应获得授权并限制访问范围。'
    ]
  } else if (code === 'daily-revenue-education-sheet') {
    actions = [
      { priority: 'critical', title: '每日营业结束后及时录入教培营收数据', description: '包含课程、产品、服务分类，确保数据完整性', owner: '收银员', timeline: '每日' },
      { priority: 'high', title: '分析日营收趋势和结构', description: '识别高毛利课程和时段，优化经营策略', owner: '校长', timeline: '每周' }
    ]
    riskNotes = [
      '日营收数据涉及机构经营敏感信息，需获得授权并保密处理',
      '建议与 CRM 系统数据交叉验证，避免手工录入错误影响经营决策'
    ]
  } else if (code === 'education-renewal-sheet') {
    actions = [
      { priority: 'critical', title: '建立续费预警表', description: '在课程结束前 2 个月开始跟进，避免流失', owner: '顾问', timeline: '本周内' },
      { priority: 'high', title: '分析续费流失原因', description: '优化教学服务和跟进话术，提升续费率', owner: '教务', timeline: '每月' }
    ]
    riskNotes = [
      '续费数据涉及学员合同和财务信息，需获得授权并保密处理',
      '建议结合学员出勤和成绩数据综合评估续费意向'
    ]
  } else if (code === 'education-course-consumption-sheet') {
    actions = [
      { priority: 'critical', title: '每日更新课时消耗和剩余课时', description: '确保预收款消耗、排课进度和学员权益同步，降低退费风险', owner: '教务', timeline: '每日' },
      { priority: 'high', title: '按班级分析消课速度', description: '识别消课过慢、缺勤过多和排课不足的班级，及时补排或跟进', owner: '班主任', timeline: '每周' }
    ]
    riskNotes = [
      '课时消耗数据会影响收入确认和退费测算，需与合同课时和实际出勤记录一致。',
      '只看已消耗课时可能忽略缺勤和补课压力，建议同步记录剩余课时和异常原因。'
    ]
  } else if (code === 'coach-performance-sheet') {
    actions = [
      { priority: 'critical', title: '统一教师绩效指标口径', description: '将课时数、学员数、续费率和满意度纳入同一张表，避免单一指标考核', owner: '教务', timeline: '本月内' },
      { priority: 'high', title: '按教师复盘续费和满意度差异', description: '提炼优秀教师方法，针对低绩效项安排培训和辅导', owner: '校长', timeline: '每月' }
    ]
    riskNotes = [
      '教师绩效不能只按课时数或营收考核，否则可能牺牲教学质量和续费体验。',
      '绩效数据涉及员工评价和薪酬依据，应保证数据来源透明并限制访问权限。'
    ]
  } else if (code === 'customer-info-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '统一客户皮肤档案和消费标签', description: '将皮肤类型、关注问题、到店频次和累计消费统一沉淀，支持精细化服务', owner: '顾问', timeline: '本周内' },
      { priority: 'high', title: '按会员等级和最近到店时间做分层跟进', description: '识别高价值客户、沉睡客户和高复购客户，制定不同触达策略', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '美业客户信息包含联系方式、皮肤状况和消费记录，需获得授权并限制访问范围。',
      '客户标签应定期更新，过期皮肤状态或消费偏好会影响服务推荐准确性。'
    ]
  } else if (code === 'inventory-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '建立产品库存和保质期预警', description: '按品牌、品类、保质期和库存量管理，避免过期和断货', owner: '仓管', timeline: '每周' },
      { priority: 'high', title: '结合项目消耗分析补货节奏', description: '用实际项目耗材和零售销量决定采购，减少高价产品积压', owner: '采购', timeline: '每月' }
    ]
    riskNotes = [
      '美业库存需区分服务耗材和零售产品，否则会影响项目毛利和商品销售判断。',
      '高价护肤品和仪器耗材存在保质期、批次和资质风险，应保留采购凭证和入库记录。'
    ]
  } else if (code === 'supplier-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '建立产品和仪器供应商分级表', description: '按资质、批次稳定性、售后响应和账期条件评估合作质量', owner: '采购', timeline: '本月内' },
      { priority: 'high', title: '为核心耗材准备备用供应商', description: '避免护肤品、仪器耗材和一次性用品断供影响服务交付', owner: '店长', timeline: '本季度' }
    ]
    riskNotes = [
      '美业供应商需重点核查产品资质、批次和授权文件，不能只比较采购价格。',
      '供应商报价、账期和返点属于商业敏感信息，应限制查看权限并定期复核。'
    ]
  } else if (code === 'employee-attendance-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '每日核对员工考勤和服务客户数', description: '确保出勤、排班、服务量和绩效结算口径一致', owner: '店长', timeline: '每日' },
      { priority: 'high', title: '按岗位分析排班空档和服务产出', description: '识别美容师、顾问和前台的空转时段，优化排班和预约承接', owner: '运营', timeline: '每周' }
    ]
    riskNotes = [
      '美业考勤需结合服务客户数和营业额判断，单看打卡时间无法反映真实产出。',
      '考勤与绩效数据涉及员工隐私和薪资结算，应获得授权并限制访问范围。'
    ]
  } else if (code === 'beauty-acquisition-sheet') {
    actions = [
      { priority: 'critical', title: '按来源渠道记录新客获客数据', description: '统一记录电话、渠道、体验项目和成交结果，判断渠道真实转化', owner: '顾问', timeline: '每日' },
      { priority: 'high', title: '每周复盘体验项目成交率', description: '识别高转化渠道和低转化体验项目，优化投放与接待流程', owner: '运营', timeline: '每周' }
    ]
    riskNotes = [
      '获客登记涉及客户电话和来源渠道，应获得授权并避免对外泄露。',
      '只记录是否成交会低估后续复购价值，建议同步追踪首次体验后的二次到店。'
    ]
  } else if (code === 'beauty-member-sheet') {
    actions = [
      { priority: 'critical', title: '每日更新会员卡项余额和剩余次数', description: '确保会员权益、预收负债和实际服务消耗一致', owner: '前台', timeline: '每日' },
      { priority: 'high', title: '按卡项和等级做会员分层运营', description: '识别高价值会员、低消耗会员和临近沉睡会员，制定跟进动作', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '会员余额和卡内次数属于财务敏感数据，应与收银系统交叉核对。',
      '会员累计消费不等同于可确认收入，预收未消耗部分仍存在退款和服务交付压力。'
    ]
  } else if (code === 'employee-attendance-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '每日核对餐饮员工考勤和班次', description: '把到岗时间、下班时间、工时和考勤状态统一记录，支撑薪资和排班复盘', owner: '店长/HR', timeline: '每日' },
      { priority: 'high', title: '按岗位复盘高峰人效', description: '结合厨师、服务员等岗位工时与营业时段，识别排班过密或人手不足问题', owner: '运营', timeline: '每周' }
    ]
    riskNotes = [
      '餐饮考勤不能只看打卡时间，还需结合午晚高峰、加班和临时调班记录判断真实工时。',
      '考勤数据涉及员工隐私和薪资结算，应限制查看权限并保留异常确认记录。'
    ]
  } else if (code === 'member-sheet') {
    actions = [
      { priority: 'critical', title: '统一会员基础台账', description: '把等级、累计消费、余额、积分和到期日期统一维护，避免会员权益口径不一致', owner: '运营', timeline: '本周内' },
      { priority: 'high', title: '建立会员分层跟进机制', description: '按消费金额、余额和到期时间识别高价值、沉睡和即将到期会员', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '会员余额、积分和累计消费属于客户权益数据，应与收银或 CRM 系统定期交叉核对。',
      '会员到期不等于自然流失，需结合最近消费时间和触达记录判断续费风险。'
    ]
  } else if (code === 'member-restaurant-sheet') {
    actions = [
      { priority: 'critical', title: '更新餐饮会员最近到店和偏好', description: '把最近到店、偏好菜品和余额同步维护，支撑复购和唤醒活动', owner: '前厅', timeline: '每日' },
      { priority: 'high', title: '按消费频次设计会员触达', description: '区分高频、低频、沉睡会员，分别推套餐、生日权益或老客回流活动', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '餐饮会员偏好来自历史消费，不应未经确认直接用于敏感标签或过度营销。',
      '余额和累计消费需区分充值、赠送和实际消费，否则会影响会员价值判断。'
    ]
  } else if (code === 'project-consumption-sheet') {
    actions = [
      { priority: 'critical', title: '每日记录项目消耗和剩余次数', description: '按客户、项目、美容师和消耗次数记录，确保卡项权益和服务交付一致', owner: '前台', timeline: '每日' },
      { priority: 'high', title: '复盘项目消耗速度', description: '识别低消耗、临期和高复购项目，安排提醒、加项或续卡跟进', owner: '顾问', timeline: '每周' }
    ]
    riskNotes = [
      '项目消耗会影响预收款确认和退款测算，必须与会员卡项、预约和实际服务记录一致。',
      '只看消耗次数可能忽略单次服务成本和客户满意度，建议同步记录服务反馈。'
    ]
  } else if (code === 'package-pricing-sheet') {
    actions = [
      { priority: 'critical', title: '核算套餐真实毛利', description: '在发布套餐前核对原价、套餐价、折扣、项目成本和有效期，避免低价亏损', owner: '运营/财务', timeline: '活动前' },
      { priority: 'high', title: '按人群设计套餐梯度', description: '区分新客体验、老客复购和高价值会员套餐，避免所有人使用同一折扣', owner: '店长', timeline: '本月内' }
    ]
    riskNotes = [
      '套餐折扣不能只看成交额，还要考虑项目耗材、人工时长和赠送权益成本。',
      '有效期过长会拉低客户回店频次，过短则可能引发客诉，应结合服务周期设置。'
    ]
  } else if (code === 'marketing-activity-sheet') {
    actions = [
      { priority: 'critical', title: '活动结束后完成漏斗复盘', description: '统一记录投入、线索、到店、成交和成交额，计算真实 ROI', owner: '运营', timeline: '活动后24小时' },
      { priority: 'high', title: '沉淀活动复盘结论', description: '把高转化渠道、低效素材和成交阻力写入复盘总结，作为下次预算依据', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '活动 ROI 需用成交额和毛利分别观察，只看销售额可能高估活动收益。',
      '线索数、到店数和成交数口径必须一致，否则无法判断是哪一环节掉量。'
    ]
  } else if (code === 'channel-comparison-sheet') {
    actions = [
      { priority: 'critical', title: '统一渠道漏斗口径', description: '每个渠道都按投入、线索、到店、成交、获客成本和 ROI 记录，便于横向比较', owner: '运营', timeline: '每周' },
      { priority: 'high', title: '按渠道质量调整预算', description: '优先加预算给低 CAC、高到店率、高成交率渠道，压缩低质量线索渠道', owner: '老板', timeline: '每月' }
    ]
    riskNotes = [
      '不同渠道线索质量差异大，不能只按获客成本判断优劣，还需看成交率和复购潜力。',
      '渠道 ROI 应明确是否包含人工、素材制作、平台服务费和奖励成本。'
    ]
  } else if (code === 'customer-retention-sheet') {
    actions = [
      { priority: 'critical', title: '每周更新客户最近消费和流失预警', description: '按消费次数、消费总额和平均间隔识别正常、预警和沉睡客户', owner: '运营', timeline: '每周' },
      { priority: 'high', title: '建立分层唤醒动作', description: '针对预警客户安排回访，针对沉睡客户设计老客权益或专属内容触达', owner: '店长', timeline: '每月' }
    ]
    riskNotes = [
      '客户留存需按行业消费周期设置预警线，不能用同一个天数判断所有业务。',
      '流失预警不等于客户已流失，需结合触达记录、满意度和消费场景判断。'
    ]
  } else if (code === 'referral-tracking-sheet') {
    actions = [
      { priority: 'critical', title: '跟踪转介绍全链路状态', description: '从推荐、体验、成交到奖励发放逐项记录，避免漏发或重复奖励', owner: '运营', timeline: '每日' },
      { priority: 'high', title: '复盘高质量推荐人', description: '识别持续带来成交的老客，设计专属感谢、权益或社群身份', owner: '店长', timeline: '每月' }
    ]
    riskNotes = [
      '转介绍奖励需提前明确发放条件，避免待体验、已成交、退款等状态引发争议。',
      '被推荐人联系方式属于个人信息，应获得授权后记录和跟进。'
    ]
  } else if (code === 'marketing-budget-sheet') {
    actions = [
      { priority: 'critical', title: '每周更新预算执行偏差', description: '对比预算金额、实际投入、预期成交和实际效果，及时发现超支或低效渠道', owner: '运营/财务', timeline: '每周' },
      { priority: 'high', title: '按效果滚动调整预算', description: '把预算从低转化渠道迁移到高质量线索和高成交渠道，保留内容制作基础投入', owner: '老板', timeline: '每月' }
    ]
    riskNotes = [
      '预算占比应与经营阶段匹配，新店获客和老店复购的预算结构不能简单套用。',
      '实际效果不能只填成交数，建议同步记录线索质量、到店率和退款情况。'
    ]
  } else if (code === 'promotion-profit-sheet') {
    actions = [
      { priority: 'critical', title: '活动前测算保本增量', description: '用原价、折扣价、毛利率和日均销量测算活动至少需要带来的增量销量', owner: '运营/财务', timeline: '活动前' },
      { priority: 'high', title: '活动后复盘利润而非只看销量', description: '对比折后单件毛利、增量销量和活动利润，判断促销是否真正赚钱', owner: '店长', timeline: '活动后24小时' }
    ]
    riskNotes = [
      '促销折扣会压缩单件毛利，销量提升不足时可能出现越卖越亏。',
      '活动利润应扣除赠品、平台佣金、人工加班和推广费用，不能只看商品毛利。'
    ]
  } else if (code === 'beautician-performance-sheet') {
    actions = [
      { priority: 'critical', title: '统一美容师绩效统计口径', description: '同时记录服务客户数、营业额、办卡数、续卡率和满意度，避免单项考核', owner: '店长', timeline: '本月内' },
      { priority: 'high', title: '复盘高绩效美容师的服务和销售动作', description: '提炼可复制话术和服务流程，辅导低绩效人员提升', owner: '运营', timeline: '每月' }
    ]
    riskNotes = [
      '美容师绩效不能只看营业额，否则可能诱导过度推销并损害复购。',
      '绩效数据涉及员工薪酬和评价，应保证来源透明并限制访问权限。'
    ]
  } else if (code === 'service-schedule-beauty-sheet') {
    actions = [
      { priority: 'critical', title: '每日核对预约客户、项目和房间资源', description: '避免美容师、房间和客户时间冲突，保障服务准时交付', owner: '前台', timeline: '每日' },
      { priority: 'high', title: '分析排班空档和高峰预约压力', description: '优化美容师班次、房间使用和项目时长安排，提高服务承接效率', owner: '店长', timeline: '每周' }
    ]
    riskNotes = [
      '服务排班包含客户姓名和预约项目，应保护客户隐私并限制查看范围。',
      '排班过满会压缩清洁、沟通和加项空间，可能影响体验和满意度。'
    ]
  }

  return {
    summary: `${sheet.name}已生成（${sheet.headers.length}个字段，${sheet.exampleRows.length}条示例）`,
    sections,
    actions,
    riskNotes,
    benchmarks: null,
    scores: null,
    recommendedTools: [],
    customizationCTA: '\n---\n如需针对您的具体场景做个性化定制方案，升级会员即可获得专属深度定制服务。',
    extra: {
      type: 'spreadsheet',
      sheetName: sheet.name,
      headers: sheet.headers,
      exampleRows: sheet.exampleRows
    }
  }
}

// CSV generation helper
export function generateCSV(sheetData) {
  const lines = []
  lines.push(sheetData.headers.join(','))
  for (const row of sheetData.exampleRows) {
    lines.push(row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  }
  return lines.join('\n')
}
