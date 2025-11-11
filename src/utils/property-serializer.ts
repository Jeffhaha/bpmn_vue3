/**
 * 属性序列化器
 * 处理BPMN元素属性的XML序列化和反序列化
 */

import type {
  PropertyValue,
  PropertyConfig,
  PropertyContext,
  PropertyExportFormat,
  FormField,
  EventDefinition
} from '@/types/property.types'

/**
 * 属性序列化器类
 */
export class PropertySerializer {
  
  /**
   * 将属性序列化为XML扩展元素
   */
  serializeToXML(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    moddle: any
  ): any {
    const extensionElements = moddle.create('bpmn:ExtensionElements')
    const values: any[] = []

    // 处理标准BPMN属性
    const standardProperties = this.extractStandardProperties(properties, configs)
    
    // 处理自定义属性
    const customProperties = this.extractCustomProperties(properties, configs)
    if (Object.keys(customProperties).length > 0) {
      const propertiesElement = this.createPropertiesElement(customProperties, moddle)
      values.push(propertiesElement)
    }

    // 处理表单字段
    const formFields = properties.formFields as FormField[]
    if (formFields && formFields.length > 0) {
      const formDataElement = this.createFormDataElement(formFields, moddle)
      values.push(formDataElement)
    }

    // 处理事件定义
    if (this.hasEventDefinitions(properties)) {
      const eventDefinitions = this.createEventDefinitions(properties, moddle)
      values.push(...eventDefinitions)
    }

    // 处理执行监听器
    const executionListeners = this.extractExecutionListeners(properties)
    if (executionListeners.length > 0) {
      values.push(...executionListeners.map(listener => 
        this.createExecutionListener(listener, moddle)
      ))
    }

    // 处理任务监听器
    const taskListeners = this.extractTaskListeners(properties)
    if (taskListeners.length > 0) {
      values.push(...taskListeners.map(listener => 
        this.createTaskListener(listener, moddle)
      ))
    }

    if (values.length > 0) {
      extensionElements.values = values
      return extensionElements
    }

    return null
  }

  /**
   * 从XML扩展元素反序列化属性
   */
  deserializeFromXML(
    extensionElements: any,
    configs: PropertyConfig[]
  ): Record<string, PropertyValue> {
    const properties: Record<string, PropertyValue> = {}

    if (!extensionElements || !extensionElements.values) {
      return properties
    }

    for (const element of extensionElements.values) {
      switch (element.$type) {
        case 'zeebe:Properties':
        case 'camunda:Properties':
          Object.assign(properties, this.parsePropertiesElement(element))
          break

        case 'zeebe:FormData':
        case 'camunda:FormData':
          properties.formFields = this.parseFormDataElement(element)
          break

        case 'bpmn:MessageEventDefinition':
        case 'bpmn:TimerEventDefinition':
        case 'bpmn:ErrorEventDefinition':
        case 'bpmn:SignalEventDefinition':
        case 'bpmn:EscalationEventDefinition':
          this.parseEventDefinition(element, properties)
          break

        case 'zeebe:ExecutionListeners':
        case 'camunda:ExecutionListeners':
          properties.executionListeners = this.parseExecutionListeners(element)
          break

        case 'zeebe:TaskListeners':
        case 'camunda:TaskListeners':
          properties.taskListeners = this.parseTaskListeners(element)
          break

        default:
          // 处理未知扩展元素
          this.parseUnknownElement(element, properties)
      }
    }

    return properties
  }

  /**
   * 导出属性为指定格式
   */
  exportProperties(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    format: PropertyExportFormat
  ): string {
    switch (format.format) {
      case 'json':
        return this.exportAsJSON(properties, configs, format)
      case 'xml':
        return this.exportAsXML(properties, configs, format)
      case 'yaml':
        return this.exportAsYAML(properties, configs, format)
      case 'csv':
        return this.exportAsCSV(properties, configs, format)
      default:
        throw new Error(`不支持的导出格式: ${format.format}`)
    }
  }

  /**
   * 从指定格式导入属性
   */
  importProperties(
    data: string,
    format: PropertyExportFormat['format'],
    configs: PropertyConfig[]
  ): Record<string, PropertyValue> {
    switch (format) {
      case 'json':
        return this.importFromJSON(data, configs)
      case 'xml':
        return this.importFromXML(data, configs)
      case 'yaml':
        return this.importFromYAML(data, configs)
      case 'csv':
        return this.importFromCSV(data, configs)
      default:
        throw new Error(`不支持的导入格式: ${format}`)
    }
  }

