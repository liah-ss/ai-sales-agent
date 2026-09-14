<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, shallowRef, watch } from 'vue'
import {
  Award,
  Mic,
  Paperclip,
  Headphones,
  ShieldCheck,
  Activity,
  Cable,
  Gauge,
  PackageOpen,
  PanelsTopLeft,
  SlidersHorizontal,
  Sun,
  ToggleLeft,
  Wrench,
  Zap,
} from '@lucide/vue'
import { getCategories, getHome, getSolutions } from '../api/catalog'
import { createInquiry } from '../api/inquiries'
import { speechRealtimeUrl } from '../api/speech'
import ProductCard from '../components/product/ProductCard.vue'
import { useI18n, type Locale } from '../composables/useI18n'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'
import { localizeBannerForLocale, useLocalizedContent } from '../data/localizedContent'
import { resolveResponsiveAsset } from '../api/client'
import type { Banner, HomeResponse, ProductSummary, SolutionSummary } from '../types/catalog'
import type { CategoryTree } from '../api/catalog'
import HomeCategoryRail from '../components/home/HomeCategoryRail.vue'
import type { CategoryTile, CategoryVisualKey } from '../types/home'

const props = defineProps<{
  initialHome?: HomeResponse | null
  initialCategories?: CategoryTree[]
  initialSolutions?: SolutionSummary[]
  initialLocale?: Locale
}>()

interface CategoryMeta {
  icon: string
  sku: string
  tags: string[]
}

const OTHER_CATEGORY_SLUG = 'cat-974c77b543'

interface ProcurementMode {
  badge: string
  title: string
  copy: string
  steps: string[]
  action: string
  to: string
}

interface ScenarioCard {
  icon: string
  title: string
  copy: string
  demand: string
}

interface ReasonCard {
  number: string
  title: string
  subtitle: string
  quote: string
  bullets: string[]
}

interface SupplierCard {
  icon: string
  name: string
  badge: string
  scope: string
}

interface PlatformSellingPoint {
  icon: string
  title: string
  copy: string
}

interface HomeCopy {
  searchPlaceholder: string
  match: string
  hotScenes: string[]
  allCategories: string
  heroTitle: string
  heroSubtitle: string
  demandPlaceholder: string
  email: string
  phone: string
  submit: string
  attach: string
  voice: string
  listening: string
  voiceUnsupported: string
  voiceRequiresSecureContext: string
  voiceServiceUnavailable: string
  voiceTranscribeFailed: string
  emailRequired: string
  viewMore: string
  moreScenes: string
  moreCategories: string
  productCategories: string
  suppliers: string
  supplierSystem: string
  whyChoose: string
  platformDetail: string
  modeCards: ProcurementMode[]
  scenarios: ScenarioCard[]
  reasons: ReasonCard[]
  suppliersList: SupplierCard[]
  assurances: PlatformSellingPoint[]
  categoryFallback: Array<{ slug: string, name: string } & CategoryMeta>
  productFallback: Array<{ slug: string, name: string, tag: string, categorySlug: string, icon: string }>
  defaultName: string
  defaultCompany: string
}

