<template>
  <div class="dynamic-form">
    <div v-for="group in propertyGroups" :key="group.key" class="form-group">
      <!-- 分组头部 -->
      <div 
        class="group-header" 
        @click="toggleGroup(group.key)"
        :class="{ collapsed: collapsedGroups[group.key] }"
      >
        <div class="header-left">
          <i v-if="group.icon" :class="group.icon"></i>
          <span>{{ group.label }}</span>
        </div>
        <div class="header-actions">
          <i class="fas fa-chevron-down toggle-icon"></i>
        </div>
      </div>
      
      <!-- 分组内容 -->
      <div v-if="!collapsedGroups[group.key]" class="group-content">
        <div 
          v-for="property in group.properties" 
          :key="property.key"
          class="form-field"
          :class="{ 
            'has-error': hasError(property.key),
            'is-required': property.required,
            'is-readonly': isReadonly(property)
          }"
        >
          <!-- 字段标签 -->
          <label class="field-label">
            {{ property.label }}
            <span v-if="property.required" class="required-mark">*</span>
            <span v-if="property.description" class="field-description" :title="property.description">
              <i class="fas fa-question-circle"></i>
            </span>
          </label>
          
          <!-- 字段输入 -->
          <div class="field-input">
            <!-- 文本输入 -->
            <input
              v-if="property.type === 'text'"
              v-model="fieldValues[property.key]"
              type="text"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- 多行文本 -->
            <textarea
              v-else-if="property.type === 'textarea'"
              v-model="fieldValues[property.key]"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              rows="3"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            ></textarea>
            
            <!-- 数字输入 -->
            <input
              v-else-if="property.type === 'number'"
              v-model.number="fieldValues[property.key]"
              type="number"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- 布尔值 -->
            <div v-else-if="property.type === 'boolean'" class="checkbox-wrapper">
              <input
                v-model="fieldValues[property.key]"
                type="checkbox"
                :disabled="isReadonly(property)"
                @change="handleFieldChange(property.key, $event.target.checked)"
              />
              <span class="checkbox-label">启用</span>
            </div>
            
            <!-- 选择框 -->
            <select
              v-else-if="property.type === 'select'"
              v-model="fieldValues[property.key]"
              :disabled="isReadonly(property)"
              @change="handleFieldChange(property.key, $event.target.value)"
            >
              <option value="">请选择...</option>
              <option
                v-for="option in getFieldOptions(property)"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            
            <!-- 多选框 -->
            <div v-else-if="property.type === 'multiSelect'" class="multi-select">
              <div
                v-for="option in getFieldOptions(property)"
                :key="option.value"
                class="multi-option"
              >
                <input
                  type="checkbox"
                  :value="option.value"
                  :checked="isOptionSelected(property.key, option.value)"
                  :disabled="isReadonly(property)"
                  @change="handleMultiSelectChange(property.key, option.value, $event.target.checked)"
                />
                <span>{{ option.label }}</span>
              </div>
            </div>
            
            <!-- 日期输入 -->
            <input
              v-else-if="property.type === 'date'"
              v-model="fieldValues[property.key]"
              type="date"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- 日期时间输入 -->
            <input
              v-else-if="property.type === 'datetime'"
              v-model="fieldValues[property.key]"
              type="datetime-local"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- 邮箱输入 -->
            <input
              v-else-if="property.type === 'email'"
              v-model="fieldValues[property.key]"
              type="email"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- URL输入 -->
            <input
              v-else-if="property.type === 'url'"
              v-model="fieldValues[property.key]"
              type="url"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- 密码输入 -->
            <input
              v-else-if="property.type === 'password'"
              v-model="fieldValues[property.key]"
              type="password"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
            
            <!-- JSON编辑器 -->
            <textarea
              v-else-if="property.type === 'json'"
              v-model="fieldValues[property.key]"
              :placeholder="property.description || '输入有效的JSON...'"
              :readonly="isReadonly(property)"
              rows="4"
              class="json-editor"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            ></textarea>
            
            <!-- 自定义字段 -->
            <component
              v-else-if="property.type === 'custom'"
              :is="getCustomComponent(property)"
              v-model="fieldValues[property.key]"
              :property="property"
              :context="context"
              :readonly="isReadonly(property)"
              @update:modelValue="handleFieldChange(property.key, $event)"
            />
            
            <!-- 默认文本输入 -->
            <input
              v-else
              v-model="fieldValues[property.key]"
              type="text"
              :placeholder="property.description || ''"
              :readonly="isReadonly(property)"
              @input="handleFieldChange(property.key, $event.target.value)"
              @blur="validateField(property.key)"
            />
          </div>
          
          <!-- 字段错误信息 -->
          <div v-if="hasError(property.key)" class="field-error">
            {{ getFieldError(property.key) }}
          </div>
          
          <!-- 字段帮助信息 -->
          <div v-if="property.description && !hasError(property.key)" class="field-help">
            {{ property.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { PropertyContext, PropertyValue, ValidationResult } from '@/types'
import type {
  PropertyGroup,
  PropertyConfig
} from '@/types/property.types'
import { propertyExtensionManager } from '@/utils/property-extension-manager'
import { propertyValidator } from '@/utils/property-validator'

// Props
interface Props {
  elementType: string
  context: PropertyContext
  modelValue?: Record<string, PropertyValue>
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  readonly: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Record<string, PropertyValue>]
  'field-change': [key: string, value: PropertyValue, validation: ValidationResult]
  'validation': [result: ValidationResult]
}>()

// 状态
const fieldValues = ref<Record<string, PropertyValue>>({})
const fieldErrors = ref<Record<string, string>>({})
const collapsedGroups = ref<Record<string, boolean>>({})

// 计算属性
const propertyGroups = computed(() => {
  console.log('DynamicForm 计算属性分组:', {
    elementType: props.elementType,
    context: props.context
  })
  
  const groups = propertyExtensionManager.getPropertyGroups(props.elementType, props.context)
  console.log('获取到的属性分组:', groups)
  
  // 如果没有获取到分组，返回基本分组
  if (groups.length === 0 && props.elementType) {
    console.log('没有找到属性分组，创建默认分组')
    const defaultSchema = propertyExtensionManager.createDefaultSchema(props.elementType)
    return defaultSchema.groups
  }
  
  return groups
})

// 监听
watch(() => props.modelValue, (newValue) => {
  fieldValues.value = { ...newValue }
}, { immediate: true, deep: true })

watch(fieldValues, (newValues) => {
  emit('update:modelValue', { ...newValues })
}, { deep: true })

// 生命周期
onMounted(() => {
  initializeForm()
})

// 方法
function initializeForm() {
  // 初始化字段值
  for (const group of propertyGroups.value) {
    for (const property of group.properties) {
      if (fieldValues.value[property.key] === undefined) {
        fieldValues.value[property.key] = property.defaultValue || getDefaultValue(property.type)
      }
    }
  }
  
  // 初始化分组展开状态
  for (const group of propertyGroups.value) {
    collapsedGroups.value[group.key] = group.collapsed || false
  }
}

function getDefaultValue(type: string): PropertyValue {
  switch (type) {
    case 'boolean': return false
    case 'number': return 0
    case 'multiSelect': return []
    default: return ''
  }
}

function toggleGroup(groupKey: string) {
  collapsedGroups.value[groupKey] = !collapsedGroups.value[groupKey]
}

function handleFieldChange(key: string, value: PropertyValue) {
  fieldValues.value[key] = value
  
  // 清除之前的错误
  delete fieldErrors.value[key]
  
  // 验证字段
  const validation = validateField(key)
  
  emit('field-change', key, value, validation)
}

function validateField(key: string): ValidationResult {
  const property = findPropertyConfig(key)
  if (!property) {
    return { isValid: true, errors: [], warnings: [] }
  }
  
  const value = fieldValues.value[key]
  const validation = propertyValidator.validateProperty(value, property, props.context)
  
  if (!validation.isValid) {
    fieldErrors.value[key] = validation.errors[0]?.message || '验证失败'
  } else {
    delete fieldErrors.value[key]
  }
  
  return validation
}

function validateAllFields(): ValidationResult {
  const allErrors: any[] = []
  const allWarnings: string[] = []
  
  for (const group of propertyGroups.value) {
    for (const property of group.properties) {
      const validation = validateField(property.key)
      allErrors.push(...validation.errors)
      allWarnings.push(...validation.warnings)
    }
  }
  
  const result = {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  }
  
  emit('validation', result)
  return result
}

function findPropertyConfig(key: string): PropertyConfig | undefined {
  for (const group of propertyGroups.value) {
    const property = group.properties.find(p => p.key === key)
    if (property) return property
  }
  return undefined
}

function hasError(key: string): boolean {
  return !!fieldErrors.value[key]
}

function getFieldError(key: string): string {
  return fieldErrors.value[key] || ''
}

function isReadonly(property: PropertyConfig): boolean {
  if (props.readonly) return true
  
  if (typeof property.editable === 'function') {
    return !property.editable(props.context.element)
  }
  
  return property.editable === false
}

function getFieldOptions(property: PropertyConfig): Array<{label: string, value: any}> {
  // 检查是否有动态选项
  const dynamicOptions = propertyExtensionManager.getDynamicOptions(
    property.key,
    props.elementType,
    props.context
  )
  
  if (dynamicOptions.length > 0) {
    return dynamicOptions
  }
  
  return property.options || []
}

function isOptionSelected(key: string, value: any): boolean {
  const fieldValue = fieldValues.value[key]
  if (Array.isArray(fieldValue)) {
    return fieldValue.includes(value)
  }
  return false
}

function handleMultiSelectChange(key: string, value: any, checked: boolean) {
  let currentValue = fieldValues.value[key] as any[]
  if (!Array.isArray(currentValue)) {
    currentValue = []
  }
  
  if (checked) {
    if (!currentValue.includes(value)) {
      currentValue.push(value)
    }
  } else {
    const index = currentValue.indexOf(value)
    if (index > -1) {
      currentValue.splice(index, 1)
    }
  }
  
  handleFieldChange(key, currentValue)
}

function getCustomComponent(property: PropertyConfig): string {
  // 返回自定义组件名称
  return property.key + 'CustomField'
}

// 暴露方法
defineExpose({
  validateAllFields,
  resetForm: () => {
    fieldValues.value = {}
    fieldErrors.value = {}
    initializeForm()
  },
  getFieldValues: () => ({ ...fieldValues.value }),
  setFieldValue: (key: string, value: PropertyValue) => {
    fieldValues.value[key] = value
  }
})
</script>

<style lang="scss" scoped>
.dynamic-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-group {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    i {
      color: #409eff;
      font-size: 14px;
      width: 16px;
      text-align: center;
    }
    
    span {
      font-weight: 500;
      font-size: 13px;
      color: #303133;
    }
  }
  
  .header-actions {
    .toggle-icon {
      color: #909399;
      font-size: 12px;
      transition: transform 0.2s ease;
    }
  }
  
  &.collapsed {
    .toggle-icon {
      transform: rotate(-90deg);
    }
  }
  
  &:hover {
    background: #f5f5f5;
  }
}

