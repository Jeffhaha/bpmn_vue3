/**
 * BPMN 2.0 完整网关模板包
 * 支持DynamicForm自定义属性和扩展配置
 * 从4个基础网关扩展到12个企业级网关模板
 */

import type { NodeTemplate, PropertyValue } from '@/types'

/**
 * 网关模板配置接口 - 支持DynamicForm
 */
interface GatewayTemplateConfig {
  // 基础配置
  name: string
  description: string
  nodeType: string
  icon: string
  
  // 网关特有属性
  gatewayDefinition?: {
    direction: 'Unspecified' | 'Converging' | 'Diverging' | 'Mixed'
    defaultFlow?: string
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
    fill: string
    stroke: string
    text: string
  }
  
  // 使用示例
  examples: string[]
  
  // 企业场景标签
  enterpriseScenarios?: string[]
}

/**
 * 核心网关模板集合 (4个基础 + 8个扩展 = 12个)
 */
const gatewayTemplateConfigs: GatewayTemplateConfig[] = [
  
  // === 4个基础网关模板（保持现有） ===
  
  {
    name: '排他网关',
    description: '基于条件的单一路径选择',
    nodeType: 'bpmn:ExclusiveGateway',
    icon: 'fas fa-times-circle',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        gatewayDirection: 'Diverging',
        defaultFlow: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '排他网关配置',
        fields: [
          {
            key: 'gatewayDirection',
            type: 'select',
            label: '网关方向',
            options: ['Unspecified', 'Converging', 'Diverging', 'Mixed'],
            required: true
          },
          {
            key: 'defaultFlow',
            type: 'text',
            label: '默认流向',
            description: '当所有条件都不满足时的默认路径'
          },
          {
            key: 'decisionCriteria',
            type: 'textarea',
            label: '决策标准',
            description: '网关决策的业务规则说明'
          }
        ]
      }]
    },
    colors: {
      fill: '#ffe8cc',
      stroke: '#ff9800',
      text: '#e65100'
    },
    examples: ['条件分支', '审批分流', '风险判断'],
    enterpriseScenarios: ['审批流程', '风险控制', '业务分流']
  },

  {
    name: '并行网关',
    description: '同时执行多个路径',
    nodeType: 'bpmn:ParallelGateway',
    icon: 'fas fa-plus-circle',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        gatewayDirection: 'Diverging',
        synchronization: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '并行网关配置',
        fields: [
          {
            key: 'gatewayDirection',
            type: 'select',
            label: '网关方向',
            options: ['Diverging', 'Converging', 'Mixed'],
            required: true
          },
          {
            key: 'synchronization',
            type: 'checkbox',
            label: '同步等待',
            description: '是否等待所有分支完成'
          },
          {
            key: 'maxConcurrency',
            type: 'number',
            label: '最大并发数',
            validation: { min: 1, max: 20 },
            description: '同时执行的最大分支数'
          },
          {
            key: 'timeout',
            type: 'number',
            label: '超时时间(秒)',
            description: '等待分支完成的最大时间'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8f5e8',
      stroke: '#4caf50',
      text: '#2e7d32'
    },
    examples: ['并行审批', '多任务执行', '同步处理'],
    enterpriseScenarios: ['多部门协作', '并行处理', '工作流优化']
  },

  {
    name: '包容网关',
    description: '基于条件的多路径选择',
    nodeType: 'bpmn:InclusiveGateway',
    icon: 'fas fa-circle-notch',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        gatewayDirection: 'Diverging',
        evaluateAll: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '包容网关配置',
        fields: [
          {
            key: 'gatewayDirection',
            type: 'select',
            label: '网关方向',
            options: ['Diverging', 'Converging', 'Mixed'],
            required: true
          },
          {
            key: 'evaluateAll',
            type: 'checkbox',
            label: '评估所有条件',
            description: '是否评估所有分支条件'
          },
          {
            key: 'minimumActivations',
            type: 'number',
            label: '最少激活分支',
            validation: { min: 1 },
            description: '至少需要激活的分支数量'
          },
          {
            key: 'convergenceTimeout',
            type: 'number',
            label: '汇聚超时(秒)',
            description: '等待分支汇聚的超时时间'
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#9c27b0',
      text: '#6a1b9a'
    },
    examples: ['多条件分支', '可选任务', '灵活汇聚'],
    enterpriseScenarios: ['复杂审批', '条件处理', '灵活流程']
  },

  {
    name: '事件网关',
    description: '基于事件的路径选择',
    nodeType: 'bpmn:EventBasedGateway',
    icon: 'fas fa-bolt',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        gatewayDirection: 'Diverging',
        instantiate: false,
        eventGatewayType: 'Exclusive'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '事件网关配置',
        fields: [
          {
            key: 'eventGatewayType',
            type: 'select',
            label: '事件网关类型',
            options: ['Exclusive', 'Parallel'],
            required: true,
            description: '事件处理方式'
          },
          {
            key: 'instantiate',
            type: 'checkbox',
            label: '实例化',
            description: '是否可以实例化流程'
          },
          {
            key: 'eventTimeout',
            type: 'number',
            label: '事件超时(秒)',
            description: '等待事件的最大时间'
          },
          {
            key: 'priorityEvents',
            type: 'textarea',
            label: '优先事件',
            description: '逗号分隔的优先处理事件列表'
          }
        ]
      }]
    },
    colors: {
      fill: '#e1f5fe',
      stroke: '#03a9f4',
      text: '#0277bd'
    },
    examples: ['事件监听', '消息选择', '超时处理'],
    enterpriseScenarios: ['事件驱动', '消息处理', '异步流程']
  },

  // === 8个新增企业级网关模板 ===

  {
    name: '复杂网关',
    description: '支持复杂表达式的高级决策网关',
    nodeType: 'bpmn:ComplexGateway',
    icon: 'fas fa-project-diagram',
    gatewayDefinition: {
      direction: 'Mixed',
      properties: {
        gatewayDirection: 'Mixed',
        activationCondition: '',
        complexExpression: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '复杂网关配置',
        fields: [
          {
            key: 'activationCondition',
            type: 'textarea',
            label: '激活条件',
            required: true,
            description: '复杂的激活条件表达式'
          },
          {
            key: 'complexExpression',
            type: 'textarea',
            label: '复杂表达式',
            description: '自定义的复杂逻辑表达式'
          },
          {
            key: 'evaluationMode',
            type: 'select',
            label: '评估模式',
            options: ['sequential', 'parallel', 'custom'],
            description: '条件评估的执行模式'
          },
          {
            key: 'fallbackStrategy',
            type: 'select',
            label: '失败策略',
            options: ['terminate', 'default_path', 'retry', 'manual']
          }
        ]
      }]
    },
    colors: {
      fill: '#fce4ec',
      stroke: '#e91e63',
      text: '#ad1457'
    },
    examples: ['多维度决策', '复杂业务规则', '智能路由'],
    enterpriseScenarios: ['智能决策', '复杂业务', '高级路由']
  },

  {
    name: '数据驱动网关',
    description: '基于数据分析的智能决策网关',
    nodeType: 'bpmn:ExclusiveGateway',
    icon: 'fas fa-chart-line',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        dataSource: '',
        analysisType: 'rule_based',
        threshold: 0.8
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '数据驱动配置',
        fields: [
          {
            key: 'dataSource',
            type: 'text',
            label: '数据源',
            required: true,
            description: '用于决策的数据源标识'
          },
          {
            key: 'analysisType',
            type: 'select',
            label: '分析类型',
            options: ['rule_based', 'ml_prediction', 'statistical', 'heuristic'],
            description: '数据分析方法'
          },
          {
            key: 'threshold',
            type: 'number',
            label: '决策阈值',
            validation: { min: 0, max: 1 },
            description: '触发决策的置信度阈值'
          },
          {
            key: 'modelEndpoint',
            type: 'text',
            label: '模型端点',
            description: '机器学习模型API端点'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8f5e8',
      stroke: '#4caf50',
      text: '#388e3c'
    },
    examples: ['智能推荐', '预测分析', 'AI决策'],
    enterpriseScenarios: ['智能决策', '数据分析', '预测建模']
  },

  {
    name: '负载均衡网关',
    description: '基于负载的任务分发网关',
    nodeType: 'bpmn:ParallelGateway',
    icon: 'fas fa-balance-scale',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        balancingStrategy: 'round_robin',
        maxLoad: 100,
        healthCheck: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '负载均衡配置',
        fields: [
          {
            key: 'balancingStrategy',
            type: 'select',
            label: '均衡策略',
            options: ['round_robin', 'weighted', 'least_connections', 'cpu_based'],
            required: true
          },
          {
            key: 'maxLoad',
            type: 'number',
            label: '最大负载',
            validation: { min: 1, max: 1000 },
            description: '单个节点最大处理能力'
          },
          {
            key: 'healthCheck',
            type: 'checkbox',
            label: '健康检查',
            description: '启用节点健康状态检查'
          },
          {
            key: 'failoverEnabled',
            type: 'checkbox',
            label: '故障转移',
            description: '启用自动故障转移'
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f2f1',
      stroke: '#009688',
      text: '#00695c'
    },
    examples: ['任务分发', '负载分配', '资源优化'],
    enterpriseScenarios: ['高并发处理', '资源管理', '性能优化']
  },

  {
    name: '优先级网关',
    description: '基于优先级的任务路由网关',
    nodeType: 'bpmn:InclusiveGateway',
    icon: 'fas fa-sort-amount-up',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        priorityRules: '',
        queueStrategy: 'priority',
        maxPriorityLevel: 5
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '优先级配置',
        fields: [
          {
            key: 'priorityRules',
            type: 'textarea',
            label: '优先级规则',
            required: true,
            description: 'JSON格式的优先级规则定义'
          },
          {
            key: 'queueStrategy',
            type: 'select',
            label: '队列策略',
            options: ['priority', 'fifo', 'lifo', 'spt', 'edd'],
            description: '任务队列处理策略'
          },
          {
            key: 'maxPriorityLevel',
            type: 'number',
            label: '最大优先级',
            validation: { min: 1, max: 10 },
            description: '系统支持的最大优先级级别'
          },
          {
            key: 'preemptive',
            type: 'checkbox',
            label: '抢占式',
            description: '高优先级任务是否可以抢占低优先级任务'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#ff9800',
      text: '#f57c00'
    },
    examples: ['紧急处理', 'VIP优先', '资源抢占'],
    enterpriseScenarios: ['任务调度', '资源分配', '优先级管理']
  },

  {
    name: '时间窗口网关',
    description: '基于时间窗口的条件路由网关',
    nodeType: 'bpmn:EventBasedGateway',
    icon: 'fas fa-clock',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        timeWindow: '',
        timezone: 'UTC',
        workingHours: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '时间窗口配置',
        fields: [
          {
            key: 'timeWindow',
            type: 'text',
            label: '时间窗口',
            required: true,
            description: 'Cron表达式或时间范围 (如 09:00-17:00)'
          },
          {
            key: 'timezone',
            type: 'select',
            label: '时区',
            options: ['UTC', 'Asia/Shanghai', 'America/New_York', 'Europe/London'],
            description: '时间窗口所在时区'
          },
          {
            key: 'workingHours',
            type: 'checkbox',
            label: '工作时间',
            description: '是否仅在工作时间执行'
          },
          {
            key: 'holidayCalendar',
            type: 'text',
            label: '假期日历',
            description: '假期日历服务端点或配置'
          }
        ]
      }]
    },
    colors: {
      fill: '#f1f8e9',
      stroke: '#689f38',
      text: '#558b2f'
    },
    examples: ['定时任务', '工作时间路由', '假期处理'],
    enterpriseScenarios: ['时间管理', '工作流调度', '业务时间控制']
  },

  {
    name: '地理位置网关',
    description: '基于地理位置的路径选择网关',
    nodeType: 'bpmn:ExclusiveGateway',
    icon: 'fas fa-map-marker-alt',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        locationService: '',
        geofencing: true,
        radiusKm: 10
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '地理位置配置',
        fields: [
          {
            key: 'locationService',
            type: 'text',
            label: '位置服务',
            required: true,
            description: '地理位置服务API端点'
          },
          {
            key: 'geofencing',
            type: 'checkbox',
            label: '地理围栏',
            description: '启用地理围栏检查'
          },
          {
            key: 'radiusKm',
            type: 'number',
            label: '半径(公里)',
            validation: { min: 0.1, max: 1000 },
            description: '地理围栏半径'
          },
          {
            key: 'coordinates',
            type: 'text',
            label: '坐标',
            description: '中心点坐标 (纬度,经度)'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8eaf6',
      stroke: '#3f51b5',
      text: '#303f9f'
    },
    examples: ['位置服务', '区域分发', '就近处理'],
    enterpriseScenarios: ['物流配送', '区域管理', 'LBS应用']
  },

  {
    name: '权限网关',
    description: '基于用户权限的访问控制网关',
    nodeType: 'bpmn:ExclusiveGateway',
    icon: 'fas fa-shield-alt',
    gatewayDefinition: {
      direction: 'Diverging',
      properties: {
        authenticationRequired: true,
        roleBasedAccess: true,
        permissionLevel: 'read'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '权限控制配置',
        fields: [
          {
            key: 'authenticationRequired',
            type: 'checkbox',
            label: '需要认证',
            description: '是否要求用户认证'
          },
          {
            key: 'roleBasedAccess',
            type: 'checkbox',
            label: '基于角色',
            description: '启用基于角色的访问控制'
          },
          {
            key: 'permissionLevel',
            type: 'select',
            label: '权限级别',
            options: ['read', 'write', 'admin', 'owner'],
            description: '所需的最低权限级别'
          },
          {
            key: 'allowedRoles',
            type: 'textarea',
            label: '允许角色',
            description: '逗号分隔的允许访问的角色列表'
          }
        ]
      }]
    },
    colors: {
      fill: '#ffebee',
      stroke: '#f44336',
      text: '#d32f2f'
    },
    examples: ['权限检查', '访问控制', '安全网关'],
    enterpriseScenarios: ['安全控制', '权限管理', '合规检查']
  },

  {
    name: '性能监控网关',
    description: '集成性能监控的智能路由网关',
    nodeType: 'bpmn:ParallelGateway',
    icon: 'fas fa-tachometer-alt',
    gatewayDefinition: {
      direction: 'Mixed',
      properties: {
        monitoringEnabled: true,
        performanceThreshold: 5000,
        alerting: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '性能监控配置',
        fields: [
          {
            key: 'monitoringEnabled',
            type: 'checkbox',
            label: '启用监控',
            description: '是否启用性能监控'
          },
          {
            key: 'performanceThreshold',
            type: 'number',
            label: '性能阈值(毫秒)',
            validation: { min: 100, max: 60000 },
            description: '触发告警的性能阈值'
          },
          {
            key: 'alerting',
            type: 'checkbox',
            label: '启用告警',
            description: '性能超标时是否发送告警'
          },
          {
            key: 'metricsEndpoint',
            type: 'text',
            label: '指标端点',
            description: '性能指标收集端点'
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f7fa',
      stroke: '#00acc1',
      text: '#0097a7'
    },
    examples: ['性能监控', '系统诊断', '性能优化'],
    enterpriseScenarios: ['性能管理', '系统监控', 'SLA管理']
  }
]

/**
 * 创建网关模板
 */
function createGatewayTemplate(config: GatewayTemplateConfig, categoryId: string): Omit<NodeTemplate, 'id' | 'metadata'> {
  return {
    name: config.name,
    description: config.description,
    category: categoryId,
    icon: config.icon,
    nodeType: config.nodeType,
    properties: {
      // 基础BPMN属性
      name: config.name,
      
      // 网关定义属性
      ...config.gatewayDefinition?.properties,
      
      // DynamicForm扩展属性
      dynamicFormConfig: config.dynamicFormConfig,
      
      // 企业场景标签
      enterpriseScenarios: config.enterpriseScenarios
    },
    uiConfig: {
      shape: 'diamond',
      size: { width: 50, height: 50 },
      colors: config.colors
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
      thumbnail: `${config.nodeType.split(':')[1].toLowerCase()}-thumb.svg`,
      description: config.description,
      examples: config.examples
    }
  }
}

/**
 * 获取所有网关模板 (12个)
 */
export function getAllGatewayTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return gatewayTemplateConfigs.map(config => createGatewayTemplate(config, categoryId))
}

/**
 * 按类型获取网关模板
 */
export function getBasicGatewayTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return gatewayTemplateConfigs.slice(0, 4).map(config => createGatewayTemplate(config, categoryId))
}

export function getAdvancedGatewayTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return gatewayTemplateConfigs.slice(4).map(config => createGatewayTemplate(config, categoryId))
}

/**
 * 按企业场景获取网关模板
 */
export function getGatewayTemplatesByScenario(categoryId: string, scenario: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return gatewayTemplateConfigs
    .filter(config => config.enterpriseScenarios?.includes(scenario))
    .map(config => createGatewayTemplate(config, categoryId))
}