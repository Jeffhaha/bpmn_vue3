import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BpmnElement, NodeProperties, NodeTemplate } from '@/types'

export const useBpmnStore = defineStore('bpmn', () => {
  // 建模器实例
  const modeler = ref<any>(null)
  
  // 当前流程XML
  const processXml = ref<string>('')
  
  // 选中的元素
  const selectedElement = ref<BpmnElement | null>(null)
  
  // 元素属性映射
  const elementProperties = ref<Map<string, NodeProperties>>(new Map())
  
  // 节点模板列表
  const nodeTemplates = ref<NodeTemplate[]>([])
  
  // 是否已修改
  const isDirty = ref<boolean>(false)
  
  // 计算属性：获取当前选中元素的属性
  const selectedElementProperties = computed(() => {
    if (!selectedElement.value) return null
    return elementProperties.value.get(selectedElement.value.id) || null
  })
  
  // 计算属性：是否有选中的元素
  const hasSelection = computed(() => selectedElement.value !== null)
  
  // 设置建模器实例
  function setModeler(modelerInstance: any) {
    modeler.value = modelerInstance
  }
  
  // 设置流程XML
  function setProcessXml(xml: string) {
    processXml.value = xml
    markDirty()
  }
  
  // 选择元素
  function selectElement(element: BpmnElement | null) {
    selectedElement.value = element
  }
  
  // 更新元素属性
  function updateElementProperties(elementId: string, properties: Partial<NodeProperties>) {
    const existingProps = elementProperties.value.get(elementId)
    const updatedProps = { ...existingProps, ...properties } as NodeProperties
    elementProperties.value.set(elementId, updatedProps)
    markDirty()
  }
  
  // 获取元素属性
  function getElementProperties(elementId: string): NodeProperties | undefined {
    return elementProperties.value.get(elementId)
  }
  
  // 删除元素属性
  function removeElementProperties(elementId: string) {
    elementProperties.value.delete(elementId)
    markDirty()
  }
  
  // 添加节点模板
  function addNodeTemplate(template: NodeTemplate) {
    nodeTemplates.value.push(template)
  }
  
  // 移除节点模板
  function removeNodeTemplate(templateId: string) {
    const index = nodeTemplates.value.findIndex(t => t.id === templateId)
    if (index > -1) {
      nodeTemplates.value.splice(index, 1)
    }
  }
  
  // 获取节点模板
  function getNodeTemplate(templateId: string): NodeTemplate | undefined {
    return nodeTemplates.value.find(t => t.id === templateId)
  }
  
  // 标记为已修改
  function markDirty() {
    isDirty.value = true
  }
  
  // 标记为未修改
  function markClean() {
    isDirty.value = false
  }
  
  // 创建新流程
  async function createNewProcess() {
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
    
    setProcessXml(defaultXml)
    elementProperties.value.clear()
    selectedElement.value = null
    markClean()
  }
  
  // 导入流程XML
  async function importProcess(xml: string) {
    try {
      setProcessXml(xml)
      elementProperties.value.clear()
      selectedElement.value = null
      markClean()
      return true
    } catch (error) {
      console.error('导入流程失败:', error)
      return false
    }
  }
  
  // 导出流程XML
  async function exportProcess(): Promise<string> {
    if (!modeler.value) {
      throw new Error('建模器未初始化')
    }
    
    try {
      const result = await modeler.value.saveXML({ format: true })
      return result.xml
    } catch (error) {
      console.error('导出流程失败:', error)
      throw error
    }
  }
  
  // 导出SVG
  async function exportSVG(): Promise<string> {
    if (!modeler.value) {
      throw new Error('建模器未初始化')
    }
    
    try {
      const result = await modeler.value.saveSVG()
      return result.svg
    } catch (error) {
      console.error('导出SVG失败:', error)
      throw error
    }
  }
  
  return {
    // 状态
    modeler,
    processXml,
    selectedElement,
    elementProperties,
    nodeTemplates,
    isDirty,
    
    // 计算属性
    selectedElementProperties,
    hasSelection,
    
    // 方法
    setModeler,
    setProcessXml,
    selectElement,
    updateElementProperties,
    getElementProperties,
    removeElementProperties,
    addNodeTemplate,
    removeNodeTemplate,
    getNodeTemplate,
    markDirty,
    markClean,
    createNewProcess,
    importProcess,
    exportProcess,
    exportSVG
  }
})