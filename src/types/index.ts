// BPMN相关类型定义
export interface BpmnElement {
  id: string
  type: string
  businessObject: any
  parent?: BpmnElement
  children?: BpmnElement[]
}

export interface BpmnModelerOptions {
  container?: HTMLElement | string
  width?: number
  height?: number
  moddleExtensions?: Record<string, any>
  additionalModules?: any[]
  disablePalette?: boolean
}

// 统一拖拽数据格式
export interface UnifiedDragData {
  type: 'template' | 'bpmn-element' | 'custom'
  source: 'templatePanel' | 'bpmnPalette' | 'nodeLibrary'
  
  // 通用节点信息
  nodeInfo: {
    elementType: string        // BPMN元素类型 如 'bpmn:UserTask'
    name: string              // 显示名称
    category: string          // 节点分类
    icon: string             // 图标类名
  }
  
  // 条件性数据 - 当type为'template'时提供
  template?: NodeTemplate
  
  // 条件性数据 - 当type为'bpmn-element'时提供  
  elementConfig?: {
    properties: Record<string, any>
    defaultValues: Record<string, any>
  }
}

// 节点属性接口
export interface NodeProperties {
  id: string
  name: string
  type: string
  customProperties: Record<string, any>
  businessData: {
    category?: string
    priority?: 'high' | 'medium' | 'low'
    assignee?: string
    deadline?: Date
    estimatedTime?: number
  }
  appearance?: NodeUIConfig
  attachments?: Attachment[]
  template?: {
    id: string
    version: string
    inherited: boolean
  }
}

// 节点UI配置
export interface NodeUIConfig {
  shape: 'rectangle' | 'circle' | 'diamond' | 'gateway'
  size: { width: number; height: number }
  colors: {
    fill: string
    stroke: string
    text: string
  }
  icon?: {
    type: 'svg' | 'font' | 'image'
    content: string
    position: 'center' | 'top-left' | 'top-right'
  }
  label?: {
    position: 'center' | 'bottom' | 'right'
    maxLength: number
    fontSize: number
  }
}

// === 节点模板系统类型定义 ===

// 节点模板接口
export interface NodeTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  
  // 模板基础信息
  metadata: {
    version: string
    author: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
    usageCount: number
  }
  
  // 节点配置
  nodeType: string  // BPMN节点类型
  properties: Record<string, PropertyValue>
  uiConfig: NodeUIConfig
  
  // 模板特有属性
  templateConfig: {
    isDefault: boolean
    isCustomizable: boolean
    requiredFields: string[]
    defaultValues: Record<string, PropertyValue>
  }
  
  // 版本控制
  versionInfo?: {
    parentTemplateId?: string
    changelog?: string
    isLatest: boolean
  }
  
  // 预览配置
  preview: {
    thumbnail: string
    description: string
    examples: string[]
  }
}

// 模板分类
export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  parentId?: string
  sortOrder: number
  
  // 分类中的模板
  templates: NodeTemplate[]
  
  // 分类配置
  config: {
    allowCustomNodes: boolean
    defaultTemplate?: string
    sortOrder: 'name' | 'usage' | 'date'
  }
}

// 模板查询参数
export interface TemplateQuery {
  search?: string
  category?: string
  tags?: string[]
  nodeType?: string
  author?: string
  sortBy?: 'name' | 'usage' | 'date' | 'relevance'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 模板版本信息
export interface TemplateVersion {
  id: string
  templateId: string
  version: string
  changelog: string
  createdAt: Date
  author: string
  templateData: NodeTemplate
}

// 模板变更记录
export interface TemplateChanges {
  description: string
  changes: Array<{
    field: string
    oldValue: any
    newValue: any
    type: 'add' | 'update' | 'delete'
  }>
}

// 模板实例化配置
export interface TemplateInstantiationConfig {
  position: { x: number; y: number }
  customProperties?: Record<string, PropertyValue>
  connectTo?: string  // 连接到的元素ID
  replaceElement?: string  // 替换的元素ID
}

// 模板拖拽数据
export interface TemplateDragData {
  template: NodeTemplate
  dragType: 'copy' | 'instantiate'
  sourceCategory?: string
}

export interface ConnectionRule {
  sourceType: string
  targetType: string
  connectionType: string
}

// 附件接口
export interface Attachment {
  id: string
  name: string
  type: AttachmentType
  size: number
  mimeType: string
  storage: {
    provider: 'local' | 'cloud' | 'database'
    path: string
    url?: string
    checksum: string
  }
  metadata: {
    uploadedAt: Date
    uploadedBy: string
    version: number
    description?: string
    tags: string[]
  }
  preview?: {
    thumbnail?: string
    content?: string
    pages?: number
  }
}

export enum AttachmentType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  CODE = 'code',
  DATA = 'data',
  OTHER = 'other'
}

// 属性表单配置
export interface PropertyFormConfig {
  sections: PropertySection[]
  validation: ValidationRules
  layout: 'tabs' | 'accordion' | 'stack'
}

export interface PropertySection {
  id: string
  title: string
  icon?: string
  fields: PropertyField[]
  collapsible: boolean
}

export interface PropertyField {
  key: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'file' | 'custom'
  label: string
  required: boolean
  validation?: FieldValidation
  options?: SelectOption[]
  component?: string
}

export interface SelectOption {
  label: string
  value: any
}

export interface FieldValidation {
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationRules {
  [key: string]: FieldValidation
}

// 事件接口
export interface BpmnEvent {
  type: string
  element?: BpmnElement
  elements?: BpmnElement[]
  data?: any
  xml?: string
}

// 属性值类型
export type PropertyValue = string | number | boolean | Date | string[] | any[] | Record<string, any>

// 属性上下文
export interface PropertyContext {
  element: any
  elementType: string
  modeler?: any
  readOnly?: boolean
  customData?: Record<string, any>
}

// 验证结果
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
  rule?: any
}