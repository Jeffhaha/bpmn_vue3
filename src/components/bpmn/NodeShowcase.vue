<template>
  <div class="node-showcase">
    <div class="showcase-header">
      <h2>BPMN 节点展示</h2>
      <div class="theme-selector">
        <label>主题：</label>
        <select v-model="selectedTheme" @change="handleThemeChange">
          <option v-for="theme in themes" :key="theme.name" :value="theme.name">
            {{ theme.name }}
          </option>
        </select>
      </div>
    </div>
    
    <div class="showcase-content">
      <!-- 事件节点 -->
      <div class="node-section">
        <h3>事件节点</h3>
        <div class="node-grid">
          <div class="node-demo">
            <EventNode
              :element="startEventElement"
              :interactive="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">开始事件</span>
          </div>
          
          <div class="node-demo">
            <EventNode
              :element="endEventElement"
              :interactive="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">结束事件</span>
          </div>
          
          <div class="node-demo">
            <EventNode
              :element="intermediateEventElement"
              :interactive="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">中间事件</span>
          </div>
        </div>
      </div>
      
      <!-- 任务节点 -->
      <div class="node-section">
        <h3>任务节点</h3>
        <div class="node-grid">
          <div class="node-demo">
            <TaskNode
              :element="userTaskElement"
              :interactive="true"
              assignee="张三"
              due-date="2024-12-31"
              :progress="60"
              @node-click="handleNodeClick"
            />
            <span class="node-label">用户任务</span>
          </div>
          
          <div class="node-demo">
            <TaskNode
              :element="serviceTaskElement"
              :interactive="true"
              :progress="100"
              status="success"
              @node-click="handleNodeClick"
            />
            <span class="node-label">服务任务</span>
          </div>
          
          <div class="node-demo">
            <TaskNode
              :element="scriptTaskElement"
              :interactive="true"
              :has-errors="true"
              status="error"
              @node-click="handleNodeClick"
            />
            <span class="node-label">脚本任务</span>
          </div>
        </div>
      </div>
      
      <!-- 网关节点 -->
      <div class="node-section">
        <h3>网关节点</h3>
        <div class="node-grid">
          <div class="node-demo">
            <GatewayNode
              :element="exclusiveGatewayElement"
              :interactive="true"
              :condition-count="3"
              :has-default-flow="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">排他网关</span>
          </div>
          
          <div class="node-demo">
            <GatewayNode
              :element="parallelGatewayElement"
              :interactive="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">并行网关</span>
          </div>
          
          <div class="node-demo">
            <GatewayNode
              :element="inclusiveGatewayElement"
              :interactive="true"
              :condition-count="2"
              @node-click="handleNodeClick"
            />
            <span class="node-label">包容网关</span>
          </div>
        </div>
      </div>
      
      <!-- 交互状态演示 -->
      <div class="node-section">
        <h3>交互状态</h3>
        <div class="node-grid">
          <div class="node-demo">
            <TaskNode
              :element="selectedTaskElement"
              :selected="true"
              :show-connection-points="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">选中状态</span>
          </div>
          
          <div class="node-demo">
            <TaskNode
              :element="hoveredTaskElement"
              :hovered="true"
              @node-click="handleNodeClick"
            />
            <span class="node-label">悬停状态</span>
          </div>
          
          <div class="node-demo">
            <TaskNode
              :element="runningTaskElement"
              status="running"
              :progress="45"
              @node-click="handleNodeClick"
            />
            <span class="node-label">运行状态</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 点击信息 -->
    <div v-if="clickedElement" class="click-info">
      <h4>点击的元素信息：</h4>
      <pre>{{ JSON.stringify(clickedElement, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TaskNode from './nodes/TaskNode.vue'
import GatewayNode from './nodes/GatewayNode.vue'
import EventNode from './nodes/EventNode.vue'
import { nodeRegistry, setNodeTheme } from '@/utils/node-registry'
import type { BpmnElement } from '@/types'

// 状态
const selectedTheme = ref('default')
const clickedElement = ref<BpmnElement | null>(null)

// 计算属性
const themes = computed(() => nodeRegistry.getThemes())

// 模拟元素数据
const startEventElement: BpmnElement = {
  id: 'start-1',
  type: 'bpmn:StartEvent',
  businessObject: {
    id: 'start-1',
    name: '开始',
    $type: 'bpmn:StartEvent'
  }
}

const endEventElement: BpmnElement = {
  id: 'end-1',
  type: 'bpmn:EndEvent',
  businessObject: {
    id: 'end-1',
    name: '结束',
    $type: 'bpmn:EndEvent'
  }
}

const intermediateEventElement: BpmnElement = {
  id: 'intermediate-1',
  type: 'bpmn:IntermediateCatchEvent',
  businessObject: {
    id: 'intermediate-1',
    name: '等待',
    $type: 'bpmn:IntermediateCatchEvent'
  }
}

const userTaskElement: BpmnElement = {
  id: 'user-task-1',
  type: 'bpmn:UserTask',
  businessObject: {
    id: 'user-task-1',
    name: '审批任务',
    $type: 'bpmn:UserTask',
    assignee: '张三'
  }
}

const serviceTaskElement: BpmnElement = {
  id: 'service-task-1',
  type: 'bpmn:ServiceTask',
  businessObject: {
    id: 'service-task-1',
    name: '发送邮件',
    $type: 'bpmn:ServiceTask'
  }
}

const scriptTaskElement: BpmnElement = {
  id: 'script-task-1',
  type: 'bpmn:ScriptTask',
  businessObject: {
    id: 'script-task-1',
    name: '数据处理',
    $type: 'bpmn:ScriptTask'
  }
}

const exclusiveGatewayElement: BpmnElement = {
  id: 'exclusive-gateway-1',
  type: 'bpmn:ExclusiveGateway',
  businessObject: {
    id: 'exclusive-gateway-1',
    name: '条件判断',
    $type: 'bpmn:ExclusiveGateway'
  }
}

const parallelGatewayElement: BpmnElement = {
  id: 'parallel-gateway-1',
  type: 'bpmn:ParallelGateway',
  businessObject: {
    id: 'parallel-gateway-1',
    $type: 'bpmn:ParallelGateway'
  }
}

const inclusiveGatewayElement: BpmnElement = {
  id: 'inclusive-gateway-1',
  type: 'bpmn:InclusiveGateway',
  businessObject: {
    id: 'inclusive-gateway-1',
    name: '多重选择',
    $type: 'bpmn:InclusiveGateway'
  }
}

const selectedTaskElement: BpmnElement = {
  id: 'selected-task-1',
  type: 'bpmn:UserTask',
  businessObject: {
    id: 'selected-task-1',
    name: '选中的任务',
    $type: 'bpmn:UserTask'
  }
}

const hoveredTaskElement: BpmnElement = {
  id: 'hovered-task-1',
  type: 'bpmn:UserTask',
  businessObject: {
    id: 'hovered-task-1',
    name: '悬停的任务',
    $type: 'bpmn:UserTask'
  }
}

const runningTaskElement: BpmnElement = {
  id: 'running-task-1',
  type: 'bpmn:ServiceTask',
  businessObject: {
    id: 'running-task-1',
    name: '正在运行的任务',
    $type: 'bpmn:ServiceTask'
  }
}

// 方法
function handleThemeChange() {
  setNodeTheme(selectedTheme.value)
}

function handleNodeClick(element: BpmnElement, event: MouseEvent) {
  clickedElement.value = element
  console.log('节点点击:', element, event)
}

// 生命周期
onMounted(() => {
  // 初始化主题
  handleThemeChange()
})
</script>

<style lang="scss" scoped>
.node-showcase {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.showcase-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  
  h2 {
    margin: 0;
    color: #333;
  }
  
  .theme-selector {
    display: flex;
    align-items: center;
    gap: 8px;
    
    label {
      font-weight: 500;
    }
    
    select {
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }
  }
}

.showcase-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.node-section {
  h3 {
    margin: 0 0 15px 0;
    color: #555;
    font-size: 18px;
    border-bottom: 2px solid #eee;
    padding-bottom: 5px;
  }
}

.node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: start;
}

.node-demo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.2s ease;
  
  &:hover {
    background: #f5f5f5;
    border-color: #ddd;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.node-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  text-align: center;
}

.click-info {
  margin-top: 30px;
  padding: 20px;
  background: #f0f0f0;
  border-radius: 8px;
  border: 1px solid #ddd;
  
  h4 {
    margin: 0 0 10px 0;
    color: #333;
  }
  
  pre {
    margin: 0;
    background: white;
    padding: 15px;
    border-radius: 4px;
    border: 1px solid #ddd;
    font-size: 12px;
    overflow-x: auto;
  }
}
</style>