<template>
  <div class="dialog-overlay" v-if="visible" @click="handleOverlayClick">
    <div class="extension-config-dialog" @click.stop>
      <!-- 对话框头部 -->
      <div class="dialog-header">
        <h3>扩展属性配置</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 对话框内容 -->
      <div class="dialog-content">
        <div class="properties-list">
          <div class="list-header">
            <span>扩展属性列表</span>
            <button class="add-btn" @click="addProperty">
              <i class="fas fa-plus"></i>
              添加属性
            </button>
          </div>
          
          <div v-if="properties.length === 0" class="empty-state">
            <i class="fas fa-puzzle-piece"></i>
            <p>暂无扩展属性</p>
          </div>
          
          <div v-else class="properties-container">
            <div 
              v-for="(property, index) in properties" 
              :key="property.id"
              class="property-item"
              :class="{ active: selectedIndex === index }"
              @click="selectProperty(index)"
            >
              <div class="property-info">
                <div class="property-name">
                  {{ property.name || '未命名属性' }}
                </div>
                <div class="property-value">
                  {{ getDisplayValue(property.value) }}
                </div>
              </div>
              <button class="delete-btn" @click.stop="removeProperty(index)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- 属性编辑表单 -->
        <div v-if="selectedIndex >= 0 && currentProperty" class="property-form">
          <h4>属性配置</h4>
          
          <div class="form-group">
            <label>属性名称</label>
            <input 
              v-model="currentProperty.name" 
              type="text"
              placeholder="输入属性名称..."
              @input="validatePropertyName"
            />
            <div v-if="nameError" class="field-error">{{ nameError }}</div>
          </div>
          
          <div class="form-group">
            <label>属性类型</label>
            <select v-model="currentProperty.type" @change="onTypeChange">
              <option value="string">字符串</option>
              <option value="number">数字</option>
              <option value="boolean">布尔值</option>
              <option value="json">JSON对象</option>
              <option value="expression">表达式</option>
              <option value="list">列表</option>
              <option value="map">映射表</option>
            </select>
          </div>
          
          <!-- 字符串类型 -->
          <div v-if="currentProperty.type === 'string'" class="form-group">
            <label>属性值</label>
            <input 
              v-model="currentProperty.value" 
              type="text"
              placeholder="输入字符串值..."
            />
          </div>
          
          <!-- 数字类型 -->
          <div v-if="currentProperty.type === 'number'" class="form-group">
            <label>数值</label>
            <input 
              v-model.number="currentProperty.value" 
              type="number"
              placeholder="输入数值..."
            />
          </div>
          
          <!-- 布尔类型 -->
          <div v-if="currentProperty.type === 'boolean'" class="form-group">
            <label>布尔值</label>
            <div class="boolean-selector">
              <label class="radio-option">
                <input 
                  type="radio" 
                  :value="true" 
                  v-model="currentProperty.value"
                />
                <span>True</span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  :value="false" 
                  v-model="currentProperty.value"
                />
                <span>False</span>
              </label>
            </div>
          </div>
          
          <!-- JSON对象类型 -->
          <div v-if="currentProperty.type === 'json'" class="form-group">
            <label>JSON内容</label>
            <textarea 
              v-model="jsonValue" 
              @blur="updateJsonValue"
              rows="6"
              placeholder='{"key": "value"}'
              class="json-editor"
            ></textarea>
            <div v-if="jsonError" class="field-error">{{ jsonError }}</div>
          </div>
          
          <!-- 表达式类型 -->
          <div v-if="currentProperty.type === 'expression'" class="form-group">
            <label>表达式</label>
            <input 
              v-model="currentProperty.value" 
              type="text"
              placeholder="${expression}"
            />
            <div class="field-help">
              使用 ${} 语法编写表达式，例如：${user.name}
            </div>
          </div>
          
          <!-- 列表类型 -->
          <div v-if="currentProperty.type === 'list'" class="form-group">
            <label class="section-title">
              列表项目
              <button 
                class="add-item-btn" 
                type="button"
                @click="addListItem"
              >
                <i class="fas fa-plus"></i>
                添加项目
              </button>
            </label>
            
            <div v-if="listItems.length === 0" class="empty-list">
              暂无列表项目
            </div>
            
            <div v-else class="list-items">
              <div 
                v-for="(item, itemIndex) in listItems"
                :key="itemIndex"
                class="list-item"
              >
                <input 
                  v-model="listItems[itemIndex]" 
                  placeholder="列表项目值"
                  class="list-item-input"
                />
                <button 
                  class="remove-item-btn" 
                  @click="removeListItem(itemIndex)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          
          <!-- 映射表类型 -->
          <div v-if="currentProperty.type === 'map'" class="form-group">
            <label class="section-title">
              键值对
              <button 
                class="add-item-btn" 
                type="button"
                @click="addMapItem"
              >
                <i class="fas fa-plus"></i>
                添加键值对
              </button>
            </label>
            
            <div v-if="mapItems.length === 0" class="empty-map">
              暂无键值对
            </div>
            
            <div v-else class="map-items">
              <div 
                v-for="(item, itemIndex) in mapItems"
                :key="itemIndex"
                class="map-item"
              >
                <input 
                  v-model="item.key" 
                  placeholder="键"
                  class="map-key-input"
                />
                <input 
                  v-model="item.value" 
                  placeholder="值"
                  class="map-value-input"
                />
                <button 
                  class="remove-item-btn" 
                  @click="removeMapItem(itemIndex)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>描述</label>
            <textarea 
              v-model="currentProperty.description" 
              rows="2"
              placeholder="属性说明（可选）..."
            ></textarea>
          </div>
        </div>
      </div>
      
      <!-- 对话框底部 -->
      <div class="dialog-footer">
        <button class="btn-secondary" @click="$emit('close')">
          取消
        </button>
        <button class="btn-primary" @click="saveProperties">
          保存配置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { BpmnElement } from '@/types'

