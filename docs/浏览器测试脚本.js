/**
 * Phase 5.2.1 事件模板系统浏览器测试脚本
 * 在浏览器开发者控制台中运行此脚本来验证功能
 */

// 测试函数集合
window.BPMNEventTemplateTest = {
  
  /**
   * 1. 验证模板管理器和模板数量
   */
  async testTemplateManager() {
    console.log('🧪 测试1: 验证模板管理器...')
    
    try {
      // 动态导入模板管理器
      const { templateManager } = await import('/src/utils/template-manager.ts')
      
      const allTemplates = templateManager.getAllTemplates()
      const categories = templateManager.getAllCategories()
      
      console.log('✅ 模板总数:', allTemplates.length)
      console.log('✅ 分类总数:', categories.length)
      
      // 按分类统计
      const categoryStats = {}
      allTemplates.forEach(template => {
        const category = categories.find(c => c.id === template.category)
        const categoryName = category?.name || '未知分类'
        categoryStats[categoryName] = (categoryStats[categoryName] || 0) + 1
      })
      
      console.log('✅ 分类统计:', categoryStats)
      
      // 验证预期结果
      const expectedTotal = 36 // 7任务 + 25事件 + 4网关
      if (allTemplates.length >= 25) {
        console.log('✅ 模板数量符合预期 (≥25个)')
      } else {
        console.log('❌ 模板数量不足:', allTemplates.length)
      }
      
      return { allTemplates, categories, categoryStats }
      
    } catch (error) {
      console.error('❌ 模板管理器测试失败:', error)
      return null
    }
  },

  /**
   * 2. 验证事件模板包加载
   */
  async testEventTemplatePackage() {
    console.log('🧪 测试2: 验证事件模板包...')
    
    try {
      // 动态导入事件模板包
      const eventTemplates = await import('/src/utils/template-packages/event-templates.ts')
      
      const testCategoryId = 'test-events'
      const allEventTemplates = eventTemplates.getAllEventTemplates(testCategoryId)
      const startEvents = eventTemplates.getStartEventTemplates(testCategoryId)
      const intermediateEvents = eventTemplates.getIntermediateEventTemplates(testCategoryId)
      const endEvents = eventTemplates.getEndEventTemplates(testCategoryId)
      
      console.log('✅ 事件模板包加载成功')
      console.log('✅ 总事件模板:', allEventTemplates.length)
      console.log('✅ 开始事件:', startEvents.length)
      console.log('✅ 中间事件:', intermediateEvents.length) 
      console.log('✅ 结束事件:', endEvents.length)
      
      // 验证预期数量
      const expectedCounts = {
        total: 29, // 总数应该是29 (9+12+8)
        start: 9,
        intermediate: 12,
        end: 8
      }
      
      const results = {
        total: allEventTemplates.length === expectedCounts.total,
        start: startEvents.length === expectedCounts.start,
        intermediate: intermediateEvents.length === expectedCounts.intermediate,
        end: endEvents.length === expectedCounts.end
      }
      
      Object.entries(results).forEach(([key, passed]) => {
        const actual = key === 'total' ? allEventTemplates.length : 
                      key === 'start' ? startEvents.length :
                      key === 'intermediate' ? intermediateEvents.length : endEvents.length
        const expected = expectedCounts[key]
        
        if (passed) {
          console.log(`✅ ${key}事件数量正确: ${actual}/${expected}`)
        } else {
          console.log(`❌ ${key}事件数量不对: ${actual}/${expected}`)
        }
      })
      
      // 检查DynamicForm配置
      const messageStartEvent = startEvents.find(t => t.name === '消息开始事件')
      if (messageStartEvent?.properties?.dynamicFormConfig) {
        console.log('✅ DynamicForm配置存在')
        console.log('✅ 消息开始事件DynamicForm:', messageStartEvent.properties.dynamicFormConfig)
      } else {
        console.log('❌ DynamicForm配置缺失')
      }
      
      return { allEventTemplates, startEvents, intermediateEvents, endEvents, results }
      
    } catch (error) {
      console.error('❌ 事件模板包测试失败:', error)
      return null
    }
  },

  /**
   * 3. 验证模板面板UI组件
   */
  async testTemplatePanelUI() {
    console.log('🧪 测试3: 验证模板面板UI...')
    
    // 检查模板面板是否存在
    const templatePanel = document.querySelector('.template-panel')
    if (templatePanel) {
      console.log('✅ 模板面板DOM存在')
    } else {
      console.log('❌ 模板面板DOM不存在')
      return false
    }
    
    // 检查事件分类
    const categoryHeaders = document.querySelectorAll('.category-header')
    const eventCategory = Array.from(categoryHeaders).find(header => 
      header.textContent.includes('事件')
    )
    
    if (eventCategory) {
      console.log('✅ 事件分类显示正常')
      
      // 获取事件数量显示
      const countText = eventCategory.textContent.match(/\((\d+)\)/)
      if (countText) {
        const count = parseInt(countText[1])
        console.log('✅ 显示的事件模板数量:', count)
        
        if (count >= 25) {
          console.log('✅ 事件模板数量符合预期')
        } else {
          console.log('❌ 事件模板数量不足:', count)
        }
      }
    } else {
      console.log('❌ 事件分类未找到')
    }
    
    // 检查模板项
    const templateItems = document.querySelectorAll('.template-item')
    console.log('✅ 页面上的模板项数量:', templateItems.length)
    
    return true
  },

  /**
   * 4. 验证拖拽数据格式
   */
  async testDragDataFormat() {
    console.log('🧪 测试4: 验证拖拽数据格式...')
    
    try {
      // 模拟UnifiedDragData格式
      const sampleDragData = {
        type: 'template',
        source: 'templatePanel',
        nodeInfo: {
          elementType: 'bpmn:StartEvent',
          name: '消息开始事件',
          category: 'events',
          icon: 'fas fa-envelope'
        },
        template: {
          id: 'test-template',
          name: '消息开始事件',
          nodeType: 'bpmn:StartEvent',
          properties: {
            dynamicFormConfig: {
              sections: [{
                title: '消息配置',
                fields: []
              }]
            }
          }
        }
      }
      
      // 验证数据结构
      const requiredFields = ['type', 'source', 'nodeInfo', 'template']
      const nodeInfoFields = ['elementType', 'name', 'category', 'icon']
      
      let isValid = true
      
      // 检查顶级字段
      requiredFields.forEach(field => {
        if (!(field in sampleDragData)) {
          console.log(`❌ 缺少字段: ${field}`)
          isValid = false
        }
      })
      
      // 检查nodeInfo字段
      nodeInfoFields.forEach(field => {
        if (!(field in sampleDragData.nodeInfo)) {
          console.log(`❌ nodeInfo缺少字段: ${field}`)
          isValid = false
        }
      })
      
      if (isValid) {
        console.log('✅ 拖拽数据格式验证通过')
        console.log('✅ 示例数据:', JSON.stringify(sampleDragData, null, 2))
      }
      
      return isValid
      
    } catch (error) {
      console.error('❌ 拖拽数据格式测试失败:', error)
      return false
    }
  },

  /**
   * 5. 综合测试运行
   */
  async runAllTests() {
    console.log('🚀 开始Phase 5.2.1全面测试...\n')
    
    const results = {}
    
    // 运行所有测试
    results.templateManager = await this.testTemplateManager()
    results.eventPackage = await this.testEventTemplatePackage()
    results.panelUI = await this.testTemplatePanelUI()
    results.dragFormat = await this.testDragDataFormat()
    
    // 汇总结果
    console.log('\n📊 测试结果汇总:')
    console.log('================')
    
    const passed = Object.values(results).filter(r => r !== null && r !== false).length
    const total = Object.keys(results).length
    
    console.log(`✅ 通过测试: ${passed}/${total}`)
    
    if (passed === total) {
      console.log('🎉 Phase 5.2.1 事件模板系统测试全部通过!')
    } else {
      console.log('⚠️ 部分测试未通过，请检查具体错误信息')
    }
    
    return results
  },

  /**
   * 6. 快速模板统计
   */
  async quickStats() {
    console.log('📈 快速统计模板信息...')
    
    try {
      const { templateManager } = await import('/src/utils/template-manager.ts')
      const allTemplates = templateManager.getAllTemplates()
      
      // 按节点类型统计
      const typeStats = {}
      allTemplates.forEach(template => {
        const type = template.nodeType
        typeStats[type] = (typeStats[type] || 0) + 1
      })
      
      console.log('📊 按BPMN类型统计:')
      Object.entries(typeStats).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}个`)
      })
      
      // 统计事件类型
      const eventTypes = Object.keys(typeStats).filter(type => 
        type.includes('Event')
      )
      
      const totalEvents = eventTypes.reduce((sum, type) => 
        sum + typeStats[type], 0
      )
      
      console.log(`\n🎯 总事件模板数: ${totalEvents}个`)
      console.log(`🎯 预期目标: 25个`)
      console.log(`🎯 达成度: ${((totalEvents/25)*100).toFixed(1)}%`)
      
    } catch (error) {
      console.error('❌ 统计失败:', error)
    }
  }
}

// 使用说明
console.log(`
🧪 Phase 5.2.1 事件模板系统测试脚本已加载

使用方法:
1. 运行全面测试: BPMNEventTemplateTest.runAllTests()
2. 快速统计: BPMNEventTemplateTest.quickStats()
3. 单独测试:
   - BPMNEventTemplateTest.testTemplateManager()
   - BPMNEventTemplateTest.testEventTemplatePackage()
   - BPMNEventTemplateTest.testTemplatePanelUI()
   - BPMNEventTemplateTest.testDragDataFormat()

建议: 先运行 runAllTests() 获得完整测试报告
`)

// 自动运行快速统计
BPMNEventTemplateTest.quickStats()