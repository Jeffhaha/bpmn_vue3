/**
 * BPMN节点渲染器系统
 * 提供统一的节点UI封装和自定义渲染能力
 */

import { createVNode, render } from 'vue'
import type { App, Component } from 'vue'
import type { BpmnElement } from '@/types'

// 节点样式配置接口
export interface NodeStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  borderRadius?: number
  opacity?: number
  fontSize?: number
  fontFamily?: string
  color?: string
  iconColor?: string
  shadowColor?: string
  shadowBlur?: number
}

// 节点渲染配置接口
export interface NodeRenderConfig {
  width: number
  height: number
  style: NodeStyle
  icon?: string
  label?: string
  customComponent?: Component
}

// 基础节点渲染器
export abstract class BaseNodeRenderer {
  protected element: BpmnElement
  protected config: NodeRenderConfig
  protected container?: HTMLElement

  constructor(element: BpmnElement, config: NodeRenderConfig) {
    this.element = element
    this.config = config
  }

  /**
   * 渲染节点
   */
  abstract render(container: HTMLElement): void

  /**
   * 更新节点
   */
  abstract update(element: BpmnElement): void

  /**
   * 销毁节点
   */
  abstract destroy(): void

  /**
   * 获取节点尺寸
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height
    }
  }

  /**
   * 获取节点样式
   */
  getStyle(): NodeStyle {
    return this.config.style
  }

  /**
   * 更新样式
   */
  updateStyle(style: Partial<NodeStyle>): void {
    this.config.style = { ...this.config.style, ...style }
    this.refresh()
  }

  /**
   * 刷新渲染
   */
  protected abstract refresh(): void
}

// SVG节点渲染器
export class SvgNodeRenderer extends BaseNodeRenderer {
  private svgElement?: SVGSVGElement
  private shapeElement?: SVGElement

  render(container: HTMLElement): void {
    this.container = container
    
    // 创建SVG元素
    this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    this.svgElement.setAttribute('width', this.config.width.toString())
    this.svgElement.setAttribute('height', this.config.height.toString())
    this.svgElement.classList.add('bpmn-node-svg')

    // 根据节点类型创建形状
    this.createShape()
    
    // 应用样式
    this.applyStyles()
    
    // 添加到容器
    container.appendChild(this.svgElement)
  }

  update(element: BpmnElement): void {
    this.element = element
    this.refresh()
  }

  destroy(): void {
    if (this.svgElement && this.container) {
      this.container.removeChild(this.svgElement)
    }
    this.svgElement = undefined
    this.shapeElement = undefined
  }

  protected refresh(): void {
    if (this.shapeElement) {
      this.applyStyles()
    }
  }

  private createShape(): void {
    if (!this.svgElement) return

    const { width, height } = this.config
    
    switch (this.element.type) {
      case 'bpmn:StartEvent':
        this.shapeElement = this.createCircle(width / 2, height / 2, Math.min(width, height) / 2 - 2)
        break
      
      case 'bpmn:EndEvent':
        this.shapeElement = this.createCircle(width / 2, height / 2, Math.min(width, height) / 2 - 2)
        break
      
      case 'bpmn:Task':
      case 'bpmn:UserTask':
      case 'bpmn:ServiceTask':
        this.shapeElement = this.createRoundedRect(2, 2, width - 4, height - 4, 8)
        break
      
      case 'bpmn:ExclusiveGateway':
        this.shapeElement = this.createDiamond(width / 2, height / 2, width / 2 - 2)
        break
      
      default:
        this.shapeElement = this.createRoundedRect(2, 2, width - 4, height - 4, 4)
    }

    if (this.shapeElement) {
      this.svgElement.appendChild(this.shapeElement)
    }

    // 添加图标
    if (this.config.icon) {
      this.addIcon()
    }

    // 添加标签
    if (this.config.label) {
      this.addLabel()
    }
  }

  private createCircle(cx: number, cy: number, r: number): SVGCircleElement {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', cx.toString())
    circle.setAttribute('cy', cy.toString())
    circle.setAttribute('r', r.toString())
    return circle
  }

  private createRoundedRect(x: number, y: number, width: number, height: number, rx: number): SVGRectElement {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    rect.setAttribute('x', x.toString())
    rect.setAttribute('y', y.toString())
    rect.setAttribute('width', width.toString())
    rect.setAttribute('height', height.toString())
    rect.setAttribute('rx', rx.toString())
    return rect
  }

