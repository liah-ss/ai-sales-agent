import { createRouter, createWebHistory } from 'vue-router'
import ManagementShell from '../components/layout/ManagementShell.vue'
import { useAuthStore } from '../stores/auth'
import { websiteContentSections } from '../config/websiteContentNavigation'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: ManagementShell,
      children: [
        { path: '', name: 'dashboard', component: () => import('../views/DashboardView.vue') },
        { path: 'products', name: 'products', component: () => import('../views/CatalogManageView.vue'), meta: { title: 'Products' } },
        { path: 'categories', name: 'categories', component: () => import('../views/CatalogManageView.vue'), meta: { title: 'Categories' } },
        { path: 'solutions', name: 'solutions', component: () => import('../views/CatalogManageView.vue'), meta: { title: 'Solutions' } },
        { path: 'news', name: 'news-management', component: () => import('../views/CatalogManageView.vue'), meta: { title: 'News' } },
        { path: 'delivery-cases', name: 'delivery-cases-management', component: () => import('../views/CatalogManageView.vue'), meta: { title: 'Delivery Cases' } },
        ...websiteContentSections.map(section => ({
          path: section.to.replace(/^\//, ''),
          name: section.routeName,
          component: () => import('../views/WebsiteConfigView.vue'),
          meta: { title: section.label, websiteSection: section.key },
        })),
        { path: 'website/content', redirect: { name: 'website-home-content' } },
        { path: 'website/home', redirect: { name: 'website-home-content' } },
        { path: 'settings', redirect: { name: 'website-identity' } },
        { path: 'inquiries', name: 'inquiries', component: () => import('../views/InquiryManageView.vue'), meta: { title: 'Inquiries' } },
        { path: 'files', name: 'files', component: () => import('../views/FileManageView.vue'), meta: { title: 'Files' } },
        { path: 'operation-logs', name: 'operation-logs', component: () => import('../views/OperationLogView.vue'), meta: { title: '操作日志' } },
        { path: 'analytics', name: 'analytics', component: () => import('../views/AnalyticsView.vue'), meta: { title: '数据统计' } },
      ],
    },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue'), meta: { public: true, title: 'Login' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/PlaceholderView.vue'), meta: { title: 'Not Found' } },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.bootstrap()

  if (to.meta.public) {
    if (to.name === 'login' && authStore.isAuthenticated) return { name: 'dashboard' }
    return true
  }

  if (!authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  return true
})
