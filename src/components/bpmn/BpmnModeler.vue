<template>
  <div class="bpmn-modeler">
    <!-- 简化的工具栏用于调试 -->
    <div class="bpmn-toolbar">
      <div class="toolbar-content">
        <button class="btn" @click="handleNew">新建</button>
        <button class="btn" @click="handleImport">打开</button>
        <button class="btn" @click="handleExport" :disabled="!hasProcess">导出</button>
        <button class="btn" @click="handleZoomReset">重置缩放</button>
        <button class="btn" @click="handleZoomFit">适应窗口</button>
        <button class="btn" @click="handleUndo" :disabled="!canUndo">撤销</button>
        <button class="btn" @click="handleRedo" :disabled="!canRedo">重做</button>
        <button class="btn debug" @click="debugPalette">检查调色板</button>
        <button class="btn debug" @click="fixPalette">强制显示调色板</button>
        <button class="btn debug" @click="showPaletteContent">显示调色板内容</button>
        <button class="btn debug" @click="reopenPalette">重新打开调色板</button>
        <button class="btn debug" @click="forceRenderPalette">强制重新渲染</button>
        <button class="btn debug" @click="forceFullscreen">强制全屏</button>
        <button class="btn debug" @click="reinitializeBpmn">重新初始化</button>
      </div>
    </div>
    
    <div class="bpmn-container">
      <!-- 调试信息 -->
      <div v-if="!modelerReady" class="debug-info">
        <p>建模器状态: {{ loading ? '加载中...' : '等待初始化' }}</p>
        <p>容器元素: {{ modelerContainer ? '已就绪' : '未就绪' }}</p>
      </div>
      
      <div
        ref="modelerContainer"
        class="bpmn-canvas"
        @contextmenu.prevent
      ></div>
      
      <div v-if="loading" class="bpmn-loading">
        <div class="loading-text">加载建模器...</div>
      </div>
    </div>
    
    <!-- 导入文件对话框 -->
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
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useBpmnStore } from '@/stores/bpmn'
import { bpmnService } from '@/utils/bpmn-service'
import type { BpmnEvent } from '@/types'

// 响应式数据
const modelerContainer = ref<HTMLElement>()
const fileInput = ref<HTMLInputElement>()
const loading = ref(true)
const modelerReady = ref(false)
const canUndo = ref(false)
const canRedo = ref(false)

// Store
const bpmnStore = useBpmnStore()

// 计算属性
const hasProcess = computed(() => !!bpmnStore.processXml)

// Props
interface Props {
  height?: number | string
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  height: '100%',
  readonly: false
})

// Emits
const emit = defineEmits<{
  'modeler-ready': [modeler: any]
  'selection-changed': [element: any]
  'elements-changed': []
}>()

// 初始化建模器
async function initializeModeler() {
  if (!modelerContainer.value) {
    return
  }
  
  try {
    loading.value = true
    
    // 强制设置容器尺寸
    modelerContainer.value.style.width = '100%'
    modelerContainer.value.style.height = '100%'
    modelerContainer.value.style.minHeight = '800px'
    modelerContainer.value.style.minWidth = '1200px'
    
    // 初始化BPMN服务，使用固定的大尺寸
    await bpmnService.initialize(modelerContainer.value, {
      width: 1200,
      height: 800
    })
    
    // 获取建模器实例
    const modeler = bpmnService.getModeler()
    if (!modeler) {
      throw new Error('建模器初始化失败')
    }
    
    // 保存到store
    bpmnStore.setModeler(modeler)
    
    // 绑定事件
    bindEvents()
    
    // 标记建模器就绪
    modelerReady.value = true
    
    // 触发就绪事件
    emit('modeler-ready', modeler)
    
    console.log('建模器加载成功', modeler)
    
  } catch (error) {
    console.error('初始化建模器失败:', error)
    console.error('建模器初始化失败')
    alert('建模器初始化失败')
  } finally {
    loading.value = false
  }
}

