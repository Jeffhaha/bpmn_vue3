/**
 * BPMN 2.0 完整任务模板包
 * 支持DynamicForm自定义属性和扩展配置
 * 从7个基础任务扩展到15个企业级任务模板
 */

import type { NodeTemplate, PropertyValue } from '@/types'

/**
 * 任务模板配置接口 - 支持DynamicForm
 */
interface TaskTemplateConfig {
  // 基础配置
  name: string
  description: string
  nodeType: string
  icon: string
  
  // 任务特有属性
  taskDefinition?: {
    type: 'implementation' | 'class' | 'expression' | 'delegateExpression'
    implementation?: string
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
 * 核心任务模板集合 (7个基础 + 8个扩展 = 15个)
 */
const taskTemplateConfigs: TaskTemplateConfig[] = [
  
  // === 7个基础任务模板（保持现有） ===
  
  {
    name: '用户任务',
    description: '需要人工处理的任务',
    nodeType: 'bpmn:UserTask',
    icon: 'fas fa-user',
    taskDefinition: {
      type: 'implementation',
      implementation: 'userTask',
      properties: {
        assignee: '',
        candidateUsers: '',
        candidateGroups: '',
        formKey: '',
        priority: '50',
        dueDate: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '用户任务配置',
        fields: [
          {
            key: 'assignee',
            type: 'text',
            label: '指定处理人',
            description: '直接指定任务处理人的用户ID'
          },
          {
            key: 'candidateUsers',
            type: 'textarea',
            label: '候选用户',
            description: '逗号分隔的候选用户列表'
          },
          {
            key: 'candidateGroups',
            type: 'textarea',
            label: '候选组',
            description: '逗号分隔的候选组列表'
          },
          {
            key: 'formKey',
            type: 'text',
            label: '表单键',
            description: '关联的表单标识符'
          },
          {
            key: 'priority',
            type: 'number',
            label: '优先级',
            validation: { min: 1, max: 100 },
            description: '任务优先级 (1-100)'
          },
          {
            key: 'dueDate',
            type: 'date',
            label: '到期时间',
            description: '任务完成截止日期'
          }
        ]
      }]
    },
    colors: {
      fill: '#e1f5fe',
      stroke: '#0277bd',
      text: '#01579b'
    },
    examples: ['审批任务', '填写表单', '人工检查'],
    enterpriseScenarios: ['审批流程', '人力资源', '客户服务']
  },

  {
    name: '服务任务',
    description: '自动执行的服务调用',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-cog',
    taskDefinition: {
      type: 'implementation',
      implementation: 'webService',
      properties: {
        implementation: 'webService',
        operationRef: '',
        endpoint: '',
        method: 'POST',
        headers: '',
        timeout: '30000'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '服务调用配置',
        fields: [
          {
            key: 'implementation',
            type: 'select',
            label: '实现类型',
            options: ['webService', 'javaClass', 'expression', 'delegateExpression'],
            required: true
          },
          {
            key: 'operationRef',
            type: 'text',
            label: '操作引用',
            description: 'Web服务操作的引用'
          },
          {
            key: 'endpoint',
            type: 'text',
            label: '服务端点',
            description: 'API端点URL'
          },
          {
            key: 'method',
            type: 'select',
            label: 'HTTP方法',
            options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
          },
          {
            key: 'headers',
            type: 'textarea',
            label: 'HTTP头',
            description: 'JSON格式的HTTP请求头'
          },
          {
            key: 'timeout',
            type: 'number',
            label: '超时时间(毫秒)',
            validation: { min: 1000, max: 300000 }
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#7b1fa2',
      text: '#4a148c'
    },
    examples: ['API调用', '数据处理', '发送邮件'],
    enterpriseScenarios: ['系统集成', '数据同步', '第三方服务']
  },

  {
    name: '脚本任务',
    description: '执行脚本代码的任务',
    nodeType: 'bpmn:ScriptTask',
    icon: 'fas fa-code',
    taskDefinition: {
      type: 'implementation',
      implementation: 'script',
      properties: {
        scriptFormat: 'javascript',
        script: '',
        resultVariable: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '脚本执行配置',
        fields: [
          {
            key: 'scriptFormat',
            type: 'select',
            label: '脚本语言',
            options: ['javascript', 'groovy', 'python', 'juel'],
            required: true
          },
          {
            key: 'script',
            type: 'textarea',
            label: '脚本代码',
            required: true,
            description: '要执行的脚本代码'
          },
          {
            key: 'resultVariable',
            type: 'text',
            label: '结果变量',
            description: '存储脚本执行结果的变量名'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8f5e8',
      stroke: '#4caf50',
      text: '#2e7d32'
    },
    examples: ['数据转换', '业务逻辑', '计算处理'],
    enterpriseScenarios: ['数据处理', '业务规则', '自动化脚本']
  },

  {
    name: '业务规则任务',
    description: '执行业务规则引擎',
    nodeType: 'bpmn:BusinessRuleTask',
    icon: 'fas fa-gavel',
    taskDefinition: {
      type: 'implementation',
      implementation: 'dmn',
      properties: {
        implementation: 'dmn',
        decisionRef: '',
        decisionRefBinding: 'latest',
        decisionRefVersion: '',
        resultVariable: '',
        mapDecisionResult: 'singleEntry'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '业务规则配置',
        fields: [
          {
            key: 'decisionRef',
            type: 'text',
            label: '决策引用',
            required: true,
            description: 'DMN决策表的引用'
          },
          {
            key: 'decisionRefBinding',
            type: 'select',
            label: '决策绑定',
            options: ['latest', 'deployment', 'version'],
            description: '决策版本绑定方式'
          },
          {
            key: 'decisionRefVersion',
            type: 'text',
            label: '决策版本',
            description: '指定的决策版本号'
          },
          {
            key: 'resultVariable',
            type: 'text',
            label: '结果变量',
            description: '存储决策结果的变量名'
          },
          {
            key: 'mapDecisionResult',
            type: 'select',
            label: '结果映射',
            options: ['singleEntry', 'singleResult', 'collectEntries', 'resultList']
          }
        ]
      }]
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#ff9800',
      text: '#e65100'
    },
    examples: ['风控检查', '规则判断', 'DMN决策'],
    enterpriseScenarios: ['风险控制', '合规检查', '智能决策']
  },

  {
    name: '发送任务',
    description: '发送消息或邮件',
    nodeType: 'bpmn:SendTask',
    icon: 'fas fa-paper-plane',
    taskDefinition: {
      type: 'implementation',
      implementation: 'webService',
      properties: {
        messageRef: '',
        implementation: 'webService',
        operationRef: '',
        recipient: '',
        subject: '',
        body: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '消息发送配置',
        fields: [
          {
            key: 'messageRef',
            type: 'text',
            label: '消息引用',
            description: '要发送的消息类型引用'
          },
          {
            key: 'recipient',
            type: 'text',
            label: '收件人',
            required: true,
            description: '邮件收件人地址或用户ID'
          },
          {
            key: 'subject',
            type: 'text',
            label: '主题',
            required: true,
            description: '邮件或消息主题'
          },
          {
            key: 'body',
            type: 'textarea',
            label: '内容',
            required: true,
            description: '邮件或消息内容'
          },
          {
            key: 'attachments',
            type: 'file',
            label: '附件',
            description: '邮件附件文件'
          }
        ]
      }]
    },
    colors: {
      fill: '#fce4ec',
      stroke: '#e91e63',
      text: '#ad1457'
    },
    examples: ['发送邮件', '短信通知', '系统消息'],
    enterpriseScenarios: ['通知服务', '客户沟通', '系统集成']
  },

  {
    name: '接收任务',
    description: '等待接收消息',
    nodeType: 'bpmn:ReceiveTask',
    icon: 'fas fa-inbox',
    taskDefinition: {
      type: 'implementation',
      implementation: 'messageReceiver',
      properties: {
        messageRef: '',
        instantiate: false,
        correlationKey: '',
        timeout: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '消息接收配置',
        fields: [
          {
            key: 'messageRef',
            type: 'text',
            label: '消息引用',
            required: true,
            description: '要接收的消息类型引用'
          },
          {
            key: 'instantiate',
            type: 'checkbox',
            label: '实例化',
            description: '是否可以实例化流程'
          },
          {
            key: 'correlationKey',
            type: 'text',
            label: '关联键',
            description: '消息关联标识'
          },
          {
            key: 'timeout',
            type: 'number',
            label: '超时时间(秒)',
            validation: { min: 1 },
            description: '等待消息的最大时间'
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f2f1',
      stroke: '#009688',
      text: '#00695c'
    },
    examples: ['等待回复', '接收通知', '监听事件'],
    enterpriseScenarios: ['异步处理', '系统集成', '事件驱动']
  },

  {
    name: '手动任务',
    description: '人工执行的手动操作',
    nodeType: 'bpmn:ManualTask',
    icon: 'fas fa-hand-paper',
    taskDefinition: {
      type: 'implementation',
      implementation: 'manual',
      properties: {
        instructions: '',
        estimatedDuration: '',
        skillsRequired: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '手动任务配置',
        fields: [
          {
            key: 'instructions',
            type: 'textarea',
            label: '操作说明',
            required: true,
            description: '详细的手动操作指导'
          },
          {
            key: 'estimatedDuration',
            type: 'number',
            label: '预计时长(分钟)',
            validation: { min: 1 },
            description: '预估完成时间'
          },
          {
            key: 'skillsRequired',
            type: 'textarea',
            label: '技能要求',
            description: '执行任务所需的技能或资质'
          }
        ]
      }]
    },
    colors: {
      fill: '#f1f8e9',
      stroke: '#689f38',
      text: '#33691e'
    },
    examples: ['线下操作', '手工处理', '物理操作'],
    enterpriseScenarios: ['制造流程', '质量控制', '现场作业']
  },

  // === 8个新增企业级任务模板 ===

  {
    name: '决策任务',
    description: '复杂的决策分析任务',
    nodeType: 'bpmn:BusinessRuleTask',
    icon: 'fas fa-balance-scale',
    taskDefinition: {
      type: 'implementation',
      implementation: 'decisionEngine',
      properties: {
        decisionModel: '',
        inputVariables: '',
        outputVariables: '',
        decisionLogic: '',
        fallbackAction: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '决策引擎配置',
        fields: [
          {
            key: 'decisionModel',
            type: 'text',
            label: '决策模型',
            required: true,
            description: '使用的决策模型或算法'
          },
          {
            key: 'inputVariables',
            type: 'textarea',
            label: '输入变量',
            description: '逗号分隔的输入变量列表'
          },
          {
            key: 'outputVariables',
            type: 'textarea',
            label: '输出变量',
            description: '逗号分隔的输出变量列表'
          },
          {
            key: 'decisionLogic',
            type: 'textarea',
            label: '决策逻辑',
            description: '决策规则或算法描述'
          },
          {
            key: 'fallbackAction',
            type: 'select',
            label: '失败处理',
            options: ['停止流程', '使用默认值', '手动决策', '跳过任务']
          }
        ]
      }]
    },
    colors: {
      fill: '#e8eaf6',
      stroke: '#3f51b5',
      text: '#283593'
    },
    examples: ['信贷审批', '投资分析', '风险评估'],
    enterpriseScenarios: ['金融服务', '投资管理', '风险控制']
  },

  {
    name: '审批任务',
    description: '多级审批和签批任务',
    nodeType: 'bpmn:UserTask',
    icon: 'fas fa-stamp',
    taskDefinition: {
      type: 'implementation',
      implementation: 'approvalTask',
      properties: {
        approvalType: 'sequential',
        approvers: '',
        approvalThreshold: '100',
        escalationTime: '',
        approvalComment: '',
        attachmentRequired: false
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '审批流程配置',
        fields: [
          {
            key: 'approvalType',
            type: 'select',
            label: '审批类型',
            options: ['sequential', 'parallel', 'majority', 'unanimous'],
            required: true,
            description: '审批执行方式'
          },
          {
            key: 'approvers',
            type: 'textarea',
            label: '审批人列表',
            required: true,
            description: '逗号分隔的审批人ID或组'
          },
          {
            key: 'approvalThreshold',
            type: 'number',
            label: '审批阈值(%)',
            validation: { min: 1, max: 100 },
            description: '通过所需的最低审批比例'
          },
          {
            key: 'escalationTime',
            type: 'number',
            label: '升级时间(小时)',
            description: '未处理自动升级的时间'
          },
          {
            key: 'attachmentRequired',
            type: 'checkbox',
            label: '需要附件',
            description: '是否要求上传审批附件'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff8e1',
      stroke: '#ffc107',
      text: '#f57f17'
    },
    examples: ['费用审批', '合同审批', '人事审批'],
    enterpriseScenarios: ['财务管理', '合同管理', '人力资源']
  },

  {
    name: '数据处理任务',
    description: 'ETL和数据转换任务',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-database',
    taskDefinition: {
      type: 'implementation',
      implementation: 'dataProcessor',
      properties: {
        sourceSystem: '',
        targetSystem: '',
        transformationRules: '',
        dataValidation: '',
        errorHandling: '',
        batchSize: '1000'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '数据处理配置',
        fields: [
          {
            key: 'sourceSystem',
            type: 'text',
            label: '源系统',
            required: true,
            description: '数据来源系统标识'
          },
          {
            key: 'targetSystem',
            type: 'text',
            label: '目标系统',
            required: true,
            description: '数据目标系统标识'
          },
          {
            key: 'transformationRules',
            type: 'textarea',
            label: '转换规则',
            description: '数据转换和映射规则'
          },
          {
            key: 'dataValidation',
            type: 'textarea',
            label: '数据验证',
            description: '数据质量检查规则'
          },
          {
            key: 'errorHandling',
            type: 'select',
            label: '错误处理',
            options: ['停止处理', '记录并继续', '重试', '手动处理']
          },
          {
            key: 'batchSize',
            type: 'number',
            label: '批次大小',
            validation: { min: 1, max: 10000 }
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f7fa',
      stroke: '#00acc1',
      text: '#006064'
    },
    examples: ['数据同步', 'ETL处理', '数据清洗'],
    enterpriseScenarios: ['数据集成', '商业智能', '数据仓库']
  },

  {
    name: '文档生成任务',
    description: '自动生成报告和文档',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-file-alt',
    taskDefinition: {
      type: 'implementation',
      implementation: 'documentGenerator',
      properties: {
        templateFile: '',
        outputFormat: 'PDF',
        dataSource: '',
        reportParameters: '',
        deliveryMethod: '',
        outputPath: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '文档生成配置',
        fields: [
          {
            key: 'templateFile',
            type: 'text',
            label: '模板文件',
            required: true,
            description: '报告模板文件路径'
          },
          {
            key: 'outputFormat',
            type: 'select',
            label: '输出格式',
            options: ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'HTML'],
            required: true
          },
          {
            key: 'dataSource',
            type: 'text',
            label: '数据源',
            description: '报告数据来源'
          },
          {
            key: 'reportParameters',
            type: 'textarea',
            label: '报告参数',
            description: 'JSON格式的报告参数'
          },
          {
            key: 'deliveryMethod',
            type: 'select',
            label: '交付方式',
            options: ['文件系统', '邮件发送', 'FTP上传', 'API推送']
          },
          {
            key: 'outputPath',
            type: 'text',
            label: '输出路径',
            description: '文件保存位置'
          }
        ]
      }]
    },
    colors: {
      fill: '#fce4ec',
      stroke: '#e91e63',
      text: '#880e4f'
    },
    examples: ['财务报告', '合规报告', '分析报告'],
    enterpriseScenarios: ['财务报告', '合规管理', '商业分析']
  },

  {
    name: '集成任务',
    description: '系统集成和API调用',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-plug',
    taskDefinition: {
      type: 'implementation',
      implementation: 'integrationService',
      properties: {
        integrationPattern: 'REST',
        endpoint: '',
        authentication: '',
        requestMapping: '',
        responseMapping: '',
        retryPolicy: '',
        circuitBreaker: false
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '系统集成配置',
        fields: [
          {
            key: 'integrationPattern',
            type: 'select',
            label: '集成模式',
            options: ['REST', 'SOAP', 'GraphQL', 'gRPC', 'Message Queue'],
            required: true
          },
          {
            key: 'endpoint',
            type: 'text',
            label: '服务端点',
            required: true,
            description: '目标系统的API端点'
          },
          {
            key: 'authentication',
            type: 'select',
            label: '认证方式',
            options: ['None', 'Basic Auth', 'Bearer Token', 'OAuth2', 'API Key']
          },
          {
            key: 'requestMapping',
            type: 'textarea',
            label: '请求映射',
            description: '请求数据转换规则'
          },
          {
            key: 'responseMapping',
            type: 'textarea',
            label: '响应映射',
            description: '响应数据转换规则'
          },
          {
            key: 'retryPolicy',
            type: 'text',
            label: '重试策略',
            description: '失败重试配置'
          },
          {
            key: 'circuitBreaker',
            type: 'checkbox',
            label: '熔断器',
            description: '启用熔断器保护'
          }
        ]
      }]
    },
    colors: {
      fill: '#e1f5fe',
      stroke: '#0288d1',
      text: '#01579b'
    },
    examples: ['CRM集成', 'ERP同步', '第三方API'],
    enterpriseScenarios: ['系统集成', '数据同步', '业务协同']
  },

  {
    name: '监控任务',
    description: '系统监控和健康检查',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-heartbeat',
    taskDefinition: {
      type: 'implementation',
      implementation: 'monitoringService',
      properties: {
        monitorType: 'healthCheck',
        targets: '',
        checkInterval: '300',
        alertThreshold: '',
        alertChannel: '',
        escalationRules: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '监控配置',
        fields: [
          {
            key: 'monitorType',
            type: 'select',
            label: '监控类型',
            options: ['healthCheck', 'performance', 'availability', 'security', 'business'],
            required: true
          },
          {
            key: 'targets',
            type: 'textarea',
            label: '监控目标',
            required: true,
            description: '要监控的系统或服务列表'
          },
          {
            key: 'checkInterval',
            type: 'number',
            label: '检查间隔(秒)',
            validation: { min: 10, max: 3600 },
            description: '监控检查频率'
          },
          {
            key: 'alertThreshold',
            type: 'text',
            label: '告警阈值',
            description: '触发告警的条件'
          },
          {
            key: 'alertChannel',
            type: 'select',
            label: '告警渠道',
            options: ['邮件', '短信', '企业微信', 'Slack', 'PagerDuty']
          },
          {
            key: 'escalationRules',
            type: 'textarea',
            label: '升级规则',
            description: '告警升级处理规则'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8f5e8',
      stroke: '#2e7d32',
      text: '#1b5e20'
    },
    examples: ['健康检查', '性能监控', '业务监控'],
    enterpriseScenarios: ['运维监控', '业务监控', 'SLA管理']
  },

  {
    name: '测试任务',
    description: '自动化测试和验证',
    nodeType: 'bpmn:ServiceTask',
    icon: 'fas fa-vial',
    taskDefinition: {
      type: 'implementation',
      implementation: 'testService',
      properties: {
        testType: 'functional',
        testSuite: '',
        testData: '',
        environment: 'test',
        assertions: '',
        reportFormat: 'JUnit'
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '测试配置',
        fields: [
          {
            key: 'testType',
            type: 'select',
            label: '测试类型',
            options: ['functional', 'integration', 'performance', 'security', 'regression'],
            required: true
          },
          {
            key: 'testSuite',
            type: 'text',
            label: '测试套件',
            required: true,
            description: '要执行的测试套件标识'
          },
          {
            key: 'testData',
            type: 'textarea',
            label: '测试数据',
            description: '测试用例的输入数据'
          },
          {
            key: 'environment',
            type: 'select',
            label: '测试环境',
            options: ['dev', 'test', 'staging', 'pre-prod'],
            description: '执行测试的环境'
          },
          {
            key: 'assertions',
            type: 'textarea',
            label: '断言规则',
            description: '测试验证的断言条件'
          },
          {
            key: 'reportFormat',
            type: 'select',
            label: '报告格式',
            options: ['JUnit', 'TestNG', 'HTML', 'JSON', 'XML']
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#7b1fa2',
      text: '#4a148c'
    },
    examples: ['功能测试', '集成测试', '性能测试'],
    enterpriseScenarios: ['质量保证', 'DevOps', '自动化测试']
  },

  {
    name: '通知任务',
    description: '多渠道消息通知',
    nodeType: 'bpmn:SendTask',
    icon: 'fas fa-bell',
    taskDefinition: {
      type: 'implementation',
      implementation: 'notificationService',
      properties: {
        notificationChannels: 'email',
        recipients: '',
        template: '',
        urgency: 'normal',
        retryAttempts: '3',
        tracking: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '通知配置',
        fields: [
          {
            key: 'notificationChannels',
            type: 'select',
            label: '通知渠道',
            options: ['email', 'sms', '企业微信', 'Slack', 'push', 'multiple'],
            required: true
          },
          {
            key: 'recipients',
            type: 'textarea',
            label: '接收人',
            required: true,
            description: '通知接收人列表'
          },
          {
            key: 'template',
            type: 'text',
            label: '消息模板',
            description: '使用的消息模板标识'
          },
          {
            key: 'urgency',
            type: 'select',
            label: '紧急程度',
            options: ['low', 'normal', 'high', 'critical'],
            description: '通知的紧急程度'
          },
          {
            key: 'retryAttempts',
            type: 'number',
            label: '重试次数',
            validation: { min: 0, max: 10 },
            description: '发送失败时的重试次数'
          },
          {
            key: 'tracking',
            type: 'checkbox',
            label: '发送跟踪',
            description: '跟踪消息发送状态'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#f57c00',
      text: '#e65100'
    },
    examples: ['状态通知', '预警信息', '系统公告'],
    enterpriseScenarios: ['运营管理', '客户服务', '系统管理']
  }
]

/**
 * 创建任务模板
 */
function createTaskTemplate(config: TaskTemplateConfig, categoryId: string): Omit<NodeTemplate, 'id' | 'metadata'> {
  return {
    name: config.name,
    description: config.description,
    category: categoryId,
    icon: config.icon,
    nodeType: config.nodeType,
    properties: {
      // 基础BPMN属性
      name: config.name,
      
      // 任务定义属性
      ...config.taskDefinition?.properties,
      
      // DynamicForm扩展属性
      dynamicFormConfig: config.dynamicFormConfig,
      
      // 企业场景标签
      enterpriseScenarios: config.enterpriseScenarios
    },
    uiConfig: {
      shape: 'rectangle',
      size: { width: 100, height: 80 },
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
 * 获取所有任务模板 (15个)
 */
export function getAllTaskTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return taskTemplateConfigs.map(config => createTaskTemplate(config, categoryId))
}

/**
 * 按类型获取任务模板
 */
export function getBasicTaskTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return taskTemplateConfigs.slice(0, 7).map(config => createTaskTemplate(config, categoryId))
}

export function getEnterpriseTaskTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return taskTemplateConfigs.slice(7).map(config => createTaskTemplate(config, categoryId))
}

/**
 * 按企业场景获取任务模板
 */
export function getTaskTemplatesByScenario(categoryId: string, scenario: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return taskTemplateConfigs
    .filter(config => config.enterpriseScenarios?.includes(scenario))
    .map(config => createTaskTemplate(config, categoryId))
}