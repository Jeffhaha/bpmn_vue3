/**
 * BPMN节点渲染器注册系统
 * 提供动态节点渲染器注册、节点类型映射和样式主题管理
 */

import type { Component } from 'vue'
import type { BpmnElement } from '@/types'
import type { BaseNodeRenderer, NodeRenderConfig, NodeStyle } from './node-renderers'
import { SvgNodeRenderer, VueNodeRenderer } from './node-renderers'

// 导入默认节点组件
import BaseNode from '@/components/bpmn/nodes/BaseNode.vue'
import TaskNode from '@/components/bpmn/nodes/TaskNode.vue'
import GatewayNode from '@/components/bpmn/nodes/GatewayNode.vue'
import EventNode from '@/components/bpmn/nodes/EventNode.vue'

// 渲染器类型
export type RendererType = 'svg' | 'vue' | 'custom'

// 节点渲染器配置
export interface NodeRendererConfig {
  type: RendererType
  component?: Component
  style?: Partial<NodeStyle>
  width?: number
  height?: number
  priority?: number // 优先级，数字越大优先级越高
}

// 主题配置
export interface ThemeConfig {
  name: string
  colors: {
    primary: string
    secondary: string
    success: string
    warning: string
    error: string
    text: string
    background: string
    border: string
  }
  nodeStyles: {
    [nodeType: string]: Partial<NodeStyle>
  }
}

// 节点渲染器注册表
class NodeRegistry {
  private renderers = new Map<string, NodeRendererConfig[]>()
  private themes = new Map<string, ThemeConfig>()
  private currentTheme = 'default'
  private defaultRenderer: RendererType = 'vue'

  constructor() {
    this.initializeDefaultRenderers()
    this.initializeDefaultThemes()
  }

  /**
   * 注册节点渲染器
   */
  registerRenderer(
    nodeType: string, 
    config: NodeRendererConfig
  ): void {
    if (!this.renderers.has(nodeType)) {
      this.renderers.set(nodeType, [])
    }
    
    const renderers = this.renderers.get(nodeType)!
    
    // 按优先级插入
    const priority = config.priority || 0
    const insertIndex = renderers.findIndex(r => (r.priority || 0) < priority)
    
    if (insertIndex === -1) {
      renderers.push(config)
    } else {
      renderers.splice(insertIndex, 0, config)
    }
  }

  /**
   * 获取节点渲染器
   */
  getRenderer(element: BpmnElement): BaseNodeRenderer {
    const nodeType = element.type
    const config = this.getRendererConfig(element)
    
    switch (config.type) {
      case 'vue':
        return new VueNodeRenderer(element, this.buildRenderConfig(element, config))
      case 'svg':
        return new SvgNodeRenderer(element, this.buildRenderConfig(element, config))
      case 'custom':
        if (config.component) {
          return new VueNodeRenderer(element, this.buildRenderConfig(element, config))
        }
        // 降级到默认渲染器
        return this.getDefaultRenderer(element)
      default:
        return this.getDefaultRenderer(element)
    }
  }

  /**
   * 获取渲染器配置
   */
  private getRendererConfig(element: BpmnElement): NodeRendererConfig {
    const nodeType = element.type
    const renderers = this.renderers.get(nodeType)
    
    if (renderers && renderers.length > 0) {
      return renderers[0] // 返回最高优先级的渲染器
    }
    
    // 尝试通用匹配
    for (const [type, configs] of this.renderers.entries()) {
      if (nodeType.includes(type.replace('bpmn:', ''))) {
        return configs[0]
      }
    }
    
    // 返回默认配置
    return {
      type: this.defaultRenderer,
      component: BaseNode
    }
  }

  /**
   * 构建渲染配置
   */
  private buildRenderConfig(
    element: BpmnElement, 
    rendererConfig: NodeRendererConfig
  ): NodeRenderConfig {
    const baseStyle = this.getThemeStyle(element.type)
    const customStyle = rendererConfig.style || {}
    
    return {
      width: rendererConfig.width || this.getDefaultWidth(element.type),
      height: rendererConfig.height || this.getDefaultHeight(element.type),
      style: { ...baseStyle, ...customStyle },
      customComponent: rendererConfig.component
    }
  }

