import { defineStore } from 'pinia'
import { computed, reactive, shallowRef } from 'vue'
import { getWebsiteConfig, parseWebsiteDocx, saveWebsiteConfig, uploadWebsiteImage } from '../api/websiteConfig'
import type { BannerCarouselSettings, BannerConfig, ContentBlock, ContentFormat, FaqCategory, FaqItem, FaqPageConfig, FeatureCard, HomeCategoryFallback, HomeProcurementMode, HomeProductFallback, HomeScenario, HomeSection, HomeSupplier, HomeText, HomeWhyChoose, HomeWhyChooseReason, ImportRecord, PageContentConfig, PlatformSellingPoint, SearchSettings } from '../types/websiteConfig'

const PUBLIC_SITE_ORIGIN = 'https://example.com'

function normalizeBannerLink(value: string) {
  const normalized = value.trim()
  if (!normalized) return `${PUBLIC_SITE_ORIGIN}/products`
  if (/^https:\/\//i.test(normalized)) return normalized
  if (/^http:\/\//i.test(normalized)) return `https://${normalized.slice('http://'.length)}`
  if (normalized.startsWith('/')) return `${PUBLIC_SITE_ORIGIN}${normalized}`
  if (normalized.startsWith('#')) return `${PUBLIC_SITE_ORIGIN}/${normalized}`
  return `${PUBLIC_SITE_ORIGIN}/${normalized}`
}

const defaultBanners: BannerConfig[] = [
  {
    id: 'banner-oil-transformer',
    title: 'Oil-Immersed Distribution Transformer',
    subtitle: 'MT-11 fully sealed transformer for stable medium and low-voltage power distribution.',
    imageUrl: '/banner-assets/oil-immersed-transformer-banner.png',
    linkUrl: 'https://example.com/products/oil-immersed-distribution-transformer',
    slot: 'desktop',
    enabled: true,
  },
  {
    id: 'banner-low-voltage-switchgear',
    title: 'Low-Voltage Complete Distribution Cabinets',
    subtitle: 'GEN-1 and GEN-2 switchgear cabinets for incoming lines, outgoing lines and reactive power compensation.',
    imageUrl: '/banner-assets/low-voltage-switchgear-banner.png',
    linkUrl: 'https://example.com/products/low-voltage-complete-distribution-cabinet',
    slot: 'desktop',
    enabled: true,
  },
  {
    id: 'banner-pv-box-substation',
    title: 'PV Box-type Step-up Substation',
    subtitle: 'YBM 10.5/0.8kV integrated PV substation for mountains, deserts and rooftop solar plants.',
    imageUrl: '/banner-assets/pv-box-substation-banner.png',
    linkUrl: 'https://example.com/products/pv-box-type-substation',
    slot: 'desktop',
    enabled: true,
  },
  {
    id: 'banner-smart-meter',
    title: 'Smart Energy Meter (AMI)',
    subtitle: 'Three-phase tariff-controlled smart meter with 4G, NB-IoT and LoRaWAN communication.',
    imageUrl: '/banner-assets/smart-meter-banner.png',
    linkUrl: 'https://example.com/products/smart-ami-meter',
    slot: 'desktop',
    enabled: true,
  },
]

const defaultFeatureCards: FeatureCard[] = [
  {
    id: 'feature-oem',
    icon: 'building',
    title: 'OEM/ODM Solutions',
    content: 'Tailored manufacturing, branding and engineering support for long-term electrical projects.',
    enabled: true,
  },
  {
    id: 'feature-certified',
    icon: 'badge',
    title: 'ISO & CE Certified',
    content: 'Factory-controlled production with internationally recognized quality and compliance standards.',
    enabled: true,
  },
  {
    id: 'feature-shipping',
    icon: 'package',
    title: 'Fast Global Shipping',
    content: 'Export-ready packing, documentation and stable delivery schedules for overseas buyers.',
    enabled: true,
  },
  {
    id: 'feature-support',
    icon: 'headphones',
    title: '24/7 Support',
    content: 'Responsive pre-sales, after-sales and technical communication across project stages.',
    enabled: true,
  },
]

const defaultPlatformSellingPoints: PlatformSellingPoint[] = [
  {
    id: 'platform-delivery',
    icon: 'globe',
    title: '一站式EPC解决',
    content: '统一负责，直连5000+知名工业设备厂家，通过集中采购为印尼买家提供高性价比的产品选择。',
    titleTranslations: {
      en: 'One-stop EPC solution',
      'zh-CN': '一站式EPC解决',
      id: 'Solusi EPC terpadu',
    },
    contentTranslations: {
      en: 'One accountable partner connecting buyers directly with 5,000+ established power equipment manufacturers, using consolidated procurement to deliver cost-effective product choices for Indonesian buyers.',
      'zh-CN': '统一负责，直连5000+知名工业设备厂家，通过集中采购为印尼买家提供高性价比的产品选择。',
      id: 'Satu pihak bertanggung jawab, menghubungkan pembeli langsung dengan 5.000+ produsen peralatan listrik ternama, serta menyediakan pilihan produk bernilai tinggi bagi pembeli Indonesia melalui pengadaan terpusat.',
    },
    enabled: true,
  },
  {
    id: 'platform-service',
    icon: 'headphones',
    title: '印尼本地化服务',
    content: '快速现场响应，总部/分部备件仓，本地安装指导与售后支持体系。',
    titleTranslations: {
      en: 'Localized service in Indonesia',
      'zh-CN': '印尼本地化服务',
      id: 'Layanan lokal Indonesia',
    },
    contentTranslations: {
      en: 'Rapid on-site response, spare-parts warehouses in Head Office and Branch Office, plus local installation guidance and after-sales support.',
      'zh-CN': '快速现场响应，总部/分部备件仓，本地安装指导与售后支持体系。',
      id: 'Respons cepat di lokasi, gudang suku cadang di Head Office dan Branch Office, serta panduan instalasi lokal dan dukungan purnajual.',
    },
    enabled: true,
  },
  {
    id: 'platform-certified',
    icon: 'shield',
    title: 'SNI&IEC标准',
    content: '国际质量体系认证，出口产品资料与合规文件齐全。',
    titleTranslations: {
      en: 'SNI & IEC standards',
      'zh-CN': 'SNI&IEC标准',
      id: 'Standar SNI & IEC',
    },
    contentTranslations: {
      en: 'International quality system certification with complete export product documentation and compliance files.',
      'zh-CN': '国际质量体系认证，出口产品资料与合规文件齐全。',
      id: 'Sertifikasi sistem mutu internasional dengan dokumentasi produk ekspor dan berkas kepatuhan yang lengkap.',
    },
    enabled: true,
  },
]

const defaultAboutBlocks: ContentBlock[] = [
  {
    id: 'about-company-intro',
    type: 'paragraph',
    title: '公司简介',
    body: '我们是一家专注于工业设备行业的垂直B2B采购平台。我们的使命是将产品选择、技术匹配、供应商协调、安装服务资源和售后规划整合到一个工作流程中，从而简化跨境采购。对于采购方而言，这意味着更少的沟通障碍和更快捷的对比；对于代理商和项目团队而言，这意味着更清晰的询价单、更结构化的产品方案和更透明的交付流程。\n\n我们的使命：让工业、基础设施、能源和商业项目的工业设备采购更便捷、更安全、更透明。',
  },
  {
    id: 'about-team-advantages',
    type: 'specs',
    title: '团队优势',
    body: '采购顾问: 将买方需求转化为可用于询价的产品清单、技术参数和比较维度。\n电气专家: 支持电压等级、容量、保护、耐腐蚀性和环境需求方面的场景匹配。\n供应商协调员: 协调制造商、安装合作伙伴和备件资源，以实现更可靠的交付。\n售后运营人员: 帮助明确保修范围、本地响应路径、备件包和服务文档。',
  },
  {
    id: 'about-supply-after-sales',
    type: 'specs',
    title: '供应链和售后能力',
    body: '合格的设备网络: 覆盖变压器、开关设备、电缆、电表、发电机、光伏设备和成套配电解决方案。\n文档支持: 帮助买家在发货前索取证书、测试报告、图纸、装箱单和交货单据。\n维护计划: 根据运行环境推荐备件、耗材和高故障风险部件。\n需求审查: 确认应用场景、负载、环境和合规性要求。\n供应商匹配: 比较产品包装、技术适配性和交付能力。\n订单协调: 跟踪生产、检验、物流和安装接口。\n售后支持: 准备好保修、备件和本地服务响应方案。',
  },
  {
    id: 'about-indonesia-delivery',
    type: 'paragraph',
    title: '印尼本地配送能力',
    body: '印尼项目经常面临高温、暴雨、沿海盐雾、高湿度和长途物流等挑战。我们的交付流程旨在帮助买家在下单前识别这些风险，然后匹配耐腐蚀产品选项、协调安装、推荐备件以及提供本地后续服务。\n\n本地情境感知：支持工业园区、港口、矿区、商业用地、数据中心和电动汽车充电项目。\n配送协调：协调物流、海关文件、现场交付要求和安装时间。\n风险提醒：重点关注盐雾、雨水渗入、过热降额、防雷和备件问题。',
  },
  {
    id: 'about-contact-cta',
    type: 'cta',
    title: '准备好讨论您下一个工业设备需求了吗？',
    body: '请分享您的应用场景、地点、环境以及预期交付时间表。我们的团队将协助您将其转化为一份符合询价要求的方案。',
  },
]

const defaultFaqConfig: FaqPageConfig = {
  eyebrow: '帮助中心 · ExampleCorp',
  title: '常见问题',
  accent: '解答',
  summary: '面向印尼工业设备采购的一站式 EPC 解决方案。',
  searchPlaceholder: '搜索常见问题',
  searchHint: '',
  allLabel: '全部',
  popularLabel: '热门',
  questionUnit: '个问题',
  emptyTitle: '未找到相关问题',
  emptyMessage: '换个关键词试试，或直接联系我们的工程师。',
  emptyAction: '咨询工程师',
  quickJumpLabel: '快速跳转',
  ctaTitle: '仍有疑问？提交您的需求',
  ctaBody: '描述您的应用场景与技术参数，平台工程师团队为您定制产品组合方案。',
  primaryAction: '提交需求',
  secondaryAction: '浏览产品库',
  primaryPath: '/contact',
  secondaryPath: '/products',
  translations: {},
  categories: [],
}

const defaultHomeWhyChoose: HomeWhyChoose = {
  title: '为什么选择 ExampleCorp',
  ctaText: '了解平台详情',
  titleTranslations: {
    en: 'Why choose ExampleCorp',
    'zh-CN': '为什么选择 ExampleCorp',
    id: 'Mengapa memilih ExampleCorp',
  },
  ctaTextTranslations: {
    en: 'Learn platform details',
    'zh-CN': '了解平台详情',
    id: 'Pelajari detail platform',
  },
  reasons: [
    {
      id: 'reason-ai-sourcing',
      number: '1',
      title: 'AI 智能采购',
      subtitle: '精准匹配，告别大海捞针',
      quote: '很多海外买家只知道哪里已是或环球资源，但痛点在于验证供应商是否真的有出口经验、认证和真实产能。',
      bullets: ['链接超过 500+ 经过验证的工业设备制造商', 'AI 根据应用场景、电压标准、起订量和预算匹配供应商'],
      titleTranslations: { en: 'AI-assisted sourcing', 'zh-CN': 'AI 智能采购', id: 'Sourcing berbantu AI' },
      subtitleTranslations: { en: 'Accurate matching across product categories', 'zh-CN': '精准匹配，告别大海捞针', id: 'Pencocokan akurat lintas kategori' },
      quoteTranslations: { en: 'Reduce supplier search time and avoid unverified overseas vendors.', 'zh-CN': '很多海外买家只知道哪里已是或环球资源，但痛点在于验证供应商是否真的有出口经验、认证和真实产能。', id: 'Kurangi waktu mencari pemasok dan hindari vendor yang belum terverifikasi.' },
      bulletTranslations: { en: ['Match application, voltage, MOQ and budget to pre-reviewed suppliers', 'Shorten sourcing time with direct factory quotes'], 'zh-CN': ['链接超过 500+ 经过验证的工业设备制造商', 'AI 根据应用场景、电压标准、起订量和预算匹配供应商'], id: ['Cocokkan aplikasi, tegangan, MOQ dan anggaran', 'Percepat sourcing dengan quote pabrik langsung'] },
      enabled: true,
    },
    {
      id: 'reason-factory-audit',
      number: '2',
      title: '工厂验厂与质检',
      subtitle: '实地验货，杜绝踩坑',
      quote: '我们对供应商进行实地考察，确保其产品质量和交期真实可靠。',
      bullets: ['实地工厂审计，核验生产线、ISO 认证和出口许可', '出货前检验，确认样品与批量产品一致'],
      titleTranslations: { en: 'Factory audit and inspection', 'zh-CN': '工厂验厂与质检', id: 'Audit pabrik dan inspeksi' },
      subtitleTranslations: { en: 'Verify capacity before order', 'zh-CN': '实地验货，杜绝踩坑', id: 'Verifikasi sebelum order' },
      quoteTranslations: { en: 'We inspect the supplier and confirm quality and delivery capability.', 'zh-CN': '我们对供应商进行实地考察，确保其产品质量和交期真实可靠。', id: 'Kami memeriksa pemasok dan memastikan kualitas serta kapasitas pengiriman.' },
      bulletTranslations: { en: ['Factory audit and certification check', 'Pre-shipment inspection and sample confirmation'], 'zh-CN': ['实地工厂审计，核验生产线、ISO 认证和出口许可', '出货前检验，确认样品与批量产品一致'], id: ['Audit pabrik dan sertifikasi', 'Inspeksi sebelum pengiriman dan konfirmasi sampel'] },
      enabled: true,
    },
    {
      id: 'reason-certification',
      number: '3',
      title: '全球认证前置服务',
      subtitle: '合规先行，一次通关',
      quote: '所有采购产品均符合国际标准，包括 CE、IEC、ISO 等认证。',
      bullets: ['欧盟、美国、中东和东南亚认证路线梳理', '支付定金前提供认证路线图，避免到港退运'],
      titleTranslations: { en: 'Certification front service', 'zh-CN': '全球认证前置服务', id: 'Layanan sertifikasi awal' },
      subtitleTranslations: { en: 'Compliance before shipment', 'zh-CN': '合规先行，一次通关', id: 'Patuh sebelum dikirim' },
      quoteTranslations: { en: 'Products are prepared around CE, IEC, ISO and regional requirements.', 'zh-CN': '所有采购产品均符合国际标准，包括 CE、IEC、ISO 等认证。', id: 'Produk disiapkan sesuai CE, IEC, ISO dan kebutuhan regional.' },
      bulletTranslations: { en: ['Route checks for EU, US, Middle East and Southeast Asia', 'Certification document package before delivery'], 'zh-CN': ['欧盟、美国、中东和东南亚认证路线梳理', '支付定金前提供认证路线图，避免到港退运'], id: ['Pemetaan sertifikasi EU, US, Timur Tengah dan Asia Tenggara', 'Dokumen sertifikasi sebelum pengiriman'] },
      enabled: true,
    },
    {
      id: 'reason-delivery',
      number: '4',
      title: 'DDP / EXW 双模式交付',
      subtitle: '灵活可控，端到端兜底',
      quote: '我们提供端到端订单管理，最大限度降低采购风险和总成本。',
      bullets: ['DDP 包含报关、海运、清关、关税缴纳和尾程配送', 'EXW 适合多工厂集中采购与二次集货'],
      titleTranslations: { en: 'DDP / EXW delivery modes', 'zh-CN': 'DDP / EXW 双模式交付', id: 'Mode pengiriman DDP / EXW' },
      subtitleTranslations: { en: 'Flexible and controllable', 'zh-CN': '灵活可控，端到端兜底', id: 'Fleksibel dan terkendali' },
      quoteTranslations: { en: 'Choose factory pickup or door-to-door managed delivery.', 'zh-CN': '我们提供端到端订单管理，最大限度降低采购风险和总成本。', id: 'Pilih pickup pabrik atau door-to-door managed delivery.' },
      bulletTranslations: { en: ['Export declaration, shipping, customs and final delivery', 'Lower internal logistics cost and supply-chain risk'], 'zh-CN': ['DDP 包含报关、海运、清关、关税缴纳和尾程配送', 'EXW 适合多工厂集中采购与二次集货'], id: ['Deklarasi ekspor, shipping, customs dan pengiriman akhir', 'Turunkan risiko logistik internal'] },
      enabled: true,
    },
    {
      id: 'reason-flexible-orders',
      number: '5',
      title: '低起订量与灵活订单',
      subtitle: '小单快反，降低试错门槛',
      quote: '我们提供低起订量、快速交付和全球运输服务。',
      bullets: ['样品单、试订单、批量单分阶段推进', '支持 OEM/ODM 定制、多语言说明书和本地化包装'],
      titleTranslations: { en: 'Low MOQ and flexible orders', 'zh-CN': '低起订量与灵活订单', id: 'MOQ rendah dan order fleksibel' },
      subtitleTranslations: { en: 'Samples, trial orders and batches', 'zh-CN': '小单快反，降低试错门槛', id: 'Sample, trial dan batch' },
      quoteTranslations: { en: 'Start small, validate compatibility, then scale.', 'zh-CN': '我们提供低起订量、快速交付和全球运输服务。', id: 'Mulai kecil, validasi kompatibilitas, lalu scale.' },
      bulletTranslations: { en: ['Sample order, trial order and bulk order paths', 'OEM/ODM labels, packaging and multilingual documents'], 'zh-CN': ['样品单、试订单、批量单分阶段推进', '支持 OEM/ODM 定制、多语言说明书和本地化包装'], id: ['Jalur sample, trial dan bulk order', 'Label OEM/ODM, packaging dan dokumen multibahasa'] },
      enabled: true,
    },
    {
      id: 'reason-after-sales',
      number: '6',
      title: '双轨售后维修体系',
      subtitle: '海外本地修 or 原厂返修',
      quote: '即使交付完成后，我们仍随时协助处理问题。',
      bullets: ['授权维修中心配备原厂备件，覆盖常见故障', '复杂故障可原厂返修并提供备用机方案'],
      titleTranslations: { en: 'After-sales repair network', 'zh-CN': '双轨售后维修体系', id: 'Jaringan after-sales' },
      subtitleTranslations: { en: 'Local repair or factory return', 'zh-CN': '海外本地修 or 原厂返修', id: 'Repair lokal atau kembali pabrik' },
      quoteTranslations: { en: 'Delivery does not end service. We help resolve faults quickly.', 'zh-CN': '即使交付完成后，我们仍随时协助处理问题。', id: 'Pengiriman bukan akhir layanan. Kami membantu menyelesaikan masalah.' },
      bulletTranslations: { en: ['Local authorized repair and spare parts', 'Factory return repair with backup plan'], 'zh-CN': ['授权维修中心配备原厂备件，覆盖常见故障', '复杂故障可原厂返修并提供备用机方案'], id: ['Repair lokal dan spare part', 'Return pabrik dengan rencana cadangan'] },
      enabled: true,
    },
  ],
}

const defaultSearchSettings: SearchSettings = {
  placeholder: '输入应用场景、设备需求或技术参数，如：工业园区配电改造...',
}

function readableFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function filePreviewUrl(file: File) {
  return URL.createObjectURL(file)
}

export const useWebsiteConfigStore = defineStore('website-config', () => {
  const homeSections = reactive<HomeSection[]>([
    {
      id: 'hero',
      name: '首页 Banner',
      anchor: 'home.hero',
      description: '首页第一屏轮播图和核心价值文案。',
      enabled: true,
    },
    {
      id: 'featured-products',
      name: 'Hot Products',
      anchor: 'home.featured_products',
      description: '首页第二顺序展示的重点产品和优先 SKU。',
      enabled: true,
    },
    {
      id: 'solutions',
      name: '解决方案',
      anchor: 'home.solutions',
      description: '行业场景和项目解决方案卡片。',
      enabled: true,
    },
    {
      id: 'about',
      name: '关于我们',
      anchor: 'home.about',
      description: '工厂能力、合作伙伴和质量保证内容。',
      enabled: true,
    },
    {
      id: 'inquiry',
      name: '询盘转化',
      anchor: 'home.inquiry',
      description: 'WhatsApp、邮箱和询盘入口。',
      enabled: true,
    },
  ])

  const banners = reactive<BannerConfig[]>(defaultBanners.map(banner => ({ ...banner })))
  const bannerCarousel = reactive<BannerCarouselSettings>({
    autoplay: true,
    intervalSeconds: 5,
  })
  const searchSettings = reactive<SearchSettings>({ ...defaultSearchSettings })
  const homeText = reactive<HomeText[]>([])
  const featureCards = reactive<FeatureCard[]>(defaultFeatureCards.map(card => ({ ...card })))
  const platformSellingPoints = reactive<PlatformSellingPoint[]>(defaultPlatformSellingPoints.map(point => ({ ...point })))
  const homeWhyChoose = reactive<HomeWhyChoose>({
    ...defaultHomeWhyChoose,
    titleTranslations: { ...defaultHomeWhyChoose.titleTranslations },
    ctaTextTranslations: { ...defaultHomeWhyChoose.ctaTextTranslations },
    reasons: defaultHomeWhyChoose.reasons.map(reason => ({ ...reason })),
  })
  const homeProcurementModes = reactive<HomeProcurementMode[]>([])
  const homeScenarios = reactive<HomeScenario[]>([])
  const homeSuppliers = reactive<HomeSupplier[]>([])
  const homeCategoryFallback = reactive<HomeCategoryFallback[]>([])
  const homeProductFallback = reactive<HomeProductFallback[]>([])

  const pages = reactive<PageContentConfig[]>([
    {
      key: 'product',
      label: 'Product center page',
      pagePath: '/products',
      headline: 'Power equipment product center',
      summary: 'Configure the product center hero image, page headline and product discovery entry.',
      heroImageUrl: '/page-assets/products-banner.jpg',
      format: 'technical',
      seoTitle: 'Premium power and electrical products',
      seoDescription: 'Browse certified products with technical specifications and project support.',
      importEnabled: false,
      imports: [],
      blocks: [],
    },
    {
      key: 'solution',
      label: 'Solutions page',
      pagePath: '/solutions',
      headline: 'Scenario-based solution publishing',
      summary: 'Configure the solutions page hero, left scenario directory, right-side solution content mapping and supplemental modules.',
      heroImageUrl: '/page-assets/solutions-banner.jpg',
      format: 'case-study',
      seoTitle: 'Power project solutions',
      seoDescription: 'Explore electrical and energy solutions for commercial and industrial projects.',
      importEnabled: true,
      imports: [],
      blocks: [],
    },
    {
      key: 'about',
      label: 'About us page',
      pagePath: '/about',
      headline: '针对特定场景采购的工业设备采购方案。',
      summary: 'ExampleCorp 为海外买家对接合格的工业设备制造商、工程服务合作伙伴和本地交付资源。',
      heroImageUrl: '/page-assets/about-banner.jpg',
      format: 'standard',
      seoTitle: '关于 ExampleCorp',
      seoDescription: '了解 ExampleCorp 的工业设备场景采购、供应链协调、售后支持和印尼本地配送能力。',
      importEnabled: false,
      imports: [],
      blocks: defaultAboutBlocks.map(block => ({ ...block })),
    },
    {
      key: 'contact',
      label: 'Contact us page',
      pagePath: '/contact',
      headline: 'Inquiry entry and sales contact information',
      summary: 'Configure contact form copy, WhatsApp, email, address, map image and response promise.',
      heroImageUrl: '/page-assets/contact-banner.jpg',
      format: 'landing',
      seoTitle: 'Contact ExampleCorp',
      seoDescription: 'Contact ExampleCorp for product quotation, project support and technical consultation.',
      importEnabled: false,
      imports: [],
      blocks: [],
    },
  ])
  const faq = reactive<FaqPageConfig>(normalizeFaq(defaultFaqConfig))

  const isLoading = shallowRef(false)
  const isSaving = shallowRef(false)
  const error = shallowRef('')
  const lastSavedAt = shallowRef('')

  const enabledHomeSections = computed(() => homeSections.filter(section => section.enabled).length)
  const enabledBanners = computed(() => banners.filter(banner => banner.enabled).length)
  const importQueueCount = computed(() => pages.reduce((total, page) => total + page.imports.length, 0))

  function replaceReactiveArray<T>(target: T[], source: T[]) {
    target.splice(0, target.length, ...source)
  }

  function normalizeBanners(source: BannerConfig[]) {
    const next = source.map(banner => ({
      ...banner,
      linkUrl: normalizeBannerLink(banner.linkUrl),
      titleTranslations: { ...(banner.titleTranslations ?? {}), 'zh-CN': banner.title },
      subtitleTranslations: { ...(banner.subtitleTranslations ?? {}), 'zh-CN': banner.subtitle },
    }))
    for (const fallback of defaultBanners) {
      if (!next.some(banner => banner.id === fallback.id)) next.push({
        ...fallback,
        titleTranslations: { 'zh-CN': fallback.title },
        subtitleTranslations: { 'zh-CN': fallback.subtitle },
      })
    }
    return next
  }

  function normalizeBannerCarousel(source?: Partial<BannerCarouselSettings>) {
    return {
      autoplay: source?.autoplay ?? true,
      intervalSeconds: Math.max(1, Number(source?.intervalSeconds ?? 5)),
    }
  }

  function normalizeSearchSettings(source?: Partial<SearchSettings>) {
    const placeholder = source?.placeholder?.trim() || defaultSearchSettings.placeholder
    return {
      placeholder,
      placeholderTranslations: { ...(source?.placeholderTranslations ?? {}), 'zh-CN': placeholder },
    }
  }

  function normalizeHomeText(source?: HomeText[]) {
    return (source ?? []).map(item => ({
      ...item,
      translations: { ...(item.translations ?? {}) },
    }))
  }

  function normalizeHomeSections(source: HomeSection[]) {
    const allowed = new Set(['hero', 'featured-products', 'solutions', 'about', 'inquiry'])
    const isLegacyOrder = source.some(section => section.id === 'trust') || !source.some(section => section.id === 'about')
    if (isLegacyOrder) return homeSections.map(section => ({ ...section }))
    const next = source.filter(section => allowed.has(section.id)).map(section => ({ ...section }))
    for (const fallback of homeSections) {
      if (!next.some(section => section.id === fallback.id)) next.push({ ...fallback })
    }
    return next
  }

  function normalizeFeatureCards(source?: FeatureCard[]) {
    const next = (source ?? []).map(card => ({ ...card }))
    for (const fallback of defaultFeatureCards) {
      if (next.length >= 4) break
      if (!next.some(card => card.id === fallback.id)) next.push({ ...fallback })
    }
    return next.slice(0, 4)
  }

  function normalizeFaq(source?: FaqPageConfig): FaqPageConfig {
    const next = source ?? defaultFaqConfig
    return {
      ...defaultFaqConfig,
      ...next,
      translations: Object.fromEntries(
        Object.entries(next.translations ?? {}).map(([locale, values]) => [locale, { ...(values ?? {}) }]),
      ),
      categories: (next.categories ?? []).map(category => ({
        ...category,
        titleTranslations: { ...(category.titleTranslations ?? {}) },
        items: (category.items ?? []).map(item => ({
          ...item,
          questionTranslations: { ...(item.questionTranslations ?? {}) },
          answerTranslations: { ...(item.answerTranslations ?? {}) },
        })),
      })),
    }
  }

  function normalizePlatformSellingPoints(source?: PlatformSellingPoint[]): PlatformSellingPoint[] {
    const fallbackById = new Map(defaultPlatformSellingPoints.map(point => [point.id, point]))
    const normalizePoint = (point: PlatformSellingPoint): PlatformSellingPoint => {
      const fallback = fallbackById.get(point.id)
      const title = point.title || point.titleTranslations?.['zh-CN'] || fallback?.title || ''
      const content = point.content || point.contentTranslations?.['zh-CN'] || fallback?.content || ''
      return {
        ...point,
        title,
        content,
        titleTranslations: {
          ...(fallback?.titleTranslations ?? {}),
          ...(point.titleTranslations ?? {}),
          'zh-CN': title,
        },
        contentTranslations: {
          ...(fallback?.contentTranslations ?? {}),
          ...(point.contentTranslations ?? {}),
          'zh-CN': content,
        },
      }
    }
    const next = (source ?? []).map(normalizePoint)
    for (const fallback of defaultPlatformSellingPoints) {
      if (!next.some(point => point.id === fallback.id)) next.push(normalizePoint({ ...fallback }))
    }
    return next
  }

  function normalizeHomeWhyChoose(source?: Partial<HomeWhyChoose>) {
    const nextReasons = (source?.reasons ?? []).map((reason) => {
      const fallback = defaultHomeWhyChoose.reasons.find(item => item.id === reason.id)
      return {
        ...reason,
        titleTranslations: { ...(fallback?.titleTranslations ?? {}), ...(reason.titleTranslations ?? {}) },
        subtitleTranslations: { ...(fallback?.subtitleTranslations ?? {}), ...(reason.subtitleTranslations ?? {}) },
        quoteTranslations: { ...(fallback?.quoteTranslations ?? {}), ...(reason.quoteTranslations ?? {}) },
        bulletTranslations: { ...(fallback?.bulletTranslations ?? {}), ...(reason.bulletTranslations ?? {}) },
      }
    })
    for (const fallback of defaultHomeWhyChoose.reasons) {
      if (!nextReasons.some(reason => reason.id === fallback.id)) nextReasons.push({ ...fallback })
    }
    return {
      ...defaultHomeWhyChoose,
      ...source,
      titleTranslations: { ...defaultHomeWhyChoose.titleTranslations, ...(source?.titleTranslations ?? {}) },
      ctaTextTranslations: { ...defaultHomeWhyChoose.ctaTextTranslations, ...(source?.ctaTextTranslations ?? {}) },
      reasons: nextReasons,
    }
  }

  function normalizeProcurementModes(source?: HomeProcurementMode[]) {
    return (source ?? []).map(mode => ({
      ...mode,
      steps: [...(mode.steps ?? [])],
      badgeTranslations: { ...(mode.badgeTranslations ?? {}) },
      titleTranslations: { ...(mode.titleTranslations ?? {}) },
      copyTranslations: { ...(mode.copyTranslations ?? {}) },
      stepTranslations: { ...(mode.stepTranslations ?? {}) },
      actionTranslations: { ...(mode.actionTranslations ?? {}) },
    }))
  }

  function normalizeScenarios(source?: HomeScenario[]) {
    return (source ?? []).map(scenario => ({
      ...scenario,
      titleTranslations: { ...(scenario.titleTranslations ?? {}) },
      copyTranslations: { ...(scenario.copyTranslations ?? {}) },
      demandTranslations: { ...(scenario.demandTranslations ?? {}) },
    }))
  }

  function normalizeSuppliers(source?: HomeSupplier[]) {
    return (source ?? []).map(supplier => ({
      ...supplier,
      nameTranslations: { ...(supplier.nameTranslations ?? {}) },
      badgeTranslations: { ...(supplier.badgeTranslations ?? {}) },
      scopeTranslations: { ...(supplier.scopeTranslations ?? {}) },
    }))
  }

  function normalizeCategoryFallback(source?: HomeCategoryFallback[]) {
    return (source ?? []).map(category => ({
      ...category,
      tags: [...(category.tags ?? [])],
      nameTranslations: { ...(category.nameTranslations ?? {}) },
      tagTranslations: { ...(category.tagTranslations ?? {}) },
    }))
  }

  function normalizeProductFallback(source?: HomeProductFallback[]) {
    return (source ?? []).map(product => ({
      ...product,
      nameTranslations: { ...(product.nameTranslations ?? {}) },
      tagTranslations: { ...(product.tagTranslations ?? {}) },
    }))
  }

  function normalizePages(source: PageContentConfig[]) {
    return source.map((page) => {
      const localizedPage = {
        ...page,
        headlineTranslations: { ...(page.headlineTranslations ?? {}), 'zh-CN': page.headline },
        summaryTranslations: { ...(page.summaryTranslations ?? {}), 'zh-CN': page.summary },
      }
      const normalizeBlock = (block: ContentBlock) => ({
        ...block,
        titleTranslations: { ...(block.titleTranslations ?? {}), 'zh-CN': block.title },
        bodyTranslations: { ...(block.bodyTranslations ?? {}), 'zh-CN': block.body },
      })
      if (page.key === 'about') {
        return {
          ...localizedPage,
          headline: page.headline?.trim() || '针对特定场景采购的工业设备采购方案。',
          summary: page.summary?.trim() || 'ExampleCorp 为海外买家对接合格的工业设备制造商、工程服务合作伙伴和本地交付资源。',
          seoTitle: page.seoTitle?.trim() || '关于 ExampleCorp',
          seoDescription: page.seoDescription?.trim() || '了解 ExampleCorp 的工业设备场景采购、供应链协调、售后支持和印尼本地配送能力。',
          imports: page.imports.map(record => ({ ...record })),
          blocks: defaultAboutBlocks.map((fallback) => {
            const current = page.blocks.find(block => block.id === fallback.id)
            return normalizeBlock(current ? { ...fallback, ...current } : { ...fallback })
          }),
        }
      }

      if (page.key !== 'product') {
        return {
          ...localizedPage,
          imports: page.imports.map(record => ({ ...record })),
          blocks: page.blocks.map(normalizeBlock),
        }
      }

      return {
        ...localizedPage,
        pagePath: '/products/:slug',
        format: 'technical' as ContentFormat,
        importEnabled: false,
        imports: [],
        blocks: [],
      }
    })
  }

  function snapshot() {
    return {
      homeSections: homeSections.map(section => ({ ...section })),
      banners: banners.map(banner => ({
        ...banner,
        titleTranslations: { ...(banner.titleTranslations ?? {}) },
        subtitleTranslations: { ...(banner.subtitleTranslations ?? {}) },
      })),
      bannerCarousel: { ...bannerCarousel },
      searchSettings: { ...searchSettings, placeholderTranslations: { ...(searchSettings.placeholderTranslations ?? {}) } },
      homeText: homeText.map(item => ({ ...item, translations: { ...item.translations } })),
      featureCards: featureCards.map(card => ({ ...card })),
      platformSellingPoints: platformSellingPoints.map(point => ({ ...point })),
      homeWhyChoose: {
        ...homeWhyChoose,
        titleTranslations: { ...homeWhyChoose.titleTranslations },
        ctaTextTranslations: { ...homeWhyChoose.ctaTextTranslations },
        reasons: homeWhyChoose.reasons.map(reason => ({ ...reason })),
      },
      homeProcurementModes: homeProcurementModes.map(mode => ({
        ...mode,
        steps: [...mode.steps],
        badgeTranslations: { ...mode.badgeTranslations },
        titleTranslations: { ...mode.titleTranslations },
        copyTranslations: { ...mode.copyTranslations },
        stepTranslations: { ...mode.stepTranslations },
        actionTranslations: { ...mode.actionTranslations },
      })),
      homeScenarios: homeScenarios.map(scenario => ({
        ...scenario,
        titleTranslations: { ...scenario.titleTranslations },
        copyTranslations: { ...scenario.copyTranslations },
        demandTranslations: { ...scenario.demandTranslations },
      })),
      homeSuppliers: homeSuppliers.map(supplier => ({
        ...supplier,
        nameTranslations: { ...supplier.nameTranslations },
        badgeTranslations: { ...supplier.badgeTranslations },
        scopeTranslations: { ...supplier.scopeTranslations },
      })),
      homeCategoryFallback: homeCategoryFallback.map(category => ({
        ...category,
        tags: [...category.tags],
        nameTranslations: { ...category.nameTranslations },
        tagTranslations: { ...category.tagTranslations },
      })),
      homeProductFallback: homeProductFallback.map(product => ({
        ...product,
        nameTranslations: { ...product.nameTranslations },
        tagTranslations: { ...product.tagTranslations },
      })),
      faq: normalizeFaq(faq),
      pages: normalizePages(pages),
    }
  }

  async function load(token: string) {
    isLoading.value = true
    error.value = ''
    try {
      const payload = await getWebsiteConfig(token)
      replaceReactiveArray(homeSections, normalizeHomeSections(payload.homeSections))
      replaceReactiveArray(banners, normalizeBanners(payload.banners))
      Object.assign(bannerCarousel, normalizeBannerCarousel(payload.bannerCarousel))
      Object.assign(searchSettings, normalizeSearchSettings(payload.searchSettings))
      replaceReactiveArray(homeText, normalizeHomeText(payload.homeText))
      replaceReactiveArray(featureCards, normalizeFeatureCards(payload.featureCards))
      replaceReactiveArray(platformSellingPoints, normalizePlatformSellingPoints(payload.platformSellingPoints))
      Object.assign(homeWhyChoose, normalizeHomeWhyChoose(payload.homeWhyChoose))
      replaceReactiveArray(homeProcurementModes, normalizeProcurementModes(payload.homeProcurementModes))
      replaceReactiveArray(homeScenarios, normalizeScenarios(payload.homeScenarios))
      replaceReactiveArray(homeSuppliers, normalizeSuppliers(payload.homeSuppliers))
      replaceReactiveArray(homeCategoryFallback, normalizeCategoryFallback(payload.homeCategoryFallback))
      replaceReactiveArray(homeProductFallback, normalizeProductFallback(payload.homeProductFallback))
      Object.assign(faq, normalizeFaq(payload.faq))
      replaceReactiveArray(pages, normalizePages(payload.pages))
    } catch {
      error.value = 'Unable to load website configuration.'
    } finally {
      isLoading.value = false
    }
  }

  async function save(token: string) {
    isSaving.value = true
    error.value = ''
    try {
      const payload = await saveWebsiteConfig(snapshot(), token)
      replaceReactiveArray(homeSections, normalizeHomeSections(payload.homeSections))
      replaceReactiveArray(banners, normalizeBanners(payload.banners))
      Object.assign(bannerCarousel, normalizeBannerCarousel(payload.bannerCarousel))
      Object.assign(searchSettings, normalizeSearchSettings(payload.searchSettings))
      replaceReactiveArray(homeText, normalizeHomeText(payload.homeText))
      replaceReactiveArray(featureCards, normalizeFeatureCards(payload.featureCards))
      replaceReactiveArray(platformSellingPoints, normalizePlatformSellingPoints(payload.platformSellingPoints))
      Object.assign(homeWhyChoose, normalizeHomeWhyChoose(payload.homeWhyChoose))
      replaceReactiveArray(homeProcurementModes, normalizeProcurementModes(payload.homeProcurementModes))
      replaceReactiveArray(homeScenarios, normalizeScenarios(payload.homeScenarios))
      replaceReactiveArray(homeSuppliers, normalizeSuppliers(payload.homeSuppliers))
      replaceReactiveArray(homeCategoryFallback, normalizeCategoryFallback(payload.homeCategoryFallback))
      replaceReactiveArray(homeProductFallback, normalizeProductFallback(payload.homeProductFallback))
      Object.assign(faq, normalizeFaq(payload.faq))
      replaceReactiveArray(pages, normalizePages(payload.pages))
      lastSavedAt.value = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date())
    } catch {
      error.value = 'Unable to save website configuration.'
    } finally {
      isSaving.value = false
    }
  }

  function moveSection(id: string, direction: -1 | 1) {
    const currentIndex = homeSections.findIndex(section => section.id === id)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= homeSections.length) return
    const [section] = homeSections.splice(currentIndex, 1)
    homeSections.splice(nextIndex, 0, section)
  }

  function reorderSection(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= homeSections.length || toIndex >= homeSections.length) return
    const [section] = homeSections.splice(fromIndex, 1)
    homeSections.splice(toIndex, 0, section)
  }

  function toggleSection(id: string) {
    const section = homeSections.find(item => item.id === id)
    if (section) section.enabled = !section.enabled
  }

  function updatePlatformSellingPoint(id: string, patch: Partial<PlatformSellingPoint>) {
    const point = platformSellingPoints.find(item => item.id === id)
    if (!point) return
    Object.assign(point, patch)
    if (typeof patch.title === 'string') {
      point.titleTranslations = { ...point.titleTranslations, 'zh-CN': patch.title }
    }
    if (typeof patch.content === 'string') {
      point.contentTranslations = { ...point.contentTranslations, 'zh-CN': patch.content }
    }
  }

  function movePlatformSellingPoint(id: string, direction: -1 | 1) {
    const currentIndex = platformSellingPoints.findIndex(point => point.id === id)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= platformSellingPoints.length) return
    const [point] = platformSellingPoints.splice(currentIndex, 1)
    platformSellingPoints.splice(nextIndex, 0, point)
  }

  function updateHomeWhyChoose(patch: Partial<HomeWhyChoose>) {
    Object.assign(homeWhyChoose, patch)
  }

  function updateHomeWhyChooseReason(id: string, patch: Partial<HomeWhyChooseReason>) {
    const reason = homeWhyChoose.reasons.find(item => item.id === id)
    if (reason) Object.assign(reason, patch)
  }

  function updateBanner(id: string, patch: Partial<BannerConfig>) {
    const banner = banners.find(item => item.id === id)
    if (!banner) return
    Object.assign(banner, patch)
    if (typeof patch.title === 'string') banner.titleTranslations = { ...(banner.titleTranslations ?? {}), 'zh-CN': patch.title }
    if (typeof patch.subtitle === 'string') banner.subtitleTranslations = { ...(banner.subtitleTranslations ?? {}), 'zh-CN': patch.subtitle }
  }

  function updateBannerCarousel(patch: Partial<BannerCarouselSettings>) {
    Object.assign(bannerCarousel, normalizeBannerCarousel({ ...bannerCarousel, ...patch }))
  }

  function updateSearchSettings(patch: Partial<SearchSettings>) {
    Object.assign(searchSettings, normalizeSearchSettings({ ...searchSettings, ...patch }))
  }

  function updateHomeText(key: string, patch: Partial<HomeText>) {
    const item = homeText.find(entry => entry.key === key)
    if (item) Object.assign(item, patch)
  }

  function updateHomeProcurementMode(id: string, patch: Partial<HomeProcurementMode>) {
    const mode = homeProcurementModes.find(item => item.id === id)
    if (mode) Object.assign(mode, patch)
  }

  function updateHomeScenario(id: string, patch: Partial<HomeScenario>) {
    const scenario = homeScenarios.find(item => item.id === id)
    if (scenario) Object.assign(scenario, patch)
  }

  function updateHomeSupplier(id: string, patch: Partial<HomeSupplier>) {
    const supplier = homeSuppliers.find(item => item.id === id)
    if (supplier) Object.assign(supplier, patch)
  }

  function updateHomeCategoryFallback(slug: string, patch: Partial<HomeCategoryFallback>) {
    const category = homeCategoryFallback.find(item => item.slug === slug)
    if (category) Object.assign(category, patch)
  }

  function updateHomeProductFallback(slug: string, patch: Partial<HomeProductFallback>) {
    const product = homeProductFallback.find(item => item.slug === slug)
    if (product) Object.assign(product, patch)
  }

  function updateFaq(patch: Partial<FaqPageConfig>) {
    Object.assign(faq, patch)
  }

  function updateFaqCategory(categoryId: string, patch: Partial<FaqCategory>) {
    const category = faq.categories.find(item => item.id === categoryId)
    if (category) Object.assign(category, patch)
  }

  function updateFaqItem(categoryId: string, itemId: string, patch: Partial<FaqItem>) {
    const item = faq.categories.find(category => category.id === categoryId)?.items.find(entry => entry.id === itemId)
    if (item) Object.assign(item, patch)
  }

  function addFaqItem(categoryId: string) {
    const category = faq.categories.find(item => item.id === categoryId)
    if (!category) return
    category.items.push({
      id: `faq-${categoryId}-${Date.now()}`,
      question: '新问题',
      answer: '填写问题解答。',
      questionTranslations: {},
      answerTranslations: {},
      popular: false,
      enabled: true,
    })
  }

  function removeFaqItem(categoryId: string, itemId: string) {
    const category = faq.categories.find(item => item.id === categoryId)
    if (!category) return
    category.items = category.items.filter(item => item.id !== itemId)
  }

  async function uploadBannerImage(id: string, file: File, token: string) {
    updateBanner(id, { imageUrl: filePreviewUrl(file) })
    const uploaded = await uploadWebsiteImage(file, token)
    updateBanner(id, { imageUrl: uploaded.url })
  }

  function addBanner() {
    banners.push({
      id: `banner-${Date.now()}`,
      title: 'New homepage banner',
      subtitle: 'Describe the buyer-facing message for this resource position.',
      titleTranslations: { 'zh-CN': '新首页 Banner' },
      subtitleTranslations: { 'zh-CN': '填写该资源位面向买家的展示文案。' },
      imageUrl: '',
      linkUrl: `${PUBLIC_SITE_ORIGIN}/products`,
      slot: 'desktop',
      enabled: false,
    })
  }

  function removeBanner(id: string) {
    const index = banners.findIndex(item => item.id === id)
    if (index >= 0) banners.splice(index, 1)
  }

  function updatePage(key: PageContentConfig['key'], patch: Partial<PageContentConfig>) {
    const page = pages.find(item => item.key === key)
    if (page) Object.assign(page, patch)
  }

  async function uploadHeroImage(key: PageContentConfig['key'], file: File, token: string) {
    updatePage(key, { heroImageUrl: filePreviewUrl(file) })
    const uploaded = await uploadWebsiteImage(file, token)
    updatePage(key, { heroImageUrl: uploaded.url })
  }

  function updateBlock(pageKey: PageContentConfig['key'], blockId: string, patch: Partial<ContentBlock>) {
    const page = pages.find(item => item.key === pageKey)
    const block = page?.blocks.find(item => item.id === blockId)
    if (block) Object.assign(block, patch)
  }

  function addBlock(pageKey: PageContentConfig['key']) {
    const page = pages.find(item => item.key === pageKey)
    if (!page) return
    page.blocks.push({
      id: `${pageKey}-block-${Date.now()}`,
      type: 'paragraph',
      title: 'New content block',
      body: 'Write the content that should appear on the public website.',
      titleTranslations: { 'zh-CN': '新内容模块' },
      bodyTranslations: { 'zh-CN': '填写需要展示在前台网站上的内容。' },
    })
  }

  function removeBlock(pageKey: PageContentConfig['key'], blockId: string) {
    const page = pages.find(item => item.key === pageKey)
    if (!page) return
    page.blocks = page.blocks.filter(block => block.id !== blockId)
  }

  async function uploadBlockImage(pageKey: PageContentConfig['key'], blockId: string, file: File, token: string) {
    updateBlock(pageKey, blockId, { type: 'image', body: filePreviewUrl(file) })
    const uploaded = await uploadWebsiteImage(file, token)
    updateBlock(pageKey, blockId, { type: 'image', body: uploaded.url })
  }

  async function addImportFiles(key: PageContentConfig['key'], files: File[], token: string) {
    const page = pages.find(item => item.key === key)
    if (!page) return

    const records: ImportRecord[] = []

    for (const file of files) {
      const record: ImportRecord = {
        id: `${key}-${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toUpperCase() || file.type || 'DOC',
        fileSize: readableFileSize(file.size),
        status: 'queued',
      }
      records.push(record)
      if (file.name.toLowerCase().endsWith('.docx')) {
        const parsed = await parseWebsiteDocx(file, token)
        record.status = 'ready'
        page.blocks.unshift(...parsed.blocks)
      }
    }

    page.imports.unshift(...records)
  }

  return {
    homeSections,
    banners,
    bannerCarousel,
    searchSettings,
    homeText,
    featureCards,
    platformSellingPoints,
    homeWhyChoose,
    homeProcurementModes,
    homeScenarios,
    homeSuppliers,
    homeCategoryFallback,
    homeProductFallback,
    faq,
    pages,
    isLoading,
    isSaving,
    error,
    lastSavedAt,
    enabledHomeSections,
    enabledBanners,
    importQueueCount,
    load,
    save,
    moveSection,
    reorderSection,
    toggleSection,
    updatePlatformSellingPoint,
    movePlatformSellingPoint,
    updateHomeWhyChoose,
    updateHomeWhyChooseReason,
    updateBanner,
    updateBannerCarousel,
    updateSearchSettings,
    updateHomeText,
    updateHomeProcurementMode,
    updateHomeScenario,
    updateHomeSupplier,
    updateHomeCategoryFallback,
    updateHomeProductFallback,
    updateFaq,
    updateFaqCategory,
    updateFaqItem,
    addFaqItem,
    removeFaqItem,
    uploadBannerImage,
    addBanner,
    removeBanner,
    updatePage,
    uploadHeroImage,
    addBlock,
    updateBlock,
    removeBlock,
    uploadBlockImage,
    addImportFiles,
  }
})
