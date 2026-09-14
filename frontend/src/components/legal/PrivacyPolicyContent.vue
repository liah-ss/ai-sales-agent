<script setup lang="ts">
import type { PrivacyPolicyDocument } from '../../data/privacyPolicyContent'

defineProps<{
  document: PrivacyPolicyDocument
}>()
</script>

<template>
  <div class="privacy-document">
    <div class="privacy-introduction">
      <template v-for="(block, index) in document.introduction" :key="`${block.type}-${index}`">
        <p v-if="block.type === 'paragraph'">{{ block.text }}</p>
        <ul v-else-if="block.type === 'list'">
          <li v-for="item in block.items" :key="`${item.label}-${item.text}`">
            <strong v-if="item.label">{{ item.label }}</strong>{{ item.label ? ' ' : '' }}{{ item.text }}
          </li>
        </ul>
      </template>
    </div>

    <section v-for="section in document.sections" :key="section.title" class="privacy-section">
      <h2>{{ section.title }}</h2>
      <template v-for="(block, index) in section.blocks" :key="`${block.type}-${index}`">
        <p v-if="block.type === 'paragraph'">{{ block.text }}</p>
        <h3 v-else-if="block.type === 'subheading'">{{ block.text }}</h3>
        <ul v-else>
          <li v-for="item in block.items" :key="`${item.label}-${item.text}`">
            <strong v-if="item.label">{{ item.label }}</strong>{{ item.label ? ' ' : '' }}{{ item.text }}
          </li>
        </ul>
      </template>
    </section>
  </div>
</template>

<style scoped>
.privacy-document {
  color: #3f4e5c;
  font-size: 16px;
  line-height: 1.9;
}

.privacy-introduction,
.privacy-section {
  padding: 30px 0;
  border-bottom: 1px solid #dfe7ed;
}

.privacy-introduction {
  padding-top: 0;
}

.privacy-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.privacy-document p {
  margin: 0 0 14px;
}

.privacy-document p:last-child {
  margin-bottom: 0;
}

.privacy-document h2 {
  margin: 0 0 18px;
  color: #17232e;
  font-size: 24px;
  line-height: 1.4;
  letter-spacing: 0;
}

.privacy-document h3 {
  margin: 24px 0 10px;
  color: #263746;
  font-size: 18px;
  line-height: 1.5;
  letter-spacing: 0;
}

.privacy-document ul {
  margin: 0 0 16px;
  padding-left: 1.5em;
}

.privacy-document li {
  margin: 6px 0;
  padding-left: 4px;
}

.privacy-document li::marker {
  color: #1f6d86;
}

.privacy-document strong {
  color: #263746;
}

@media (max-width: 640px) {
  .privacy-document {
    font-size: 15px;
    line-height: 1.85;
  }

  .privacy-introduction,
  .privacy-section {
    padding: 24px 0;
  }

  .privacy-introduction {
    padding-top: 0;
  }

  .privacy-document h2 {
    font-size: 21px;
  }

  .privacy-document h3 {
    font-size: 17px;
  }
}
</style>