const pageCopy: Record<Locale, HomeCopy> = {
  en: {
    searchPlaceholder: 'Enter application scenario, equipment demand or technical parameters, e.g. industrial park distribution upgrade...',
    match: 'Smart Match',
    hotScenes: ['PV station package', 'Factory distribution upgrade', 'Data center power', 'EV charging site', 'Smart grid retrofit'],
    allCategories: 'All product categories',
    heroTitle: 'Tell us your power application scenario',
    heroSubtitle: 'Our sourcing team matches the right equipment portfolio from demand intake to delivery.',
    demandPlaceholder: 'Describe your power demand, e.g. 315kVA transformer purchase, and leave phone or email so we can prepare a proposal...',
    email: 'Email',
    phone: 'Phone',
    submit: 'Submit requirement',
    attach: 'Attach file',
    voice: 'Voice input',
    listening: 'Listening...',
    voiceUnsupported: 'Voice input is not supported in this browser.',
    voiceRequiresSecureContext: 'Voice input requires HTTPS or localhost.',
    voiceServiceUnavailable: 'Speech transcription service is not configured.',
    voiceTranscribeFailed: 'Unable to transcribe voice. Please try again.',
    emailRequired: 'Please leave your email so we can respond to your requirement.',
    viewMore: 'View more',
    moreScenes: 'More scenarios',
    moreCategories: 'More',
    productCategories: 'Product categories',
    suppliers: 'Strategic partner suppliers',
    supplierSystem: 'View supply chain system',
    whyChoose: 'Why choose ExampleCorp',
    platformDetail: 'Learn platform details',
    defaultName: 'Homepage visitor',
    defaultCompany: 'Direct homepage inquiry',
    assurances: [
      { icon: 'globe', title: 'One-stop EPC solution', copy: 'One accountable partner connecting buyers directly with 5,000+ established power equipment manufacturers, using consolidated procurement to deliver cost-effective product choices for Indonesian buyers.' },
      { icon: 'headphones', title: 'Localized service in Indonesia', copy: 'Rapid on-site response, spare-parts warehouses in Head Office and Branch Office, plus local installation guidance and after-sales support.' },
      { icon: 'shield', title: 'SNI & IEC standards', copy: 'International quality system certification with complete export product documentation and compliance files.' },
    ],
    modeCards: [
      {
        badge: 'Mode A',
        title: 'Self-select products, one quote',
        copy: 'Browse the catalog, add required equipment to your list, and receive one reviewed quotation.',
        steps: ['Browse', 'Add items', 'Review', 'Quote'],
        action: 'Enter product library',
        to: '/products',
      },
      {
        badge: 'Mode B',
        title: 'Submit demand, receive a solution',
        copy: 'Describe your scenario and parameters. Engineers prepare an equipment portfolio and package quote.',
        steps: ['Describe', 'Match', 'Package quote', 'Confirm'],
        action: 'Submit requirement',
        to: '/contact',
      },
    ],
    scenarios: [
      { icon: '🏭', title: 'Industrial park distribution', copy: 'Transformer capacity expansion and complete LV distribution supply.', demand: 'I need an industrial park distribution proposal.' },
      { icon: '☀️', title: 'PV station package', copy: 'Inverters, combiner boxes, step-up transformers and grid cabinets.', demand: 'I need a PV station equipment package.' },
      { icon: '🚗', title: 'EV charging site', copy: 'Charging modules, cabinets, cables, meters and monitoring systems.', demand: 'I need an EV charging site equipment plan.' },
      { icon: '🏢', title: 'Data center power', copy: 'UPS, precision cabinets, PDU, busbar and backup generator packages.', demand: 'I need data center power supply support.' },
      { icon: '🌾', title: 'Agricultural irrigation power', copy: 'Outdoor boxes, pump control, cabling and lightning protection.', demand: 'I need an agricultural irrigation power solution.' },
      { icon: '🏗️', title: 'Temporary construction power', copy: 'Box substations, temporary cabinets, rental cables and site power plans.', demand: 'I need a temporary construction power solution.' },
      { icon: '🔋', title: 'Energy storage integration', copy: 'Storage inverters, battery management and containerized systems.', demand: 'I need an energy storage integration plan.' },
      { icon: '⚡', title: 'Smart grid retrofit', copy: 'Smart meters, automation terminals, communications and backend systems.', demand: 'I need a smart grid retrofit plan.' },
    ],
    reasons: [
      {
        number: '1',
        title: 'AI-assisted sourcing',
        subtitle: 'Accurate matching across product categories',
        quote: 'Reduce supplier search time and avoid unverified overseas vendors.',
        bullets: ['Match application, voltage, MOQ and budget to pre-reviewed suppliers', 'Shorten sourcing time with direct factory quotes'],
      },
      {
        number: '2',
        title: 'Factory audit and inspection',
        subtitle: 'Verify capacity before order',
        quote: 'We inspect the supplier and confirm quality and delivery capability.',
        bullets: ['Factory audit and certification check', 'Pre-shipment inspection and sample confirmation'],
      },
      {
        number: '3',
        title: 'Certification front service',
        subtitle: 'Compliance before shipment',
        quote: 'Products are prepared around CE, IEC, ISO and regional requirements.',
        bullets: ['Route checks for EU, US, Middle East and Southeast Asia', 'Certification document package before delivery'],
      },
      {
        number: '4',
        title: 'DDP / EXW delivery modes',
        subtitle: 'Flexible and controllable',
        quote: 'Choose factory pickup or door-to-door managed delivery.',
        bullets: ['Export declaration, shipping, customs and final delivery', 'Lower internal logistics cost and supply-chain risk'],
      },
      {
        number: '5',
        title: 'Low MOQ and flexible orders',
        subtitle: 'Samples, trial orders and batches',
        quote: 'Start small, validate compatibility, then scale.',
        bullets: ['Sample order, trial order and bulk order paths', 'OEM/ODM labels, packaging and multilingual documents'],
      },
      {
        number: '6',
        title: 'After-sales repair network',
        subtitle: 'Local repair or factory return',
        quote: 'Delivery does not end service. We help resolve faults quickly.',
        bullets: ['Local authorized repair and spare parts', 'Factory return repair with backup plan'],
      },
    ],
    suppliersList: [
      { icon: '🏭', name: 'Huadian Electric Group', badge: 'Strategic', scope: 'Main: transformers, switchgear' },
      { icon: '🔌', name: 'Zhengtai Electric', badge: 'Authorized', scope: 'Main: LV devices, switches' },
      { icon: '⚡', name: 'TBEA', badge: 'Strategic', scope: 'Main: power transmission equipment' },
      { icon: '🤖', name: 'HuiTech', badge: 'Authorized', scope: 'Main: inverters, servo systems' },
      { icon: '📊', name: 'Weisheng Group', badge: 'Strategic', scope: 'Main: meters and instruments' },
      { icon: '🔧', name: 'Yuandong Cable', badge: 'Authorized', scope: 'Main: power cables and conductors' },
    ],
    categoryFallback: [
      { slug: 'generator', name: 'Generation equipment', icon: '⚡', sku: '1,286', tags: ['Synchronous generator', 'Diesel generator', 'Wind power'] },
      { slug: 'transformer', name: 'Transformers', icon: '🔌', sku: '2,450', tags: ['Power transformer', 'Dry transformer', 'Oil-immersed'] },
      { slug: 'switchgear', name: 'Distribution equipment', icon: '📦', sku: '3,680', tags: ['Bridge', 'Busway', 'Distribution cabinet'] },
      { slug: 'smart-meter', name: 'Power electrical', icon: '💡', sku: '5,920', tags: ['Switch', 'Battery', 'Connector'] },
      { slug: 'automation', name: 'Automation control', icon: '🤖', sku: '4,150', tags: ['Motor', 'LV device', 'PLC controller'] },
      { slug: 'instrument', name: 'Power instruments', icon: '📊', sku: '2,890', tags: ['Meter', 'Transmitter', 'Sensor'] },
      { slug: 'cable', name: 'Transmission equipment', icon: '🔧', sku: '3,420', tags: ['Wire', 'Cable', 'Insulator'] },
      { slug: 'tools', name: 'Power tools and supplies', icon: '🛠️', sku: '1,680', tags: ['Tools', 'Materials', 'Test equipment'] },
    ],
    productFallback: [
      { slug: 'dry-transformer-scb13', name: 'MDL-800 dry type power transformer 800KVA 10KV', tag: 'Direct', categorySlug: 'transformer', icon: '🔌' },
      { slug: 'three-phase-motor-y2', name: 'Y2-160M-4 three-phase asynchronous motor 11KW 380V', tag: 'In stock', categorySlug: 'automation', icon: '⚡' },
      { slug: 'siemens-plc-s7-1200', name: 'SIMATIC S7-1200 PLC controller 6ES7214-1AG40-0XB0', tag: 'Certified', categorySlug: 'automation', icon: '🤖' },
      { slug: 'high-voltage-cable-hse240', name: 'HSE-240 3x240 high-voltage power cable', tag: 'Direct', categorySlug: 'cable', icon: '🔧' },
      { slug: 'gen1-low-voltage-cabinet', name: 'GEN-1 AC low-voltage distribution incoming and outgoing cabinet', tag: 'In stock', categorySlug: 'switchgear', icon: '📦' },
    ],
  },
  'zh-CN': {
    searchPlaceholder: '输入应用场景、设备需求或技术参数，如：工业园区配电改造...',
    match: '智能匹配',
    hotScenes: ['光伏电站配套', '工厂配电升级', '数据中心供电', '充电桩建设', '智能电网改造'],
    allCategories: '全部产品分类',
    heroTitle: '告诉我们您的用电场景',
    heroSubtitle: '平台专业选品团队为您匹配最优设备组合，从需求对接到交付落地，全程一站式托管。',
    demandPlaceholder: '请描述您的用电需求（如：315kVA变压器采购），并留下您的邮箱，以便我们及时为您提供方案报价...',
    email: '邮箱',
    phone: '电话',
    submit: '一键提交需求',
    attach: '上传附件',
    voice: '语音输入',
    listening: '识别中...',
    voiceUnsupported: '当前浏览器不支持语音输入。',
    voiceRequiresSecureContext: '语音输入需要 HTTPS 或 localhost 环境。',
    voiceServiceUnavailable: '语音转文字服务未配置。',
    voiceTranscribeFailed: '语音识别失败，请重试。',
    emailRequired: '请留下您的邮箱，以便我们回复您的需求。',
    viewMore: '查看更多',
    moreScenes: '更多场景',
    moreCategories: '更多',
    productCategories: '产品分类',
    suppliers: '战略合作供应商',
    supplierSystem: '查看供应链体系',
    whyChoose: '为什么选择 ExampleCorp',
    platformDetail: '了解平台详情',
    defaultName: '首页访客',
    defaultCompany: '首页直接询盘',
    assurances: [
      { icon: 'globe', title: '一站式EPC解决', copy: '统一负责，直连5000+知名工业设备厂家，通过集中采购为印尼买家提供高性价比的产品选择。' },
      { icon: 'headphones', title: '印尼本地化服务', copy: '快速现场响应，总部/分部备件仓，本地安装指导与售后支持体系。' },
      { icon: 'shield', title: 'SNI&IEC标准', copy: '国际质量体系认证，出口产品资料与合规文件齐全。' },
    ],
    modeCards: [
      {
        badge: '模式 A',
        title: '自主选品 · 统一询价',
        copy: '浏览产品库，将所需设备加入订单中心，平台根据您的选型清单统一核算报价，省去逐一询价的繁琐。',
        steps: ['浏览商品', '加入订单', '统一询价', '平台报价'],
        action: '进入产品库选品',
        to: '/products',
      },
      {
        badge: '模式 B',
        title: '提交需求 · 方案报价',
        copy: '描述您的应用场景与技术参数，平台工程师团队为您定制产品组合方案，并提供整体打包报价。',
        steps: ['描述需求', '匹配方案', '组合报价', '确认下单'],
        action: '提交采购需求',
        to: '/contact',
      },
    ],
    scenarios: [
      { icon: '🏭', title: '工业园区配电', copy: '整厂配电系统规划、变压器扩容、高低压配电柜成套供应。', demand: '我需要工业园区配电方案。' },
      { icon: '☀️', title: '光伏电站配套', copy: '逆变器、汇流箱、升压变压器、并网开关柜一站式配套。', demand: '我需要光伏电站设备配套。' },
      { icon: '🚗', title: '充电桩建设', copy: '充电模块、配电箱、电缆、计量表计及后台监控系统。', demand: '我需要充电桩建设设备方案。' },
      { icon: '🏢', title: '数据中心供电', copy: 'UPS、精密配电柜、PDU、母线槽及备用发电机组。', demand: '我需要数据中心供电支持。' },
      { icon: '🌾', title: '农业灌溉供电', copy: '户外配电箱、水泵控制柜、电缆敷设及防雷接地系统。', demand: '我需要农业灌溉供电方案。' },
      { icon: '🏗️', title: '基建临电工程', copy: '箱式变电站、临时配电箱、电缆租赁及施工用电方案。', demand: '我需要基建临电工程方案。' },
      { icon: '🔋', title: '储能系统集成', copy: '储能变流器、电池管理系统、能量管理系统及集装箱方案。', demand: '我需要储能系统集成方案。' },
      { icon: '⚡', title: '智能电网改造', copy: '智能电表、配电自动化终端、通信模块及后台主站系统。', demand: '我需要智能电网改造方案。' },
    ],
    reasons: [
      {
        number: '1',
        title: 'AI 智能采购',
        subtitle: '精准匹配，告别大海捞针',
        quote: '很多海外买家只知道哪里已是或环球资源，但痛点在于验证供应商是否真的有出口经验、认证和真实产能。',
        bullets: ['链接超过 500+ 经过验证的工业设备制造商', 'AI 根据应用场景、电压标准、起订量和预算匹配供应商'],
      },
      {
        number: '2',
        title: '工厂验厂与质检',
        subtitle: '实地验货，杜绝踩坑',
        quote: '我们对供应商进行实地考察，确保其产品质量和交期真实可靠。',
        bullets: ['实地工厂审计，核验生产线、ISO 认证和出口许可', '出货前检验，确认样品与批量产品一致'],
      },
      {
        number: '3',
        title: '全球认证前置服务',
        subtitle: '合规先行，一次通关',
        quote: '所有采购产品均符合国际标准，包括 CE、IEC、ISO 等认证。',
        bullets: ['欧盟、美国、中东和东南亚认证路线梳理', '支付定金前提供认证路线图，避免到港退运'],
      },
      {
        number: '4',
        title: 'DDP / EXW 双模式交付',
        subtitle: '灵活可控，端到端兜底',
        quote: '我们提供端到端订单管理，最大限度降低采购风险和总成本。',
        bullets: ['DDP 包含报关、海运、清关、关税缴纳和尾程配送', 'EXW 适合多工厂集中采购与二次集货'],
      },
      {
        number: '5',
        title: '低起订量与灵活订单',
        subtitle: '小单快反，降低试错门槛',
        quote: '我们提供低起订量、快速交付和全球运输服务。',
        bullets: ['样品单、试订单、批量单分阶段推进', '支持 OEM/ODM 定制、多语言说明书和本地化包装'],
      },
      {
        number: '6',
        title: '双轨售后维修体系',
        subtitle: '海外本地修 or 原厂返修',
        quote: '即使交付完成后，我们仍随时协助处理问题。',
        bullets: ['授权维修中心配备原厂备件，覆盖常见故障', '复杂故障可原厂返修并提供备用机方案'],
      },
    ],
    suppliersList: [
      { icon: '🏭', name: '华电电气集团', badge: '战略合作', scope: '主营：变压器、配电柜' },
      { icon: '🔌', name: '正泰电器股份', badge: '官方授权', scope: '主营：低压电器、开关' },
      { icon: '⚡', name: '特变电工', badge: '战略合作', scope: '主营：输变电设备' },
      { icon: '🤖', name: '汇川技术', badge: '官方授权', scope: '主营：变频器、伺服' },
      { icon: '📊', name: '威胜集团', badge: '战略合作', scope: '主营：电能表、仪表' },
      { icon: '🔧', name: '远东电缆', badge: '官方授权', scope: '主营：电力电缆、导线' },
    ],
    categoryFallback: [
      { slug: 'generator', name: '发电设备', icon: '⚡', sku: '1,286', tags: ['同步发电机', '柴油发电机组', '风力发电'] },
      { slug: 'transformer', name: '变压器', icon: '🔌', sku: '2,450', tags: ['电源变压器', '干式变压器', '油浸式变压器'] },
      { slug: 'switchgear', name: '配电设备', icon: '📦', sku: '3,680', tags: ['桥架', '线槽', '配电柜', '开关柜'] },
      { slug: 'smart-meter', name: '电力电气', icon: '💡', sku: '5,920', tags: ['开关', '电池', '插座', '接线器'] },
      { slug: 'automation', name: '自动化控制系统', icon: '🤖', sku: '4,150', tags: ['电动机', '低压电器', '工控系统', 'PLC控制器', '变频器'] },
      { slug: 'instrument', name: '电力仪表', icon: '📊', sku: '2,890', tags: ['仪器仪表', '变送器', '传感器', '电能表', '功率分析仪'] },
      { slug: 'cable', name: '输电设备', icon: '🔧', sku: '3,420', tags: ['电线', '电缆', '绝缘导线', '高压输电', '绝缘子'] },
      { slug: 'tools', name: '电力工具及物资', icon: '🛠️', sku: '1,680', tags: ['常用工具', '常用材料', '施工设备', '安全防护', '测试工具'] },
    ],
    productFallback: [
      { slug: 'dry-transformer-scb13', name: 'MDL-800 干式电力变压器 800KVA 10KV', tag: '直采', categorySlug: 'transformer', icon: '🔌' },
      { slug: 'three-phase-motor-y2', name: 'Y2-160M-4 三相异步电动机 11KW 380V', tag: '现货', categorySlug: 'automation', icon: '⚡' },
      { slug: 'siemens-plc-s7-1200', name: '西门子 S7-1200 PLC控制器 6ES7214-1AG40-0XB0', tag: '认证', categorySlug: 'automation', icon: '🤖' },
      { slug: 'high-voltage-cable-hse240', name: 'HSE-240 3×240 高压工业线缆', tag: '直采', categorySlug: 'cable', icon: '🔧' },
      { slug: 'gen1-low-voltage-cabinet', name: 'GEN-1型交流低压配电柜 进线柜 出线柜', tag: '现货', categorySlug: 'switchgear', icon: '📦' },
    ],
  },
  id: {
    searchPlaceholder: 'Masukkan skenario aplikasi, kebutuhan alat, atau parameter teknis, mis. upgrade distribusi kawasan industri...',
    match: 'Cocokkan',
    hotScenes: ['Paket PLTS', 'Upgrade distribusi pabrik', 'Daya data center', 'Lokasi EV charging', 'Retrofit smart grid'],
    allCategories: 'Semua kategori produk',
    heroTitle: 'Ceritakan skenario kelistrikan Anda',
    heroSubtitle: 'Tim sourcing kami mencocokkan kombinasi peralatan terbaik dari kebutuhan hingga pengiriman.',
    demandPlaceholder: 'Jelaskan kebutuhan daya Anda, mis. pembelian trafo 315kVA, dan tinggalkan email/telepon untuk proposal...',
    email: 'Email',
    phone: 'Telepon',
    submit: 'Kirim kebutuhan',
    attach: 'Lampirkan file',
    voice: 'Input suara',
    listening: 'Mendengarkan...',
    voiceUnsupported: 'Input suara tidak didukung di browser ini.',
    voiceRequiresSecureContext: 'Input suara memerlukan HTTPS atau localhost.',
    voiceServiceUnavailable: 'Layanan transkripsi suara belum dikonfigurasi.',
    voiceTranscribeFailed: 'Gagal mentranskripsi suara. Silakan coba lagi.',
    emailRequired: 'Mohon tinggalkan email agar kami dapat merespons kebutuhan Anda.',
    viewMore: 'Lihat lainnya',
    moreScenes: 'Skenario lainnya',
    moreCategories: 'Lainnya',
    productCategories: 'Kategori produk',
    suppliers: 'Mitra pemasok strategis',
    supplierSystem: 'Lihat sistem rantai pasok',
    whyChoose: 'Mengapa memilih ExampleCorp',
    platformDetail: 'Detail platform',
    defaultName: 'Pengunjung beranda',
    defaultCompany: 'Inquiry langsung dari beranda',
    assurances: [
      { icon: 'globe', title: 'Solusi EPC terpadu', copy: 'Satu pihak bertanggung jawab, menghubungkan pembeli langsung dengan 5.000+ produsen peralatan listrik ternama, serta menyediakan pilihan produk bernilai tinggi bagi pembeli Indonesia melalui pengadaan terpusat.' },
      { icon: 'headphones', title: 'Layanan lokal Indonesia', copy: 'Respons cepat di lokasi, gudang suku cadang di Head Office dan Branch Office, serta panduan instalasi lokal dan dukungan purnajual.' },
      { icon: 'shield', title: 'Standar SNI & IEC', copy: 'Sertifikasi sistem mutu internasional dengan dokumentasi produk ekspor dan berkas kepatuhan yang lengkap.' },
    ],
    modeCards: [
      {
        badge: 'Mode A',
        title: 'Pilih produk, satu penawaran',
        copy: 'Jelajahi katalog, masukkan peralatan ke daftar, dan terima satu penawaran yang sudah ditinjau.',
        steps: ['Jelajah', 'Tambah', 'Review', 'Quote'],
        action: 'Masuk katalog',
        to: '/products',
      },
      {
        badge: 'Mode B',
        title: 'Kirim kebutuhan, dapatkan solusi',
        copy: 'Jelaskan skenario dan parameter. Engineer menyiapkan paket peralatan dan quote.',
        steps: ['Jelaskan', 'Cocokkan', 'Quote paket', 'Konfirmasi'],
        action: 'Kirim kebutuhan',
        to: '/contact',
      },
    ],
    scenarios: [
      { icon: '🏭', title: 'Distribusi kawasan industri', copy: 'Ekspansi trafo dan paket panel distribusi LV lengkap.', demand: 'Saya butuh solusi distribusi kawasan industri.' },
      { icon: '☀️', title: 'Paket PLTS', copy: 'Inverter, combiner box, trafo step-up dan panel grid.', demand: 'Saya butuh paket peralatan PLTS.' },
      { icon: '🚗', title: 'Lokasi EV charging', copy: 'Modul charging, kabinet, kabel, meter dan sistem monitoring.', demand: 'Saya butuh rencana peralatan EV charging.' },
      { icon: '🏢', title: 'Daya data center', copy: 'UPS, kabinet presisi, PDU, busbar dan generator cadangan.', demand: 'Saya butuh dukungan daya data center.' },
      { icon: '🌾', title: 'Daya irigasi pertanian', copy: 'Box outdoor, kontrol pompa, kabel dan proteksi petir.', demand: 'Saya butuh solusi daya irigasi.' },
      { icon: '🏗️', title: 'Daya konstruksi sementara', copy: 'Gardu box, panel sementara, kabel sewa dan rencana site.', demand: 'Saya butuh solusi daya konstruksi sementara.' },
      { icon: '🔋', title: 'Integrasi ESS', copy: 'Inverter storage, BMS, EMS dan sistem kontainer.', demand: 'Saya butuh rencana integrasi ESS.' },
      { icon: '⚡', title: 'Retrofit smart grid', copy: 'Meter pintar, terminal otomasi, komunikasi dan sistem backend.', demand: 'Saya butuh retrofit smart grid.' },
    ],
    reasons: [
      {
        number: '1',
        title: 'Sourcing berbantu AI',
        subtitle: 'Pencocokan akurat lintas kategori',
        quote: 'Kurangi waktu mencari pemasok dan hindari vendor yang belum terverifikasi.',
        bullets: ['Cocokkan aplikasi, tegangan, MOQ dan anggaran', 'Percepat sourcing dengan quote pabrik langsung'],
      },
      {
        number: '2',
        title: 'Audit pabrik dan inspeksi',
        subtitle: 'Verifikasi sebelum order',
        quote: 'Kami memeriksa pemasok dan memastikan kualitas serta kapasitas pengiriman.',
        bullets: ['Audit pabrik dan sertifikasi', 'Inspeksi sebelum pengiriman dan konfirmasi sampel'],
      },
      {
        number: '3',
        title: 'Layanan sertifikasi awal',
        subtitle: 'Patuh sebelum dikirim',
        quote: 'Produk disiapkan sesuai CE, IEC, ISO dan kebutuhan regional.',
        bullets: ['Pemetaan sertifikasi EU, US, Timur Tengah dan Asia Tenggara', 'Dokumen sertifikasi sebelum pengiriman'],
      },
      {
        number: '4',
        title: 'Mode pengiriman DDP / EXW',
        subtitle: 'Fleksibel dan terkendali',
        quote: 'Pilih pickup pabrik atau door-to-door managed delivery.',
        bullets: ['Deklarasi ekspor, shipping, customs dan pengiriman akhir', 'Turunkan risiko logistik internal'],
      },
      {
        number: '5',
        title: 'MOQ rendah dan order fleksibel',
        subtitle: 'Sample, trial dan batch',
        quote: 'Mulai kecil, validasi kompatibilitas, lalu scale.',
        bullets: ['Jalur sample, trial dan bulk order', 'Label OEM/ODM, packaging dan dokumen multibahasa'],
      },
      {
        number: '6',
        title: 'Jaringan after-sales',
        subtitle: 'Repair lokal atau kembali pabrik',
        quote: 'Pengiriman bukan akhir layanan. Kami membantu menyelesaikan masalah.',
        bullets: ['Repair lokal dan spare part', 'Return pabrik dengan rencana cadangan'],
      },
    ],
    suppliersList: [
      { icon: '🏭', name: 'Huadian Electric Group', badge: 'Strategis', scope: 'Utama: trafo, switchgear' },
      { icon: '🔌', name: 'Zhengtai Electric', badge: 'Authorized', scope: 'Utama: LV devices, switch' },
      { icon: '⚡', name: 'TBEA', badge: 'Strategis', scope: 'Utama: transmisi daya' },
      { icon: '🤖', name: 'HuiTech', badge: 'Authorized', scope: 'Utama: inverter, servo' },
      { icon: '📊', name: 'Weisheng Group', badge: 'Strategis', scope: 'Utama: meter dan instrumen' },
      { icon: '🔧', name: 'Yuandong Cable', badge: 'Authorized', scope: 'Utama: kabel daya dan konduktor' },
    ],
    categoryFallback: [
      { slug: 'generator', name: 'Peralatan pembangkit', icon: '⚡', sku: '1,286', tags: ['Generator sinkron', 'Generator diesel', 'Tenaga angin'] },
      { slug: 'transformer', name: 'Transformator', icon: '🔌', sku: '2,450', tags: ['Trafo daya', 'Trafo kering', 'Oil-immersed'] },
      { slug: 'switchgear', name: 'Peralatan distribusi', icon: '📦', sku: '3,680', tags: ['Bridge', 'Busway', 'Panel distribusi'] },
      { slug: 'smart-meter', name: 'Kelistrikan', icon: '💡', sku: '5,920', tags: ['Switch', 'Baterai', 'Konektor'] },
      { slug: 'automation', name: 'Kontrol otomasi', icon: '🤖', sku: '4,150', tags: ['Motor', 'LV device', 'PLC controller'] },
      { slug: 'instrument', name: 'Instrumen daya', icon: '📊', sku: '2,890', tags: ['Meter', 'Transmitter', 'Sensor'] },
      { slug: 'cable', name: 'Peralatan transmisi', icon: '🔧', sku: '3,420', tags: ['Wire', 'Cable', 'Insulator'] },
      { slug: 'tools', name: 'Tools dan material daya', icon: '🛠️', sku: '1,680', tags: ['Tools', 'Materials', 'Test equipment'] },
    ],
    productFallback: [
      { slug: 'dry-transformer-scb13', name: 'MDL-800 dry type power transformer 800KVA 10KV', tag: 'Direct', categorySlug: 'transformer', icon: '🔌' },
      { slug: 'three-phase-motor-y2', name: 'Y2-160M-4 three-phase asynchronous motor 11KW 380V', tag: 'Stock', categorySlug: 'automation', icon: '⚡' },
      { slug: 'siemens-plc-s7-1200', name: 'SIMATIC S7-1200 PLC controller 6ES7214-1AG40-0XB0', tag: 'Certified', categorySlug: 'automation', icon: '🤖' },
      { slug: 'high-voltage-cable-hse240', name: 'HSE-240 3x240 high-voltage power cable', tag: 'Direct', categorySlug: 'cable', icon: '🔧' },
      { slug: 'gen1-low-voltage-cabinet', name: 'GEN-1 AC low-voltage distribution incoming and outgoing cabinet', tag: 'Stock', categorySlug: 'switchgear', icon: '📦' },
    ],
  },
}

