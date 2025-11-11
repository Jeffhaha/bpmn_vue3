<template>
  <div class="modeler-view">
    <BpmnModeler
      height="100%"
      @modeler-ready="onModelerReady"
      @selection-changed="onSelectionChanged"
      @elements-changed="onElementsChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BpmnModeler from '@/components/bpmn/BpmnModeler.vue'
// import { useBpmnStore } from '@/stores/bpmn'

// Store - 暂未使用，后续阶段会用到
// const bpmnStore = useBpmnStore()

// 响应式数据
const modelerReady = ref(false)

// 建模器就绪事件
function onModelerReady(modeler: any) {
  console.log('建模器已就绪:', modeler)
  modelerReady.value = true
}

// 选择变化事件
function onSelectionChanged(element: any) {
  console.log('选择元素变化:', element)
}

// 元素变化事件
function onElementsChanged() {
  console.log('元素已变化')
}
</script>

<style lang="scss" scoped>
.modeler-view {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>