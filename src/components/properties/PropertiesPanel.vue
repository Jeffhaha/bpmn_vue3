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
          v-if="hasValidationErrors"
          class="validation-btn error" 
          @click="showValidationDetails = !showValidationDetails"
          :title="'有 ' + validationResult.errors.length + ' 个验证错误'"
        >
          <i class="fas fa-exclamation-triangle"></i>
          {{ validationResult.errors.length }}
        </button>
        <button 
          class="collapse-btn" 
          @click="toggleCollapse"
          :title="isCollapsed ? '展开属性面板' : '收起属性面板'"
        >
          <i :class="isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right'"></i>
        </button>
      </div>
    </div>
    
    <!-- 验证错误详情 -->
    <div v-if="showValidationDetails && hasValidationErrors && !isCollapsed" class="validation-details">
      <div class="validation-header">
        <i class="fas fa-exclamation-triangle"></i>
        <span>验证错误</span>
        <button @click="showValidationDetails = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="validation-content">
        <div 
          v-for="error in validationResult.errors" 
          :key="error.property"
          class="validation-error"
        >
          <strong>{{ error.property }}:</strong> {{ error.message }}
        </div>
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
      
      <!-- 动态表单 -->
      <DynamicForm
        v-else
        :element-type="selectedElement.type"
        :context="propertyContext"
        :model-value="properties"
        :readonly="readonly"
        @update:model-value="handlePropertiesUpdate"
        @field-change="handleFieldChange"
        @validation="handleValidation"
        @open-listener-config="openListenerConfig"
        @open-extension-config="openExtensionConfig"
        ref="dynamicForm"
      />
      
      <!-- 高级属性按钮 -->
      <div v-if="selectedElement && !readonly" class="advanced-actions">
        <button class="action-btn" @click="openListenerConfig">
          <i class="fas fa-headphones"></i>
          配置监听器
        </button>
        <button class="action-btn" @click="openExtensionConfig">
          <i class="fas fa-puzzle-piece"></i>
          扩展属性
        </button>
      </div>
    </div>
  </div>
  
  <!-- 监听器配置对话框 -->
  <ListenerConfigDialog
    :visible="showListenerDialog"
    :element="selectedElement"
    :modeler="modeler"
    @close="showListenerDialog = false"
    @save="handleListenerSave"
  />
  
  <!-- 扩展属性配置对话框 -->
  <ExtensionConfigDialog
    :visible="showExtensionDialog"
    :element="selectedElement"
    :modeler="modeler"
    @close="showExtensionDialog = false"
    @save="handleExtensionSave"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import DynamicForm from './DynamicForm.vue'
import ListenerConfigDialog from './dialogs/ListenerConfigDialog.vue'
import ExtensionConfigDialog from './dialogs/ExtensionConfigDialog.vue'
import type { BpmnElement, PropertyValue, ValidationResult, PropertyContext } from '@/types'

