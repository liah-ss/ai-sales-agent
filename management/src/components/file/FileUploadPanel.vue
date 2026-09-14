<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { UploadCloud } from '@lucide/vue'

const props = defineProps<{
  usageOptions: string[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  upload: [payload: { file: File; usage: string; tags?: string }]
}>()

const selectedFile = shallowRef<File | null>(null)
const usage = shallowRef(props.usageOptions[0] ?? 'general')
const tags = shallowRef('')

const canUpload = computed(() => Boolean(selectedFile.value && usage.value && !props.isSaving))
const fileLabel = computed(() => selectedFile.value?.name ?? '选择文件')

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function submit() {
  if (!selectedFile.value || !canUpload.value) return
  emit('upload', {
    file: selectedFile.value,
    usage: usage.value,
    tags: tags.value.trim() || undefined,
  })
  selectedFile.value = null
  tags.value = ''
}
</script>

<template>
  <section class="config-panel file-upload-panel">
    <div class="panel-header">
      <span class="system-label">资料入库</span>
      <h2>上传资料</h2>
      <p>上传产品文档、Banner、证书、手册和企业文件，供内部复用。</p>
    </div>

    <label class="upload-button file-dropzone">
      <UploadCloud class="file-dropzone-icon" />
      <strong>{{ fileLabel }}</strong>
      <span>支持 PDF、图片、Word 或办公资料，最大 30MB。</span>
      <input type="file" @change="onFileChange" />
    </label>

    <div class="field-grid two">
      <label>
        用途
        <select v-model="usage">
          <option v-for="option in usageOptions" :key="option" :value="option">{{ option }}</option>
        </select>
      </label>
      <label>
        标签
        <input v-model="tags" placeholder="catalog, datasheet, 2026" />
      </label>
    </div>

    <button class="primary-button" type="button" :disabled="!canUpload" @click="submit">
      <UploadCloud class="button-icon" />
      <span>{{ isSaving ? '上传中...' : '上传文件' }}</span>
    </button>
  </section>
</template>
