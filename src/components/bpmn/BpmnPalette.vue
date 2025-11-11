<template>
  <div class="bpmn-palette" :class="{ collapsed: isCollapsed }">
    <!-- 调色板头部 -->
    <div class="palette-header">
      <h4 v-if="!isCollapsed">元素库</h4>
      <button class="collapse-btn" @click="toggleCollapse" :title="isCollapsed ? '展开' : '收起'">
        <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
      </button>
    </div>
    
    <!-- 调色板内容 -->
    <div v-if="!isCollapsed" class="palette-content">
      <!-- 事件类别 -->
      <div class="palette-group">
        <div class="group-header" @click="toggleGroup('events')">
          <i class="fas fa-bolt"></i>
          <span>事件</span>
          <i :class="expandedGroups.events ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
        </div>
        
        <div v-if="expandedGroups.events" class="group-items">
          <div 
            v-for="event in eventElements" 
            :key="event.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, event)"
            @click="addElement(event)"
            :title="event.description"
          >
            <i :class="event.icon" :style="{ color: event.color }"></i>
            <span class="item-label">{{ event.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 任务类别 -->
      <div class="palette-group">
        <div class="group-header" @click="toggleGroup('tasks')">
          <i class="fas fa-tasks"></i>
          <span>任务</span>
          <i :class="expandedGroups.tasks ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
        </div>
        
        <div v-if="expandedGroups.tasks" class="group-items">
          <div 
            v-for="task in taskElements" 
            :key="task.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, task)"
            @click="addElement(task)"
            :title="task.description"
          >
            <i :class="task.icon" :style="{ color: task.color }"></i>
            <span class="item-label">{{ task.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 网关类别 -->
      <div class="palette-group">
        <div class="group-header" @click="toggleGroup('gateways')">
          <i class="fas fa-code-branch"></i>
          <span>网关</span>
          <i :class="expandedGroups.gateways ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
        </div>
        
        <div v-if="expandedGroups.gateways" class="group-items">
          <div 
            v-for="gateway in gatewayElements" 
            :key="gateway.id"
            class="palette-item"
            :draggable="true"
            @dragstart="handleDragStart($event, gateway)"
            @click="addElement(gateway)"
            :title="gateway.description"
          >
            <i :class="gateway.icon" :style="{ color: gateway.color }"></i>
            <span class="item-label">{{ gateway.name }}</span>
          </div>
        </div>
      </div>
      
      <!-- 连接工具 -->
      <div class="palette-group">
        <div class="group-header" @click="toggleGroup('connections')">
          <i class="fas fa-arrow-right"></i>
          <span>连接</span>
          <i :class="expandedGroups.connections ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="toggle-icon"></i>
        </div>
        
        <div v-if="expandedGroups.connections" class="group-items">
          <div 
            v-for="connection in connectionElements" 
            :key="connection.id"
            class="palette-item"
            :class="{ active: activeConnectionTool === connection.id }"
            @click="activateConnectionTool(connection)"
            :title="connection.description"
          >
            <i :class="connection.icon" :style="{ color: connection.color }"></i>
            <span class="item-label">{{ connection.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getNodeConfig, nodeConfigManager } from '@/utils/node-config'
import type { BpmnElement } from '@/types'

// Props
interface Props {
  modeler?: any
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'element-add': [elementType: string, position?: { x: number; y: number }]
  'tool-activate': [toolType: string]
}>()

// 状态
const isCollapsed = ref(false)
const activeConnectionTool = ref<string | null>(null)
const expandedGroups = ref({
  events: true,
  tasks: true,
  gateways: true,
  connections: true
})

// 获取所有节点配置
const allConfigs = computed(() => nodeConfigManager.getAllNodeConfigs())

// 按类别分组元素
const eventElements = computed(() => 
  allConfigs.value.filter(config => config.category === 'event')
)

const taskElements = computed(() => 
  allConfigs.value.filter(config => config.category === 'task')
)

const gatewayElements = computed(() => 
  allConfigs.value.filter(config => config.category === 'gateway')
)

const connectionElements = computed(() => [
  {
    id: 'sequence-flow',
    name: '顺序流',
    type: 'bpmn:SequenceFlow',
    icon: 'fas fa-arrow-right',
    color: '#666',
    description: '连接流程元素的顺序流'
  },
  {
    id: 'message-flow',
    name: '消息流',
    type: 'bpmn:MessageFlow',
    icon: 'fas fa-envelope',
    color: '#409eff',
    description: '参与者之间的消息流'
  },
  {
    id: 'association',
    name: '关联',
    type: 'bpmn:Association',
    icon: 'fas fa-link',
    color: '#909399',
    description: '关联连接'
  }
])

// 方法
function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleGroup(groupName: keyof typeof expandedGroups.value) {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName]
}

function handleDragStart(event: DragEvent, element: any) {
  if (!event.dataTransfer) return
  
  // 设置拖拽数据
  event.dataTransfer.setData('application/json', JSON.stringify({
    type: element.type,
    elementType: 'bpmn-element'
  }))
  
  event.dataTransfer.effectAllowed = 'copy'
  
  console.log('开始拖拽元素:', element)
}

function addElement(element: any, position?: { x: number; y: number }) {
  console.log('添加元素:', element)
  
  if (!props.modeler) {
    console.warn('建模器未初始化')
    return
  }
  
  try {
    const modeling = props.modeler.get('modeling')
    const elementFactory = props.modeler.get('elementFactory')
    const canvas = props.modeler.get('canvas')
    
    // 获取默认位置（画布中心）
    if (!position) {
      const viewbox = canvas.viewbox()
      position = {
        x: viewbox.x + viewbox.width / 2,
        y: viewbox.y + viewbox.height / 2
      }
    }
    
    // 创建元素
    const newElement = elementFactory.createShape({
      type: element.type,
      businessObject: props.modeler.get('bpmnFactory').create(element.type, {
        name: element.name || element.defaultProperties?.name
      })
    })
    
    // 获取根元素
    const rootElement = canvas.getRootElement()
    
    // 添加到画布
    modeling.createShape(newElement, position, rootElement)
    
    emit('element-add', element.type, position)
    
  } catch (error) {
    console.error('添加元素失败:', error)
  }
}

function activateConnectionTool(connection: any) {
  if (activeConnectionTool.value === connection.id) {
    // 取消激活
    activeConnectionTool.value = null
  } else {
    // 激活连接工具
    activeConnectionTool.value = connection.id
    
    if (props.modeler) {
      try {
        const globalConnect = props.modeler.get('globalConnect')
        globalConnect.toggle()
      } catch (error) {
        console.warn('连接工具激活失败:', error)
      }
    }
  }
  
  emit('tool-activate', connection.id)
}

// 监听画布点击，添加元素到点击位置
function setupCanvasListener() {
  if (!props.modeler) return
  
  const eventBus = props.modeler.get('eventBus')
  
  eventBus.on('canvas.click', (event: any) => {
    // 这里可以添加点击画布添加元素的逻辑
  })
}
</script>

<style lang="scss" scoped>
.bpmn-palette {
  width: 250px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow: hidden;
  
  &.collapsed {
    width: 40px;
  }
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  min-height: 50px;
  
  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #303133;
  }
  
  .collapse-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #606266;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #e6f3ff;
      color: #409eff;
    }
    
    i {
      font-size: 12px;
    }
  }
}

.palette-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.palette-group {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.group-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fafafa;
  cursor: pointer;
  user-select: none;
  
  i {
    margin-right: 8px;
    color: #409eff;
    font-size: 14px;
    width: 16px;
    text-align: center;
  }
  
  span {
    flex: 1;
    font-weight: 500;
    font-size: 13px;
    color: #303133;
  }
  
  .toggle-icon {
    margin-left: 8px;
    margin-right: 0;
    color: #909399;
    font-size: 12px;
  }
  
  &:hover {
    background: #f5f5f5;
  }
}

.group-items {
  padding: 8px 0;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  
  i {
    margin-right: 12px;
    font-size: 16px;
    width: 20px;
    text-align: center;
  }
  
  .item-label {
    font-size: 13px;
    color: #606266;
  }
  
  &:hover {
    background: #f0f9ff;
    
    .item-label {
      color: #409eff;
    }
  }
  
  &:active {
    background: #e6f3ff;
  }
  
  &.active {
    background: #409eff;
    
    i,
    .item-label {
      color: white !important;
    }
  }
  
  &[draggable="true"] {
    cursor: grab;
    
    &:active {
      cursor: grabbing;
    }
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>