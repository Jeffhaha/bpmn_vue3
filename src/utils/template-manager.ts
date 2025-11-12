import type { 
  NodeTemplate, 
  TemplateCategory, 
  TemplateQuery, 
  TemplateVersion, 
  TemplateChanges,
  TemplateInstantiationConfig,
  BpmnElement,
  PropertyValue 
} from '@/types'

/**
 * 节点模板管理器
 * 负责模板的创建、存储、查询、版本管理和实例化
 */
export class TemplateManager {
  private templates = new Map<string, NodeTemplate>()
  private categories = new Map<string, TemplateCategory>()
  private versions = new Map<string, TemplateVersion[]>()
  private storageKey = 'bpmn-templates'
  private categoriesKey = 'bpmn-template-categories'

  constructor() {
    this.loadFromStorage()
    this.initializeDefaultTemplates()
  }

  // === 模板CRUD操作 ===

  /**
   * 创建新模板
   */
  async createTemplate(template: Omit<NodeTemplate, 'id' | 'metadata'>): Promise<string> {
    const id = this.generateId('template')
    const now = new Date()
    
    const newTemplate: NodeTemplate = {
      ...template,
      id,
      metadata: {
        version: '1.0.0',
        author: 'User',
        createdAt: now,
        updatedAt: now,
        tags: template.category ? [template.category] : [],
        usageCount: 0
      }
    }

    this.templates.set(id, newTemplate)
    await this.saveToStorage()
    
    // 如果模板包含DynamicForm配置，注册到PropertyExtensionManager
    this.registerDynamicFormConfig(newTemplate)
    
    console.log('创建模板成功:', newTemplate.name)
    return id
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, updates: Partial<NodeTemplate>): Promise<void> {
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`模板 ${id} 不存在`)
    }

    const updatedTemplate: NodeTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }

    this.templates.set(id, updatedTemplate)
    await this.saveToStorage()
    
    console.log('更新模板成功:', updatedTemplate.name)
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`模板 ${id} 不存在`)
    }

    this.templates.delete(id)
    this.versions.delete(id)
    await this.saveToStorage()
    
    console.log('删除模板成功:', template.name)
  }

  /**
   * 获取模板
   */
  async getTemplate(id: string): Promise<NodeTemplate> {
    const template = this.templates.get(id)
    if (!template) {
      throw new Error(`模板 ${id} 不存在`)
    }
    return { ...template }
  }

  // === 模板查询和搜索 ===

  /**
   * 搜索模板
   */
  async searchTemplates(query: TemplateQuery): Promise<NodeTemplate[]> {
    let results = Array.from(this.templates.values())

    // 按分类过滤
    if (query.category) {
      results = results.filter(template => template.category === query.category)
    }

    // 按节点类型过滤
    if (query.nodeType) {
      results = results.filter(template => template.nodeType === query.nodeType)
    }

    // 按标签过滤
    if (query.tags && query.tags.length > 0) {
      results = results.filter(template => 
        query.tags!.some(tag => template.metadata.tags.includes(tag))
      )
    }

    // 按作者过滤
    if (query.author) {
      results = results.filter(template => template.metadata.author === query.author)
    }

    // 文本搜索
    if (query.search) {
      const searchTerm = query.search.toLowerCase()
      results = results.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.metadata.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      )
    }

    // 排序
    results = this.sortTemplates(results, query.sortBy || 'name', query.sortOrder || 'asc')

    // 分页
    if (query.limit || query.offset) {
      const offset = query.offset || 0
      const limit = query.limit || results.length
      results = results.slice(offset, offset + limit)
    }

    return results
  }

  /**
   * 按分类获取模板
   */
  async getTemplatesByCategory(categoryId: string): Promise<NodeTemplate[]> {
    return this.searchTemplates({ category: categoryId })
  }

  /**
   * 获取热门模板
   */
  async getPopularTemplates(limit: number = 10): Promise<NodeTemplate[]> {
    return this.searchTemplates({ 
      sortBy: 'usage', 
      sortOrder: 'desc', 
      limit 
    })
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): NodeTemplate[] {
    return Array.from(this.templates.values())
  }

  // === 版本管理 ===

  /**
   * 创建新版本
   */
  async createVersion(templateId: string, changes: TemplateChanges): Promise<string> {
    const template = await this.getTemplate(templateId)
    const versionId = this.generateId('version')
    
    const version: TemplateVersion = {
      id: versionId,
      templateId,
      version: this.incrementVersion(template.metadata.version),
      changelog: changes.description,
      createdAt: new Date(),
      author: template.metadata.author,
      templateData: { ...template }
    }

    if (!this.versions.has(templateId)) {
      this.versions.set(templateId, [])
    }
    this.versions.get(templateId)!.push(version)

    await this.saveToStorage()
    return versionId
  }

  /**
   * 获取版本历史
   */
  async getVersionHistory(templateId: string): Promise<TemplateVersion[]> {
    return this.versions.get(templateId) || []
  }

  /**
   * 恢复版本
   */
  async restoreVersion(templateId: string, versionId: string): Promise<void> {
    const versions = await this.getVersionHistory(templateId)
    const version = versions.find(v => v.id === versionId)
    
    if (!version) {
      throw new Error(`版本 ${versionId} 不存在`)
    }

    await this.updateTemplate(templateId, version.templateData)
  }

  // === 分类管理 ===

  /**
   * 创建分类
   */
  async createCategory(category: Omit<TemplateCategory, 'id' | 'templates'>): Promise<string> {
    const id = this.generateId('category')
    
    const newCategory: TemplateCategory = {
      ...category,
      id,
      templates: []
    }

    this.categories.set(id, newCategory)
    await this.saveToStorage()
    
    return id
  }

  /**
   * 获取所有分类
   */
  getAllCategories(): TemplateCategory[] {
    return Array.from(this.categories.values())
  }

  /**
   * 获取分类
   */
  getCategory(id: string): TemplateCategory | undefined {
    return this.categories.get(id)
  }

  // === 模板实例化 ===

  /**
   * 实例化节点模板
   */
  instantiateTemplate(
    template: NodeTemplate, 
    config: TemplateInstantiationConfig
  ): BpmnElement {
    // 增加使用次数
    template.metadata.usageCount++
    this.templates.set(template.id, template)

    // 创建BPMN元素配置
    const elementConfig = {
      id: this.generateId('element'),
      type: template.nodeType,
      businessObject: this.createBusinessObject(template, config),
      ...config.position && { 
        x: config.position.x, 
        y: config.position.y 
      }
    }

    console.log('模板实例化成功:', template.name, elementConfig)
    return elementConfig as BpmnElement
  }

  /**
   * 将模板应用到现有元素
   */
  applyTemplateToElement(element: BpmnElement, template: NodeTemplate): void {
    // 更新元素属性
    const businessObject = element.businessObject
    
    // 应用模板的默认属性
    Object.entries(template.properties).forEach(([key, value]) => {
      if (businessObject[key] === undefined) {
        businessObject[key] = value
      }
    })

    // 应用模板的默认值
    Object.entries(template.templateConfig.defaultValues).forEach(([key, value]) => {
      if (businessObject[key] === undefined) {
        businessObject[key] = value
      }
    })

    // 记录模板关联信息
    if (!businessObject.template) {
      businessObject.template = {}
    }
    businessObject.template.id = template.id
    businessObject.template.version = template.metadata.version
    businessObject.template.inherited = true

    console.log('模板应用成功:', template.name, '到元素:', element.id)
  }

  // === 私有方法 ===

  /**
   * 注册模板的DynamicForm配置到PropertyExtensionManager
   */
  private registerDynamicFormConfig(template: NodeTemplate): void {
    try {
      // 检查模板是否有DynamicForm配置
      const dynamicFormConfig = template.properties?.dynamicFormConfig
      if (!dynamicFormConfig) {
        return // 没有DynamicForm配置，跳过
      }
      
      console.log('注册DynamicForm配置:', template.name, template.nodeType)
      
      // 动态导入PropertyExtensionManager并注册配置
      import('@/utils/property-extension-manager').then(({ propertyExtensionManager }) => {
        // 将DynamicForm配置转换为PropertyExtensionManager格式
        const propertyGroups = []
        
        for (const section of dynamicFormConfig.sections) {
          const properties = []
          
          for (const field of section.fields) {
            properties.push({
              name: field.key,
              label: field.label,
              type: this.convertFieldTypeToPropertyType(field.type),
              required: field.required || false,
              description: field.description,
              validation: field.validation,
              options: field.options
            })
          }
          
          propertyGroups.push({
            name: `${template.name} - ${section.title}`, // 添加模板名称前缀，避免冲突
            properties: properties
          })
        }
        
        // 检查是否已有该nodeType的schema
        const existingSchema = propertyExtensionManager.getSchema(template.nodeType)
        
        if (existingSchema) {
          // 合并到现有schema，而不是覆盖
          const mergedGroups = [...existingSchema.groups, ...propertyGroups]
          propertyExtensionManager.registerSchema({
            elementType: template.nodeType,
            groups: mergedGroups,
            extensions: existingSchema.extensions || []
          })
          console.log('DynamicForm配置合并到现有schema:', template.nodeType, template.name)
        } else {
          // 注册新的schema
          propertyExtensionManager.registerSchema({
            elementType: template.nodeType,
            groups: propertyGroups,
            extensions: []
          })
          console.log('DynamicForm配置注册为新schema:', template.nodeType, template.name)
        }
        
        console.log('DynamicForm配置注册成功:', template.nodeType, '模板:', template.name, '包含字段:', propertyGroups)
      }).catch(error => {
        console.error('注册DynamicForm配置失败:', error)
      })
      
    } catch (error) {
      console.error('注册DynamicForm配置失败:', error)
    }
  }
  
  /**
   * 转换字段类型到属性类型
   */
  private convertFieldTypeToPropertyType(fieldType: string): string {
    const typeMapping: Record<string, string> = {
      'text': 'string',
      'textarea': 'string', 
      'select': 'enum',
      'checkbox': 'boolean',
      'number': 'number',
      'date': 'string',
      'file': 'string'
    }
    
    return typeMapping[fieldType] || 'string'
  }

  /**
   * 生成唯一ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 版本号递增
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.')
    const patch = parseInt(parts[2] || '0') + 1
    return `${parts[0]}.${parts[1]}.${patch}`
  }

  /**
   * 排序模板
   */
  private sortTemplates(
    templates: NodeTemplate[], 
    sortBy: string, 
    order: 'asc' | 'desc'
  ): NodeTemplate[] {
    return templates.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'usage':
          comparison = a.metadata.usageCount - b.metadata.usageCount
          break
        case 'date':
          comparison = a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime()
          break
        default:
          comparison = a.name.localeCompare(b.name)
      }
      
      return order === 'desc' ? -comparison : comparison
    })
  }

  /**
   * 创建业务对象
   */
  private createBusinessObject(
    template: NodeTemplate, 
    config: TemplateInstantiationConfig
  ): any {
    const businessObject: any = {
      $type: template.nodeType,
      id: this.generateId('bo'),
      name: template.name
    }

    // 应用模板属性
    Object.entries(template.properties).forEach(([key, value]) => {
      businessObject[key] = value
    })

    // 应用自定义属性
    if (config.customProperties) {
      Object.entries(config.customProperties).forEach(([key, value]) => {
        businessObject[key] = value
      })
    }

    // 添加模板关联信息
    businessObject.template = {
      id: template.id,
      version: template.metadata.version,
      inherited: true
    }

    return businessObject
  }

  /**
   * 从本地存储加载数据
   */
  private loadFromStorage(): void {
    try {
      // 加载模板
      const templatesData = localStorage.getItem(this.storageKey)
      if (templatesData) {
        const templates = JSON.parse(templatesData) as NodeTemplate[]
        templates.forEach(template => {
          // 恢复日期对象
          template.metadata.createdAt = new Date(template.metadata.createdAt)
          template.metadata.updatedAt = new Date(template.metadata.updatedAt)
          this.templates.set(template.id, template)
        })
        console.log('从存储加载模板数量:', templates.length)
      }

      // 加载分类
      const categoriesData = localStorage.getItem(this.categoriesKey)
      if (categoriesData) {
        const categories = JSON.parse(categoriesData) as TemplateCategory[]
        categories.forEach(category => {
          this.categories.set(category.id, category)
        })
        console.log('从存储加载分类数量:', categories.length)
      }
    } catch (error) {
      console.error('从存储加载模板失败:', error)
    }
  }

  /**
   * 保存数据到本地存储
   */
  private async saveToStorage(): Promise<void> {
    try {
      // 保存模板
      const templates = Array.from(this.templates.values())
      localStorage.setItem(this.storageKey, JSON.stringify(templates))

      // 保存分类
      const categories = Array.from(this.categories.values())
      localStorage.setItem(this.categoriesKey, JSON.stringify(categories))
      
      console.log('保存到存储成功')
    } catch (error) {
      console.error('保存到存储失败:', error)
    }
  }

  /**
   * 初始化默认模板
   */
  private async initializeDefaultTemplates(): Promise<void> {
    // 检查是否需要初始化模板
    const needsInitialization = this.templates.size === 0 || this.needsTemplateUpdate()
    
    if (needsInitialization) {
      console.log('需要初始化/更新模板库...')
      
      // 创建默认分类
      await this.createCategory({
        name: '基础任务',
        description: '基础的BPMN任务节点',
        icon: 'fas fa-tasks',
        sortOrder: 1,
        config: {
          allowCustomNodes: true,
          sortOrder: 'name'
        }
      })

      await this.createCategory({
        name: '网关',
        description: 'BPMN网关节点',
        icon: 'fas fa-random',
        sortOrder: 2,
        config: {
          allowCustomNodes: true,
          sortOrder: 'name'
        }
      })

      await this.createCategory({
        name: '事件',
        description: 'BPMN事件节点',
        icon: 'fas fa-play-circle',
        sortOrder: 3,
        config: {
          allowCustomNodes: true,
          sortOrder: 'name'
        }
      })

      await this.createCategory({
        name: '连接',
        description: 'BPMN连接对象',
        icon: 'fas fa-arrows-alt-h',
        sortOrder: 4,
        config: {
          allowCustomNodes: true,
          sortOrder: 'name'
        }
      })

      // 创建默认模板
      await this.createDefaultTemplates()
    }
  }

  /**
   * 创建默认模板
   */
  private async createDefaultTemplates(): Promise<void> {
    const basicTaskCategory = Array.from(this.categories.values())
      .find(c => c.name === '基础任务')?.id || 'basic-tasks'

    const gatewayCategory = Array.from(this.categories.values())
      .find(c => c.name === '网关')?.id || 'gateways'

    const eventCategory = Array.from(this.categories.values())
      .find(c => c.name === '事件')?.id || 'events'

    const connectionCategory = Array.from(this.categories.values())
      .find(c => c.name === '连接')?.id || 'connections'

    // 加载完整的事件模板包 (25个)
    await this.loadEventTemplates(eventCategory)

    // 加载完整的任务模板包 (15个)
    await this.loadTaskTemplates(basicTaskCategory)

    // 加载完整的网关模板包 (12个)
    await this.loadGatewayTemplates(gatewayCategory)

    // 加载完整的连接模板包 (8个)
    await this.loadConnectionTemplates(connectionCategory)

    // === 任务节点模板 ===
    // 注意: 任务模板现在通过 loadTaskTemplates() 方法从任务模板包加载
    // 任务模板包包含15个完整的BPMN 2.0任务模板，支持DynamicForm自定义属性

    // === 事件节点模板 ===
    // 注意: 事件模板现在通过 loadEventTemplates() 方法从事件模板包加载
    // 事件模板包包含25个完整的BPMN 2.0事件模板，支持DynamicForm自定义属性

    // === 网关节点模板 ===
    // 注意: 网关模板现在通过 loadGatewayTemplates() 方法从网关模板包加载
    // 网关模板包包含12个完整的BPMN 2.0网关模板，支持DynamicForm自定义属性

    // === 连接对象模板 ===
    // 注意: 连接模板现在通过 loadConnectionTemplates() 方法从连接模板包加载
    // 连接模板包包含8个完整的BPMN 2.0连接模板，支持DynamicForm自定义属性

    console.log('完整的默认模板库创建完成 - 已加载任务模板(15个) + 事件模板(25个) + 网关模板(12个) + 连接模板(8个) = 共60个BPMN模板')
  }

  /**
   * 从任务模板包加载15个任务模板
   */
  private async loadTaskTemplates(taskCategory: string): Promise<void> {
    try {
      // 先清除现有的任务模板，避免重复和冲突
      console.log('清除现有任务模板...')
      const existingTaskTemplates = Array.from(this.templates.values())
        .filter(t => t.category === taskCategory)
      
      for (const template of existingTaskTemplates) {
        this.templates.delete(template.id)
        console.log('已删除现有模板:', template.name)
      }
      
      // 动态导入任务模板包
      const { getAllTaskTemplates } = await import('@/utils/template-packages/task-templates')
      
      // 获取所有任务模板配置
      const taskTemplateConfigs = getAllTaskTemplates(taskCategory)
      
      console.log('开始加载任务模板包...', taskTemplateConfigs.length, '个模板')
      
      // 逐个创建模板
      for (const templateConfig of taskTemplateConfigs) {
        await this.createTemplate(templateConfig)
      }
      
      console.log('任务模板包加载完成 - 已创建', taskTemplateConfigs.length, '个任务模板')
      
    } catch (error) {
      console.error('加载任务模板包失败:', error)
      
      // 回退到创建基础任务模板
      console.log('回退到创建基础任务模板...')
      await this.createBasicTaskTemplates(taskCategory)
    }
  }

  /**
   * 从网关模板包加载12个网关模板
   */
  private async loadGatewayTemplates(gatewayCategory: string): Promise<void> {
    try {
      // 先清除现有的网关模板，避免重复和冲突
      console.log('清除现有网关模板...')
      const existingGatewayTemplates = Array.from(this.templates.values())
        .filter(t => t.category === gatewayCategory)
      
      for (const template of existingGatewayTemplates) {
        this.templates.delete(template.id)
        console.log('已删除现有模板:', template.name)
      }
      
      // 动态导入网关模板包
      const { getAllGatewayTemplates } = await import('@/utils/template-packages/gateway-templates')
      
      // 获取所有网关模板配置
      const gatewayTemplateConfigs = getAllGatewayTemplates(gatewayCategory)
      
      console.log('开始加载网关模板包...', gatewayTemplateConfigs.length, '个模板')
      
      // 逐个创建模板
      for (const templateConfig of gatewayTemplateConfigs) {
        await this.createTemplate(templateConfig)
      }
      
      console.log('网关模板包加载完成 - 已创建', gatewayTemplateConfigs.length, '个网关模板')
      
    } catch (error) {
      console.error('加载网关模板包失败:', error)
      
      // 回退到创建基础网关模板
      console.log('回退到创建基础网关模板...')
      await this.createBasicGatewayTemplates(gatewayCategory)
    }
  }

  /**
   * 从连接模板包加载8个连接模板
   */
  private async loadConnectionTemplates(connectionCategory: string): Promise<void> {
    try {
      // 先清除现有的连接模板，避免重复和冲突
      console.log('清除现有连接模板...')
      const existingConnectionTemplates = Array.from(this.templates.values())
        .filter(t => t.category === connectionCategory)
      
      for (const template of existingConnectionTemplates) {
        this.templates.delete(template.id)
        console.log('已删除现有模板:', template.name)
      }
      
      // 动态导入连接模板包
      const { getAllConnectionTemplates } = await import('@/utils/template-packages/connection-templates')
      
      // 获取所有连接模板配置
      const connectionTemplateConfigs = getAllConnectionTemplates(connectionCategory)
      
      console.log('开始加载连接模板包...', connectionTemplateConfigs.length, '个模板')
      
      // 逐个创建模板
      for (const templateConfig of connectionTemplateConfigs) {
        await this.createTemplate(templateConfig)
      }
      
      console.log('连接模板包加载完成 - 已创建', connectionTemplateConfigs.length, '个连接模板')
      
    } catch (error) {
      console.error('加载连接模板包失败:', error)
      
      // 回退到创建基础连接模板
      console.log('回退到创建基础连接模板...')
      await this.createBasicConnectionTemplates(connectionCategory)
    }
  }

  /**
   * 从事件模板包加载25个事件模板
   */
  private async loadEventTemplates(eventCategory: string): Promise<void> {
    try {
      // 先清除现有的事件模板，避免重复和冲突
      console.log('清除现有事件模板...')
      const existingEventTemplates = Array.from(this.templates.values())
        .filter(t => t.category === eventCategory)
      
      for (const template of existingEventTemplates) {
        this.templates.delete(template.id)
        console.log('已删除现有模板:', template.name)
      }
      
      // 动态导入事件模板包
      const { getAllEventTemplates } = await import('@/utils/template-packages/event-templates')
      
      // 获取所有事件模板配置
      const eventTemplateConfigs = getAllEventTemplates(eventCategory)
      
      console.log('开始加载事件模板包...', eventTemplateConfigs.length, '个模板')
      
      // 逐个创建模板
      for (const templateConfig of eventTemplateConfigs) {
        await this.createTemplate(templateConfig)
      }
      
      console.log('事件模板包加载完成 - 已创建', eventTemplateConfigs.length, '个事件模板')
      
    } catch (error) {
      console.error('加载事件模板包失败:', error)
      
      // 回退到创建基础事件模板
      console.log('回退到创建基础事件模板...')
      await this.createBasicEventTemplates(eventCategory)
    }
  }
  
  /**
   * 创建基础事件模板 (回退方案)
   */
  private async createBasicEventTemplates(eventCategory: string): Promise<void> {
    // 空开始事件
    await this.createTemplate({
      name: '空开始事件',
      description: '没有触发条件的开始事件',
      category: eventCategory,
      icon: 'fas fa-play',
      nodeType: 'bpmn:StartEvent',
      properties: {},
      uiConfig: {
        shape: 'circle',
        size: { width: 36, height: 36 },
        colors: {
          fill: '#e8f5e8',
          stroke: '#4caf50',
          text: '#2e7d32'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '开始事件'
        }
      },
      preview: {
        thumbnail: 'start-event-thumb.svg',
        description: '流程的开始点',
        examples: ['手动启动流程', '简单开始', '无条件触发']
      }
    })

    // 空结束事件
    await this.createTemplate({
      name: '空结束事件',
      description: '正常结束流程的事件',
      category: eventCategory,
      icon: 'fas fa-stop',
      nodeType: 'bpmn:EndEvent',
      properties: {},
      uiConfig: {
        shape: 'circle',
        size: { width: 36, height: 36 },
        colors: {
          fill: '#ffebee',
          stroke: '#f44336',
          text: '#c62828'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '结束事件'
        }
      },
      preview: {
        thumbnail: 'end-event-thumb.svg',
        description: '流程的结束点',
        examples: ['正常结束', '流程完成', '任务完毕']
      }
    })

    console.log('基础事件模板创建完成')
  }

  /**
   * 创建基础任务模板 (回退方案)
   */
  private async createBasicTaskTemplates(taskCategory: string): Promise<void> {
    // 用户任务
    await this.createTemplate({
      name: '用户任务',
      description: '需要人工处理的任务',
      category: taskCategory,
      icon: 'fas fa-user',
      nodeType: 'bpmn:UserTask',
      properties: {
        assignee: '',
        candidateUsers: '',
        candidateGroups: '',
        formKey: ''
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#e1f5fe',
          stroke: '#0277bd',
          text: '#01579b'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '用户任务'
        }
      },
      preview: {
        thumbnail: 'user-task-thumb.svg',
        description: '标准的用户任务，用于需要人工干预的流程节点',
        examples: ['审批任务', '填写表单', '人工检查']
      }
    })

    // 服务任务
    await this.createTemplate({
      name: '服务任务',
      description: '自动执行的服务调用',
      category: taskCategory,
      icon: 'fas fa-cog',
      nodeType: 'bpmn:ServiceTask',
      properties: {
        implementation: 'webService',
        operationRef: ''
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#f3e5f5',
          stroke: '#7b1fa2',
          text: '#4a148c'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '服务任务'
        }
      },
      preview: {
        thumbnail: 'service-task-thumb.svg',
        description: '自动化的服务任务，用于调用外部服务或执行业务逻辑',
        examples: ['API调用', '数据处理', '发送邮件']
      }
    })

    console.log('基础任务模板创建完成')
  }

  /**
   * 创建基础网关模板 (回退方案)
   */
  private async createBasicGatewayTemplates(gatewayCategory: string): Promise<void> {
    // 排他网关
    await this.createTemplate({
      name: '排他网关',
      description: '基于条件的分支选择',
      category: gatewayCategory,
      icon: 'fas fa-times',
      nodeType: 'bpmn:ExclusiveGateway',
      properties: {
        gatewayDirection: 'Diverging'
      },
      uiConfig: {
        shape: 'diamond',
        size: { width: 50, height: 50 },
        colors: {
          fill: '#fff3e0',
          stroke: '#f57c00',
          text: '#e65100'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '排他网关'
        }
      },
      preview: {
        thumbnail: 'exclusive-gateway-thumb.svg',
        description: '排他网关，根据条件选择其中一个分支继续执行',
        examples: ['条件判断', '分支选择', '路由决策']
      }
    })

    // 并行网关
    await this.createTemplate({
      name: '并行网关',
      description: '并行执行多个分支',
      category: gatewayCategory,
      icon: 'fas fa-plus',
      nodeType: 'bpmn:ParallelGateway',
      properties: {
        gatewayDirection: 'Diverging'
      },
      uiConfig: {
        shape: 'diamond',
        size: { width: 50, height: 50 },
        colors: {
          fill: '#e8f5e8',
          stroke: '#4caf50',
          text: '#2e7d32'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '并行网关'
        }
      },
      preview: {
        thumbnail: 'parallel-gateway-thumb.svg',
        description: '并行网关，同时启动所有分支执行',
        examples: ['并行处理', '多任务执行', '分发处理']
      }
    })

    console.log('基础网关模板创建完成')
  }

  /**
   * 创建基础连接模板 (回退方案)
   */
  private async createBasicConnectionTemplates(connectionCategory: string): Promise<void> {
    // 标准流程线
    await this.createTemplate({
      name: '标准流程线',
      description: '标准的流程连接线',
      category: connectionCategory,
      icon: 'fas fa-arrow-right',
      nodeType: 'bpmn:SequenceFlow',
      properties: {
        name: '',
        conditionExpression: ''
      },
      uiConfig: {
        shape: 'edge',
        size: { width: 0, height: 0 },
        colors: {
          stroke: '#666666',
          fill: 'none',
          text: '#333333'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '流程线'
        }
      },
      preview: {
        thumbnail: 'sequence-flow-thumb.svg',
        description: '标准的流程连接线，用于连接BPMN元素',
        examples: ['正常流程', '顺序执行', '标准连接']
      }
    })

    // 条件流程线
    await this.createTemplate({
      name: '条件流程线',
      description: '带条件判断的流程连接线',
      category: connectionCategory,
      icon: 'fas fa-question-circle',
      nodeType: 'bpmn:SequenceFlow',
      properties: {
        name: '',
        conditionExpression: '',
        conditionLanguage: 'javascript'
      },
      uiConfig: {
        shape: 'edge',
        size: { width: 0, height: 0 },
        colors: {
          stroke: '#ff9800',
          fill: 'none',
          text: '#f57c00'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '条件流程线'
        }
      },
      preview: {
        thumbnail: 'conditional-flow-thumb.svg',
        description: '带条件判断的流程连接线，根据条件决定是否执行',
        examples: ['条件分支', '判断流程', '逻辑控制']
      }
    })

    console.log('基础连接模板创建完成')
  }

  /**
   * 强制重新加载任务模板包 (调试用)
   */
  async forceReloadTaskTemplates(): Promise<void> {
    console.log('强制重新加载任务模板包...')
    
    try {
      const taskCategory = Array.from(this.categories.values())
        .find(c => c.name === '基础任务')?.id || 'basic-tasks'
      
      await this.loadTaskTemplates(taskCategory)
      await this.saveToStorage()
      
      console.log('任务模板包强制重新加载完成')
    } catch (error) {
      console.error('强制重新加载任务模板包失败:', error)
      throw error
    }
  }
  
  /**
   * 检查是否需要更新模板库（事件、任务、网关、连接模板）
   */
  private needsTemplateUpdate(): boolean {
    try {
      // 检查所有分类的模板数量
      const eventCategory = Array.from(this.categories.values())
        .find(c => c.name === '事件')
      
      const taskCategory = Array.from(this.categories.values())
        .find(c => c.name === '基础任务')

      const gatewayCategory = Array.from(this.categories.values())
        .find(c => c.name === '网关')

      const connectionCategory = Array.from(this.categories.values())
        .find(c => c.name === '连接')
        
      if (!eventCategory || !taskCategory || !gatewayCategory || !connectionCategory) {
        console.log('分类不存在，需要初始化')
        return true
      }
      
      // 统计各类模板数量
      const eventTemplates = Array.from(this.templates.values())
        .filter(t => t.category === eventCategory.id)
      
      const taskTemplates = Array.from(this.templates.values())
        .filter(t => t.category === taskCategory.id)

      const gatewayTemplates = Array.from(this.templates.values())
        .filter(t => t.category === gatewayCategory.id)

      const connectionTemplates = Array.from(this.templates.values())
        .filter(t => t.category === connectionCategory.id)
      
      console.log('当前事件模板数量:', eventTemplates.length)
      console.log('当前任务模板数量:', taskTemplates.length)
      console.log('当前网关模板数量:', gatewayTemplates.length)
      console.log('当前连接模板数量:', connectionTemplates.length)
      
      // 检查事件模板 - 如果少于25个，需要更新
      if (eventTemplates.length < 25) {
        console.log('事件模板数量不足，需要加载事件模板包')
        return true
      }
      
      // 检查任务模板 - 如果少于15个，需要更新
      if (taskTemplates.length < 15) {
        console.log('任务模板数量不足，需要加载任务模板包')
        return true
      }

      // 检查网关模板 - 如果少于12个，需要更新
      if (gatewayTemplates.length < 12) {
        console.log('网关模板数量不足，需要加载网关模板包')
        return true
      }

      // 检查连接模板 - 如果少于8个，需要更新
      if (connectionTemplates.length < 8) {
        console.log('连接模板数量不足，需要加载连接模板包')
        return true
      }
      
      // 检查是否有新的模板类型
      const hasMessageStartEvent = eventTemplates.some(t => t.name === '消息开始事件')
      const hasApprovalTask = taskTemplates.some(t => t.name === '审批任务')
      const hasDataDrivenGateway = gatewayTemplates.some(t => t.name === '数据驱动网关')
      const hasAsyncFlow = connectionTemplates.some(t => t.name === '异步流程线')
      
      if (!hasMessageStartEvent) {
        console.log('缺少新的事件模板类型，需要更新')
        return true
      }
      
      if (!hasApprovalTask) {
        console.log('缺少新的任务模板类型，需要更新')
        return true
      }

      if (!hasDataDrivenGateway) {
        console.log('缺少新的网关模板类型，需要更新')
        return true
      }

      if (!hasAsyncFlow) {
        console.log('缺少新的连接模板类型，需要更新')
        return true
      }
      
      // 检查任务模板是否有DynamicForm配置 (新功能标识)
      const serviceTask = taskTemplates.find(t => t.name === '服务任务')
      if (serviceTask) {
        if (!serviceTask.properties?.dynamicFormConfig) {
          console.log('任务模板缺少DynamicForm配置，需要更新到增强版本')
          return true
        }
        
        // 进一步检查DynamicForm配置是否包含HTTP方法选项
        const dynamicForm = serviceTask.properties.dynamicFormConfig
        if (dynamicForm && dynamicForm.sections && dynamicForm.sections.length > 0) {
          const httpMethodField = dynamicForm.sections[0].fields?.find(field => field.key === 'method')
          if (!httpMethodField || !httpMethodField.options?.includes('GET')) {
            console.log('任务模板DynamicForm配置不完整，缺少HTTP方法选项')
            return true
          }
        } else {
          console.log('任务模板DynamicForm配置结构不完整')
          return true
        }
      } else {
        console.log('未找到服务任务模板，需要加载任务模板包')
        return true
      }
      
      // 临时强制更新所有模板以确保Phase 5.2.3新功能生效
      console.log('强制更新所有模板包以确保Phase 5.2.3网关和连接对象功能生效')
      return true
      
    } catch (error) {
      console.error('检查模板更新状态失败:', error)
      return true // 出错时默认更新
    }
  }
}

// 导出单例实例
export const templateManager = new TemplateManager()