import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '../components/layout/AppShell.vue'

const loadProductsView = () => import('../views/ProductsView.vue')
const loadContactView = () => import('../views/ContactView.vue')

export function prefetchPrimaryRoutes() {
  void loadProductsView()
  void loadContactView()
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:locale(id|en|zh-cn)?',
      component: AppShell,
      children: [
        { path: '', name: 'home', component: () => import('../views/HomeView.vue') },
        { path: 'products', name: 'products', component: loadProductsView },
        { path: 'products/:slug', name: 'product-detail', component: () => import('../views/ProductDetailView.vue') },
        { path: 'search', name: 'search-results', component: () => import('../views/SearchResultsView.vue') },
        { path: 'solutions', name: 'solutions', redirect: '/solutions/ev-charging-station' },
        { path: 'solutions/:slug', name: 'solution-detail', component: () => import('../views/SolutionDetailView.vue') },
        { path: 'delivery-cases', name: 'delivery-cases', component: () => import('../views/DeliveryCasesView.vue') },
        { path: 'delivery-cases/:slug', name: 'delivery-case-detail', component: () => import('../views/DeliveryCaseDetailView.vue') },
        { path: 'news', name: 'news', component: () => import('../views/NewsView.vue') },
        { path: 'news/:slug', name: 'news-detail', component: () => import('../views/NewsDetailView.vue') },
        { path: 'about', name: 'about', component: () => import('../views/AboutView.vue') },
        { path: 'contact', name: 'contact', component: loadContactView },
        { path: 'faq', name: 'faq', component: () => import('../views/FaqView.vue') },
        { path: 'privacy-policy', name: 'privacy-policy', component: () => import('../views/PrivacyPolicyView.vue') },
        { path: ':pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue') },
      ],
    },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
