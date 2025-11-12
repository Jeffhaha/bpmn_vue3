<template>
  <div class="simple-bpmn-modeler">
    <!-- 简化的工具栏 -->
    <div class="simple-toolbar">
      <button @click="createNew" class="btn">新建</button>
      <button @click="handleImport" class="btn">打开</button>
      <button @click="exportXml" class="btn">导出</button>
      <button @click="saveToLocal" class="btn">保存</button>
      <button @click="zoomFit" class="btn">适应窗口</button>
      <button @click="debugPalette" class="btn debug">调试调色板</button>
      <button @click="toggleTemplates" class="btn" :class="{ active: showTemplates }">
        {{ showTemplates ? '隐藏' : '显示' }}模板
      </button>
      <button @click="toggleNodeLibrary" class="btn" :class="{ active: showNodeLibrary }">
        {{ showNodeLibrary ? '隐藏' : '显示' }}节点库
      </button>
      <button @click="togglePalette" class="btn" :class="{ active: showPalette }">
        {{ showPalette ? '隐藏' : '显示' }}调色板
      </button>
      <button @click="toggleProperties" class="btn" :class="{ active: showProperties }">
        {{ showProperties ? '隐藏' : '显示' }}属性
      </button>
    </div>
    
    <!-- 主内容区域 -->
    <div class="modeler-content">
      <!-- 模板面板 -->
      <TemplatePanel
        v-if="showTemplates"
        @template-drag-start="handleTemplateDragStart"
        @template-selected="handleTemplateSelected"
        @template-applied="handleTemplateApplied"
      />
      
      <!-- 节点库面板 -->
      <BpmnPalette
        v-if="showNodeLibrary"
        :modeler="bpmnService.getModeler()"
        @element-add="handleElementAdd"
        @tool-activate="handleToolActivate"
      />
      
      <!-- 注意：原生BPMN.js调色板通过开关控制显示/隐藏 -->
      
      <!-- BPMN画布 -->
      <div 
        ref="bpmnContainer" 
        class="simple-bpmn-canvas"
        @dragover="handleDragOver"
        @drop="handleDrop"
      ></div>
      
      <!-- 属性面板 -->
      <PropertiesPanel 
        v-if="showProperties"
        :selected-element="selectedElement"
        :modeler="bpmnService.getModeler()"
        @property-changed="handlePropertyChanged"
        @element-updated="handleElementUpdated"
      />
    </div>
    
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".bpmn,.xml"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import PropertiesPanel from '@/components/properties/PropertiesPanel.vue'
import TemplatePanel from '@/components/templates/TemplatePanel.vue'
import BpmnPalette from '@/components/bpmn/BpmnPalette.vue'
import { bpmnService } from '@/utils/bpmn-service'
import { DragHandler } from '@/utils/drag-handler'
import TemplateDropHandler from '@/utils/template-drop-handler'
import { detectNodeType, validateNode, getDefaultNodeProperties } from '@/utils/node-config'
import type { BpmnElement, NodeTemplate, UnifiedDragData } from '@/types'

// 导入BPMN.js样式
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

const bpmnContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const showProperties = ref(true)
const showTemplates = ref(true)
const showNodeLibrary = ref(false)
const showPalette = ref(false)
const selectedElement = ref<BpmnElement | null>(null)
const currentFileName = ref<string>('')
const hasUnsavedChanges = ref(false)

let dragHandler: DragHandler | null = null
let templateDropHandler: TemplateDropHandler | null = null

const defaultXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

