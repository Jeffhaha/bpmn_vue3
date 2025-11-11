/**
 * 属性扩展管理器
 * 管理自定义属性扩展和动态属性配置
 */

import type {
  PropertyConfig,
  PropertyGroup,
  PropertyExtension,
  PropertySchema,
  DynamicPropertyConfig,
  PropertyContext,
  PropertyValue,
  ValidationResult
} from '@/types/property.types'
import { propertyValidator } from './property-validator'

/**
 * 属性扩展管理器类
 */
export class PropertyExtensionManager {
  private extensions: Map<string, PropertyExtension> = new Map()
  private schemas: Map<string, PropertySchema> = new Map()
  private dynamicConfigs: Map<string, DynamicPropertyConfig[]> = new Map()

  /**
   * 注册属性扩展
   */
  registerExtension(extension: PropertyExtension): void {
    this.extensions.set(extension.name, extension)
    
    // 注册扩展中的转换器
    if (extension.transformers) {
      for (const transformer of extension.transformers) {
        propertyValidator.registerTransformer(transformer)
      }
    }
  }

  /**
   * 获取属性扩展
   */
  getExtension(name: string): PropertyExtension | undefined {
    return this.extensions.get(name)
  }

  /**
   * 获取所有扩展
   */
  getAllExtensions(): PropertyExtension[] {
    return Array.from(this.extensions.values())
  }

  /**
   * 注册属性模式
   */
  registerSchema(schema: PropertySchema): void {
    this.schemas.set(schema.elementType, schema)
  }

  /**
   * 获取元素类型的属性模式
   */
  getSchema(elementType: string): PropertySchema | undefined {
    return this.schemas.get(elementType)
  }

  /**
   * 注册动态属性配置
   */
  registerDynamicConfig(elementType: string, configs: DynamicPropertyConfig[]): void {
    const existing = this.dynamicConfigs.get(elementType) || []
    this.dynamicConfigs.set(elementType, [...existing, ...configs])
  }

  /**
   * 获取元素的完整属性配置
   */
  getPropertyConfigs(elementType: string, context: PropertyContext): PropertyConfig[] {
    const schema = this.getSchema(elementType)
    const configs: PropertyConfig[] = []

    // 添加基础属性配置
    if (schema) {
      for (const group of schema.groups) {
        // 检查分组可见性
        if (this.isGroupVisible(group, context)) {
          for (const property of group.properties) {
            // 检查属性可见性
            if (this.isPropertyVisible(property, context)) {
              configs.push(property)
            }
          }
        }
      }

      // 添加扩展属性配置
      if (schema.extensions) {
        for (const extension of schema.extensions) {
          const ext = this.getExtension(extension.name)
          if (ext) {
            configs.push(...this.getExtensionConfigs(ext, context))
          }
        }
      }
    }

    // 添加动态属性配置
    const dynamicConfigs = this.getDynamicConfigs(elementType, context)
    configs.push(...dynamicConfigs)

    return configs
  }

  /**
   * 获取元素的属性分组
   */
  getPropertyGroups(elementType: string, context: PropertyContext): PropertyGroup[] {
    const schema = this.getSchema(elementType)
    const groups: PropertyGroup[] = []

    if (schema) {
      for (const group of schema.groups) {
        if (this.isGroupVisible(group, context)) {
          groups.push({
            ...group,
            properties: group.properties.filter(prop => this.isPropertyVisible(prop, context))
          })
        }
      }

      // 添加扩展分组
      if (schema.extensions) {
        for (const extension of schema.extensions) {
          const ext = this.getExtension(extension.name)
          if (ext && ext.groups) {
            for (const group of ext.groups) {
              if (this.isGroupVisible(group, context)) {
                groups.push({
                  ...group,
                  properties: group.properties.filter(prop => this.isPropertyVisible(prop, context))
                })
              }
            }
          }
        }
      }
    }

    // 添加动态分组
    const dynamicGroup = this.getDynamicGroup(elementType, context)
    if (dynamicGroup && dynamicGroup.properties.length > 0) {
      groups.push(dynamicGroup)
    }

    return groups.sort((a, b) => (a.order || 999) - (b.order || 999))
  }

