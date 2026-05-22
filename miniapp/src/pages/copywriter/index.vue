<template>
  <view class="container">
    <view class="header">
      <text class="title">{{ pageTitle }}</text>
      <text class="desc">{{ pageDesc }}</text>
    </view>

    <view class="card">
      <!-- 朋友圈特有字段 -->
      <view v-if="type === 'moments'" class="form-group">
        <text class="label">使用场景</text>
        <input v-model="form.scene" class="input" placeholder="例如：新品上市、周末促销、日常种草" />
      </view>

      <!-- 抖音/小红书特有字段 -->
      <view v-if="type === 'douyin' || type === 'xhs'" class="form-group">
        <text class="label">内容主题</text>
        <input v-model="form.topic" class="input" placeholder="例如：如何挑选好茶叶、店里的日常" />
      </view>

      <view class="form-group">
        <text class="label">核心卖点 / 产品名称</text>
        <textarea v-model="form.highlight" class="textarea" placeholder="例如：自家果园直发，坏果包赔，9.9元一斤" maxlength="200" />
      </view>

      <button class="btn-generate" :loading="loading" @click="handleGenerate">
        {{ loading ? 'AI 生成中...' : '生成文案' }}
      </button>
    </view>

    <view class="result-card" v-if="resultText">
      <view class="result-header">
        <text class="result-title">生成结果</text>
        <view class="btn-copy-small" @click="copyResult">
          <text>复制</text>
        </view>
      </view>
      <text class="result-text">{{ resultText }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const type = ref('')
const loading = ref(false)
const resultText = ref('')

const form = reactive({
  scene: '',
  topic: '',
  highlight: ''
})

const pageTitle = computed(() => {
  if (type.value === 'moments') return '朋友圈文案'
  if (type.value === 'xhs') return '小红书文案'
  if (type.value === 'douyin') return '抖音文案'
  return '文案生成'
})

const pageDesc = computed(() => {
  if (type.value === 'moments') return '输入卖点，一键生成高转化朋友圈'
  return '输入主题，AI 帮你写爆款脚本和标题'
})

onLoad((options) => {
  if (options.type) {
    type.value = options.type
  }
})

async function handleGenerate() {
  if (!form.highlight) {
    uni.showToast({ title: '请填写核心卖点或产品', icon: 'none' })
    return
  }

  loading.value = true
  resultText.value = ''

  try {
    let url = ''
    let payload = {}

    if (type.value === 'moments') {
      url = '/generate/friend'
      payload.scene = form.scene || '当前业务'
      payload.highlight = form.highlight
      payload.type = '日常种草'
    } else {
      url = '/generate/script'
      payload.topic = form.topic || '未指定'
      payload.product = form.highlight
      payload.platform = type.value === 'xhs' ? '小红书' : '抖音'
      payload.videoType = '口播/图文'
    }

    const res = await request({ url, method: 'POST', data: payload })
    
    // 提取结果文本 (兼容多种后端返回结构)
    if (res.content) {
      resultText.value = res.content
    } else if (res.summary) {
      resultText.value = res.summary
    } else if (res.sections && Array.isArray(res.sections)) {
      resultText.value = res.sections
        .map(s => s.content || s.text || s.markdown || '')
        .filter(Boolean)
        .join('\n\n')
    } else if (res.result && typeof res.result === 'string') {
      resultText.value = res.result
    } else {
      resultText.value = '内容生成完成，请查看页面展示'
    }

  } catch (e) {
    uni.showToast({ title: e.message || '生成失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function copyResult() {
  uni.setClipboardData({
    data: resultText.value,
    success: () => uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
  })
}
</script>

<style scoped>
.container { padding: 30rpx; background: #f5f7fa; min-height: 100vh; }
.header { margin-bottom: 30rpx; }
.title { font-size: 40rpx; font-weight: bold; display: block; margin-bottom: 10rpx; }
.desc { color: #666; font-size: 26rpx; display: block; }

.card { background: #fff; padding: 30rpx; border-radius: 16rpx; margin-bottom: 30rpx; }
.form-group { margin-bottom: 30rpx; }
.label { font-size: 28rpx; font-weight: bold; display: block; margin-bottom: 16rpx; }
.input { background: #f8f9fa; padding: 20rpx; border-radius: 12rpx; font-size: 28rpx; border: 1rpx solid #eee; }
.textarea { background: #f8f9fa; padding: 20rpx; border-radius: 12rpx; font-size: 28rpx; border: 1rpx solid #eee; height: 150rpx; width: 100%; box-sizing: border-box; }
.btn-generate { background: #0e7490; color: #fff; margin-top: 10rpx; font-size: 32rpx; }

.result-card { background: #fff; padding: 30rpx; border-radius: 16rpx; }
.result-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.result-title { font-size: 30rpx; font-weight: bold; }
.btn-copy-small { background: #0e7490; color: #fff; padding: 6rpx 20rpx; border-radius: 20rpx; font-size: 24rpx; }
.result-text { font-size: 28rpx; line-height: 1.6; color: #333; white-space: pre-wrap; display: block; }
</style>