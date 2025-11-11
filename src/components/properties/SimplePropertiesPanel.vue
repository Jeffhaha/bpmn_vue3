<template>
  <div class="properties-panel" :class="{ collapsed: isCollapsed }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <h3>{{ panelTitle }}</h3>
        <span v-if="selectedElement" class="element-type">{{ elementTypeDisplay }}</span>
      </div>
      <div class="header-actions">
        <button 
          class="collapse-btn" 
          @click="toggleCollapse"
          :title="isCollapsed ? '展开属性面板' : '收起属性面板'"
        >
          <i :class="isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
        </button>
      </div>
    </div>
    
    <!-- 面板内容 -->
    <div v-if="!isCollapsed" class="panel-content">
      <!-- 无选中元素时的提示 -->
      <div v-if="!selectedElement" class="no-selection">
        <div class="no-selection-icon">
          <i class="fas fa-mouse-pointer"></i>
        </div>
        <p>点击画布上的元素查看属性</p>
      </div>
      
      <!-- 属性内容 -->
      <div v-else class="property-sections">
        <!-- 基本信息 -->
        <div class="property-section">
          <div class="section-header">
            <i class="fas fa-info-circle"></i>
            <span>基本信息</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>ID</label>
              <input 
                v-model="properties.id" 
                type="text" 
                readonly 
                class="readonly-input"
              />
            </div>
            
            <div class="property-item">
              <label>名称</label>
              <input 
                v-model="properties.name" 
                type="text" 
                placeholder="输入名称..."
                @input="handlePropertyChange('name', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>类型</label>
              <input 
                v-model="properties.type" 
                type="text" 
                readonly 
                class="readonly-input"
              />
            </div>
            
            <div class="property-item">
              <label>文档</label>
              <textarea 
                v-model="properties.documentation" 
                placeholder="输入描述信息..."
                rows="3"
                @input="handlePropertyChange('documentation', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- 任务特定属性 -->
        <div v-if="isTaskElement" class="property-section">
          <div class="section-header">
            <i class="fas fa-tasks"></i>
            <span>任务属性</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>指派人</label>
              <input 
                v-model="properties.assignee" 
                type="text" 
                placeholder="输入指派人..."
                @input="handlePropertyChange('assignee', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>候选用户</label>
              <input 
                v-model="properties.candidateUsers" 
                type="text" 
                placeholder="用户1,用户2..."
                @input="handlePropertyChange('candidateUsers', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>候选组</label>
              <input 
                v-model="properties.candidateGroups" 
                type="text" 
                placeholder="组1,组2..."
                @input="handlePropertyChange('candidateGroups', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>截止日期</label>
              <input 
                v-model="properties.dueDate" 
                type="datetime-local"
                @input="handlePropertyChange('dueDate', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>优先级</label>
              <select 
                v-model="properties.priority" 
                @change="handlePropertyChange('priority', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">选择优先级</option>
                <option value="1">低</option>
                <option value="2">普通</option>
                <option value="3">高</option>
                <option value="4">紧急</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- 网关特定属性 -->
        <div v-if="isGatewayElement" class="property-section">
          <div class="section-header">
            <i class="fas fa-code-branch"></i>
            <span>网关属性</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>默认流向</label>
              <select 
                v-model="properties.defaultFlow" 
                @change="handlePropertyChange('defaultFlow', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">选择默认流向</option>
                <option v-for="flow in availableFlows" :key="flow.id" :value="flow.id">
                  {{ flow.name || flow.id }}
                </option>
              </select>
            </div>
            
            <div class="property-item">
              <label>网关方向</label>
              <select 
                v-model="properties.gatewayDirection" 
                @change="handlePropertyChange('gatewayDirection', ($event.target as HTMLSelectElement).value)"
              >
                <option value="Unspecified">未指定</option>
                <option value="Converging">汇聚</option>
                <option value="Diverging">分叉</option>
                <option value="Mixed">混合</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- 事件特定属性 -->
        <div v-if="isEventElement" class="property-section">
          <div class="section-header">
            <i class="fas fa-bolt"></i>
            <span>事件属性</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>事件类型</label>
              <select 
                v-model="properties.eventType" 
                @change="handlePropertyChange('eventType', ($event.target as HTMLSelectElement).value)"
              >
                <option value="">无</option>
                <option value="message">消息</option>
                <option value="timer">计时器</option>
                <option value="error">错误</option>
                <option value="signal">信号</option>
                <option value="escalation">升级</option>
              </select>
            </div>
            
            <div v-if="properties.eventType === 'message'" class="property-item">
              <label>消息名称</label>
              <input 
                v-model="properties.messageName" 
                type="text" 
                placeholder="输入消息名称..."
                @input="handlePropertyChange('messageName', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div v-if="properties.eventType === 'timer'" class="property-item">
              <label>时间表达式</label>
              <input 
                v-model="properties.timerExpression" 
                type="text" 
                placeholder="PT5M 或 0 0 12 * * ?"
                @input="handlePropertyChange('timerExpression', ($event.target as HTMLInputElement).value)"
              />
            </div>
          </div>
        </div>
        
        <!-- 条件配置 -->
        <div v-if="isSequenceFlow" class="property-section">
          <div class="section-header">
            <i class="fas fa-route"></i>
            <span>流程配置</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>条件表达式</label>
              <textarea 
                v-model="properties.conditionExpression" 
                placeholder="如：${amount > 1000}"
                rows="2"
                @input="handlePropertyChange('conditionExpression', ($event.target as HTMLTextAreaElement).value)"
              ></textarea>
            </div>
          </div>
        </div>
        
        <!-- 表单配置 -->
        <div v-if="isUserTask" class="property-section">
          <div class="section-header">
            <i class="fas fa-wpforms"></i>
            <span>表单配置</span>
          </div>
          
          <div class="property-group">
            <div class="property-item">
              <label>表单键</label>
              <input 
                v-model="properties.formKey" 
                type="text" 
                placeholder="输入表单键..."
                @input="handlePropertyChange('formKey', ($event.target as HTMLInputElement).value)"
              />
            </div>
            
            <div class="property-item">
              <label>表单字段</label>
              <div class="form-fields">
                <div 
                  v-for="(field, index) in properties.formFields" 
                  :key="index" 
                  class="form-field-item"
                >
                  <input 
                    v-model="field.id" 
                    placeholder="字段ID" 
                    type="text"
                    @input="updateFormFields"
                  />
                  <input 
                    v-model="field.label" 
                    placeholder="字段标签" 
                    type="text"
                    @input="updateFormFields"
                  />
                  <select v-model="field.type" @change="updateFormFields">
                    <option value="string">文本</option>
                    <option value="long">数字</option>
                    <option value="boolean">布尔</option>
                    <option value="date">日期</option>
                  </select>
                  <button class="remove-field-btn" @click="removeFormField(index)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <button class="add-field-btn" @click="addFormField">
                  <i class="fas fa-plus"></i>
                  添加字段
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 高级属性 -->
        <div class="property-section">
          <div class="section-header" @click="toggleAdvanced">
            <i class="fas fa-cog"></i>
            <span>高级属性</span>
            <i :class="showAdvanced ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
          </div>
          
          <div v-if="showAdvanced" class="property-group">
            <div class="property-item">
              <label>执行监听器</label>
              <button class="config-btn" @click="openListenerConfig">
                <i class="fas fa-headphones"></i>
                配置监听器
              </button>
            </div>
            
            <div class="property-item">
              <label>扩展属性</label>
              <button class="config-btn" @click="openExtensionConfig">
                <i class="fas fa-puzzle-piece"></i>
                扩展属性
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BpmnElement } from '@/types'

