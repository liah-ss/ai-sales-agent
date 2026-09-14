import { defineStore } from 'pinia'
import { computed, shallowRef } from 'vue'
import { addManagementInquiryNote, deleteManagementInquiry, getManagementInquiries, updateManagementInquiryStatus } from '../api/inquiriesManagement'
import type { InquiryStatus, ManagementInquiry } from '../types/inquiry'

export const useInquiryManagementStore = defineStore('inquiry-management', () => {
  const inquiries = shallowRef<ManagementInquiry[]>([])
  const isLoading = shallowRef(false)
  const isSaving = shallowRef(false)
  const error = shallowRef('')
  const lastSavedAt = shallowRef('')

  const counts = computed(() => ({
    total: inquiries.value.length,
    new: inquiries.value.filter(item => item.status === 'new').length,
    contacted: inquiries.value.filter(item => item.status === 'contacted').length,
    quoted: inquiries.value.filter(item => item.status === 'quoted').length,
  }))

  function stampSaved() {
    lastSavedAt.value = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date())
  }

  async function load(token: string, filters: { status?: string; q?: string } = {}) {
    isLoading.value = true
    error.value = ''
    try {
      inquiries.value = await getManagementInquiries(token, filters)
    } catch {
      error.value = 'Unable to load inquiries.'
    } finally {
      isLoading.value = false
    }
  }

  function upsertInquiry(inquiry: ManagementInquiry) {
    inquiries.value = inquiries.value.map(item => (item.id === inquiry.id ? inquiry : item))
  }

  async function updateStatus(id: number, status: InquiryStatus, token: string) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = await updateManagementInquiryStatus(id, status, token)
      upsertInquiry(saved)
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to update inquiry status.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function addNote(id: number, note: string, token: string) {
    isSaving.value = true
    error.value = ''
    try {
      const saved = await addManagementInquiryNote(id, note, token)
      upsertInquiry(saved)
      stampSaved()
      return saved
    } catch {
      error.value = 'Unable to save inquiry note.'
      return null
    } finally {
      isSaving.value = false
    }
  }

  async function removeMany(ids: number[], token: string) {
    if (!ids.length) return []
    isSaving.value = true
    error.value = ''
    const removedIds: number[] = []
    let failedCount = 0
    try {
      for (const id of ids) {
        try {
          await deleteManagementInquiry(id, token)
          removedIds.push(id)
        } catch {
          failedCount += 1
        }
      }
      if (removedIds.length) {
        const removedSet = new Set(removedIds)
        inquiries.value = inquiries.value.filter(item => !removedSet.has(item.id))
        stampSaved()
      }
      if (failedCount) error.value = `已删除 ${removedIds.length} 条询盘，${failedCount} 条删除失败。`
      return removedIds
    } finally {
      isSaving.value = false
    }
  }

  return {
    inquiries,
    isLoading,
    isSaving,
    error,
    lastSavedAt,
    counts,
    load,
    updateStatus,
    addNote,
    removeMany,
  }
})