  /**
   * 获取默认渲染器
   */
  private getDefaultRenderer(element: BpmnElement): BaseNodeRenderer {
    const config: NodeRenderConfig = {
      width: this.getDefaultWidth(element.type),
      height: this.getDefaultHeight(element.type),
      style: this.getThemeStyle(element.type),
      customComponent: BaseNode
    }
    
    return new VueNodeRenderer(element, config)
  }

  /**
   * 获取主题样式
   */
  private getThemeStyle(nodeType: string): NodeStyle {
    const theme = this.themes.get(this.currentTheme)
    if (!theme) {
      return this.getDefaultStyle(nodeType)
    }
    
    const themeStyle = theme.nodeStyles[nodeType] || theme.nodeStyles['default'] || {}
    const defaultStyle = this.getDefaultStyle(nodeType)
    
    return { ...defaultStyle, ...themeStyle }
  }

  /**
   * 获取默认样式
   */
  private getDefaultStyle(nodeType: string): NodeStyle {
    const baseStyle: NodeStyle = {
      fill: '#fff',
      stroke: '#666',
      strokeWidth: 1,
      borderRadius: 4,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      color: '#333',
      shadowColor: 'rgba(0,0,0,0.1)',
      shadowBlur: 2
    }
    
    // 根据节点类型调整默认样式
    switch (nodeType) {
      case 'bpmn:StartEvent':
        return {
          ...baseStyle,
          stroke: '#67c23a',
          borderRadius: 50
        }
      
      case 'bpmn:EndEvent':
        return {
          ...baseStyle,
          fill: '#333',
          stroke: '#f56c6c',
          strokeWidth: 3,
          color: '#fff',
          borderRadius: 50
        }
      
      case 'bpmn:UserTask':
        return {
          ...baseStyle,
          stroke: '#409eff',
          borderRadius: 8
        }
      
      case 'bpmn:ServiceTask':
        return {
          ...baseStyle,
          stroke: '#67c23a',
          borderRadius: 8
        }
      
      case 'bpmn:ExclusiveGateway':
        return {
          ...baseStyle,
          stroke: '#f56c6c',
          borderRadius: 4
        }
      
      default:
        return baseStyle
    }
  }

  /**
   * 获取默认宽度
   */
  private getDefaultWidth(nodeType: string): number {
    switch (nodeType) {
      case 'bpmn:StartEvent':
      case 'bpmn:EndEvent':
        return 36
      case 'bpmn:IntermediateCatchEvent':
      case 'bpmn:IntermediateThrowEvent':
        return 32
      case 'bpmn:ExclusiveGateway':
      case 'bpmn:InclusiveGateway':
      case 'bpmn:ParallelGateway':
        return 50
      case 'bpmn:Task':
      case 'bpmn:UserTask':
      case 'bpmn:ServiceTask':
        return 100
      default:
        return 80
    }
  }

  /**
   * 获取默认高度
   */
  private getDefaultHeight(nodeType: string): number {
    switch (nodeType) {
      case 'bpmn:StartEvent':
      case 'bpmn:EndEvent':
        return 36
      case 'bpmn:IntermediateCatchEvent':
      case 'bpmn:IntermediateThrowEvent':
        return 32
      case 'bpmn:ExclusiveGateway':
      case 'bpmn:InclusiveGateway':
      case 'bpmn:ParallelGateway':
        return 50
      case 'bpmn:Task':
      case 'bpmn:UserTask':
      case 'bpmn:ServiceTask':
        return 80
      default:
        return 60
    }
  }

  /**
   * 注册主题
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme)
  }

  /**
   * 设置当前主题
   */
  setTheme(themeName: string): void {
    if (this.themes.has(themeName)) {
      this.currentTheme = themeName
    }
  }

