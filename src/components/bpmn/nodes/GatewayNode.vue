<template>
  <BaseNode
    :element="element"
    :config="gatewayConfig"
    :selected="selected"
    :hovered="hovered"
    :status="status"
    :show-connection-points="showConnectionPoints"
    :interactive="interactive"
    @node-click="$emit('node-click', $event)"
    @node-hover="$emit('node-hover', $event)"
  >
    <template #content>
      <div class="gateway-content">
        <!-- 网关图标 -->
        <div class="gateway-icon-wrapper">
          <i :class="gatewayIconClasses" :style="iconStyles"></i>
        </div>
        
        <!-- 网关标题（仅在有名称时显示） -->
        <div v-if="gatewayTitle" class="gateway-title">
          {{ gatewayTitle }}
        </div>
      </div>
    </template>
    
    <template #overlay>
      <!-- 条件指示器 -->
      <div v-if="hasConditions" class="gateway-conditions-overlay">
        <div class="conditions-indicator">
          <span class="condition-count">{{ conditionCount }}</span>
        </div>
      </div>
      
      <!-- 默认路径指示器 -->
      <div v-if="hasDefaultFlow" class="gateway-default-overlay">
        <i class="fas fa-arrow-right default-arrow"></i>
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
  // 网关特定属性
  conditionCount?: number
  hasDefaultFlow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  hovered: false,
  showConnectionPoints: false,
  interactive: true,
  conditionCount: 0
})

// Emits
defineEmits<{
  'node-click': [element: BpmnElement, event: MouseEvent]
  'node-hover': [element: BpmnElement, hovered: boolean]
}>()

// 计算属性
const gatewayType = computed(() => props.element.type)

const gatewayConfig = computed(() => ({
  width: getGatewaySize(),
  height: getGatewaySize(),
  style: getGatewayStyle()
}))

const gatewayTitle = computed(() => {
  return props.element.businessObject?.name
})

const hasConditions = computed(() => {
  return props.conditionCount > 0
})

const gatewayIconClasses = computed(() => {
  const baseClasses = ['gateway-icon']
  
  switch (gatewayType.value) {
    case 'bpmn:ExclusiveGateway':
      baseClasses.push('fas', 'fa-times')
      break
    case 'bpmn:InclusiveGateway':
      baseClasses.push('fas', 'fa-circle')
      break
    case 'bpmn:ParallelGateway':
      baseClasses.push('fas', 'fa-plus')
      break
    case 'bpmn:EventBasedGateway':
      baseClasses.push('fas', 'fa-star')
      break
    case 'bpmn:ComplexGateway':
      baseClasses.push('fas', 'fa-asterisk')
      break
    default:
      baseClasses.push('fas', 'fa-diamond')
  }
  
  return baseClasses
})

const iconStyles = computed(() => ({
  color: getGatewayIconColor(),
  fontSize: getIconSize()
}))

// 方法
function getGatewaySize(): number {
  // 网关通常是正方形，旋转45度显示为菱形
  return 60
}

function getGatewayStyle() {
  const baseStyle = {
    fill: '#fff',
    stroke: '#666',
    strokeWidth: 2,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: 'Arial, sans-serif',
    color: '#333'
  }
  
  // 根据网关类型调整样式
  switch (gatewayType.value) {
    case 'bpmn:ExclusiveGateway':
      return {
        ...baseStyle,
        stroke: '#f56c6c',
        iconColor: '#f56c6c'
      }
    case 'bpmn:InclusiveGateway':
      return {
        ...baseStyle,
        stroke: '#e6a23c',
        iconColor: '#e6a23c'
      }
    case 'bpmn:ParallelGateway':
      return {
        ...baseStyle,
        stroke: '#67c23a',
        iconColor: '#67c23a'
      }
    case 'bpmn:EventBasedGateway':
      return {
        ...baseStyle,
        stroke: '#409eff',
        iconColor: '#409eff'
      }
    case 'bpmn:ComplexGateway':
      return {
        ...baseStyle,
        stroke: '#909399',
        iconColor: '#909399'
      }
    default:
      return baseStyle
  }
}

function getGatewayIconColor(): string {
  switch (gatewayType.value) {
    case 'bpmn:ExclusiveGateway':
      return '#f56c6c'
    case 'bpmn:InclusiveGateway':
      return '#e6a23c'
    case 'bpmn:ParallelGateway':
      return '#67c23a'
    case 'bpmn:EventBasedGateway':
      return '#409eff'
    case 'bpmn:ComplexGateway':
      return '#909399'
    default:
      return '#666'
  }
}

function getIconSize(): string {
  return '18px'
}
</script>

<style lang="scss" scoped>
// 网关特有样式：菱形旋转效果
:deep(.base-node) {
  transform: rotate(45deg);
  border-radius: 8px !important;
  
  &.node-hovered {
    transform: rotate(45deg) translateY(-1px);
  }
}

.gateway-content {
  transform: rotate(-45deg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  gap: 4px;
}

.gateway-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}

.gateway-icon {
  font-size: 18px;
  font-weight: bold;
}

.gateway-title {
  font-size: 8px;
  font-weight: 500;
  max-width: 40px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1;
}

.gateway-conditions-overlay {
  position: absolute;
  top: -8px;
  right: -8px;
  transform: rotate(-45deg);
  
  .conditions-indicator {
    background-color: #409eff;
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: bold;
  }
  
  .condition-count {
    line-height: 1;
  }
}

.gateway-default-overlay {
  position: absolute;
  bottom: -8px;
  right: -8px;
  transform: rotate(-45deg);
  
  .default-arrow {
    background-color: #67c23a;
    color: white;
    border-radius: 50%;
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 7px;
  }
}

// 网关类型特定样式
.gateway-content {
  // 排他网关
  .node-type-ExclusiveGateway & {
    .gateway-icon {
      font-weight: 900;
    }
  }
  
  // 包容网关
  .node-type-InclusiveGateway & {
    .gateway-icon {
      border: 2px solid currentColor;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0;
      
      &::before {
        content: '';
        width: 8px;
        height: 8px;
        background: currentColor;
        border-radius: 50%;
      }
    }
  }
  
  // 并行网关
  .node-type-ParallelGateway & {
    .gateway-icon {
      font-weight: 900;
    }
  }
  
  // 事件网关
  .node-type-EventBasedGateway & {
    .gateway-icon {
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        border: 2px solid currentColor;
        border-radius: 50%;
      }
    }
  }
}

// 连接点位置调整（菱形的四个角）
:deep(.connection-points) {
  .connection-point {
    &.top {
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
    }
    
    &.right {
      top: 50%;
      right: 0;
      transform: translate(50%, -50%) rotate(-45deg);
    }
    
    &.bottom {
      bottom: 0;
      left: 50%;
      transform: translate(-50%, 50%) rotate(-45deg);
    }
    
    &.left {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%) rotate(-45deg);
    }
  }
}
</style>