const home = shallowRef<HomeResponse | null>(props.initialHome ?? null)
const categories = shallowRef<CategoryTree[]>(props.initialCategories ?? [])
const solutions = shallowRef<SolutionSummary[]>(props.initialSolutions ?? [])
const isLoading = shallowRef(!props.initialHome)
const isSubmittingInquiry = shallowRef(false)
const inquiryError = shallowRef('')
const inquiryMessage = shallowRef('')
const activeBannerIndex = shallowRef(0)
const inquiryAttachment = shallowRef<File | null>(null)
const isListening = shallowRef(false)
const isTranscribing = shallowRef(false)
let bannerTimer: number | null = null
let bannerPreloadTimer: number | null = null
let voiceStream: MediaStream | null = null
let voiceSocket: WebSocket | null = null
let audioContext: AudioContext | null = null
let audioSource: MediaStreamAudioSourceNode | null = null
let audioProcessor: ScriptProcessorNode | null = null
let finalRealtimeText = ''
const { locale, t, setLocale } = useI18n()
if (props.initialLocale && locale.value !== props.initialLocale) setLocale(props.initialLocale)
const { text, localizeText, localizeProduct, localizeSolution, localizedCategory } = useLocalizedContent()
const { config: websiteConfig } = useWebsiteConfig()

