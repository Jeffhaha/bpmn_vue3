<template>
  <div class="simple-bpmn-test">
    <div class="toolbar">
      <h3>BPMN.js 测试</h3>
      <button @click="testBpmnJs" class="test-btn">测试 BPMN.js 加载</button>
    </div>
    <div ref="canvas" class="canvas"></div>
    <div class="status">
      <p>状态: {{ status }}</p>
      <p>错误: {{ error }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvas = ref<HTMLElement>()
const status = ref('准备中...')
const error = ref('')

async function testBpmnJs() {
  try {
    status.value = '开始导入 BPMN.js...'
    
    // 动态导入 BPMN.js
    const { default: Modeler } = await import('bpmn-js/lib/Modeler')
    status.value = 'BPMN.js 导入成功，创建建模器...'
    
    if (!canvas.value) {
      throw new Error('Canvas 元素不存在')
    }
    
    const modeler = new Modeler({
      container: canvas.value,
      width: '100%',
      height: '400px'
    })
    
    status.value = '建模器创建成功，导入默认XML...'
    
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
    
    await modeler.importXML(defaultXml)
    status.value = '✅ BPMN.js 完全正常工作！'
    
  } catch (err) {
    error.value = String(err)
    status.value = '❌ 发生错误'
    console.error('BPMN.js 测试失败:', err)
  }
}

onMounted(() => {
  // 自动测试
  setTimeout(() => {
    testBpmnJs()
  }, 1000)
})
</script>

<style scoped>
.simple-bpmn-test {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.test-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.test-btn:hover {
  background: #337ecc;
}

.canvas {
  width: 100%;
  height: 400px;
  border: 2px solid #ddd;
  border-radius: 8px;
  margin-bottom: 20px;
}

.status {
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  font-family: monospace;
}

.status p {
  margin: 5px 0;
}
</style>