// Props
interface Props {
  selectedElement?: BpmnElement | null
  modeler?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'property-changed': [property: string, value: any, element: BpmnElement]
  'element-updated': [element: BpmnElement]
}>()

// 状态
const isCollapsed = ref(false)
const showAdvanced = ref(false)
const properties = ref({
  id: '',
  name: '',
  type: '',
  documentation: '',
  // 任务属性
  assignee: '',
  candidateUsers: '',
  candidateGroups: '',
  dueDate: '',
  priority: '',
  formKey: '',
  formFields: [] as Array<{id: string, label: string, type: string, required?: boolean}>,
  // 网关属性
  defaultFlow: '',
  gatewayDirection: 'Unspecified',
  // 事件属性
  eventType: '',
  messageName: '',
  timerExpression: '',
  // 流程属性
  conditionExpression: ''
})

// 计算属性
const panelTitle = computed(() => 
  props.selectedElement ? '属性面板' : '属性面板'
)

const elementTypeDisplay = computed(() => {
  if (!props.selectedElement) return ''
  
  const typeMap: Record<string, string> = {
    'bpmn:StartEvent': '开始事件',
    'bpmn:EndEvent': '结束事件',
    'bpmn:IntermediateCatchEvent': '中间捕获事件',
    'bpmn:IntermediateThrowEvent': '中间抛出事件',
    'bpmn:UserTask': '用户任务',
    'bpmn:ServiceTask': '服务任务',
    'bpmn:ScriptTask': '脚本任务',
    'bpmn:BusinessRuleTask': '业务规则任务',
    'bpmn:SendTask': '发送任务',
    'bpmn:ReceiveTask': '接收任务',
    'bpmn:ManualTask': '手动任务',
    'bpmn:ExclusiveGateway': '排他网关',
    'bpmn:InclusiveGateway': '包容网关',
    'bpmn:ParallelGateway': '并行网关',
    'bpmn:EventBasedGateway': '事件网关',
    'bpmn:SequenceFlow': '顺序流',
    'bpmn:Process': '流程'
  }
  
  return typeMap[props.selectedElement.type] || props.selectedElement.type
})

