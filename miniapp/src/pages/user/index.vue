<template>
  <view class="container">
    <view class="header" @click="goLogin">
      <view class="avatar">{{ userInitial }}</view>
      <view class="info">
        <text class="name">{{ userInfo?.nickname || '未登录' }}</text>
        <text class="level">{{ memberText }}</text>
      </view>
    </view>

    <view class="menu">
      <view class="item" @click="goPage('/pages/membership/index')">
        <text>会员中心</text>
      </view>
      <view class="item" @click="goPage('/pages/referral/index')">
        <text>邀请返利</text>
      </view>
      <view class="item" @click="handleLogout">
        <text>退出登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

const userInfo = computed(() => userStore.state.userInfo)
const userInitial = computed(() => userInfo.value?.nickname?.[0] || '?')

const memberText = computed(() => {
  const map = { free: '免费版', starter: '初阶版', pro: '进阶版', annual: '高阶版' }
  return map[userInfo.value?.memberLevel] || '未登录'
})

function goLogin() { if (!userStore.isLoggedIn()) uni.navigateTo({ url: '/pages/login/index' }) }
function goPage(url) { uni.navigateTo({ url }) }

function handleLogout() {
  userStore.logout()
  uni.showToast({ title: '已退出' })
  setTimeout(() => uni.switchTab({ url: '/pages/home/index' }), 800)
}
</script>

<style scoped>
.container { padding: 30rpx; }
.header { display: flex; align-items: center; padding: 40rpx; background: #fff; border-radius: 16rpx; margin-bottom: 30rpx; }
.avatar { width: 100rpx; height: 100rpx; background: #0e7490; color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 24rpx; }
.name { font-size: 32rpx; font-weight: bold; display: block; }
.level { color: #0e7490; font-size: 24rpx; }
.menu { background: #fff; border-radius: 16rpx; }
.item { padding: 30rpx; border-bottom: 1rpx solid #eee; font-size: 28rpx; }
</style>