  private createDiamond(cx: number, cy: number, size: number): SVGPolygonElement {
    const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    const points = `${cx},${cy - size} ${cx + size},${cy} ${cx},${cy + size} ${cx - size},${cy}`
    diamond.setAttribute('points', points)
    return diamond
  }

  private addIcon(): void {
    if (!this.svgElement || !this.config.icon) return

    const iconSize = 16
    const x = (this.config.width - iconSize) / 2
    const y = (this.config.height - iconSize) / 2 - 5

    const iconText = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    iconText.setAttribute('x', (x + iconSize / 2).toString())
    iconText.setAttribute('y', (y + iconSize / 2 + 4).toString())
    iconText.setAttribute('text-anchor', 'middle')
    iconText.setAttribute('dominant-baseline', 'middle')
    iconText.setAttribute('font-family', 'Font Awesome 5 Free')
    iconText.setAttribute('font-size', iconSize.toString())
    iconText.setAttribute('fill', this.config.style.iconColor || '#666')
    iconText.textContent = this.config.icon

    this.svgElement.appendChild(iconText)
  }

  private addLabel(): void {
    if (!this.svgElement || !this.config.label) return

    const fontSize = this.config.style.fontSize || 12
    const y = this.config.height - 8

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    label.setAttribute('x', (this.config.width / 2).toString())
    label.setAttribute('y', y.toString())
    label.setAttribute('text-anchor', 'middle')
    label.setAttribute('font-size', fontSize.toString())
    label.setAttribute('font-family', this.config.style.fontFamily || 'Arial, sans-serif')
    label.setAttribute('fill', this.config.style.color || '#333')
    label.textContent = this.config.label

    this.svgElement.appendChild(label)
  }

  private applyStyles(): void {
    if (!this.shapeElement) return

    const style = this.config.style
    
    if (style.fill) {
      this.shapeElement.setAttribute('fill', style.fill)
    }
    if (style.stroke) {
      this.shapeElement.setAttribute('stroke', style.stroke)
    }
    if (style.strokeWidth) {
      this.shapeElement.setAttribute('stroke-width', style.strokeWidth.toString())
    }
    if (style.opacity) {
      this.shapeElement.setAttribute('opacity', style.opacity.toString())
    }

    // 添加阴影效果
    if (style.shadowColor && style.shadowBlur) {
      this.addShadowEffect()
    }
  }

  private addShadowEffect(): void {
    if (!this.svgElement) return

    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter')
    filter.setAttribute('id', `shadow-${this.element.id}`)

    const shadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow')
    shadow.setAttribute('dx', '2')
    shadow.setAttribute('dy', '2')
    shadow.setAttribute('stdDeviation', this.config.style.shadowBlur!.toString())
    shadow.setAttribute('flood-color', this.config.style.shadowColor!)

    filter.appendChild(shadow)
    defs.appendChild(filter)
    this.svgElement.appendChild(defs)

    if (this.shapeElement) {
      this.shapeElement.setAttribute('filter', `url(#shadow-${this.element.id})`)
    }
  }
}

// Vue节点渲染器
export class VueNodeRenderer extends BaseNodeRenderer {
  private vueApp?: App
  private vueContainer?: HTMLElement

  render(container: HTMLElement): void {
    this.container = container
    
    if (this.config.customComponent) {
      this.renderVueComponent()
    } else {
      // 降级到SVG渲染
      const svgRenderer = new SvgNodeRenderer(this.element, this.config)
      svgRenderer.render(container)
    }
  }

  update(element: BpmnElement): void {
    this.element = element
    this.refresh()
  }

  destroy(): void {
    if (this.vueApp) {
      this.vueApp.unmount()
    }
    if (this.vueContainer && this.container) {
      this.container.removeChild(this.vueContainer)
    }
  }

  protected refresh(): void {
    if (this.config.customComponent) {
      this.renderVueComponent()
    }
  }

  private renderVueComponent(): void {
    if (!this.config.customComponent || !this.container) return

    // 创建Vue组件容器
    if (!this.vueContainer) {
      this.vueContainer = document.createElement('div')
      this.vueContainer.classList.add('bpmn-vue-node')
      this.container.appendChild(this.vueContainer)
    }

    // 创建Vue实例
    const vnode = createVNode(this.config.customComponent, {
      element: this.element,
      config: this.config,
      style: this.config.style
    })

    // 渲染到容器
    render(vnode, this.vueContainer)
  }
}