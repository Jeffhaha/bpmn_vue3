<template>
  <div class="expression-editor-field">
    <div class="editor-header">
      <div class="header-left">
        <select v-model="expressionType" @change="onExpressionTypeChange" :disabled="readonly">
          <option v-for="type in expressionTypes" :key="type.value" :value="type.value">
            {{ type.label }}
          </option>
        </select>
        <span v-if="expressionType !== 'custom'" class="expression-prefix">{{ getExpressionPrefix() }}</span>
      </div>
      <div class="header-right">
        <button class="helper-btn" @click="showHelper = !showHelper" :class="{ active: showHelper }">
          <i class="fas fa-question-circle"></i>
        </button>
        <button class="validate-btn" @click="validateExpression" :disabled="readonly">
          <i class="fas fa-check-circle"></i>
        </button>
      </div>
    </div>

    <!-- 表达式输入区域 -->
    <div class="expression-input">
      <textarea
        v-model="internalValue"
        :placeholder="getPlaceholder()"
        :readonly="readonly"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        rows="3"
        class="expression-textarea"
      ></textarea>
      
      <!-- 语法高亮覆盖层 -->
      <div v-if="enableSyntaxHighlight" class="syntax-highlight">
        <div v-html="highlightedExpression"></div>
      </div>
    </div>

    <!-- 验证状态 -->
    <div v-if="validationState.message" class="validation-status" :class="validationState.type">
      <i :class="validationState.icon"></i>
      <span>{{ validationState.message }}</span>
    </div>

    <!-- 帮助面板 -->
    <div v-if="showHelper" class="helper-panel">
      <div class="helper-header">
        <h4>表达式帮助</h4>
        <button @click="showHelper = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="helper-content">
        <!-- 变量列表 -->
        <div class="helper-section">
          <h5>可用变量</h5>
          <div class="variable-list">
            <div 
              v-for="variable in availableVariables" 
              :key="variable.name"
              class="variable-item"
              @click="insertVariable(variable)"
            >
              <div class="variable-info">
                <span class="variable-name">{{ variable.name }}</span>
                <span class="variable-type">{{ variable.type }}</span>
              </div>
              <div v-if="variable.description" class="variable-description">
                {{ variable.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- 函数列表 -->
        <div class="helper-section">
          <h5>可用函数</h5>
          <div class="function-list">
            <div 
              v-for="func in availableFunctions" 
              :key="func.name"
              class="function-item"
              @click="insertFunction(func)"
            >
              <div class="function-signature">
                <span class="function-name">{{ func.name }}</span>
                <span class="function-params">({{ func.parameters.join(', ') }})</span>
              </div>
              <div v-if="func.description" class="function-description">
                {{ func.description }}
              </div>
              <div v-if="func.example" class="function-example">
                <strong>示例:</strong> {{ func.example }}
              </div>
            </div>
          </div>
        </div>

        <!-- 表达式示例 -->
        <div class="helper-section">
          <h5>常用示例</h5>
          <div class="examples-list">
            <div 
              v-for="example in expressionExamples" 
              :key="example.title"
              class="example-item"
              @click="insertExample(example)"
            >
              <div class="example-title">{{ example.title }}</div>
              <div class="example-code">{{ example.code }}</div>
              <div v-if="example.description" class="example-description">
                {{ example.description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

// 状态
const internalValue = ref(props.modelValue || '')
const expressionType = ref('groovy')
const showHelper = ref(false)
const validationState = ref({
  type: 'none',
  message: '',
  icon: ''
})

// 表达式类型
const expressionTypes = [
  { value: 'groovy', label: 'Groovy 表达式' },
  { value: 'juel', label: 'JUEL 表达式' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'condition', label: '条件表达式' },
  { value: 'custom', label: '自定义' }
]

// 配置
const config = computed(() => ({
  enableSyntaxHighlight: true,
  showVariables: true,
  showFunctions: true,
  expressionType: 'groovy',
  ...props.property.properties || {}
}))

const enableSyntaxHighlight = computed(() => config.value.enableSyntaxHighlight)

// 可用变量（从上下文获取）
const availableVariables = computed(() => [
  {
    name: 'execution',
    type: 'DelegateExecution',
    description: '当前执行实例'
  },
  {
    name: 'task',
    type: 'DelegateTask',
    description: '当前任务实例'
  },
  {
    name: 'processInstance',
    type: 'ProcessInstance',
    description: '流程实例'
  },
  {
    name: 'variables',
    type: 'Map<String, Object>',
    description: '流程变量集合'
  }
])

// 可用函数
const availableFunctions = computed(() => {
  const functions = [
    {
      name: 'isEmpty',
      parameters: ['value'],
      description: '检查值是否为空',
      example: 'isEmpty(${amount})'
    },
    {
      name: 'now',
      parameters: [],
      description: '获取当前时间',
      example: 'now()'
    },
    {
      name: 'dateAdd',
      parameters: ['date', 'amount', 'unit'],
      description: '日期加减运算',
      example: 'dateAdd(now(), 7, "day")'
    }
  ]

  if (expressionType.value === 'groovy') {
    functions.push(
      {
        name: 'execution.getVariable',
        parameters: ['name'],
        description: '获取流程变量',
        example: 'execution.getVariable("amount")'
      },
      {
        name: 'execution.setVariable',
        parameters: ['name', 'value'],
        description: '设置流程变量',
        example: 'execution.setVariable("result", true)'
      }
    )
  }

  return functions
})

// 表达式示例
const expressionExamples = computed(() => {
  const examples = []

  switch (expressionType.value) {
    case 'groovy':
      examples.push(
        {
          title: '条件判断',
          code: '${amount > 1000}',
          description: '检查金额是否大于1000'
        },
        {
          title: '字符串比较',
          code: '${status == "approved"}',
          description: '检查状态是否为已批准'
        },
        {
          title: '复杂条件',
          code: '${amount > 1000 && department == "finance"}',
          description: '金额大于1000且部门为财务'
        }
      )
      break
    case 'juel':
      examples.push(
        {
          title: 'JUEL表达式',
          code: '#{user.hasRole("manager")}',
          description: '检查用户是否有管理员角色'
        }
      )
      break
    case 'condition':
      examples.push(
        {
          title: '简单条件',
          code: 'amount > 1000',
          description: '金额大于1000'
        },
        {
          title: '逻辑运算',
          code: 'status == "pending" AND priority == "high"',
          description: '状态为待处理且优先级高'
        }
      )
      break
  }

  return examples
})

// 语法高亮
const highlightedExpression = computed(() => {
  if (!enableSyntaxHighlight.value || !internalValue.value) {
    return ''
  }

  return highlightSyntax(internalValue.value, expressionType.value)
})

// 监听
watch(() => props.modelValue, (newValue) => {
  if (newValue !== internalValue.value) {
    internalValue.value = newValue || ''
  }
})

watch(internalValue, (newValue) => {
  emit('update:modelValue', newValue)
  validateExpression()
})

// 方法
function getExpressionPrefix(): string {
  switch (expressionType.value) {
    case 'groovy':
      return '${'
    case 'juel':
      return '#{'
    case 'javascript':
      return 'js:'
    case 'python':
      return 'py:'
    default:
      return ''
  }
}

function getPlaceholder(): string {
  switch (expressionType.value) {
    case 'groovy':
      return '输入Groovy表达式，例如：${amount > 1000}'
    case 'juel':
      return '输入JUEL表达式，例如：#{user.hasRole("admin")}'
    case 'javascript':
      return '输入JavaScript代码'
    case 'python':
      return '输入Python代码'
    case 'condition':
      return '输入条件表达式，例如：amount > 1000'
    default:
      return '输入表达式...'
  }
}

function onExpressionTypeChange() {
  validateExpression()
}

function handleInput() {
  validateExpression()
}

function handleFocus() {
  // 可以在这里添加聚焦时的逻辑
}

function handleBlur() {
  validateExpression()
}

function validateExpression() {
  const expression = internalValue.value.trim()
  
  if (!expression) {
    validationState.value = {
      type: 'none',
      message: '',
      icon: ''
    }
    return
  }

  try {
    switch (expressionType.value) {
      case 'groovy':
        validateGroovyExpression(expression)
        break
      case 'juel':
        validateJuelExpression(expression)
        break
      case 'javascript':
        validateJavaScript(expression)
        break
      case 'condition':
        validateConditionExpression(expression)
        break
      default:
        validationState.value = {
          type: 'success',
          message: '表达式格式正确',
          icon: 'fas fa-check-circle'
        }
    }
  } catch (error) {
    validationState.value = {
      type: 'error',
      message: error instanceof Error ? error.message : '表达式格式错误',
      icon: 'fas fa-exclamation-triangle'
    }
  }
}

function validateGroovyExpression(expression: string) {
  // 简单的Groovy表达式验证
  if (expression.startsWith('${') && expression.endsWith('}')) {
    validationState.value = {
      type: 'success',
      message: 'Groovy表达式格式正确',
      icon: 'fas fa-check-circle'
    }
  } else {
    throw new Error('Groovy表达式应该以${开头，以}结尾')
  }
}

function validateJuelExpression(expression: string) {
  // 简单的JUEL表达式验证
  if (expression.startsWith('#{') && expression.endsWith('}')) {
    validationState.value = {
      type: 'success',
      message: 'JUEL表达式格式正确',
      icon: 'fas fa-check-circle'
    }
  } else {
    throw new Error('JUEL表达式应该以#{开头，以}结尾')
  }
}

function validateJavaScript(code: string) {
  try {
    new Function(code)
    validationState.value = {
      type: 'success',
      message: 'JavaScript语法正确',
      icon: 'fas fa-check-circle'
    }
  } catch (error) {
    throw new Error('JavaScript语法错误')
  }
}

function validateConditionExpression(expression: string) {
  // 简单的条件表达式验证
  const validOperators = ['>', '<', '>=', '<=', '==', '!=', 'AND', 'OR', 'NOT']
  const hasValidOperator = validOperators.some(op => expression.includes(op))
  
  if (hasValidOperator) {
    validationState.value = {
      type: 'success',
      message: '条件表达式格式正确',
      icon: 'fas fa-check-circle'
    }
  } else {
    validationState.value = {
      type: 'warning',
      message: '表达式可能需要比较运算符',
      icon: 'fas fa-exclamation-triangle'
    }
  }
}

function highlightSyntax(text: string, type: string): string {
  let highlighted = text

  // 简单的语法高亮实现
  switch (type) {
    case 'groovy':
    case 'juel':
      highlighted = highlighted
        .replace(/\$\{([^}]+)\}/g, '<span class="expression-wrapper">${<span class="expression-content">$1</span>}</span>')
        .replace(/#\{([^}]+)\}/g, '<span class="expression-wrapper">#{<span class="expression-content">$1</span>}</span>')
      break
    case 'javascript':
      highlighted = highlighted
        .replace(/\b(function|var|let|const|if|else|for|while|return)\b/g, '<span class="keyword">$1</span>')
        .replace(/\b(\d+)\b/g, '<span class="number">$1</span>')
        .replace(/(["'])([^"']*)\1/g, '<span class="string">$1$2$1</span>')
      break
  }

  return highlighted
}

function insertVariable(variable: any) {
  const insertion = `\${${variable.name}}`
  insertAtCursor(insertion)
}

function insertFunction(func: any) {
  const params = func.parameters.map(() => '').join(', ')
  const insertion = `${func.name}(${params})`
  insertAtCursor(insertion)
}

function insertExample(example: any) {
  internalValue.value = example.code
}

function insertAtCursor(text: string) {
  const textarea = document.querySelector('.expression-textarea') as HTMLTextAreaElement
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const value = internalValue.value

  internalValue.value = value.substring(0, start) + text + value.substring(end)
  
  // 重新设置光标位置
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + text.length, start + text.length)
  }, 0)
}
</script>

<style lang="scss" scoped>
.expression-editor-field {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  border-radius: 6px 6px 0 0;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    select {
      font-size: 11px;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
    }
    
    .expression-prefix {
      font-family: monospace;
      font-size: 12px;
      color: #6366f1;
      font-weight: 600;
    }
  }
  
  .header-right {
    display: flex;
    gap: 4px;
    
    button {
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
      
      &:hover {
        background: #e5e7eb;
      }
      
      &.active {
        background: #3b82f6;
        color: white;
      }
    }
  }
}

.expression-input {
  position: relative;
  
  .expression-textarea {
    width: 100%;
    padding: 12px;
    border: none;
    outline: none;
    resize: vertical;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    min-height: 80px;
    
    &::placeholder {
      color: #9ca3af;
    }
  }
  
  .syntax-highlight {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.5;
    padding: 12px;
    color: transparent;
    
    :deep(.expression-wrapper) {
      background: #eff6ff;
      border-radius: 2px;
      
      .expression-content {
        color: #1d4ed8;
      }
    }
    
    :deep(.keyword) {
      color: #7c3aed;
      font-weight: 600;
    }
    
    :deep(.string) {
      color: #059669;
    }
    
    :deep(.number) {
      color: #dc2626;
    }
  }
}

.validation-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 11px;
  border-top: 1px solid #e9ecef;
  
  &.success {
    background: #f0fdf4;
    color: #166534;
    border-color: #bbf7d0;
  }
  
  &.warning {
    background: #fffbeb;
    color: #92400e;
    border-color: #fde68a;
  }
  
  &.error {
    background: #fef2f2;
    color: #991b1b;
    border-color: #fecaca;
  }
}

.helper-panel {
  border-top: 1px solid #e9ecef;
  background: #f8f9fa;
  
  .helper-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    
    h4 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }
    
    .close-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      border-radius: 3px;
      
      &:hover {
        background: #e5e7eb;
      }
    }
  }
  
  .helper-content {
    max-height: 300px;
    overflow-y: auto;
    padding: 12px;
  }
  
  .helper-section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h5 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
    }
  }
}

