import Modeler from 'bpmn-js/lib/Modeler'
import CustomBpmnRenderer from './bpmn-custom-renderer'
import type { BpmnModelerOptions, BpmnElement, BpmnEvent } from '@/types'

/**
 * BPMN建模器服务类
 * 负责BPMN.js与Vue的集成和交互
 */
export class BpmnService {
  private modeler: Modeler | null = null
  private container: HTMLElement | null = null
  private eventHandlers: Map<string, Function[]> = new Map()
  
  /**
   * 初始化建模器
   */
  async initialize(container: HTMLElement, options?: BpmnModelerOptions): Promise<void> {
    if (this.modeler) {
      this.destroy()
    }
    
    this.container = container
    
    // 抑制BPMN.js的wheel事件警告（这是第三方库的已知问题）
    this.suppressWheelEventWarnings()
    
    const modelerOptions = {
      container,
      width: options?.width || container.clientWidth || window.innerWidth,
      height: options?.height || container.clientHeight || window.innerHeight - 60,
      moddleExtensions: options?.moddleExtensions || {},
      additionalModules: [
        // 添加自定义渲染器模块
        {
          customRenderer: ['type', CustomBpmnRenderer]
        },
        ...(options?.additionalModules || [])
      ],
      // 确保调色板启用
      keyboard: {
        bindTo: document
      },
      ...options
    }
    
    this.modeler = new Modeler(modelerOptions)
    
    // 绑定事件监听器
    this.bindEvents()
    
    // 创建默认流程
    await this.createNewProcess()
  }
  
  /**
   * 获取建模器实例
   */
  getModeler(): Modeler | null {
    return this.modeler
  }
  
  /**
   * 创建新流程
   */
  async createNewProcess(): Promise<void> {
    if (!this.modeler) {
      throw new Error('建模器未初始化')
    }
    
    const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
    
    await this.importXML(defaultXml)
  }
  
  /**
   * 导入XML
   */
  async importXML(xml: string): Promise<void> {
    if (!this.modeler) {
      throw new Error('建模器未初始化')
    }
    
    try {
      await this.modeler.importXML(xml)
      this.emit('xml.imported', { type: 'xml.imported', xml })
    } catch (error) {
      console.error('导入XML失败:', error)
      throw error
    }
  }
  
  /**
   * 导出XML
   */
  async exportXML(options?: { format?: boolean }): Promise<string> {
    if (!this.modeler) {
      throw new Error('建模器未初始化')
    }
    
    try {
      const result = await this.modeler.saveXML(options)
      return result.xml
    } catch (error) {
      console.error('导出XML失败:', error)
      throw error
    }
  }
  
  /**
   * 导出SVG
   */
  async exportSVG(): Promise<string> {
    if (!this.modeler) {
      throw new Error('建模器未初始化')
    }
    
    try {
      const result = await this.modeler.saveSVG()
      return result.svg
    } catch (error) {
      console.error('导出SVG失败:', error)
      throw error
    }
  }
  
  /**
   * 获取所有元素
   */
  getAllElements(): BpmnElement[] {
    if (!this.modeler) {
      return []
    }
    
    const elementRegistry = this.modeler.get('elementRegistry')
    return elementRegistry.getAll()
  }
  
  /**
   * 根据ID获取元素
   */
  getElementById(id: string): BpmnElement | undefined {
    if (!this.modeler) {
      return undefined
    }
    
    const elementRegistry = this.modeler.get('elementRegistry')
    return elementRegistry.get(id)
  }
  
  /**
   * 获取选中的元素
   */
  getSelectedElements(): BpmnElement[] {
    if (!this.modeler) {
      return []
    }
    
    const selection = this.modeler.get('selection')
    return selection.get()
  }
  
  /**
   * 选择元素
   */
  selectElement(element: BpmnElement | string): void {
    if (!this.modeler) {
      return
    }
    
    const selection = this.modeler.get('selection')
    
    if (typeof element === 'string') {
      const el = this.getElementById(element)
      if (el) {
        selection.select(el)
      }
    } else {
      selection.select(element)
    }
  }
  
  /**
   * 清除选择
   */
  clearSelection(): void {
    if (!this.modeler) {
      return
    }
    
    const selection = this.modeler.get('selection')
    selection.select([])
  }
  
  /**
   * 缩放到适合大小
   */
  zoomToFit(): void {
    if (!this.modeler) {
      return
    }
    
    const canvas = this.modeler.get('canvas')
    canvas.zoom('fit-viewport')
  }
  
  /**
   * 重置缩放
   */
  resetZoom(): void {
    if (!this.modeler) {
      return
    }
    
    const canvas = this.modeler.get('canvas')
    canvas.zoom(1.0)
  }
  
  /**
   * 抑制BPMN.js的wheel事件警告
   * 这是BPMN.js库的已知问题，暂时无法修复
   */
  private suppressWheelEventWarnings(): void {
    // 保存原始的console.warn
    const originalWarn = console.warn
    
    // 重写console.warn以过滤特定的wheel事件警告
    console.warn = function(...args: any[]) {
      const message = args.join(' ')
      
      // 过滤掉BPMN.js的wheel事件警告
      if (message.includes('preventDefault') && 
          (message.includes('wheel') || message.includes('touchstart') || message.includes('touchmove'))) {
        return
      }
      
      // 其他警告正常显示
      originalWarn.apply(console, args)
    }
  }

  /**
   * 绑定事件监听器
   */
  private bindEvents(): void {
    if (!this.modeler) {
      return
    }
    
    const eventBus = this.modeler.get('eventBus')
    
    // 元素选择事件
    eventBus.on('selection.changed', (event: any) => {
      this.emit('selection.changed', {
        type: 'selection.changed',
        element: event.newSelection[0] || null,
        elements: event.newSelection
      })
    })
    
    // 元素修改事件
    eventBus.on('commandStack.changed', (event: any) => {
      this.emit('elements.changed', {
        type: 'elements.changed',
        data: event
      })
    })
    
    // 元素添加事件
    eventBus.on('shape.added', (event: any) => {
      this.emit('element.added', {
        type: 'element.added',
        element: event.element
      })
    })
    
    // 元素删除事件
    eventBus.on('shape.removed', (event: any) => {
      this.emit('element.removed', {
        type: 'element.removed',
        element: event.element
      })
    })
  }
  
  /**
   * 注册事件监听器
   */
  on(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType)!.push(handler)
  }
  
  /**
   * 移除事件监听器
   */
  off(eventType: string, handler: Function): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }
  
  /**
   * 触发事件
   */
  private emit(eventType: string, event: BpmnEvent): void {
    const handlers = this.eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }
  
  /**
   * 调整画布大小
   */
  resize(): void {
    if (!this.modeler || !this.container) {
      return
    }
    
    const canvas = this.modeler.get('canvas')
    canvas.resized()
  }
  
  /**
   * 销毁建模器
   */
  destroy(): void {
    if (this.modeler) {
      this.modeler.destroy()
      this.modeler = null
    }
    
    this.container = null
    this.eventHandlers.clear()
  }
}

// 创建单例实例
export const bpmnService = new BpmnService()