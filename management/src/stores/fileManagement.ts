import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import {
  downloadManagementFile,
  getManagementFiles,
  setManagementFileActive,
  updateManagementFile,
  uploadManagementFile,
} from '../api/filesManagement'
import type { ManagedFile, ManagedFileFilters, ManagedFileUpdate, ManagedFileUploadPayload } from '../types/file'

export const useFileManagementStore = defineStore('file-management', () => {
  const files = shallowRef<ManagedFile[]>([])
  const isLoading = shallowRef(false)
  const isSaving = shallowRef(false)
  const error = shallowRef('')
  const lastSavedAt = shallowRef('')
  const downloadingId = shallowRef<number | null>(null)

  const counts = computed(() => ({
    total: files.value.length,
    active: files.value.filter(file => file.is_active).length,
    archived: files.value.filter(file => !file.is_active).length,
    storage: files.value.reduce((sum, file) => sum + file.size, 0),
  }))

  function stampSaved() {
    lastSavedAt.value = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  }

  async function load(token: string, filters: ManagedFileFilters = {}) {
    isLoading.value = true
    error.value = ''
    try {
      files.value = await getManagementFiles(token, filters)
    } catch {
      error.value = 'Unable to load files.'
    } finally {
      isLoading.value = false
    }
  }

  function upsert(file: ManagedFile) {
    const exists = files.value.some(item => item.id === file.id)
    files.value = exists
      ? files.value.map(item => (item.id === file.id ? file : item))
      : [file, ...files.value]
  }

  async function upload(token: string, payload: ManagedFileUploadPayload) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = await uploadManagementFile(token, payload)
      upsert(saved)
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to upload file.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function update(id: number, payload: ManagedFileUpdate, token: string) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = await updateManagementFile(id, payload, token)
      upsert(saved)
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to update file.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function setActive(id: number, isActive: boolean, token: string) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = await setManagementFileActive(id, isActive, token)
      upsert(saved)
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to update file status.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function download(id: number, token: string) {
    downloadingId.value = id
    error.value = ''
    try {
      return await downloadManagementFile(id, token)
    } catch {
      error.value = 'Unable to download file.'
      return null
    } finally {
      downloadingId.value = null
    }
  }

  return {
    files,
    isLoading,
    isSaving,
    error,
    lastSavedAt,
    downloadingId,
    counts,
    load,
    upload,
    update,
    setActive,
    download,
  }
})
