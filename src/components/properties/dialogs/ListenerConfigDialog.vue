<template>
  <div class="dialog-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="listener-config-dialog" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3>执行监听器配置</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 对话框内容 -->
      <div class="dialog-content">
        <div class="listeners-list">
          <div class="list-header">
            <span>监听器列表</span>
            <button class="add-btn" @click="addListener">
              <i class="fas fa-plus"></i>
              添加监听器
            </button>
          </div>
          
          <div v-if="listeners.length === 0" class="empty-state">
            <i class="fas fa-headphones"></i>
            <p>暂无监听器</p>
          </div>
          
          <div v-else class="listeners-container">
            <div 
              v-for="(listener, index) in listeners" 
              :key="listener.id"
              class="listener-item"
              :class="{ active: selectedIndex === index }"
              @click="selectListener(index)"
            >
              <div class="listener-info">
                <div class="listener-title">
                  {{ getListenerTitle(listener) }}
                </div>
                <div class="listener-details">
                  {{ listener.event }} - {{ listener.type }}
                </div>
              </div>
              <button class="delete-btn" @click.stop="removeListener(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 监听器编辑表单 -->
        <div v-if="selectedIndex >= 0 && currentListener" class="listener-form">
          <h4>监听器配置</h4>
          
          <div class="form-group">
            <label>事件类型</label>
            <select v-model="currentListener.event">
              <option value="start">开始</option>
              <option value="end">结束</option>
              <option value="take">流转</option>
              <option value="create">创建</option>
              <option value="assignment">分配</option>
              <option value="complete">完成</option>
              <option value="delete">删除</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>监听器类型</label>
            <select v-model="currentListener.type">
              <option value="class">Java类</option>
              <option value="expression">表达式</option>
              <option value="delegateExpression">委托表达式</option>
              <option value="script">脚本</option>
            </select>
          </div>
          
          <div class="form-group" v-if="currentListener.type === 'class'">
            <label>Java类名</label>
            <input 
              v-model="currentListener.class" 
              type="text" 
              placeholder="com.example.MyListener"
            />
          </div>
          
          <div class="form-group" v-if="currentListener.type === 'expression'">
            <label>表达式</label>
            <input 
              v-model="currentListener.expression" 
              type="text" 
              placeholder="${myBean.method()}"
            />
          </div>
          
          <div class="form-group" v-if="currentListener.type === 'delegateExpression'">
            <label>委托表达式</label>
            <input 
              v-model="currentListener.delegateExpression" 
              type="text" 
              placeholder="${myDelegate}"
            />
          </div>
          
          <div class="form-group" v-if="currentListener.type === 'script'">
            <label>脚本格式</label>
            <select v-model="currentListener.scriptFormat">
              <option value="javascript">JavaScript</option>
              <option value="groovy">Groovy</option>
              <option value="python">Python</option>
            </select>
          </div>
          
          <div class="form-group" v-if="currentListener.type === 'script'">
            <label>脚本内容</label>
            <textarea 
              v-model="currentListener.scriptValue" 
              rows="4"
              placeholder="输入脚本代码..."
            ></textarea>
          </div>
          
          <!-- 字段注入配置 -->
          <div class="form-group">
            <label class="section-title">
              字段注入
              <button 
                class="add-field-btn" 
                type="button"
                @click="addField"
              >
                <i class="fas fa-plus"></i>
                添加字段
              </button>
            </label>
            
            <div v-if="currentListener.fields.length === 0" class="empty-fields">
              暂无字段注入
            </div>
            
            <div v-else class="fields-list">
              <div 
                v-for="(field, fieldIndex) in currentListener.fields"
                :key="fieldIndex"
                class="field-item"
              >
                <input 
                  v-model="field.name" 
                  placeholder="字段名"
                  class="field-name"
                />
                <select v-model="field.type" class="field-type">
                  <option value="string">字符串</option>
                  <option value="expression">表达式</option>
                </select>
                <input 
                  v-model="field.value" 
                  :placeholder="field.type === 'expression' ? '${expression}' : '字段值'"
                  class="field-value"
                />
                <button 
                  class="remove-field-btn" 
                  @click="removeField(fieldIndex)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button class="btn-secondary" @click="$emit('close')">
          取消
        </button>
        <button class="btn-primary" @click="saveListeners">
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { BpmnElement } from '@/types'