async function initializeBpmn() {
  if (!bpmnContainer.value) return
  
  try {
    // 使用BpmnService初始化建模器，默认不禁用调色板
    await bpmnService.initialize(bpmnContainer.value, {
      width: bpmnContainer.value.clientWidth,
      height: bpmnContainer.value.clientHeight,
      disablePalette: false // 默认启用调色板
    })
    
    console.log('BPMN建模器初始化成功')
    
    // 获取建模器实例
    const modeler = bpmnService.getModeler()
    if (!modeler) {
      throw new Error('建模器初始化失败')
    }
    
    // 确保调色板显示
    setTimeout(() => {
      const palette = modeler.get('palette')
      if (palette && palette.open) {
        palette.open()
      }
      
      // 强制设置调色板样式
      const paletteEl = document.querySelector('.djs-palette')
      if (paletteEl) {
        paletteEl.style.display = 'block'
        paletteEl.style.visibility = 'visible'
      }
    }, 100)
    
    // 初始化拖拽处理器
    if (bpmnContainer.value) {
      dragHandler = new DragHandler(bpmnContainer.value, modeler, {
        enableDrag: true,
        enableConnect: true,
        snapToGrid: true,
        gridSize: 10
      })
      
      // 初始化模板拖拽处理器
      templateDropHandler = new TemplateDropHandler(modeler)
      
      // 监听拖拽事件
      dragHandler.on('dragEnd', (event) => {
        console.log('元素拖拽结束:', event)
      })
      
      dragHandler.on('connectEnd', (event) => {
        console.log('连接创建:', event)
      })
    }
    
    // 使用BpmnService的事件系统
    bpmnService.on('selection.changed', (event: any) => {
      selectedElement.value = event.element || null
      
      // 输出选中元素信息
      console.log('=== 选择事件触发 ===')
      console.log('事件:', event)
      if (event.element) {
        const nodeConfig = detectNodeType(event.element)
        console.log('选中元素:', event.element)
        console.log('元素ID:', event.element.id)
        console.log('元素类型:', event.element.type) 
        console.log('业务对象:', event.element.businessObject)
        console.log('节点配置:', nodeConfig)
        console.log('当前selectedElement.value:', selectedElement.value)
        console.log('属性面板是否显示:', showProperties.value)
      } else {
        console.log('未选中任何元素')
      }
      console.log('======================')
    })
    
    // 监听模型变更事件
    bpmnService.on('elements.changed', () => {
      hasUnsavedChanges.value = true
      console.log('流程已修改，需要保存')
    })
    
  } catch (error) {
    console.error('BPMN建模器初始化失败:', error)
  }
}

async function createNew() {
  // 检查是否有未保存的更改
  if (hasUnsavedChanges.value) {
    const confirmed = confirm('当前流程未保存，是否继续新建？')
    if (!confirmed) return
  }
  
  try {
    await bpmnService.createNewProcess()
    currentFileName.value = ''
    hasUnsavedChanges.value = false
    console.log('新建流程成功')
  } catch (error) {
    console.error('新建流程失败:', error)
    alert('新建流程失败: ' + error)
  }
}

function handleImport() {
  fileInput.value?.click()
}

async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const xml = await readFileAsText(file)
    await bpmnService.importXML(xml)
    
    currentFileName.value = file.name
    hasUnsavedChanges.value = false
    
    console.log('导入文件成功:', file.name)
    alert('文件导入成功')
  } catch (error) {
    console.error('导入文件失败:', error)
    alert('导入文件失败: ' + error)
  }
  
  // 清空文件输入
  target.value = ''
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

