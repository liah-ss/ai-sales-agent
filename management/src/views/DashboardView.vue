<script setup lang="ts">
import { Boxes, ChartNoAxesCombined, FileImage, Globe2, Inbox, LayoutDashboard, Settings2 } from '@lucide/vue'

const operationCards = [
  {
    title: '数据统计',
    path: '/analytics',
    description: '查看全站与重点页面 PV、UV 日报，核查访问 IP、来源和终端明细。',
    icon: ChartNoAxesCombined,
  },
  {
    title: '网站内容配置',
    path: '/website/home-content',
    description: '配置首页 Banner、页面标题、页面图片、模块文案和品牌联系方式。',
    icon: LayoutDashboard,
  },
  {
    title: '产品库配置',
    path: '/products',
    description: '维护产品名称、型号、图片、价格档位、技术参数、物流和质保信息。',
    icon: Boxes,
  },
  {
    title: '素材文件管理',
    path: '/files',
    description: '沉淀官网图片、BOM、图纸和证书资料，供页面和产品编辑复用。',
    icon: FileImage,
  },
  {
    title: '询盘跟进',
    path: '/inquiries',
    description: '查看客户提交的产品、解决方案和多商品询盘，记录跟进状态。',
    icon: Inbox,
  },
]

const editableMatrix = [
  ['首页', 'Banner 图片、标题、搜索文案、场景采购模块'],
  ['产品详情页', '产品图片、名称、型号、副标题、价格档位、参数、物流交付、订单保障'],
  ['产品库', '分类、筛选数据、产品上下架、热销状态、多选询盘入口'],
  ['解决方案', '场景标题、正文、配套设备、收益点、相关产品'],
  ['关于/联系', '品牌信息、联系方式、地址、WhatsApp、页脚描述'],
]
</script>

<template>
  <section class="page-heading operator-hero">
    <span>官网运营工作台</span>
    <h1>像管理 Alibaba 店铺一样管理独立站内容</h1>
    <p>
      面向运营、产品和销售团队，把对外官网里的图片、标题、产品参数、价格档位、物流承诺和询盘内容统一放到后台维护。
    </p>
  </section>

  <section class="operator-grid">
    <RouterLink v-for="item in operationCards" :key="item.path" class="operator-card" :to="item.path">
      <component :is="item.icon" class="operator-card-icon" />
      <h2>{{ item.title }}</h2>
      <p>{{ item.description }}</p>
    </RouterLink>
  </section>

  <section class="editable-map-panel">
    <div>
      <span>可配置内容矩阵</span>
      <h2>前台图片与文字从这里进入管理闭环</h2>
      <p>按照页面归属管理内容，减少直接改代码的风险；产品详情这类高频页面走产品库字段。</p>
    </div>
    <div class="editable-map-list">
      <article v-for="row in editableMatrix" :key="row[0]">
        <strong>{{ row[0] }}</strong>
        <span>{{ row[1] }}</span>
      </article>
    </div>
  </section>

  <section class="architecture-strip">
    <article>
      <Globe2 class="architecture-icon" />
      <strong>对外网站</strong>
      <span>展示和询盘转化</span>
    </article>
    <article>
      <Settings2 class="architecture-icon" />
      <strong>管理系统</strong>
      <span>内容、产品、素材和询盘维护</span>
    </article>
    <article>
      <Inbox class="architecture-icon" />
      <strong>共享 API</strong>
      <span>统一向官网和后台提供数据</span>
    </article>
  </section>
</template>