const inquiryForm = reactive({
  name: '',
  company: '',
  email: '',
  phone: '',
  product_slug: '',
  solution_slug: '',
  message: '',
})

const copy = computed(() => pageCopy[locale.value])
function localizedValue(base: string, translations?: Partial<Record<Locale, string>>) {
  return localizeText(translations?.[locale.value] || base)
}

function localizedList(base: string[], translations?: Partial<Record<Locale, string[]>>) {
  return (translations?.[locale.value] || base).map(localizeText)
}

const managedHomeText = computed(() => {
  return new Map((websiteConfig.value?.homeText ?? []).map(item => [
    item.key,
    localizeText(item.translations?.[locale.value] || item.value),
  ]))
})

function homeTextValue(key: keyof HomeCopy, fallback: string) {
  return managedHomeText.value.get(String(key)) || fallback
}

const homeLabels = computed(() => ({
  allCategories: homeTextValue('allCategories', copy.value.allCategories),
  demandPlaceholder: homeTextValue('demandPlaceholder', copy.value.demandPlaceholder),
  email: homeTextValue('email', copy.value.email),
  phone: homeTextValue('phone', copy.value.phone),
  submit: homeTextValue('submit', copy.value.submit),
  attach: homeTextValue('attach', copy.value.attach),
  voice: homeTextValue('voice', copy.value.voice),
  listening: homeTextValue('listening', copy.value.listening),
  voiceUnsupported: homeTextValue('voiceUnsupported', copy.value.voiceUnsupported),
  voiceRequiresSecureContext: homeTextValue('voiceRequiresSecureContext', copy.value.voiceRequiresSecureContext),
  voiceServiceUnavailable: homeTextValue('voiceServiceUnavailable', copy.value.voiceServiceUnavailable),
  voiceTranscribeFailed: homeTextValue('voiceTranscribeFailed', copy.value.voiceTranscribeFailed),
  emailRequired: homeTextValue('emailRequired', copy.value.emailRequired),
  viewMore: homeTextValue('viewMore', copy.value.viewMore),
  moreScenes: homeTextValue('moreScenes', copy.value.moreScenes),
  productCategories: homeTextValue('productCategories', copy.value.productCategories),
  suppliers: homeTextValue('suppliers', copy.value.suppliers),
  supplierSystem: homeTextValue('supplierSystem', copy.value.supplierSystem),
  defaultName: homeTextValue('defaultName', copy.value.defaultName),
  defaultCompany: homeTextValue('defaultCompany', copy.value.defaultCompany),
}))