async function exportXml() {
  try {
    const xml = await bpmnService.exportXML({ format: true })
    const fileName = currentFileName.value || 'process.bpmn'
    downloadFile(xml, fileName, 'application/xml')
    console.log('导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    alert('导出失败: ' + error)
  }
}

async function saveToLocal() {
  try {
    const xml = await bpmnService.exportXML({ format: true })
    
    // 如果没有文件名，提示输入
    let fileName = currentFileName.value
    if (!fileName) {
      fileName = prompt('请输入文件名:', 'process.bpmn')
      if (!fileName) return
      
      // 确保有正确的扩展名
      if (!fileName.endsWith('.bpmn') && !fileName.endsWith('.xml')) {
        fileName += '.bpmn'
      }
    }
    
    // 保存到本地存储
    const storageKey = `bpmn-process-${fileName}`
    localStorage.setItem(storageKey, xml)
    
    // 更新状态
    currentFileName.value = fileName
    hasUnsavedChanges.value = false
    
    console.log('保存到本地存储成功:', fileName)
    alert('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败: ' + error)
  }
}

function zoomFit() {
  try {
    bpmnService.zoomToFit()
  } catch (error) {
    console.error('缩放失败:', error)
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function toggleProperties() {
  showProperties.value = !showProperties.value
}

function toggleTemplates() {
  showTemplates.value = !showTemplates.value
}

function toggleNodeLibrary() {
  showNodeLibrary.value = !showNodeLibrary.value
}

function togglePalette() {
  showPalette.value = !showPalette.value
  bpmnService.togglePalette(showPalette.value)
}


function handlePropertyChanged(property: string, value: any, element: BpmnElement) {
  console.log('属性变更:', property, value, element)
  
  // 验证属性
  const properties = { [property]: value }
  const validation = validateNode(element, properties)
  
  if (!validation.isValid) {
    console.warn('属性验证失败:', validation.errors)
    // 可以在这里显示错误提示
  }
}

function handleElementUpdated(element: BpmnElement) {
  console.log('元素已更新:', element)
  // 可以在这里触发重新渲染或其他后续操作
}

function handleElementAdd(elementType: string, position?: { x: number; y: number }) {
  console.log('从调色板添加元素:', elementType, position)
  // 调色板内部已处理添加逻辑
}

function handleToolActivate(toolType: string) {
  console.log('激活工具:', toolType)
  // 处理工具激活
}

// === 模板相关方法 ===

function handleTemplateDragStart(template: NodeTemplate, event: DragEvent) {
  console.log('模板拖拽开始:', template.name, event)
  // 拖拽数据已在TemplatePanel中设置
}

function handleTemplateSelected(template: NodeTemplate) {
  console.log('选中模板:', template.name)
}

function handleTemplateApplied(template: NodeTemplate) {
  console.log('应用模板:', template.name)
  
  if (selectedElement.value && templateDropHandler) {
    try {
      templateDropHandler.applyTemplate(selectedElement.value, template)
      console.log('模板应用成功')
    } catch (error) {
      console.error('应用模板失败:', error)
      alert('应用模板失败: ' + error)
    }
  } else {
    alert('请先选择一个元素')
  }
}

function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  
  try {
    const data = event.dataTransfer?.getData('application/json')
    if (!data) {
      console.warn('拖拽数据为空')
      return
    }
    
    const dragData: UnifiedDragData = JSON.parse(data)
    console.log('接收到拖拽数据:', dragData)
    
    // 计算画布相对位置
    const canvasRect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = {
      x: event.clientX - canvasRect.left,
      y: event.clientY - canvasRect.top
    }
    
    // 转换为BPMN画布坐标
    const canvas = bpmnService.getModeler()?.get('canvas')
    if (!canvas) {
      console.error('画布未初始化')
      return
    }
    
    const viewbox = canvas.viewbox()
    const realPosition = {
      x: position.x / viewbox.scale + viewbox.x,
      y: position.y / viewbox.scale + viewbox.y
    }
    
    let createdElement: any = null
    
    // 根据拖拽类型处理
    switch (dragData.type) {
      case 'template':
        // 模板拖拽 - 使用现有的模板处理器
        if (dragData.template && templateDropHandler) {
          createdElement = templateDropHandler.onTemplateDrop(dragData.template, realPosition)
          console.log('模板拖拽创建成功:', createdElement)
        } else {
          console.error('模板数据或处理器缺失')
        }
        break
        
      case 'bpmn-element':
        // BPMN元素拖拽 - 直接创建标准BPMN元素
        createdElement = createBpmnElement(dragData.nodeInfo, dragData.elementConfig, realPosition)
        console.log('BPMN元素拖拽创建成功:', createdElement)
        break
        
      case 'custom':
        // 自定义元素拖拽 - 预留扩展点
        console.log('自定义元素拖拽暂不支持')
        break
        
      default:
        console.warn('不支持的拖拽类型:', dragData.type)
        return
    }
    
    if (createdElement) {
      hasUnsavedChanges.value = true
    }
    
  } catch (error) {
    console.error('拖拽处理失败:', error)
    alert('拖拽添加元素失败: ' + error)
  }
}

// === BPMN元素创建方法 ===

/**
 * 创建标准BPMN元素 - 支持DynamicForm的扩展属性
 */
function createBpmnElement(
  nodeInfo: any, 
  elementConfig: any, 
  position: { x: number; y: number }
): any {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    throw new Error('建模器未初始化')
  }
  
  try {
    const modeling = modeler.get('modeling')
    const elementFactory = modeler.get('elementFactory')
    const bpmnFactory = modeler.get('bpmnFactory')
    const canvas = modeler.get('canvas')
    
    // 创建业务对象，支持DynamicForm自定义属性
    const businessObject = bpmnFactory.create(nodeInfo.elementType, {
      name: nodeInfo.name,
      ...elementConfig?.defaultValues
    })
    
    // 应用基础属性
    if (elementConfig?.properties) {
      Object.assign(businessObject, elementConfig.properties)
    }
    
    // 预留DynamicForm扩展属性空间
    if (!businessObject.extensionElements) {
      businessObject.extensionElements = bpmnFactory.create('bpmn:ExtensionElements')
    }
    
    // 创建图形元素
    const newElement = elementFactory.createShape({
      type: nodeInfo.elementType,
      businessObject: businessObject
    })
    
    // 获取根元素
    const rootElement = canvas.getRootElement()
    
    // 添加到画布
    const createdElement = modeling.createShape(newElement, position, rootElement)
    
    console.log('BPMN元素创建成功 (支持DynamicForm):', {
      elementType: nodeInfo.elementType,
      name: nodeInfo.name,
      position,
      hasExtensionElements: !!businessObject.extensionElements,
      createdElement
    })
    
    return createdElement
    
  } catch (error) {
    console.error('创建BPMN元素失败:', error)
    throw error
  }
}

// === 调试方法 ===

function debugPalette() {
  console.log('调试调色板状态...')
  
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    alert('建模器未初始化')
    return
  }
  
  try {
    const palette = modeler.get('palette')
    const paletteProvider = modeler.get('paletteProvider')
    
    console.log('调色板服务:', palette)
    console.log('调色板提供者:', paletteProvider)
    
    if (paletteProvider && paletteProvider.getPaletteEntries) {
      const entries = paletteProvider.getPaletteEntries()
      console.log('调色板条目:', entries)
      console.log('条目数量:', Object.keys(entries).length)
    }
    
    const paletteEl = document.querySelector('.djs-palette')
    console.log('调色板DOM元素:', paletteEl)
    
    if (paletteEl) {
      console.log('调色板样式:', window.getComputedStyle(paletteEl))
      alert(`调色板状态:\n- 存在: 是\n- 显示: ${paletteEl.style.display || '默认'}\n- 可见性: ${paletteEl.style.visibility || '默认'}\n- 位置: ${paletteEl.style.position || '默认'}\n- 内容: ${paletteEl.innerHTML.length > 0 ? '有' : '无'}`)
    } else {
      alert('调色板DOM元素不存在')
    }
    
  } catch (error) {
    console.error('调试失败:', error)
    alert('调试失败: ' + error)
  }
}