  /**
   * 提取标准BPMN属性
   */
  private extractStandardProperties(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[]
  ): Record<string, PropertyValue> {
    const standardKeys = ['id', 'name', 'documentation', 'assignee', 'candidateUsers', 'candidateGroups', 'dueDate', 'priority', 'defaultFlow', 'conditionExpression']
    const standard: Record<string, PropertyValue> = {}

    for (const key of standardKeys) {
      if (properties[key] !== undefined) {
        standard[key] = properties[key]
      }
    }

    return standard
  }

  /**
   * 提取自定义属性
   */
  private extractCustomProperties(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[]
  ): Record<string, PropertyValue> {
    const custom: Record<string, PropertyValue> = {}
    const standardKeys = new Set(['id', 'name', 'documentation', 'assignee', 'candidateUsers', 'candidateGroups', 'dueDate', 'priority', 'defaultFlow', 'conditionExpression', 'formFields'])

    for (const [key, value] of Object.entries(properties)) {
      if (!standardKeys.has(key) && !key.startsWith('_') && value !== undefined) {
        custom[key] = value
      }
    }

    return custom
  }

  /**
   * 创建属性扩展元素
   */
  private createPropertiesElement(properties: Record<string, PropertyValue>, moddle: any): any {
    const propertiesElement = moddle.create('zeebe:Properties')
    const propertyElements = []

    for (const [key, value] of Object.entries(properties)) {
      const property = moddle.create('zeebe:Property', {
        name: key,
        value: this.serializeValue(value)
      })
      propertyElements.push(property)
    }

    propertiesElement.properties = propertyElements
    return propertiesElement
  }

  /**
   * 创建表单数据元素
   */
  private createFormDataElement(formFields: FormField[], moddle: any): any {
    const formDataElement = moddle.create('zeebe:FormData')
    const formFieldElements = []

    for (const field of formFields) {
      const formField = moddle.create('zeebe:FormField', {
        id: field.id,
        label: field.label,
        type: field.type,
        defaultValue: field.defaultValue ? this.serializeValue(field.defaultValue) : undefined
      })

      // 添加验证规则
      if (field.validation && field.validation.length > 0) {
        const validationElement = moddle.create('zeebe:Validation')
        const constraints = []

        for (const rule of field.validation) {
          const constraint = moddle.create('zeebe:Constraint', {
            name: rule.type,
            config: rule.value ? this.serializeValue(rule.value) : undefined
          })
          constraints.push(constraint)
        }

        validationElement.constraints = constraints
        formField.validation = validationElement
      }

      // 添加属性
      if (field.properties && Object.keys(field.properties).length > 0) {
        const propertiesElement = moddle.create('zeebe:Properties')
        const propertyElements = []

        for (const [key, value] of Object.entries(field.properties)) {
          const property = moddle.create('zeebe:Property', {
            name: key,
            value: this.serializeValue(value)
          })
          propertyElements.push(property)
        }

        propertiesElement.properties = propertyElements
        formField.properties = propertiesElement
      }

      formFieldElements.push(formField)
    }

    formDataElement.formFields = formFieldElements
    return formDataElement
  }

  /**
   * 创建事件定义
   */
  private createEventDefinitions(properties: Record<string, PropertyValue>, moddle: any): any[] {
    const definitions = []
    const eventType = properties.eventType as string

    switch (eventType) {
      case 'message':
        const messageRef = moddle.create('bpmn:Message', {
          name: properties.messageName as string
        })
        const messageDef = moddle.create('bpmn:MessageEventDefinition', {
          messageRef
        })
        definitions.push(messageDef)
        break

      case 'timer':
        const timerDef = moddle.create('bpmn:TimerEventDefinition')
        const expression = properties.timerExpression as string
        
        if (expression) {
          if (expression.startsWith('PT') || expression.startsWith('P')) {
            // Duration
            timerDef.timeDuration = moddle.create('bpmn:FormalExpression', {
              body: expression
            })
          } else {
            // Cycle
            timerDef.timeCycle = moddle.create('bpmn:FormalExpression', {
              body: expression
            })
          }
        }
        definitions.push(timerDef)
        break

      case 'error':
        const errorRef = moddle.create('bpmn:Error', {
          errorCode: properties.errorCode as string
        })
        const errorDef = moddle.create('bpmn:ErrorEventDefinition', {
          errorRef
        })
        definitions.push(errorDef)
        break

      case 'signal':
        const signalRef = moddle.create('bpmn:Signal', {
          name: properties.signalName as string
        })
        const signalDef = moddle.create('bpmn:SignalEventDefinition', {
          signalRef
        })
        definitions.push(signalDef)
        break
    }

    return definitions
  }

  /**
   * 创建执行监听器
   */
  private createExecutionListener(listener: any, moddle: any): any {
    return moddle.create('zeebe:ExecutionListener', {
      event: listener.event,
      type: listener.type,
      value: listener.value
    })
  }

