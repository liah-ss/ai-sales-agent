import { useI18n, type Locale } from '../composables/useI18n'
import type { Banner, DeliveryCaseSummary, NewsArticleSummary, ProductCategory, ProductSummary, SolutionSummary } from '../types/catalog'
import { resolveLocalizedRecord, resolveStrictLocalizedRecord } from '../utils/localizedRecord'

interface LocalizedRecord {
  [key: string]: LocalizedNode
}

type LocalizedNode = string | string[] | LocalizedRecord

 const presetTextTranslations: Record<string, Record<Locale, string>> = {
  '输入应用场景、设备需求或技术参数，如：工业园区配电改造...': {
    en: 'Enter application scenario, equipment demand or technical parameters, e.g. industrial park distribution upgrade...',
    'zh-CN': '输入应用场景、设备需求或技术参数，如：工业园区配电改造...',
    id: 'Masukkan skenario aplikasi, kebutuhan alat, atau parameter teknis, mis. upgrade distribusi kawasan industri...',
  },
  'Enter application scenario, equipment demand or technical parameters, e.g. industrial park distribution upgrade...': {
    en: 'Enter application scenario, equipment demand or technical parameters, e.g. industrial park distribution upgrade...',
    'zh-CN': '输入应用场景、设备需求或技术参数，如：工业园区配电改造...',
    id: 'Masukkan skenario aplikasi, kebutuhan alat, atau parameter teknis, mis. upgrade distribusi kawasan industri...',
  },
  'Search application scenario, equipment demand or technical parameters...': {
    en: 'Search application scenario, equipment demand or technical parameters...',
    'zh-CN': '搜索应用场景、设备需求或技术参数...',
    id: 'Cari skenario aplikasi, kebutuhan alat, atau parameter teknis...',
  },
  '当前浏览器不支持语音输入。': {
    en: 'Voice input is not supported in this browser.',
    'zh-CN': '当前浏览器不支持语音输入。',
    id: 'Input suara tidak didukung di browser ini.',
  },
  '留下您的联系电话和邮箱，以便解决您的需求': {
    en: 'Please leave your phone or email so we can respond to your requirement.',
    'zh-CN': '留下您的联系电话和邮箱，以便解决您的需求',
    id: 'Mohon tinggalkan telepon atau email agar kami dapat merespons kebutuhan Anda.',
  },
  '上海虹桥阿里中心': {
    en: 'Alibaba Center, Hongqiao, Shanghai, China',
    'zh-CN': '上海虹桥阿里中心',
    id: 'Alibaba Center Hongqiao, Shanghai, China',
  },
  'ExampleCorp Industrial Park, Shenzhen, China': {
    en: 'ExampleCorp Industrial Park, Shenzhen, China',
    'zh-CN': '中国深圳 ExampleCorp 产业园',
    id: 'ExampleCorp Industrial Park, Shenzhen, China',
  },
  'Years Experience': {
    en: 'Years Experience',
    'zh-CN': '行业经验',
    id: 'Tahun pengalaman',
  },
  'Power and electrical supply experience': {
    en: 'Power and electrical supply experience',
    'zh-CN': '电力与电气供应经验',
    id: 'Pengalaman suplai daya dan listrik',
  },
  'Projects Delivered': {
    en: 'Projects Delivered',
    'zh-CN': '已交付项目',
    id: 'Proyek terkirim',
  },
  'Commercial and infrastructure projects': {
    en: 'Commercial and infrastructure projects',
    'zh-CN': '商业与基础设施项目',
    id: 'Proyek komersial dan infrastruktur',
  },
  'Export Countries': {
    en: 'Export Countries',
    'zh-CN': '出口国家',
    id: 'Negara ekspor',
  },
  'Global delivery and service network': {
    en: 'Global delivery and service network',
    'zh-CN': '全球交付与服务网络',
    id: 'Jaringan pengiriman dan layanan global',
  },
  'Skilled Employees': {
    en: 'Skilled Employees',
    'zh-CN': '专业团队成员',
    id: 'Karyawan terampil',
  },
  'Engineering, production and support team': {
    en: 'Engineering, production and support team',
    'zh-CN': '工程、生产与支持团队',
    id: 'Tim engineering, produksi dan dukungan',
  },
  'ISO & CE Certified': {
    en: 'ISO & CE Certified',
    'zh-CN': 'ISO 与 CE 认证',
    id: 'Bersertifikat ISO & CE',
  },
  'Global quality standards': {
    en: 'Global quality standards',
    'zh-CN': '全球质量标准',
    id: 'Standar kualitas global',
  },
  'Global Delivery': {
    en: 'Global Delivery',
    'zh-CN': '全球交付',
    id: 'Pengiriman global',
  },
  '50+ countries served': {
    en: '50+ countries served',
    'zh-CN': '服务 50+ 国家',
    id: 'Melayani 50+ negara',
  },
  'OEM/ODM Available': {
    en: 'OEM/ODM Available',
    'zh-CN': '支持 OEM/ODM',
    id: 'OEM/ODM tersedia',
  },
  'Custom branding and specs': {
    en: 'Custom branding and specs',
    'zh-CN': '支持品牌与规格定制',
    id: 'Branding dan spesifikasi kustom',
  },
  '24/7 Tech Support': {
    en: '24/7 Tech Support',
    'zh-CN': '7x24 技术支持',
    id: 'Dukungan teknis 24/7',
  },
  'Fast engineering consultation': {
    en: 'Fast engineering consultation',
    'zh-CN': '快速工程咨询',
    id: 'Konsultasi engineering cepat',
  },
  'OEM/ODM Solutions': {
    en: 'OEM/ODM Solutions',
    'zh-CN': 'OEM/ODM 方案',
    id: 'Solusi OEM/ODM',
  },
  'Custom design and manufacturing solutions for your project requirements.': {
    en: 'Custom design and manufacturing solutions for your project requirements.',
    'zh-CN': '按项目需求提供定制设计与制造方案。',
    id: 'Solusi desain dan manufaktur kustom sesuai kebutuhan proyek.',
  },
  'Strict quality control meeting international safety and trade standards.': {
    en: 'Strict quality control meeting international safety and trade standards.',
    'zh-CN': '严格质控，满足国际安全与贸易标准。',
    id: 'Quality control ketat sesuai standar keselamatan dan perdagangan internasional.',
  },
  'Fast Global Shipping': {
    en: 'Fast Global Shipping',
    'zh-CN': '全球快速发货',
    id: 'Pengiriman global cepat',
  },
  'Efficient logistics network to support reliable project delivery.': {
    en: 'Efficient logistics network to support reliable project delivery.',
    'zh-CN': '高效物流网络支撑可靠项目交付。',
    id: 'Jaringan logistik efisien untuk mendukung delivery proyek yang andal.',
  },
  '24/7 Support': {
    en: '24/7 Support',
    'zh-CN': '7x24 支持',
    id: 'Dukungan 24/7',
  },
  'Dedicated account managers ready to assist with requirements.': {
    en: 'Dedicated account managers ready to assist with requirements.',
    'zh-CN': '专属客户经理快速协助确认需求。',
    id: 'Account manager khusus siap membantu kebutuhan Anda.',
  },
  'Raw material and component inspection': {
    en: 'Raw material and component inspection',
    'zh-CN': '原材料和关键部件检验',
    id: 'Inspeksi bahan baku dan komponen',
  },
  'Production-stage quality monitoring': {
    en: 'Production-stage quality monitoring',
    'zh-CN': '生产阶段质量监控',
    id: 'Pemantauan kualitas selama produksi',
  },
  'Finished product reliability tests': {
    en: 'Finished product reliability tests',
    'zh-CN': '成品可靠性测试',
    id: 'Uji reliabilitas produk jadi',
  },
  'Packing and shipment readiness checks': {
    en: 'Packing and shipment readiness checks',
    'zh-CN': '包装和发货准备检查',
    id: 'Pemeriksaan kesiapan packing dan pengiriman',
  },
  '第一档': {
    en: 'Tier 1',
    'zh-CN': '第一档',
    id: 'Tier 1',
  },
  '第二档': {
    en: 'Tier 2',
    'zh-CN': '第二档',
    id: 'Tier 2',
  },
  '第三档': {
    en: 'Tier 3',
    'zh-CN': '第三档',
    id: 'Tier 3',
  },
  '1 - 10 个': {
    en: '1 - 10 pcs',
    'zh-CN': '1 - 10 个',
    id: '1 - 10 pcs',
  },
  '11 - 30 个': {
    en: '11 - 30 pcs',
    'zh-CN': '11 - 30 个',
    id: '11 - 30 pcs',
  },
  '询盘有惊喜': {
    en: 'Surprise on inquiry',
    'zh-CN': '询盘有惊喜',
    id: 'Kejutan saat inquiry',
  },
  '物流交付': {
    en: 'Logistics delivery',
    'zh-CN': '物流交付',
    id: 'Pengiriman logistik',
  },
  '运费和交货日期需协商。立即与供应商联系了解更多详情。': {
    en: 'Freight cost and delivery date need to be confirmed. Contact us now for more details.',
    'zh-CN': '运费和交货日期需协商。立即与供应商联系了解更多详情。',
    id: 'Biaya pengiriman dan tanggal delivery perlu dikonfirmasi. Hubungi kami untuk detail lebih lanjut.',
  },
  '全球海运': {
    en: 'Global ocean shipping',
    'zh-CN': '全球海运',
    id: 'Pengiriman laut global',
  },
  '跨境陆运': {
    en: 'Cross-border land transport',
    'zh-CN': '跨境陆运',
    id: 'Transportasi darat lintas negara',
  },
  '质保3年': {
    en: '3-year warranty',
    'zh-CN': '质保3年',
    id: 'Garansi 3 tahun',
  },
  '维保10年': {
    en: '10-year maintenance',
    'zh-CN': '维保10年',
    id: 'Perawatan 10 tahun',
  },
  '500 Units (Customizable)': {
    en: '500 Units (Customizable)',
    'zh-CN': '500 件（可定制）',
    id: '500 Unit (Dapat Disesuaikan)',
  },
  'Best Seller': {
    en: 'Best Seller',
    'zh-CN': '畅销款',
    id: 'Terlaris',
  },
  OEM: {
    en: 'OEM',
    'zh-CN': 'OEM',
    id: 'OEM',
  },
  Hot: {
    en: 'Hot',
    'zh-CN': '热销',
    id: 'Hot',
  },
  Silent: {
    en: 'Silent',
    'zh-CN': '静音款',
    id: 'Silent',
  },
  Popular: {
    en: 'Popular',
    'zh-CN': '热门',
    id: 'Populer',
  },
}

