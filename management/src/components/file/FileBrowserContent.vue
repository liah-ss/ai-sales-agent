<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import { Archive, Download, File as FileIcon, FileText, FolderOpen, Image, RotateCcw, Search, UploadCloud } from '@lucide/vue'
import { resolveAssetUrl } from '../../api/client'
import type { ManagedFile } from '../../types/file'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  files: ManagedFile[]
  folderName: string
  canUpload: boolean
  isSaving: boolean
  downloadingId: number | null
}>()

const emit = defineEmits<{
  uploadFiles: [files: File[]]
  download: [file: ManagedFile]
  setActive: [id: number, isActive: boolean]
}>()

const query = defineModel<string>('query', { required: true })
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const dragDepth = shallowRef(0)
const isDragging = computed(() => dragDepth.value > 0)

function openFilePicker() {
  if (props.canUpload && !props.isSaving) fileInput.value?.click()
}

function submitFiles(files: FileList | null) {
  const selected = Array.from(files ?? [])
  if (selected.length && props.canUpload) emit('uploadFiles', selected)
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  submitFiles(input.files)
  input.value = ''
}

function onDragEnter() {
  if (props.canUpload) dragDepth.value += 1
}

function onDragLeave() {
  dragDepth.value = Math.max(0, dragDepth.value - 1)
}

function onDrop(event: DragEvent) {
  dragDepth.value = 0
  submitFiles(event.dataTransfer?.files ?? null)
}

function fileIcon(file: ManagedFile) {
  if (file.content_type.startsWith('image/')) return Image
  if (/pdf|word|text|document/.test(file.content_type)) return FileText
  return FileIcon
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return formatManagementDate(value, { second: undefined })
}
</script>

<template>
  <section
    class="finder-content"
    :class="{ dragging: isDragging }"
    @dragenter.prevent="onDragEnter"
    @dragover.prevent
    @dragleave.prevent="onDragLeave"
    @drop.prevent="onDrop"
  >
    <header class="finder-toolbar">
      <div class="finder-breadcrumb">
        <strong>素材文件</strong>
        <span>/</span>
        <span>{{ folderName }}</span>
      </div>
      <label class="finder-search">
        <Search />
        <input v-model="query" placeholder="搜索当前文件夹" />
      </label>
      <button class="primary-button compact" type="button" :disabled="!canUpload || isSaving" @click="openFilePicker">
        <UploadCloud class="button-icon" />
        <span>{{ isSaving ? '上传中...' : '上传' }}</span>
      </button>
      <input ref="fileInput" class="sr-only-input" type="file" multiple @change="onFileChange" />
    </header>

    <div v-if="isDragging" class="finder-drop-overlay">
      <UploadCloud />
      <strong>上传到“{{ folderName }}”</strong>
      <span>松开鼠标即可开始上传</span>
    </div>

    <div class="finder-list" role="table" aria-label="素材文件列表">
      <div class="finder-list-head" role="row">
        <span>名称</span>
        <span>大小</span>
        <span>上传时间</span>
        <span>操作</span>
      </div>
      <article v-for="file in files" :key="file.id" class="finder-file-row" :class="{ archived: !file.is_active }" role="row">
        <div class="finder-file-name">
          <span class="finder-file-preview">
            <img v-if="file.content_type.startsWith('image/')" :src="resolveAssetUrl(file.url)" alt="" />
            <component :is="fileIcon(file)" v-else />
          </span>
          <span>
            <strong>{{ file.original_name }}</strong>
            <small>{{ file.content_type }} · {{ file.uploaded_by_username }}</small>
          </span>
        </div>
        <span class="finder-file-meta">{{ formatBytes(file.size) }}</span>
        <span class="finder-file-meta">{{ formatDate(file.created_at) }}</span>
        <div class="table-actions">
          <button
            class="icon-button"
            type="button"
            :disabled="downloadingId === file.id"
            aria-label="下载文件"
            title="下载"
            @click="emit('download', file)"
          >
            <Download />
          </button>
          <button
            class="icon-button"
            type="button"
            :disabled="isSaving"
            :aria-label="file.is_active ? '归档文件' : '恢复文件'"
            :title="file.is_active ? '归档' : '恢复'"
            @click="emit('setActive', file.id, !file.is_active)"
          >
            <Archive v-if="file.is_active" />
            <RotateCcw v-else />
          </button>
        </div>
      </article>

      <div v-if="!files.length && !isDragging" class="finder-empty">
        <FolderOpen />
        <strong>此文件夹为空</strong>
        <span v-if="canUpload">点击上传，或从桌面拖入文件。</span>
        <span v-else>暂无已归档文件。</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.finder-content {
  position: relative;
  min-width: 0;
  min-height: 560px;
  background: #fff;
}

.finder-toolbar {
  min-height: 58px;
  border-bottom: 1px solid #d7dde5;
  padding: 10px 14px;
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 320px) auto;
  align-items: center;
  gap: 12px;
  background: #f7f8fa;
}

.finder-breadcrumb {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #697586;
  font-size: 13px;
}

.finder-breadcrumb strong {
  color: #1f2937;
}

.finder-search {
  min-height: 36px;
  border: 1px solid #cfd6df;
  border-radius: 7px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
}

.finder-search svg {
  width: 16px;
  color: #7b8794;
}

.finder-search input {
  width: 100%;
  min-height: 32px;
  border: 0;
  padding: 0;
  background: transparent;
  outline: 0;
}

.finder-list-head,
.finder-file-row {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 100px 170px 96px;
  align-items: center;
  gap: 12px;
}

.finder-list-head {
  min-height: 36px;
  border-bottom: 1px solid #e4e8ee;
  padding: 0 16px;
  color: #7b8794;
  font-size: 11px;
  font-weight: 850;
}

.finder-file-row {
  min-height: 64px;
  border-bottom: 1px solid #edf0f4;
  padding: 7px 16px;
}

.finder-file-row:hover {
  background: #f5f9fd;
}

.finder-file-row.archived {
  opacity: 0.62;
}

.finder-file-name {
  min-width: 0;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.finder-file-preview {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #eaf2f8;
  color: #267baa;
}

.finder-file-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.finder-file-preview svg {
  width: 21px;
}

.finder-file-name strong,
.finder-file-name small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finder-file-name strong {
  color: #1f2937;
  font-size: 13px;
}

.finder-file-name small,
.finder-file-meta {
  margin-top: 3px;
  color: #7b8794;
  font-size: 11px;
}

.finder-drop-overlay {
  position: absolute;
  z-index: 4;
  inset: 70px 16px 16px;
  border: 2px dashed #2b83bd;
  border-radius: 8px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  background: rgba(236, 247, 255, 0.96);
  color: #155b8f;
}

.finder-drop-overlay svg,
.finder-empty svg {
  width: 38px;
  height: 38px;
}

.finder-drop-overlay span,
.finder-empty span {
  color: #697586;
  font-size: 12px;
}

.finder-empty {
  min-height: 360px;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  color: #7b8794;
}

.finder-empty strong {
  color: #344054;
}

@media (max-width: 900px) {
  .finder-toolbar {
    grid-template-columns: 1fr auto;
  }

  .finder-search {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .finder-list {
    overflow-x: auto;
  }

  .finder-list-head,
  .finder-file-row {
    min-width: 760px;
  }
}
</style>
