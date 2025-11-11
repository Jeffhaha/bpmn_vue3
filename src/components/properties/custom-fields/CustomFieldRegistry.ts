/**
 * 自定义属性字段注册表
 * 管理和注册自定义字段组件
 */

import type { Component } from 'vue'
import type { PropertyConfig, PropertyContext, PropertyValue } from '@/types/property.types'

// 自定义字段定义接口
export interface CustomFieldDefinition {
  name: string
  component: Component
  displayName: string
  description?: string
  category?: string
  icon?: string
  configSchema?: PropertyConfig[]
  validator?: (value: PropertyValue, config: PropertyConfig, context: PropertyContext) => boolean
  transformer?: (value: PropertyValue, direction: 'in' | 'out') => PropertyValue
  preview?: (value: PropertyValue, config: PropertyConfig) => string
}

// 自定义字段类别
export interface CustomFieldCategory {
  key: string
  label: string
  icon?: string
  order?: number
  description?: string
}

/**
 * 自定义字段注册表类
 */
export class CustomFieldRegistry {
  private fields: Map<string, CustomFieldDefinition> = new Map()
  private categories: Map<string, CustomFieldCategory> = new Map()

  /**
   * 注册自定义字段
   */
  registerField(field: CustomFieldDefinition): void {
    this.fields.set(field.name, field)
  }

  /**
   * 批量注册自定义字段
   */
  registerFields(fields: CustomFieldDefinition[]): void {
    for (const field of fields) {
      this.registerField(field)
    }
  }

  /**
   * 获取自定义字段
   */
  getField(name: string): CustomFieldDefinition | undefined {
    return this.fields.get(name)
  }

  /**
   * 获取所有自定义字段
   */
  getAllFields(): CustomFieldDefinition[] {
    return Array.from(this.fields.values())
  }

  /**
   * 根据类别获取字段
   */
  getFieldsByCategory(category: string): CustomFieldDefinition[] {
    return this.getAllFields().filter(field => field.category === category)
  }

  /**
   * 注册字段类别
   */
  registerCategory(category: CustomFieldCategory): void {
    this.categories.set(category.key, category)
  }

  /**
   * 获取字段类别
   */
  getCategory(key: string): CustomFieldCategory | undefined {
    return this.categories.get(key)
  }

  /**
   * 获取所有类别
   */
  getAllCategories(): CustomFieldCategory[] {
    return Array.from(this.categories.values())
      .sort((a, b) => (a.order || 999) - (b.order || 999))
  }

  /**
   * 检查字段是否存在
   */
  hasField(name: string): boolean {
    return this.fields.has(name)
  }

  /**
   * 移除字段
   */
  removeField(name: string): boolean {
    return this.fields.delete(name)
  }

  /**
   * 清空注册表
   */
  clear(): void {
    this.fields.clear()
    this.categories.clear()
  }

  /**
   * 验证字段值
   */
  validateField(
    fieldName: string, 
    value: PropertyValue, 
    config: PropertyConfig, 
    context: PropertyContext
  ): boolean {
    const field = this.getField(fieldName)
    if (!field || !field.validator) {
      return true
    }
    
    return field.validator(value, config, context)
  }

  /**
   * 转换字段值
   */
  transformValue(
    fieldName: string, 
    value: PropertyValue, 
    direction: 'in' | 'out'
  ): PropertyValue {
    const field = this.getField(fieldName)
    if (!field || !field.transformer) {
      return value
    }
    
    return field.transformer(value, direction)
  }

  /**
   * 获取字段预览文本
   */
  getFieldPreview(
    fieldName: string, 
    value: PropertyValue, 
    config: PropertyConfig
  ): string {
    const field = this.getField(fieldName)
    if (!field || !field.preview) {
      return String(value)
    }
    
    return field.preview(value, config)
  }

  /**
   * 创建字段配置
   */
  createFieldConfig(fieldName: string, overrides?: Partial<PropertyConfig>): PropertyConfig | null {
    const field = this.getField(fieldName)
    if (!field) {
      return null
    }

    return {
      key: `custom_${fieldName}`,
      label: field.displayName,
      type: 'custom',
      description: field.description,
      ...overrides
    }
  }

  /**
   * 搜索字段
   */
  searchFields(query: string): CustomFieldDefinition[] {
    const lowerQuery = query.toLowerCase()
    
    return this.getAllFields().filter(field => 
      field.name.toLowerCase().includes(lowerQuery) ||
      field.displayName.toLowerCase().includes(lowerQuery) ||
      (field.description && field.description.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 导出注册表配置
   */
  export(): any {
    return {
      fields: Array.from(this.fields.entries()).map(([name, field]) => ({
        name,
        displayName: field.displayName,
        description: field.description,
        category: field.category,
        icon: field.icon
      })),
      categories: Array.from(this.categories.values())
    }
  }

  /**
   * 导入注册表配置
   */
  import(config: any): void {
    if (config.categories) {
      for (const category of config.categories) {
        this.registerCategory(category)
      }
    }
    
    // 字段组件需要单独注册，这里只导入元数据
  }
}

// 创建全局注册表实例
export const customFieldRegistry = new CustomFieldRegistry()

// 注册默认类别
customFieldRegistry.registerCategory({
  key: 'basic',
  label: '基础字段',
  icon: 'fas fa-cube',
  order: 1,
  description: '基础的输入字段组件'
})

customFieldRegistry.registerCategory({
  key: 'advanced',
  label: '高级字段',
  icon: 'fas fa-cogs',
  order: 2,
  description: '高级和专业的字段组件'
})

customFieldRegistry.registerCategory({
  key: 'business',
  label: '业务字段',
  icon: 'fas fa-briefcase',
  order: 3,
  description: '业务相关的字段组件'
})

customFieldRegistry.registerCategory({
  key: 'integration',
  label: '集成字段',
  icon: 'fas fa-plug',
  order: 4,
  description: '第三方集成字段组件'
})