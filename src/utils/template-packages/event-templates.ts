/**
 * BPMN 2.0 完整事件模板包
 * 支持DynamicForm自定义属性和扩展配置
 */

import type { NodeTemplate, PropertyValue } from '@/types'

/**
 * 事件模板配置接口 - 支持DynamicForm
 */
interface EventTemplateConfig {
  // 基础配置
  name: string
  description: string
  nodeType: string
  icon: string
  
  // 事件特有属性
  eventDefinition?: {
    type: 'message' | 'timer' | 'signal' | 'conditional' | 'error' | 'escalation' | 'compensation' | 'link' | 'terminate' | 'cancel' | 'multiple'
    properties: Record<string, PropertyValue>
  }
  
  // DynamicForm配置
  dynamicFormConfig?: {
    sections: Array<{
      title: string
      fields: Array<{
        key: string
        type: 'text' | 'select' | 'checkbox' | 'textarea' | 'number'
        label: string
        required?: boolean
        options?: string[]
        description?: string
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
}

/**
 * 开始事件模板集合 (9个)
 */
const startEventConfigs: EventTemplateConfig[] = [
  {
    name: '空开始事件',
    description: '没有触发条件的开始事件',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-play',
    colors: {
      fill: '#e8f5e8',
      stroke: '#4caf50', 
      text: '#2e7d32'
    },
    examples: ['手动启动流程', '简单开始', '无条件触发']
  },
  
  {
    name: '消息开始事件',
    description: '接收到消息时启动流程',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-envelope',
    eventDefinition: {
      type: 'message',
      properties: {
        messageRef: '',
        correlationKey: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '消息配置',
        fields: [
          {
            key: 'messageRef',
            type: 'text',
            label: '消息引用',
            required: true,
            description: '指定要接收的消息类型'
          },
          {
            key: 'correlationKey',
            type: 'text', 
            label: '关联键',
            description: '消息关联标识'
          },
          {
            key: 'messageFormat',
            type: 'select',
            label: '消息格式',
            options: ['JSON', 'XML', 'Plain Text', 'Binary']
          }
        ]
      }]
    },
    colors: {
      fill: '#e3f2fd',
      stroke: '#2196f3',
      text: '#0d47a1'
    },
    examples: ['API请求触发', '邮件接收启动', '外部系统通知']
  },
  
  {
    name: '定时开始事件',
    description: '按计划时间启动流程',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-clock',
    eventDefinition: {
      type: 'timer',
      properties: {
        timerDefinition: '',
        timeDate: '',
        timeDuration: '',
        timeCycle: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '定时配置',
        fields: [
          {
            key: 'timerType',
            type: 'select',
            label: '定时类型',
            options: ['timeDate', 'timeDuration', 'timeCycle'],
            required: true
          },
          {
            key: 'timeDate',
            type: 'text',
            label: '指定时间',
            description: 'ISO 8601格式: 2023-12-31T23:59:59'
          },
          {
            key: 'timeDuration',
            type: 'text', 
            label: '延迟时间',
            description: 'ISO 8601格式: PT1H30M (1小时30分钟)'
          },
          {
            key: 'timeCycle',
            type: 'text',
            label: '周期表达式',
            description: 'Cron表达式: 0 0 9 * * MON-FRI'
          },
          {
            key: 'timezone',
            type: 'text',
            label: '时区',
            description: '例如: Asia/Shanghai'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#ff9800',
      text: '#e65100'
    },
    examples: ['每日定时任务', '月末结算', '定期报告生成']
  },
  
  {
    name: '信号开始事件', 
    description: '接收到信号时启动流程',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-wifi',
    eventDefinition: {
      type: 'signal',
      properties: {
        signalRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '信号配置',
        fields: [
          {
            key: 'signalRef',
            type: 'text',
            label: '信号引用',
            required: true,
            description: '要监听的信号名称'
          },
          {
            key: 'scope',
            type: 'select',
            label: '信号范围',
            options: ['global', 'processInstance', 'activity']
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#9c27b0',
      text: '#6a1b9a'
    },
    examples: ['系统事件触发', '跨流程通信', '状态变更启动']
  },
  
  {
    name: '条件开始事件',
    description: '满足条件时启动流程',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-question-circle',
    eventDefinition: {
      type: 'conditional',
      properties: {
        condition: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '条件配置',
        fields: [
          {
            key: 'condition',
            type: 'textarea',
            label: '条件表达式',
            required: true,
            description: '使用表达式语言定义触发条件'
          },
          {
            key: 'variables',
            type: 'textarea',
            label: '监听变量',
            description: '逗号分隔的变量列表'
          }
        ]
      }]
    },
    colors: {
      fill: '#fce4ec',
      stroke: '#e91e63',
      text: '#ad1457'
    },
    examples: ['数据变化触发', '阈值检测', '业务规则满足']
  },
  
  {
    name: '错误开始事件',
    description: '捕获错误时启动流程',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-exclamation-triangle',
    eventDefinition: {
      type: 'error',
      properties: {
        errorRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '错误配置',
        fields: [
          {
            key: 'errorRef',
            type: 'text',
            label: '错误引用',
            description: '要捕获的错误类型'
          },
          {
            key: 'errorCode',
            type: 'text',
            label: '错误代码',
            description: '特定的错误代码'
          }
        ]
      }]
    },
    colors: {
      fill: '#ffebee',
      stroke: '#f44336',
      text: '#c62828'
    },
    examples: ['异常处理流程', '错误恢复', '补偿机制']
  },
  
  {
    name: '升级开始事件',
    description: '处理流程升级的开始事件',
    nodeType: 'bpmn:StartEvent', 
    icon: 'fas fa-level-up-alt',
    eventDefinition: {
      type: 'escalation',
      properties: {
        escalationRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '升级配置',
        fields: [
          {
            key: 'escalationRef',
            type: 'text',
            label: '升级引用',
            description: '升级事件的标识'
          },
          {
            key: 'escalationCode',
            type: 'text',
            label: '升级代码',
            description: '特定的升级代码'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff8e1',
      stroke: '#ffc107',
      text: '#ff8f00'
    },
    examples: ['管理层介入', '流程升级', '权限提升']
  },
  
  {
    name: '补偿开始事件',
    description: '启动补偿流程的开始事件',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-undo',
    eventDefinition: {
      type: 'compensation',
      properties: {
        activityRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '补偿配置',
        fields: [
          {
            key: 'activityRef',
            type: 'text',
            label: '活动引用',
            description: '要补偿的活动标识'
          },
          {
            key: 'waitForCompletion',
            type: 'checkbox',
            label: '等待完成',
            description: '是否等待补偿活动完成'
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f2f1',
      stroke: '#009688',
      text: '#00695c'
    },
    examples: ['事务回滚', '操作撤销', '数据恢复']
  },
  
  {
    name: '多重开始事件',
    description: '支持多种触发条件的开始事件',
    nodeType: 'bpmn:StartEvent',
    icon: 'fas fa-asterisk',
    eventDefinition: {
      type: 'multiple',
      properties: {
        parallelMultiple: false
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '多重配置',
        fields: [
          {
            key: 'parallelMultiple',
            type: 'checkbox',
            label: '并行多重',
            description: '是否要求所有条件同时满足'
          },
          {
            key: 'eventDefinitions',
            type: 'textarea',
            label: '事件定义列表',
            description: '多个事件定义，每行一个'
          }
        ]
      }]
    },
    colors: {
      fill: '#f1f8e9',
      stroke: '#689f38',
      text: '#33691e'
    },
    examples: ['复合触发条件', '多路径启动', '灵活触发机制']
  }
]

/**
 * 中间事件模板集合 (12个)
 */
const intermediateEventConfigs: EventTemplateConfig[] = [
  {
    name: '空中间捕获事件',
    description: '不带特定触发器的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-pause',
    colors: {
      fill: '#f5f5f5',
      stroke: '#9e9e9e',
      text: '#424242'
    },
    examples: ['流程暂停点', '手动触发点', '等待节点']
  },
  
  {
    name: '空中间抛出事件',
    description: '不产生特定输出的中间事件',
    nodeType: 'bpmn:IntermediateThrowEvent',
    icon: 'fas fa-forward',
    colors: {
      fill: '#f5f5f5',
      stroke: '#9e9e9e', 
      text: '#424242'
    },
    examples: ['流程标记点', '日志记录', '状态更新']
  },
  
  {
    name: '消息中间捕获事件',
    description: '等待接收消息的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-envelope-open',
    eventDefinition: {
      type: 'message',
      properties: {
        messageRef: '',
        correlationKey: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '消息捕获配置',
        fields: [
          {
            key: 'messageRef',
            type: 'text',
            label: '消息引用',
            required: true
          },
          {
            key: 'timeout',
            type: 'number',
            label: '超时时间(秒)',
            description: '等待消息的最大时间'
          }
        ]
      }]
    },
    colors: {
      fill: '#e3f2fd',
      stroke: '#2196f3',
      text: '#0d47a1'
    },
    examples: ['等待回复', '接收确认', '外部通知']
  },
  
  {
    name: '消息中间抛出事件',
    description: '发送消息的中间事件',
    nodeType: 'bpmn:IntermediateThrowEvent',
    icon: 'fas fa-paper-plane',
    eventDefinition: {
      type: 'message',
      properties: {
        messageRef: '',
        target: ''
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
            required: true
          },
          {
            key: 'target',
            type: 'text',
            label: '目标地址',
            description: '消息发送的目标'
          },
          {
            key: 'async',
            type: 'checkbox',
            label: '异步发送',
            description: '是否异步发送消息'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8f5e8',
      stroke: '#4caf50',
      text: '#2e7d32'
    },
    examples: ['发送通知', '触发下游', '状态同步']
  },
  
  {
    name: '定时中间事件',
    description: '在指定时间触发的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-hourglass-half',
    eventDefinition: {
      type: 'timer',
      properties: {
        timerDefinition: '',
        timeDate: '',
        timeDuration: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '定时配置',
        fields: [
          {
            key: 'timerType',
            type: 'select',
            label: '定时类型',
            options: ['timeDate', 'timeDuration'],
            required: true
          },
          {
            key: 'timeDate',
            type: 'text',
            label: '指定时间',
            description: 'ISO 8601格式'
          },
          {
            key: 'timeDuration',
            type: 'text',
            label: '延迟时间',
            description: 'ISO 8601格式: PT1H (1小时)'
          }
        ]
      }]
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#ff9800',
      text: '#e65100'
    },
    examples: ['延迟处理', '等待期限', '定时检查']
  },
  
  {
    name: '信号中间捕获事件',
    description: '等待接收信号的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-wifi',
    eventDefinition: {
      type: 'signal',
      properties: {
        signalRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '信号捕获配置',
        fields: [
          {
            key: 'signalRef',
            type: 'text',
            label: '信号引用',
            required: true
          },
          {
            key: 'scope',
            type: 'select',
            label: '信号范围',
            options: ['global', 'processInstance']
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#9c27b0',
      text: '#6a1b9a'
    },
    examples: ['等待信号', '状态同步', '跨流程通信']
  },
  
  {
    name: '信号中间抛出事件',
    description: '发送信号的中间事件',
    nodeType: 'bpmn:IntermediateThrowEvent',
    icon: 'fas fa-broadcast-tower',
    eventDefinition: {
      type: 'signal',
      properties: {
        signalRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '信号发送配置',
        fields: [
          {
            key: 'signalRef',
            type: 'text',
            label: '信号引用',
            required: true
          },
          {
            key: 'scope',
            type: 'select',
            label: '信号范围',
            options: ['global', 'processInstance']
          }
        ]
      }]
    },
    colors: {
      fill: '#e1f5fe',
      stroke: '#0277bd',
      text: '#01579b'
    },
    examples: ['广播信号', '触发其他流程', '状态通知']
  },
  
  {
    name: '条件中间事件',
    description: '满足条件时触发的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-question-circle',
    eventDefinition: {
      type: 'conditional',
      properties: {
        condition: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '条件配置',
        fields: [
          {
            key: 'condition',
            type: 'textarea',
            label: '条件表达式',
            required: true
          },
          {
            key: 'evaluateOnEntry',
            type: 'checkbox',
            label: '进入时评估',
            description: '是否在进入事件时评估条件'
          }
        ]
      }]
    },
    colors: {
      fill: '#fce4ec',
      stroke: '#e91e63',
      text: '#ad1457'
    },
    examples: ['条件等待', '数据检查', '状态判断']
  },
  
  {
    name: '链接中间捕获事件',
    description: '接收链接的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-link',
    eventDefinition: {
      type: 'link',
      properties: {
        name: '',
        source: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '链接配置',
        fields: [
          {
            key: 'name',
            type: 'text',
            label: '链接名称',
            required: true
          },
          {
            key: 'source',
            type: 'text',
            label: '源链接',
            description: '对应的抛出事件标识'
          }
        ]
      }]
    },
    colors: {
      fill: '#e8eaf6',
      stroke: '#3f51b5',
      text: '#283593'
    },
    examples: ['页面跳转', '流程连接', '远程链接']
  },
  
  {
    name: '链接中间抛出事件',
    description: '发送链接的中间事件',
    nodeType: 'bpmn:IntermediateThrowEvent',
    icon: 'fas fa-external-link-alt',
    eventDefinition: {
      type: 'link',
      properties: {
        name: '',
        target: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '链接配置',
        fields: [
          {
            key: 'name',
            type: 'text',
            label: '链接名称',
            required: true
          },
          {
            key: 'target',
            type: 'text',
            label: '目标链接',
            description: '对应的捕获事件标识'
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f2f1',
      stroke: '#009688',
      text: '#00695c'
    },
    examples: ['流程跳转', '逻辑连接', '分支合并']
  },
  
  {
    name: '错误中间事件',
    description: '捕获错误的中间事件',
    nodeType: 'bpmn:IntermediateCatchEvent',
    icon: 'fas fa-times-circle',
    eventDefinition: {
      type: 'error',
      properties: {
        errorRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '错误处理配置',
        fields: [
          {
            key: 'errorRef',
            type: 'text',
            label: '错误引用',
            description: '要捕获的错误类型'
          },
          {
            key: 'errorCode',
            type: 'text',
            label: '错误代码',
            description: '特定的错误代码'
          }
        ]
      }]
    },
    colors: {
      fill: '#ffebee',
      stroke: '#f44336',
      text: '#c62828'
    },
    examples: ['异常捕获', '错误处理', '失败恢复']
  },
  
  {
    name: '补偿中间事件',
    description: '触发补偿的中间事件',
    nodeType: 'bpmn:IntermediateThrowEvent',
    icon: 'fas fa-undo-alt',
    eventDefinition: {
      type: 'compensation',
      properties: {
        activityRef: '',
        waitForCompletion: true
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '补偿配置',
        fields: [
          {
            key: 'activityRef',
            type: 'text',
            label: '活动引用',
            description: '要补偿的活动标识'
          },
          {
            key: 'waitForCompletion',
            type: 'checkbox',
            label: '等待完成',
            description: '是否等待补偿活动完成'
          }
        ]
      }]
    },
    colors: {
      fill: '#f1f8e9',
      stroke: '#689f38',
      text: '#33691e'
    },
    examples: ['补偿处理', '事务回滚', '操作撤销']
  }
]

/**
 * 结束事件模板集合 (8个)
 */
const endEventConfigs: EventTemplateConfig[] = [
  {
    name: '空结束事件',
    description: '正常结束流程的事件',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-stop',
    colors: {
      fill: '#ffebee',
      stroke: '#f44336',
      text: '#c62828'
    },
    examples: ['正常结束', '流程完成', '任务完毕']
  },
  
  {
    name: '消息结束事件',
    description: '发送消息后结束流程',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-envelope-open',
    eventDefinition: {
      type: 'message',
      properties: {
        messageRef: '',
        target: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '结束消息配置',
        fields: [
          {
            key: 'messageRef',
            type: 'text',
            label: '消息引用',
            required: true
          },
          {
            key: 'target',
            type: 'text',
            label: '目标地址',
            description: '消息发送的目标'
          },
          {
            key: 'finalMessage',
            type: 'textarea',
            label: '结束消息内容',
            description: '流程结束时发送的消息'
          }
        ]
      }]
    },
    colors: {
      fill: '#e3f2fd',
      stroke: '#2196f3',
      text: '#0d47a1'
    },
    examples: ['完成通知', '结果发送', '状态报告']
  },
  
  {
    name: '错误结束事件',
    description: '以错误状态结束流程',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-exclamation-circle',
    eventDefinition: {
      type: 'error',
      properties: {
        errorRef: '',
        errorCode: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '错误配置',
        fields: [
          {
            key: 'errorRef',
            type: 'text',
            label: '错误引用',
            required: true
          },
          {
            key: 'errorCode',
            type: 'text',
            label: '错误代码',
            description: '特定的错误代码'
          },
          {
            key: 'errorMessage',
            type: 'textarea',
            label: '错误消息',
            description: '详细的错误描述'
          }
        ]
      }]
    },
    colors: {
      fill: '#ffcdd2',
      stroke: '#d32f2f',
      text: '#b71c1c'
    },
    examples: ['异常结束', '错误终止', '失败退出']
  },
  
  {
    name: '取消结束事件',
    description: '取消事务后结束流程',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-ban',
    eventDefinition: {
      type: 'cancel',
      properties: {}
    },
    colors: {
      fill: '#fff3e0',
      stroke: '#f57c00',
      text: '#e65100'
    },
    examples: ['事务取消', '操作中断', '流程撤销']
  },
  
  {
    name: '补偿结束事件',
    description: '触发补偿后结束流程',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-history',
    eventDefinition: {
      type: 'compensation',
      properties: {
        activityRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '补偿配置',
        fields: [
          {
            key: 'activityRef',
            type: 'text',
            label: '活动引用',
            description: '要补偿的活动标识'
          },
          {
            key: 'compensationScope',
            type: 'select',
            label: '补偿范围',
            options: ['activity', 'subprocess', 'process']
          }
        ]
      }]
    },
    colors: {
      fill: '#e0f2f1',
      stroke: '#009688',
      text: '#00695c'
    },
    examples: ['补偿结束', '回滚完成', '恢复终止']
  },
  
  {
    name: '信号结束事件',
    description: '发送信号后结束流程',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-rss',
    eventDefinition: {
      type: 'signal',
      properties: {
        signalRef: ''
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '信号配置',
        fields: [
          {
            key: 'signalRef',
            type: 'text',
            label: '信号引用',
            required: true
          },
          {
            key: 'scope',
            type: 'select',
            label: '信号范围',
            options: ['global', 'processInstance']
          }
        ]
      }]
    },
    colors: {
      fill: '#f3e5f5',
      stroke: '#9c27b0',
      text: '#6a1b9a'
    },
    examples: ['信号广播', '状态通知', '触发后续']
  },
  
  {
    name: '多重结束事件',
    description: '执行多个结束操作的事件',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-circle-notch',
    eventDefinition: {
      type: 'multiple',
      properties: {
        parallelMultiple: false
      }
    },
    dynamicFormConfig: {
      sections: [{
        title: '多重结束配置',
        fields: [
          {
            key: 'parallelMultiple',
            type: 'checkbox',
            label: '并行多重',
            description: '是否并行执行所有结束操作'
          },
          {
            key: 'endEventDefinitions',
            type: 'textarea',
            label: '结束事件定义',
            description: '多个结束操作定义'
          }
        ]
      }]
    },
    colors: {
      fill: '#f1f8e9',
      stroke: '#689f38',
      text: '#33691e'
    },
    examples: ['复合结束', '多路径终止', '批量操作']
  },
  
  {
    name: '终止结束事件',
    description: '立即终止整个流程实例',
    nodeType: 'bpmn:EndEvent',
    icon: 'fas fa-power-off',
    eventDefinition: {
      type: 'terminate',
      properties: {}
    },
    colors: {
      fill: '#424242',
      stroke: '#212121',
      text: '#ffffff'
    },
    examples: ['强制终止', '紧急停止', '异常中断']
  }
]

/**
 * 创建事件模板
 */
function createEventTemplate(config: EventTemplateConfig, categoryId: string): Omit<NodeTemplate, 'id' | 'metadata'> {
  return {
    name: config.name,
    description: config.description,
    category: categoryId,
    icon: config.icon,
    nodeType: config.nodeType,
    properties: {
      // 基础BPMN属性
      name: config.name,
      
      // 事件定义属性
      ...config.eventDefinition?.properties,
      
      // DynamicForm扩展属性
      dynamicFormConfig: config.dynamicFormConfig
    },
    uiConfig: {
      shape: 'circle',
      size: { width: 36, height: 36 },
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
 * 获取所有事件模板 (25个)
 */
export function getAllEventTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  const templates: Array<Omit<NodeTemplate, 'id' | 'metadata'>> = []
  
  // 开始事件 (9个)
  startEventConfigs.forEach(config => {
    templates.push(createEventTemplate(config, categoryId))
  })
  
  // 中间事件 (12个) 
  intermediateEventConfigs.forEach(config => {
    templates.push(createEventTemplate(config, categoryId))
  })
  
  // 结束事件 (8个)
  endEventConfigs.forEach(config => {
    templates.push(createEventTemplate(config, categoryId))
  })
  
  return templates
}

/**
 * 按类型获取事件模板
 */
export function getStartEventTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return startEventConfigs.map(config => createEventTemplate(config, categoryId))
}

export function getIntermediateEventTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return intermediateEventConfigs.map(config => createEventTemplate(config, categoryId))
}

export function getEndEventTemplates(categoryId: string): Array<Omit<NodeTemplate, 'id' | 'metadata'>> {
  return endEventConfigs.map(config => createEventTemplate(config, categoryId))
}