<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.title ?? '模块'))
</script>

<template>
  <section class="page-heading">
    <span>规划模块</span>
    <h1>{{ title }}</h1>
    <p>该模块已在内部管理系统 PRD 中规划，将在后续步骤中继续实现。</p>
  </section>
</template>