const localizedContent: Partial<Record<Locale, Record<string, LocalizedNode>>> = {
  en: {
    site: {
      tagline: 'Power equipment global sourcing platform',
      footerDescription: 'Engineer-led power equipment sourcing platform with selection, quotation, quality control, delivery and after-sales support.',
    },
    header: {
      promise: 'Global power equipment direct sourcing · scenario procurement · one-stop delivery',
      searchPlaceholder: 'Enter application scenario, equipment demand or technical parameters, e.g. industrial park distribution upgrade...',
      searchAction: 'Smart Match',
      allCategories: 'All product categories',
      hotScenesLabel: 'Hot scenarios:',
      hotScenes: ['PV station package', 'Factory distribution upgrade', 'Data center power', 'EV charging site', 'Smart grid retrofit'],
      login: 'Login',
      register: 'Register',
    },
    footer: {
      procurementService: 'Procurement service',
      submitDemand: 'Submit procurement demand',
      scenarioSelect: 'Scenario-based selection',
      platformGuarantee: 'Platform guarantee',
      supplierStandard: 'Supplier admission standards',
      qualityProcess: 'Quality control process',
      deliveryPromise: 'Delivery commitment',
      afterSales: 'After-sales warranty',
      privacyPolicy: 'Privacy policy',
      aboutUs: 'About us',
    },
    nav: {
      deliveryCases: 'Delivery cases',
      industryNews: 'Industry insights',
      helpCenter: 'Help Center',
    },
    pages: {
      product: { headline: 'Technical product details for procurement decisions', summary: 'Configure product gallery, selling points, parameters, certificates and inquiry guidance.' },
      solution: { headline: 'Scenario solution publishing', summary: 'Configure solution hero image, pain points, architecture, related products and case outcomes.' },
      about: { headline: 'Factory capability and long-term trust', summary: 'Configure company story, factory photos, certificates, capacity and service commitments.' },
      contact: { headline: 'Inquiry entry and sales contact information', summary: 'Configure contact form copy, WhatsApp, email, address, map image and response promise.' },
    },
    blocks: {
      'product-overview': { title: 'Product overview', body: 'A short paragraph explaining product positioning and procurement value.' },
      'product-specs': { title: 'Specifications', body: 'Voltage: model, material, certification and customization fields' },
      'product-gallery': { title: 'Product gallery', body: 'Main image, detail photos, certificate images and application scenarios.' },
      'about-story': { title: 'Company story', body: 'Briefly introduce the company history and global export positioning.' },
      'about-capability': { title: 'Factory capability', body: 'Production lines: testing, certification and quality management system' },
      'about-platform-intro': { title: 'Scenario-driven sourcing platform', body: 'ExampleCorp coordinates product selection, supplier verification, quality control, logistics and after-sales response through one managed workflow.' },
      'about-supply-chain': { title: 'Supply chain capability', body: 'The supply network covers transformers, switchgear, metering, PV power equipment and project accessories.' },
      'about-team': { title: 'Engineer-led service team', body: 'Electrical engineers, sourcing consultants, quality inspectors and logistics coordinators work together for accountable delivery.' },
      'about-certificates': { title: 'Qualifications and certificates', body: 'ISO9001: Quality management system\nCE: Product compliance files\nIEC: International electrotechnical standards' },
    },
  },
  'zh-CN': {
    banners: {
      'banner-oil-transformer': {
        title: '油浸式配电变压器',
        subtitle: 'MT-11 全密封油浸式变压器，适用于稳定的中低压配电网络。',
        badge: '变压器',
      },
      'banner-low-voltage-switchgear': {
        title: '低压成套配电柜',
        subtitle: 'GEN-1 与 GEN-2 开关柜，适用于进线、出线和无功补偿场景。',
        badge: '开关柜',
      },
      'banner-pv-box-substation': {
        title: '光伏升压箱式变电站',
        subtitle: 'YBM 10.5/0.8kV 一体化光伏箱变，适用于山地、荒漠和屋顶光伏电站。',
        badge: '光伏箱变',
      },
      'banner-smart-meter': {
        title: '智能电能表（AMI）',
        subtitle: '三相费控智能电表，支持 4G、NB-IoT 和 LoRaWAN 通信。',
        badge: 'AMI',
      },
    },
    features: {
      'feature-oem': { title: 'OEM/ODM 方案', content: '为长期电力项目提供定制制造、品牌和工程支持。' },
      'feature-certified': { title: 'ISO 与 CE 认证', content: '以国际认可的质量与合规标准进行工厂化生产控制。' },
      'feature-shipping': { title: '全球快速交付', content: '提供出口包装、文件和稳定交付计划，服务海外买家。' },
      'feature-support': { title: '全天候支持', content: '在项目各阶段提供及时的售前、售后和技术沟通。' },
    },
    qualitySteps: {
      'Incoming Inspection': { title: '来料检验', content: '原材料和关键部件检验' },
      'In-Process QC': { title: '过程质检', content: '生产阶段质量监控' },
      'Final Testing': { title: '最终测试', content: '成品可靠性测试' },
      'Outgoing QA': { title: '出货质检', content: '包装和发货准备检查' },
    },
    pages: {
      product: { headline: '面向采购决策的技术型产品详情', summary: '配置产品图库、卖点、参数、认证和询盘引导。' },
      solution: { headline: '场景化解决方案发布', summary: '配置解决方案主图、痛点、架构、配套产品和案例结果。' },
      about: { headline: '工厂能力与长期信任', summary: '配置公司故事、工厂图片、证书、产能和服务承诺。' },
      contact: { headline: '询盘入口与销售联系信息', summary: '配置联系表单文案、WhatsApp、邮箱、地址、地图和响应承诺。' },
    },
    blocks: {
      'product-overview': { title: '产品概览', body: '用一段话说明产品定位和采购价值。' },
      'product-specs': { title: '规格参数', body: '电压: 型号、材料、认证和定制字段' },
      'product-gallery': { title: '产品图库', body: '主图、细节图、证书图片和应用场景。' },
      'about-story': { title: '公司故事', body: '简要介绍公司发展历程和全球出口定位。' },
      'about-capability': { title: '工厂能力', body: '生产线: 测试、认证和质量管理体系' },
      'about-platform-intro': { title: '场景化采购平台', body: 'ExampleCorp 将产品选型、供应商验证、品控、物流与售后响应整合在一套托管流程中，帮助海外客户降低跨境采购沟通和交付风险。' },
      'about-supply-chain': { title: '供应链能力', body: '供应网络覆盖变压器、开关柜、计量表计、光伏工业设备和项目配套件，可按项目要求前置供应商筛选、文件核验和出货检验。' },
      'about-team': { title: '工程师主导的服务团队', body: '电气工程师、采购顾问、质检人员和物流协调人员协同工作，确保每个订单都有技术复核、商务跟进和交付责任人。' },
      'about-certificates': { title: '资质证书', body: 'ISO9001: 质量管理体系\nCE: 产品合规文件\nIEC: 国际电工标准' },
    },
    site: {
      tagline: '工业设备全球采购平台',
      footerDescription: '平台自营选品模式，由资深电气工程师团队筛选供应商与产品，提供选型方案、集采报价、品控交付与售后质保的一站式服务。',
    },
    footer: {
      procurementService: '采购服务',
      submitDemand: '提交采购需求',
      scenarioSelect: '按场景选型',
      platformGuarantee: '平台保障',
      supplierStandard: '供应商准入标准',
      qualityProcess: '质量管控流程',
      deliveryPromise: '交付承诺',
      afterSales: '售后质保',
      privacyPolicy: '隐私政策',
      aboutUs: '关于我们',
    },
    header: {
      promise: '全球工业设备直采 · 场景化采购 · 一站式交付',
      searchPlaceholder: '输入应用场景、设备需求或技术参数，如：工业园区配电改造...',
      searchAction: '智能匹配',
      allCategories: '全部产品分类',
      hotScenesLabel: '热门场景：',
      hotScenes: ['光伏电站配套', '工厂配电升级', '数据中心供电', '充电桩建设', '智能电网改造'],
      login: '登录',
      register: '注册',
    },
    nav: {
      deliveryCases: '交付案例',
      industryNews: '行业资讯',
      helpCenter: '帮助中心',
    },
  },
  id: {
    banners: {
      'banner-oil-transformer': {
        title: 'Transformator Distribusi Oil-Immersed',
        subtitle: 'Transformator tertutup penuh MT-11 untuk jaringan distribusi tegangan menengah dan rendah yang stabil.',
        badge: 'Transformator',
      },
      'banner-low-voltage-switchgear': {
        title: 'Panel Distribusi Tegangan Rendah',
        subtitle: 'Panel GEN-1 dan GEN-2 untuk incoming line, outgoing line, dan kompensasi daya reaktif.',
        badge: 'Switchgear',
      },
      'banner-pv-box-substation': {
        title: 'Gardu Box Step-up PV',
        subtitle: 'Gardu PV terintegrasi YBM 10.5/0.8kV untuk pembangkit surya di pegunungan, gurun, dan atap.',
        badge: 'Gardu PV',
      },
      'banner-smart-meter': {
        title: 'Meter Energi Pintar (AMI)',
        subtitle: 'Meter pintar tiga fasa dengan komunikasi 4G, NB-IoT, dan LoRaWAN.',
        badge: 'AMI',
      },
    },
    features: {
      'feature-oem': { title: 'Solusi OEM/ODM', content: 'Dukungan manufaktur, branding, dan engineering khusus untuk proyek kelistrikan jangka panjang.' },
      'feature-certified': { title: 'Bersertifikat ISO & CE', content: 'Produksi terkendali dengan standar kualitas dan kepatuhan internasional.' },
      'feature-shipping': { title: 'Pengiriman Global Cepat', content: 'Packing ekspor, dokumen, dan jadwal pengiriman stabil untuk pembeli luar negeri.' },
      'feature-support': { title: 'Dukungan 24/7', content: 'Komunikasi sales, after-sales, dan teknis yang responsif di setiap tahap proyek.' },
    },
    qualitySteps: {
      'Incoming Inspection': { title: 'Inspeksi Masuk', content: 'Inspeksi bahan baku dan komponen' },
      'In-Process QC': { title: 'QC Proses', content: 'Pemantauan kualitas selama produksi' },
      'Final Testing': { title: 'Pengujian Akhir', content: 'Uji keandalan produk jadi' },
      'Outgoing QA': { title: 'QA Pengiriman', content: 'Pemeriksaan kesiapan packing dan pengiriman' },
    },
    pages: {
      product: { headline: 'Detail produk teknis untuk keputusan pembelian', summary: 'Konfigurasi galeri produk, keunggulan, parameter, sertifikat, dan arahan inquiry.' },
      solution: { headline: 'Publikasi solusi berbasis skenario', summary: 'Konfigurasi hero solusi, pain point, arsitektur, produk terkait, dan hasil kasus.' },
      about: { headline: 'Kapabilitas pabrik dan kepercayaan jangka panjang', summary: 'Konfigurasi cerita perusahaan, foto pabrik, sertifikat, kapasitas produksi, dan janji layanan.' },
      contact: { headline: 'Form inquiry dan informasi kontak sales', summary: 'Konfigurasi copy formulir kontak, WhatsApp, email, alamat, gambar peta, dan janji respons.' },
    },
    blocks: {
      'product-overview': { title: 'Ikhtisar Produk', body: 'Satu paragraf tentang posisi produk dan nilai bagi pembeli.' },
      'product-specs': { title: 'Spesifikasi', body: 'Tegangan: model, material, sertifikasi, dan opsi kustomisasi' },
      'product-gallery': { title: 'Galeri', body: 'Gambar utama, foto detail, gambar sertifikat, dan skenario aplikasi.' },
      'about-story': { title: 'Cerita Perusahaan', body: 'Riwayat singkat dan posisi ekspor global.' },
      'about-capability': { title: 'Kapabilitas Pabrik', body: 'Lini produksi: pengujian, sertifikasi, dan manajemen kualitas' },
      'about-platform-intro': { title: 'Platform sourcing berbasis skenario', body: 'ExampleCorp mengelola seleksi produk, verifikasi supplier, quality control, logistik, dan respons after-sales dalam satu workflow terkelola untuk mengurangi risiko procurement lintas negara.' },
      'about-supply-chain': { title: 'Kapabilitas supply chain', body: 'Jaringan supply mencakup transformator, switchgear, metering, peralatan daya PV, dan aksesori proyek, dengan screening supplier, pemeriksaan dokumen, dan inspeksi pra-pengiriman sesuai kebutuhan proyek.' },
      'about-team': { title: 'Tim layanan berbasis engineering', body: 'Engineer listrik, konsultan sourcing, inspector kualitas, dan koordinator logistik bekerja bersama agar setiap order memiliki review teknis, follow-up komersial, dan akuntabilitas delivery.' },
      'about-certificates': { title: 'Kualifikasi dan sertifikat', body: 'ISO9001: Sistem manajemen kualitas\nCE: Dokumen compliance produk\nIEC: Standar elektroteknik internasional' },
    },
    site: {
      tagline: 'Platform sourcing peralatan daya global',
      footerDescription: 'Platform sourcing peralatan daya dengan seleksi engineer, paket solusi, quote terintegrasi, quality control, pengiriman, dan after-sales.',
    },
    footer: {
      procurementService: 'Layanan procurement',
      submitDemand: 'Kirim kebutuhan procurement',
      scenarioSelect: 'Seleksi berbasis skenario',
      platformGuarantee: 'Jaminan platform',
      supplierStandard: 'Standar penerimaan supplier',
      qualityProcess: 'Proses quality control',
      deliveryPromise: 'Komitmen pengiriman',
      afterSales: 'Garansi after-sales',
      privacyPolicy: 'Kebijakan privasi',
      aboutUs: 'Tentang kami',
    },
    header: {
      promise: 'Sourcing langsung peralatan daya · procurement berbasis skenario · one-stop delivery',
      searchPlaceholder: 'Masukkan skenario aplikasi, kebutuhan alat, atau parameter teknis...',
      searchAction: 'Cocokkan',
      allCategories: 'Semua kategori produk',
      hotScenesLabel: 'Skenario populer:',
      hotScenes: ['Paket PLTS', 'Upgrade distribusi pabrik', 'Daya data center', 'Lokasi EV charging', 'Retrofit smart grid'],
      login: 'Login',
      register: 'Daftar',
    },
    nav: {
      deliveryCases: 'Kasus pengiriman',
      industryNews: 'Insight industri',
      helpCenter: 'Pusat Bantuan',
    },
  },
}

