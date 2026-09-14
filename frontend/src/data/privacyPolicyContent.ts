import type { Locale } from '../composables/useI18n'

export interface PrivacyPolicyListItem {
  label?: string
  text: string
}

export type PrivacyPolicyBlock =
  | { type: 'paragraph', text: string }
  | { type: 'subheading', text: string }
  | { type: 'list', items: PrivacyPolicyListItem[] }

export interface PrivacyPolicySection {
  title: string
  blocks: PrivacyPolicyBlock[]
}

export interface PrivacyPolicyDocument {
  title: string
  effectiveDate: string
  introduction: PrivacyPolicyBlock[]
  sections: PrivacyPolicySection[]
}

const list = (...items: Array<string | [string, string]>): PrivacyPolicyBlock => ({
  type: 'list',
  items: items.map(item => Array.isArray(item) ? { label: item[0], text: item[1] } : { text: item }),
})

const paragraph = (text: string): PrivacyPolicyBlock => ({ type: 'paragraph', text })
const subheading = (text: string): PrivacyPolicyBlock => ({ type: 'subheading', text })

export const privacyPolicyContent: Record<Locale, PrivacyPolicyDocument> = {
  'zh-CN': {
    title: '隐私政策',
    effectiveDate: '生效日期：2026 年 7 月',
    introduction: [
      paragraph('欢迎使用 Indonesia Power Equipment Procurement Platform（以下简称“平台”）。'),
      paragraph('我们高度重视每一位企业客户、合作伙伴及签约服务商的隐私与数据安全，并承诺按照相关法律法规保护您的个人信息及商业信息。'),
      paragraph('本隐私政策适用于平台所有服务，包括但不限于产品浏览、采购需求发布、在线询价、订单管理、物流跟踪、安装服务、售后支持以及平台运营内容。'),
      paragraph('平台主要服务对象包括：'),
      list(
        ['采购方（Buyer）：', '浏览产品、提交采购需求、支付订单、跟踪交付及售后。'],
        ['签约方（Authorized Partner）：', '承接采购需求，提供产品、报价、技术支持及相关服务。'],
        ['平台方（Platform）：', '负责供应链管理、项目协调、订单履约、安装服务及平台运营。'],
      ),
    ],
    sections: [
      {
        title: '一、我们收集的信息',
        blocks: [
          paragraph('为了向您提供完整的采购服务，我们可能收集以下信息：'),
          subheading('（一）企业信息'),
          list('企业名称', '企业注册地址', '营业执照或商业登记信息', '税务信息（如适用）', '所属行业'),
          subheading('（二）联系人信息'),
          list('联系人姓名', '职务', '邮箱地址', '联系电话', 'WhatsApp 联系方式'),
          subheading('（三）采购项目资料'),
          paragraph('包括但不限于：'),
          list('RFQ（询价文件）', 'BOQ（工程量清单）', '技术规范', '图纸', '产品型号', '项目计划', '安装要求', '收货地点'),
          subheading('（四）交易信息'),
          list('报价单', '合同', '采购订单', '发票', '支付记录', '发货及物流信息'),
          subheading('（五）网站使用信息'),
          paragraph('包括：'),
          list('IP 地址', '浏览器类型', '设备信息', 'Cookie', '网站访问日志', '页面浏览记录'),
        ],
      },
      {
        title: '二、信息使用目的',
        blocks: [
          paragraph('我们仅在合法、必要的范围内使用您的信息，包括：'),
          list('匹配采购需求与签约合作方；', '处理询价、报价及订单；', '协调物流配送与安装服务；', '提供售后支持；', '提高平台安全性；', '防范欺诈及风险；', '优化平台产品及服务；', '满足法律法规要求。'),
          paragraph('未经您的授权，我们不会出售您的个人信息或企业信息。'),
        ],
      },
      {
        title: '三、采购资料保密',
        blocks: [
          paragraph('我们充分理解采购项目具有商业敏感性。'),
          paragraph('您上传至平台的 RFQ、BOQ、图纸、报价需求、技术资料等，仅会向参与项目报价、供货或安装的授权合作方披露。'),
          paragraph('未经授权，平台不会向无关第三方公开您的采购信息。'),
          paragraph('平台员工及合作伙伴均需履行保密义务。'),
        ],
      },
      {
        title: '四、信息共享',
        blocks: [
          paragraph('在以下情况下，我们可能共享必要信息：'),
          list('签约合作方；', '产品制造商；', '安装服务商；', '物流服务商；', '支付服务机构；', '法律法规要求的政府主管机关。'),
          paragraph('我们不会将您的数据出售或提供给与项目无关的第三方。'),
        ],
      },
      { title: '五、支付安全', blocks: [paragraph('平台通过符合行业标准的第三方支付服务处理交易。'), paragraph('平台不会保存完整的银行卡、信用卡等支付凭证。')] },
      {
        title: '六、Cookie',
        blocks: [paragraph('平台使用 Cookie 用于：'), list('登录状态保持；', '网站性能优化；', '用户体验改善；', '网站流量分析。'), paragraph('您可以在浏览器中关闭 Cookie，但部分功能可能受到影响。')],
      },
      { title: '七、数据安全', blocks: [paragraph('平台采用行业标准安全措施，包括：'), list('HTTPS 加密传输；', '权限管理；', '身份认证；', '数据备份；', '云服务器安全防护；', '定期安全监测。')] },
      { title: '八、用户权利', blocks: [paragraph('您有权：'), list('查询个人信息；', '更正错误信息；', '删除符合条件的信息；', '撤回授权；', '获取数据副本。')] },
      { title: '九、法律适用', blocks: [paragraph('本平台遵守印度尼西亚《个人数据保护法》（Law No.27 of 2022）及其他适用法律法规。')] },
      { title: '十、隐私政策更新', blocks: [paragraph('我们可能根据业务发展或法律要求更新本隐私政策。'), paragraph('更新后的版本将在网站公布，并自公布之日起生效。')] },
      { title: '十一、联系我们', blocks: [paragraph('如您对本隐私政策有任何疑问，请通过平台公布的联系方式与我们联系，我们将在合理期限内予以回复。')] },
    ],
  },
  en: {
    title: 'Privacy Policy',
    effectiveDate: 'Effective date: July 2026',
    introduction: [
      paragraph('Welcome to the Indonesia Power Equipment Procurement Platform (the “Platform”).'),
      paragraph('We place great importance on the privacy and data security of every business customer, partner, and authorized service provider, and we are committed to protecting your personal and business information in accordance with applicable laws and regulations.'),
      paragraph('This Privacy Policy applies to all Platform services, including but not limited to product browsing, procurement requirement submission, online inquiries, order management, logistics tracking, installation services, after-sales support, and Platform-operated content.'),
      paragraph('The Platform primarily serves:'),
      list(
        ['Buyer:', 'Browses products, submits procurement requirements, pays for orders, and tracks delivery and after-sales service.'],
        ['Authorized Partner:', 'Accepts procurement requirements and provides products, quotations, technical support, and related services.'],
        ['Platform:', 'Manages the supply chain, coordinates projects, fulfills orders, arranges installation services, and operates the Platform.'],
      ),
    ],
    sections: [
      {
        title: '1. Information We Collect',
        blocks: [
          paragraph('To provide complete procurement services, we may collect the following information:'),
          subheading('(1) Company Information'),
          list('Company name', 'Registered business address', 'Business license or commercial registration information', 'Tax information, where applicable', 'Industry sector'),
          subheading('(2) Contact Information'),
          list('Contact name', 'Job title', 'Email address', 'Telephone number', 'WhatsApp contact details'),
          subheading('(3) Procurement Project Materials'),
          paragraph('Including but not limited to:'),
          list('RFQ (request for quotation documents)', 'BOQ (bill of quantities)', 'Technical specifications', 'Drawings', 'Product models', 'Project plans', 'Installation requirements', 'Delivery location'),
          subheading('(4) Transaction Information'),
          list('Quotations', 'Contracts', 'Purchase orders', 'Invoices', 'Payment records', 'Shipping and logistics information'),
          subheading('(5) Website Usage Information'),
          paragraph('Including:'),
          list('IP address', 'Browser type', 'Device information', 'Cookies', 'Website access logs', 'Page-view records'),
        ],
      },
      {
        title: '2. How We Use Information',
        blocks: [
          paragraph('We use your information only where lawful and necessary, including to:'),
          list('Match procurement requirements with authorized partners;', 'Process inquiries, quotations, and orders;', 'Coordinate logistics, delivery, and installation services;', 'Provide after-sales support;', 'Improve Platform security;', 'Prevent fraud and manage risk;', 'Improve Platform products and services;', 'Comply with legal and regulatory requirements.'),
          paragraph('We will not sell your personal or business information without your authorization.'),
        ],
      },
      {
        title: '3. Confidentiality of Procurement Materials',
        blocks: [
          paragraph('We fully understand that procurement projects may contain commercially sensitive information.'),
          paragraph('RFQs, BOQs, drawings, quotation requirements, technical materials, and other documents you upload to the Platform will be disclosed only to authorized partners participating in project quotation, supply, or installation.'),
          paragraph('The Platform will not disclose your procurement information to unrelated third parties without authorization.'),
          paragraph('Platform employees and partners are required to comply with confidentiality obligations.'),
        ],
      },
      {
        title: '4. Information Sharing',
        blocks: [
          paragraph('We may share necessary information in the following circumstances:'),
          list('Authorized partners;', 'Product manufacturers;', 'Installation service providers;', 'Logistics service providers;', 'Payment service providers;', 'Government authorities where required by applicable laws and regulations.'),
          paragraph('We will not sell your data or provide it to third parties unrelated to your project.'),
        ],
      },
      { title: '5. Payment Security', blocks: [paragraph('The Platform processes transactions through third-party payment services that comply with industry standards.'), paragraph('The Platform does not store complete bank card, credit card, or other payment credentials.')] },
      { title: '6. Cookies', blocks: [paragraph('The Platform uses cookies to:'), list('Maintain login sessions;', 'Optimize website performance;', 'Improve user experience;', 'Analyze website traffic.'), paragraph('You may disable cookies in your browser, but some features may be affected.')] },
      { title: '7. Data Security', blocks: [paragraph('The Platform uses industry-standard security measures, including:'), list('HTTPS encrypted transmission;', 'Access control;', 'Identity authentication;', 'Data backups;', 'Cloud server security protection;', 'Regular security monitoring.')] },
      { title: '8. Your Rights', blocks: [paragraph('You have the right to:'), list('Access your personal information;', 'Correct inaccurate information;', 'Delete eligible information;', 'Withdraw consent;', 'Obtain a copy of your data.')] },
      { title: '9. Governing Law', blocks: [paragraph('The Platform complies with Indonesia’s Personal Data Protection Law (Law No. 27 of 2022) and other applicable laws and regulations.')] },
      { title: '10. Privacy Policy Updates', blocks: [paragraph('We may update this Privacy Policy in response to business developments or legal requirements.'), paragraph('The updated version will be published on the website and will take effect on the date of publication.')] },
      { title: '11. Contact Us', blocks: [paragraph('If you have any questions about this Privacy Policy, please contact us through the contact details published on the Platform. We will respond within a reasonable period.')] },
    ],
  },
  id: {
    title: 'Kebijakan Privasi',
    effectiveDate: 'Tanggal berlaku: Juli 2026',
    introduction: [
      paragraph('Selamat datang di Indonesia Power Equipment Procurement Platform (selanjutnya disebut “Platform”).'),
      paragraph('Kami sangat menghargai privasi dan keamanan data setiap pelanggan perusahaan, mitra, dan penyedia layanan resmi, serta berkomitmen melindungi informasi pribadi dan informasi bisnis Anda sesuai dengan peraturan perundang-undangan yang berlaku.'),
      paragraph('Kebijakan Privasi ini berlaku untuk seluruh layanan Platform, termasuk namun tidak terbatas pada penelusuran produk, pengajuan kebutuhan pengadaan, permintaan penawaran daring, pengelolaan pesanan, pelacakan logistik, layanan instalasi, dukungan purnajual, dan konten yang dioperasikan Platform.'),
      paragraph('Platform terutama melayani:'),
      list(
        ['Pembeli (Buyer):', 'Menelusuri produk, mengajukan kebutuhan pengadaan, membayar pesanan, serta melacak pengiriman dan layanan purnajual.'],
        ['Mitra Resmi (Authorized Partner):', 'Menerima kebutuhan pengadaan serta menyediakan produk, penawaran harga, dukungan teknis, dan layanan terkait.'],
        ['Platform:', 'Mengelola rantai pasok, mengoordinasikan proyek, memenuhi pesanan, mengatur layanan instalasi, dan menjalankan operasional Platform.'],
      ),
    ],
    sections: [
      {
        title: '1. Informasi yang Kami Kumpulkan',
        blocks: [
          paragraph('Untuk menyediakan layanan pengadaan yang lengkap, kami dapat mengumpulkan informasi berikut:'),
          subheading('(1) Informasi Perusahaan'),
          list('Nama perusahaan', 'Alamat terdaftar perusahaan', 'Izin usaha atau informasi pendaftaran komersial', 'Informasi perpajakan, jika berlaku', 'Sektor industri'),
          subheading('(2) Informasi Kontak'),
          list('Nama kontak', 'Jabatan', 'Alamat email', 'Nomor telepon', 'Kontak WhatsApp'),
          subheading('(3) Dokumen Proyek Pengadaan'),
          paragraph('Termasuk namun tidak terbatas pada:'),
          list('RFQ (dokumen permintaan penawaran)', 'BOQ (daftar kuantitas pekerjaan)', 'Spesifikasi teknis', 'Gambar teknis', 'Model produk', 'Rencana proyek', 'Persyaratan instalasi', 'Lokasi penerimaan barang'),
          subheading('(4) Informasi Transaksi'),
          list('Penawaran harga', 'Kontrak', 'Pesanan pembelian', 'Faktur', 'Catatan pembayaran', 'Informasi pengiriman dan logistik'),
          subheading('(5) Informasi Penggunaan Situs Web'),
          paragraph('Termasuk:'),
          list('Alamat IP', 'Jenis browser', 'Informasi perangkat', 'Cookie', 'Log akses situs web', 'Riwayat tampilan halaman'),
        ],
      },
      {
        title: '2. Tujuan Penggunaan Informasi',
        blocks: [
          paragraph('Kami hanya menggunakan informasi Anda dalam lingkup yang sah dan diperlukan, termasuk untuk:'),
          list('Mencocokkan kebutuhan pengadaan dengan mitra resmi;', 'Memproses permintaan informasi, penawaran harga, dan pesanan;', 'Mengoordinasikan logistik, pengiriman, dan layanan instalasi;', 'Memberikan dukungan purnajual;', 'Meningkatkan keamanan Platform;', 'Mencegah penipuan dan mengelola risiko;', 'Meningkatkan produk dan layanan Platform;', 'Memenuhi persyaratan hukum dan peraturan.'),
          paragraph('Kami tidak akan menjual informasi pribadi atau informasi bisnis Anda tanpa persetujuan Anda.'),
        ],
      },
      {
        title: '3. Kerahasiaan Dokumen Pengadaan',
        blocks: [
          paragraph('Kami sepenuhnya memahami bahwa proyek pengadaan dapat memuat informasi yang sensitif secara komersial.'),
          paragraph('RFQ, BOQ, gambar teknis, kebutuhan penawaran harga, dokumen teknis, dan materi lain yang Anda unggah ke Platform hanya akan diungkapkan kepada mitra resmi yang terlibat dalam penawaran, penyediaan, atau instalasi proyek.'),
          paragraph('Tanpa izin, Platform tidak akan mengungkapkan informasi pengadaan Anda kepada pihak ketiga yang tidak terkait.'),
          paragraph('Karyawan dan mitra Platform wajib memenuhi kewajiban kerahasiaan.'),
        ],
      },
      {
        title: '4. Pembagian Informasi',
        blocks: [
          paragraph('Kami dapat membagikan informasi yang diperlukan dalam keadaan berikut:'),
          list('Mitra resmi;', 'Produsen produk;', 'Penyedia layanan instalasi;', 'Penyedia layanan logistik;', 'Penyedia layanan pembayaran;', 'Instansi pemerintah yang berwenang apabila diwajibkan oleh peraturan perundang-undangan.'),
          paragraph('Kami tidak akan menjual data Anda atau memberikannya kepada pihak ketiga yang tidak terkait dengan proyek Anda.'),
        ],
      },
      { title: '5. Keamanan Pembayaran', blocks: [paragraph('Platform memproses transaksi melalui layanan pembayaran pihak ketiga yang memenuhi standar industri.'), paragraph('Platform tidak menyimpan data lengkap kartu bank, kartu kredit, atau kredensial pembayaran lainnya.')] },
      { title: '6. Cookie', blocks: [paragraph('Platform menggunakan cookie untuk:'), list('Mempertahankan status login;', 'Mengoptimalkan kinerja situs web;', 'Meningkatkan pengalaman pengguna;', 'Menganalisis lalu lintas situs web.'), paragraph('Anda dapat menonaktifkan cookie di browser, tetapi beberapa fungsi mungkin terpengaruh.')] },
      { title: '7. Keamanan Data', blocks: [paragraph('Platform menerapkan langkah keamanan berstandar industri, termasuk:'), list('Transmisi terenkripsi HTTPS;', 'Manajemen hak akses;', 'Autentikasi identitas;', 'Pencadangan data;', 'Perlindungan keamanan server cloud;', 'Pemantauan keamanan berkala.')] },
      { title: '8. Hak Pengguna', blocks: [paragraph('Anda berhak untuk:'), list('Mengakses informasi pribadi Anda;', 'Memperbaiki informasi yang tidak akurat;', 'Menghapus informasi yang memenuhi ketentuan;', 'Menarik persetujuan;', 'Memperoleh salinan data Anda.')] },
      { title: '9. Hukum yang Berlaku', blocks: [paragraph('Platform mematuhi Undang-Undang Perlindungan Data Pribadi Indonesia (Undang-Undang No. 27 Tahun 2022) serta peraturan perundang-undangan lain yang berlaku.')] },
      { title: '10. Pembaruan Kebijakan Privasi', blocks: [paragraph('Kami dapat memperbarui Kebijakan Privasi ini sesuai perkembangan bisnis atau persyaratan hukum.'), paragraph('Versi terbaru akan diumumkan di situs web dan berlaku sejak tanggal publikasi.')] },
      { title: '11. Hubungi Kami', blocks: [paragraph('Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini, silakan hubungi kami melalui informasi kontak yang dipublikasikan di Platform. Kami akan memberikan tanggapan dalam jangka waktu yang wajar.')] },
    ],
  },
}