const isTaskElement = computed(() => {
  if (!props.selectedElement) return false
  return props.selectedElement.type.includes('Task')
})

const isGatewayElement = computed(() => {
  if (!props.selectedElement) return false
  return props.selectedElement.type.includes('Gateway')
})

const isEventElement = computed(() => {
  if (!props.selectedElement) return false
  return props.selectedElement.type.includes('Event')
})

const isUserTask = computed(() => {
  return props.selectedElement?.type === 'bpmn:UserTask'
})

const isSequenceFlow = computed(() => {
  return props.selectedElement?.type === 'bpmn:SequenceFlow'
})

const availableFlows = computed(() => {
  // 这里应该从建模器中获取可用的流向
  return [] as Array<{id: string; name?: string}>
})

// 监听选中元素变化
watch(() => props.selectedElement, (newElement) => {
  console.log('=== 属性面板收到元素变更 ===')
  console.log('新元素:', newElement)
  if (newElement) {
    console.log('元素ID:', newElement.id)
    console.log('元素类型:', newElement.type)
    console.log('业务对象:', newElement.businessObject)
    loadElementProperties(newElement)
    console.log('属性加载完成，当前properties:', properties.value)
  } else {
    console.log('重置属性')
    resetProperties()
  }
  console.log('============================')
}, { immediate: true })

// 方法
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleAdvanced() {
  showAdvanced.value = !showAdvanced.value
}

function loadElementProperties(element: BpmnElement) {
  const businessObject = element.businessObject || {}
  
  // 基本属性
  properties.value.id = element.id || businessObject.id || ''
  properties.value.name = businessObject.name || ''
  properties.value.type = element.type || ''
  properties.value.documentation = businessObject.documentation || ''
  
  // 任务属性
  if (isTaskElement.value) {
    properties.value.assignee = businessObject.assignee || ''
    properties.value.candidateUsers = businessObject.candidateUsers || ''
    properties.value.candidateGroups = businessObject.candidateGroups || ''
    properties.value.dueDate = businessObject.dueDate || ''
    properties.value.priority = businessObject.priority || ''
    properties.value.formKey = businessObject.formKey || ''
    properties.value.formFields = businessObject.formFields || []
  }
  
  // 网关属性
  if (isGatewayElement.value) {
    properties.value.defaultFlow = businessObject.default?.id || ''
    properties.value.gatewayDirection = businessObject.gatewayDirection || 'Unspecified'
  }
  
  // 事件属性
  if (isEventElement.value && businessObject.eventDefinitions) {
    const eventDef = businessObject.eventDefinitions[0]
    if (eventDef) {
      properties.value.eventType = eventDef.$type.replace('bpmn:', '').replace('EventDefinition', '').toLowerCase()
      properties.value.messageName = eventDef.messageRef?.name || ''
      properties.value.timerExpression = eventDef.timeDuration?.body || eventDef.timeCycle?.body || ''
    }
  } else {
    properties.value.eventType = ''
    properties.value.messageName = ''
    properties.value.timerExpression = ''
  }
  
  // 流程属性
  if (isSequenceFlow.value) {
    properties.value.conditionExpression = businessObject.conditionExpression?.body || ''
  } else {
    properties.value.conditionExpression = ''
  }
}

