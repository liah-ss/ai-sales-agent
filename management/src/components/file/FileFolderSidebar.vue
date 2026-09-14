<script setup lang="ts">
import { Archive, Folder, FolderOpen } from '@lucide/vue'
import type { ManagedFile, MaterialFolder } from '../../types/file'

const props = defineProps<{
  folders: MaterialFolder[]
  files: ManagedFile[]
  activeKey: string
  isSaving: boolean
}>()

const emit = defineEmits<{
  select: [key: string]
  uploadFiles: [files: File[], usage: string]
}>()

function folderCount(folder: MaterialFolder) {
  if (folder.archived) return props.files.filter(file => !file.is_active).length
  if (!folder.usage) return props.files.filter(file => file.is_active).length
  return props.files.filter(file => file.is_active && file.usage === folder.usage).length
}

function dropFiles(folder: MaterialFolder, event: DragEvent) {
  if (folder.archived || props.isSaving) return
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) emit('uploadFiles', files, folder.usage ?? 'general')
}
</script>

<template>
  <aside class="finder-sidebar" aria-label="素材文件夹">
    <div class="finder-sidebar-title">位置</div>
    <button
      v-for="folder in folders"
      :key="folder.key"
      class="finder-folder"
      :class="{ active: activeKey === folder.key, disabled: isSaving }"
      type="button"
      @click="emit('select', folder.key)"
      @dragover.prevent
      @drop.prevent="dropFiles(folder, $event)"
    >
      <Archive v-if="folder.archived" class="finder-folder-icon archived" />
      <FolderOpen v-else-if="activeKey === folder.key" class="finder-folder-icon" />
      <Folder v-else class="finder-folder-icon" />
      <span>{{ folder.name }}</span>
      <em>{{ folderCount(folder) }}</em>
    </button>
    <p>可将桌面文件直接拖入任意文件夹。</p>
  </aside>
</template>

<style scoped>
.finder-sidebar {
  min-width: 0;
  border-right: 1px solid #d7dde5;
  padding: 16px 10px;
  background: #eef1f5;
}

.finder-sidebar-title {
  padding: 0 10px 8px;
  color: #697586;
  font-size: 11px;
  font-weight: 900;
}

.finder-folder {
  width: 100%;
  min-height: 38px;
  border: 0;
  border-radius: 6px;
  padding: 0 10px;
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  background: transparent;
  color: #344054;
  text-align: left;
  cursor: pointer;
}

.finder-folder:hover {
  background: #e2e7ed;
}

.finder-folder.active {
  background: #d9e9f8;
  color: #155b8f;
}

.finder-folder-icon {
  width: 18px;
  height: 18px;
  color: #2684c7;
  fill: #7fc4ef;
}

.finder-folder-icon.archived {
  color: #697586;
  fill: none;
}

.finder-folder span {
  overflow: hidden;
  font-size: 13px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.finder-folder em {
  color: #7b8794;
  font-size: 11px;
  font-style: normal;
  font-weight: 800;
}

.finder-sidebar p {
  margin: 18px 10px 0;
  color: #7b8794;
  font-size: 11px;
  line-height: 1.55;
}
</style>