interface ExtensionProperty {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'json' | 'expression' | 'list' | 'map'
  value: any
  description?: string
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
  'save': [properties: ExtensionProperty[]]
}>()

// 状态
const properties = ref<ExtensionProperty[]>([])
const selectedIndex = ref(-1)
const nameError = ref('')
const jsonError = ref('')

const currentProperty = computed(() => {
  return selectedIndex.value >= 0 ? properties.value[selectedIndex.value] : null
})

// JSON编辑器相关
const jsonValue = ref('')
const listItems = ref<string[]>([])
const mapItems = ref<Array<{key: string, value: string}>>([])

// 监听当前选中属性变化
watch(() => currentProperty.value, (newProperty) => {
  if (newProperty) {
    updateEditingValues(newProperty)
  }
}, { immediate: true })

// 监听元素变化，加载现有的扩展属性
watch(() => props.element, (newElement) => {
  if (newElement) {
    loadExtensionProperties(newElement)
  }
}, { immediate: true })

function updateEditingValues(property: ExtensionProperty) {
  switch (property.type) {
    case 'json':
      jsonValue.value = typeof property.value === 'string' 
        ? property.value 
        : JSON.stringify(property.value, null, 2)
      break
    case 'list':
      listItems.value = Array.isArray(property.value) ? [...property.value] : []
      break
    case 'map':
      if (typeof property.value === 'object' && property.value !== null) {
        mapItems.value = Object.entries(property.value).map(([key, value]) => ({
          key,
          value: String(value)
        }))
      } else {
        mapItems.value = []
      }
      break
  }
}

function loadExtensionProperties(element: BpmnElement) {
  properties.value = []
  selectedIndex.value = -1
  
  if (!element.businessObject) return
  
  const extensionElements = element.businessObject.extensionElements
  if (!extensionElements) return
  
  // 查找属性扩展
  const propertiesExtension = (extensionElements.values || []).find((ext: any) => 
    ext.$type === 'zeebe:Properties' || ext.$type === 'camunda:Properties'
  )
  
  if (propertiesExtension && propertiesExtension.properties) {
    for (const prop of propertiesExtension.properties) {
      const property: ExtensionProperty = {
        id: generateId(),
        name: prop.name,
        type: inferPropertyType(prop.value),
        value: parsePropertyValue(prop.value),
        description: prop.description
      }
      
      properties.value.push(property)
    }
  }
}

function inferPropertyType(value: any): ExtensionProperty['type'] {
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (Array.isArray(value)) return 'list'
  if (typeof value === 'object' && value !== null) return 'map'
  if (typeof value === 'string' && value.startsWith('${')) return 'expression'
  
  // 尝试解析为JSON
  try {
    JSON.parse(value)
    return 'json'
  } catch {
    return 'string'
  }
}

