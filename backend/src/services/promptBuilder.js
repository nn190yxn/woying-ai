export function buildJsonOutputInstruction(sections = []) {
  const sectionLabels = sections.length ? sections.join('、') : '生成结果'
  return [
    '优先输出 JSON 对象，不要添加解释性前缀。',
    'JSON 结构必须为：',
    '{"summary":"...","sections":[{"title":"标题","items":["..."]}],"actions":[{"priority":"high","title":"...","description":"..."}],"recommendedTools":["tool-code"]}',
    `sections 至少包含这些信息模块：${sectionLabels}`,
    '如果无法稳定输出 JSON，也必须直接输出完整内容，不要输出“好的”“以下是”等多余开场白。'
  ].join('\n')
}

export function buildStructuredPrompt({ role, goals = [], outputSections = [] }) {
  const lines = []
  lines.push(`你是${role}。`)
  if (goals.length) {
    lines.push('你的任务要求：')
    goals.forEach((goal, index) => {
      lines.push(`${index + 1}. ${goal}`)
    })
  }
  lines.push('')
  lines.push(buildJsonOutputInstruction(outputSections))
  return lines.join('\n')
}
