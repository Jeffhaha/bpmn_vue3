<template>
  <BaseNode
    :element="element"
    :config="taskConfig"
    :selected="selected"
    :hovered="hovered"
    :status="status"
    :show-connection-points="showConnectionPoints"
    :interactive="interactive"
    @node-click="$emit('node-click', $event)"
    @node-hover="$emit('node-hover', $event)"
  >
    <template #content>
      <div class="task-content">
        <!-- 任务图标 -->
        <div class="task-icon-wrapper">
          <i :class="taskIconClasses" :style="iconStyles"></i>
        </div>
        
        <!-- 任务信息 -->
        <div class="task-info">
          <div class="task-title">{{ taskTitle }}</div>
          <div v-if="taskAssignee" class="task-assignee">
            <i class="fas fa-user"></i>
            {{ taskAssignee }}
          </div>
          <div v-if="taskDueDate" class="task-due-date">
            <i class="fas fa-clock"></i>
            {{ formattedDueDate }}
          </div>
        </div>
        
        <!-- 任务标识符 -->
        <div v-if="taskMarkers.length > 0" class="task-markers">
          <span
            v-for="marker in taskMarkers"
            :key="marker"
            :class="`marker-${marker}`"
            class="task-marker"
          >
            <i :class="getMarkerIcon(marker)"></i>
          </span>
        </div>
      </div>
    </template>
    
    <template #overlay>
      <!-- 进度条 -->
      <div v-if="taskProgress !== undefined" class="task-progress-overlay">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${taskProgress}%` }"
          ></div>
        </div>
      </div>
      
      <!-- 错误指示器 -->
      <div v-if="hasErrors" class="task-error-overlay">
        <i class="fas fa-exclamation-triangle"></i>
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
  // 任务特定属性
  assignee?: string
  dueDate?: string
  progress?: number
  markers?: string[]
  hasErrors?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  hovered: false,
  showConnectionPoints: false,
  interactive: true,
  markers: () => []
})

// Emits
defineEmits<{
  'node-click': [element: BpmnElement, event: MouseEvent]
  'node-hover': [element: BpmnElement, hovered: boolean]
}>()

// 计算属性
const taskType = computed(() => props.element.type)

const taskConfig = computed(() => ({
  width: getTaskWidth(),
  height: getTaskHeight(),
  style: getTaskStyle(),
  title: taskTitle.value
}))

const taskTitle = computed(() => {
  return props.element.businessObject?.name || getDefaultTaskName()
})

const taskAssignee = computed(() => {
  return props.assignee || props.element.businessObject?.assignee
})

const taskDueDate = computed(() => {
  return props.dueDate || props.element.businessObject?.dueDate
})

const taskProgress = computed(() => {
  return props.progress
})

const taskMarkers = computed(() => {
  const markers = [...props.markers]
  
  // 从业务对象中提取标记
  const businessObject = props.element.businessObject
  if (businessObject) {
    if (businessObject.isForCompensation) markers.push('compensation')
    if (businessObject.loopCharacteristics) {
      if (businessObject.loopCharacteristics.$type === 'bpmn:MultiInstanceLoopCharacteristics') {
        markers.push(businessObject.loopCharacteristics.isSequential ? 'sequential' : 'parallel')
      } else {
        markers.push('loop')
      }
    }
  }
  
  return markers
})

const taskIconClasses = computed(() => {
  const baseClasses = ['task-icon']
  
  switch (taskType.value) {
    case 'bpmn:UserTask':
      baseClasses.push('fas', 'fa-user')
      break
    case 'bpmn:ServiceTask':
      baseClasses.push('fas', 'fa-cogs')
      break
    case 'bpmn:ScriptTask':
      baseClasses.push('fas', 'fa-code')
      break
    case 'bpmn:BusinessRuleTask':
      baseClasses.push('fas', 'fa-table')
      break
    case 'bpmn:SendTask':
      baseClasses.push('fas', 'fa-paper-plane')
      break
    case 'bpmn:ReceiveTask':
      baseClasses.push('fas', 'fa-inbox')
      break
    case 'bpmn:ManualTask':
      baseClasses.push('fas', 'fa-hand-paper')
      break
    default:
      baseClasses.push('fas', 'fa-square')
  }
  
  return baseClasses
})

const iconStyles = computed(() => ({
  color: getTaskIconColor(),
  fontSize: '14px'
}))

const formattedDueDate = computed(() => {
  if (!taskDueDate.value) return ''
  
  try {
    const date = new Date(taskDueDate.value)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return taskDueDate.value
  }
})

// 方法
function getDefaultTaskName(): string {
  switch (taskType.value) {
    case 'bpmn:UserTask':
      return '用户任务'
    case 'bpmn:ServiceTask':
      return '服务任务'
    case 'bpmn:ScriptTask':
      return '脚本任务'
    case 'bpmn:BusinessRuleTask':
      return '业务规则任务'
    case 'bpmn:SendTask':
      return '发送任务'
    case 'bpmn:ReceiveTask':
      return '接收任务'
    case 'bpmn:ManualTask':
      return '手动任务'
    default:
      return '任务'
  }
}

function getTaskWidth(): number {
  // 根据内容动态调整宽度
  const baseWidth = 120
  const titleLength = taskTitle.value?.length || 0
  return Math.max(baseWidth, Math.min(200, baseWidth + titleLength * 4))
}

function getTaskHeight(): number {
  let height = 80
  
  // 如果有指派人或截止日期，增加高度
  if (taskAssignee.value || taskDueDate.value) {
    height += 20
  }
  
  return height
}

function getTaskStyle() {
  const baseStyle = {
    fill: '#fff',
    stroke: '#666',
    strokeWidth: 1,
    borderRadius: 8,
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    color: '#333'
  }
  
  // 根据任务类型调整样式
  switch (taskType.value) {
    case 'bpmn:UserTask':
      return {
        ...baseStyle,
        stroke: '#409eff',
        iconColor: '#409eff'
      }
    case 'bpmn:ServiceTask':
      return {
        ...baseStyle,
        stroke: '#67c23a',
        iconColor: '#67c23a'
      }
    case 'bpmn:ScriptTask':
      return {
        ...baseStyle,
        stroke: '#e6a23c',
        iconColor: '#e6a23c'
      }
    default:
      return baseStyle
  }
}

function getTaskIconColor(): string {
  switch (taskType.value) {
    case 'bpmn:UserTask':
      return '#409eff'
    case 'bpmn:ServiceTask':
      return '#67c23a'
    case 'bpmn:ScriptTask':
      return '#e6a23c'
    case 'bpmn:BusinessRuleTask':
      return '#f56c6c'
    case 'bpmn:SendTask':
      return '#909399'
    case 'bpmn:ReceiveTask':
      return '#909399'
    case 'bpmn:ManualTask':
      return '#606266'
    default:
      return '#666'
  }
}

function getMarkerIcon(marker: string): string {
  switch (marker) {
    case 'loop':
      return 'fas fa-redo'
    case 'parallel':
      return 'fas fa-equals'
    case 'sequential':
      return 'fas fa-list'
    case 'compensation':
      return 'fas fa-undo'
    default:
      return 'fas fa-tag'
  }
}
</script>

<style lang="scss" scoped>
.task-content {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  padding: 2px;
}

.task-icon-wrapper {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  margin-top: 2px;
}

.task-icon {
  font-size: 14px;
}

.task-info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.task-title {
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}

.task-assignee,
.task-due-date {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  
  i {
    width: 8px;
    font-size: 8px;
  }
}

.task-markers {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}

.task-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: #f0f0f0;
  
  i {
    font-size: 6px;
    color: #666;
  }
  
  &.marker-loop {
    background-color: #e6f3ff;
    i { color: #409eff; }
  }
  
  &.marker-parallel {
    background-color: #f0f9ff;
    i { color: #67c23a; }
  }
  
  &.marker-sequential {
    background-color: #fff7e6;
    i { color: #e6a23c; }
  }
  
  &.marker-compensation {
    background-color: #fef0f0;
    i { color: #f56c6c; }
  }
}

.task-progress-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  
  .progress-bar {
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 0 0 8px 8px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: #409eff;
    transition: width 0.3s ease;
  }
}

.task-error-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background-color: #f56c6c;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  i {
    font-size: 10px;
    color: white;
  }
}
</style>