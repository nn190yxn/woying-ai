import assert from 'node:assert/strict'
import test, { after } from 'node:test'

import {
  buildDiagnosisFallback,
  DIAGNOSIS_SCORING_VERSION
} from '../src/routes/douyinAgents.js'

after(() => {
  setImmediate(() => process.exit(process.exitCode || 0))
})

const lowTrafficCase = {
  industry: 'restaurant',
  mode: 'group-buy',
  interview: { goal: 'traffic', mainBottleneck: '播放只有几百，没人看到' },
  painPoints: {
    traffic: ['播放量长期低于 500'],
    content: ['更新频率低'],
    conversion: [],
    retention: [],
    ads: []
  },
  metrics: {
    weeklyPosts: 1,
    avgViewsPerVideo: 180,
    monthlyViews: 1200,
    monthlyFollowers: 5,
    monthlyInquiries: 2,
    monthlyConversions: 0,
    monthlyAdBudget: 0
  }
}

const highTrafficLowConversionCase = {
  industry: 'restaurant',
  mode: 'group-buy',
  interview: { goal: 'conversion', mainBottleneck: '播放不错但团购没人买' },
  painPoints: {
    traffic: [],
    content: [],
    conversion: ['有流量无转化', '团购核销率低'],
    retention: ['复购率低'],
    ads: ['投流 ROI 为负']
  },
  metrics: {
    weeklyPosts: 10,
    avgViewsPerVideo: 5200,
    monthlyViews: 180000,
    monthlyFollowers: 900,
    monthlyInquiries: 210,
    monthlyConversions: 9,
    monthlyAdBudget: 6000
  }
}

test('douyin diagnosis distinguishes low traffic from low conversion', () => {
  const lowTraffic = buildDiagnosisFallback(lowTrafficCase)
  const lowConversion = buildDiagnosisFallback(highTrafficLowConversionCase)

  assert.equal(lowTraffic.diagnosticProfile, '低播放冷启动型')
  assert.equal(lowTraffic.weakestDimension, 'traffic')
  assert.equal(lowConversion.diagnosticProfile, '流量转化漏损型')
  assert.equal(lowConversion.weakestDimension, 'conversion')
  assert.ok(lowConversion.radarData.traffic > lowTraffic.radarData.traffic)
  assert.ok(lowTraffic.radarData.conversion > lowConversion.radarData.conversion)
})

test('douyin diagnosis exposes scoring trace fields', () => {
  const result = buildDiagnosisFallback(highTrafficLowConversionCase)

  assert.equal(result.scoringVersion, DIAGNOSIS_SCORING_VERSION)
  assert.equal(result.dimensionDetails.length, 5)
  assert.equal(result.dimensionDetails[0].key, result.weakestDimension)
  assert.match(result.benchmarkSummary, /参考线/)
  assert.match(result.dimensionDetails[0].basis, /参考稳定线/)
})

test('douyin diagnosis treats explicit zero metrics as complete low values', () => {
  const result = buildDiagnosisFallback({
    industry: 'restaurant',
    mode: 'group-buy',
    metrics: {
      weeklyPosts: 0,
      avgViewsPerVideo: 0,
      monthlyViews: 0,
      monthlyFollowers: 0,
      monthlyInquiries: 0,
      monthlyConversions: 0,
      monthlyAdBudget: 0
    }
  })

  assert.equal(result.confidence, '高')
  assert.match(result.dataBasis[0], /7\/7/)
  assert.match(result.dataBasis[1], /月播放 0，单条均播 0/)
  assert.match(result.dataBasis[2], /发布 0 条/)
  assert.ok(Math.min(...Object.values(result.radarData)) <= 30)
})
