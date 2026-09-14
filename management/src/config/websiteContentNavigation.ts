export const websiteContentSections = [
  { key: 'home', label: '首页内容', hint: '搜索、场景、推荐产品与首页默认内容', to: '/website/home-content', routeName: 'website-home-content' },
  { key: 'banner', label: '首页 Banner', hint: '首屏图片、标题与跳转', to: '/website/banners', routeName: 'website-banners' },
  { key: 'site', label: '品牌与联系方式', hint: '品牌、页头、页脚与联系方式', to: '/website/identity', routeName: 'website-identity' },
  { key: 'product', label: '产品详情模板', hint: '默认头图、标题与摘要', to: '/website/product-template', routeName: 'website-product-template' },
  { key: 'solution', label: '解决方案模板', hint: '目录、方案内容映射与顶部横幅', to: '/website/solution-template', routeName: 'website-solution-template' },
  { key: 'about', label: '关于我们页', hint: '公司能力与信任信息', to: '/website/about', routeName: 'website-about' },
  { key: 'contact', label: '联系我们页', hint: '表单文案与联系信息', to: '/website/contact', routeName: 'website-contact' },
  { key: 'faq', label: '帮助中心 FAQ', hint: '常见问题、分类与页面引导文案', to: '/website/faq', routeName: 'website-faq' },
] as const

export type WebsiteContentSectionKey = (typeof websiteContentSections)[number]['key']
