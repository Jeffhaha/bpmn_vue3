<template>
  <div class="code-editor-field" :class="{ readonly: readonly }">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <select v-model="currentLanguage" @change="updateLanguage" :disabled="readonly">
          <option v-for="lang in supportedLanguages" :key="lang.value" :value="lang.value">
            {{ lang.label }}
          </option>
        </select>
        <button 
          v-if="config.allowFullscreen" 
          class="toolbar-btn" 
          @click="toggleFullscreen"
          :title="isFullscreen ? '退出全屏' : '全屏编辑'"
        >
          <i :class="isFullscreen ? 'fas fa-compress' : 'fas fa-expand'"></i>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" @click="formatCode" :disabled="readonly" title="格式化代码">
          <i class="fas fa-magic"></i>
        </button>
        <button class="toolbar-btn" @click="copyCode" title="复制代码">
          <i class="fas fa-copy"></i>
        </button>
      </div>
    </div>
    
    <div 
      ref="editorContainer" 
      class="editor-container"
      :class="{ fullscreen: isFullscreen }"
    >
      <textarea
        ref="textarea"
        v-model="internalValue"
        :placeholder="placeholder"
        :readonly="readonly"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        class="code-textarea"
      ></textarea>
      
      <!-- 行号 -->
      <div v-if="showLineNumbers" class="line-numbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
          :class="{ active: n === currentLine }"
        >
          {{ n }}
        </div>
      </div>
    </div>
    
    <div v-if="showFooter" class="editor-footer">
      <div class="footer-left">
        <span class="status-info">行 {{ currentLine }}, 列 {{ currentColumn }}</span>
        <span v-if="errorMessage" class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          {{ errorMessage }}
        </span>
      </div>
      <div class="footer-right">
        <span class="char-count">{{ charCount }} 字符</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { PropertyConfig, PropertyContext } from '@/types/property.types'

// Props
interface Props {
  modelValue: string
  property: PropertyConfig
  context: PropertyContext
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 配置
const config = computed(() => ({
  language: 'javascript',
  theme: 'default',
  allowFullscreen: true,
  showLineNumbers: true,
  showFooter: true,
  autoFormat: false,
  ...props.property.properties || {}
}))

// 状态
const internalValue = ref(props.modelValue || '')
const currentLanguage = ref(config.value.language)
const isFullscreen = ref(false)
const currentLine = ref(1)
const currentColumn = ref(1)
const errorMessage = ref('')
const editorContainer = ref<HTMLElement>()
const textarea = ref<HTMLTextAreaElement>()

// 支持的语言
const supportedLanguages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'json', label: 'JSON' },
  { value: 'xml', label: 'XML' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'shell', label: 'Shell' },
  { value: 'groovy', label: 'Groovy' },
  { value: 'expression', label: 'Expression' }
]

// 计算属性
const placeholder = computed(() => 
  props.property.description || `输入${currentLanguage.value}代码...`
)

const showLineNumbers = computed(() => config.value.showLineNumbers)
const showFooter = computed(() => config.value.showFooter)

const lineCount = computed(() => {
  return internalValue.value.split('\n').length
})

const charCount = computed(() => {
  return internalValue.value.length
})

// 监听
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue || ''
  }
})

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 生命周期
onMounted(() => {
  updateCursorPosition()
  if (config.value.autoFormat && internalValue.value) {
    formatCode()
  }
})

onUnmounted(() => {
  if (isFullscreen.value) {
    exitFullscreen()
  }
})

// 方法
function handleInput() {
  validateCode()
  updateCursorPosition()
}

function handleFocus() {
  updateCursorPosition()
}

function handleBlur() {
  updateCursorPosition()
}

function updateCursorPosition() {
  if (!textarea.value) return
  
  const text = textarea.value.value
  const cursorPosition = textarea.value.selectionStart
  
  const textBeforeCursor = text.substring(0, cursorPosition)
  const lines = textBeforeCursor.split('\n')
  
  currentLine.value = lines.length
  currentColumn.value = lines[lines.length - 1].length + 1
}

function updateLanguage() {
  validateCode()
  if (config.value.autoFormat) {
    formatCode()
  }
}

