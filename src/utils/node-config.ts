/**
 * BPMN节点类型识别和配置系统
 * 提供节点类型检测、默认配置和验证功能
 */

import type { BpmnElement } from '@/types'

// 节点类别
export type NodeCategory = 'event' | 'task' | 'gateway' | 'flow' | 'data' | 'artifact' | 'pool' | 'lane'

// 节点配置接口
export interface NodeConfig {
  id: string
  name: string
  category: NodeCategory
  type: string
  icon: string
  color: string
  description: string
  defaultProperties: Record<string, any>
  validationRules: ValidationRule[]
  connectableTypes: string[]
  allowedIncomingConnections: number
  allowedOutgoingConnections: number
  isStartNode?: boolean
  isEndNode?: boolean
  hasForm?: boolean
  hasScript?: boolean
  hasTimer?: boolean
}

// 验证规则
export interface ValidationRule {
  property: string
  required?: boolean
  type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  customValidator?: (value: any, element: BpmnElement) => boolean | string
  message?: string
}

// 节点模板
export interface NodeTemplate {
  type: string
  properties: Record<string, any>
  position?: { x: number; y: number }
  size?: { width: number; height: number }
}

/**
 * 节点配置管理器
 */
class NodeConfigManager {
  private configs: Map<string, NodeConfig> = new Map()
  private templates: Map<string, NodeTemplate> = new Map()

  constructor() {
    this.initializeDefaultConfigs()
    this.initializeDefaultTemplates()
  }

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfigs(): void {
    // 开始事件
    this.registerNodeConfig({
      id: 'start-event',
      name: '开始事件',
      category: 'event',
      type: 'bpmn:StartEvent',
      icon: 'fas fa-play',
      color: '#67c23a',
      description: '流程的起始点',
      defaultProperties: {
        name: '开始',
        isInterrupting: true
      },
      validationRules: [],
      connectableTypes: ['bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway'],
      allowedIncomingConnections: 0,
      allowedOutgoingConnections: 1,
      isStartNode: true
    })

    // 结束事件
    this.registerNodeConfig({
      id: 'end-event',
      name: '结束事件',
      category: 'event',
      type: 'bpmn:EndEvent',
      icon: 'fas fa-stop',
      color: '#f56c6c',
      description: '流程的结束点',
      defaultProperties: {
        name: '结束'
      },
      validationRules: [],
      connectableTypes: [],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: 0,
      isEndNode: true
    })

    // 用户任务
    this.registerNodeConfig({
      id: 'user-task',
      name: '用户任务',
      category: 'task',
      type: 'bpmn:UserTask',
      icon: 'fas fa-user',
      color: '#409eff',
      description: '需要人工处理的任务',
      defaultProperties: {
        name: '用户任务',
        assignee: '',
        candidateUsers: '',
        candidateGroups: '',
        priority: '2',
        formKey: ''
      },
      validationRules: [
        {
          property: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          message: '任务名称不能为空'
        },
        {
          property: 'assignee',
          type: 'string',
          message: '指派人格式不正确'
        }
      ],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1,
      hasForm: true
    })

    // 服务任务
    this.registerNodeConfig({
      id: 'service-task',
      name: '服务任务',
      category: 'task',
      type: 'bpmn:ServiceTask',
      icon: 'fas fa-cogs',
      color: '#67c23a',
      description: '自动执行的服务任务',
      defaultProperties: {
        name: '服务任务',
        implementation: '',
        class: '',
        delegateExpression: ''
      },
      validationRules: [
        {
          property: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          message: '任务名称不能为空'
        }
      ],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1
    })

    // 脚本任务
    this.registerNodeConfig({
      id: 'script-task',
      name: '脚本任务',
      category: 'task',
      type: 'bpmn:ScriptTask',
      icon: 'fas fa-code',
      color: '#e6a23c',
      description: '执行脚本代码的任务',
      defaultProperties: {
        name: '脚本任务',
        scriptFormat: 'javascript',
        script: ''
      },
      validationRules: [
        {
          property: 'name',
          required: true,
          type: 'string',
          minLength: 1,
          message: '任务名称不能为空'
        },
        {
          property: 'script',
          required: true,
          type: 'string',
          minLength: 1,
          message: '脚本内容不能为空'
        }
      ],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1,
      hasScript: true
    })

    // 排他网关
    this.registerNodeConfig({
      id: 'exclusive-gateway',
      name: '排他网关',
      category: 'gateway',
      type: 'bpmn:ExclusiveGateway',
      icon: 'fas fa-times',
      color: '#f56c6c',
      description: '基于条件选择一个分支',
      defaultProperties: {
        name: '排他网关'
      },
      validationRules: [],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1
    })

    // 并行网关
    this.registerNodeConfig({
      id: 'parallel-gateway',
      name: '并行网关',
      category: 'gateway',
      type: 'bpmn:ParallelGateway',
      icon: 'fas fa-plus',
      color: '#67c23a',
      description: '创建或合并并行分支',
      defaultProperties: {
        name: '并行网关'
      },
      validationRules: [],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1
    })

    // 包容网关
    this.registerNodeConfig({
      id: 'inclusive-gateway',
      name: '包容网关',
      category: 'gateway',
      type: 'bpmn:InclusiveGateway',
      icon: 'fas fa-circle',
      color: '#e6a23c',
      description: '基于条件选择多个分支',
      defaultProperties: {
        name: '包容网关'
      },
      validationRules: [],
      connectableTypes: ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ExclusiveGateway', 'bpmn:ParallelGateway', 'bpmn:EndEvent'],
      allowedIncomingConnections: -1,
      allowedOutgoingConnections: -1
    })
  }

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates(): void {
    // 简单审批流程模板
    this.registerTemplate('simple-approval', {
      type: 'process',
      properties: {
        name: '简单审批流程',
        isExecutable: true
      }
    })

    // 用户任务模板
    this.registerTemplate('user-task-with-form', {
      type: 'bpmn:UserTask',
      properties: {
        name: '待审批任务',
        assignee: '${reviewer}',
        formKey: 'approval-form',
        priority: '3'
      }
    })
  }

