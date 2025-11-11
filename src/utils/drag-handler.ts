/**
 * BPMN节点拖拽处理器
 * 处理节点的拖拽、连接、移动等交互功能
 */

import type { BpmnElement } from '@/types'

// 拖拽状态
export interface DragState {
  isDragging: boolean
  isConnecting: boolean
  dragElement?: BpmnElement
  dragStartPoint?: { x: number; y: number }
  currentPoint?: { x: number; y: number }
  sourceElement?: BpmnElement
  targetElement?: BpmnElement
}

// 拖拽配置
export interface DragConfig {
  enableDrag?: boolean
  enableConnect?: boolean
  enableResize?: boolean
  snapToGrid?: boolean
  gridSize?: number
  dragThreshold?: number
}

// 拖拽事件
export interface DragEvent {
  type: 'dragStart' | 'drag' | 'dragEnd' | 'connectStart' | 'connecting' | 'connectEnd'
  element?: BpmnElement
  position?: { x: number; y: number }
  sourceElement?: BpmnElement
  targetElement?: BpmnElement
  event?: MouseEvent
}

export class DragHandler {
  private container: HTMLElement
  private modeler: any
  private config: DragConfig
  private state: DragState
  private listeners: Map<string, ((event: DragEvent) => void)[]>

  constructor(container: HTMLElement, modeler: any, config: DragConfig = {}) {
    this.container = container
    this.modeler = modeler
    this.config = {
      enableDrag: true,
      enableConnect: true,
      enableResize: false,
      snapToGrid: true,
      gridSize: 10,
      dragThreshold: 3,
      ...config
    }
    
    this.state = {
      isDragging: false,
      isConnecting: false
    }
    
    this.listeners = new Map()
    
    this.initializeEventListeners()
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this))
    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    
    // 禁用默认的拖拽行为
    this.container.addEventListener('dragstart', (e) => e.preventDefault())
    this.container.addEventListener('selectstart', (e) => e.preventDefault())
  }

  /**
   * 处理鼠标按下事件
   */
  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement
    const elementId = this.getElementId(target)
    
    if (!elementId) return
    
    const element = this.getElementById(elementId)
    if (!element) return

    // 检查是否点击连接点
    const connectionPoint = target.closest('.connection-point') as HTMLElement
    if (connectionPoint && this.config.enableConnect) {
      this.startConnection(element, event, connectionPoint)
      return
    }
    
    // 检查是否可拖拽
    if (this.config.enableDrag && this.isDraggableElement(target)) {
      this.startDrag(element, event)
    }
  }

  /**
   * 处理鼠标移动事件
   */
  private handleMouseMove(event: MouseEvent): void {
    if (this.state.isDragging) {
      this.handleDragMove(event)
    } else if (this.state.isConnecting) {
      this.handleConnectMove(event)
    }
  }

  /**
   * 处理鼠标释放事件
   */
  private handleMouseUp(event: MouseEvent): void {
    if (this.state.isDragging) {
      this.endDrag(event)
    } else if (this.state.isConnecting) {
      this.endConnection(event)
    }
  }

  /**
   * 开始拖拽
   */
  private startDrag(element: BpmnElement, event: MouseEvent): void {
    event.preventDefault()
    
    const rect = this.container.getBoundingClientRect()
    this.state = {
      ...this.state,
      isDragging: true,
      dragElement: element,
      dragStartPoint: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
    
    this.emit('dragStart', {
      type: 'dragStart',
      element,
      position: this.state.dragStartPoint,
      event
    })
    
    // 添加拖拽样式
    this.addDragStyles(element)
  }

  /**
   * 处理拖拽移动
   */
  private handleDragMove(event: MouseEvent): void {
    if (!this.state.dragElement || !this.state.dragStartPoint) return
    
    const rect = this.container.getBoundingClientRect()
    const currentPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    // 检查拖拽阈值
    const deltaX = Math.abs(currentPoint.x - this.state.dragStartPoint.x)
    const deltaY = Math.abs(currentPoint.y - this.state.dragStartPoint.y)
    
    if (deltaX < this.config.dragThreshold! && deltaY < this.config.dragThreshold!) {
      return
    }
    
    // 应用网格对齐
    if (this.config.snapToGrid && this.config.gridSize) {
      currentPoint.x = Math.round(currentPoint.x / this.config.gridSize) * this.config.gridSize
      currentPoint.y = Math.round(currentPoint.y / this.config.gridSize) * this.config.gridSize
    }
    
    this.state.currentPoint = currentPoint
    
    // 移动元素
    this.moveElement(this.state.dragElement, currentPoint)
    
    this.emit('drag', {
      type: 'drag',
      element: this.state.dragElement,
      position: currentPoint,
      event
    })
  }

  /**
   * 结束拖拽
   */
  private endDrag(event: MouseEvent): void {
    if (!this.state.dragElement) return
    
    const element = this.state.dragElement
    
    this.emit('dragEnd', {
      type: 'dragEnd',
      element,
      position: this.state.currentPoint,
      event
    })
    
    // 移除拖拽样式
    this.removeDragStyles(element)
    
    // 重置状态
    this.state = {
      isDragging: false,
      isConnecting: false
    }
  }

  /**
   * 开始连接
   */
  private startConnection(element: BpmnElement, event: MouseEvent, connectionPoint: HTMLElement): void {
    event.preventDefault()
    event.stopPropagation()
    
    const direction = connectionPoint.dataset.direction
    const rect = this.container.getBoundingClientRect()
    
    this.state = {
      ...this.state,
      isConnecting: true,
      sourceElement: element,
      dragStartPoint: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }
    
    this.emit('connectStart', {
      type: 'connectStart',
      sourceElement: element,
      position: this.state.dragStartPoint,
      event
    })
    
    // 创建连接线预览
    this.createConnectionPreview(element, this.state.dragStartPoint)
  }

  /**
   * 处理连接移动
   */
  private handleConnectMove(event: MouseEvent): void {
    if (!this.state.sourceElement || !this.state.dragStartPoint) return
    
    const rect = this.container.getBoundingClientRect()
    const currentPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    
    this.state.currentPoint = currentPoint
    
    // 更新连接线预览
    this.updateConnectionPreview(currentPoint)
    
    // 检查目标元素
    const targetElement = this.getElementAtPoint(currentPoint)
    if (targetElement && targetElement !== this.state.sourceElement) {
      this.state.targetElement = targetElement
      this.highlightTargetElement(targetElement)
    } else {
      this.state.targetElement = undefined
      this.clearTargetHighlight()
    }
    
    this.emit('connecting', {
      type: 'connecting',
      sourceElement: this.state.sourceElement,
      targetElement: this.state.targetElement,
      position: currentPoint,
      event
    })
  }

  /**
   * 结束连接
   */
  private endConnection(event: MouseEvent): void {
    const sourceElement = this.state.sourceElement
    const targetElement = this.state.targetElement
    
    if (sourceElement && targetElement && this.canConnect(sourceElement, targetElement)) {
      this.createConnection(sourceElement, targetElement)
    }
    
    this.emit('connectEnd', {
      type: 'connectEnd',
      sourceElement,
      targetElement,
      position: this.state.currentPoint,
      event
    })
    
    // 清理连接预览
    this.clearConnectionPreview()
    this.clearTargetHighlight()
    
    // 重置状态
    this.state = {
      isDragging: false,
      isConnecting: false
    }
  }

  /**
   * 移动元素
   */
  private moveElement(element: BpmnElement, position: { x: number; y: number }): void {
    if (!this.modeler) return
    
    try {
      const modeling = this.modeler.get('modeling')
      modeling.moveElements([element], {
        x: position.x - (this.state.dragStartPoint?.x || 0),
        y: position.y - (this.state.dragStartPoint?.y || 0)
      })
    } catch (error) {
      console.error('移动元素失败:', error)
    }
  }

  /**
   * 创建连接
   */
  private createConnection(source: BpmnElement, target: BpmnElement): void {
    if (!this.modeler) return
    
    try {
      const modeling = this.modeler.get('modeling')
      
      // 根据元素类型确定连接类型
      const connectionType = this.getConnectionType(source, target)
      
      modeling.connect(source, target, {
        type: connectionType
      })
    } catch (error) {
      console.error('创建连接失败:', error)
    }
  }

  /**
   * 获取连接类型
   */
  private getConnectionType(source: BpmnElement, target: BpmnElement): string {
    // 简单的连接类型判断，实际应用中可能需要更复杂的逻辑
    return 'bpmn:SequenceFlow'
  }

  /**
   * 检查是否可以连接
   */
  private canConnect(source: BpmnElement, target: BpmnElement): boolean {
    // 简单的连接规则检查
    if (source.id === target.id) return false
    
    // 根据BPMN规则检查连接的有效性
    const sourceType = source.type
    const targetType = target.type
    
    // 事件可以连接到任务和网关
    if (sourceType.includes('Event')) {
      return targetType.includes('Task') || targetType.includes('Gateway') || targetType.includes('Event')
    }
    
    // 任务可以连接到任务、网关和事件
    if (sourceType.includes('Task')) {
      return targetType.includes('Task') || targetType.includes('Gateway') || targetType.includes('Event')
    }
    
    // 网关可以连接到任务和事件
    if (sourceType.includes('Gateway')) {
      return targetType.includes('Task') || targetType.includes('Event') || targetType.includes('Gateway')
    }
    
    return true
  }

  /**
   * 获取元素ID
   */
  private getElementId(element: HTMLElement): string | null {
    const bpmnElement = element.closest('[data-element-id]') as HTMLElement
    return bpmnElement?.dataset.elementId || null
  }

  /**
   * 根据ID获取元素
   */
  private getElementById(id: string): BpmnElement | null {
    if (!this.modeler) return null
    
    try {
      const elementRegistry = this.modeler.get('elementRegistry')
      return elementRegistry.get(id)
    } catch (error) {
      return null
    }
  }

  /**
   * 获取指定坐标的元素
   */
  private getElementAtPoint(point: { x: number; y: number }): BpmnElement | null {
    const elementAtPoint = document.elementFromPoint(
      point.x + this.container.getBoundingClientRect().left,
      point.y + this.container.getBoundingClientRect().top
    ) as HTMLElement
    
    if (elementAtPoint) {
      const elementId = this.getElementId(elementAtPoint)
      return elementId ? this.getElementById(elementId) : null
    }
    
    return null
  }

  /**
   * 检查元素是否可拖拽
   */
  private isDraggableElement(element: HTMLElement): boolean {
    return element.closest('.bpmn-element, .djs-element') !== null
  }

  /**
   * 添加拖拽样式
   */
  private addDragStyles(element: BpmnElement): void {
    const elementNode = this.container.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement
    if (elementNode) {
      elementNode.classList.add('dragging')
    }
  }

  /**
   * 移除拖拽样式
   */
  private removeDragStyles(element: BpmnElement): void {
    const elementNode = this.container.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement
    if (elementNode) {
      elementNode.classList.remove('dragging')
    }
  }

  /**
   * 创建连接线预览
   */
  private createConnectionPreview(source: BpmnElement, startPoint: { x: number; y: number }): void {
    const svg = this.container.querySelector('svg')
    if (!svg) return
    
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    line.setAttribute('id', 'connection-preview')
    line.setAttribute('x1', startPoint.x.toString())
    line.setAttribute('y1', startPoint.y.toString())
    line.setAttribute('x2', startPoint.x.toString())
    line.setAttribute('y2', startPoint.y.toString())
    line.setAttribute('stroke', '#409eff')
    line.setAttribute('stroke-width', '2')
    line.setAttribute('stroke-dasharray', '5,5')
    line.style.pointerEvents = 'none'
    
    svg.appendChild(line)
  }

  /**
   * 更新连接线预览
   */
  private updateConnectionPreview(endPoint: { x: number; y: number }): void {
    const line = this.container.querySelector('#connection-preview') as SVGLineElement
    if (line) {
      line.setAttribute('x2', endPoint.x.toString())
      line.setAttribute('y2', endPoint.y.toString())
    }
  }

  /**
   * 清理连接线预览
   */
  private clearConnectionPreview(): void {
    const line = this.container.querySelector('#connection-preview')
    if (line) {
      line.remove()
    }
  }

  /**
   * 高亮目标元素
   */
  private highlightTargetElement(element: BpmnElement): void {
    this.clearTargetHighlight()
    
    const elementNode = this.container.querySelector(`[data-element-id="${element.id}"]`) as HTMLElement
    if (elementNode) {
      elementNode.classList.add('connection-target')
    }
  }

  /**
   * 清除目标高亮
   */
  private clearTargetHighlight(): void {
    const highlighted = this.container.querySelectorAll('.connection-target')
    highlighted.forEach(el => el.classList.remove('connection-target'))
  }

  /**
   * 监听事件
   */
  on(eventType: string, callback: (event: DragEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType)!.push(callback)
  }

  /**
   * 移除事件监听器
   */
  off(eventType: string, callback?: (event: DragEvent) => void): void {
    if (!callback) {
      this.listeners.delete(eventType)
      return
    }
    
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 触发事件
   */
  private emit(eventType: string, event: DragEvent): void {
    const callbacks = this.listeners.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => callback(event))
    }
  }

  /**
   * 销毁处理器
   */
  destroy(): void {
    this.container.removeEventListener('mousedown', this.handleMouseDown)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    
    this.listeners.clear()
  }
}

// CSS样式（需要添加到全局样式中）
export const dragStyles = `
.dragging {
  opacity: 0.7;
  transform: scale(1.05);
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.connection-target {
  outline: 2px solid #67c23a !important;
  outline-offset: 2px;
}

.connection-point {
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: crosshair;
}

.djs-element:hover .connection-point,
.djs-element.selected .connection-point {
  opacity: 1;
}
`