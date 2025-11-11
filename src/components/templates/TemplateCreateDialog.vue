<template>
  <div v-if="visible" class="template-create-dialog">
    <div class="dialog-overlay" @click="handleClose"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>创建节点模板</h3>
        <button class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit" class="template-form">
          <!-- 基础信息 -->
          <div class="form-section">
            <h4>基础信息</h4>
            <div class="form-group">
              <label>模板名称 *</label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="输入模板名称"
                required
              />
            </div>
            
            <div class="form-group">
              <label>模板描述</label>
              <textarea
                v-model="formData.description"
                placeholder="描述模板的用途和特点"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>分类 *</label>
                <select v-model="formData.category" required>
                  <option value="">选择分类</option>
                  <option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>图标</label>
                <div class="icon-selector">
                  <button
                    type="button"
                    class="icon-btn"
                    @click="showIconPicker = true"
                  >
                    <i :class="formData.icon || 'fas fa-square'"></i>
                  </button>
                  <input
                    v-model="formData.icon"
                    type="text"
                    placeholder="fas fa-icon"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- 节点配置 -->
          <div class="form-section">
            <h4>节点配置</h4>
            <div class="form-group">
              <label>节点类型 *</label>
              <select v-model="formData.nodeType" required @change="handleNodeTypeChange">
                <option value="">选择节点类型</option>
                <optgroup label="任务节点">
                  <option value="bpmn:UserTask">用户任务</option>
                  <option value="bpmn:ServiceTask">服务任务</option>
                  <option value="bpmn:ScriptTask">脚本任务</option>
                  <option value="bpmn:BusinessRuleTask">业务规则任务</option>
                  <option value="bpmn:SendTask">发送任务</option>
                  <option value="bpmn:ReceiveTask">接收任务</option>
                  <option value="bpmn:ManualTask">手动任务</option>
                </optgroup>
                <optgroup label="事件节点">
                  <option value="bpmn:StartEvent">开始事件</option>
                  <option value="bpmn:EndEvent">结束事件</option>
                  <option value="bpmn:IntermediateCatchEvent">中间捕获事件</option>
                  <option value="bpmn:IntermediateThrowEvent">中间抛出事件</option>
                </optgroup>
                <optgroup label="网关节点">
                  <option value="bpmn:ExclusiveGateway">排他网关</option>
                  <option value="bpmn:InclusiveGateway">包容网关</option>
                  <option value="bpmn:ParallelGateway">并行网关</option>
                  <option value="bpmn:EventBasedGateway">事件网关</option>
                </optgroup>
                <optgroup label="其他">
                  <option value="bpmn:SubProcess">子流程</option>
                </optgroup>
              </select>
            </div>
          </div>
          
          <!-- UI配置 -->
          <div class="form-section">
            <h4>外观配置</h4>
            <div class="form-row">
              <div class="form-group">
                <label>宽度</label>
                <input
                  v-model.number="formData.uiConfig.size.width"
                  type="number"
                  min="20"
                  max="500"
                />
              </div>
              
              <div class="form-group">
                <label>高度</label>
                <input
                  v-model.number="formData.uiConfig.size.height"
                  type="number"
                  min="20"
                  max="500"
                />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>填充色</label>
                <input
                  v-model="formData.uiConfig.colors.fill"
                  type="color"
                />
              </div>
              
              <div class="form-group">
                <label>边框色</label>
                <input
                  v-model="formData.uiConfig.colors.stroke"
                  type="color"
                />
              </div>
              
              <div class="form-group">
                <label>文字色</label>
                <input
                  v-model="formData.uiConfig.colors.text"
                  type="color"
                />
              </div>
            </div>
          </div>
          
          <!-- 模板配置 -->
          <div class="form-section">
            <h4>模板配置</h4>
            <div class="form-row">
              <div class="form-group checkbox-group">
                <label>
                  <input
                    v-model="formData.templateConfig.isDefault"
                    type="checkbox"
                  />
                  设为默认模板
                </label>
              </div>
              
              <div class="form-group checkbox-group">
                <label>
                  <input
                    v-model="formData.templateConfig.isCustomizable"
                    type="checkbox"
                  />
                  允许自定义
                </label>
              </div>
            </div>
            
            <!-- 默认属性 -->
            <div class="form-group">
              <label>默认属性</label>
              <div class="property-editor">
                <div 
                  v-for="(property, index) in defaultProperties" 
                  :key="index"
                  class="property-row"
                >
                  <input
                    v-model="property.key"
                    type="text"
                    placeholder="属性名"
                    class="property-key"
                  />
                  <input
                    v-model="property.value"
                    type="text"
                    placeholder="默认值"
                    class="property-value"
                  />
                  <button
                    type="button"
                    class="remove-btn"
                    @click="removeProperty(index)"
                  >
                    <i class="fas fa-minus"></i>
                  </button>
                </div>
                <button
                  type="button"
                  class="add-property-btn"
                  @click="addProperty"
                >
                  <i class="fas fa-plus"></i>
                  添加属性
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="cancel-btn" @click="handleClose">
          取消
        </button>
        <button type="submit" class="confirm-btn" @click="handleSubmit">
          创建模板
        </button>
      </div>
    </div>
    
    <!-- 图标选择器 -->
    <IconPicker
      v-if="showIconPicker"
      @select="handleIconSelect"
      @close="showIconPicker = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import IconPicker from '../common/IconPicker.vue'