function resolvePath(source: Record<string, LocalizedNode> | undefined, path: string) {
  return path.split('.').reduce<LocalizedNode | undefined>((current, segment) => {
    if (!current || typeof current !== 'object' || Array.isArray(current)) return undefined
    return current[segment]
  }, source)
}

const presetTextAliasTranslations = Object.values(presetTextTranslations).reduce<Record<string, Record<Locale, string>>>(
  (aliases, translations) => {
    Object.values(translations).forEach((value) => {
      aliases[value.trim()] = translations
    })
    return aliases
  },
  {},
)

const bannerKeyByProductSlug: Record<string, string> = {
  'oil-immersed-distribution-transformer': 'banner-oil-transformer',
  'low-voltage-complete-distribution-cabinet': 'banner-low-voltage-switchgear',
  'pv-box-type-substation': 'banner-pv-box-substation',
  'smart-ami-meter': 'banner-smart-meter',
  'managed:banner-oil-transformer': 'banner-oil-transformer',
  'managed:banner-low-voltage-switchgear': 'banner-low-voltage-switchgear',
  'managed:banner-pv-box-substation': 'banner-pv-box-substation',
  'managed:banner-smart-meter': 'banner-smart-meter',
}

export function localizeBannerForLocale(banner: Banner, locale: Locale): Banner {
  const key = banner.product_slug ? bannerKeyByProductSlug[banner.product_slug] : ''
  if (!key) {
    return {
      ...banner,
      title: presetTextAliasTranslations[banner.title.trim()]?.[locale] ?? banner.title,
      subtitle: banner.subtitle ? (presetTextAliasTranslations[banner.subtitle.trim()]?.[locale] ?? banner.subtitle) : banner.subtitle,
    }
  }
  const title = resolvePath(localizedContent[locale], `banners.${key}.title`)
  const subtitle = resolvePath(localizedContent[locale], `banners.${key}.subtitle`)
  const badge = resolvePath(localizedContent[locale], `banners.${key}.badge`)
  return {
    ...banner,
    title: typeof title === 'string' ? title : banner.title,
    subtitle: typeof subtitle === 'string' ? subtitle : banner.subtitle,
    badge_text: typeof badge === 'string' ? badge : banner.badge_text,
  }
}