function resetProperties() {
  properties.value = {
    id: '',
    name: '',
    type: '',
    documentation: '',
    assignee: '',
    candidateUsers: '',
    candidateGroups: '',
    dueDate: '',
    priority: '',
    formKey: '',
    formFields: [],
    defaultFlow: '',
    gatewayDirection: 'Unspecified',
    eventType: '',
    messageName: '',
    timerExpression: '',
    conditionExpression: ''
  }
}

function handlePropertyChange(property: string, value: any) {
  if (!props.selectedElement) return
  
  emit('property-changed', property, value, props.selectedElement)
  
  // 更新业务对象
  if (props.modeler) {
    updateBusinessObject(property, value)
  }
}

function updateBusinessObject(property: string, value: any) {
  if (!props.selectedElement || !props.modeler) return
  
  try {
    const modeling = props.modeler.get('modeling')
    const element = props.selectedElement
    
    const updates: Record<string, any> = {}
    updates[property] = value
    
    modeling.updateProperties(element, updates)
    emit('element-updated', element)
    
    console.log(`属性 ${property} 已更新为:`, value)
  } catch (error) {
    console.error('更新属性失败:', error)
  }
}

function addFormField() {
  properties.value.formFields.push({
    id: '',
    label: '',
    type: 'string',
    required: false
  })
  updateFormFields()
}

function removeFormField(index: number) {
  properties.value.formFields.splice(index, 1)
  updateFormFields()
}

function updateFormFields() {
  handlePropertyChange('formFields', properties.value.formFields)
}

function openListenerConfig() {
  // 打开监听器配置对话框
  console.log('打开监听器配置')
}

function openExtensionConfig() {
  // 打开扩展属性配置对话框
  console.log('打开扩展属性配置')
}
</script>

<style lang="scss" scoped>
.properties-panel {
  width: 300px;
  height: 100%;
  background: #fff;
  border-left: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 40px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  min-height: 50px;
  
  .header-left {
    flex: 1;
    min-width: 0;
    
    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .element-type {
      font-size: 12px;
      color: #909399;
      display: block;
      margin-top: 2px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 8px;
    
    .collapse-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #606266;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #e6f3ff;
        color: #409eff;
      }
      
      i {
        font-size: 12px;
      }
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  text-align: center;
  
  .no-selection-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

.property-sections {
  display: flex;
  flex-direction: column;
}

.property-section {
  border-bottom: 1px solid #f0f0f0;
  
  .section-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #fafafa;
    cursor: pointer;
    user-select: none;
    
    i {
      margin-right: 8px;
      color: #409eff;
      font-size: 14px;
    }
    
    span {
      flex: 1;
      font-weight: 500;
      font-size: 13px;
      color: #303133;
    }
    
    .toggle-icon {
      margin-left: 8px;
      margin-right: 0;
      color: #909399;
      font-size: 12px;
    }
    
    &:hover {
      background: #f5f5f5;
    }
  }
}

.property-group {
  padding: 16px;
}

.property-item {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  label {
    display: block;
    margin-bottom: 6px;
    font-size: 12px;
    font-weight: 500;
    color: #606266;
  }
  
  input, textarea, select {
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
    
    &.readonly-input {
      background: #f5f7fa;
      color: #909399;
      cursor: not-allowed;
    }
    
    &::placeholder {
      color: #c0c4cc;
    }
  }
  
  textarea {
    resize: vertical;
    min-height: 60px;
    line-height: 1.4;
  }
}

.form-fields {
  .form-field-item {
    display: grid;
    grid-template-columns: 1fr 1fr 80px 24px;
    gap: 4px;
    margin-bottom: 8px;
    align-items: center;
    
    input, select {
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
  
  .add-field-btn {
    width: 100%;
    padding: 6px;
    border: 1px dashed #dcdfe6;
    background: transparent;
    color: #606266;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
    }
  }
}

.config-btn {
  width: 100%;
  padding: 8px;
  border: 1px solid #dcdfe6;
  background: #f8f9fa;
  color: #606266;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    border-color: #409eff;
    color: #409eff;
    background: #ecf5ff;
  }
  
  i {
    font-size: 12px;
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>