// Props
interface Props {
  selectedElement?: BpmnElement | null
  modeler?: any
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

// Emits
const emit = defineEmits<{
  'property-changed': [property: string, value: any, element: BpmnElement]
  'element-updated': [element: BpmnElement]
  'validation-error': [errors: any[]]
}>()

// 状态
const isCollapsed = ref(false)
const showValidationDetails = ref(false)
const properties = ref<Record<string, PropertyValue>>({})
const validationResult = ref<ValidationResult>({
  isValid: true,
  errors: [],
  warnings: []
})
const dynamicForm = ref<InstanceType<typeof DynamicForm> | null>(null)

// 对话框状态
const showListenerDialog = ref(false)
const showExtensionDialog = ref(false)

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

const hasValidationErrors = computed(() => {
  return validationResult.value.errors.length > 0
})

const propertyContext = computed((): PropertyContext => ({
  element: props.selectedElement,
  elementType: props.selectedElement?.type || '',
  modeler: props.modeler,
  readOnly: props.readonly
}))

// 监听选中元素变化
watch(() => props.selectedElement, (newElement) => {
  if (newElement) {
    loadElementProperties(newElement)
  } else {
    resetProperties()
  }
  
  // 重置验证状态
  validationResult.value = {
    isValid: true,
    errors: [],
    warnings: []
  }
  showValidationDetails.value = false
}, { immediate: true })

// 方法
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function loadElementProperties(element: BpmnElement) {
  const businessObject = element.businessObject || {}
  
  // 提取所有属性
  const extractedProperties: Record<string, PropertyValue> = {
    id: element.id || businessObject.id || '',
    name: businessObject.name || '',
    documentation: businessObject.documentation || ''
  }
  
  // 任务属性
  if (element.type.includes('Task')) {
    Object.assign(extractedProperties, {
      assignee: businessObject.assignee || '',
      candidateUsers: businessObject.candidateUsers || '',
      candidateGroups: businessObject.candidateGroups || '',
      dueDate: businessObject.dueDate || '',
      priority: businessObject.priority || '',
      formKey: businessObject.formKey || '',
      formFields: businessObject.formFields || [],
      async: businessObject.async || false
    })
  }
  
  // 网关属性
  if (element.type.includes('Gateway')) {
    Object.assign(extractedProperties, {
      defaultFlow: businessObject.default?.id || '',
      gatewayDirection: businessObject.gatewayDirection || 'Unspecified'
    })
  }
  
  // 事件属性
  if (element.type.includes('Event') && businessObject.eventDefinitions) {
    const eventDef = businessObject.eventDefinitions[0]
    if (eventDef) {
      Object.assign(extractedProperties, {
        eventType: eventDef.$type.replace('bpmn:', '').replace('EventDefinition', '').toLowerCase(),
        messageName: eventDef.messageRef?.name || '',
        timerExpression: eventDef.timeDuration?.body || eventDef.timeCycle?.body || '',
        cancelActivity: businessObject.cancelActivity !== false
      })
    }
  }
  
  // 流程属性
  if (element.type === 'bpmn:SequenceFlow') {
    Object.assign(extractedProperties, {
      conditionExpression: businessObject.conditionExpression?.body || '',
      isImmediate: businessObject.isImmediate || false
    })
  }
  
  // 扩展属性
  if (businessObject.extensionElements) {
    // 处理扩展属性
    const extensions = businessObject.extensionElements.values || []
    for (const extension of extensions) {
      if (extension.$type === 'zeebe:Properties') {
        const props = extension.properties || []
        for (const prop of props) {
          extractedProperties[`ext_${prop.name}`] = prop.value
        }
      }
    }
  }
  
  properties.value = extractedProperties
}

function resetProperties() {
  properties.value = {}
}

function handlePropertiesUpdate(newProperties: Record<string, PropertyValue>) {
  properties.value = newProperties
  
  // 批量更新所有属性
  if (props.selectedElement && props.modeler) {
    updateElementProperties(newProperties)
  }
}

function handleFieldChange(key: string, value: PropertyValue, validation: ValidationResult) {
  if (!props.selectedElement) return
  
  // 发出单个属性变更事件
  emit('property-changed', key, value, props.selectedElement)
  
  // 更新业务对象
  if (props.modeler) {
    updateBusinessObjectProperty(key, value)
  }
  
  // 如果有验证错误，更新整体验证状态
  if (!validation.isValid) {
    validationResult.value = {
      isValid: false,
      errors: [...validationResult.value.errors, ...validation.errors],
      warnings: [...validationResult.value.warnings, ...validation.warnings]
    }
  }
}

function handleValidation(result: ValidationResult) {
  validationResult.value = result
  
  if (!result.isValid) {
    emit('validation-error', result.errors)
  }
}

function updateElementProperties(newProperties: Record<string, PropertyValue>) {
  if (!props.selectedElement || !props.modeler) return
  
  try {
    const modeling = props.modeler.get('modeling')
    const element = props.selectedElement
    
    // 分离基础属性和扩展属性
    const baseProperties: Record<string, any> = {}
    const extensionProperties: Array<{name: string, value: string}> = []
    
    for (const [key, value] of Object.entries(newProperties)) {
      if (key.startsWith('ext_')) {
        extensionProperties.push({
          name: key.substring(4),
          value: String(value)
        })
      } else {
        baseProperties[key] = value
      }
    }
    
    // 更新基础属性
    if (Object.keys(baseProperties).length > 0) {
      modeling.updateProperties(element, baseProperties)
    }
    
    // 更新扩展属性
    if (extensionProperties.length > 0) {
      updateExtensionProperties(element, extensionProperties)
    }
    
    emit('element-updated', element)
  } catch (error) {
    console.error('更新属性失败:', error)
  }
}

function updateBusinessObjectProperty(property: string, value: PropertyValue) {
  if (!props.selectedElement || !props.modeler) return
  
  try {
    const modeling = props.modeler.get('modeling')
    const element = props.selectedElement
    
    if (property.startsWith('ext_')) {
      // 扩展属性
      const extName = property.substring(4)
      updateExtensionProperties(element, [{name: extName, value: String(value)}])
    } else {
      // 基础属性
      const updates: Record<string, any> = {}
      updates[property] = value
      modeling.updateProperties(element, updates)
    }
    
    emit('element-updated', element)
  } catch (error) {
    console.error('更新属性失败:', error)
  }
}

function updateExtensionProperties(element: BpmnElement, properties: Array<{name: string, value: string}>) {
  if (!props.modeler) return
  
  try {
    const moddle = props.modeler.get('moddle')
    const modeling = props.modeler.get('modeling')
    
    // 获取或创建扩展元素
    let extensionElements = element.businessObject.extensionElements
    if (!extensionElements) {
      extensionElements = moddle.create('bpmn:ExtensionElements')
      modeling.updateProperties(element, { extensionElements })
    }
    
    // 查找或创建属性扩展
    let propertiesExtension = extensionElements.values.find((ext: any) => ext.$type === 'zeebe:Properties')
    if (!propertiesExtension) {
      propertiesExtension = moddle.create('zeebe:Properties')
      extensionElements.values.push(propertiesExtension)
    }
    
    // 更新属性
    for (const prop of properties) {
      let existingProp = propertiesExtension.properties.find((p: any) => p.name === prop.name)
      if (existingProp) {
        existingProp.value = prop.value
      } else {
        const newProp = moddle.create('zeebe:Property', {
          name: prop.name,
          value: prop.value
        })
        propertiesExtension.properties.push(newProp)
      }
    }
  } catch (error) {
    console.error('更新扩展属性失败:', error)
  }
}

// 对话框相关方法
function openListenerConfig() {
  showListenerDialog.value = true
}

function openExtensionConfig() {
  showExtensionDialog.value = true
}

function handleListenerSave(listeners: any[]) {
  if (!props.selectedElement || !props.modeler) return
  
  try {
    const moddle = props.modeler.get('moddle')
    const modeling = props.modeler.get('modeling')
    const element = props.selectedElement
    
    // 获取或创建扩展元素
    let extensionElements = element.businessObject.extensionElements
    if (!extensionElements) {
      extensionElements = moddle.create('bpmn:ExtensionElements')
      modeling.updateProperties(element, { extensionElements })
    }
    
    // 删除现有的监听器
    extensionElements.values = extensionElements.values.filter((ext: any) => 
      ext.$type !== 'camunda:ExecutionListener'
    )
    
    // 添加新的监听器
    for (const listener of listeners) {
      const listenerElement = moddle.create('camunda:ExecutionListener', {
        event: listener.event
      })
      
      // 设置监听器类型和值
      switch (listener.type) {
        case 'class':
          listenerElement.class = listener.class
          break
        case 'expression':
          listenerElement.expression = listener.expression
          break
        case 'delegateExpression':
          listenerElement.delegateExpression = listener.delegateExpression
          break
        case 'script':
          listenerElement.script = moddle.create('camunda:Script', {
            scriptFormat: listener.scriptFormat,
            value: listener.scriptValue
          })
          break
      }
      
      // 添加字段注入
      if (listener.fields && listener.fields.length > 0) {
        listenerElement.fields = []
        for (const field of listener.fields) {
          const fieldElement = moddle.create('camunda:Field', {
            name: field.name
          })
          
          if (field.type === 'string') {
            fieldElement.stringValue = field.value
          } else {
            fieldElement.expression = field.value
          }
          
          listenerElement.fields.push(fieldElement)
        }
      }
      
      extensionElements.values.push(listenerElement)
    }
    
    console.log('监听器配置已保存')
    emit('element-updated', element)
  } catch (error) {
    console.error('保存监听器配置失败:', error)
    alert('保存监听器配置失败: ' + error)
  }
}

function handleExtensionSave(extensionProperties: any[]) {
  if (!props.selectedElement || !props.modeler) return
  
  try {
    const moddle = props.modeler.get('moddle')
    const modeling = props.modeler.get('modeling')
    const element = props.selectedElement
    
    // 获取或创建扩展元素
    let extensionElements = element.businessObject.extensionElements
    if (!extensionElements) {
      extensionElements = moddle.create('bpmn:ExtensionElements')
      modeling.updateProperties(element, { extensionElements })
    }
    
    // 删除现有的属性扩展
    extensionElements.values = extensionElements.values.filter((ext: any) => 
      ext.$type !== 'zeebe:Properties' && ext.$type !== 'camunda:Properties'
    )
    
    // 添加新的属性扩展
    if (extensionProperties.length > 0) {
      const propertiesExtension = moddle.create('zeebe:Properties')
      propertiesExtension.properties = []
      
      for (const prop of extensionProperties) {
        let propValue: any = prop.value
        
        // 序列化复杂类型
        if (prop.type === 'json' || prop.type === 'list' || prop.type === 'map') {
          propValue = JSON.stringify(prop.value)
        }
        
        const property = moddle.create('zeebe:Property', {
          name: prop.name,
          value: String(propValue)
        })
        
        propertiesExtension.properties.push(property)
      }
      
      extensionElements.values.push(propertiesExtension)
    }
    
    console.log('扩展属性配置已保存')
    emit('element-updated', element)
  } catch (error) {
    console.error('保存扩展属性配置失败:', error)
    alert('保存扩展属性配置失败: ' + error)
  }
}

// 暴露方法
defineExpose({
  validateAll: () => dynamicForm.value?.validateAllFields(),
  resetForm: () => {
    dynamicForm.value?.resetForm()
    resetProperties()
  },
  getProperties: () => ({ ...properties.value }),
  setProperty: (key: string, value: PropertyValue) => {
    properties.value[key] = value
    dynamicForm.value?.setFieldValue(key, value)
  }
})
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
    