const procurementModes = computed<ProcurementMode[]>(() => {
  const configured = websiteConfig.value?.homeProcurementModes
    ?.filter(mode => mode.enabled)
    .map(mode => ({
      badge: localizedValue(mode.badge, mode.badgeTranslations),
      title: localizedValue(mode.title, mode.titleTranslations),
      copy: localizedValue(mode.copy, mode.copyTranslations),
      steps: localizedList(mode.steps, mode.stepTranslations),
      action: localizedValue(mode.action, mode.actionTranslations),
      to: mode.to,
    }))
    .filter(mode => mode.title.trim())

  return configured?.length ? configured : copy.value.modeCards
})

const scenarioCards = computed<ScenarioCard[]>(() => {
  const configured = websiteConfig.value?.homeScenarios
    ?.filter(scenario => scenario.enabled)
    .map(scenario => ({
      icon: scenario.icon,
      title: localizedValue(scenario.title, scenario.titleTranslations),
      copy: localizedValue(scenario.copy, scenario.copyTranslations),
      demand: localizedValue(scenario.demand, scenario.demandTranslations),
    }))
    .filter(scenario => scenario.title.trim())

  return configured?.length ? configured : copy.value.scenarios
})

const supplierCards = computed<SupplierCard[]>(() => {
  const configured = websiteConfig.value?.homeSuppliers
    ?.filter(supplier => supplier.enabled)
    .map(supplier => ({
      icon: supplier.icon,
      name: localizedValue(supplier.name, supplier.nameTranslations),
      badge: localizedValue(supplier.badge, supplier.badgeTranslations),
      scope: localizedValue(supplier.scope, supplier.scopeTranslations),
    }))
    .filter(supplier => supplier.name.trim())

  return configured?.length ? configured : copy.value.suppliersList
})

const categoryFallbackItems = computed<Array<{ slug: string, name: string } & CategoryMeta>>(() => {
  const configured = websiteConfig.value?.homeCategoryFallback
    ?.filter(category => category.enabled)
    .map(category => ({
      slug: category.slug,
      name: localizedValue(category.name, category.nameTranslations),
      icon: category.icon,
      sku: category.sku,
      tags: localizedList(category.tags, category.tagTranslations),
    }))
    .filter(category => category.slug.trim() && category.name.trim())

  return configured?.length ? configured : copy.value.categoryFallback
})

const productFallbackItems = computed<Array<{ slug: string, name: string, tag: string, categorySlug: string, icon: string }>>(() => {
  const configured = websiteConfig.value?.homeProductFallback
    ?.filter(product => product.enabled)
    .map(product => ({
      slug: product.slug,
      name: localizedValue(product.name, product.nameTranslations),
      tag: localizedValue(product.tag, product.tagTranslations),
      categorySlug: product.categorySlug,
      icon: product.icon,
    }))
    .filter(product => product.slug.trim() && product.name.trim())

  return configured?.length ? configured : copy.value.productFallback
})

