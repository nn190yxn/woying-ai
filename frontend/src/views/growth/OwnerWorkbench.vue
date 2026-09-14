<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganizationStore } from '@/stores/organization'
import { listAcquisitionProjects, listSalesRecordings } from '@/api/growth'

const router = useRouter()
const organization = useOrganizationStore()
const projects = ref([])
const recordings = ref([])
onMounted(async () => {
  await organization.load()
  const config = { headers: organization.headers() }
  const [projectResponse, recordingResponse] = await Promise.all([listAcquisitionProjects(config), listSalesRecordings(config)])
  projects.value = projectResponse.projects || []
  recordings.value = recordingResponse.recordings || []
})
</script>

<template>
  <main class="owner-page">
    <header class="owner-header"><div><span class="eyebrow">本周经营工作台</span><h1>今天先推进一件最影响招生结果的事</h1><p>从招生和家长沟通记录中选一个主要问题，完成后再看结果。</p></div><span class="org-pill">{{ organization.currentOrganization?.name || '我的培训机构' }} · 校长</span></header>
    <section class="engine-grid">
      <article class="engine-card acquisition"><span class="engine-icon">↗</span><h2>看看招生问题出在哪</h2><p>填写主推课程、家长咨询、预约体验、到店和报名数据，确定本周最多两个优先动作。</p><button @click="router.push('/growth/acquisition')">填写本周招生数据</button></article>
      <article class="engine-card sales"><span class="engine-icon">◉</span><h2>复盘一次家长沟通</h2><p>回听课程顾问与家长的沟通，找到没有推进预约体验或报名的关键位置。</p><button class="secondary" @click="router.push('/growth/sales-coach')">复盘一段家长沟通</button></article>
    </section>
    <section class="stat-grid"><div><small>招生行动记录</small><strong>{{ projects.length }}</strong></div><div><small>家长沟通复盘</small><strong>{{ recordings.length }}</strong></div><div><small>本周经营状态</small><strong>待推进</strong></div><div><small>优先动作上限</small><strong>2</strong></div></section>
    <section class="next"><div class="section-title"><h2>本周先做</h2><span>一次只推进两个动作</span></div><div class="next-grid"><article><b>先找主要问题</b><p>确认家长主要停在咨询、预约体验、到店还是正价报名。</p></article><article><b>再复盘沟通依据</b><p>检查课程顾问是否讲清课程价值，并推进了下一次具体行动。</p></article><article><b>七天后看结果</b><p>登记咨询、到店和报名变化；没有改善或数据不足时请顾问确认。</p></article></div></section>
  </main>
</template>

<style scoped>
.owner-page{min-height:100vh;padding:42px clamp(20px,5vw,64px);background:#f5f3ec;color:#17231c}.owner-header{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;max-width:1280px;margin:auto}.eyebrow{color:#8b681e;font-size:11px;font-weight:800;letter-spacing:1px}.owner-header h1{font-size:32px;margin:10px 0 8px}.owner-header p{color:#6b756f}.org-pill{padding:10px 14px;border:1px solid #dce2dc;border-radius:99px;background:#fff;font-size:13px}.engine-grid,.stat-grid,.next{max-width:1280px;margin:28px auto 0}.engine-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.engine-card{padding:28px;border:1px solid #dce2dc;border-radius:18px;background:#fff;box-shadow:0 7px 22px rgba(27,54,38,.045)}.engine-card.acquisition{background:#dff1e5;border-color:#bfdac8}.engine-icon{font-size:24px}.engine-card h2{font-size:22px;margin:18px 0 8px}.engine-card p{color:#607067;line-height:1.7;max-width:520px}.engine-card button{border:0;border-radius:9px;background:#1e563a;color:#fff;padding:12px 16px;font-weight:700;cursor:pointer}.engine-card button.secondary{background:#fff;color:#214e37;border:1px solid #bdd0c2}.stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stat-grid>div,.next-grid article{background:#fff;border:1px solid #dce2dc;border-radius:13px;padding:16px}.stat-grid small{color:#778079}.stat-grid strong{display:block;font-size:25px;margin-top:8px}.section-title{display:flex;justify-content:space-between;align-items:center}.section-title h2{font-size:18px}.section-title span{font-size:12px;color:#8b681e}.next-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.next-grid p{font-size:13px;color:#6b756f;line-height:1.6}@media(max-width:800px){.owner-header,.engine-grid,.next-grid{display:block}.org-pill{display:inline-block;margin-top:18px}.engine-card,.next-grid article{margin-top:12px}.stat-grid{grid-template-columns:repeat(2,1fr)}}
</style>