function validateCode() {
  errorMessage.value = ''
  
  if (!internalValue.value.trim()) return
  
  try {
    switch (currentLanguage.value) {
      case 'json':
        JSON.parse(internalValue.value)
        break
      case 'xml':
        validateXML(internalValue.value)
        break
      case 'javascript':
      case 'typescript':
        validateJavaScript(internalValue.value)
        break
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '语法错误'
  }
}

function validateXML(xml: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')
  const errorNode = doc.querySelector('parsererror')
  
  if (errorNode) {
    throw new Error('XML语法错误')
  }
}

function validateJavaScript(code: string) {
  try {
    new Function(code)
  } catch (error) {
    throw error
  }
}

function formatCode() {
  if (props.readonly) return
  
  try {
    let formatted = internalValue.value
    
    switch (currentLanguage.value) {
      case 'json':
        const parsed = JSON.parse(internalValue.value)
        formatted = JSON.stringify(parsed, null, 2)
        break
      case 'xml':
        formatted = formatXML(internalValue.value)
        break
      case 'javascript':
      case 'typescript':
        // 简单的JavaScript格式化
        formatted = formatJavaScript(internalValue.value)
        break
    }
    
    internalValue.value = formatted
  } catch (error) {
    console.warn('格式化失败:', error)
  }
}

function formatXML(xml: string): string {
  const formatted = xml.replace(/></g, '>\n<')
  const lines = formatted.split('\n')
  let indentLevel = 0
  const indentStr = '  '
  
  return lines.map(line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('</')) {
      indentLevel--
    }
    
    const result = indentStr.repeat(Math.max(0, indentLevel)) + trimmed
    
    if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
      indentLevel++
    }
    
    return result
  }).join('\n')
}

function formatJavaScript(code: string): string {
  // 简单的JavaScript格式化实现
  let formatted = code
  let indentLevel = 0
  const indentStr = '  '
  
  const lines = formatted.split('\n')
  
  return lines.map(line => {
    const trimmed = line.trim()
    
    if (trimmed.includes('}')) {
      indentLevel = Math.max(0, indentLevel - 1)
    }
    
    const result = indentStr.repeat(indentLevel) + trimmed
    
    if (trimmed.includes('{')) {
      indentLevel++
    }
    
    return result
  }).join('\n')
}

function copyCode() {
  navigator.clipboard.writeText(internalValue.value).then(() => {
    // 可以显示复制成功的提示
  })
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen()
  } else {
    enterFullscreen()
  }
}

function enterFullscreen() {
  isFullscreen.value = true
  document.body.style.overflow = 'hidden'
  
  nextTick(() => {
    if (textarea.value) {
      textarea.value.focus()
    }
  })
}

function exitFullscreen() {
  isFullscreen.value = false
  document.body.style.overflow = ''
}

// 键盘快捷键
function handleKeydown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        formatCode()
        break
      case 'Enter':
        if (event.shiftKey) {
          event.preventDefault()
          toggleFullscreen()
        }
        break
    }
  }
  
  if (event.key === 'Escape' && isFullscreen.value) {
    exitFullscreen()
  }
}

// 绑定键盘事件
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.code-editor-field {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  
  &.readonly {
    background: #f9fafb;
    
    .editor-toolbar {
      background: #f3f4f6;
    }
  }
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 6px 6px 0 0;
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  select {
    font-size: 11px;
    padding: 4px 8px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    background: white;
    
    &:focus {
      outline: none;
      border-color: #3b82f6;
    }
  }
  
  .toolbar-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #6b7280;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover:not(:disabled) {
      background: #e5e7eb;
      color: #374151;
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    i {
      font-size: 11px;
    }
  }
}

.editor-container {
  position: relative;
  background: white;
  
  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    background: white;
    border-radius: 0;
    
    .code-textarea {
      height: calc(100vh - 120px);
    }
  }
}

.code-textarea {
  width: 100%;
  height: 200px;
  padding: 12px;
  padding-left: 60px;
  border: none;
  outline: none;
  resize: vertical;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  background: transparent;
  color: #1f2937;
  
  &::placeholder {
    color: #9ca3af;
  }
  
  &:focus {
    outline: none;
  }
}

.line-numbers {
  position: absolute;
  left: 0;
  top: 0;
  width: 50px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e9ecef;
  padding: 12px 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #6b7280;
  user-select: none;
  overflow: hidden;
  
  .line-number {
    text-align: right;
    height: 18px;
    
    &.active {
      color: #3b82f6;
      font-weight: 600;
    }
  }
}

.editor-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
  border-radius: 0 0 6px 6px;
  font-size: 11px;
  
  .footer-left {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .status-info {
      color: #6b7280;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #dc2626;
      
      i {
        font-size: 10px;
      }
    }
  }
  
  .footer-right {
    color: #6b7280;
  }
}

// 全屏模式下的样式覆盖
.editor-container.fullscreen {
  .editor-toolbar {
    border-radius: 0;
  }
  
  .editor-footer {
    border-radius: 0;
  }
}
</style>