#!/usr/bin/env node
const fs = require('fs');
const http = require('http');

// 读取 .env
const env = {};
fs.readFileSync(process.argv[2] || './.env', 'utf-8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && k.trim() && !k.startsWith('#')) env[k.trim()] = v.join('=').trim();
});

const BASE = `http://127.0.0.1:${env.PORT || 3000}`;
const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1, phone: '13900000031', memberLevel: 'annual' }, env.JWT_SECRET || 'woying-secret', { expiresIn: '1h' });

const tests = [
  { name: '🎯 爆款标题', path: '/api/generate/headline', data: { keywords: '餐饮引流', platform: '抖音' }},
  { name: '📋 选题生成', path: '/api/generate/topic', data: { goals: ['acquisition'], contentTypes: ['talking'], platforms: ['douyin'], scenes: ['store'], duration: '30s', count: 5 }},
  { name: '💬 朋友圈文案', path: '/api/generate/friend', data: { scene: '周末促销', highlight: '新店开业八折', type: '日常种草' }},
  { name: '🎬 钩子文案', path: '/api/generate/hook', data: { topic: '餐饮提高复购', platform: '抖音' }},
  { name: '📹 短视频脚本', path: '/api/generate/script', data: { videoType: '口播', topic: '开店避坑', platform: '抖音', product: '餐饮' }},
  { name: '🎉 节日策划', path: '/api/generate/festival', data: { city: '上海', industry: '餐饮' }},
  { name: '🚀 裂变方案', path: '/api/generate/fission', data: { city: '北京', industry: '餐饮' }},
  { name: '📊 营销方案', path: '/api/generate/marketing-plan', data: { city: '杭州', industry: '餐饮' }},
];

function api(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'Content-Length': body.length }}, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(d) }); } catch(e) { resolve({ status: res.statusCode, data: d.substring(0,200) }); }});
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log(`🔍 AI 内测开始 | 模型: ${env.MCAI_LLM_MODEL}\n`);
  let p=0, f=0, w=0;
  for (const t of tests) {
    const start = Date.now();
    try {
      const r = await api(t.path, t.data);
      const elapsed = ((Date.now()-start)/1000).toFixed(1);
      if (r.status === 200 && r.data && !r.data.error) {
        const len = JSON.stringify(r.data).length;
        const degraded = r.data.degraded === true;
        let s = degraded ? '⚠️ 降级' : (len > 200 ? '✅ 完整' : '⚠️ 偏短');
        if (s.startsWith('✅')) p++; else if (s.startsWith('⚠️')) w++; else f++;
        console.log(`${t.name} ${s} | ${elapsed}s | ${len}ch`);
        if (r.data.summary) console.log(`  ${r.data.summary.substring(0,60)}...`);
      } else {
        f++;
        console.log(`${t.name} ❌ | ${elapsed}s | ${r.data.message || r.data.error || r.status}`);
      }
    } catch (e) {
      f++;
      console.log(`${t.name} ❌ | ${e.message}`);
    }
  }
  console.log(`\n📊 结果: ${p}通过 ${w}降级 ${f}失败 | 总计${tests.length}`);
})();
