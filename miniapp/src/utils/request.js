// 基础配置 - 可通过环境变量覆盖
const BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://woyingai.com/api'
// const BASE_URL = 'http://localhost:3001/api' // 本地调试用

const REQUEST_TIMEOUT = 10000 // 10 秒超时

// 通用请求方法
export function request(options) {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    const url = `${BASE_URL}${options.url}`
    let settled = false

    const task = uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      success: (res) => {
        if (settled) return
        settled = true
        if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.reLaunch({ url: '/pages/login/index' })
          reject(new Error('登录已过期'))
          return
        }

        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          const msg = res.data?.message || '请求失败'
          uni.showToast({ title: msg.length > 20 ? '请求失败' : msg, icon: 'none' })
          reject(new Error(msg))
        }
      },
      fail: (err) => {
        if (settled) return
        settled = true
        uni.showToast({ title: '网络异常，请重试', icon: 'none' })
        reject(err)
      }
    })

    // 超时保护
    setTimeout(() => {
      if (settled) return
      settled = true
      task.abort()
      reject(new Error('请求超时'))
    }, REQUEST_TIMEOUT)
  })
}