onMounted(() => {
  initializeBpmn()
})

onUnmounted(() => {
  if (dragHandler) {
    dragHandler.destroy()
  }
  if (templateDropHandler) {
    templateDropHandler = null
  }
  bpmnService.destroy()
})
</script>

<style scoped>
.simple-bpmn-modeler {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
}

.modeler-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.simple-toolbar {
  height: 50px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 8px 16px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background: #337ecc;
}

.btn.debug {
  background: #f56c6c;
}

.btn.debug:hover {
  background: #f78989;
}

.btn.active {
  background: #337ecc;
}

.simple-bpmn-canvas {
  flex: 1;
  position: relative;
  background: #fafafa;
}

/* 确保BPMN.js样式正常 */
.simple-bpmn-canvas :deep(.djs-container) {
  width: 100% !important;
  height: 100% !important;
}

.simple-bpmn-canvas :deep(.djs-palette) {
  position: absolute;
  left: 20px;
  top: 20px;
  z-index: 100;
}

.simple-bpmn-canvas :deep(.djs-palette .entry) {
  width: 48px;
  height: 48px;
}

/* 强制BPMN.js调色板显示 */
.simple-bpmn-canvas :deep(.djs-palette) {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background: white !important;
  border: 1px solid #ccc !important;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
  border-radius: 4px !important;
}
</style>