interface ExecutionListener {
  id: string
  event: string
  type: 'class' | 'expression' | 'delegateExpression' | 'script'
  class?: string
  expression?: string
  delegateExpression?: string
  scriptFormat?: string
  scriptValue?: string
  fields: Array<{
    name: string
    type: 'string' | 'expression'
    value: string
  }>
}

// Props
interface Props {
  visible: boolean
  element?: BpmnElement | null
  modeler?: any
}

const props = withDefaults(defineProps<Props>(), {
  visible: false
})

// Emits
const emit = defineEmits<{
  'close': []
  'save': [listeners: ExecutionListener[]]
}>()

// 状态
const listeners = ref<ExecutionListener[]>([])
const selectedIndex = ref(-1)

const currentListener = computed(() => {
  return selectedIndex.value >= 0 ? listeners.value[selectedIndex.value] : null
})

// 监听元素变化，加载现有的监听器
watch(() => props.element, (newElement) => {
  if (newElement) {
    loadListeners(newElement)
  }
}, { immediate: true })

function loadListeners(element: BpmnElement) {
  listeners.value = []
  selectedIndex.value = -1
  
  if (!element.businessObject) return
  
  const extensionElements = element.businessObject.extensionElements
  if (!extensionElements) return
  
  // 查找执行监听器
  const listenerElements = extensionElements.values.filter((ext: any) => 
    ext.$type === 'camunda:ExecutionListener'
  )
  
  for (const listenerEl of listenerElements) {
    const listener: ExecutionListener = {
      id: generateId(),
      event: listenerEl.event || 'start',
      type: getListenerType(listenerEl),
      class: listenerEl.class,
      expression: listenerEl.expression,
      delegateExpression: listenerEl.delegateExpression,
      scriptFormat: listenerEl.script?.scriptFormat,
      scriptValue: listenerEl.script?.value,
      fields: []
    }
    
    // 加载字段注入
    if (listenerEl.fields) {
      for (const field of listenerEl.fields) {
        listener.fields.push({
          name: field.name,
          type: field.stringValue ? 'string' : 'expression',
          value: field.stringValue || field.expression
        })
      }
    }
    
    listeners.value.push(listener)
  }
}

function getListenerType(listenerEl: any): ExecutionListener['type'] {
  if (listenerEl.class) return 'class'
  if (listenerEl.expression) return 'expression'  
  if (listenerEl.delegateExpression) return 'delegateExpression'
  if (listenerEl.script) return 'script'
  return 'class'
}

function generateId(): string {
  return 'listener_' + Math.random().toString(36).substr(2, 9)
}

function getListenerTitle(listener: ExecutionListener): string {
  switch (listener.type) {
    case 'class':
      return listener.class || '未命名Java类'
    case 'expression':
      return listener.expression || '未命名表达式'
    case 'delegateExpression':
      return listener.delegateExpression || '未命名委托'
    case 'script':
      return `${listener.scriptFormat || 'Script'} 脚本`
    default:
      return '未命名监听器'
  }
}

function addListener() {
  const newListener: ExecutionListener = {
    id: generateId(),
    event: 'start',
    type: 'class',
    fields: []
  }
  
  listeners.value.push(newListener)
  selectedIndex.value = listeners.value.length - 1
}

function removeListener(index: number) {
  if (confirm('确定删除此监听器吗？')) {
    listeners.value.splice(index, 1)
    
    if (selectedIndex.value >= listeners.value.length) {
      selectedIndex.value = listeners.value.length - 1
    }
  }
}

function selectListener(index: number) {
  selectedIndex.value = index
}

function addField() {
  if (!currentListener.value) return
  
  currentListener.value.fields.push({
    name: '',
    type: 'string',
    value: ''
  })
}

