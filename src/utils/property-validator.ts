/**
 * 属性验证器
 * 提供完整的属性验证和转换功能
 */

import type {
  PropertyValue,
  ValidationRule,
  ValidationResult,
  ValidationError,
  PropertyConfig,
  PropertyContext,
  PropertyTransformer
} from '@/types/property.types'

/**
 * 属性验证器类
 */
export class PropertyValidator {
  private transformers: Map<string, PropertyTransformer> = new Map()

  /**
   * 注册属性转换器
   */
  registerTransformer(transformer: PropertyTransformer): void {
    this.transformers.set(transformer.name, transformer)
  }

  /**
   * 验证单个属性
   */
  validateProperty(
    value: PropertyValue,
    config: PropertyConfig,
    context: PropertyContext
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: string[] = []

    // 检查必填项
    if (config.required && this.isEmpty(value)) {
      errors.push({
        property: config.key,
        message: `${config.label}不能为空`,
        value,
        rule: { type: 'required', message: '必填项' }
      })
    }

    // 执行验证规则
    if (config.validation && !this.isEmpty(value)) {
      for (const rule of config.validation) {
        const ruleResult = this.validateRule(value, rule, config)
        if (!ruleResult.isValid) {
          errors.push({
            property: config.key,
            message: rule.message,
            value,
            rule
          })
        }
      }
    }

    // 类型验证
    const typeValidation = this.validateType(value, config)
    if (!typeValidation.isValid) {
      errors.push(...typeValidation.errors)
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证多个属性
   */
  validateProperties(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    context: PropertyContext
  ): ValidationResult {
    const allErrors: ValidationError[] = []
    const allWarnings: string[] = []

    for (const config of configs) {
      const value = properties[config.key]
      const result = this.validateProperty(value, config, context)
      
      allErrors.push(...result.errors)
      allWarnings.push(...result.warnings)
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    }
  }

  /**
   * 转换属性值
   */
  transformValue(
    value: PropertyValue,
    transformerName: string,
    context: PropertyContext
  ): PropertyValue {
    const transformer = this.transformers.get(transformerName)
    if (!transformer) {
      console.warn(`转换器 ${transformerName} 未找到`)
      return value
    }

    try {
      return transformer.transform(value, context)
    } catch (error) {
      console.error(`属性转换失败:`, error)
      return value
    }
  }

  /**
   * 反向转换属性值
   */
  reverseTransformValue(
    value: PropertyValue,
    transformerName: string,
    context: PropertyContext
  ): PropertyValue {
    const transformer = this.transformers.get(transformerName)
    if (!transformer) {
      console.warn(`转换器 ${transformerName} 未找到`)
      return value
    }

    try {
      return transformer.reverse(value, context)
    } catch (error) {
      console.error(`属性反向转换失败:`, error)
      return value
    }
  }

  /**
   * 验证规则
   */
  private validateRule(
    value: PropertyValue,
    rule: ValidationRule,
    config: PropertyConfig
  ): ValidationResult {
    switch (rule.type) {
      case 'required':
        return {
          isValid: !this.isEmpty(value),
          errors: [],
          warnings: []
        }

      case 'minLength':
        if (typeof value === 'string') {
          return {
            isValid: value.length >= (rule.value as number),
            errors: [],
            warnings: []
          }
        }
        break

      case 'maxLength':
        if (typeof value === 'string') {
          return {
            isValid: value.length <= (rule.value as number),
            errors: [],
            warnings: []
          }
        }
        break

      case 'min':
        if (typeof value === 'number') {
          return {
            isValid: value >= (rule.value as number),
            errors: [],
            warnings: []
          }
        }
        break

      case 'max':
        if (typeof value === 'number') {
          return {
            isValid: value <= (rule.value as number),
            errors: [],
            warnings: []
          }
        }
        break

      case 'pattern':
        if (typeof value === 'string' && typeof rule.value === 'string') {
          const pattern = new RegExp(rule.value)
          return {
            isValid: pattern.test(value),
            errors: [],
            warnings: []
          }
        }
        break

      case 'email':
        if (typeof value === 'string') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          return {
            isValid: emailPattern.test(value),
            errors: [],
            warnings: []
          }
        }
        break

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value)
            return {
              isValid: true,
              errors: [],
              warnings: []
            }
          } catch {
            return {
              isValid: false,
              errors: [],
              warnings: []
            }
          }
        }
        break

