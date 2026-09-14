<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'
import '@wangeditor/editor/dist/css/style.css'
import { uploadWebsiteImage } from '../../api/websiteConfig'

const props = withDefaults(defineProps<{
  token: string
  readonly?: boolean
  placeholder?: string
}>(), {
  readonly: false,
  placeholder: '请输入正文内容',
})

const model = defineModel<string>({ default: '' })
const editorRef = shallowRef<IDomEditor | null>(null)
const uploadError = shallowRef('')
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: [
    'headerSelect',
    'blockquote',
    '|',
    'bold',
    'underline',
    'italic',
    'through',
    'clearStyle',
    '|',
    'color',
    'bgColor',
    'fontSize',
    'fontFamily',
    'lineHeight',
    '|',
    'bulletedList',
    'numberedList',
    'todo',
    '|',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
    'justifyJustify',
    'indent',
    'delIndent',
    '|',
    'insertLink',
    'uploadImage',
    'insertTable',
    'divider',
    '|',
    'undo',
    'redo',
    'fullScreen',
  ],
}
const editorConfig = computed<Partial<IEditorConfig>>(() => ({
  placeholder: props.placeholder,
  readOnly: props.readonly,
  customPaste: (editor: IDomEditor, event: ClipboardEvent) => {
    const html = event.clipboardData?.getData('text/html') ?? ''
    if (!html.trim()) return true
    event.preventDefault()
    editor.dangerouslyInsertHtml(html)
    return false
  },
  MENU_CONF: {
    uploadImage: {
      base64LimitSize: 0,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
      customUpload: async (
        file: File,
        insertFn: (url: string, alt: string, href: string) => void,
      ) => {
        uploadError.value = ''
        try {
          const uploaded = await uploadWebsiteImage(file, props.token)
          insertFn(uploaded.url, file.name, '')
        } catch {
          uploadError.value = '图片上传失败，请检查图片格式、大小和登录状态后重试。'
        }
      },
    },
  },
}))

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
  if (props.readonly) editor.disable()
}

watch(() => props.readonly, (value) => {
  if (value) editorRef.value?.disable()
  else editorRef.value?.enable()
})

onBeforeUnmount(() => {
  editorRef.value?.destroy()
  editorRef.value = null
})
</script>

<template>
  <div class="rich-text-editor" :class="{ readonly }">
    <Toolbar
      v-if="!readonly"
      class="rich-text-toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="model"
      class="rich-text-body"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
    />
    <p v-if="uploadError" class="upload-error" role="alert">{{ uploadError }}</p>
  </div>
</template>

<style scoped>
.rich-text-editor {
  overflow: hidden;
  border: 1px solid #cbd5df;
  border-radius: 6px;
  background: #ffffff;
}

.rich-text-editor:focus-within {
  border-color: #2d6ea4;
  box-shadow: 0 0 0 3px rgba(45, 110, 164, 0.12);
}

.rich-text-toolbar {
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom: 1px solid #dbe3ec;
  background: #ffffff;
}

.rich-text-toolbar :deep(.w-e-bar) {
  flex-wrap: wrap;
}

.rich-text-body {
  min-height: 240px;
  max-height: 560px;
  overflow-y: auto;
}

.rich-text-editor.readonly {
  background: #f7f9fb;
}

.upload-error {
  margin: 0;
  padding: 8px 12px;
  border-top: 1px solid #f0c2bf;
  color: #b42318;
  font-size: 13px;
}
</style>
