<template>
  <div 
    class="base-node" 
    :class="nodeClasses"
    :style="nodeStyles"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 节点主体内容 -->
    <div class="node-content">
      <!-- 图标区域 -->
      <div v-if="icon" class="node-icon">
        <i :class="iconClasses" :style="iconStyles"></i>
      </div>
      
      <!-- 主要内容插槽 -->
      <div class="node-body">
        <slot name="content">
          <!-- 默认标题 -->
          <div v-if="title" class="node-title">{{ title }}</div>
          
          <!-- 默认描述 -->
          <div v-if="description" class="node-description">{{ description }}</div>
        </slot>
      </div>
      
      <!-- 状态指示器 -->
      <div v-if="status" class="node-status" :class="statusClasses">
        <div class="status-indicator"></div>
      </div>
    </div>
    
    <!-- 自定义叠加层 -->
    <div v-if="$slots.overlay" class="node-overlay">
      <slot name="overlay"></slot>
    </div>
    
    <!-- 连接点 -->
    <div v-if="showConnectionPoints" class="connection-points">
      <div class="connection-point top" data-direction="top"></div>
      <div class="connection-point right" data-direction="right"></div>
      <div class="connection-point bottom" data-direction="bottom"></div>
      <div class="connection-point left" data-direction="left"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BpmnElement } from '@/types'
import type { NodeStyle } from '@/utils/node-renderers'

// Props
interface Props {
  element: BpmnElement
  config?: {
    width?: number
    height?: number
    style?: NodeStyle
    icon?: string
    title?: string
    description?: string
  }
  selected?: boolean
  hovered?: boolean
  status?: 'success' | 'error' | 'warning' | 'running'
  showConnectionPoints?: boolean
  interactive?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  hovered: false,
  showConnectionPoints: false,
  interactive: true
})

// Emits
const emit = defineEmits<{
  'node-click': [element: BpmnElement, event: MouseEvent]
  'node-hover': [element: BpmnElement, hovered: boolean]
}>()

// 状态
const isHovered = ref(false)

// 计算属性
const nodeClasses = computed(() => ({
  [`node-type-${props.element.type.replace('bpmn:', '')}`]: true,
  'node-selected': props.selected,
  'node-hovered': props.hovered || isHovered.value,
  'node-interactive': props.interactive,
  [`node-status-${props.status}`]: props.status
}))

const nodeStyles = computed(() => {
  const style = props.config?.style || {}
  const width = props.config?.width || 100
  const height = props.config?.height || 80
  
  return {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: style.fill || '#fff',
    borderColor: style.stroke || '#ddd',
    borderWidth: `${style.strokeWidth || 1}px`,
    borderRadius: `${style.borderRadius || 8}px`,
    opacity: style.opacity || 1,
    fontSize: `${style.fontSize || 12}px`,
    fontFamily: style.fontFamily || 'Arial, sans-serif',
    color: style.color || '#333',
    boxShadow: style.shadowColor && style.shadowBlur 
      ? `0 2px ${style.shadowBlur}px ${style.shadowColor}` 
      : undefined
  }
})

const icon = computed(() => props.config?.icon)
const title = computed(() => props.config?.title || props.element.businessObject?.name)
const description = computed(() => props.config?.description)

const iconClasses = computed(() => {
  if (!icon.value) return []
  
  const classes = [icon.value]
  
  // 根据节点类型添加默认图标
  if (!icon.value) {
    switch (props.element.type) {
      case 'bpmn:StartEvent':
        classes.push('fas fa-play')
        break
      case 'bpmn:EndEvent':
        classes.push('fas fa-stop')
        break
      case 'bpmn:UserTask':
        classes.push('fas fa-user')
        break
      case 'bpmn:ServiceTask':
        classes.push('fas fa-cogs')
        break
      case 'bpmn:ExclusiveGateway':
        classes.push('fas fa-code-branch')
        break
      default:
        classes.push('fas fa-square')
    }
  }
  
  return classes
})

const iconStyles = computed(() => {
  const style = props.config?.style || {}
  return {
    color: style.iconColor || style.color || '#666',
    fontSize: '16px'
  }
})

const statusClasses = computed(() => ({
  [`status-${props.status}`]: props.status
}))

// 事件处理
function handleClick(event: MouseEvent) {
  if (props.interactive) {
    emit('node-click', props.element, event)
  }
}

function handleMouseEnter() {
  isHovered.value = true
  emit('node-hover', props.element, true)
}

function handleMouseLeave() {
  isHovered.value = false
  emit('node-hover', props.element, false)
}
</script>

<style lang="scss" scoped>
.base-node {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid;
  cursor: default;
  transition: all 0.2s ease;
  user-select: none;
  box-sizing: border-box;
  
  &.node-interactive {
    cursor: pointer;
  }
  
  &.node-hovered {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }
  
  &.node-selected {
    border-color: #409eff !important;
    border-width: 2px !important;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

.node-content {
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 8px;
  gap: 8px;
}

.node-icon {
  flex-shrink: 0;
  
  i {
    display: block;
    text-align: center;
  }
}

.node-body {
  flex: 1;
  min-width: 0;
  text-align: center;
}

.node-title {
  font-weight: 500;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-description {
  font-size: 0.85em;
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-status {
  position: absolute;
  top: 4px;
  right: 4px;
  
  .status-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    
    .status-success & {
      background-color: #67c23a;
    }
    
    .status-error & {
      background-color: #f56c6c;
    }
    
    .status-warning & {
      background-color: #e6a23c;
    }
    
    .status-running & {
      background-color: #409eff;
      animation: pulse 1.5s infinite;
    }
  }
}

.node-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.connection-points {
  .connection-point {
    position: absolute;
    width: 8px;
    height: 8px;
    background-color: #409eff;
    border: 1px solid #fff;
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
    
    &.top {
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    &.right {
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
    }
    
    &.bottom {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    &.left {
      top: 50%;
      left: -4px;
      transform: translateY(-50%);
    }
  }
}

.base-node.node-hovered .connection-points .connection-point,
.base-node.node-selected .connection-points .connection-point {
  opacity: 1;
}

// 节点类型特定样式
.node-type-StartEvent,
.node-type-EndEvent {
  border-radius: 50% !important;
  
  .node-content {
    justify-content: center;
    text-align: center;
  }
}

.node-type-ExclusiveGateway {
  transform: rotate(45deg);
  
  .node-content {
    transform: rotate(-45deg);
    justify-content: center;
    text-align: center;
  }
}

.node-type-Task,
.node-type-UserTask,
.node-type-ServiceTask {
  border-radius: 8px !important;
}

// 状态样式
.node-status-success {
  border-color: #67c23a !important;
}

.node-status-error {
  border-color: #f56c6c !important;
}

.node-status-warning {
  border-color: #e6a23c !important;
}

.node-status-running {
  border-color: #409eff !important;
}

// 动画
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>