<script setup lang="ts">
import { shallowRef } from 'vue'
import { ImagePlus } from '@lucide/vue'
import { resolveAssetUrl } from '../../api/client'
import { uploadWebsiteImage } from '../../api/websiteConfig'

const props = withDefaults(defineProps<{
  token: string
  readonly?: boolean
  allowCover?: boolean
}>(), {
  readonly: false,
  allowCover: true,
})

const emit = defineEmits<{
  setCover: [url: string]
  insertImage: [url: string]
}>()

const MAX_IMAGE_SIZE = 8 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const isUploading = shallowRef(false)
const uploadError = shallowRef('')
const uploadedImages = shallowRef<string[]>([])

async function uploadImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  uploadError.value = ''
  if (!files.length) return

  const invalidFile = files.find(file => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)
  if (invalidFile) {
    uploadError.value = '请上传 JPG、PNG 或 WebP 图片，且单张不超过 8MB。'
    return
  }

  isUploading.value = true
  try {
    const uploaded = await Promise.all(files.map(file => uploadWebsiteImage(file, props.token)))
    uploadedImages.value = [...uploaded.map(file => file.url), ...uploadedImages.value]
  } catch {
    uploadError.value = '图片上传失败，请稍后重试。'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <section class="content-image-uploader">
    <div class="image-manager-header">
      <div>
        <strong>正文图片</strong>
        <p>{{ allowCover ? '上传后可设为封面，或插入正文为单独图片行。' : '上传后插入案例正文；正文第一张图将作为案例列表图片。' }}</p>
      </div>
      <label class="upload-button compact" :class="{ disabled: readonly || isUploading }">
        <ImagePlus class="upload-icon" />
        {{ isUploading ? '上传中...' : '上传图片' }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          :disabled="readonly || isUploading"
          @change="uploadImages"
        />
      </label>
    </div>

    <div v-if="uploadedImages.length" class="content-image-grid">
      <article v-for="image in uploadedImages" :key="image" class="content-image-card">
        <div class="content-image-preview" :style="{ backgroundImage: `url('${resolveAssetUrl(image)}')` }"></div>
        <span v-if="allowCover">{{ image }}</span>
        <div>
          <button v-if="allowCover" type="button" :disabled="readonly" @click="emit('setCover', image)">设为封面</button>
          <button type="button" :disabled="readonly" @click="emit('insertImage', image)">插入正文</button>
        </div>
      </article>
    </div>

    <p v-if="uploadError" class="image-upload-error">{{ uploadError }}</p>
  </section>
</template>
