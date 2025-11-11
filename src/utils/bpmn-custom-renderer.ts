/**
 * BPMN.js自定义渲染器
 * 集成我们的节点UI系统到BPMN.js渲染管道
 */

import BaseRenderer from 'diagram-js/lib/draw/BaseRenderer'
import { createVNode, render } from 'vue'
import { nodeRegistry } from './node-registry'
import type { BpmnElement } from '@/types'

const HIGH_PRIORITY = 1500

/**
 * 自定义BPMN渲染器类
 */
export default class CustomBpmnRenderer extends BaseRenderer {
  private vueContainers: Map<string, HTMLElement> = new Map()

  constructor(eventBus: any, styles: any) {
    super(eventBus, HIGH_PRIORITY)
    
    // 监听元素删除事件，清理Vue组件
    eventBus.on('shape.remove', (event: any) => {
      this.cleanupVueComponent(event.element.id)
    })
  }

  /**
   * 检查是否可以渲染该元素
   */
  canRender(element: BpmnElement): boolean {
    // 检查是否有注册的渲染器
    return !!nodeRegistry.getNodeConfig(element.type)
  }

  /**
   * 渲染BPMN形状
   */
  drawShape(parentNode: SVGElement, element: BpmnElement): SVGElement {
    try {
      const renderer = nodeRegistry.getRenderer(element)
      
      if (renderer) {
        // 使用注册系统的渲染器
        const container = this.createSvgContainer(parentNode, element)
        renderer.render(container as any as HTMLElement)
        return container
      }
    } catch (error) {
      console.warn('自定义渲染失败，使用默认渲染:', error)
    }
    
    // 降级到默认渲染
    return this.createDefaultShape(parentNode, element)
  }

  /**
   * 渲染连接线
   */
  drawConnection(parentNode: SVGElement, element: BpmnElement): SVGElement {
    // 使用默认连接线渲染或自定义样式
    return this.createDefaultConnection(parentNode, element)
  }

  /**
   * 创建SVG容器
   */
  private createSvgContainer(parentNode: SVGElement, element: BpmnElement): SVGElement {
    const config = nodeRegistry.getNodeConfig(element.type)
    const width = config?.width || element.width || 100
    const height = config?.height || element.height || 80

    const container = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    container.setAttribute('data-element-id', element.id)
    container.classList.add('bpmn-element')
    
    parentNode.appendChild(container)
    
    return container
  }

  /**
   * 渲染Vue组件
   */
  private renderVueComponent(container: SVGElement, element: BpmnElement, config: any): void {
    // 创建HTML容器用于Vue组件
    const htmlContainer = document.createElement('div')
    htmlContainer.style.cssText = `
      position: absolute;
      pointer-events: auto;
      z-index: 100;
    `
    
    // 将HTML容器添加到body（临时方案）
    document.body.appendChild(htmlContainer)
    this.vueContainers.set(element.id, htmlContainer)
    
    // 创建Vue组件实例
    const vnode = createVNode(config.component, {
      element,
      config: {
        width: config.width,
        height: config.height,
        style: config.style
      },
      selected: false,
      interactive: true
    })
    
    render(vnode, htmlContainer)
    
    // 创建SVG外国对象来嵌入HTML
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    foreignObject.setAttribute('width', config.width.toString())
    foreignObject.setAttribute('height', config.height.toString())
    foreignObject.setAttribute('x', '0')
    foreignObject.setAttribute('y', '0')
    
    // 克隆HTML内容到foreignObject
    const clonedContent = htmlContainer.cloneNode(true) as HTMLElement
    clonedContent.style.position = 'relative'
    clonedContent.style.width = `${config.width}px`
    clonedContent.style.height = `${config.height}px`
    
    foreignObject.appendChild(clonedContent)
    container.appendChild(foreignObject)
  }

  /**
   * 渲染SVG形状
   */
  private renderSvgShape(container: SVGElement, element: BpmnElement, config: any): void {
    const width = config.width || 100
    const height = config.height || 80
    const style = config.style || {}

    let shape: SVGElement

    // 根据节点类型创建不同形状
    switch (element.type) {
      case 'bpmn:StartEvent':
      case 'bpmn:EndEvent':
        shape = this.createCircle(width / 2, height / 2, Math.min(width, height) / 2 - 2)
        break
      
      case 'bpmn:ExclusiveGateway':
      case 'bpmn:InclusiveGateway':
      case 'bpmn:ParallelGateway':
        shape = this.createDiamond(width / 2, height / 2, width / 2 - 2)
        break
      
      default:
        shape = this.createRoundedRect(0, 0, width, height, 8)
    }

    // 应用样式
    this.applyShapeStyle(shape, style, element.type)
    container.appendChild(shape)

    // 添加图标和标签
    if (config.icon) {
      const icon = this.createIcon(config.icon, width / 2, height / 2 - 5, style.iconColor)
      container.appendChild(icon)
    }

    const name = element.businessObject?.name
    if (name) {
      const label = this.createLabel(name, width / 2, height - 8, style)
      container.appendChild(label)
    }
  }

