import { createApp } from 'vue'
import { i18n } from './composables/useI18n'
import { router } from './router'
import './style.css'
import SpaApp from './SpaApp.vue'
import LocalizedLink from './components/common/LocalizedLink.vue'
import { trackPageView } from './utils/analytics'

createApp(SpaApp).component('LocalizedLink', LocalizedLink).use(i18n).use(router).mount('#app')
router.afterEach((to) => trackPageView(to.fullPath))
void router.isReady().then(() => trackPageView(router.currentRoute.value.fullPath))
