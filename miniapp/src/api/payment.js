import { request } from '@/utils/request'

// 创建支付订单（小程序支付）
export function createMiniProgramOrder(planCode) {
  return request({
    url: '/payment/create-miniprogram-order',
    method: 'POST',
    data: { planCode }
  })
}

// 查询订单状态
export function getOrderStatus(orderId) {
  return request({ url: `/payment/order/${orderId}` })
}