const whyChooseCopy = computed(() => {
  const config = websiteConfig.value?.homeWhyChoose
  return {
    title: localizeText(config?.titleTranslations?.[locale.value] || config?.title || copy.value.whyChoose),
    ctaText: localizeText(config?.ctaTextTranslations?.[locale.value] || config?.ctaText || copy.value.platformDetail),
  }
})
const whyChooseReasons = computed<ReasonCard[]>(() => {
  const reasons = websiteConfig.value?.homeWhyChoose?.reasons
  if (!reasons?.length) return copy.value.reasons
  return reasons
    .filter(reason => reason.enabled)
    .map(reason => ({
      number: reason.number,
      title: localizeText(reason.titleTranslations?.[locale.value] || reason.title),
      subtitle: localizeText(reason.subtitleTranslations?.[locale.value] || reason.subtitle),
      quote: localizeText(reason.quoteTranslations?.[locale.value] || reason.quote),
      bullets: (reason.bulletTranslations?.[locale.value] || reason.bullets).map(localizeText),
    }))
})
const fallbackBanners = computed<Banner[]>(() => [
  {
    id: 1,
    title: copy.value.heroTitle,
    subtitle: copy.value.heroSubtitle,
    badge_text: null,
    image_url: '',
    mobile_image_url: null,
    cta_text: null,
    cta_url: '/contact',
    product_slug: null,
    sort_order: 1,
  },
  {
    id: 2,
    title: scenarioCards.value[0]?.title ?? copy.value.heroTitle,
    subtitle: scenarioCards.value[0]?.copy ?? copy.value.heroSubtitle,
    badge_text: null,
    image_url: '',
    mobile_image_url: null,
    cta_text: null,
    cta_url: '/solutions/ev-charging-station',
    product_slug: null,
    sort_order: 2,
  },
  {
    id: 3,
    title: procurementModes.value[1]?.title ?? copy.value.heroTitle,
    subtitle: procurementModes.value[1]?.copy ?? copy.value.heroSubtitle,
    badge_text: null,
    image_url: '',
    mobile_image_url: null,
    cta_text: null,
    cta_url: '/products',
    product_slug: null,
    sort_order: 3,
  },
])
const configuredBannerById = computed(() => new Map(
  (websiteConfig.value?.banners ?? []).map(banner => [banner.id, banner]),
))
const heroBanners = computed(() => {
  // The SSR home response is the single source for image, order and link. The
  // shell config only supplies localized copy, preventing a second image swap.
  const source = home.value?.banners.length ? home.value.banners : fallbackBanners.value
  return source.map(banner => {
    const managedId = banner.product_slug?.startsWith('managed:')
      ? banner.product_slug.slice('managed:'.length)
      : ''
    const configured = managedId ? configuredBannerById.value.get(managedId) : undefined
    return configured
      ? {
          ...banner,
          title: configured.titleTranslations?.[locale.value] || configured.title || banner.title,
          subtitle: configured.subtitleTranslations?.[locale.value] || configured.subtitle || banner.subtitle,
        }
      : localizeBannerForLocale(banner, locale.value)
  })
})
const activeBanner = computed(() => heroBanners.value[activeBannerIndex.value] ?? heroBanners.value[0])
const activeBannerLink = computed(() => {
  const value = activeBanner.value?.cta_url?.trim() || '/products'
  if (value.startsWith('#')) return value
  if (!/^https?:\/\//i.test(value)) return value.startsWith('/') ? value : '/products'

  try {
    const url = new URL(value)
    if (url.hostname === 'example.com' || url.hostname.endsWith('.example.com')) {
      return `${url.pathname}${url.search}${url.hash}`
    }
  } catch {
    return '/products'
  }
  return value
})
const activeBannerLinkExternal = computed(() => /^https?:\/\//i.test(activeBannerLink.value))
const heroCarousel = computed(() => home.value?.banner_carousel ?? { autoplay: true, intervalSeconds: 5 })
const heroBannerImage = computed(() => resolveResponsiveAsset(activeBanner.value?.image_url, {
  widths: [640, 960, 1280, 1600],
  quality: 76,
}))
const shouldShowBannerDots = computed(() => heroBanners.value.length > 1)
const fallbackProducts = computed<ProductSummary[]>(() => {
  return productFallbackItems.value.map((product, index) => {
    const category = categoryFallbackBySlug.value.get(product.categorySlug) ?? categoryFallbackItems.value[0]
    return {
      id: 9000 + index,
      product_code: `P${19000 + index}`,
      slug: product.slug,
      public_slug: product.slug,
      name: product.name,
      model: '',
      summary: '',
      description: null,
      detail_blocks: [],
      main_image: null,
      images: [],
      highlights: [],
      specifications: [],
      moq: null,
      price_mode: '',
      image_tone: null,
      tag: product.tag,
      tag_more: [],
      is_hot: true,
      is_indexable: false,
      content_updated_at: null,
      sort_order: index + 1,
      translations: {},
      category: {
        name: category.name,
        slug: category.slug,
        color: '#1f6d86',
        translations: {},
      },
    }
  })
})
const hotProducts = computed(() => {
  const source = home.value?.hot_products.length ? home.value.hot_products.slice(0, 5) : fallbackProducts.value
  return source.map(localizeProduct)
})
function flattenCategoryTree(items: CategoryTree[]): CategoryTree[] {
  const result: CategoryTree[] = []
  const stack = [...items]
  while (stack.length) {
    const item = stack.shift()!
    result.push(item)
    if (item.children?.length) stack.unshift(...item.children)
  }
  return result
}

const selectedCategory = computed(() => flattenCategoryTree(categories.value).find(category => category.slug === inquiryForm.product_slug) ?? null)
const selectedSolution = computed(() => {
  const solution = solutions.value.find(solution => solution.slug === inquiryForm.solution_slug)
  return solution ? localizeSolution(solution) : null
})
const homeInquiryPlaceholder = computed(() => buildHomeDefaultMessage() || homeLabels.value.demandPlaceholder)
const categoryFallbackBySlug = computed(() => new Map(categoryFallbackItems.value.map(category => [category.slug, category])))

function categoryVisual(category: { slug: string, name: string }, index = 0): { key: CategoryVisualKey, tone: string } {
  const identity = `${category.slug} ${category.name}`.toLowerCase()

  if (/配件|辅材|accessor/.test(identity)) return { key: 'transformer-accessory', tone: 'transformer-accessory' }
  if (/高低压|成套|开关柜|配电柜|cabinet/.test(identity)) return { key: 'switchgear-cabinet', tone: 'switchgear-cabinet' }
  if (/变压器|transformer/.test(identity)) return { key: 'transformer', tone: 'transformer' }
  if (/开关设备|switchgear|switch/.test(identity)) return { key: 'switchgear', tone: 'switchgear' }
  if (/光伏|新能源|solar|pv/.test(identity)) return { key: 'solar', tone: 'solar' }
  if (/电抗器|无功|reactor|reactive power/.test(identity)) return { key: 'reactor', tone: 'reactor' }
  if (/电线|电缆|cable/.test(identity)) return { key: 'cable', tone: 'cable' }
  if (/电容|补偿|capacitor|compensation/.test(identity)) return { key: 'compensation', tone: 'compensation' }
  if (/变频|软启动|inverter|drive/.test(identity)) return { key: 'drive', tone: 'drive' }

  const fallback: Array<{ key: CategoryVisualKey, tone: string }> = [
    { key: 'tools', tone: 'tools' },
    { key: 'switchgear', tone: 'switchgear' },
    { key: 'reactor', tone: 'reactor' },
  ]
  return fallback[index % fallback.length]
}

function categoryVisualIcon(key: CategoryVisualKey) {
  if (key === 'transformer') return Zap
  if (key === 'transformer-accessory') return PackageOpen
  if (key === 'switchgear') return ToggleLeft
  if (key === 'switchgear-cabinet') return PanelsTopLeft
  if (key === 'solar') return Sun
  if (key === 'reactor') return Activity
  if (key === 'cable') return Cable
  if (key === 'compensation') return Gauge
  if (key === 'drive') return SlidersHorizontal
  return Wrench
}

const categoryTiles = computed<CategoryTile[]>(() => {
  const source = categories.value.length
    ? categories.value
    : categoryFallbackItems.value.map((category, index) => ({
        id: index + 1,
        name: category.name,
        slug: category.slug,
        parent_id: null,
        color: null,
        sort_order: index + 1,
        children: [],
      }))

  const roots = source
    .filter(category => category.parent_id == null)
    .sort((a, b) => {
      const aChildren = a.children?.length || source.filter(item => item.parent_id === a.id).length
      const bChildren = b.children?.length || source.filter(item => item.parent_id === b.id).length
      return bChildren - aChildren || a.sort_order - b.sort_order || a.id - b.id
    })

  const otherCategory = roots.find(category => category.slug === OTHER_CATEGORY_SLUG)
  const topRoots = roots
    .filter(category => category.slug !== OTHER_CATEGORY_SLUG)
    .slice(0, 9)
  if (otherCategory) topRoots.push(otherCategory)

  return topRoots.map((category, index) => {
    const fallback = categoryFallbackBySlug.value.get(category.slug) ?? categoryFallbackItems.value[index % categoryFallbackItems.value.length]
    const childrenSource = category.children?.length
      ? category.children
      : source.filter(item => item.parent_id === category.id)
    const visual = categoryVisual(category, index)

    return {
      slug: category.slug,
      name: localizedCategory(category).name,
      parentId: category.parent_id,
      icon: fallback.icon,
      sku: fallback.sku,
      tags: fallback.tags,
      visualKey: visual.key,
      visualTone: visual.tone,
      children: childrenSource.map((child, childIndex) => {
        const childFallback = categoryFallbackBySlug.value.get(child.slug) ?? fallback
        const childVisual = categoryVisual(child, childIndex)
        return {
          slug: child.slug,
          name: localizedCategory(child).name,
          parentId: child.parent_id,
          icon: childFallback.icon,
          sku: childFallback.sku,
          tags: childFallback.tags.slice(0, 3 - childIndex),
          visualKey: childVisual.key,
          visualTone: childVisual.tone,
          children: [],
        }
      }),
    }
  })
})

const heroCategoryTiles = computed<CategoryTile[]>(() => [
  ...categoryTiles.value.slice(0, 9),
  {
    slug: '__more__',
    name: copy.value.moreCategories,
    parentId: null,
    icon: '',
    sku: '',
    tags: [],
    visualKey: 'tools',
    visualTone: 'tools',
    children: [],
    isMore: true,
  },
])

const platformSellingPoints = computed<PlatformSellingPoint[]>(() => {
  const configured = websiteConfig.value?.platformSellingPoints
    ?.filter(point => point.enabled)
    .map(point => ({
      icon: point.icon,
      title: localizeText(point.titleTranslations?.[locale.value] || point.title),
      copy: localizeText(point.contentTranslations?.[locale.value] || point.content),
    }))
    .filter(point => point.title.trim() || point.copy.trim())

  return configured?.length ? configured : copy.value.assurances
})

function assuranceIcon(icon: string) {
  if (icon === 'shield') return ShieldCheck
  if (icon === 'headphones') return Headphones
  return Award
}

function stopBannerAutoplay() {
  if (bannerPreloadTimer) {
    window.clearTimeout(bannerPreloadTimer)
    bannerPreloadTimer = null
  }
  if (!bannerTimer) return
  window.clearInterval(bannerTimer)
  bannerTimer = null
}

function goToBanner(index: number) {
  if (!heroBanners.value.length) return
  activeBannerIndex.value = (index + heroBanners.value.length) % heroBanners.value.length
}

function preloadNextBanner() {
  if (heroBanners.value.length < 2) return
  const next = heroBanners.value[(activeBannerIndex.value + 1) % heroBanners.value.length]
  const source = resolveResponsiveAsset(next?.image_url, { widths: [960], quality: 76 }).src
  if (!source) return
  const image = new Image()
  image.decoding = 'async'
  image.src = source
  bannerPreloadTimer = null
}

function startBannerAutoplay() {
  stopBannerAutoplay()
  if (
    !heroCarousel.value.autoplay
    || heroBanners.value.length < 2
    || document.visibilityState === 'hidden'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) return
  bannerPreloadTimer = window.setTimeout(preloadNextBanner, 250)
  bannerTimer = window.setInterval(() => {
    goToBanner(activeBannerIndex.value + 1)
    preloadNextBanner()
  }, Math.max(1, heroCarousel.value.intervalSeconds) * 1000)
}

function syncBannerAutoplay() {
  if (document.visibilityState === 'hidden') stopBannerAutoplay()
  else startBannerAutoplay()
}

function applyDemand(message: string, categorySlug = '') {
  inquiryForm.message = message
  inquiryForm.product_slug = categorySlug
  inquiryForm.solution_slug = ''
}

function validateInquiryForm() {
  if (!inquiryForm.email.trim()) return homeLabels.value.emailRequired
  if (inquiryForm.email.trim() && !/^\S+@\S+\.\S+$/.test(inquiryForm.email.trim())) return t('contact.invalidEmail')
  if (!inquiryForm.message.trim()) return t('contact.requiredMessage')
  return ''
}

function stopVoiceInput() {
  if (voiceSocket?.readyState === WebSocket.OPEN) voiceSocket.send('stop')
  stopRealtimeVoiceInput()
}

function stopVoiceStream() {
  voiceStream?.getTracks().forEach(track => track.stop())
  voiceStream = null
}

function mergeRealtimeText(text: string, isSentenceEnd: boolean) {
  const nextText = text.trim()
  if (!nextText) return
  const base = finalRealtimeText.trim()
  inquiryForm.message = base ? `${base}\n${nextText}` : nextText
  if (isSentenceEnd) finalRealtimeText = inquiryForm.message
}

function downsampleTo16k(input: Float32Array, sourceSampleRate: number) {
  if (sourceSampleRate === 16000) return input

  const ratio = sourceSampleRate / 16000
  const outputLength = Math.floor(input.length / ratio)
  const output = new Float32Array(outputLength)
  for (let index = 0; index < outputLength; index += 1) {
    const start = Math.floor(index * ratio)
    const end = Math.min(Math.floor((index + 1) * ratio), input.length)
    let sum = 0
    for (let sample = start; sample < end; sample += 1) sum += input[sample]
    output[index] = sum / Math.max(1, end - start)
  }
  return output
}

function floatTo16BitPcm(input: Float32Array) {
  const output = new Int16Array(input.length)
  for (let index = 0; index < input.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, input[index]))
    output[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
  }
  return output
}

function stopRealtimeVoiceInput() {
  audioProcessor?.disconnect()
  audioSource?.disconnect()
  audioContext?.close()
  voiceSocket?.close()
  stopVoiceStream()
  audioProcessor = null
  audioSource = null
  audioContext = null
  voiceSocket = null
  isListening.value = false
  isTranscribing.value = false
}

async function startRealtimeVoiceInput() {
  if (!window.isSecureContext) {
    inquiryError.value = homeLabels.value.voiceRequiresSecureContext
    return
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof WebSocket === 'undefined') {
    inquiryError.value = homeLabels.value.voiceUnsupported
    return
  }

  inquiryError.value = ''
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioContext = new AudioContext()
    audioSource = audioContext.createMediaStreamSource(voiceStream)
    audioProcessor = audioContext.createScriptProcessor(4096, 1, 1)
    voiceSocket = new WebSocket(speechRealtimeUrl())
    voiceSocket.binaryType = 'arraybuffer'
    finalRealtimeText = inquiryForm.message.trim()

    voiceSocket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string, text?: string, is_sentence_end?: boolean, message?: string }
      if (payload.type === 'ready') {
        audioSource?.connect(audioProcessor!)
        audioProcessor?.connect(audioContext!.destination)
        isListening.value = true
        isTranscribing.value = false
        return
      }
      if (payload.type === 'result' && payload.text) {
        mergeRealtimeText(payload.text, Boolean(payload.is_sentence_end))
        return
      }
      if (payload.type === 'error') {
        inquiryError.value = payload.message || homeLabels.value.voiceTranscribeFailed
        stopRealtimeVoiceInput()
      }
    }
    voiceSocket.onerror = () => {
      inquiryError.value = homeLabels.value.voiceTranscribeFailed
      stopRealtimeVoiceInput()
    }
    voiceSocket.onclose = () => {
      stopRealtimeVoiceInput()
    }
    audioProcessor.onaudioprocess = (event) => {
      if (voiceSocket?.readyState !== WebSocket.OPEN) return
      const input = event.inputBuffer.getChannelData(0)
      const pcm = floatTo16BitPcm(downsampleTo16k(input, audioContext?.sampleRate ?? 48000))
      voiceSocket.send(pcm.buffer)
    }
    isTranscribing.value = true
  } catch {
    stopRealtimeVoiceInput()
    inquiryError.value = homeLabels.value.voiceUnsupported
  }
}

