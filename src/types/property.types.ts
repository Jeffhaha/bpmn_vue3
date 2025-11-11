/**
 * 属性类型定义
 * 定义BPMN元素的属性数据模型和验证规则
 */

// 基础属性接口
export interface BaseProperties {
  id: string
  name?: string
  documentation?: string
}

// 任务属性接口
export interface TaskProperties extends BaseProperties {
  assignee?: string
  candidateUsers?: string[]
  candidateGroups?: string[]
  dueDate?: string
  priority?: number
  formKey?: string
  formFields?: FormField[]
  async?: boolean
}

// 网关属性接口
export interface GatewayProperties extends BaseProperties {
  defaultFlow?: string
  gatewayDirection?: 'Unspecified' | 'Converging' | 'Diverging' | 'Mixed'
}

// 事件属性接口
export interface EventProperties extends BaseProperties {
  eventDefinitions?: EventDefinition[]
  cancelActivity?: boolean
  parallelMultiple?: boolean
}

// 流程属性接口
export interface FlowProperties extends BaseProperties {
  conditionExpression?: string
  isImmediate?: boolean
  skipExpression?: string
}

// 表单字段接口
export interface FormField {
  id: string
  label: string
  type: FormFieldType
  required?: boolean
  defaultValue?: any
  properties?: Record<string, any>
  validation?: ValidationRule[]
}

// 表单字段类型
export type FormFieldType = 
  | 'string' 
  | 'long' 
  | 'boolean' 
  | 'date' 
  | 'enum' 
  | 'custom'

// 事件定义接口
export interface EventDefinition {
  type: EventDefinitionType
  messageRef?: string
  signalRef?: string
  errorRef?: string
  escalationRef?: string
  timerExpression?: string
  conditionExpression?: string
}

// 事件定义类型
export type EventDefinitionType = 
  | 'message'
  | 'timer'
  | 'error'
  | 'signal'
  | 'escalation'
  | 'compensate'
  | 'conditional'
  | 'link'
  | 'terminate'

// 验证规则接口
export interface ValidationRule {
  type: ValidationType
  value?: any
  message: string
}

// 验证类型
export type ValidationType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'email'
  | 'url'
  | 'custom'

// 属性值类型
export type PropertyValue = string | number | boolean | Date | string[] | FormField[] | EventDefinition[]

// 属性变更事件
export interface PropertyChangeEvent {
  elementId: string
  propertyName: string
  oldValue: PropertyValue
  newValue: PropertyValue
  timestamp: Date
}

// 属性验证结果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: string[]
}

// 验证错误
export interface ValidationError {
  property: string
  message: string
  value: PropertyValue
  rule: ValidationRule
}

// 属性配置
export interface PropertyConfig {
  key: string
  label: string
  type: PropertyType
  required?: boolean
  defaultValue?: PropertyValue
  visible?: boolean | ((element: any) => boolean)
  editable?: boolean | ((element: any) => boolean)
  validation?: ValidationRule[]
  options?: Array<{label: string, value: any}>
  group?: string
  order?: number
  description?: string
}

// 属性类型
export type PropertyType = 
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiSelect'
  | 'date'
  | 'datetime'
  | 'email'
  | 'url'
  | 'password'
  | 'json'
  | 'custom'

// 属性分组
export interface PropertyGroup {
  key: string
  label: string
  icon?: string
  order?: number
  collapsed?: boolean
  visible?: boolean | ((element: any) => boolean)
  properties: PropertyConfig[]
}

// 属性上下文
export interface PropertyContext {
  element: any
  elementType: string
  modeler?: any
  readOnly?: boolean
  customData?: Record<string, any>
}

// 属性转换器接口
export interface PropertyTransformer {
  name: string
  transform(value: PropertyValue, context: PropertyContext): PropertyValue
  reverse(value: PropertyValue, context: PropertyContext): PropertyValue
}

// 属性扩展接口
export interface PropertyExtension {
  name: string
  namespace: string
  properties: PropertyConfig[]
  groups?: PropertyGroup[]
  transformers?: PropertyTransformer[]
}

// 属性模式
export interface PropertySchema {
  elementType: string
  groups: PropertyGroup[]
  extensions?: PropertyExtension[]
  customValidators?: Array<(element: any, properties: Record<string, PropertyValue>) => ValidationResult>
}

// 动态属性配置
export interface DynamicPropertyConfig extends PropertyConfig {
  dynamicOptions?: (element: any, context: PropertyContext) => Array<{label: string, value: any}>
  dependsOn?: string[]
  condition?: (element: any, properties: Record<string, PropertyValue>) => boolean
}

// 属性历史记录
export interface PropertyHistory {
  elementId: string
  changes: PropertyChangeEvent[]
  currentSnapshot: Record<string, PropertyValue>
}

// 批量属性更新
export interface BatchPropertyUpdate {
  elementIds: string[]
  properties: Record<string, PropertyValue>
  validate?: boolean
  transformers?: PropertyTransformer[]
}

// 属性导入导出格式
export interface PropertyExportFormat {
  format: 'json' | 'xml' | 'yaml' | 'csv'
  includeMetadata?: boolean
  includeValidation?: boolean
  includeHistory?: boolean
}