  /**
   * 获取当前主题
   */
  getCurrentTheme(): ThemeConfig | undefined {
    return this.themes.get(this.currentTheme)
  }

  /**
   * 获取所有主题
   */
  getThemes(): ThemeConfig[] {
    return Array.from(this.themes.values())
  }

  /**
   * 清除特定类型的渲染器
   */
  clearRenderers(nodeType: string): void {
    this.renderers.delete(nodeType)
  }

  /**
   * 清除所有渲染器
   */
  clearAllRenderers(): void {
    this.renderers.clear()
    this.initializeDefaultRenderers()
  }

  /**
   * 初始化默认渲染器
   */
  private initializeDefaultRenderers(): void {
    // 任务节点
    this.registerRenderer('bpmn:Task', {
      type: 'vue',
      component: TaskNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:UserTask', {
      type: 'vue',
      component: TaskNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:ServiceTask', {
      type: 'vue',
      component: TaskNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:ScriptTask', {
      type: 'vue',
      component: TaskNode,
      priority: 100
    })
    
    // 网关节点
    this.registerRenderer('bpmn:ExclusiveGateway', {
      type: 'vue',
      component: GatewayNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:InclusiveGateway', {
      type: 'vue',
      component: GatewayNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:ParallelGateway', {
      type: 'vue',
      component: GatewayNode,
      priority: 100
    })
    
    // 事件节点
    this.registerRenderer('bpmn:StartEvent', {
      type: 'vue',
      component: EventNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:EndEvent', {
      type: 'vue',
      component: EventNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:IntermediateCatchEvent', {
      type: 'vue',
      component: EventNode,
      priority: 100
    })
    
    this.registerRenderer('bpmn:IntermediateThrowEvent', {
      type: 'vue',
      component: EventNode,
      priority: 100
    })
  }

  /**
   * 初始化默认主题
   */
  private initializeDefaultThemes(): void {
    // 默认主题
    this.registerTheme({
      name: 'default',
      colors: {
        primary: '#409eff',
        secondary: '#909399',
        success: '#67c23a',
        warning: '#e6a23c',
        error: '#f56c6c',
        text: '#333',
        background: '#fff',
        border: '#dcdfe6'
      },
      nodeStyles: {
        default: {
          fill: '#fff',
          stroke: '#dcdfe6',
          strokeWidth: 1,
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          color: '#333'
        },
        'bpmn:StartEvent': {
          stroke: '#67c23a',
          iconColor: '#67c23a'
        },
        'bpmn:EndEvent': {
          fill: '#333',
          stroke: '#f56c6c',
          color: '#fff'
        },
        'bpmn:UserTask': {
          stroke: '#409eff',
          iconColor: '#409eff'
        },
        'bpmn:ServiceTask': {
          stroke: '#67c23a',
          iconColor: '#67c23a'
        }
      }
    })
    
    // 深色主题
    this.registerTheme({
      name: 'dark',
      colors: {
        primary: '#409eff',
        secondary: '#909399',
        success: '#67c23a',
        warning: '#e6a23c',
        error: '#f56c6c',
        text: '#fff',
        background: '#1f1f1f',
        border: '#3f3f3f'
      },
      nodeStyles: {
        default: {
          fill: '#2f2f2f',
          stroke: '#4f4f4f',
          strokeWidth: 1,
          fontSize: 12,
          fontFamily: 'Arial, sans-serif',
          color: '#fff'
        }
      }
    })
  }
}

// 导出单例实例
export const nodeRegistry = new NodeRegistry()

// 便捷函数
export function registerNodeRenderer(nodeType: string, config: NodeRendererConfig): void {
  nodeRegistry.registerRenderer(nodeType, config)
}

export function getNodeRenderer(element: BpmnElement): BaseNodeRenderer {
  return nodeRegistry.getRenderer(element)
}

export function setNodeTheme(themeName: string): void {
  nodeRegistry.setTheme(themeName)
}

export { NodeRegistry, type NodeRendererConfig, type ThemeConfig }