<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { FileText, Mail, MessageSquare, Phone } from '@lucide/vue'
import { resolveAssetUrl } from '../../api/client'
import type { InquiryStatus, ManagementInquiry } from '../../types/inquiry'
import { formatManagementDate } from '../../utils/dateTime'

const props = defineProps<{
  inquiry: ManagementInquiry | null
  isSaving: boolean
}>()

const emit = defineEmits<{
  updateStatus: [id: number, status: InquiryStatus]
  addNote: [id: number, note: string]
}>()

const statusOptions: InquiryStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost', 'archived']
const statusLabels: Record<InquiryStatus, string> = {
  new: '新询盘',
  contacted: '已联系',
  quoted: '已报价',
  won: '已成交',
  lost: '已丢单',
  archived: '已归档',
}
const noteDraft = shallowRef('')
const whatsappLink = computed(() => {
  if (!props.inquiry?.phone) return ''
  const phone = props.inquiry.phone.replace(/[^\d+]/g, '')
  const message = encodeURIComponent(`您好 ${props.inquiry.name}，我们已收到您在 ExampleCorp 提交的询盘。`)
  return `https://wa.me/${phone.replace(/^\+/, '')}?text=${message}`
})
const attachmentHref = computed(() => resolveAssetUrl(props.inquiry?.attachment_url ?? ''))

function submitNote() {
  if (!props.inquiry || !noteDraft.value.trim()) return
  emit('addNote', props.inquiry.id, noteDraft.value.trim())
  noteDraft.value = ''
}

watch(() => props.inquiry?.id, () => {
  noteDraft.value = ''
})
</script>

<template>
  <section class="inquiry-detail config-panel">
    <div v-if="!inquiry" class="empty-panel">
      <h2>未选择询盘</h2>
      <p>请从左侧列表选择一条询盘，查看联系方式和跟进备注。</p>
    </div>

    <template v-else>
      <div class="panel-header split">
        <div>
          <span class="system-label">{{ inquiry.submission_number }}</span>
          <h2>{{ inquiry.company }}</h2>
        </div>
        <select class="status-select" :value="inquiry.status" @change="emit('updateStatus', inquiry.id, ($event.target as HTMLSelectElement).value as InquiryStatus)">
          <option v-for="status in statusOptions" :key="status" :value="status">{{ statusLabels[status] }}</option>
        </select>
      </div>

      <div class="contact-strip">
        <a v-if="inquiry.email" :href="`mailto:${inquiry.email}`">
          <Mail class="button-icon" />
          <span>{{ inquiry.email }}</span>
        </a>
        <a v-if="inquiry.phone" :href="`tel:${inquiry.phone}`">
          <Phone class="button-icon" />
          <span>{{ inquiry.phone }}</span>
        </a>
        <a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noreferrer">
          <MessageSquare class="button-icon" />
          <span>WhatsApp</span>
        </a>
        <a v-if="attachmentHref" :href="attachmentHref" target="_blank" rel="noreferrer">
          <FileText class="button-icon" />
          <span>{{ inquiry.attachment_name || '询盘附件' }}</span>
        </a>
      </div>

      <div class="inquiry-fields">
        <article>
          <small>联系人</small>
          <strong>{{ inquiry.name }}</strong>
        </article>
        <article>
          <small>产品</small>
          <strong>{{ inquiry.product_code ? `${inquiry.product_code} · ${inquiry.product_slug || ''}` : inquiry.product_slug || '未指定' }}</strong>
        </article>
        <article>
          <small>解决方案</small>
          <strong>{{ inquiry.solution_slug || '未指定' }}</strong>
        </article>
        <article>
          <small>来源页面</small>
          <strong>{{ inquiry.source_page }}</strong>
        </article>
        <article>
          <small>CRM 投递</small>
          <strong>{{ inquiry.crm_status }} · {{ inquiry.crm_attempts }} 次</strong>
          <span v-if="inquiry.crm_last_error" class="form-alert error">{{ inquiry.crm_last_error }}</span>
        </article>
      </div>

      <section class="message-panel" aria-labelledby="inquiry-original-heading">
        <h3 id="inquiry-original-heading" class="system-label">询盘原文</h3>
        <p style="white-space: pre-wrap">{{ inquiry.message }}</p>
      </section>

      <form class="note-form" @submit.prevent="submitNote">
        <label>
          跟进备注
          <textarea v-model="noteDraft" rows="4" placeholder="记录电话结果、报价进度、下一步动作..." />
        </label>
        <button class="primary-button compact" type="submit" :disabled="isSaving || !noteDraft.trim()">
          {{ isSaving ? '保存中...' : '添加备注' }}
        </button>
      </form>

      <section class="note-timeline">
        <article v-for="note in inquiry.notes" :key="note.id" class="note-item">
          <strong>{{ note.admin_username }}</strong>
          <small>{{ formatManagementDate(note.created_at) }}</small>
          <p>{{ note.note }}</p>
        </article>
      </section>
    </template>
  </section>
</template>
