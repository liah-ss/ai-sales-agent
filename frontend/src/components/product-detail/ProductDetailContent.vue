<script setup lang="ts">
import { computed } from 'vue'
import { FileText } from '@lucide/vue'
import RichContent from '../common/RichContent.vue'

const props = defineProps<{
  title: string
  intro?: string
  content: string
}>()

const contentIsHtml = computed(() => /<\/?[a-z][\s\S]*>/i.test(props.content))
</script>

<template>
  <section class="rich-product-detail">
    <div class="rich-detail-heading">
      <FileText aria-hidden="true" />
      <h2>{{ title }}</h2>
    </div>

    <div class="rich-detail-divider">
      <p v-if="intro?.trim()" class="product-description-intro">{{ intro }}</p>
      <RichContent
        v-if="content.trim() && contentIsHtml"
        class="rich-detail-content"
        :html="content"
        preserve-authored-html
      />
      <div v-else-if="content.trim()" class="rich-detail-content plain-product-description">{{ content }}</div>
    </div>
  </section>
</template>

<style scoped>
.rich-product-detail {
  margin-top: 42px;
}

.rich-detail-heading {
  margin-bottom: 18px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.rich-detail-heading svg {
  width: 23px;
  height: 23px;
  color: #1f6d86;
}

.rich-detail-heading h2 {
  margin: 0;
  color: #151c25;
  font-size: 28px;
}

.rich-detail-divider {
  width: 100%;
  border-top: 2px solid #1f6d86;
  padding-top: 24px;
}

.rich-detail-content {
  width: 100%;
  max-width: none;
  display: grid;
  gap: 22px;
}

.product-description-intro {
  margin: 0 0 22px;
}

.product-description-intro,
.plain-product-description {
  color: #43515f;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.9;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .rich-product-detail {
    margin-top: 32px;
  }

  .rich-detail-heading h2 {
    font-size: 24px;
  }

  .rich-detail-content {
    gap: 18px;
  }

  .product-description-intro {
    margin-bottom: 18px;
  }

}
</style>
