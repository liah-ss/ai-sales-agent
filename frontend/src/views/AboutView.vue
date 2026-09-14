<script setup lang="ts">
import { computed } from 'vue'
import { useI18n, type Locale } from '../composables/useI18n'
import { resolveOptimizedAssetUrl } from '../api/client'
import { useWebsiteConfig } from '../composables/useWebsiteConfig'

interface AboutCard {
  icon: string
  title: string
  copy: string
}

interface AboutCopy {
  eyebrow: string
  heroTitle: string
  heroCopy: string
  visualLabel: string
  statsLabel: string
  stats: Array<{ value: string, label: string }>
  companyTitle: string
  companyCopy: string
  missionTitle: string
  missionCopy: string
  teamTitle: string
  teamAdvantages: AboutCard[]
  supplyTitle: string
  supplyCapabilities: AboutCard[]
  workflowSteps: Array<{ title: string, copy: string }>
  indonesiaTitle: string
  indonesiaCopy: string
  indonesiaCapabilities: AboutCard[]
  mapLabel: string
  mapNodes: {
    batam: string
    jakarta: string
    surabaya: string
  }
  ctaTitle: string
  ctaCopy: string
  contactAction: string
  submitAction: string
}

const pageCopy: Record<Locale, AboutCopy> = {
  en: {
    eyebrow: 'About ExampleCorp',
    heroTitle: 'Power equipment sourcing for scenario-specific procurement.',
    heroCopy: 'ExampleCorp connects overseas buyers with qualified power equipment manufacturers, engineering service partners and local delivery resources. We focus on transformers, switchgear, cables, meters, generators, PV equipment and distribution solutions, helping buyers turn project requirements into reliable sourcing plans and delivery-ready orders.',
    visualLabel: 'Distribution cabinet visual',
    statsLabel: 'Platform metrics',
    stats: [
      { value: '50+', label: 'Supported countries and regions' },
      { value: '24h', label: 'Requirement response window' },
      { value: '300+', label: 'Equipment and service categories' },
      { value: 'ID', label: 'Indonesia-centered delivery coordination' },
    ],
    companyTitle: 'Company Profile',
    companyCopy: 'We are a vertical B2B sourcing platform focused on the power equipment industry. Our mission is to integrate product selection, technical matching, supplier coordination, installation service resources and after-sales planning into one workflow, simplifying cross-border procurement. For buyers, this means fewer communication barriers and faster comparison; for agents and project teams, it means clearer inquiry lists, more structured product plans and more transparent delivery processes.',
    missionTitle: 'Our Mission',
    missionCopy: 'Make power equipment procurement for industrial, infrastructure, energy and commercial projects easier, safer and more transparent.',
    teamTitle: 'Team Advantages',
    teamAdvantages: [
      { icon: 'P', title: 'Procurement consultants', copy: 'Convert buyer requirements into inquiry-ready product lists, technical parameters and comparison dimensions.' },
      { icon: 'E', title: 'Electrical specialists', copy: 'Support scenario matching across voltage class, capacity, protection, corrosion resistance and environmental requirements.' },
      { icon: 'S', title: 'Supplier coordinators', copy: 'Coordinate manufacturers, installation partners and spare-part resources for more reliable delivery.' },
      { icon: 'A', title: 'After-sales operators', copy: 'Clarify warranty scope, local response paths, spare-part packages and service documentation.' },
    ],
    supplyTitle: 'Supply Chain and After-Sales Capability',
    supplyCapabilities: [
      { icon: 'Q', title: 'Qualified equipment network', copy: 'Covers transformers, switchgear, cables, meters, generators, PV equipment and complete distribution solutions.' },
      { icon: 'D', title: 'Document support', copy: 'Helps buyers request certificates, test reports, drawings, packing lists and delivery documents before shipment.' },
      { icon: 'M', title: 'Maintenance planning', copy: 'Recommends spare parts, consumables and high-risk components based on the operating environment.' },
    ],
    workflowSteps: [
      { title: 'Requirement review', copy: 'Confirm application scenario, load, environment and compliance requirements.' },
      { title: 'Supplier matching', copy: 'Compare product fit, technical suitability and delivery capability.' },
      { title: 'Order coordination', copy: 'Track production, inspection, logistics and installation interfaces.' },
      { title: 'After-sales support', copy: 'Prepare warranty, spare parts and local service response plans.' },
    ],
    indonesiaTitle: 'Indonesia Local Delivery Capability',
    indonesiaCopy: 'Indonesia projects often face high temperature, heavy rain, coastal salt mist, high humidity and long-distance logistics. Our delivery process is designed to help buyers identify these risks before ordering, then match corrosion-resistant product options, coordinate installation, recommend spare parts and provide local follow-up service.',
    indonesiaCapabilities: [
      { icon: 'ID', title: 'Local context awareness', copy: 'Supports industrial parks, ports, mining areas, commercial sites, data centers and EV charging projects.' },
      { icon: 'L', title: 'Delivery coordination', copy: 'Coordinates logistics, customs documents, site delivery requirements and installation timing.' },
      { icon: 'R', title: 'Risk reminders', copy: 'Focuses on salt mist, rain ingress, thermal derating, lightning protection and spare-part issues.' },
    ],
    mapLabel: 'Indonesia local delivery nodes',
    mapNodes: { batam: 'Logistics Hub', jakarta: 'Head Office', surabaya: 'Branch Office' },
    ctaTitle: 'Ready to discuss your next power equipment requirement?',
    ctaCopy: 'Share your application scenario, location, environment and expected delivery timeline. Our team will help turn it into an inquiry-ready plan.',
    contactAction: 'Contact Us',
    submitAction: 'Submit Requirement',
  },
  'zh-CN': {
    eyebrow: '关于 ExampleCorp',
    heroTitle: '针对特定场景采购的工业设备采购方案。',
    heroCopy: 'ExampleCorp 为海外买家对接合格的工业设备制造商、工程服务合作伙伴和本地交付资源。我们专注于变压器、开关设备、电缆、电表、发电机、光伏和配电解决方案，帮助买家将项目需求转化为可靠的采购计划和可立即交付的订单。',
    visualLabel: '配电柜可视化',
    statsLabel: '平台指标',
    stats: [
      { value: '50+', label: '支持的国家和地区' },
      { value: '24h', label: '需求响应窗口' },
      { value: '300+', label: '设备和服务类别' },
      { value: 'ID', label: '以印度尼西亚为中心的交付协调' },
    ],
    companyTitle: '公司简介',
    companyCopy: '我们是一家专注于工业设备行业的垂直B2B采购平台。我们的使命是将产品选择、技术匹配、供应商协调、安装服务资源和售后规划整合到一个工作流程中，从而简化跨境采购。对于采购方而言，这意味着更少的沟通障碍和更快捷的对比；对于代理商和项目团队而言，这意味着更清晰的询价单、更结构化的产品方案和更透明的交付流程。',
    missionTitle: '我们的使命',
    missionCopy: '让工业、基础设施、能源和商业项目的工业设备采购更便捷、更安全、更透明。',
    teamTitle: '团队优势',
    teamAdvantages: [
      { icon: 'P', title: '采购顾问', copy: '将买方需求转化为可用于询价的产品清单、技术参数和比较维度。' },
      { icon: 'E', title: '电气专家', copy: '支持电压等级、容量、保护、耐腐蚀性和环境需求方面的场景匹配。' },
      { icon: 'S', title: '供应商协调员', copy: '协调制造商、安装合作伙伴和备件资源，以实现更可靠的交付。' },
      { icon: 'A', title: '售后运营人员', copy: '帮助明确保修范围、本地响应路径、备件包和服务文档。' },
    ],
    supplyTitle: '供应链和售后能力',
    supplyCapabilities: [
      { icon: 'Q', title: '合格的设备网络', copy: '涵盖变压器、开关设备、电缆、电表、发电机、光伏设备和成套配电解决方案。' },
      { icon: 'D', title: '文档支持', copy: '帮助买家在发货前索取证书、测试报告、图纸、装箱单和交货单据。' },
      { icon: 'M', title: '维护计划', copy: '根据运行环境推荐备件、耗材和高故障风险部件。' },
    ],
    workflowSteps: [
      { title: '需求审查', copy: '确认应用场景、负载、环境和合规性要求。' },
      { title: '供应商匹配', copy: '比较产品包装、技术适配性和交付能力。' },
      { title: '订单协调', copy: '跟踪生产、检验、物流和安装接口。' },
      { title: '售后支持', copy: '准备好保修、备件和本地服务响应方案。' },
    ],
    indonesiaTitle: '印尼本地配送能力',
    indonesiaCopy: '印尼项目经常面临高温、暴雨、沿海盐雾、高湿度和长途物流等挑战。我们的交付流程旨在帮助买家在下单前识别这些风险，然后匹配耐腐蚀产品选项、协调安装、推荐备件以及提供本地后续服务。',
    indonesiaCapabilities: [
      { icon: 'ID', title: '本地情境感知', copy: '支持工业园区、港口、矿区、商业用地、数据中心和电动汽车充电项目。' },
      { icon: 'L', title: '配送协调', copy: '协调物流、海关文件、现场交付要求和安装时间。' },
      { icon: 'R', title: '风险提醒', copy: '重点关注盐雾、雨水渗入、过热降额、防雷和备件问题。' },
    ],
    mapLabel: '印尼本地配送节点',
    mapNodes: { batam: '巴淡岛', jakarta: '总部', surabaya: '分部' },
    ctaTitle: '准备好讨论您下一个工业设备需求了吗？',
    ctaCopy: '请分享您的应用场景、地点、环境以及预期交付时间表。我们的团队将协助您将其转化为一份符合询价要求的方案。',
    contactAction: '联系我们',
    submitAction: '提交需求',
  },
  id: {
    eyebrow: 'Tentang ExampleCorp',
    heroTitle: 'Sourcing peralatan listrik untuk procurement berbasis skenario.',
    heroCopy: 'ExampleCorp menghubungkan pembeli luar negeri dengan produsen peralatan listrik yang terkualifikasi, mitra layanan engineering, dan sumber daya delivery lokal. Kami fokus pada transformator, switchgear, kabel, meter, generator, peralatan PV, dan solusi distribusi, membantu pembeli mengubah kebutuhan proyek menjadi rencana procurement yang andal dan order yang siap dikirim.',
    visualLabel: 'Visual panel distribusi',
    statsLabel: 'Metrik platform',
    stats: [
      { value: '50+', label: 'Negara dan wilayah yang didukung' },
      { value: '24j', label: 'Jendela respons kebutuhan' },
      { value: '300+', label: 'Kategori peralatan dan layanan' },
      { value: 'ID', label: 'Koordinasi delivery berpusat di Indonesia' },
    ],
    companyTitle: 'Profil Perusahaan',
    companyCopy: 'Kami adalah platform procurement B2B vertikal yang berfokus pada industri peralatan listrik. Misi kami adalah mengintegrasikan pemilihan produk, pencocokan teknis, koordinasi pemasok, sumber daya layanan instalasi, dan perencanaan after-sales ke dalam satu alur kerja untuk menyederhanakan procurement lintas negara. Bagi pembeli, ini berarti hambatan komunikasi yang lebih sedikit dan perbandingan yang lebih cepat; bagi agen dan tim proyek, ini berarti daftar inquiry yang lebih jelas, rencana produk yang lebih terstruktur, dan proses delivery yang lebih transparan.',
    missionTitle: 'Misi Kami',
    missionCopy: 'Membuat procurement peralatan listrik untuk proyek industri, infrastruktur, energi, dan komersial menjadi lebih mudah, aman, dan transparan.',
    teamTitle: 'Keunggulan Tim',
    teamAdvantages: [
      { icon: 'P', title: 'Konsultan procurement', copy: 'Mengubah kebutuhan pembeli menjadi daftar produk, parameter teknis, dan dimensi perbandingan yang siap untuk inquiry.' },
      { icon: 'E', title: 'Spesialis kelistrikan', copy: 'Mendukung pencocokan skenario berdasarkan kelas tegangan, kapasitas, proteksi, ketahanan korosi, dan kebutuhan lingkungan.' },
      { icon: 'S', title: 'Koordinator pemasok', copy: 'Mengkoordinasikan produsen, mitra instalasi, dan sumber daya suku cadang untuk delivery yang lebih andal.' },
      { icon: 'A', title: 'Operator after-sales', copy: 'Membantu memperjelas cakupan garansi, jalur respons lokal, paket suku cadang, dan dokumen layanan.' },
    ],
    supplyTitle: 'Kemampuan Supply Chain dan After-Sales',
    supplyCapabilities: [
      { icon: 'Q', title: 'Jaringan peralatan terkualifikasi', copy: 'Mencakup transformator, switchgear, kabel, meter, generator, peralatan PV, dan solusi distribusi lengkap.' },
      { icon: 'D', title: 'Dukungan dokumen', copy: 'Membantu pembeli meminta sertifikat, laporan pengujian, gambar, packing list, dan dokumen delivery sebelum pengiriman.' },
      { icon: 'M', title: 'Perencanaan maintenance', copy: 'Merekomendasikan suku cadang, consumable, dan komponen berisiko tinggi berdasarkan lingkungan operasi.' },
    ],
    workflowSteps: [
      { title: 'Review kebutuhan', copy: 'Mengonfirmasi skenario aplikasi, beban, lingkungan, dan persyaratan kepatuhan.' },
      { title: 'Pencocokan pemasok', copy: 'Membandingkan kesesuaian produk, kecocokan teknis, dan kemampuan delivery.' },
      { title: 'Koordinasi order', copy: 'Melacak produksi, inspeksi, logistik, dan interface instalasi.' },
      { title: 'Dukungan after-sales', copy: 'Menyiapkan garansi, suku cadang, dan rencana respons layanan lokal.' },
    ],
    indonesiaTitle: 'Kemampuan Delivery Lokal Indonesia',
    indonesiaCopy: 'Proyek di Indonesia sering menghadapi suhu tinggi, hujan lebat, kabut garam pesisir, kelembapan tinggi, dan logistik jarak jauh. Proses delivery kami dirancang untuk membantu pembeli mengidentifikasi risiko ini sebelum memesan, lalu mencocokkan opsi produk tahan korosi, mengoordinasikan instalasi, merekomendasikan suku cadang, dan menyediakan tindak lanjut lokal.',
    indonesiaCapabilities: [
      { icon: 'ID', title: 'Pemahaman konteks lokal', copy: 'Mendukung kawasan industri, pelabuhan, area tambang, lokasi komersial, data center, dan proyek EV charging.' },
      { icon: 'L', title: 'Koordinasi delivery', copy: 'Mengkoordinasikan logistik, dokumen bea cukai, kebutuhan delivery di lokasi, dan jadwal instalasi.' },
      { icon: 'R', title: 'Pengingat risiko', copy: 'Berfokus pada kabut garam, masuknya air hujan, derating panas, proteksi petir, dan isu suku cadang.' },
    ],
    mapLabel: 'Node delivery lokal Indonesia',
    mapNodes: { batam: 'Logistics Hub', jakarta: 'Head Office', surabaya: 'Branch Office' },
    ctaTitle: 'Siap mendiskusikan kebutuhan peralatan listrik berikutnya?',
    ctaCopy: 'Bagikan skenario aplikasi, lokasi, lingkungan, dan timeline delivery yang diharapkan. Tim kami akan membantu mengubahnya menjadi rencana yang siap untuk inquiry.',
    contactAction: 'Hubungi Kami',
    submitAction: 'Kirim Kebutuhan',
  },
}