    .validation-btn {
      height: 24px;
      padding: 0 8px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      gap: 4px;
      
      &.error {
        background: #fef0f0;
        color: #f56c6c;
        border: 1px solid #fbc4c4;
        
        &:hover {
          background: #f56c6c;
          color: white;
        }
      }
      
      i {
        font-size: 10px;
      }
    }
    
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

// 验证详情样式
.validation-details {
  background: #fef0f0;
  border-bottom: 1px solid #fbc4c4;
  
  .validation-header {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    background: #f56c6c;
    color: white;
    font-size: 12px;
    font-weight: 500;
    
    i {
      margin-right: 8px;
      font-size: 12px;
    }
    
    span {
      flex: 1;
    }
    
    .close-btn {
      width: 16px;
      height: 16px;
      border: none;
      background: transparent;
      color: white;
      cursor: pointer;
      border-radius: 2px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: rgba(255, 255, 255, 0.2);
      }
      
      i {
        font-size: 10px;
        margin: 0;
      }
    }
  }
  
  .validation-content {
    padding: 8px 16px;
    max-height: 120px;
    overflow-y: auto;
    
    .validation-error {
      margin-bottom: 6px;
      font-size: 11px;
      color: #f56c6c;
      line-height: 1.4;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      strong {
        color: #303133;
        margin-right: 4px;
      }
    }
  }
}

// 高级属性按钮样式
.advanced-actions {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  .action-btn {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #dcdfe6;
    background: white;
    color: #606266;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #409eff;
      color: #409eff;
      background: #ecf5ff;
    }
    
    &:active {
      background: #d9ecff;
    }
    
    i {
      font-size: 12px;
    }
  }
}
</style>