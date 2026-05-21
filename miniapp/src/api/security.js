import { request } from '@/utils/request'

// 文本内容安全检测
export function checkTextSecurity(content) {
  return request({
    url: '/security/check-text',
    method: 'POST',
    data: { content }
  })
}

// 图片内容安全检测
export function checkImageSecurity(imageUrl) {
  return request({
    url: '/security/check-image',
    method: 'POST',
    data: { imageUrl }
  })
}