  /**
   * 验证元素属性
   */
  validateElementProperties(
    elementType: string,
    properties: Record<string, PropertyValue>,
    context: PropertyContext
  ): ValidationResult {
    const configs = this.getPropertyConfigs(elementType, context)
    const schema = this.getSchema(elementType)

    // 基础验证
    const baseValidation = propertyValidator.validateProperties(properties, configs, context)

    // 自定义验证器
    if (schema && schema.customValidators) {
      for (const validator of schema.customValidators) {
        const customResult = validator(context.element, properties)
        baseValidation.errors.push(...customResult.errors)
        baseValidation.warnings.push(...customResult.warnings)
      }
    }

    return {
      isValid: baseValidation.errors.length === 0,
      errors: baseValidation.errors,
      warnings: baseValidation.warnings
    }
  }

  /**
   * 获取属性的动态选项
   */
  getDynamicOptions(
    propertyKey: string,
    elementType: string,
    context: PropertyContext
  ): Array<{label: string, value: any}> {
    const dynamicConfigs = this.dynamicConfigs.get(elementType) || []
    const config = dynamicConfigs.find(c => c.key === propertyKey) as DynamicPropertyConfig

    if (config && config.dynamicOptions) {
      return config.dynamicOptions(context.element, context)
    }

    return []
  }

  /**
   * 检查属性依赖
   */
  checkPropertyDependencies(
    propertyKey: string,
    elementType: string,
    properties: Record<string, PropertyValue>
  ): boolean {
    const dynamicConfigs = this.dynamicConfigs.get(elementType) || []
    const config = dynamicConfigs.find(c => c.key === propertyKey) as DynamicPropertyConfig

    if (config && config.dependsOn) {
      return config.dependsOn.every(dep => {
        const depValue = properties[dep]
        return depValue !== undefined && depValue !== null && depValue !== ''
      })
    }

    return true
  }

  /**
   * 检查属性条件
   */
  checkPropertyCondition(
    propertyKey: string,
    elementType: string,
    element: any,
    properties: Record<string, PropertyValue>
  ): boolean {
    const dynamicConfigs = this.dynamicConfigs.get(elementType) || []
    const config = dynamicConfigs.find(c => c.key === propertyKey) as DynamicPropertyConfig

    if (config && config.condition) {
      return config.condition(element, properties)
    }

    return true
  }

  /**
   * 创建默认属性模式
   */
  createDefaultSchema(elementType: string): PropertySchema {
    const baseGroups: PropertyGroup[] = [
      {
        key: 'basic',
        label: '基本信息',
        icon: 'fas fa-info-circle',
        order: 1,
        properties: [
          {
            key: 'id',
            label: 'ID',
            type: 'text',
            required: true,
            editable: false
          },
          {
            key: 'name',
            label: '名称',
            type: 'text',
            required: false
          },
          {
            key: 'documentation',
            label: '描述',
            type: 'textarea',
            required: false
          }
        ]
      }
    ]

    // 根据元素类型添加特定分组
    if (elementType.includes('Task')) {
      baseGroups.push(this.createTaskGroup())
    }

    if (elementType.includes('Gateway')) {
      baseGroups.push(this.createGatewayGroup())
    }

    if (elementType.includes('Event')) {
      baseGroups.push(this.createEventGroup())
    }

    if (elementType === 'bpmn:SequenceFlow') {
      baseGroups.push(this.createFlowGroup())
    }

    return {
      elementType,
      groups: baseGroups
    }
  }

  /**
   * 检查分组可见性
   */
  private isGroupVisible(group: PropertyGroup, context: PropertyContext): boolean {
    if (typeof group.visible === 'function') {
      return group.visible(context.element)
    }
    return group.visible !== false
  }

  /**
   * 检查属性可见性
   */
  private isPropertyVisible(property: PropertyConfig, context: PropertyContext): boolean {
    if (typeof property.visible === 'function') {
      return property.visible(context.element)
    }
    return property.visible !== false
  }

  /**
   * 获取扩展属性配置
   */
  private getExtensionConfigs(extension: PropertyExtension, context: PropertyContext): PropertyConfig[] {
    const configs: PropertyConfig[] = []

    for (const property of extension.properties) {
      if (this.isPropertyVisible(property, context)) {
        configs.push(property)
      }
    }

    return configs
  }

