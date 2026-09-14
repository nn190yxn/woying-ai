<template>
  <main class="advisor-page">
    <header><div><p class="eyebrow">陪跑交付</p><h1>顾问工作台</h1></div><select v-model="selectedId" @change="loadSummary"><option value="">选择已分配机构</option><option v-for="org in organizations" :key="org.id" :value="org.id">{{ org.name }}</option></select></header>
    <p v-if="loading" class="state">正在加载…</p><p v-else-if="error" class="error">{{ error }}</p>
    <template v-else-if="summary">
      <section class="hero"><h2>{{ summary.organization.name }}</h2><p>{{ summary.organization.industry }} · {{ summary.organization.city || '城市未填写' }}</p></section>
      <div class="grid">
        <section><h3>获客摘要</h3><strong>{{ summary.acquisition.projects.length }}</strong><span>个项目</span><p>诊断 {{ summary.acquisition.diagnoses.length }} 次 · 数据快照 {{ summary.acquisition.snapshots.length }} 份</p></section>
        <section><h3>销售重点报告</h3><article v-for="item in summary.salesFocusReports.slice(0, 5)" :key="item.id">{{ item.scene }} · {{ item.score ?? '待评分' }}分 · {{ item.level || item.status }}</article><p v-if="!summary.salesFocusReports.length">暂无报告</p></section>
        <section><h3>服务节点</h3><article v-for="item in summary.service.touchpoints.slice(0, 8)" :key="item.id">{{ item.due_date }} · {{ item.touchpoint_type }} · {{ item.status }}</article><p v-if="!summary.service.touchpoints.length">暂无节点</p></section>
        <section><h3>Open 异常</h3><article v-for="item in summary.openAlerts" :key="item.id" class="alert">{{ item.title }}</article><p v-if="!summary.openAlerts.length">暂无异常</p></section>
        <section><h3>顾问记录</h3><article v-for="item in summary.consultantNotes.slice(0, 6)" :key="item.id">{{ item.content }}</article><p v-if="!summary.consultantNotes.length">暂无记录</p></section>
        <section><h3>阶段总结</h3><article v-for="item in summary.stageSummaries" :key="item.id"><b>{{ item.stage_code }}</b> {{ item.summary }}</article><form @submit.prevent="submitStage"><input v-model="stageCode" placeholder="阶段，如 day_30" maxlength="64" required><textarea v-model="stageText" placeholder="填写阶段总结" maxlength="4000" required></textarea><button>保存总结</button></form></section>
      </div>
    </template>
  </main>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { createAdvisorStageSummary, getAdvisorSummary, listAdvisorOrganizations } from '@/api/growth'
const organizations=ref([]), selectedId=ref(''), summary=ref(null), loading=ref(false), error=ref(''), stageCode=ref(''), stageText=ref('')
async function loadSummary(){ if(!selectedId.value){summary.value=null;return} loading.value=true;error.value='';try{summary.value=await getAdvisorSummary(selectedId.value)}catch(e){error.value=e.response?.data?.message||'加载失败'}finally{loading.value=false}}
async function submitStage(){await createAdvisorStageSummary(selectedId.value,{stageCode:stageCode.value,summary:stageText.value});stageCode.value='';stageText.value='';await loadSummary()}
onMounted(async()=>{try{const data=await listAdvisorOrganizations();organizations.value=data.organizations||[];if(organizations.value[0]){selectedId.value=organizations.value[0].id;await loadSummary()}}catch(e){error.value=e.response?.data?.message||'无权访问顾问工作台'}})
</script>
<style scoped>
.advisor-page{max-width:1180px;margin:auto;padding:40px 24px;color:#172033}header{display:flex;justify-content:space-between;align-items:end;margin-bottom:24px}h1{font-size:34px;margin:4px 0}.eyebrow{color:#56705a;margin:0;font-weight:700}select,input,textarea{border:1px solid #d7ddd7;border-radius:10px;padding:11px;background:white}.hero,section{background:#fff;border:1px solid #e5e9e5;border-radius:16px;padding:20px}.hero{margin-bottom:16px;background:#f3f7f1}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}section h3{margin-top:0}section strong{font-size:30px;margin-right:6px}article{padding:9px 0;border-bottom:1px solid #eef0ee}.alert{color:#a64735}form{display:grid;gap:9px;margin-top:14px}textarea{min-height:85px;resize:vertical}button{border:0;border-radius:10px;padding:11px;background:#263f2c;color:white}.error{color:#b42318}.state{color:#667085}@media(max-width:700px){header{align-items:start;gap:14px;flex-direction:column}.grid{grid-template-columns:1fr}}
</style>