// 绑定事件
function bindEvents() {
  // 选择变化事件
  bpmnService.on('selection.changed', (event: BpmnEvent) => {
    bpmnStore.selectElement(event.element || null)
    emit('selection-changed', event.element)
  })
  
  // 元素变化事件
  bpmnService.on('elements.changed', () => {
    bpmnStore.markDirty()
    updateUndoRedoState()
    emit('elements-changed')
  })
}

// 更新撤销/重做状态
function updateUndoRedoState() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    return
  }
  
  const commandStack = modeler.get('commandStack')
  canUndo.value = commandStack.canUndo()
  canRedo.value = commandStack.canRedo()
}

// 新建流程
async function handleNew() {
  if (bpmnStore.isDirty) {
    if (!confirm('当前流程未保存，是否继续新建？')) {
      return
    }
  }
  
  try {
    await bpmnService.createNewProcess()
    await bpmnStore.createNewProcess()
    console.log('新建流程成功')
  } catch (error) {
    console.error('新建流程失败:', error)
    alert('新建流程失败')
  }
}

// 导入流程
function handleImport() {
  fileInput.value?.click()
}

// 处理文件导入
async function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) {
    return
  }
  
  try {
    const xml = await readFileAsText(file)
    await bpmnService.importXML(xml)
    await bpmnStore.importProcess(xml)
    console.log('导入流程成功')
  } catch (error) {
    console.error('导入流程失败:', error)
    alert('导入流程失败')
  }
  
  // 清空文件输入
  target.value = ''
}

// 读取文件为文本
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file)
  })
}

// 导出流程
async function handleExport() {
  try {
    const xml = await bpmnService.exportXML({ format: true })
    downloadFile(xml, 'process.bpmn', 'application/xml')
    console.log('导出流程成功')
  } catch (error) {
    console.error('导出流程失败:', error)
    alert('导出流程失败')
  }
}

// 下载文件
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// 重置缩放
function handleZoomReset() {
  bpmnService.resetZoom()
}

// 适应窗口
function handleZoomFit() {
  bpmnService.zoomToFit()
}

// 撤销
function handleUndo() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    return
  }
  
  const commandStack = modeler.get('commandStack')
  commandStack.undo()
}

// 重做
function handleRedo() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    return
  }
  
  const commandStack = modeler.get('commandStack')
  commandStack.redo()
}

// 调整画布大小
function handleResize() {
  nextTick(() => {
    bpmnService.resize()
  })
}

// 调试调色板
function debugPalette() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    alert('建模器未初始化')
    return
  }
  
  console.log('建模器实例:', modeler)
  
  try {
    const palette = modeler.get('palette')
    console.log('调色板服务:', palette)
    
    const paletteContainer = document.querySelector('.djs-palette')
    console.log('调色板DOM元素:', paletteContainer)
    
    if (paletteContainer) {
      console.log('调色板样式:', window.getComputedStyle(paletteContainer))
      alert(`调色板状态: 
        - 存在: 是
        - 显示: ${paletteContainer.style.display || '默认'}
        - 可见性: ${paletteContainer.style.visibility || '默认'}
        - 透明度: ${paletteContainer.style.opacity || '默认'}
        - 位置: ${paletteContainer.style.position || '默认'}`)
    } else {
      alert('调色板DOM元素不存在')
    }
    
  } catch (error) {
    console.error('调试调色板失败:', error)
    alert('调试调色板失败: ' + error)
  }
}

// 强制显示调色板
function fixPalette() {
  const paletteContainer = document.querySelector('.djs-palette') as HTMLElement
  
  if (paletteContainer) {
    // 强制设置调色板样式
    paletteContainer.style.position = 'absolute'
    paletteContainer.style.left = '20px'
    paletteContainer.style.top = '20px'
    paletteContainer.style.zIndex = '1000'
    paletteContainer.style.display = 'block'
    paletteContainer.style.visibility = 'visible'
    paletteContainer.style.opacity = '1'
    paletteContainer.style.backgroundColor = '#fff'
    paletteContainer.style.border = '1px solid #ddd'
    paletteContainer.style.borderRadius = '4px'
    paletteContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'
    paletteContainer.style.padding = '10px'
    paletteContainer.style.minWidth = '150px'
    
    alert('已强制显示调色板！现在应该能看到左侧的工具面板了。')
    console.log('调色板样式已更新:', paletteContainer.style.cssText)
  } else {
    alert('未找到调色板元素')
  }
}

