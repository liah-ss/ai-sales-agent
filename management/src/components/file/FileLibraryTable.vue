<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { Archive, Copy, Download, RotateCcw, Save } from '@lucide/vue'
import { resolveAssetUrl } from '../../api/client'
import type { ManagedFile } from '../../types/file'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  files: ManagedFile[]
  usageOptions: string[]
  isSaving: boolean
}>()

const emit = defineEmits<{
  update: [id: number, payload: { usage: string; tags: string | null; is_active: boolean }]
  setActive: [id: number, isActive: boolean]
}>()

const draftById = reactive<Record<number, { usage: string; tags: string }>>({})

const rows = computed(() => props.files)

watch(
  () => props.files,
  files => {
    for (const file of files) {
      draftById[file.id] = {
        usage: file.usage,
        tags: file.tags ?? '',
      }
    }
  },
  { immediate: true },
)

function formatDate(value: string) {
  return formatManagementDate(value, { year: undefined, month: 'short', second: undefined })
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function fileUrl(file: ManagedFile) {
  return resolveAssetUrl(file.url)
}

async function copyUrl(file: ManagedFile) {
  const url = fileUrl(file)
  await navigator.clipboard?.writeText(url)
}

function save(file: ManagedFile) {
  const draft = draftById[file.id]
  if (!draft) return
  emit('update', file.id, {
    usage: draft.usage,
    tags: draft.tags.trim() || null,
    is_active: file.is_active,
  })
}
</script>

<template>
  <div class="file-library">
    <article v-for="file in rows" :key="file.id" class="file-row" :class="{ archived: !file.is_active }">
      <div class="file-row-main">
        <span class="file-kind">{{ file.content_type.split('/')[1] || file.content_type }}</span>
        <div class="file-copy">
          <strong>{{ file.original_name }}</strong>
          <small>{{ formatBytes(file.size) }} · {{ formatDate(file.created_at) }} · {{ file.uploaded_by_username }}</small>
        </div>
      </div>

      <div class="file-row-fields">
        <label>
          用途
          <select v-model="draftById[file.id].usage">
            <option v-for="option in usageOptions" :key="option" :value="option">{{ option }}</option>
          </select>
        </label>
        <label>
          标签
          <input v-model="draftById[file.id].tags" placeholder="添加标签" />
        </label>
      </div>

      <div class="file-actions">
        <a class="icon-button" :href="fileUrl(file)" target="_blank" rel="noreferrer" aria-label="下载文件" title="下载">
          <Download />
        </a>
        <button class="icon-button" type="button" aria-label="复制文件链接" title="复制链接" @click="copyUrl(file)">
          <Copy />
        </button>
        <button class="icon-button" type="button" aria-label="保存文件信息" title="保存" :disabled="isSaving" @click="save(file)">
          <Save />
        </button>
        <button
          class="icon-button"
          type="button"
          :aria-label="file.is_active ? '归档文件' : '恢复文件'"
          :title="file.is_active ? '归档' : '恢复'"
          :disabled="isSaving"
          @click="emit('setActive', file.id, !file.is_active)"
        >
          <Archive v-if="file.is_active" />
          <RotateCcw v-else />
        </button>
      </div>
    </article>

    <article v-if="!rows.length" class="empty-panel">
      <strong>暂无文件</strong>
      <p>请上传资料，或调整筛选条件查看已归档文件。</p>
    </article>
  </div>
</template>