function handleAttachmentChange(event: Event) {
  const input = event.target as HTMLInputElement
  inquiryAttachment.value = input.files?.[0] ?? null
}

async function toggleVoiceInput() {
  if (isListening.value || isTranscribing.value) {
    stopVoiceInput()
    return
  }

  await startRealtimeVoiceInput()
}

function buildHomeDefaultMessage() {
  const lines = [t('contact.defaultMessage')]
  if (selectedCategory.value) lines.unshift(t('contact.productMessage', '', { name: text(`categories.${selectedCategory.value.slug}`, selectedCategory.value.name) }))
  if (selectedSolution.value) lines.unshift(t('contact.solutionMessage', '', { name: selectedSolution.value.title }))
  return lines.join('\n')
}

async function submitHomeInquiry() {
  inquiryMessage.value = ''
  inquiryError.value = validateInquiryForm()
  if (inquiryError.value) return

  isSubmittingInquiry.value = true
  try {
    await createInquiry({
      name: inquiryForm.name.trim() || homeLabels.value.defaultName,
      company: inquiryForm.company.trim() || homeLabels.value.defaultCompany,
      email: inquiryForm.email.trim(),
      phone: inquiryForm.phone.trim() || undefined,
      product_slug: inquiryForm.product_slug || undefined,
      solution_slug: inquiryForm.solution_slug || undefined,
      message: inquiryForm.message.trim(),
      source_page: '/home',
      attachment: inquiryAttachment.value,
    })
    inquiryMessage.value = t('contact.success')
    inquiryForm.email = ''
    inquiryForm.phone = ''
    inquiryForm.product_slug = ''
    inquiryForm.solution_slug = ''
    inquiryForm.message = ''
    inquiryAttachment.value = null
  } catch {
    inquiryError.value = t('contact.submitError')
  } finally {
    isSubmittingInquiry.value = false
  }
}

watch(() => [heroBanners.value.length, heroCarousel.value.autoplay, heroCarousel.value.intervalSeconds], () => {
  if (activeBannerIndex.value >= heroBanners.value.length) activeBannerIndex.value = 0
  startBannerAutoplay()
})

