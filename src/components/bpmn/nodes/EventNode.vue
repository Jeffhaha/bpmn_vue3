<template>
  <BaseNode
    :element="element"
    :config="eventConfig"
    :selected="selected"
    :hovered="hovered"
    :status="status"
    :show-connection-points="showConnectionPoints"
    :interactive="interactive"
    @node-click="$emit('node-click', $event)"
    @node-hover="$emit('node-hover', $event)"
  >
    <template #content>
      <div class="event-content">
        <!-- 事件图标 -->
        <div class="event-icon-wrapper">
          <i :class="eventIconClasses" :style="iconStyles"></i>
        </div>
        
        <!-- 事件标题（仅在有名称时显示） -->
        <div v-if="eventTitle" class="event-title">
          {{ eventTitle }}
        </div>
        
        <!-- 事件定义指示器 -->
        <div v-if="eventDefinitions.length > 0" class="event-definitions">
          <span 
            v-for="definition in eventDefinitions" 
            :key="definition"
            :class="`definition-${definition}`"
            class="event-definition"
          >
            <i :class="getDefinitionIcon(definition)"></i>
          </span>
        </div>
      </div>
    </template>
    
    <template #overlay>
      <!-- 中断/非中断指示器（中间事件） -->
      <div v-if="isIntermediateEvent && !isInterrupting" class="event-non-interrupting-overlay">
        <div class="non-interrupting-border"></div>
      </div>
      
      <!-- 触发器指示器 -->
      <div v-if="hasTrigger" class="event-trigger-overlay">
        <div class="trigger-indicator">
          <i class="fas fa-bolt"></i>
        </div>
      </div>
    </template>
  </BaseNode>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseNode from './BaseNode.vue'
import type { BpmnElement } from '@/types'

// Props
interface Props {
  element: BpmnElement
  selected?: boolean
  hovered?: boolean
  status?: 'success' | 'error' | 'warning' | 'running'
  showConnectionPoints?: boolean
  interactive?: boolean
  // 事件特定属性
  isInterrupting?: boolean
  hasTrigger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  hovered: false,
  showConnectionPoints: false,
  interactive: true,
  isInterrupting: true
})

// Emits
defineEmits<{
  'node-click': [element: BpmnElement, event: MouseEvent]
  'node-hover': [element: BpmnElement, hovered: boolean]
}>()

// 计算属性
const eventType = computed(() => props.element.type)

const isStartEvent = computed(() => eventType.value.includes('StartEvent'))
const isEndEvent = computed(() => eventType.value.includes('EndEvent'))
const isIntermediateEvent = computed(() => eventType.value.includes('IntermediateEvent'))

const eventConfig = computed(() => ({
  width: getEventSize(),
  height: getEventSize(),
  style: getEventStyle()
}))

const eventTitle = computed(() => {
  return props.element.businessObject?.name
})

const eventDefinitions = computed(() => {
  const definitions: string[] = []
  const businessObject = props.element.businessObject
  
  if (businessObject?.eventDefinitions) {
    businessObject.eventDefinitions.forEach((def: any) => {
      const type = def.$type.replace('bpmn:', '').replace('EventDefinition', '').toLowerCase()
      definitions.push(type)
    })
  }
  
  return definitions
})

const eventIconClasses = computed(() => {
  const baseClasses = ['event-icon']
  
  if (isStartEvent.value) {
    baseClasses.push('fas', 'fa-play')
  } else if (isEndEvent.value) {
    baseClasses.push('fas', 'fa-stop')
  } else {
    baseClasses.push('fas', 'fa-circle')
  }
  
  return baseClasses
})

const iconStyles = computed(() => ({
  color: getEventIconColor(),
  fontSize: getIconSize()
}))

// 方法
function getEventSize(): number {
  if (isIntermediateEvent.value) {
    return 40 // 中间事件稍小
  }
  return 50 // 开始和结束事件
}