const { locale } = useI18n()
const { pageConfig } = useWebsiteConfig()
const copy = computed(() => pageCopy[locale.value])
const aboutPageConfig = pageConfig('about')
const aboutHeroStyle = computed(() => {
  const heroImage = resolveOptimizedAssetUrl(aboutPageConfig.value?.heroImageUrl, { width: 1600 })
  if (!heroImage) return undefined
  return {
    backgroundImage: `linear-gradient(90deg, rgba(13, 45, 72, 0.9), rgba(28, 80, 108, 0.5)), url('${heroImage}')`,
    backgroundPosition: 'center, center',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundSize: 'cover, cover',
  }
})
</script>

<template>
  <main class="about-source-page">
    <section class="about-source-hero">
      <article class="about-source-hero-copy" :style="aboutHeroStyle">
        <span class="about-source-eyebrow">{{ copy.eyebrow }}</span>
        <h1>{{ aboutPageConfig?.headline ?? copy.heroTitle }}</h1>
        <p>{{ aboutPageConfig?.summary ?? copy.heroCopy }}</p>
      </article>

      <aside class="about-equipment-visual" :aria-label="copy.visualLabel">
        <div class="about-cabinet-row">
          <div class="about-cabinet"></div>
          <div class="about-cabinet tall"></div>
          <div class="about-cabinet"></div>
        </div>
      </aside>
    </section>

    <section class="about-source-stats" :aria-label="copy.statsLabel">
      <article v-for="stat in copy.stats" :key="stat.label">
        <strong>{{ stat.value }}</strong>
        <span>{{ stat.label }}</span>
      </article>
    </section>

    <section class="about-source-section">
      <h2>{{ copy.companyTitle }}</h2>
      <div class="about-intro-grid">
        <p>{{ copy.companyCopy }}</p>
        <aside class="about-mission-card">
          <strong>{{ copy.missionTitle }}</strong>
          <span>{{ copy.missionCopy }}</span>
        </aside>
      </div>
    </section>

    <section class="about-source-section">
      <h2>{{ copy.teamTitle }}</h2>
      <div class="about-card-grid four">
        <article v-for="item in copy.teamAdvantages" :key="item.title" class="about-feature-card">
          <span class="about-feature-icon">{{ item.icon }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.copy }}</p>
        </article>
      </div>
    </section>

    <section class="about-source-section">
      <h2>{{ copy.supplyTitle }}</h2>
      <div class="about-card-grid three">
        <article v-for="item in copy.supplyCapabilities" :key="item.title" class="about-feature-card">
          <span class="about-feature-icon">{{ item.icon }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.copy }}</p>
        </article>
      </div>
      <div class="about-workflow">
        <article v-for="step in copy.workflowSteps" :key="step.title">
          <strong>{{ step.title }}</strong>
          <span>{{ step.copy }}</span>
        </article>
      </div>
    </section>

    <section class="about-source-section">
      <h2>{{ copy.indonesiaTitle }}</h2>
      <div class="about-indonesia-layout">
        <div>
          <p>{{ copy.indonesiaCopy }}</p>
          <div class="about-card-grid three compact">
            <article v-for="item in copy.indonesiaCapabilities" :key="item.title" class="about-feature-card">
              <span class="about-feature-icon">{{ item.icon }}</span>
              <h3>{{ item.title }}</h3>
              <p>{{ item.copy }}</p>
            </article>
          </div>
        </div>

        <aside class="about-map-card" :aria-label="copy.mapLabel">
          <span class="about-map-label batam">{{ copy.mapNodes.batam }}</span>
          <span class="about-map-label jakarta">{{ copy.mapNodes.jakarta }}</span>
          <span class="about-map-label surabaya">{{ copy.mapNodes.surabaya }}</span>
        </aside>
      </div>
    </section>

    <section class="about-source-cta">
      <div>
        <h2>{{ copy.ctaTitle }}</h2>
        <p>{{ copy.ctaCopy }}</p>
      </div>
      <div class="about-cta-actions">
        <LocalizedLink class="about-primary-action" to="/contact">{{ copy.contactAction }}</LocalizedLink>
        <LocalizedLink class="about-secondary-action" to="/contact">{{ copy.submitAction }}</LocalizedLink>
      </div>
    </section>
  </main>
</template>
