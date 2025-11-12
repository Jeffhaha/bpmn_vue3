/**
 * BPMN 2.0 完整连接对象模板包
 * 支持DynamicForm自定义属性和扩展配置
 * 包含各种类型的流程连接模板
 */

import type { NodeTemplate, PropertyValue } from '@/types'

/**
 * 连接模板配置接口 - 支持DynamicForm
 */
interface ConnectionTemplateConfig {
  // 基础配置
  name: string
  description: string
  nodeType: string
  icon: string
  
  // 连接特有属性
  connectionDefinition?: {
    isImmediate?: boolean
    conditionType?: 'none' | 'expression' | 'script'
    properties: Record<string, PropertyValue>
  }
  
  // DynamicForm配置
  dynamicFormConfig?: {
    sections: Array<{
      title: string
      fields: Array<{
        key: string
        type: 'text' | 'select' | 'checkbox' | 'textarea' | 'number' | 'date' | 'file'
        label: string
        required?: boolean
        options?: string[]
        description?: string
        validation?: {
          pattern?: string
          min?: number
          max?: number
        }
      }>
    }>
  }
  
  // UI配置
  colors: {
    stroke: string
    fill: string
    text: string
  }
  
  // 线条样式
  lineStyle?: {
    dashArray?: string
    strokeWidth?: number
    markerEnd?: string
  }
  
  // 使用示例
  examples: string[]
  
  // 企业场景标签
  enterpriseScenarios?: string[]
}

/**
 * 连接对象模板集合 (8个不同类型的连接模板)
 */
