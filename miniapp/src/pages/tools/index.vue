<template>
  <view class="container">
    <view class="header">
      <text class="title">老板的 AI 文案工具箱</text>
      <text class="desc">每天一键生成，生意更轻松</text>
    </view>

    <view class="grid">
      <!-- 朋友圈 -->
      <view class="card moments" @click="goCopywriter('moments')">
        <view class="card-icon">🟢</view>
        <text class="card-title">朋友圈文案</text>
        <text class="card-desc">日常种草、促销、早安</text>
      </view>

      <!-- 小红书 -->
      <view class="card xhs" @click="goCopywriter('xhs')">
        <view class="card-icon">🔴</view>
        <text class="card-title">小红书文案</text>
        <text class="card-desc">爆款笔记、种草图文</text>
      </view>

      <!-- 抖音 -->
      <view class="card douyin" @click="goCopywriter('douyin')">
        <view class="card-icon">⚫</view>
        <text class="card-title">抖音文案</text>
        <text class="card-desc">短视频脚本、爆款标题</text>
      </view>
    </view>
  </view>
</template>

<script setup>
function goCopywriter(type) {
  const token = uni.getStorageSync('token')
  if (!token) return uni.navigateTo({ url: '/pages/login/index' })
  uni.navigateTo({ url: `/pages/copywriter/index?type=${type}` })
}
</script>

<style scoped>
.container { padding: 30rpx; background: #f5f7fa; min-height: 100vh; }
.header { margin-bottom: 40rpx; }
.title { font-size: 44rpx; font-weight: bold; display: block; margin-bottom: 10rpx; color: #1f2937; }
.desc { color: #6b7280; font-size: 28rpx; display: block; }

.grid { display: flex; flex-direction: column; gap: 30rpx; }
.card { background: #fff; padding: 40rpx; border-radius: 24rpx; display: flex; align-items: center; box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05); }
.card-icon { width: 100rpx; height: 100rpx; border-radius: 50%; background: #f3f4f6; font-size: 50rpx; display: flex; align-items: center; justify-content: center; margin-right: 30rpx; }
.card-title { font-size: 36rpx; font-weight: bold; display: block; margin-bottom: 8rpx; color: #111827; }
.card-desc { color: #6b7280; font-size: 26rpx; display: block; }

.moments .card-icon { background: #ecfdf5; color: #059669; }
.xhs .card-icon { background: #fef2f2; color: #dc2626; }
.douyin .card-icon { background: #f3f4f6; color: #111827; }
</style>