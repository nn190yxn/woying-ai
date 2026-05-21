<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch((options) => {
  const ref = options?.query?.ref || ''
  if (ref) {
    uni.setStorageSync('ref_code', ref)
  }
})

onShow((options) => {
  const ref = options?.query?.ref || ''
  if (ref) {
    uni.setStorageSync('ref_code', ref)
  }
})

onHide(() => {
  // 页面隐藏，保持 ref 不清理
})
</script>

<style>
page {
  background-color: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