function translatePresetText(value: string | null | undefined, locale: Locale) {
  if (!value) return value
  return presetTextAliasTranslations[value.trim()]?.[locale] ?? value
}

export function useLocalizedContent() {
  const { locale } = useI18n()

  function text(path: string, fallback: string | null | undefined = '') {
    if (fallback === '') return ''
    const value = resolvePath(localizedContent[locale.value], path)
    return typeof value === 'string' ? value : localizeText(fallback)
  }

  function list(path: string, fallback: string[] = []) {
    const value = resolvePath(localizedContent[locale.value], path)
    return Array.isArray(value) ? value : fallback
  }

  function localizeText(value: string | null | undefined) {
    return translatePresetText(value, locale.value) ?? ''
  }

  function localizedCategory(category: ProductCategory): ProductCategory
  function localizedCategory<T extends { name: string; slug: string; translations?: ProductCategory['translations'] }>(category: T): T
  function localizedCategory<T extends { name: string; slug: string; translations?: ProductCategory['translations'] }>(category: T) {
    const localized = resolveStrictLocalizedRecord(category, locale.value, ['name'])
    return {
      ...localized,
      name: localized.name || category.slug.split('-').filter(Boolean).join(' '),
    }
  }

  function localizeProductCategory(category: ProductCategory): ProductCategory {
    const localized = resolveStrictLocalizedRecord(category, locale.value, [
      'name',
      'fulfillment_methods',
      'fulfillment_items',
      'fulfillment_title',
      'fulfillment_copy',
      'assurance_items',
    ])
    return {
      ...localized,
      name: localized.name || category.slug.split('-').filter(Boolean).join(' '),
    }
  }

  function localizeBanner(banner: Banner): Banner {
    return {
      ...localizeBannerForLocale(banner, locale.value),
      cta_text: banner.cta_text ? localizeText(banner.cta_text) : banner.cta_text,
    }
  }

  function localizeProduct<T extends ProductSummary>(product: T): T {
    const localized = resolveStrictLocalizedRecord(product, locale.value, [
      'name', 'summary', 'description', 'detail_blocks', 'highlights', 'specifications',
      'variants', 'price_tiers', 'fulfillment_methods', 'fulfillment_title',
      'fulfillment_items', 'fulfillment_copy', 'assurance_items', 'process_items', 'moq', 'tag',
      'seo_title', 'seo_description', 'answer_summary',
      'author_name', 'technical_reviewer', 'evidence_urls', 'standards', 'applicable_markets', 'unsuitable_conditions',
    ] as unknown as Array<keyof T>)
    return {
      ...localized,
      name: localized.name || product.product_code || product.model || product.slug,
      category: localizeProductCategory(product.category),
    }
  }

  function localizeSolution<T extends SolutionSummary>(solution: T): T {
    return resolveLocalizedRecord(solution, locale.value, [
      'title', 'summary', 'content', 'document_sections', 'scenarios', 'equipment',
      'benefits', 'detailed_description', 'pitfalls', 'core_parameters',
      'special_contributions',
      'seo_title', 'seo_description', 'answer_summary',
      'author_name', 'technical_reviewer', 'evidence_urls', 'standards', 'applicable_markets', 'unsuitable_conditions',
    ] as unknown as Array<keyof T>)
  }

  function localizeNewsArticle<T extends NewsArticleSummary>(article: T): T {
    return resolveLocalizedRecord(article, locale.value, [
      'title', 'summary', 'content', 'source', 'seo_title', 'seo_description', 'answer_summary',
      'author_name', 'technical_reviewer', 'evidence_urls', 'standards', 'applicable_markets', 'unsuitable_conditions',
    ] as unknown as Array<keyof T>)
  }

  function localizeDeliveryCase<T extends DeliveryCaseSummary>(deliveryCase: T): T {
    return resolveLocalizedRecord(deliveryCase, locale.value, [
      'title', 'summary', 'content', 'project_overview', 'indonesia_fit',
      'professional_configuration', 'key_parameter_table', 'delivery_challenges',
      'project_results', 'client_name', 'industry',
      'seo_title', 'seo_description', 'answer_summary',
      'author_name', 'technical_reviewer', 'evidence_urls', 'standards', 'applicable_markets', 'unsuitable_conditions',
    ] as unknown as Array<keyof T>)
  }

  return {
    text,
    list,
    localizeText,
    localizedCategory,
    localizeBanner,
    localizeProduct,
    localizeSolution,
    localizeNewsArticle,
    localizeDeliveryCase,
  }
}