  /**
   * 创建圆形
   */
  private createCircle(cx: number, cy: number, r: number): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', cx.toString())
    circle.setAttribute('cy', cy.toString())
    circle.setAttribute('r', r.toString())
    return circle
  }

  /**
   * 创建菱形
   */
  private createDiamond(cx: number, cy: number, size: number): SVGPolygonElement {
    const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`
    diamond.setAttribute('points', points)
    return diamond
  }

  /**
   * 创建圆角矩形
   */
  private createRoundedRect(x: number, y: number, width: number, height: number, rx: number): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', x.toString())
    rect.setAttribute('y', y.toString())
    rect.setAttribute('width', width.toString())
    rect.setAttribute('height', height.toString())
    rect.setAttribute('rx', rx.toString())
    return rect
  }

  /**
   * 创建图标
   */
  private createIcon(iconClass: string, x: number, y: number, color?: string): SVGTextElement {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    text.setAttribute('x', x.toString())
    text.setAttribute('y', y.toString())
    text.setAttribute('text-anchor', 'middle')
    text.setAttribute('dominant-baseline', 'middle')
    text.setAttribute('font-family', 'Font Awesome 5 Free')
    text.setAttribute('font-size', '16')
    text.setAttribute('fill', color || '#666')
    
    // 这里需要将Font Awesome类名转换为实际字符
    const iconChar = this.getIconCharacter(iconClass)
    text.textContent = iconChar
    
    return text
  }

  /**
   * 创建标签
   */
  private createLabel(text: string, x: number, y: number, style: any): SVGTextElement {
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', x.toString())
    label.setAttribute('y', y.toString())
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size', (style.fontSize || 12).toString())
    label.setAttribute('font-family', style.fontFamily || 'Arial, sans-serif')
    label.setAttribute('fill', style.color || '#333')
    label.textContent = text
    
    return label
  }

  /**
   * 应用形状样式
   */
  private applyShapeStyle(shape: SVGElement, style: any, elementType: string): void {
    if (style.fill) shape.setAttribute('fill', style.fill)
    if (style.stroke) shape.setAttribute('stroke', style.stroke)
    if (style.strokeWidth) shape.setAttribute('stroke-width', style.strokeWidth.toString())

    // 特殊样式处理
    if (elementType === 'bpmn:EndEvent') {
      shape.setAttribute('stroke-width', '3')
      shape.setAttribute('fill', '#333')
    }
  }

  /**
   * 获取图标字符（简化版本）
   */
  private getIconCharacter(iconClass: string): string {
    const iconMap: Record<string, string> = {
      'fas fa-play': '▶',
      'fas fa-stop': '⏹',
      'fas fa-user': '👤',
      'fas fa-cogs': '⚙',
      'fas fa-code': '💻',
      'fas fa-times': '✖',
      'fas fa-plus': '+',
      'fas fa-circle': '●'
    }
    
    return iconMap[iconClass] || '●'
  }

  /**
   * 创建默认形状（降级方案）
   */
  private createDefaultShape(parentNode: SVGElement, element: BpmnElement): SVGElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', '0')
    rect.setAttribute('y', '0')
    rect.setAttribute('width', (element.width || 100).toString())
    rect.setAttribute('height', (element.height || 80).toString())
    rect.setAttribute('fill', '#fff')
    rect.setAttribute('stroke', '#000')
    rect.setAttribute('stroke-width', '1')
    rect.setAttribute('rx', '4')
    
    parentNode.appendChild(rect)
    return rect
  }

  /**
   * 创建默认连接线（降级方案）
   */
  private createDefaultConnection(parentNode: SVGElement, element: BpmnElement): SVGElement {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('stroke', '#000')
    path.setAttribute('stroke-width', '1')
    path.setAttribute('fill', 'none')
    
    // 这里应该根据连接点计算实际路径
    path.setAttribute('d', 'M 0,0 L 100,0')
    
    parentNode.appendChild(path)
    return path
  }

  /**
   * 清理Vue组件
   */
  private cleanupVueComponent(elementId: string): void {
    const container = this.vueContainers.get(elementId)
    if (container) {
      container.remove()
      this.vueContainers.delete(elementId)
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    // 清理所有Vue组件
    this.vueContainers.forEach(container => container.remove())
    this.vueContainers.clear()
  }
}

// BPMN.js模块导出
CustomBpmnRenderer.$inject = ['eventBus', 'styles']