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

// 模板相关接口
export interface NodeTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  metadata: {
    version: string
    author: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
    usageCount: number
  }
  nodeConfig: {
    type: string
    properties: NodeProperties
    appearance: NodeUIConfig
    defaultConnections?: ConnectionRule[]
  }
  preview: {
    thumbnail: string
    description: string
    examples: string[]
  }
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