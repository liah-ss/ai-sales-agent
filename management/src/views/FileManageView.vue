<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import FileBrowserContent from '../components/file/FileBrowserContent.vue'
import FileFolderSidebar from '../components/file/FileFolderSidebar.vue'
import { useAuthStore } from '../stores/auth'
import { useFileManagementStore } from '../stores/fileManagement'
import type { ManagedFile, MaterialFolder } from '../types/file'

const folders: MaterialFolder[] = [
  { key: 'all', name: '全部文件', usage: null },
  { key: 'general', name: '通用素材', usage: 'general' },
  { key: 'product', name: '产品资料', usage: 'product' },
  { key: 'solution', name: '解决方案', usage: 'solution' },
  { key: 'certificate', name: '证书', usage: 'certificate' },
  { key: 'banner', name: 'Banner', usage: 'banner' },
  { key: 'manual', name: '手册', usage: 'manual' },
  { key: 'company', name: '企业资料', usage: 'company' },
  { key: 'archived', name: '已归档', usage: null, archived: true },
]

const authStore = useAuthStore()
const store = useFileManagementStore()
const { files, counts, isLoading, isSaving, downloadingId, error, lastSavedAt } = storeToRefs(store)
const activeFolderKey = shallowRef('all')
const query = shallowRef('')

const activeFolder = computed(() => folders.find(folder => folder.key === activeFolderKey.value) ?? folders[0])
const canUpload = computed(() => !activeFolder.value.archived)
const activeUploadUsage = computed(() => activeFolder.value.usage ?? 'general')
const visibleFiles = computed(() => {
  const term = query.value.trim().toLocaleLowerCase()
  return files.value.filter((file) => {
    const inFolder = activeFolder.value.archived
      ? !file.is_active
      : file.is_active && (!activeFolder.value.usage || file.usage === activeFolder.value.usage)
    if (!inFolder) return false
    if (!term) return true
    return [file.original_name, file.tags ?? '', file.usage]
      .some(value => value.toLocaleLowerCase().includes(term))
  })
})

function requireToken() {
  if (!authStore.token) throw new Error('Missing management token')
  return authStore.token
}

async function uploadFiles(selectedFiles: File[], usage = activeUploadUsage.value) {
  for (const file of selectedFiles) {
    await store.upload(requireToken(), { file, usage })
  }
}

async function setFileActive(id: number, isActive: boolean) {
  await store.setActive(id, isActive, requireToken())
}

async function downloadFile(file: ManagedFile) {
  const blob = await store.download(file.id, requireToken())
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.original_name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

onMounted(() => store.load(requireToken(), { includeArchived: true }))
</script>

<template>
  <section class="file-manager-heading">
    <div>
      <span class="system-label">素材文件</span>
      <h1>文件管理</h1>
    </div>
    <div class="file-manager-status">
      <strong>{{ counts.active }}</strong>
      <span>个文件</span>
      <i></i>
      <strong>{{ counts.archived }}</strong>
      <span>已归档</span>
      <i></i>
      <span>{{ lastSavedAt || '已同步' }}</span>
    </div>
  </section>

  <p v-if="error" class="form-alert error config-alert">{{ error }}</p>
  <p v-if="isLoading" class="form-alert config-alert">正在加载文件...</p>

  <section class="finder-window" aria-label="素材文件管理器">
    <div class="finder-titlebar" aria-hidden="true">
      <strong>素材文件</strong>
    </div>
    <div class="finder-layout">
      <FileFolderSidebar
        :folders="folders"
        :files="files"
        :active-key="activeFolder.key"
        :is-saving="isSaving"
        @select="activeFolderKey = $event; query = ''"
        @upload-files="uploadFiles"
      />
      <FileBrowserContent
        v-model:query="query"
        :files="visibleFiles"
        :folder-name="activeFolder.name"
        :can-upload="canUpload"
        :is-saving="isSaving"
        :downloading-id="downloadingId"
        @upload-files="uploadFiles"
        @download="downloadFile"
        @set-active="setFileActive"
      />
    </div>
  </section>
</template>

<style scoped>
.file-manager-heading {
  margin-bottom: 16px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.file-manager-heading h1 {
  margin: 5px 0 0;
  font-size: 28px;
}

.file-manager-status {
  display: flex;
  align-items: baseline;
  gap: 7px;
  color: #7b8794;
  font-size: 12px;
  font-weight: 750;
}

.file-manager-status strong {
  color: #1f2937;
  font-size: 16px;
}

.file-manager-status i {
  width: 1px;
  height: 14px;
  margin: 0 5px;
  background: #d4dae2;
}

.finder-window {
  min-width: 0;
  border: 1px solid #cbd3dd;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 12px 28px rgba(35, 50, 66, 0.12);
}

.finder-titlebar {
  min-height: 42px;
  border-bottom: 1px solid #cbd3dd;
  padding: 0 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8ebef;
}

.finder-titlebar strong {
  color: #45505f;
  font-size: 12px;
  text-align: center;
}

.finder-layout {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
}

@media (max-width: 760px) {
  .file-manager-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .finder-layout {
    grid-template-columns: 1fr;
  }

  .finder-layout :deep(.finder-sidebar) {
    border-right: 0;
    border-bottom: 1px solid #d7dde5;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finder-layout :deep(.finder-sidebar-title),
  .finder-layout :deep(.finder-sidebar p) {
    grid-column: 1 / -1;
  }
}
</style>
