<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from '@lucide/vue'
import { useI18n } from '../../composables/useI18n'
import { resolveOptimizedAssetUrl, resolveResponsiveAsset } from '../../api/client'

const props = defineProps<{
  images: string[]
  fallbackImage?: string
  imageTone?: string | null
  productName: string
}>()

const selectedImage = shallowRef(0)
const { t } = useI18n()
const galleryImages = computed(() => props.images.slice(0, 8))

const displayImages = computed(() => {
  if (galleryImages.value.length) return galleryImages.value
  return props.fallbackImage ? [props.fallbackImage] : []
})

const currentImage = computed(() => displayImages.value[selectedImage.value] ?? '')
const currentSources = computed(() => resolveResponsiveAsset(currentImage.value, {
  widths: [480, 800, 1200, 1600],
  quality: 90,
}))

function selectImage(index: number) {
  selectedImage.value = index
}

function moveImage(step: number) {
  const total = displayImages.value.length
  if (!total) return
  selectedImage.value = (selectedImage.value + step + total) % total
}

watch(displayImages, () => {
  selectedImage.value = 0
})
</script>

<template>
  <section class="product-gallery-panel" :aria-label="t('detail.galleryLabel', '', { name: productName })">
    <div
      :class="['product-gallery-main', imageTone]"
    >
      <img
        v-if="currentSources.src"
        class="product-gallery-main-image"
        :src="currentSources.src"
        :srcset="currentSources.srcset || undefined"
        sizes="(max-width: 980px) 100vw, 50vw"
        :alt="productName"
        width="1600"
        height="1200"
        decoding="async"
      />
      <ImageIcon v-if="!currentImage" class="empty-gallery-icon" aria-hidden="true" />
      <div v-if="displayImages.length > 1" class="gallery-controls">
        <button type="button" :aria-label="t('detail.previousImage')" @click="moveImage(-1)">
          <ChevronLeft class="gallery-control-icon" />
        </button>
        <button type="button" :aria-label="t('detail.nextImage')" @click="moveImage(1)">
          <ChevronRight class="gallery-control-icon" />
        </button>
      </div>
    </div>

    <div v-if="displayImages.length" class="gallery-thumb-strip" role="list">
      <button
        v-for="(image, index) in displayImages"
        :key="`${image}-${index}`"
        :class="{ active: selectedImage === index }"
        type="button"
        role="listitem"
        :aria-label="t('detail.viewImage', '', { index: String(index + 1) })"
        @click="selectImage(index)"
      >
        <img
          :src="resolveOptimizedAssetUrl(image, { width: 240 })"
          :alt="`${productName} - ${index + 1}`"
          width="240"
          height="180"
          loading="lazy"
          decoding="async"
        />
      </button>
    </div>
  </section>
</template>

<style scoped>
.product-gallery-panel {
  display: grid;
  align-self: start;
  gap: 14px;
}

.product-gallery-main {
  position: relative;
  block-size: clamp(400px, 30vw, 560px);
  border: 1px solid #dce3eb;
  border-radius: 8px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background-color: #f4f7f9;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.product-gallery-main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.empty-gallery-icon {
  width: 54px;
  height: 54px;
  color: #8ca0ae;
}

.gallery-controls {
  position: absolute;
  right: 18px;
  bottom: 18px;
  z-index: 1;
  display: flex;
  gap: 10px;
}

.gallery-controls button {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(17, 24, 39, 0.14);
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.92);
  color: #1d2733;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
}

.gallery-control-icon {
  width: 20px;
  height: 20px;
}

.gallery-thumb-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.gallery-thumb-strip button {
  height: 88px;
  border: 1px solid #dce3eb;
  border-radius: 8px;
  padding: 6px;
  background: #fff;
  overflow: hidden;
}

.gallery-thumb-strip button.active {
  border-color: #1f6d86;
  box-shadow: 0 0 0 2px rgba(31, 109, 134, 0.12);
}

.gallery-thumb-strip img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  object-fit: contain;
}

@media (max-width: 980px) {
  .product-gallery-main {
    block-size: 420px;
  }
}

@media (max-width: 640px) {
  .product-gallery-main {
    block-size: 300px;
  }

  .gallery-thumb-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .gallery-thumb-strip button {
    height: 68px;
  }
}

@media (max-width: 420px) {
  .product-gallery-main {
    block-size: 240px;
  }

  .gallery-thumb-strip {
    gap: 8px;
  }

  .gallery-thumb-strip button {
    height: 58px;
  }
}
</style>