import type { NodeTemplate, TemplateCategory } from '@/types'

// Props
interface Props {
  visible: boolean
  categories: TemplateCategory[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'create': [template: Omit<NodeTemplate, 'id' | 'metadata'>]
}>()

// 状态
const showIconPicker = ref(false)
const defaultProperties = ref<Array<{ key: string; value: string }>>([
  { key: 'name', value: '' }
])

// 表单数据
const formData = reactive<Omit<NodeTemplate, 'id' | 'metadata'>>({
  name: '',
  description: '',
  category: '',
  icon: 'fas fa-square',
  nodeType: '',
  properties: {},
  uiConfig: {
    shape: 'rectangle',
    size: { width: 100, height: 80 },
    colors: {
      fill: '#e1f5fe',
      stroke: '#0277bd',
      text: '#01579b'
    }
  },
  templateConfig: {
    isDefault: false,
    isCustomizable: true,
    requiredFields: ['name'],
    defaultValues: {}
  },
  preview: {
    thumbnail: '',
    description: '',
    examples: []
  }
})

// 监听器
watch(() => formData.nodeType, (nodeType) => {
  // 根据节点类型设置默认配置
  if (nodeType) {
    updateDefaultsForNodeType(nodeType)
  }
})

// 计算属性
const isFormValid = computed(() => {
  return formData.name.trim() !== '' &&
         formData.category !== '' &&
         formData.nodeType !== ''
})

// 方法
function handleClose() {
  emit('close')
  resetForm()
}

function handleSubmit() {
  if (!isFormValid.value) {
    alert('请填写必填字段')
    return
  }

  // 构建属性对象
  const properties: Record<string, any> = {}
  const defaultValues: Record<string, any> = {}
  
  defaultProperties.value.forEach(prop => {
    if (prop.key && prop.value) {
      properties[prop.key] = prop.value
      defaultValues[prop.key] = prop.value
    }
  })

  const templateData: Omit<NodeTemplate, 'id' | 'metadata'> = {
    ...formData,
    properties,
    templateConfig: {
      ...formData.templateConfig,
      defaultValues
    },
    preview: {
      ...formData.preview,
      description: formData.description,
      thumbnail: generateThumbnailData()
    }
  }

  emit('create', templateData)
}

function handleNodeTypeChange() {
  updateDefaultsForNodeType(formData.nodeType)
}

function updateDefaultsForNodeType(nodeType: string) {
  // 重置属性
  defaultProperties.value = [{ key: 'name', value: formData.name || '' }]
  
  // 根据节点类型添加特定属性
  switch (nodeType) {
    case 'bpmn:UserTask':
      defaultProperties.value.push(
        { key: 'assignee', value: '' },
        { key: 'candidateUsers', value: '' },
        { key: 'candidateGroups', value: '' }
      )
      formData.uiConfig.colors = {
        fill: '#e1f5fe',
        stroke: '#0277bd',
        text: '#01579b'
      }
      break
      
    case 'bpmn:ServiceTask':
      defaultProperties.value.push(
        { key: 'implementation', value: 'webService' },
        { key: 'operationRef', value: '' }
      )
      formData.uiConfig.colors = {
        fill: '#f3e5f5',
        stroke: '#7b1fa2',
        text: '#4a148c'
      }
      break
      
    case 'bpmn:ExclusiveGateway':
      defaultProperties.value.push(
        { key: 'gatewayDirection', value: 'Diverging' }
      )
      formData.uiConfig.shape = 'diamond'
      formData.uiConfig.size = { width: 50, height: 50 }
      formData.uiConfig.colors = {
        fill: '#fff3e0',
        stroke: '#f57c00',
        text: '#e65100'
      }
      break
      
    case 'bpmn:StartEvent':
    case 'bpmn:EndEvent':
      formData.uiConfig.shape = 'circle'
      formData.uiConfig.size = { width: 36, height: 36 }
      formData.uiConfig.colors = {
        fill: '#e8f5e8',
        stroke: '#4caf50',
        text: '#2e7d32'
      }
      break
  }
}

function addProperty() {
  defaultProperties.value.push({ key: '', value: '' })
}

function removeProperty(index: number) {
  if (defaultProperties.value.length > 1) {
    defaultProperties.value.splice(index, 1)
  }
}

function handleIconSelect(icon: string) {
  formData.icon = icon
  showIconPicker.value = false
}

function resetForm() {
  Object.assign(formData, {
    name: '',
    description: '',
    category: '',
    icon: 'fas fa-square',
    nodeType: '',
    properties: {},
    uiConfig: {
      shape: 'rectangle',
      size: { width: 100, height: 80 },
      colors: {
        fill: '#e1f5fe',
        stroke: '#0277bd',
        text: '#01579b'
      }
    },
    templateConfig: {
      isDefault: false,
      isCustomizable: true,
      requiredFields: ['name'],
      defaultValues: {}
    },
    preview: {
      thumbnail: '',
      description: '',
      examples: []
    }
  })
  
  defaultProperties.value = [{ key: 'name', value: '' }]
}

function generateThumbnailData(): string {
  // 生成缩略图数据 (简化版本，实际可以使用canvas生成SVG)
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="100" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="80" fill="${formData.uiConfig.colors.fill}" stroke="${formData.uiConfig.colors.stroke}" stroke-width="2"/>
      <text x="50" y="45" text-anchor="middle" fill="${formData.uiConfig.colors.text}" font-size="12">${formData.name}</text>
    </svg>
  `)}`
}
</script>

<style lang="scss" scoped>
.template-create-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .dialog-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    position: relative;
    background: #fff;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .close-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #909399;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #f5f7fa;
      color: #606266;
    }
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.template-form {
  .form-section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #606266;
    }
    
    input, textarea, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-size: 12px;
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
      min-height: 60px;
      line-height: 1.4;
    }
    
    &.checkbox-group {
      label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        cursor: pointer;
        margin-bottom: 0;
        
        input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
      }
    }
  }
  
  .icon-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .icon-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #dcdfe6;
      background: #f5f7fa;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &:hover {
        border-color: #409eff;
        background: #ecf5ff;
      }
      
      i {
        font-size: 14px;
        color: #409eff;
      }
    }
    
    input {
      flex: 1;
    }
  }
  
  .property-editor {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    
    .property-row {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 8px;
      padding: 8px;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
      
      &:last-child {
        border-bottom: none;
      }
      
      .property-key, .property-value {
        margin: 0;
        border: 1px solid #e4e7ed;
        border-radius: 3px;
        padding: 4px 8px;
        font-size: 11px;
      }
      
      .remove-btn {
        width: 24px;
        height: 24px;
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
    
    .add-property-btn {
      width: 100%;
      padding: 8px;
      border: none;
      background: #f8f9fa;
      color: #606266;
      cursor: pointer;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      
      &:hover {
        background: #ecf5ff;
        color: #409eff;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  
  .cancel-btn {
    padding: 8px 16px;
    border: 1px solid #dcdfe6;
    background: #fff;
    color: #606266;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      border-color: #c0c4cc;
      color: #409eff;
    }
  }
  
  .confirm-btn {
    padding: 8px 16px;
    border: none;
    background: #409eff;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      background: #337ecc;
    }
    
    &:disabled {
      background: #c0c4cc;
      cursor: not-allowed;
    }
  }
}
</style>