.variable-list,
.function-list,
.examples-list {
  .variable-item,
  .function-item,
  .example-item {
    padding: 8px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    margin-bottom: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #3b82f6;
      background: #f0f9ff;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.variable-item {
  .variable-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    
    .variable-name {
      font-family: monospace;
      font-size: 11px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .variable-type {
      font-size: 10px;
      color: #6b7280;
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 2px;
    }
  }
  
  .variable-description {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.4;
  }
}

.function-item {
  .function-signature {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    
    .function-name {
      font-family: monospace;
      font-size: 11px;
      font-weight: 600;
      color: #7c3aed;
    }
    
    .function-params {
      font-family: monospace;
      font-size: 10px;
      color: #6b7280;
    }
  }
  
  .function-description {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.4;
    margin-bottom: 4px;
  }
  
  .function-example {
    font-size: 10px;
    color: #059669;
    font-family: monospace;
    background: #f0fdf4;
    padding: 4px 6px;
    border-radius: 2px;
  }
}

.example-item {
  .example-title {
    font-size: 11px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 4px;
  }
  
  .example-code {
    font-family: monospace;
    font-size: 11px;
    color: #1d4ed8;
    background: #eff6ff;
    padding: 4px 6px;
    border-radius: 2px;
    margin-bottom: 4px;
  }
  
  .example-description {
    font-size: 10px;
    color: #6b7280;
    line-height: 1.4;
  }
}
</style>