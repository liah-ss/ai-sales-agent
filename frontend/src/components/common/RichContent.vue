<script setup lang="ts">
import { computed } from 'vue'
import { classifyRichContent } from './richContentBlocks'

const props = withDefaults(defineProps<{
  html?: string
  plainText?: string
  preserveAuthoredHtml?: boolean
}>(), {
  html: '',
  plainText: '',
  preserveAuthoredHtml: false,
})

const html = computed(() => props.html.trim())
const hasHtmlTags = computed(() => /<\/?[a-z][\s\S]*>/i.test(html.value))
const renderAuthoredHtml = computed(() => Boolean(
  html.value
  && hasHtmlTags.value
))
const displayBlocks = computed(() => classifyRichContent(html.value || props.plainText))
</script>

<template>
  <div v-if="renderAuthoredHtml" class="managed-rich-content authored-content" v-html="html"></div>
  <div v-else class="managed-rich-content paragraph-aware-content">
    <template v-for="(block, index) in displayBlocks" :key="`${block.type}-${index}`">
      <h2 v-if="block.type === 'heading'" class="rich-block-heading">{{ block.content }}</h2>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        class="rich-block-list"
      >
        <li v-for="item in block.items" :key="item">{{ item }}</li>
      </component>

      <div v-else-if="block.type === 'labeled'" class="rich-block-labeled">
        <strong>{{ block.label }}</strong>
        <p>{{ block.content }}</p>
      </div>

      <article v-else-if="block.type === 'pair'" class="rich-block-pair">
        <div>
          <strong>难点</strong>
          <p>{{ block.challenge }}</p>
        </div>
        <div>
          <strong>解决方案</strong>
          <p>{{ block.solution }}</p>
        </div>
      </article>

      <dl v-else-if="block.type === 'parameters'" class="rich-block-parameters">
        <div v-for="row in block.rows" :key="`${row.label}-${row.value}`">
          <dt>{{ row.label }}</dt>
          <dd>{{ row.value }}</dd>
        </div>
      </dl>

      <aside v-else-if="block.type === 'emphasis'" class="rich-block-emphasis">
        <strong v-if="block.label">{{ block.label }}</strong>
        <p>{{ block.content }}</p>
      </aside>

      <p v-else class="rich-block-paragraph">{{ block.content }}</p>
    </template>
  </div>
</template>

<style scoped>
.managed-rich-content {
  width: 100%;
  max-width: 76ch;
  color: #43515f;
  font-size: 16px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

.paragraph-aware-content {
  display: grid;
  gap: 18px;
}

.managed-rich-content :deep(h1),
.managed-rich-content :deep(h2),
.managed-rich-content :deep(h3),
.managed-rich-content :deep(h4),
.managed-rich-content :deep(h5),
.managed-rich-content :deep(h6) {
  margin: 1.8em 0 0.65em;
  color: #1d2a36;
  line-height: 1.35;
  letter-spacing: 0;
}

.managed-rich-content :deep(h1) {
  color: #17212b;
  font-size: 30px;
  line-height: 1.25;
}

.managed-rich-content :deep(h2) {
  font-size: 26px;
}

.managed-rich-content :deep(h3) {
  font-size: 22px;
}

.managed-rich-content :deep(h4) {
  font-size: 19px;
}

.managed-rich-content :deep(h5) {
  font-size: 17px;
}

.managed-rich-content :deep(h6) {
  font-size: 16px;
}

.managed-rich-content :deep(:first-child) {
  margin-top: 0;
}

.managed-rich-content :deep(p) {
  margin: 0 0 1.15em;
}

.rich-block-heading {
  position: relative;
  margin: 18px 0 0;
  padding: 0 0 0 18px;
  color: #1d2a36;
  font-size: 23px;
  line-height: 1.4;
  letter-spacing: -0.01em;
}

.rich-block-heading::before {
  position: absolute;
  top: 0.18em;
  bottom: 0.18em;
  left: 0;
  width: 4px;
  border-radius: 4px;
  background: #1f6d86;
  content: '';
}

.rich-block-paragraph,
.rich-block-labeled p,
.rich-block-pair p,
.rich-block-emphasis p {
  margin: 0;
}

.rich-block-paragraph {
  color: #465563;
  text-align: justify;
  text-justify: inter-ideograph;
}

.rich-block-list {
  margin: 0;
  padding: 2px 0;
  list-style: none;
  counter-reset: none;
}

.rich-block-list li {
  position: relative;
  padding: 12px 14px 12px 30px;
  border-bottom: 1px solid #e5ebf0;
  color: #384957;
}

.rich-block-list li::before {
  position: absolute;
  top: 1.35em;
  left: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #27809a;
  content: '';
}

.rich-block-labeled {
  display: grid;
  grid-template-columns: 118px minmax(0, 1fr);
  border-top: 1px solid #dfe7ed;
  border-bottom: 1px solid #dfe7ed;
  background: #f8fafb;
}

.rich-block-labeled strong,
.rich-block-labeled p {
  padding: 13px 16px;
}

.rich-block-labeled strong {
  border-right: 1px solid #dfe7ed;
  color: #1f6d86;
  font-size: 14px;
}

.rich-block-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #dbe4ea;
  background: #fbfcfd;
}

.rich-block-pair > div {
  min-width: 0;
  padding: 17px 19px;
}

.rich-block-pair > div + div {
  border-left: 1px solid #dbe4ea;
  background: #f2f8fa;
}

.rich-block-pair strong {
  display: block;
  margin-bottom: 6px;
  color: #1f6d86;
  font-size: 13px;
  letter-spacing: 0.08em;
}

.rich-block-parameters {
  margin: 0;
  border-top: 2px solid #1f6d86;
}

.rich-block-parameters > div {
  display: grid;
  grid-template-columns: minmax(130px, 0.34fr) minmax(0, 1fr);
  border-bottom: 1px solid #dfe7ed;
}

.rich-block-parameters dt,
.rich-block-parameters dd {
  margin: 0;
  padding: 13px 16px;
}

.rich-block-parameters dt {
  background: #f4f7f9;
  color: #243440;
  font-weight: 800;
}

.rich-block-parameters dd {
  color: #52616e;
}

.rich-block-emphasis {
  padding: 16px 19px;
  border-left: 4px solid #27809a;
  background: #edf6f8;
  color: #28434d;
}

.rich-block-emphasis strong {
  display: block;
  margin-bottom: 5px;
  color: #17657e;
  font-size: 14px;
}

.managed-rich-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 28px auto;
}

.managed-rich-content :deep(ul),
.managed-rich-content :deep(ol) {
  margin: 0 0 1.1em;
  padding-left: 1.5em;
}

.managed-rich-content :deep(li) {
  margin: 0.35em 0;
}

.managed-rich-content :deep(blockquote) {
  margin: 1.25em 0;
  padding: 0.8em 1em;
  border-left: 3px solid #1f6d86;
  background: #f4f8fa;
  color: #43515d;
}

.managed-rich-content :deep(a) {
  color: #17657e;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.managed-rich-content :deep(pre) {
  max-width: 100%;
  overflow-x: auto;
  padding: 14px 16px;
  background: #17212b;
  color: #f4f7f9;
}

.managed-rich-content :deep(table) {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
}

.managed-rich-content :deep(th),
.managed-rich-content :deep(td) {
  padding: 10px 12px;
  border: 1px solid #dfe6ed;
  text-align: left;
}

.managed-rich-content :deep(th) {
  background: #f1f6f8;
  color: #263743;
}
</style>
