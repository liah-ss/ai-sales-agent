<script setup lang="ts">
import {
  BarChart3,
  ChartNoAxesCombined,
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  Files,
  History,
  Home,
  Inbox,
  Layers3,
  LogOut,
  Newspaper,
  Search,
  Tags,
} from '@lucide/vue'
import { computed, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { websiteContentSections } from '../../config/websiteContentNavigation'

const navItems = [
  { label: '数据统计', to: '/analytics', icon: ChartNoAxesCombined },
  { label: '产品库', to: '/products', icon: Boxes },
  { label: '产品分类', to: '/categories', icon: Tags },
  { label: '解决方案', to: '/solutions', icon: Layers3 },
  { label: '资讯管理', to: '/news', icon: Newspaper },
  { label: '交付案例', to: '/delivery-cases', icon: BriefcaseBusiness },
  { label: '询盘管理', to: '/inquiries', icon: Inbox },
  { label: '素材文件', to: '/files', icon: Files },
  { label: '操作日志', to: '/operation-logs', icon: History },
]

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const websiteExpanded = shallowRef(route.path.startsWith('/website'))
const websiteActive = computed(() => route.path.startsWith('/website'))

watch(() => route.path, (path) => {
  if (path.startsWith('/website')) websiteExpanded.value = true
})

async function logout() {
  authStore.logout()
  await router.replace({ name: 'login' })
}
</script>

<template>
  <div class="management-shell">
    <aside class="sidebar" aria-label="管理端导航">
      <RouterLink class="brand" to="/">
        <span class="brand-mark">Z</span>
        <span>
          <strong>ExampleCorp</strong>
          <small>官网超级管理后台</small>
        </span>
      </RouterLink>

      <nav class="sidebar-nav">
        <RouterLink to="/">
          <BarChart3 class="nav-icon" />
          <span>运营工作台简介</span>
        </RouterLink>

        <div class="sidebar-nav-group" :class="{ active: websiteActive }">
          <button
            class="sidebar-nav-parent"
            type="button"
            :aria-expanded="websiteExpanded"
            aria-controls="website-content-subnav"
            @click="websiteExpanded = !websiteExpanded"
          >
            <Home class="nav-icon" />
            <span>网站内容</span>
            <ChevronDown class="sidebar-nav-chevron" :class="{ expanded: websiteExpanded }" />
          </button>
          <div v-show="websiteExpanded" id="website-content-subnav" class="sidebar-subnav">
            <RouterLink v-for="item in websiteContentSections" :key="item.key" :to="item.to">
              <span>{{ item.label }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="workspace">
      <header class="topbar">
        <div>
          <span class="system-label">Super admin control</span>
          <strong>{{ authStore.user?.username ?? '官网内容与询盘运营' }}</strong>
        </div>
        <button class="ghost-button" type="button" @click="logout">
          <LogOut class="nav-icon" />
          <span>退出登录</span>
        </button>
      </header>

      <main class="workspace-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>