function parsePropertyValue(value: any): any {
  if (typeof value !== 'string') return value
  
  // 尝试解析特殊格式
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return parseInt(value)
  if (/^\d*\.\d+$/.test(value)) return parseFloat(value)
  
  // 尝试解析JSON
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function generateId(): string {
  return 'ext_prop_' + Math.random().toString(36).substr(2, 9)
}

function getDisplayValue(value: any): string {
  if (value === null || value === undefined) return '空'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (Array.isArray(value)) return `[${value.length} 项]`
  if (typeof value === 'object') return `{${Object.keys(value).length} 键}`
  
  const str = String(value)
  return str.length > 30 ? str.substring(0, 30) + '...' : str
}

function addProperty() {
  const newProperty: ExtensionProperty = {
    id: generateId(),
    name: '',
    type: 'string',
    value: ''
  }
  
  properties.value.push(newProperty)
  selectedIndex.value = properties.value.length - 1
}

function removeProperty(index: number) {
  if (confirm('确定删除此扩展属性吗？')) {
    properties.value.splice(index, 1)
    
    if (selectedIndex.value >= properties.value.length) {
      selectedIndex.value = properties.value.length - 1
    }
  }
}

function selectProperty(index: number) {
  selectedIndex.value = index
}

function validatePropertyName() {
  nameError.value = ''
  
  if (!currentProperty.value?.name) {
    nameError.value = '属性名称不能为空'
    return false
  }
  
  // 检查重名
  const duplicateIndex = properties.value.findIndex((prop, index) => 
    prop.name === currentProperty.value?.name && index !== selectedIndex.value
  )
  
  if (duplicateIndex >= 0) {
    nameError.value = '属性名称已存在'
    return false
  }
  
  return true
}

function onTypeChange() {
  if (!currentProperty.value) return
  
  // 重置值
  switch (currentProperty.value.type) {
    case 'string':
    case 'expression':
      currentProperty.value.value = ''
      break
    case 'number':
      currentProperty.value.value = 0
      break
    case 'boolean':
      currentProperty.value.value = false
      break
    case 'json':
      currentProperty.value.value = {}
      jsonValue.value = '{}'
      break
    case 'list':
      currentProperty.value.value = []
      listItems.value = []
      break
    case 'map':
      currentProperty.value.value = {}
      mapItems.value = []
      break
  }
}

function updateJsonValue() {
  jsonError.value = ''
  
  if (!jsonValue.value.trim()) {
    currentProperty.value!.value = null
    return
  }
  
  try {
    currentProperty.value!.value = JSON.parse(jsonValue.value)
  } catch (e) {
    jsonError.value = '无效的JSON格式'
  }
}

function addListItem() {
  listItems.value.push('')
  updateListValue()
}

function removeListItem(index: number) {
  listItems.value.splice(index, 1)
  updateListValue()
}

function updateListValue() {
  if (currentProperty.value) {
    currentProperty.value.value = [...listItems.value.filter(item => item.trim())]
  }
}

function addMapItem() {
  mapItems.value.push({ key: '', value: '' })
  updateMapValue()
}

function removeMapItem(index: number) {
  mapItems.value.splice(index, 1)
  updateMapValue()
}

function updateMapValue() {
  if (currentProperty.value) {
    const map: Record<string, string> = {}
    for (const item of mapItems.value) {
      if (item.key.trim()) {
        map[item.key] = item.value
      }
    }
    currentProperty.value.value = map
  }
}

function saveProperties() {
  // 验证所有属性
  for (let i = 0; i < properties.value.length; i++) {
    const property = properties.value[i]
    
    if (!property.name) {
      alert(`第 ${i + 1} 个属性的名称不能为空`)
      selectedIndex.value = i
      return
    }
    
    // 检查重名
    const duplicateIndex = properties.value.findIndex((prop, index) => 
      prop.name === property.name && index !== i
    )
    if (duplicateIndex >= 0) {
      alert(`属性名称 "${property.name}" 重复`)
      selectedIndex.value = i
      return
    }
  }
  
  // 更新列表和映射的最终值
  for (const property of properties.value) {
    if (property.type === 'list') {
      property.value = listItems.value.filter(item => item.trim())
    } else if (property.type === 'map') {
      const map: Record<string, string> = {}
      for (const item of mapItems.value) {
        if (item.key.trim()) {
          map[item.key] = item.value
        }
      }
      property.value = map
    }
  }
  
  emit('save', properties.value)
  emit('close')
}

function handleOverlayClick() {
  emit('close')
}
</script>

<style lang="scss" scoped>
// 复用 ListenerConfigDialog 的样式，添加特定样式
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

.extension-config-dialog {
  width: 900px;
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

.properties-list {
  width: 350px;
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
  
  .properties-container {
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

.property-item {
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
  
  .property-info {
    flex: 1;
    min-width: 0;
    
    .property-name {
      font-size: 13px;
      font-weight: 500;
      color: #333;
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .property-value {
      font-size: 11px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

.property-form {
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
      min-height: 60px;
      
      &.json-editor {
        font-family: 'Courier New', monospace;
        background: #f8f9fa;
      }
    }
  }
  
  .boolean-selector {
    display: flex;
    gap: 16px;
    
    .radio-option {
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      font-size: 12px;
      
      input[type="radio"] {
        width: auto;
        margin: 0;
      }
    }
  }
  
  .add-item-btn {
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
  
  .empty-list, .empty-map {
    padding: 20px;
    text-align: center;
    color: #999;
    font-size: 12px;
    border: 1px dashed #ddd;
    border-radius: 4px;
  }
  
  .list-items {
    .list-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      
      .list-item-input {
        flex: 1;
        margin-bottom: 0;
      }
      
      .remove-item-btn {
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
  
  .map-items {
    .map-item {
      display: grid;
      grid-template-columns: 1fr 1fr 24px;
      gap: 8px;
      margin-bottom: 8px;
      align-items: center;
      
      .map-key-input, .map-value-input {
        margin-bottom: 0;
      }
      
      .remove-item-btn {
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
  
  .field-error {
    margin-top: 4px;
    font-size: 11px;
    color: #f56c6c;
    line-height: 1.4;
  }
  
  .field-help {
    margin-top: 4px;
    font-size: 11px;
    color: #909399;
    line-height: 1.4;
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