function removeField(fieldIndex: number) {
  if (!currentListener.value) return
  currentListener.value.fields.splice(fieldIndex, 1)
}

function saveListeners() {
  // 验证监听器配置
  for (const listener of listeners.value) {
    if (!listener.event) {
      alert('请选择事件类型')
      return
    }
    
    switch (listener.type) {
      case 'class':
        if (!listener.class) {
          alert('请输入Java类名')
          return
        }
        break
      case 'expression':
        if (!listener.expression) {
          alert('请输入表达式')
          return
        }
        break
      case 'delegateExpression':
        if (!listener.delegateExpression) {
          alert('请输入委托表达式')
          return
        }
        break
      case 'script':
        if (!listener.scriptFormat || !listener.scriptValue) {
          alert('请配置脚本格式和内容')
          return
        }
        break
    }
  }
  
  emit('save', listeners.value)
  emit('close')
}

function handleOverlayClick() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.listener-config-dialog {
  width: 800px;
  max-height: 90vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  background: #f8f9fa;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  .close-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    color: #666;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #e9ecef;
      color: #333;
    }
  }
}

.dialog-content {
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.listeners-list {
  width: 300px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  
  .list-header {
    padding: 12px 16px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    
    span {
      font-weight: 500;
      font-size: 13px;
      color: #333;
    }
    
    .add-btn {
      padding: 4px 8px;
      border: 1px solid #ddd;
      background: white;
      color: #666;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &:hover {
        border-color: #409eff;
        color: #409eff;
      }
    }
  }
  
  .listeners-container {
    flex: 1;
    overflow-y: auto;
  }
  
  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #999;
    
    i {
      font-size: 32px;
      margin-bottom: 8px;
      opacity: 0.5;
    }
    
    p {
      margin: 0;
      font-size: 13px;
    }
  }
}

.listener-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    background: #f8f9fa;
  }
  
  &.active {
    background: #e6f3ff;
    border-right: 3px solid #409eff;
  }
  
  .listener-info {
    flex: 1;
    min-width: 0;
    
    .listener-title {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .listener-details {
      font-size: 11px;
      color: #666;
    }
  }
  
  .delete-btn {
    width: 20px;
    height: 20px;
    border: none;
    background: none;
    color: #999;
    cursor: pointer;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #f56c6c;
      color: white;
    }
  }
}

.listener-form {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #606266;
      
      &.section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        font-weight: 600;
        color: #333;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 6px;
        margin-bottom: 12px;
      }
    }
    
    input, select, textarea {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-size: 12px;
      background: #fff;
      box-sizing: border-box;
      
      &:focus {
        outline: none;
        border-color: #409eff;
      }
      
      &::placeholder {
        color: #c0c4cc;
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
      font-family: 'Courier New', monospace;
    }
  }
  
  .add-field-btn {
    padding: 4px 8px;
    border: 1px solid #ddd;
    background: white;
    color: #666;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }
  
  .empty-fields {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 12px;
    border: 1px dashed #ddd;
    border-radius: 4px;
  }
  
  .fields-list {
    .field-item {
      display: grid;
      grid-template-columns: 1fr 100px 1fr 24px;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      
      .field-name, .field-type, .field-value {
        margin-bottom: 0;
      }
      
      .remove-field-btn {
        width: 20px;
        height: 20px;
        border: none;
        background: #f56c6c;
        color: white;
        border-radius: 3px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover {
          background: #f78989;
        }
        
        i {
          font-size: 10px;
        }
      }
    }
  }
}

.dialog-footer {
  padding: 12px 20px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  
  .btn-secondary, .btn-primary {
    padding: 6px 16px;
    border: 1px solid;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
  }
  
  .btn-secondary {
    background: white;
    border-color: #ddd;
    color: #666;
    
    &:hover {
      border-color: #bbb;
      color: #333;
    }
  }
  
  .btn-primary {
    background: #409eff;
    border-color: #409eff;
    color: white;
    
    &:hover {
      background: #337ecc;
      border-color: #337ecc;
    }
  }
}
</style>