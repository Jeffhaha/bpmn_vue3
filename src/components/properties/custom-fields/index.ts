/**
 * 自定义字段组件索引
 * 注册所有自定义字段组件
 */

import { customFieldRegistry } from './CustomFieldRegistry'
import CodeEditorField from './CodeEditorField.vue'
import ExpressionEditorField from './ExpressionEditorField.vue'

// 注册代码编辑器字段
customFieldRegistry.registerField({
  name: 'codeEditor',
  component: CodeEditorField,
  displayName: '代码编辑器',
  description: '支持多种编程语言的代码编辑器，具备语法高亮和验证功能',
  category: 'advanced',
  icon: 'fas fa-code',
  configSchema: [
    {
      key: 'language',
      label: '编程语言',
      type: 'select',
      defaultValue: 'javascript',
      options: [
        { label: 'JavaScript', value: 'javascript' },
        { label: 'TypeScript', value: 'typescript' },
        { label: 'JSON', value: 'json' },
        { label: 'XML', value: 'xml' },
        { label: 'YAML', value: 'yaml' },
        { label: 'SQL', value: 'sql' },
        { label: 'Python', value: 'python' },
        { label: 'Java', value: 'java' },
        { label: 'C#', value: 'csharp' },
        { label: 'HTML', value: 'html' },
        { label: 'CSS', value: 'css' },
        { label: 'Markdown', value: 'markdown' },
        { label: 'Shell', value: 'shell' },
        { label: 'Groovy', value: 'groovy' }
      ]
    },
    {
      key: 'theme',
      label: '主题',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: '默认', value: 'default' },
        { label: '暗色', value: 'dark' },
        { label: '高对比度', value: 'high-contrast' }
      ]
    },
    {
      key: 'allowFullscreen',
      label: '允许全屏',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'showLineNumbers',
      label: '显示行号',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'showFooter',
      label: '显示底部信息',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'autoFormat',
      label: '自动格式化',
      type: 'boolean',
      defaultValue: false
    }
  ],
  validator: (value, config, context) => {
    if (!value || typeof value !== 'string') {
      return false
    }
    
    const language = config.properties?.language || 'javascript'
    
    // 根据语言类型进行验证
    try {
      switch (language) {
        case 'json':
          JSON.parse(value)
          break
        case 'javascript':
        case 'typescript':
          new Function(value)
          break
        case 'xml':
          const parser = new DOMParser()
          const doc = parser.parseFromString(value, 'application/xml')
          const errorNode = doc.querySelector('parsererror')
          if (errorNode) throw new Error('XML语法错误')
          break
      }
      return true
    } catch {
      return false
    }
  },
  transformer: (value, direction) => {
    if (direction === 'in' && typeof value === 'string') {
      // 输入时的转换
      return value.trim()
    } else if (direction === 'out') {
      // 输出时的转换
      return String(value)
    }
    return value
  },
  preview: (value, config) => {
    if (!value) return '(空)'
    
    const str = String(value)
    const language = config.properties?.language || 'javascript'
    
    if (str.length > 50) {
      return `${language.toUpperCase()}: ${str.substring(0, 47)}...`
    }
    return `${language.toUpperCase()}: ${str}`
  }
})

// 注册表达式编辑器字段
customFieldRegistry.registerField({
  name: 'expressionEditor',
  component: ExpressionEditorField,
  displayName: '表达式编辑器',
  description: '用于编辑各种类型的表达式，支持语法验证和智能提示',
  category: 'advanced',
  icon: 'fas fa-function',
  configSchema: [
    {
      key: 'expressionType',
      label: '表达式类型',
      type: 'select',
      defaultValue: 'groovy',
      options: [
        { label: 'Groovy 表达式', value: 'groovy' },
        { label: 'JUEL 表达式', value: 'juel' },
        { label: 'JavaScript', value: 'javascript' },
        { label: 'Python', value: 'python' },
        { label: '条件表达式', value: 'condition' },
        { label: '自定义', value: 'custom' }
      ]
    },
    {
      key: 'enableSyntaxHighlight',
      label: '语法高亮',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'showVariables',
      label: '显示变量列表',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'showFunctions',
      label: '显示函数列表',
      type: 'boolean',
      defaultValue: true
    },
    {
      key: 'autoValidate',
      label: '自动验证',
      type: 'boolean',
      defaultValue: true
    }
  ],
  validator: (value, config, context) => {
    if (!value || typeof value !== 'string') {
      return false
    }
    
    const expressionType = config.properties?.expressionType || 'groovy'
    const expression = value.trim()
    
    try {
      switch (expressionType) {
        case 'groovy':
          return expression.startsWith('${') && expression.endsWith('}')
        case 'juel':
          return expression.startsWith('#{') && expression.endsWith('}')
        case 'javascript':
          new Function(expression)
          return true
        case 'condition':
          const validOperators = ['>', '<', '>=', '<=', '==', '!=', 'AND', 'OR', 'NOT']
          return validOperators.some(op => expression.includes(op))
        default:
          return true
      }
    } catch {
      return false
    }
  },
  transformer: (value, direction) => {
    if (direction === 'in' && typeof value === 'string') {
      return value.trim()
    }
    return value
  },
  preview: (value, config) => {
    if (!value) return '(空表达式)'
    
    const str = String(value)
    const expressionType = config.properties?.expressionType || 'groovy'
    
    if (str.length > 40) {
      return `${str.substring(0, 37)}...`
    }
    return str
  }
})

// 可以在这里注册更多的自定义字段...

/**
 * 获取所有已注册的自定义字段
 */
export function getRegisteredFields() {
  return customFieldRegistry.getAllFields()
}

/**
 * 获取指定类别的字段
 */
export function getFieldsByCategory(category: string) {
  return customFieldRegistry.getFieldsByCategory(category)
}

/**
 * 根据名称获取字段
 */
export function getField(name: string) {
  return customFieldRegistry.getField(name)
}

/**
 * 创建字段配置
 */
export function createFieldConfig(fieldName: string, overrides?: any) {
  return customFieldRegistry.createFieldConfig(fieldName, overrides)
}

/**
 * 搜索字段
 */
export function searchFields(query: string) {
  return customFieldRegistry.searchFields(query)
}

// 导出注册表实例
export { customFieldRegistry }