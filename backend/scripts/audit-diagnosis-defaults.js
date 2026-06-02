import {
  calculateDiagnosisScore
} from '../src/services/diagnosisEngine.js'
import {
  analyzeLoops,
  calculateFounderScore,
  calculateIPDiagnosis,
  calculateRentRatio
} from '../src/services/diagnosisEngineV3.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function runAudit() {
  const legacy = calculateDiagnosisScore('store-health', {})
  assert(legacy.overallScore === null, 'legacy diagnosis should not create an overall default score')
  assert(legacy.dimensionRank.every(dim => dim.score === null), 'legacy missing dimensions should stay null')
  assert(
    Object.values(legacy.dimensionScores).every(dim => dim.questionResults.every(q => q.source === 'missing')),
    'legacy missing questions should be marked as missing'
  )

  const founder = calculateFounderScore({})
  assert(founder.average === 0, 'founder empty input should average to 0 without fake defaults')
  assert(founder.completionRate === 0, 'founder empty input should have 0% completion')
  assert(
    Object.values(founder.scores).every(item => item.score === null && item.source === 'insufficient'),
    'founder empty ability scores should be insufficient'
  )

  const rent = calculateRentRatio({})
  assert(rent.rentPercent === null, 'rent empty input should not output a fake rent percent')
  assert(rent.laborPercent === null, 'rent empty input should not output a fake labor percent')
  assert(rent.maxScore === 0, 'rent empty input should not include missing fields in maxScore')

  const loops = analyzeLoops({})
  assert(loops.flywheel.weakest === null, 'empty scan should not produce a fake flywheel weakest item')
  assert(loops.ceiling.weakest === null, 'empty scan should not produce a fake ceiling weakest item')
  assert(
    [...loops.flywheel.items, ...loops.ceiling.items].every(item => item.score === null && item.source === 'insufficient'),
    'empty scan dimensions should be insufficient'
  )

  const ip = calculateIPDiagnosis({})
  assert(ip.totalScore === 0, 'empty IP diagnosis should have zero answered score')
  assert(ip.scorePercent === null, 'empty IP diagnosis should not output a fake score percent')
  assert(ip.recommendedForm.form === '暂不推荐', 'empty IP diagnosis should not recommend a concrete IP form')

  return {
    status: 'ok',
    checked: [
      'legacy diagnosis',
      'founder score',
      'rent ratio',
      'scan loops',
      'ip diagnosis'
    ]
  }
}

const result = runAudit()
console.log(JSON.stringify(result, null, 2))