.group-content {
  padding: 16px;
}

.form-field {
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
  
  &.has-error {
    .field-input input,
    .field-input textarea,
    .field-input select {
      border-color: #f56c6c;
    }
  }
  
  &.is-required .required-mark {
    color: #f56c6c;
    margin-left: 2px;
  }
  
  &.is-readonly .field-input input,
  &.is-readonly .field-input textarea,
  &.is-readonly .field-input select {
    background: #f5f7fa;
    color: #909399;
    cursor: not-allowed;
  }
}

.field-label {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #606266;
  
  .field-description {
    margin-left: 4px;
    color: #c0c4cc;
    cursor: help;
    
    &:hover {
      color: #409eff;
    }
  }
}

.field-input {
  input, textarea, select {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 12px;
    background: #fff;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
    
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
    
    &.json-editor {
      font-family: 'Courier New', monospace;
      background: #f8f9fa;
    }
  }
  
  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    
    input[type="checkbox"] {
      width: auto;
      margin: 0;
    }
    
    .checkbox-label {
      font-size: 12px;
      color: #606266;
    }
  }
  
  .multi-select {
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    padding: 8px;
    background: #fff;
    
    .multi-option {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      input[type="checkbox"] {
        width: auto;
        margin: 0;
      }
      
      span {
        font-size: 12px;
        color: #606266;
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
</style>