  /**
   * 获取动态属性配置
   */
  private getDynamicConfigs(elementType: string, context: PropertyContext): PropertyConfig[] {
    const dynamicConfigs = this.dynamicConfigs.get(elementType) || []
    return dynamicConfigs.filter(config => this.isPropertyVisible(config, context))
  }

  /**
   * 获取动态属性分组
   */
  private getDynamicGroup(elementType: string, context: PropertyContext): PropertyGroup | null {
    const dynamicConfigs = this.getDynamicConfigs(elementType, context)
    
    if (dynamicConfigs.length === 0) {
      return null
    }

    return {
      key: 'dynamic',
      label: '动态属性',
      icon: 'fas fa-magic',
      order: 999,
      properties: dynamicConfigs
    }
  }

  /**
   * 创建任务属性分组
   */
  private createTaskGroup(): PropertyGroup {
    return {
      key: 'task',
      label: '任务属性',
      icon: 'fas fa-tasks',
      order: 2,
      properties: [
        {
          key: 'assignee',
          label: '指派人',
          type: 'text',
          required: false
        },
        {
          key: 'candidateUsers',
          label: '候选用户',
          type: 'text',
          required: false,
          description: '多个用户用逗号分隔'
        },
        {
          key: 'candidateGroups',
          label: '候选组',
          type: 'text',
          required: false,
          description: '多个组用逗号分隔'
        },
        {
          key: 'dueDate',
          label: '截止日期',
          type: 'datetime',
          required: false
        },
        {
          key: 'priority',
          label: '优先级',
          type: 'select',
          required: false,
          options: [
            { label: '低', value: 1 },
            { label: '普通', value: 2 },
            { label: '高', value: 3 },
            { label: '紧急', value: 4 }
          ]
        }
      ]
    }
  }

  /**
   * 创建网关属性分组
   */
  private createGatewayGroup(): PropertyGroup {
    return {
      key: 'gateway',
      label: '网关属性',
      icon: 'fas fa-code-branch',
      order: 2,
      properties: [
        {
          key: 'defaultFlow',
          label: '默认流向',
          type: 'select',
          required: false
        },
        {
          key: 'gatewayDirection',
          label: '网关方向',
          type: 'select',
          required: false,
          options: [
            { label: '未指定', value: 'Unspecified' },
            { label: '汇聚', value: 'Converging' },
            { label: '分叉', value: 'Diverging' },
            { label: '混合', value: 'Mixed' }
          ]
        }
      ]
    }
  }

  /**
   * 创建事件属性分组
   */
  private createEventGroup(): PropertyGroup {
    return {
      key: 'event',
      label: '事件属性',
      icon: 'fas fa-bolt',
      order: 2,
      properties: [
        {
          key: 'eventType',
          label: '事件类型',
          type: 'select',
          required: false,
          options: [
            { label: '无', value: '' },
            { label: '消息', value: 'message' },
            { label: '计时器', value: 'timer' },
            { label: '错误', value: 'error' },
            { label: '信号', value: 'signal' },
            { label: '升级', value: 'escalation' }
          ]
        },
        {
          key: 'cancelActivity',
          label: '取消活动',
          type: 'boolean',
          required: false,
          defaultValue: true
        }
      ]
    }
  }

  /**
   * 创建流程属性分组
   */
  private createFlowGroup(): PropertyGroup {
    return {
      key: 'flow',
      label: '流程配置',
      icon: 'fas fa-route',
      order: 2,
      properties: [
        {
          key: 'conditionExpression',
          label: '条件表达式',
          type: 'textarea',
          required: false,
          description: '例如：${amount > 1000}'
        },
        {
          key: 'isImmediate',
          label: '立即执行',
          type: 'boolean',
          required: false,
          defaultValue: false
        }
      ]
    }
  }
}

// 创建全局属性扩展管理器实例
export const propertyExtensionManager = new PropertyExtensionManager()

// 注册默认模式
const defaultElementTypes = [
  'bpmn:StartEvent',
  'bpmn:EndEvent',
  'bpmn:UserTask',
  'bpmn:ServiceTask',
  'bpmn:ExclusiveGateway',
  'bpmn:SequenceFlow',
  'bpmn:Process'
]

for (const elementType of defaultElementTypes) {
  const schema = propertyExtensionManager.createDefaultSchema(elementType)
  propertyExtensionManager.registerSchema(schema)
}