  /**
   * 创建任务监听器
   */
  private createTaskListener(listener: any, moddle: any): any {
    return moddle.create('zeebe:TaskListener', {
      event: listener.event,
      type: listener.type,
      value: listener.value
    })
  }

  /**
   * 序列化值
   */
  private serializeValue(value: PropertyValue): string {
    if (typeof value === 'string') {
      return value
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    } else if (value instanceof Date) {
      return value.toISOString()
    } else if (Array.isArray(value)) {
      return value.join(',')
    } else if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value)
    }
    return String(value)
  }

  /**
   * 反序列化值
   */
  private deserializeValue(value: string, type?: string): PropertyValue {
    if (!value) return ''

    switch (type) {
      case 'number':
        const num = Number(value)
        return isNaN(num) ? value : num
      case 'boolean':
        return value === 'true' || value === '1'
      case 'date':
        const date = new Date(value)
        return isNaN(date.getTime()) ? value : date
      case 'json':
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      default:
        return value
    }
  }

  /**
   * 检查是否有事件定义
   */
  private hasEventDefinitions(properties: Record<string, PropertyValue>): boolean {
    return !!properties.eventType
  }

  /**
   * 提取执行监听器
   */
  private extractExecutionListeners(properties: Record<string, PropertyValue>): any[] {
    const listeners = properties.executionListeners
    return Array.isArray(listeners) ? listeners : []
  }

  /**
   * 提取任务监听器
   */
  private extractTaskListeners(properties: Record<string, PropertyValue>): any[] {
    const listeners = properties.taskListeners
    return Array.isArray(listeners) ? listeners : []
  }

  /**
   * 解析属性元素
   */
  private parsePropertiesElement(element: any): Record<string, PropertyValue> {
    const properties: Record<string, PropertyValue> = {}
    
    if (element.properties) {
      for (const prop of element.properties) {
        properties[prop.name] = this.deserializeValue(prop.value)
      }
    }

    return properties
  }

  /**
   * 解析表单数据元素
   */
  private parseFormDataElement(element: any): FormField[] {
    const formFields: FormField[] = []

    if (element.formFields) {
      for (const field of element.formFields) {
        const formField: FormField = {
          id: field.id,
          label: field.label,
          type: field.type,
          defaultValue: field.defaultValue ? this.deserializeValue(field.defaultValue) : undefined
        }

        // 解析验证规则
        if (field.validation && field.validation.constraints) {
          formField.validation = field.validation.constraints.map((constraint: any) => ({
            type: constraint.name,
            value: constraint.config ? this.deserializeValue(constraint.config) : undefined,
            message: constraint.message || ''
          }))
        }

        // 解析属性
        if (field.properties && field.properties.properties) {
          formField.properties = this.parsePropertiesElement(field.properties)
        }

        formFields.push(formField)
      }
    }

    return formFields
  }

  /**
   * 解析事件定义
   */
  private parseEventDefinition(element: any, properties: Record<string, PropertyValue>): void {
    switch (element.$type) {
      case 'bpmn:MessageEventDefinition':
        properties.eventType = 'message'
        properties.messageName = element.messageRef?.name || ''
        break
      case 'bpmn:TimerEventDefinition':
        properties.eventType = 'timer'
        properties.timerExpression = element.timeDuration?.body || element.timeCycle?.body || ''
        break
      case 'bpmn:ErrorEventDefinition':
        properties.eventType = 'error'
        properties.errorCode = element.errorRef?.errorCode || ''
        break
      case 'bpmn:SignalEventDefinition':
        properties.eventType = 'signal'
        properties.signalName = element.signalRef?.name || ''
        break
    }
  }

  /**
   * 解析执行监听器
   */
  private parseExecutionListeners(element: any): any[] {
    return element.listeners || []
  }

  /**
   * 解析任务监听器
   */
  private parseTaskListeners(element: any): any[] {
    return element.listeners || []
  }

  /**
   * 解析未知元素
   */
  private parseUnknownElement(element: any, properties: Record<string, PropertyValue>): void {
    // 可以在这里处理其他扩展元素
    console.log('未知扩展元素:', element.$type)
  }

  /**
   * 导出为JSON格式
   */
  private exportAsJSON(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    format: PropertyExportFormat
  ): string {
    const data: any = { properties }

    if (format.includeMetadata) {
      data.metadata = {
        exportTime: new Date().toISOString(),
        version: '1.0',
        configs: configs.map(config => ({
          key: config.key,
          label: config.label,
          type: config.type,
          required: config.required
        }))
      }
    }

    return JSON.stringify(data, null, 2)
  }

  /**
   * 导出为XML格式
   */
  private exportAsXML(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    format: PropertyExportFormat
  ): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<properties>\n'

    if (format.includeMetadata) {
      xml += '  <metadata>\n'
      xml += `    <exportTime>${new Date().toISOString()}</exportTime>\n`
      xml += '    <version>1.0</version>\n'
      xml += '  </metadata>\n'
    }

    xml += '  <data>\n'
    for (const [key, value] of Object.entries(properties)) {
      xml += `    <property key="${key}">${this.escapeXml(this.serializeValue(value))}</property>\n`
    }
    xml += '  </data>\n'
    xml += '</properties>'

    return xml
  }

  /**
   * 导出为YAML格式
   */
  private exportAsYAML(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    format: PropertyExportFormat
  ): string {
    let yaml = ''

    if (format.includeMetadata) {
      yaml += 'metadata:\n'
      yaml += `  exportTime: ${new Date().toISOString()}\n`
      yaml += '  version: "1.0"\n'
      yaml += '\n'
    }

    yaml += 'properties:\n'
    for (const [key, value] of Object.entries(properties)) {
      yaml += `  ${key}: "${this.escapeYaml(this.serializeValue(value))}"\n`
    }

    return yaml
  }

  /**
   * 导出为CSV格式
   */
  private exportAsCSV(
    properties: Record<string, PropertyValue>,
    configs: PropertyConfig[],
    format: PropertyExportFormat
  ): string {
    let csv = 'key,value,type,label\n'

    for (const [key, value] of Object.entries(properties)) {
      const config = configs.find(c => c.key === key)
      csv += `"${key}","${this.escapeCsv(this.serializeValue(value))}","${config?.type || ''}","${config?.label || ''}"\n`
    }

    return csv
  }

  /**
   * 从JSON导入
   */
  private importFromJSON(data: string, configs: PropertyConfig[]): Record<string, PropertyValue> {
    try {
      const parsed = JSON.parse(data)
      return parsed.properties || parsed
    } catch (error) {
      throw new Error('Invalid JSON format')
    }
  }

  /**
   * 从XML导入
   */
  private importFromXML(data: string, configs: PropertyConfig[]): Record<string, PropertyValue> {
    // 简单的XML解析实现
    const properties: Record<string, PropertyValue> = {}
    const regex = /<property key="([^"]+)">([^<]*)<\/property>/g
    let match

    while ((match = regex.exec(data)) !== null) {
      const key = match[1]
      const value = this.unescapeXml(match[2])
      const config = configs.find(c => c.key === key)
      properties[key] = this.deserializeValue(value, config?.type)
    }

    return properties
  }

  /**
   * 从YAML导入
   */
  private importFromYAML(data: string, configs: PropertyConfig[]): Record<string, PropertyValue> {
    // 简单的YAML解析实现
    const properties: Record<string, PropertyValue> = {}
    const lines = data.split('\n')
    let inProperties = false

    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed === 'properties:') {
        inProperties = true
        continue
      }
      
      if (inProperties && trimmed.startsWith('  ')) {
        const match = trimmed.match(/^(\w+):\s*"?([^"]*)"?$/)
        if (match) {
          const key = match[1]
          const value = this.unescapeYaml(match[2])
          const config = configs.find(c => c.key === key)
          properties[key] = this.deserializeValue(value, config?.type)
        }
      } else if (inProperties && !trimmed.startsWith('  ')) {
        break
      }
    }

    return properties
  }

  /**
   * 从CSV导入
   */
  private importFromCSV(data: string, configs: PropertyConfig[]): Record<string, PropertyValue> {
    const properties: Record<string, PropertyValue> = {}
    const lines = data.split('\n')
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const match = line.match(/^"([^"]+)","([^"]*)","[^"]*","[^"]*"$/)
      if (match) {
        const key = match[1]
        const value = this.unescapeCsv(match[2])
        const config = configs.find(c => c.key === key)
        properties[key] = this.deserializeValue(value, config?.type)
      }
    }

    return properties
  }

  /**
   * XML转义
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  /**
   * XML反转义
   */
  private unescapeXml(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }

  /**
   * YAML转义
   */
  private escapeYaml(text: string): string {
    return text.replace(/"/g, '\\"')
  }

  /**
   * YAML反转义
   */
  private unescapeYaml(text: string): string {
    return text.replace(/\\"/g, '"')
  }

  /**
   * CSV转义
   */
  private escapeCsv(text: string): string {
    return text.replace(/"/g, '""')
  }

  /**
   * CSV反转义
   */
  private unescapeCsv(text: string): string {
    return text.replace(/""/g, '"')
  }
}

// 创建全局序列化器实例
export const propertySerializer = new PropertySerializer()