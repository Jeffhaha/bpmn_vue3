/**
 * 简单的属性面板功能验证脚本
 * 在浏览器控制台运行以测试属性面板功能
 */

function testPropertiesPanel() {
  console.log('=== 属性面板功能测试 ===');
  
  // 1. 检查Vue应用是否正在运行
  if (typeof window !== 'undefined' && window.document) {
    const app = document.querySelector('#app');
    console.log('Vue应用容器:', app ? '✓ 存在' : '✗ 不存在');
    
    // 2. 检查BPMN建模器是否存在
    const bpmnCanvas = document.querySelector('.simple-bpmn-canvas');
    console.log('BPMN画布:', bpmnCanvas ? '✓ 存在' : '✗ 不存在');
    
    // 3. 检查属性面板是否存在
    const propertiesPanel = document.querySelector('.properties-panel');
    console.log('属性面板:', propertiesPanel ? '✓ 存在' : '✗ 不存在');
    
    if (propertiesPanel) {
      // 4. 检查属性面板内容
      const noSelection = propertiesPanel.querySelector('.no-selection');
      const propertyContent = propertiesPanel.querySelector('.property-sections');
      
      if (noSelection && !noSelection.style.display === 'none') {
        console.log('属性面板状态: 未选择元素');
      } else if (propertyContent) {
        console.log('属性面板状态: 显示属性内容');
      }
    }
    
    // 5. 检查BPMN.js调色板是否存在
    const palette = document.querySelector('.djs-palette');
    console.log('BPMN调色板:', palette ? '✓ 存在' : '✗ 不存在');
    
    // 6. 检查可选择的元素
    const shapes = document.querySelectorAll('[data-element-id]');
    console.log('可选择元素数量:', shapes.length);
    
  } else {
    console.log('请在浏览器环境中运行此脚本');
  }
  
  console.log('======================');
}

// 手动测试选择元素的函数
function testElementSelection() {
  console.log('=== 测试元素选择 ===');
  
  const shapes = document.querySelectorAll('[data-element-id]');
  if (shapes.length > 0) {
    console.log('找到', shapes.length, '个可选择元素');
    
    // 模拟点击第一个元素
    const firstShape = shapes[0];
    console.log('尝试选择元素:', firstShape.getAttribute('data-element-id'));
    
    // 触发点击事件
    firstShape.click();
    
    setTimeout(() => {
      const propertiesPanel = document.querySelector('.properties-panel');
      if (propertiesPanel) {
        const propertyContent = propertiesPanel.querySelector('.property-sections');
        console.log('选择后属性面板状态:', propertyContent ? '显示属性' : '无属性显示');
      }
    }, 100);
  } else {
    console.log('没有找到可选择的元素');
  }
  
  console.log('==================');
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testPropertiesPanel, testElementSelection };
} else {
  // 浏览器环境下直接挂载到window
  window.testPropertiesPanel = testPropertiesPanel;
  window.testElementSelection = testElementSelection;
}

console.log('属性面板测试脚本已加载');
console.log('运行 testPropertiesPanel() 检查基本状态');
console.log('运行 testElementSelection() 测试元素选择');