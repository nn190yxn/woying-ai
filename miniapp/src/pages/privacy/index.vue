<template>
  <view class="container">
    <view class="section">
      <text class="title">隐私政策</text>
      <text class="update">更新日期：2026年5月19日</text>
      <text class="update">生效日期：2026年5月19日</text>
    </view>

    <view class="section">
      <text class="subtitle">一、信息收集与使用</text>
      <text class="content">为向您提供服务，我们可能收集以下信息：</text>
      <text class="content">1. 手机号码：用于账号注册与登录验证</text>
      <text class="content">2. 验证码：用于身份验证（仅临时存储，验证后自动删除）</text>
      <text class="content">3. 昵称：用于展示您的用户身份（可选）</text>
      <text class="content">4. 使用记录：用于生成工具使用报告和优化服务体验</text>
    </view>

    <view class="section">
      <text class="subtitle">二、信息存储与保护</text>
      <text class="content">1. 我们采用 HTTPS 加密传输您的数据</text>
      <text class="content">2. 您的个人信息存储于安全服务器中</text>
      <text class="content">3. 我们不会向第三方出售或出租您的个人信息</text>
    </view>

    <view class="section">
      <text class="subtitle">三、权限使用说明</text>
      <text class="content">1. 位置权限：仅用于提供本地化经营建议，您可以拒绝</text>
      <text class="content">2. 拒绝权限不会影响核心功能使用</text>
    </view>

    <view class="section">
      <text class="subtitle">四、第三方服务</text>
      <text class="content">本小程序可能接入以下第三方服务：</text>
      <text class="content">1. 微信支付：用于处理会员订阅支付</text>
      <text class="content">2. 腾讯云：用于服务器托管与数据存储</text>
    </view>

    <view class="section">
      <text class="subtitle">五、用户权利</text>
      <text class="content">1. 您有权查看、修改您的个人信息</text>
      <text class="content">2. 您有权注销账号，注销后我们将删除您的个人信息</text>
      <text class="content">3. 如有疑问，请联系客服：support@woyingai.com</text>
    </view>

    <view class="section">
      <text class="subtitle">六、未成年人保护</text>
      <text class="content">我们不会在知情的情况下收集未成年人的个人信息。如您是未满 18 周岁的未成年人，请在监护人指导下使用本服务。</text>
    </view>

    <view class="section">
      <text class="subtitle">七、政策更新</text>
      <text class="content">我们可能适时更新本政策。更新后的政策将在小程序内公布，继续使用本服务即表示接受更新后的政策。</text>
    </view>
  </view>
</template>

<script setup>
</script>

<style scoped>
.container { padding: 30rpx; background: #f5f7fa; min-height: 100vh; }
.section { background: #fff; padding: 30rpx; border-radius: 16rpx; margin-bottom: 20rpx; }
.title { font-size: 36rpx; font-weight: bold; display: block; margin-bottom: 16rpx; }
.update { color: #999; font-size: 24rpx; display: block; margin-bottom: 8rpx; }
.subtitle { font-size: 30rpx; font-weight: bold; display: block; margin-bottom: 12rpx; }
.content { color: #333; font-size: 26rpx; line-height: 1.8; display: block; margin-bottom: 8rpx; }
</style>