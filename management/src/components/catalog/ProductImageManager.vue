<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from '@lucide/vue'
import { resolveAssetUrl } from '../../api/client'
import { uploadWebsiteImage } from '../../api/websiteConfig'
import { moveProductImage, setMainProductImage } from './catalogProductManagementData'

const props = defineProps<{
  images: string[]
  token: string
  readonly?: boolean
  title?: string
  maxImages?: number
  helper?: string
}>()

const emit = defineEmits<{
  updateImages: [images: string[]]
}>()

const MAX_IMAGE_SIZE = 2 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const isUploading = shallowRef(false)
const uploadError = shallowRef('')

const maxImages = computed(() => props.maxImages ?? 8)
const managerTitle = computed(() => props.title ?? '产品图片')
const normalizedImages = computed(() => props.images.slice(0, maxImages.value))
const canAddMore = computed(() => normalizedImages.value.length < maxImages.value && !props.readonly)
const helperText = computed(() => props.helper ?? `${normalizedImages.value.length}/${maxImages.value} 张，支持 JPG、PNG，建议单张不超过 2MB`)

function removeImage(index: number) {
  emit('updateImages', normalizedImages.value.filter((_, imageIndex) => imageIndex !== index))
}

function moveImage(index: number, direction: -1 | 1) {
  emit('updateImages', moveProductImage(normalizedImages.value, index, direction))
}

function setMainImage(index: number) {
  emit('updateImages', setMainProductImage(normalizedImages.value, index))
}

async function uploadImages(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  uploadError.value = ''
  if (!files.length) return

  const remainingSlots = maxImages.value - normalizedImages.value.length
  if (remainingSlots <= 0) {
    uploadError.value = `最多只能上传 ${maxImages.value} 张图片。`
    return
  }

  const filesToUpload = files.slice(0, remainingSlots)
  const invalidFile = filesToUpload.find(file => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)
  if (invalidFile) {
    uploadError.value = '请上传 JPG、PNG 或 WebP 图片，且单张不超过 2MB。'
    return
  }

  isUploading.value = true
  try {
    const uploaded = await Promise.all(filesToUpload.map(file => uploadWebsiteImage(file, props.token)))
    emit('updateImages', [...normalizedImages.value, ...uploaded.map(file => file.url)].slice(0, maxImages.value))
  } catch {
    uploadError.value = '图片上传失败，请稍后重试。'
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
  <section class="product-image-manager">
    <div class="image-manager-header">
      <div>
        <strong>{{ managerTitle }}</strong>
        <p>{{ helperText }}</p>
      </div>
      <label v-if="!readonly" class="upload-button compact" :class="{ disabled: !canAddMore || isUploading }">
        <ImagePlus class="upload-icon" />
        {{ isUploading ? '上传中...' : '上传图片' }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          :disabled="!canAddMore || isUploading"
          @change="uploadImages"
        />
      </label>
    </div>

    <div v-if="normalizedImages.length" class="image-thumb-grid">
      <article v-for="(image, index) in normalizedImages" :key="`${image}-${index}`" class="image-thumb-card" :class="{ 'is-main-image': index === 0 }">
        <div class="image-thumb-preview" :style="{ backgroundImage: `url('${resolveAssetUrl(image)}')` }"></div>
        <span class="image-order-badge">{{ index === 0 ? '主图' : index + 1 }}</span>
        <div v-if="!readonly" class="image-thumb-actions">
          <button type="button" aria-label="设为主图" title="设为主图" :disabled="index === 0" @click="setMainImage(index)">
            <Star />
          </button>
          <button type="button" aria-label="图片上移" title="图片上移" :disabled="index === 0" @click="moveImage(index, -1)">
            <ArrowUp />
          </button>
          <button type="button" aria-label="图片下移" title="图片下移" :disabled="index === normalizedImages.length - 1" @click="moveImage(index, 1)">
            <ArrowDown />
          </button>
          <button class="danger" type="button" aria-label="移除图片" title="移除图片" @click="removeImage(index)">
            <Trash2 />
          </button>
        </div>
      </article>
    </div>

    <p v-if="uploadError" class="image-upload-error">{{ uploadError }}</p>
  </section>
</template>