  /**
   * 注册节点配置
   */
  registerNodeConfig(config: NodeConfig): void {
    this.configs.set(config.type, config)
  }

  /**
   * 获取节点配置
   */
  getNodeConfig(type: string): NodeConfig | undefined {
    return this.configs.get(type)
  }

  /**
   * 获取所有节点配置
   */
  getAllNodeConfigs(): NodeConfig[] {
    return Array.from(this.configs.values())
  }

  /**
   * 根据类别获取节点配置
   */
  getNodeConfigsByCategory(category: NodeCategory): NodeConfig[] {
    return Array.from(this.configs.values()).filter(config => config.category === category)
  }

  /**
   * 检测节点类型
   */
  detectNodeType(element: BpmnElement): NodeConfig | undefined {
    return this.getNodeConfig(element.type)
  }

  /**
   * 获取节点默认属性
   */
  getDefaultProperties(type: string): Record<string, any> {
    const config = this.getNodeConfig(type)
    return config ? { ...config.defaultProperties } : {}
  }

  /**
   * 验证节点属性
   */
  validateNodeProperties(element: BpmnElement, properties: Record<string, any>): ValidationResult {
    const config = this.getNodeConfig(element.type)
    if (!config) {
      return { isValid: true, errors: [] }
    }

    const errors: ValidationError[] = []

    for (const rule of config.validationRules) {
      const value = properties[rule.property]
      const error = this.validateProperty(value, rule, element)
      if (error) {
        errors.push(error)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证单个属性
   */
  private validateProperty(value: any, rule: ValidationRule, element: BpmnElement): ValidationError | null {
    // 必填验证
    if (rule.required && (value === undefined || value === null || value === '')) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 是必填项`
      }
    }

    // 如果值为空且非必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      return null
    }

    // 类型验证
    if (rule.type && !this.validateType(value, rule.type)) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 类型不正确`
      }
    }

    // 长度验证
    if (rule.minLength && String(value).length < rule.minLength) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 最小长度为 ${rule.minLength}`
      }
    }

    if (rule.maxLength && String(value).length > rule.maxLength) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 最大长度为 ${rule.maxLength}`
      }
    }

    // 数值范围验证
    if (rule.min !== undefined && Number(value) < rule.min) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 最小值为 ${rule.min}`
      }
    }

    if (rule.max !== undefined && Number(value) > rule.max) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 最大值为 ${rule.max}`
      }
    }

    // 正则验证
    if (rule.pattern && !rule.pattern.test(String(value))) {
      return {
        property: rule.property,
        message: rule.message || `${rule.property} 格式不正确`
      }
    }

    // 自定义验证
    if (rule.customValidator) {
      const result = rule.customValidator(value, element)
      if (result !== true) {
        return {
          property: rule.property,
          message: typeof result === 'string' ? result : rule.message || `${rule.property} 验证失败`
        }
      }
    }

    return null
  }

  /**
   * 验证数据类型
   */
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value))
      case 'boolean':
        return typeof value === 'boolean' || value === 'true' || value === 'false'
      case 'date':
        return !isNaN(Date.parse(value))
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      case 'url':
        return /^https?:\/\/.+/.test(value)
      default:
        return true
    }
  }

  /**
   * 检查连接是否有效
   */
  canConnect(sourceType: string, targetType: string): boolean {
    const sourceConfig = this.getNodeConfig(sourceType)
    if (!sourceConfig) return false

    return sourceConfig.connectableTypes.includes(targetType)
  }

  /**
   * 检查连接数量限制
   */
  canAddConnection(element: BpmnElement, connectionType: 'incoming' | 'outgoing', currentCount: number): boolean {
    const config = this.getNodeConfig(element.type)
    if (!config) return false

    const limit = connectionType === 'incoming' 
      ? config.allowedIncomingConnections 
      : config.allowedOutgoingConnections

    return limit === -1 || currentCount < limit
  }

  /**
   * 注册节点模板
   */
  registerTemplate(id: string, template: NodeTemplate): void {
    this.templates.set(id, template)
  }

  /**
   * 获取节点模板
   */
  getTemplate(id: string): NodeTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): Map<string, NodeTemplate> {
    return this.templates
  }

  /**
   * 应用模板到元素
   */
  applyTemplate(templateId: string, element: BpmnElement): Record<string, any> {
    const template = this.getTemplate(templateId)
    if (!template) return {}

    return { ...template.properties }
  }
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  property: string
  message: string
}

// 导出单例实例
export const nodeConfigManager = new NodeConfigManager()

// 便捷函数
export function getNodeConfig(type: string): NodeConfig | undefined {
  return nodeConfigManager.getNodeConfig(type)
}

export function detectNodeType(element: BpmnElement): NodeConfig | undefined {
  return nodeConfigManager.detectNodeType(element)
}

export function validateNode(element: BpmnElement, properties: Record<string, any>): ValidationResult {
  return nodeConfigManager.validateNodeProperties(element, properties)
}

export function canConnectNodes(sourceType: string, targetType: string): boolean {
  return nodeConfigManager.canConnect(sourceType, targetType)
}

export function getDefaultNodeProperties(type: string): Record<string, any> {
  return nodeConfigManager.getDefaultProperties(type)
}

export { NodeConfigManager }