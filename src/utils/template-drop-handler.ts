import type { 
  NodeTemplate, 
  TemplateInstantiationConfig,
  TemplateDragData,
  BpmnElement 
} from '@/types'

/**
 * 模板拖拽实例化处理器
 * 负责处理模板的拖拽操作和节点实例化
 */
export class TemplateDropHandler {
  private modeler: any
  private canvas: any
  private elementFactory: any
  private modeling: any
  
  constructor(modeler: any) {
    this.modeler = modeler
    this.canvas = modeler.get('canvas')
    this.elementFactory = modeler.get('elementFactory')
    this.modeling = modeler.get('modeling')
  }

  /**
   * 处理模板拖拽到画布
   */
  onTemplateDrop(template: NodeTemplate, position: { x: number; y: number }): BpmnElement {
    console.log('处理模板拖拽:', template.name, '位置:', position)
    
    try {
      // 创建BPMN元素
      const element = this.instantiateNode(template, { position })
      
      // 添加到画布
      const rootElement = this.canvas.getRootElement()
      const createdElement = this.modeling.createShape(element, position, rootElement)
      
      // 应用模板配置
      this.applyTemplate(createdElement, template)
      
      console.log('模板拖拽实例化成功:', createdElement)
      return createdElement
    } catch (error) {
      console.error('模板拖拽失败:', error)
      throw error
    }
  }

  /**
   * 实例化节点
   */
  instantiateNode(template: NodeTemplate, config?: Partial<TemplateInstantiationConfig>): any {
    const elementId = this.generateElementId(template.nodeType)
    
    // 根据节点类型创建相应的元素
    let element: any
    
    switch (template.nodeType) {
      case 'bpmn:UserTask':
      case 'bpmn:ServiceTask':
      case 'bpmn:ScriptTask':
      case 'bpmn:BusinessRuleTask':
      case 'bpmn:SendTask':
      case 'bpmn:ReceiveTask':
      case 'bpmn:ManualTask':
        element = this.createTaskElement(template, elementId)
        break
        
      case 'bpmn:StartEvent':
      case 'bpmn:EndEvent':
      case 'bpmn:IntermediateCatchEvent':
      case 'bpmn:IntermediateThrowEvent':
        element = this.createEventElement(template, elementId)
        break
        
      case 'bpmn:ExclusiveGateway':
      case 'bpmn:InclusiveGateway':
      case 'bpmn:ParallelGateway':
      case 'bpmn:EventBasedGateway':
        element = this.createGatewayElement(template, elementId)
        break
        
      case 'bpmn:SubProcess':
        element = this.createSubProcessElement(template, elementId)
        break
        
      default:
        element = this.createGenericElement(template, elementId)
    }

    // 应用自定义位置
    if (config?.position) {
      element.x = config.position.x
      element.y = config.position.y
    }

    return element
  }