      case 'custom':
        // 自定义验证逻辑
        if (typeof rule.value === 'function') {
          return rule.value(value, config)
        }
        break
    }

    return {
      isValid: true,
      errors: [],
      warnings: []
    }
  }

  /**
   * 验证属性类型
   */
  private validateType(value: PropertyValue, config: PropertyConfig): ValidationResult {
    if (this.isEmpty(value)) {
      return { isValid: true, errors: [], warnings: [] }
    }

    const errors: ValidationError[] = []

    switch (config.type) {
      case 'number':
        if (typeof value !== 'number' && !this.isNumericString(value)) {
          errors.push({
            property: config.key,
            message: `${config.label}必须是数字`,
            value,
            rule: { type: 'custom', message: '类型错误' }
          })
        }
        break

      case 'boolean':
        if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
          errors.push({
            property: config.key,
            message: `${config.label}必须是布尔值`,
            value,
            rule: { type: 'custom', message: '类型错误' }
          })
        }
        break

      case 'date':
      case 'datetime':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          errors.push({
            property: config.key,
            message: `${config.label}必须是有效日期`,
            value,
            rule: { type: 'custom', message: '类型错误' }
          })
        }
        break

      case 'email':
        if (typeof value === 'string') {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailPattern.test(value)) {
            errors.push({
              property: config.key,
              message: `${config.label}必须是有效邮箱`,
              value,
              rule: { type: 'email', message: '邮箱格式错误' }
            })
          }
        }
        break

      case 'url':
        if (typeof value === 'string') {
          try {
            new URL(value)
          } catch {
            errors.push({
              property: config.key,
              message: `${config.label}必须是有效URL`,
              value,
              rule: { type: 'url', message: 'URL格式错误' }
            })
          }
        }
        break

      case 'json':
        if (typeof value === 'string') {
          try {
            JSON.parse(value)
          } catch {
            errors.push({
              property: config.key,
              message: `${config.label}必须是有效JSON`,
              value,
              rule: { type: 'custom', message: 'JSON格式错误' }
            })
          }
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    }
  }

  /**
   * 检查值是否为空
   */
  private isEmpty(value: PropertyValue): boolean {
    if (value === null || value === undefined || value === '') {
      return true
    }

    if (Array.isArray(value)) {
      return value.length === 0
    }

    return false
  }

  /**
   * 检查是否为数字字符串
   */
  private isNumericString(value: PropertyValue): boolean {
    if (typeof value !== 'string') return false
    return !isNaN(Number(value)) && !isNaN(parseFloat(value))
  }

  /**
   * 检查是否为有效日期字符串
   */
  private isValidDateString(value: PropertyValue): boolean {
    if (typeof value !== 'string') return false
    const date = new Date(value)
    return !isNaN(date.getTime())
  }
}

/**
 * 内置属性转换器
 */

// 字符串转数组转换器
export const stringToArrayTransformer: PropertyTransformer = {
  name: 'stringToArray',
  transform(value: PropertyValue): PropertyValue {
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(item => item.length > 0)
    }
    return value
  },
  reverse(value: PropertyValue): PropertyValue {
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return value
  }
}

// 数字转字符串转换器
export const numberToStringTransformer: PropertyTransformer = {
  name: 'numberToString',
  transform(value: PropertyValue): PropertyValue {
    if (typeof value === 'number') {
      return value.toString()
    }
    return value
  },
  reverse(value: PropertyValue): PropertyValue {
    if (typeof value === 'string' && !isNaN(Number(value))) {
      return Number(value)
    }
    return value
  }
}

// 布尔转字符串转换器
export const booleanToStringTransformer: PropertyTransformer = {
  name: 'booleanToString',
  transform(value: PropertyValue): PropertyValue {
    if (typeof value === 'boolean') {
      return value.toString()
    }
    return value
  },
  reverse(value: PropertyValue): PropertyValue {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  }
}

// 日期转字符串转换器
export const dateToStringTransformer: PropertyTransformer = {
  name: 'dateToString',
  transform(value: PropertyValue): PropertyValue {
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  },
  reverse(value: PropertyValue): PropertyValue {
    if (typeof value === 'string' && !isNaN(Date.parse(value))) {
      return new Date(value)
    }
    return value
  }
}

// 创建全局验证器实例
export const propertyValidator = new PropertyValidator()

// 注册内置转换器
propertyValidator.registerTransformer(stringToArrayTransformer)
propertyValidator.registerTransformer(numberToStringTransformer)
propertyValidator.registerTransformer(booleanToStringTransformer)
propertyValidator.registerTransformer(dateToStringTransformer)