const connectionTemplateConfigs: ConnectionTemplateConfig[] = [

  {
    name: '标准流程线',
    description: '标准的流程连接线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-arrow-right',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'none',
      properties: {
        name: '',
        conditionExpression: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '标准流程配置',
        fields: [
          {
            key: 'name',
            type: 'text',
            label: '流程名称',
            description: '描述这个流程连接的作用'
          },
          {
            key: 'isImmediate',
            type: 'checkbox',
            label: '立即执行',
            description: '是否立即执行此流程'
          },
          {
            key: 'skipExpression',
            type: 'textarea',
            label: '跳过条件',
            description: '满足此条件时跳过该流程'
          }
        ]
      }]
    },
    colors: {
      stroke: '#666666',
      fill: 'none',
      text: '#333333'
    },
    lineStyle: {
      strokeWidth: 2,
      markerEnd: 'arrow'
    },
    examples: ['正常流程', '顺序执行', '标准连接'],
    enterpriseScenarios: ['标准流程', '顺序处理', '基本连接']
  },

  {
    name: '条件流程线',
    description: '带条件判断的流程连接线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-question-circle',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'expression',
      properties: {
        name: '',
        conditionExpression: '',
        conditionLanguage: 'javascript'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '条件流程配置',
        fields: [
          {
            key: 'conditionExpression',
            type: 'textarea',
            label: '条件表达式',
            required: true,
            description: '决定是否执行此流程的条件'
          },
          {
            key: 'conditionLanguage',
            type: 'select',
            label: '表达式语言',
            options: ['javascript', 'groovy', 'juel', 'python'],
            required: true
          },
          {
            key: 'fallbackAction',
            type: 'select',
            label: '条件失败处理',
            options: ['skip', 'error', 'default_path', 'manual']
          },
          {
            key: 'evaluationTimeout',
            type: 'number',
            label: '评估超时(秒)',
            validation: { min: 1, max: 300 }
          }
        ]
      }]
    },
    colors: {
      stroke: '#ff9800',
      fill: 'none',
      text: '#f57c00'
    },
    lineStyle: {
      strokeWidth: 2,
      markerEnd: 'arrow'
    },
    examples: ['条件分支', '判断流程', '逻辑控制'],
    enterpriseScenarios: ['条件路由', '业务判断', '逻辑分支']
  },

  {
    name: '默认流程线',
    description: '网关的默认流程路径',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-route',
    connectionDefinition: {
      isImmediate: true,
      conditionType: 'none',
      properties: {
        name: 'default',
        isDefault: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '默认流程配置',
        fields: [
          {
            key: 'defaultReason',
            type: 'textarea',
            label: '默认原因',
            description: '说明为什么这是默认路径'
          },
          {
            key: 'priority',
            type: 'number',
            label: '优先级',
            validation: { min: 1, max: 10 },
            description: '在多个默认路径中的优先级'
          },
          {
            key: 'fallbackEnabled',
            type: 'checkbox',
            label: '启用回退',
            description: '当默认路径失败时是否启用回退'
          }
        ]
      }]
    },
    colors: {
      stroke: '#4caf50',
      fill: 'none',
      text: '#388e3c'
    },
    lineStyle: {
      strokeWidth: 3,
      markerEnd: 'arrow'
    },
    examples: ['默认路径', '失败回退', '兜底流程'],
    enterpriseScenarios: ['异常处理', '默认路由', '容错设计']
  },

  {
    name: '优先流程线',
    description: '高优先级的快速流程线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-bolt',
    connectionDefinition: {
      isImmediate: true,
      conditionType: 'expression',
      properties: {
        name: 'priority',
        priority: 'high',
        fastTrack: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '优先流程配置',
        fields: [
          {
            key: 'priority',
            type: 'select',
            label: '优先级别',
            options: ['low', 'normal', 'high', 'urgent', 'critical'],
            required: true
          },
          {
            key: 'fastTrack',
            type: 'checkbox',
            label: '快速通道',
            description: '是否启用快速处理通道'
          },
          {
            key: 'slaTime',
            type: 'number',
            label: 'SLA时间(分钟)',
            validation: { min: 1 },
            description: '服务级别协议时间要求'
          },
          {
            key: 'escalationRules',
            type: 'textarea',
            label: '升级规则',
            description: '超时或异常时的升级处理规则'
          }
        ]
      }]
    },
    colors: {
      stroke: '#f44336',
      fill: 'none',
      text: '#d32f2f'
    },
    lineStyle: {
      strokeWidth: 3,
      markerEnd: 'arrow',
      dashArray: '5,5'
    },
    examples: ['紧急处理', 'VIP通道', '快速审批'],
    enterpriseScenarios: ['紧急流程', 'VIP服务', 'SLA管理']
  },

  {
    name: '异步流程线',
    description: '异步执行的流程连接线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-sync-alt',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'none',
      properties: {
        name: 'async',
        asyncExecution: true,
        queueName: 'default'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '异步流程配置',
        fields: [
          {
            key: 'asyncExecution',
            type: 'checkbox',
            label: '异步执行',
            description: '是否以异步方式执行'
          },
          {
            key: 'queueName',
            type: 'text',
            label: '队列名称',
            description: '异步处理队列的名称'
          },
          {
            key: 'retryPolicy',
            type: 'select',
            label: '重试策略',
            options: ['none', 'fixed_delay', 'exponential_backoff', 'custom']
          },
          {
            key: 'maxRetries',
            type: 'number',
            label: '最大重试次数',
            validation: { min: 0, max: 10 }
          }
        ]
      }]
    },
    colors: {
      stroke: '#9c27b0',
      fill: 'none',
      text: '#7b1fa2'
    },
    lineStyle: {
      strokeWidth: 2,
      markerEnd: 'arrow',
      dashArray: '10,5'
    },
    examples: ['后台处理', '队列任务', '延迟执行'],
    enterpriseScenarios: ['异步处理', '队列系统', '后台任务']
  },

  {
    name: '补偿流程线',
    description: '补偿和回滚的流程连接线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-undo',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'none',
      properties: {
        name: 'compensation',
        isCompensation: true,
        triggerCondition: 'error'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '补偿流程配置',
        fields: [
          {
            key: 'triggerCondition',
            type: 'select',
            label: '触发条件',
            options: ['error', 'cancel', 'manual', 'timeout'],
            required: true,
            description: '触发补偿的条件'
          },
          {
            key: 'compensationScope',
            type: 'select',
            label: '补偿范围',
            options: ['activity', 'subprocess', 'process', 'global']
          },
          {
            key: 'rollbackSteps',
            type: 'textarea',
            label: '回滚步骤',
            description: '详细的回滚操作步骤'
          },
          {
            key: 'notificationRequired',
            type: 'checkbox',
            label: '需要通知',
            description: '执行补偿时是否发送通知'
          }
        ]
      }]
    },
    colors: {
      stroke: '#ff5722',
      fill: 'none',
      text: '#d84315'
    },
    lineStyle: {
      strokeWidth: 2,
      markerEnd: 'compensation-arrow',
      dashArray: '3,3'
    },
    examples: ['错误恢复', '事务回滚', '补偿处理'],
    enterpriseScenarios: ['异常处理', '事务管理', '错误恢复']
  },

  {
    name: '监控流程线',
    description: '带有监控和日志的流程线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-eye',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'none',
      properties: {
        name: 'monitored',
        enableLogging: true,
        metricsCollection: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '监控流程配置',
        fields: [
          {
            key: 'enableLogging',
            type: 'checkbox',
            label: '启用日志',
            description: '记录流程执行日志'
          },
          {
            key: 'metricsCollection',
            type: 'checkbox',
            label: '收集指标',
            description: '收集性能和业务指标'
          },
          {
            key: 'alertThreshold',
            type: 'number',
            label: '告警阈值(秒)',
            validation: { min: 1 },
            description: '执行时间超过此值时告警'
          },
          {
            key: 'tracingEnabled',
            type: 'checkbox',
            label: '启用追踪',
            description: '启用分布式追踪'
          }
        ]
      }]
    },
    colors: {
      stroke: '#607d8b',
      fill: 'none',
      text: '#455a64'
    },
    lineStyle: {
      strokeWidth: 2,
      markerEnd: 'arrow'
    },
    examples: ['性能监控', '业务追踪', '日志记录'],
    enterpriseScenarios: ['性能监控', '业务分析', '运维管理']
  },

  {
    name: '安全流程线',
    description: '带有安全检查的流程连接线',
    nodeType: 'bpmn:SequenceFlow',
    icon: 'fas fa-shield-alt',
    connectionDefinition: {
      isImmediate: false,
      conditionType: 'expression',
      properties: {
        name: 'secure',
        securityCheck: true,
        encryptionRequired: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '安全流程配置',
        fields: [
          {
            key: 'securityCheck',
            type: 'checkbox',
            label: '安全检查',
            description: '执行安全验证'
          },
          {
            key: 'encryptionRequired',
            type: 'checkbox',
            label: '需要加密',
            description: '传输数据是否需要加密'
          },
          {
            key: 'authenticationLevel',
            type: 'select',
            label: '认证级别',
            options: ['basic', 'two_factor', 'certificate', 'biometric'],
            description: '所需的认证级别'
          },
          {
            key: 'auditTrail',
            type: 'checkbox',
            label: '审计跟踪',
            description: '记录详细的审计日志'
          }
        ]
      }]
    },
    colors: {
      stroke: '#795548',
      fill: 'none',
      text: '#5d4037'
    },
    lineStyle: {
      strokeWidth: 3,
      markerEnd: 'arrow'
    },
    examples: ['安全验证', '数据保护', '合规流程'],
    enterpriseScenarios: ['安全控制', '合规管理', '数据保护']
  }
]