  /**
   * 应用模板配置到元素
   */
  applyTemplate(element: BpmnElement, template: NodeTemplate): void {
    try {
      const businessObject = element.businessObject
      
      if (!businessObject) {
        console.warn('元素缺少业务对象，跳过模板应用')
        return
      }

      // 应用模板属性
      Object.entries(template.properties).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          businessObject[key] = value
        }
      })

      // 应用模板默认值
      Object.entries(template.templateConfig.defaultValues).forEach(([key, value]) => {
        if (businessObject[key] === undefined) {
          businessObject[key] = value
        }
      })

      // 设置模板关联信息
      if (!businessObject.extensionElements) {
        businessObject.extensionElements = this.modeler.get('moddle').create('bpmn:ExtensionElements')
      }

      // 添加模板元数据
      const templateInfo = this.modeler.get('moddle').create('custom:TemplateInfo', {
        templateId: template.id,
        templateVersion: template.metadata.version,
        templateName: template.name,
        inheritedProperties: Object.keys(template.properties),
        appliedAt: new Date().toISOString()
      })

      if (!businessObject.extensionElements.values) {
        businessObject.extensionElements.values = []
      }
      businessObject.extensionElements.values.push(templateInfo)

      console.log('模板配置应用成功:', template.name, '到元素:', element.id)
    } catch (error) {
      console.error('应用模板配置失败:', error)
    }
  }

  /**
   * 更新元素的模板绑定
   */
  updateInstanceBinding(elementId: string, templateId: string): void {
    try {
      const elementRegistry = this.modeler.get('elementRegistry')
      const element = elementRegistry.get(elementId)
      
      if (!element) {
        throw new Error(`元素 ${elementId} 不存在`)
      }

      const businessObject = element.businessObject
      if (businessObject.extensionElements) {
        // 查找现有的模板信息
        const templateInfos = businessObject.extensionElements.values?.filter(
          (ext: any) => ext.$type === 'custom:TemplateInfo'
        ) || []

        if (templateInfos.length > 0) {
          // 更新现有的模板绑定
          templateInfos[0].templateId = templateId
          templateInfos[0].updatedAt = new Date().toISOString()
        } else {
          // 创建新的模板绑定
          const templateInfo = this.modeler.get('moddle').create('custom:TemplateInfo', {
            templateId,
            bindingType: 'manual',
            boundAt: new Date().toISOString()
          })
          businessObject.extensionElements.values.push(templateInfo)
        }
      }

      console.log('元素模板绑定已更新:', elementId, templateId)
    } catch (error) {
      console.error('更新模板绑定失败:', error)
    }
  }

  /**
   * 获取元素的模板信息
   */
  getElementTemplateInfo(element: BpmnElement): any {
    try {
      const businessObject = element.businessObject
      if (!businessObject?.extensionElements?.values) {
        return null
      }

      const templateInfo = businessObject.extensionElements.values.find(
        (ext: any) => ext.$type === 'custom:TemplateInfo'
      )

      return templateInfo || null
    } catch (error) {
      console.error('获取元素模板信息失败:', error)
      return null
    }
  }

  // === 私有方法 ===

  /**
   * 生成元素ID
   */
  private generateElementId(type: string): string {
    const prefix = type.split(':')[1] || 'Element'
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  /**
   * 创建任务元素
   */
  private createTaskElement(template: NodeTemplate, elementId: string): any {
    const businessObject = this.modeler.get('moddle').create(template.nodeType, {
      id: elementId,
      name: template.name
    })

    return this.elementFactory.createShape({
      type: template.nodeType,
      businessObject,
      width: template.uiConfig.size.width,
      height: template.uiConfig.size.height
    })
  }

  /**
   * 创建事件元素
   */
  private createEventElement(template: NodeTemplate, elementId: string): any {
    const businessObject = this.modeler.get('moddle').create(template.nodeType, {
      id: elementId,
      name: template.name
    })

    return this.elementFactory.createShape({
      type: template.nodeType,
      businessObject,
      width: template.uiConfig.size.width,
      height: template.uiConfig.size.height
    })
  }

  /**
   * 创建网关元素
   */
  private createGatewayElement(template: NodeTemplate, elementId: string): any {
    const businessObject = this.modeler.get('moddle').create(template.nodeType, {
      id: elementId,
      name: template.name,
      gatewayDirection: template.properties.gatewayDirection || 'Diverging'
    })

    return this.elementFactory.createShape({
      type: template.nodeType,
      businessObject,
      width: template.uiConfig.size.width,
      height: template.uiConfig.size.height
    })
  }

  /**
   * 创建子流程元素
   */
  private createSubProcessElement(template: NodeTemplate, elementId: string): any {
    const businessObject = this.modeler.get('moddle').create(template.nodeType, {
      id: elementId,
      name: template.name
    })

    return this.elementFactory.createShape({
      type: template.nodeType,
      businessObject,
      width: template.uiConfig.size.width || 120,
      height: template.uiConfig.size.height || 100
    })
  }

  /**
   * 创建通用元素
   */
  private createGenericElement(template: NodeTemplate, elementId: string): any {
    const businessObject = this.modeler.get('moddle').create(template.nodeType, {
      id: elementId,
      name: template.name
    })

    return this.elementFactory.createShape({
      type: template.nodeType,
      businessObject,
      width: template.uiConfig.size.width || 80,
      height: template.uiConfig.size.height || 60
    })
  }

  /**
   * 检查位置是否有效
   */
  private isValidPosition(position: { x: number; y: number }): boolean {
    const canvasViewbox = this.canvas.viewbox()
    return position.x >= canvasViewbox.x && 
           position.y >= canvasViewbox.y &&
           position.x <= canvasViewbox.x + canvasViewbox.width &&
           position.y <= canvasViewbox.y + canvasViewbox.height
  }

  /**
   * 调整位置以避免重叠
   */
  private adjustPositionForOverlap(position: { x: number; y: number }, size: { width: number; height: number }): { x: number; y: number } {
    const elementRegistry = this.modeler.get('elementRegistry')
    const elements = elementRegistry.getAll()

    let adjustedPosition = { ...position }
    let attempts = 0
    const maxAttempts = 10
    
    while (attempts < maxAttempts) {
      let hasOverlap = false
      
      for (const element of elements) {
        if (element.type === 'bpmn:Process') continue
        
        const elementBounds = {
          x: element.x || 0,
          y: element.y || 0,
          width: element.width || 80,
          height: element.height || 60
        }

        const newBounds = {
          x: adjustedPosition.x,
          y: adjustedPosition.y,
          width: size.width,
          height: size.height
        }

        if (this.boundsOverlap(elementBounds, newBounds)) {
          hasOverlap = true
          break
        }
      }

      if (!hasOverlap) {
        break
      }

      // 调整位置
      adjustedPosition.x += 20
      adjustedPosition.y += 20
      attempts++
    }

    return adjustedPosition
  }

  /**
   * 检查两个边界是否重叠
   */
  private boundsOverlap(bounds1: any, bounds2: any): boolean {
    return !(bounds1.x + bounds1.width < bounds2.x ||
             bounds2.x + bounds2.width < bounds1.x ||
             bounds1.y + bounds1.height < bounds2.y ||
             bounds2.y + bounds2.height < bounds1.y)
  }
}

export default TemplateDropHandler