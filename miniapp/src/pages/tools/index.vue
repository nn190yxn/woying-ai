<template>
  <view class="container">
    <view class="search-box">
      <input v-model="keyword" class="search" placeholder="搜索工具..." @confirm="onSearch" />
    </view>
    <view class="grid">
      <view class="tool" v-for="t in filteredTools" :key="t.name" @click="goTool(t)">
        <text class="tool-icon">{{ t.icon }}</text>
        <text class="tool-name">{{ t.name }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const keyword = ref('')

const tools = ref([
  { name: '经营测算', icon: '📊', code: 'calculator', url: '/pages/home/index' },
  { name: '行业诊断', icon: '🔍', code: 'diagnosis', url: '/pages/home/index' },
  { name: '内容生成', icon: '📝', code: 'content', url: '/pages/home/index' },
  { name: '老板IP', icon: '🎥', code: 'ip', url: '/pages/home/index' },
  { name: '抖音运营', icon: '🎵', code: 'douyin', url: '/pages/home/index' },
  { name: '小红书', icon: '📕', code: 'xhs', url: '/pages/home/index' }
])

const filteredTools = computed(() => {
  if (!keyword.value.trim()) return tools.value
  const kw = keyword.value.trim().toLowerCase()
  return tools.value.filter(t => t.name.toLowerCase().includes(kw))
})

function onSearch() {
  // 触发 computed 重新计算
}

function goTool(t) {
  const token = uni.getStorageSync('token')
  if (!token) return uni.navigateTo({ url: '/pages/login/index' })
  uni.navigateTo({ url: t.url })
}
</script>

<style scoped>
.container { padding: 20rpx; }
.search-box { margin-bottom: 30rpx; }
.search { background: #fff; padding: 20rpx; border-radius: 40rpx; font-size: 26rpx; }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx; }
.tool { background: #fff; padding: 30rpx; border-radius: 16rpx; text-align: center; }
.tool-icon { font-size: 40rpx; display: block; margin-bottom: 10rpx; }
.tool-name { font-size: 24rpx; }
</style>