/**
 * 创建连接模板
 */
function createConnectionTemplate(config: ConnectionTemplateConfig, categoryId: string): Omit<NodeTemplate, 'id' | 'metadata'> {
  return {
    name: config.name,
    description: config.description,
    category: categoryId,
    icon: config.icon,
    nodeType: config.nodeType,
    properties: {
      // 基础BPMN属性
      name: config.name,
      
      // 连接定义属性
      ...config.connectionDefinition?.properties,
      
      // DynamicForm扩展属性
      dynamicFormConfig: config.dynamicFormConfig,
      
      // 企业场景标签
      enterpriseScenarios: config.enterpriseScenarios
    },
    uiConfig: {
      shape: 'edge',
      size: { width: 0, height: 0 }, // 连接线没有固定尺寸
      colors: config.colors,
      lineStyle: config.lineStyle
    },
    templateConfig: {
      isDefault: true,
      isCustomizable: true,
      requiredFields: ['name'],
      defaultValues: {
        name: config.name
      }
    },
    preview: {
      thumbnail: `connection-${config.name.replace(/\s+/g, '-').toLowerCase()}-thumb.svg`,
      description: config.description,
      examples: config.examples
    }
  }
}

/**
 * 获取所有连接模板 (8个)
 */
export function getAllConnectionTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return connectionTemplateConfigs.map(config => createConnectionTemplate(config, categoryId))
}

/**
 * 按类型获取连接模板
 */
export function getBasicConnectionTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return connectionTemplateConfigs.slice(0, 4).map(config => createConnectionTemplate(config, categoryId))
}

export function getAdvancedConnectionTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return connectionTemplateConfigs.slice(4).map(config => createConnectionTemplate(config, categoryId))
}

/**
 * 按企业场景获取连接模板
 */
export function getConnectionTemplatesByScenario(categoryId: string, scenario: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return connectionTemplateConfigs
    .filter(config => config.enterpriseScenarios?.includes(scenario))
    .map(config => createConnectionTemplate(config, categoryId))
}