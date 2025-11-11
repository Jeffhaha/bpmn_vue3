<template>
  <div class="simple-bpmn-modeler">
    <!-- 简化的工具栏 -->
    <div class="simple-toolbar">
      <button @click="createNew" class="btn">新建</button>
      <button @click="exportXml" class="btn">导出</button>
      <button @click="zoomFit" class="btn">适应窗口</button>
      <button @click="debugPalette" class="btn debug">调试调色板</button>
    </div>
    
    <!-- BPMN画布 -->
    <div ref="bpmnContainer" class="simple-bpmn-canvas"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import Modeler from 'bpmn-js/lib/Modeler'

// 导入BPMN.js样式
import 'bpmn-js/dist/assets/diagram-js.css'
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css'

const bpmnContainer = ref<HTMLElement>()
let modeler: any = null

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
    // 创建BPMN建模器
    modeler = new Modeler({
      container: bpmnContainer.value
    })
    
    // 导入默认XML
    await modeler.importXML(defaultXml)
    
    console.log('简单BPMN建模器初始化成功')
    
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
    
  } catch (error) {
    console.error('BPMN建模器初始化失败:', error)
  }
}

function createNew() {
  if (modeler) {
    modeler.importXML(defaultXml)
  }
}

async function exportXml() {
  if (modeler) {
    try {
      const result = await modeler.saveXML({ format: true })
      downloadFile(result.xml, 'process.bpmn', 'application/xml')
    } catch (error) {
      console.error('导出失败:', error)
    }
  }
}

function zoomFit() {
  if (modeler) {
    const canvas = modeler.get('canvas')
    canvas.zoom('fit-viewport')
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

function debugPalette() {
  console.log('调试调色板状态...')
  
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
  if (modeler) {
    modeler.destroy()
  }
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

.simple-bpmn-canvas {
  flex: 1;
  width: 100%;
  height: calc(100vh - 50px);
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