// 显示调色板内容
function showPaletteContent() {
  const paletteContainer = document.querySelector('.djs-palette') as HTMLElement
  
  if (paletteContainer) {
    console.log('调色板HTML内容:', paletteContainer.innerHTML)
    console.log('调色板子元素:', paletteContainer.children)
    
    // 检查调色板是否有内容
    const entries = paletteContainer.querySelectorAll('.entry')
    console.log('调色板条目数量:', entries.length)
    
    if (entries.length === 0) {
      alert('调色板没有任何工具条目！可能需要重新初始化。')
    } else {
      alert(`调色板包含 ${entries.length} 个工具条目`)
    }
    
    // 强制添加一个明显的标识
    const marker = document.createElement('div')
    marker.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      background: red;
      color: white;
      padding: 5px;
      font-size: 12px;
      z-index: 10000;
      pointer-events: none;
    `
    marker.textContent = '调色板位置'
    paletteContainer.appendChild(marker)
    
  } else {
    alert('未找到调色板元素')
  }
}

// 重新打开调色板
function reopenPalette() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    alert('建模器未初始化')
    return
  }
  
  try {
    const palette = modeler.get('palette')
    console.log('调色板服务:', palette)
    
    // 尝试重新打开调色板
    if (palette.isOpen && palette.isOpen()) {
      palette.close()
      setTimeout(() => {
        palette.open()
        alert('调色板已重新打开')
      }, 100)
    } else {
      palette.open()
      alert('调色板已打开')
    }
    
    // 获取调色板提供者并检查条目
    const paletteProvider = modeler.get('paletteProvider')
    console.log('调色板提供者:', paletteProvider)
    
    if (paletteProvider && paletteProvider.getPaletteEntries) {
      const entries = paletteProvider.getPaletteEntries()
      console.log('调色板条目:', entries)
      console.log('条目数量:', Object.keys(entries).length)
    }
    
  } catch (error) {
    console.error('重新打开调色板失败:', error)
    alert('重新打开调色板失败: ' + error)
  }
}

// 强制重新渲染调色板
function forceRenderPalette() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    alert('建模器未初始化')
    return
  }
  
  try {
    // 获取调色板和提供者
    const palette = modeler.get('palette')
    const paletteProvider = modeler.get('paletteProvider')
    
    // 强制重新构建调色板
    if (paletteProvider && paletteProvider.getPaletteEntries) {
      const entries = paletteProvider.getPaletteEntries()
      console.log('强制渲染 - 调色板条目:', entries)
      
      // 清除现有内容
      const container = document.querySelector('.djs-palette')
      if (container) {
        container.innerHTML = ''
        
        // 手动创建条目
        Object.keys(entries).forEach((key, index) => {
          const entry = entries[key]
          const entryEl = document.createElement('div')
          entryEl.className = 'entry'
          entryEl.title = entry.title || key
          entryEl.innerHTML = `<span style="font-size: 10px;">${key.substring(0, 4)}</span>`
          entryEl.style.cssText = `
            width: 45px;
            height: 35px;
            margin: 1px;
            padding: 2px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: #f8f9fa;
            cursor: pointer;
            display: inline-block;
            text-align: center;
            line-height: 30px;
            font-size: 10px;
            vertical-align: top;
          `
          
          // 添加点击事件
          if (entry.action) {
            entryEl.addEventListener('click', () => {
              if (typeof entry.action === 'function') {
                entry.action()
              }
            })
          }
          
          container.appendChild(entryEl)
        })
        
        alert(`已手动渲染 ${Object.keys(entries).length} 个调色板条目`)
      }
    }
    
  } catch (error) {
    console.error('强制渲染调色板失败:', error)
    alert('强制渲染调色板失败: ' + error)
  }
}

// 强制全屏
function forceFullscreen() {
  const modeler = bpmnService.getModeler()
  if (!modeler) {
    alert('建模器未初始化')
    return
  }
  
  // 强制设置容器尺寸
  const container = modelerContainer.value
  if (container) {
    container.style.width = '100vw'
    container.style.height = 'calc(100vh - 60px)'
    container.style.position = 'relative'
  }
  
  // 强制设置BPMN画布尺寸
  const bpmnContainer = document.querySelector('.djs-container') as HTMLElement
  if (bpmnContainer) {
    bpmnContainer.style.width = '100%'
    bpmnContainer.style.height = '100%'
  }
  
  // 重新调整建模器大小
  nextTick(() => {
    bpmnService.resize()
    
    // 强制缩放到合适大小
    const canvas = modeler.get('canvas')
    if (canvas) {
      canvas.zoom('fit-viewport', 'auto')
    }
  })
  
  alert('已强制设置为全屏模式')
}

// 重新初始化BPMN
async function reinitializeBpmn() {
  try {
    // 销毁现有的建模器
    bpmnService.destroy()
    
    // 清空容器
    if (modelerContainer.value) {
      modelerContainer.value.innerHTML = ''
      
      // 设置容器为大尺寸
      modelerContainer.value.style.cssText = `
        width: 100%;
        height: 100%;
        min-width: 1200px;
        min-height: 800px;
        background: #f5f5f5;
        position: relative;
      `
    }
    
    // 等待DOM更新
    await nextTick()
    
    // 重新初始化
    await initializeModeler()
    
    alert('BPMN建模器已重新初始化为大尺寸模式')
    
  } catch (error) {
    console.error('重新初始化失败:', error)
    alert('重新初始化失败: ' + error)
  }
}

// 监听容器大小变化
const resizeObserver = ref<ResizeObserver>()

// 组件挂载
onMounted(async () => {
  await nextTick()
  await initializeModeler()
  
  // 监听容器大小变化
  if (modelerContainer.value) {
    resizeObserver.value = new ResizeObserver(() => {
      handleResize()
    })
    resizeObserver.value.observe(modelerContainer.value)
  }
})

// 组件卸载
onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  bpmnService.destroy()
})

// 监听高度变化
watch(() => props.height, () => {
  nextTick(() => {
    handleResize()
  })
})
</script>

<style lang="scss" scoped>
.bpmn-modeler {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background-color: #fafafa;
  margin: 0;
  padding: 0;
}

.bpmn-toolbar {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #dcdfe6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .toolbar-content {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  
  .btn {
    padding: 8px 16px;
    background-color: #409eff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    
    &:hover {
      background-color: #337ecc;
    }
    
    &:disabled {
      background-color: #c0c4cc;
      cursor: not-allowed;
    }
    
    &.debug {
      background-color: #f56c6c;
      
      &:hover {
        background-color: #f78989;
      }
    }
  }
}

.bpmn-container {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}

.debug-info {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 0, 0.8);
  padding: 10px;
  border-radius: 4px;
  z-index: 1000;
  font-size: 12px;
  
  p {
    margin: 2px 0;
  }
}

.bpmn-canvas {
  width: 100%;
  height: 100%;
  min-width: 1200px;
  min-height: 800px;
  position: relative;
  overflow: auto;
  
  // 上下文菜单样式
  :deep(.djs-context-pad) {
    z-index: 99;
    
    .entry {
      border-radius: 2px;
      
      &:hover {
        background-color: #ecf5ff;
      }
    }
  }
  
  // 选中元素样式
  :deep(.djs-shape.selected) {
    .djs-outline {
      stroke: #409eff;
      stroke-width: 2px;
    }
  }
  
  :deep(.djs-connection.selected) {
    .djs-outline {
      stroke: #409eff;
      stroke-width: 3px;
    }
  }
  
  // 确保画布容器正确显示
  :deep(.djs-container) {
    width: 100%;
    height: 100%;
  }
}

.bpmn-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  
  .loading-text {
    font-size: 16px;
    color: #606266;
  }
}
</style>