onMounted(async () => {
  document.addEventListener('visibilitychange', syncBannerAutoplay)
  if (props.initialHome) {
    startBannerAutoplay()
    return
  }
  try {
    const [homeResponse, categoryResponse, solutionResponse] = await Promise.all([
      getHome(),
      getCategories(),
      getSolutions(),
    ])
    home.value = homeResponse
    categories.value = categoryResponse
    solutions.value = solutionResponse
    startBannerAutoplay()
  } catch {
    startBannerAutoplay()
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  stopBannerAutoplay()
  document.removeEventListener('visibilitychange', syncBannerAutoplay)
  stopVoiceInput()
})
</script>

<template>
  <div class="home-page procurement-home" :data-locale="locale">
    <section class="procurement-hero">
      <HomeCategoryRail
        :categories="heroCategoryTiles"
        :label="t('home.productCategoriesLabel')"
        :more-label="copy.moreCategories"
      />

      <div class="scenario-request">
        <div
          class="request-stage banner-carousel-stage"
          @mouseenter="stopBannerAutoplay"
          @mouseleave="startBannerAutoplay"
        >
          <LocalizedLink
            class="banner-carousel-link"
            :to="activeBannerLink"
            :external="activeBannerLinkExternal"
            prefetch
            :aria-label="activeBanner?.title ?? copy.heroTitle"
            @focus="stopBannerAutoplay"
            @blur="startBannerAutoplay"
          />
          <img
            v-if="heroBannerImage.src"
            class="banner-carousel-image"
            :src="heroBannerImage.src"
            :srcset="heroBannerImage.srcset || undefined"
            sizes="(max-width: 1024px) 100vw, 834px"
            :alt="activeBanner?.title ?? copy.heroTitle"
            width="1600"
            height="413"
            loading="eager"
            fetchpriority="high"
            decoding="async"
          />
          <h1>{{ activeBanner?.title ?? copy.heroTitle }}</h1>
          <p>{{ activeBanner?.subtitle ?? copy.heroSubtitle }}</p>
          <span v-if="shouldShowBannerDots" class="banner-dot-row" :aria-label="t('home.bannerSlidesLabel')">
            <button
              v-for="(banner, index) in heroBanners"
              :key="banner.id"
              :class="{ active: index === activeBannerIndex }"
              type="button"
              :aria-label="t('home.showBanner', '', { index: String(index + 1) })"
              @click.prevent.stop="goToBanner(index)"
            />
          </span>
        </div>

        <form class="quick-inquiry-card" @submit.prevent="submitHomeInquiry">
          <textarea
            v-model="inquiryForm.message"
            :placeholder="homeInquiryPlaceholder"
          ></textarea>
          <div class="quick-tools">
            <label class="quick-tool-button">
              <Paperclip class="tool-icon" />
              <span>{{ homeLabels.attach }}</span>
              <input type="file" @change="handleAttachmentChange" />
            </label>
            <button
              class="quick-tool-button"
              type="button"
              :class="{ active: isListening || isTranscribing }"
              @click="toggleVoiceInput"
            >
              <Mic class="tool-icon" />
              <span>{{ isListening || isTranscribing ? homeLabels.listening : homeLabels.voice }}</span>
            </button>
          </div>
          <p v-if="inquiryAttachment" class="attachment-name">{{ inquiryAttachment.name }}</p>
          <div class="quick-fields">
            <label>
              <span>{{ homeLabels.email }} *</span>
              <input v-model="inquiryForm.email" type="email" placeholder="contact@example.com" required />
            </label>
            <label>
              <span>{{ homeLabels.phone }}</span>
              <input v-model="inquiryForm.phone" placeholder="+1 555 000 0000" />
            </label>
            <button type="submit" :disabled="isSubmittingInquiry">
              {{ isSubmittingInquiry ? t('contact.sending') : homeLabels.submit }}
            </button>
          </div>
          <p v-if="inquiryError" class="form-alert error">{{ inquiryError }}</p>
          <p v-if="inquiryMessage" class="form-alert success">{{ inquiryMessage }}</p>
        </form>
      </div>

      <aside class="assurance-rail">
        <article v-for="assurance in platformSellingPoints" :key="assurance.title" class="assurance-item">
          <span class="assurance-icon">
            <component :is="assuranceIcon(assurance.icon)" />
          </span>
          <span>
            <strong>{{ assurance.title }}</strong>
            <small>{{ assurance.copy }}</small>
          </span>
        </article>
      </aside>
    </section>

    <section class="procurement-modes">
      <article v-for="mode in procurementModes" :key="mode.badge" class="mode-card">
        <span class="mode-badge">{{ mode.badge }}</span>
        <h2>{{ mode.title }}</h2>
        <p>{{ mode.copy }}</p>
        <div class="mode-steps">
          <span v-for="(step, index) in mode.steps" :key="step">
            <b>{{ index + 1 }}</b>
            <small>{{ step }}</small>
          </span>
        </div>
        <LocalizedLink :class="['mode-action', mode.badge.endsWith('A') || mode.badge.includes('A') ? 'filled' : 'outline']" :to="mode.to">
          {{ mode.action }}
        </LocalizedLink>
      </article>
    </section>

    <div class="procurement-core-band">
      <section class="procurement-section product-showcase">
        <div class="procurement-heading">
          <h2>{{ t('home.hotProducts') }}</h2>
          <LocalizedLink to="/products">{{ homeLabels.viewMore }} ›</LocalizedLink>
        </div>
        <div v-if="isLoading" class="state-panel">{{ t('home.loadingMessage') }}</div>
        <div v-else class="market-product-grid">
          <ProductCard v-for="product in hotProducts" :key="product.slug" :product="product" />
        </div>
      </section>

      <section class="procurement-section scenario-section">
        <div class="procurement-section-inner">
          <div class="procurement-heading">
            <h2>{{ t('solutions.scenarios') }}</h2>
            <LocalizedLink to="/solutions/ev-charging-station">{{ homeLabels.moreScenes }} ›</LocalizedLink>
          </div>
          <div class="scenario-grid">
            <button
              v-for="scenario in scenarioCards"
              :key="scenario.title"
              class="scenario-card"
              type="button"
              @click="applyDemand(scenario.demand)"
            >
              <span class="scenario-icon">{{ scenario.icon }}</span>
              <strong>{{ scenario.title }}</strong>
              <small>{{ scenario.copy }}</small>
              <em>{{ homeLabels.submit }}</em>
            </button>
          </div>
        </div>
      </section>

      <section class="procurement-section reasons-section">
        <div class="procurement-heading">
          <h2>{{ whyChooseCopy.title }}</h2>
          <LocalizedLink to="/about">{{ whyChooseCopy.ctaText }} ›</LocalizedLink>
        </div>
        <div class="reason-grid">
          <article v-for="reason in whyChooseReasons" :key="reason.number" class="reason-card">
            <div class="reason-title">
              <span>{{ reason.number }}</span>
              <div>
                <strong>{{ reason.title }}</strong>
                <small>{{ reason.subtitle }}</small>
              </div>
            </div>
            <blockquote>{{ reason.quote }}</blockquote>
            <ul>
              <li v-for="bullet in reason.bullets" :key="bullet">{{ bullet }}</li>
            </ul>
          </article>
        </div>
      </section>

      <section class="procurement-section category-showcase">
        <div class="procurement-heading">
          <h2>{{ homeLabels.productCategories }}</h2>
          <LocalizedLink to="/products">{{ homeLabels.viewMore }} ›</LocalizedLink>
        </div>
        <div class="category-grid">
          <LocalizedLink v-for="category in categoryTiles" :key="category.slug" class="category-tile" :to="`/products/category/${category.slug}`">
            <span :class="['category-tile-icon', `tone-${category.visualTone}`]">
              <component :is="categoryVisualIcon(category.visualKey)" />
            </span>
            <strong class="category-tile-title">{{ category.name }}</strong>
            <span class="category-tile-meta">{{ category.sku }} {{ t('common.sku') }}</span>
            <small class="category-tile-summary">{{ category.tags.slice(0, 3).join(' · ') }}</small>
            <em class="category-tile-action">{{ homeLabels.viewMore }}</em>
          </LocalizedLink>
        </div>
      </section>

      <section class="procurement-section supplier-section">
        <div class="procurement-heading">
          <h2>{{ homeLabels.suppliers }}</h2>
          <LocalizedLink to="/about">{{ homeLabels.supplierSystem }} ›</LocalizedLink>
        </div>
        <div class="supplier-grid">
          <article v-for="supplier in supplierCards" :key="supplier.name" class="supplier-card">
            <span class="supplier-icon">{{ supplier.icon }}</span>
            <strong>{{ supplier.name }}</strong>
            <em>{{ supplier.badge }}</em>
            <small>{{ supplier.scope }}</small>
          </article>
        </div>
      </section>
    </div>

  </div>
</template>
