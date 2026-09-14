import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const viewSource = await readFile(new URL('./WebsiteConfigView.vue', import.meta.url), 'utf8')
const templateSource = await readFile(new URL('../components/website/ContentEditorPanel.vue', import.meta.url), 'utf8')
const homeSource = await readFile(new URL('../components/website/HomeSectionSorter.vue', import.meta.url), 'utf8')
const homeDefaultsSource = await readFile(new URL('../components/settings/HomeContentPanel.vue', import.meta.url), 'utf8')
const identitySource = await readFile(new URL('../components/settings/SiteIdentityPanel.vue', import.meta.url), 'utf8')
const shellSource = await readFile(new URL('../components/layout/ManagementShell.vue', import.meta.url), 'utf8')
const navigationSource = await readFile(new URL('../config/websiteContentNavigation.ts', import.meta.url), 'utf8')
const routerSource = await readFile(new URL('../router/index.ts', import.meta.url), 'utf8')
const clientSource = await readFile(new URL('../api/client.ts', import.meta.url), 'utf8')

const expectedSections = [
  ['home', '首页内容', '/website/home-content'],
  ['banner', '首页 Banner', '/website/banners'],
  ['site', '品牌与联系方式', '/website/identity'],
  ['product', '产品详情模板', '/website/product-template'],
  ['solution', '解决方案模板', '/website/solution-template'],
  ['about', '关于我们页', '/website/about'],
  ['contact', '联系我们页', '/website/contact'],
  ['faq', '帮助中心 FAQ', '/website/faq'],
]

test('website content navigation includes the configurable help center FAQ section', () => {
  const sectionRows = [...navigationSource.matchAll(/\{ key: '([^']+)', label: '([^']+)'.+?to: '([^']+)'/g)]
    .map(match => match.slice(1, 4))

  assert.deepEqual(sectionRows, expectedSections)
})

test('management shell exposes website content as an expandable first-level directory', () => {
  assert.match(shellSource, /<span>网站内容<\/span>/)
  assert.match(shellSource, /class="sidebar-nav-parent"/)
  assert.match(shellSource, /v-for="item in websiteContentSections"/)
  assert.match(shellSource, /class="sidebar-subnav"/)
})

test('website config follows the route and has no redundant internal section navigation', () => {
  assert.match(viewSource, /useRoute\(\)/)
  assert.match(viewSource, /websiteContentSections\.find\(section => section\.routeName === route\.name\)/)
  assert.doesNotMatch(viewSource, /config-tabs|tab-button|setActiveTab|内容管理边界|Word 导入队列/)
  assert.match(viewSource, /v-if="activeTab === 'home'"[\s\S]+?<HomeSectionSorter[\s\S]+?<HomeContentPanel/)
  assert.match(viewSource, /v-else-if="activeTab === 'site'"[\s\S]+?:settings="settings"/)
  assert.match(viewSource, /<FaqEditorPanel[\s\S]+?v-else-if="activeTab === 'faq'"/)
  assert.match(viewSource, /<header v-if="activeTab === 'about'" class="config-detail-toolbar">/)
  assert.match(viewSource, /v-else-if="activeTab !== 'banner'" class="website-section-heading"/)
  assert.match(viewSource, /activeSavePending \? '保存中\.\.\.' : '保存'/)
})

test('optimized website sections remove duplicated headers and keep focused editing navigation', () => {
  assert.doesNotMatch(homeSource, /按前台模块编辑|首页内容目录|选择一个模块后/)
  assert.doesNotMatch(homeSource, /当前编辑|activeGroupMeta/)
  assert.doesNotMatch(homeDefaultsSource, /主视觉、按钮和指标|当没有启用 Banner|默认展示字段/)
  assert.doesNotMatch(homeDefaultsSource, /当前编辑|activeGroupMeta/)
  assert.match(homeDefaultsSource, /<h2>首页默认内容<\/h2>/)
  assert.doesNotMatch(identitySource, /站点身份|这些配置会驱动|按官网位置编辑/)
  assert.doesNotMatch(identitySource, /当前编辑|activeGroupMeta/)
  assert.match(templateSource, /v-if="page\.key === 'about'" class="panel-header"/)
  assert.match(templateSource, /v-if="!isProductTemplate" class="home-module-sidebar"/)
  assert.match(templateSource, /class="page-template-editor" :class="\{ 'single-area': isProductTemplate \}"/)
  assert.doesNotMatch(templateSource, /新增模块/)
  assert.equal((templateSource.match(/<span>更换图片<\/span>/g) ?? []).length, 2)
})

test('router registers the new sections and keeps old links as redirects only', () => {
  assert.match(routerSource, /\.\.\.websiteContentSections\.map/)
  assert.match(routerSource, /path: 'website\/content', redirect: \{ name: 'website-home-content' \}/)
  assert.match(routerSource, /path: 'website\/home', redirect: \{ name: 'website-home-content' \}/)
  assert.match(routerSource, /path: 'settings', redirect: \{ name: 'website-identity' \}/)
})

test('solution template directs editors to one solution body instead of legacy chapter fields', () => {
  assert.match(templateSource, /方案正文/)
  assert.doesNotMatch(templateSource, /详细描述 \/ 痛点 \/ 参数/)
})

test('template hero uploads persist immediately and default previews resolve to the public site', () => {
  assert.match(viewSource, /async function uploadHeroImage[\s\S]+?await store\.uploadHeroImage\(key, file, token\)[\s\S]+?await store\.save\(token\)/)
  assert.match(clientSource, /LOCAL_FRONTEND_ASSET_URL = import\.meta\.env\.DEV \? 'http:\/\/127\.0\.0\.1:5173' : ''/)
  assert.match(clientSource, /url\.startsWith\('\/page-assets\/'\) \? LOCAL_FRONTEND_ASSET_URL/)
})