function getEventStyle() {
  const strokeWidth = isEndEvent.value ? 4 : (isIntermediateEvent.value ? 2 : 2)
  
  const baseStyle = {
    fill: isEndEvent.value ? '#333' : '#fff',
    stroke: getEventBorderColor(),
    strokeWidth,
    borderRadius: '50%', // 圆形
    fontSize: 10,
    fontFamily: 'Arial, sans-serif',
    color: isEndEvent.value ? '#fff' : '#333'
  }
  
  return baseStyle
}

function getEventBorderColor(): string {
  if (isStartEvent.value) return '#67c23a'
  if (isEndEvent.value) return '#f56c6c'
  return '#e6a23c' // 中间事件
}

function getEventIconColor(): string {
  if (isEndEvent.value) return '#fff'
  if (isStartEvent.value) return '#67c23a'
  return '#e6a23c'
}

function getIconSize(): string {
  if (isIntermediateEvent.value) return '12px'
  return '16px'
}

function getDefinitionIcon(definition: string): string {
  switch (definition) {
    case 'message':
      return 'fas fa-envelope'
    case 'timer':
      return 'fas fa-clock'
    case 'error':
      return 'fas fa-exclamation-triangle'
    case 'escalation':
      return 'fas fa-arrow-up'
    case 'cancel':
      return 'fas fa-times'
    case 'compensation':
      return 'fas fa-undo'
    case 'conditional':
      return 'fas fa-question'
    case 'link':
      return 'fas fa-link'
    case 'signal':
      return 'fas fa-flag'
    case 'terminate':
      return 'fas fa-stop-circle'
    case 'multiple':
      return 'fas fa-asterisk'
    case 'parallelmultiple':
      return 'fas fa-plus'
    default:
      return 'fas fa-circle'
  }
}
</script>

<style lang="scss" scoped>
// 事件特有样式：圆形
:deep(.base-node) {
  border-radius: 50% !important;
}

.event-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  gap: 2px;
}

.event-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-icon {
  font-size: 16px;
}

.event-title {
  font-size: 7px;
  font-weight: 500;
  max-width: 35px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.event-definitions {
  display: flex;
  gap: 1px;
  margin-top: 2px;
}

.event-definition {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 8px;
  height: 8px;
  
  i {
    font-size: 5px;
    opacity: 0.7;
  }
  
  &.definition-message i { color: #409eff; }
  &.definition-timer i { color: #e6a23c; }
  &.definition-error i { color: #f56c6c; }
  &.definition-escalation i { color: #f56c6c; }
  &.definition-cancel i { color: #909399; }
  &.definition-compensation i { color: #67c23a; }
  &.definition-conditional i { color: #606266; }
  &.definition-link i { color: #409eff; }
  &.definition-signal i { color: #e6a23c; }
  &.definition-terminate i { color: #f56c6c; }
}

.event-non-interrupting-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  
  .non-interrupting-border {
    width: 100%;
    height: 100%;
    border: 2px dashed #e6a23c;
    border-radius: 50%;
    box-sizing: border-box;
  }
}

.event-trigger-overlay {
  position: absolute;
  top: -6px;
  right: -6px;
  
  .trigger-indicator {
    background-color: #f56c6c;
    color: white;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 6px;
    animation: pulse 1.5s infinite;
  }
}

// 事件类型特定样式
.node-type-StartEvent {
  :deep(.base-node) {
    border-color: #67c23a !important;
    border-width: 2px !important;
  }
}

.node-type-EndEvent {
  :deep(.base-node) {
    background-color: #333 !important;
    border-color: #f56c6c !important;
    border-width: 4px !important;
    color: white !important;
  }
}

.node-type-IntermediateCatchEvent,
.node-type-IntermediateThrowEvent {
  :deep(.base-node) {
    border-color: #e6a23c !important;
    border-width: 2px !important;
    
    // 双圆圈效果
    &::after {
      content: '';
      position: absolute;
      top: 4px;
      left: 4px;
      right: 4px;
      bottom: 4px;
      border: 1px solid #e6a23c;
      border-radius: 50%;
    }
  }
}

// 连接点位置调整（圆形的四个点）
:deep(.connection-points) {
  .connection-point {
    &.top {
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    &.right {
      top: 50%;
      right: 0;
      transform: translate(50%, -50%);
    }
    
    &.bottom {
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 50%);
    }
    
    &.left {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>