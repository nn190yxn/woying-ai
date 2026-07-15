<template>
  <nav class="navbar">
    <div class="container-wide navbar-content">
      <router-link to="/" class="navbar-brand">
        <span class="brand-icon">赢</span>
        <span class="brand-text">我赢AI</span>
      </router-link>

      <div class="navbar-links" :class="{ active: menuOpen }">
        <router-link v-for="link in navLinks" :key="link.path" :to="link.path" class="nav-link" @click="menuOpen = false">
          {{ link.label }}
        </router-link>
        <div class="mobile-actions">
          <template v-if="userStore.isLoggedIn">
            <router-link to="/user" class="mobile-user-link" @click="menuOpen = false">
              <span class="user-avatar">{{ userStore.avatarText }}</span>
              <span>{{ userStore.nickname || '用户' }}</span>
            </router-link>
            <router-link
              v-if="userStore.isAdmin"
              to="/admin"
              class="btn btn-secondary"
              @click="menuOpen = false"
            >
              运营后台
            </router-link>
            <button class="btn btn-ghost" @click="handleLogout">退出登录</button>
          </template>
          <template v-else>
            <router-link to="/login" class="btn btn-secondary" @click="menuOpen = false">登录</router-link>
            <router-link to="/register" class="btn btn-primary" @click="menuOpen = false">免费注册</router-link>
          </template>
        </div>
      </div>

      <div class="navbar-actions">
        <template v-if="userStore.isLoggedIn">
          <div class="user-menu" @click="userMenuOpen = !userMenuOpen">
            <router-link to="/user" class="nav-link-user">
              <span class="user-avatar">{{ userStore.avatarText }}</span>
              <span class="user-name">{{ userStore.nickname || '用户' }}</span>
            </router-link>
            <div v-if="userMenuOpen" class="user-dropdown">
              <router-link to="/user" class="dropdown-item" @click="userMenuOpen = false">
                个人中心
              </router-link>
              <router-link
                v-if="userStore.isAdmin"
                to="/admin"
                class="dropdown-item"
                @click="userMenuOpen = false"
              >
                运营后台
              </router-link>
              <button class="dropdown-item" @click="handleLogout">
                退出登录
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="btn btn-secondary">登录</router-link>
          <router-link to="/register" class="btn btn-primary">免费注册</router-link>
        </template>
      </div>

      <button class="menu-toggle" @click="menuOpen = !menuOpen" aria-label="菜单">
        <span class="menu-icon" :class="{ open: menuOpen }"></span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const menuOpen = ref(false)
const userMenuOpen = ref(false)

const navLinks = [
  { label: '经营体检', path: '/douyin/diagnosis' },
  { label: '作战计划', path: '/douyin/quick-plan' },
  { label: '内容成交', path: '/douyin/script-generator' },
  { label: '数据复盘', path: '/douyin/video-diagnoser' },
  { label: '经营数据表', path: '/tools' },
  { label: '会员服务', path: '/membership' }
]

function handleLogout() {
  userStore.logout()
  userMenuOpen.value = false
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--nav-height);
  background-color: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--line-soft);
  backdrop-filter: blur(16px);
  z-index: 100;
}

.navbar-content {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-6);
  height: 100%;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-main);
  text-decoration: none;
  min-width: max-content;
}

.brand-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-weak));
  color: #fff;
  border-radius: var(--radius-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: 18px;
}

.brand-text {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-bold);
}

.navbar-links {
  display: inline-flex;
  align-items: center;
  justify-self: center;
  min-width: 0;
  gap: var(--space-1);
  padding: var(--space-1);
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-pill);
}

.nav-link {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-pill);
  position: relative;
  transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--brand-primary);
  background: var(--bg-card);
  box-shadow: var(--shadow-sm);
}

.nav-link.router-link-active::after {
  content: none;
}

.navbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  min-width: max-content;
}

.nav-link-user {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-main);
  text-decoration: none;
  min-height: var(--button-height-md);
  padding: var(--space-1) var(--space-2);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-pill);
  background: var(--bg-card);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background-color: var(--brand-primary);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-caption);
  font-weight: var(--font-weight-semibold);
}

.user-name {
  font-weight: var(--font-weight-medium);
}

.user-menu {
  position: relative;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: var(--space-2);
  background: var(--bg-card);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-panel);
  box-shadow: var(--shadow-md);
  min-width: 160px;
  padding: var(--space-1);
  z-index: 200;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-body-sm);
  color: var(--text-main);
  text-decoration: none;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.dropdown-item:hover {
  background: var(--bg-panel);
}

.menu-toggle {
  display: none;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-btn);
  background: var(--bg-card);
}

.mobile-actions {
  display: none;
}

.menu-icon {
  width: 20px;
  height: 2px;
  background-color: var(--text-main);
  position: relative;
  transition: all var(--duration-fast) var(--ease-out);
}

.menu-icon::before,
.menu-icon::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--text-main);
  transition: all var(--duration-fast) var(--ease-out);
}

.menu-icon::before { top: -6px; }
.menu-icon::after { top: 6px; }

.menu-icon.open {
  background-color: transparent;
}

.menu-icon.open::before {
  transform: rotate(45deg);
  top: 0;
}

.menu-icon.open::after {
  transform: rotate(-45deg);
  top: 0;
}

@media (max-width: 768px) {
  .navbar-content {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
  }

  .brand-text {
    font-size: var(--text-body-lg);
  }

  .navbar-links {
    position: fixed;
    top: var(--nav-height);
    left: 0;
    right: 0;
    background-color: var(--bg-card);
    flex-direction: column;
    align-items: stretch;
    justify-self: auto;
    padding: var(--space-4) var(--page-padding-mobile) var(--space-5);
    gap: var(--space-2);
    border: 0;
    border-bottom: 1px solid var(--line-soft);
    border-radius: 0;
    box-shadow: var(--shadow-md);
    transform: translateY(-100%);
    opacity: 0;
    pointer-events: none;
    transition: all var(--duration-normal) var(--ease-out);
  }

  .nav-link {
    display: flex;
    align-items: center;
    min-height: 44px;
    padding: var(--space-3) var(--space-4);
  }

  .navbar-links.active {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
  }

  .menu-toggle {
    display: flex;
  }

  .navbar-actions .btn {
    display: none;
  }

  .navbar-actions {
    display: none;
  }

  .mobile-actions {
    display: grid;
    gap: var(--space-3);
    padding-top: var(--space-4);
    margin-top: var(--space-2);
    border-top: 1px solid var(--line-soft);
  }

  .mobile-user-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: var(--space-2) var(--space-3);
    color: var(--text-main);
    background: var(--bg-panel);
    border: 1px solid var(--line-soft);
    border-radius: var(--radius-panel);
    font-weight: var(--font-weight-semibold);
  }
}
</style>
