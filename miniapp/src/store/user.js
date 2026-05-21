import { reactive } from 'vue'

const state = reactive({
  token: uni.getStorageSync('token') || '',
  userInfo: uni.getStorageSync('user') || null
})

let instance = null

export function useUserStore() {
  if (instance) return instance

  instance = {
    state,
    setToken(token) {
      state.token = token
      uni.setStorageSync('token', token)
    },
    setUserInfo(user) {
      state.userInfo = user
      uni.setStorageSync('user', user)
    },
    logout() {
      state.token = ''
      state.userInfo = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('user')
    },
    isLoggedIn() {
      return !!state.token
    }
  }

  return instance
}
