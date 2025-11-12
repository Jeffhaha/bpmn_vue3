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
    if (this.templates.size === 0) {
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

    // === 任务节点模板 ===
    
    // 用户任务
    await this.createTemplate({
      name: '用户任务',
      description: '需要人工处理的任务',
      category: basicTaskCategory,
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
      category: basicTaskCategory,
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

    // 脚本任务
    await this.createTemplate({
      name: '脚本任务',
      description: '执行脚本代码的任务',
      category: basicTaskCategory,
      icon: 'fas fa-code',
      nodeType: 'bpmn:ScriptTask',
      properties: {
        scriptFormat: 'javascript',
        script: ''
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
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
          name: '脚本任务'
        }
      },
      preview: {
        thumbnail: 'script-task-thumb.svg',
        description: '执行内联脚本的任务节点',
        examples: ['数据转换', '业务逻辑', '计算处理']
      }
    })

    // 业务规则任务
    await this.createTemplate({
      name: '业务规则任务',
      description: '执行业务规则引擎',
      category: basicTaskCategory,
      icon: 'fas fa-gavel',
      nodeType: 'bpmn:BusinessRuleTask',
      properties: {
        implementation: 'dmn',
        decisionRef: ''
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#fff3e0',
          stroke: '#ff9800',
          text: '#e65100'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '业务规则任务'
        }
      },
      preview: {
        thumbnail: 'business-rule-task-thumb.svg',
        description: '基于规则引擎的决策任务',
        examples: ['风控检查', '规则判断', 'DMN决策']
      }
    })

    // 发送任务
    await this.createTemplate({
      name: '发送任务',
      description: '发送消息或邮件',
      category: basicTaskCategory,
      icon: 'fas fa-paper-plane',
      nodeType: 'bpmn:SendTask',
      properties: {
        messageRef: '',
        implementation: 'webService'
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#fce4ec',
          stroke: '#e91e63',
          text: '#ad1457'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '发送任务'
        }
      },
      preview: {
        thumbnail: 'send-task-thumb.svg',
        description: '发送消息、邮件或通知的任务',
        examples: ['发送邮件', '短信通知', '系统消息']
      }
    })

    // 接收任务
    await this.createTemplate({
      name: '接收任务',
      description: '等待接收消息',
      category: basicTaskCategory,
      icon: 'fas fa-inbox',
      nodeType: 'bpmn:ReceiveTask',
      properties: {
        messageRef: '',
        instantiate: false
      },
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#e0f2f1',
          stroke: '#009688',
          text: '#00695c'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '接收任务'
        }
      },
      preview: {
        thumbnail: 'receive-task-thumb.svg',
        description: '等待接收外部消息的任务',
        examples: ['等待回复', '接收通知', '监听事件']
      }
    })

    // 手动任务
    await this.createTemplate({
      name: '手动任务',
      description: '人工执行的手动操作',
      category: basicTaskCategory,
      icon: 'fas fa-hand-paper',
      nodeType: 'bpmn:ManualTask',
      properties: {},
      uiConfig: {
        shape: 'rectangle',
        size: { width: 100, height: 80 },
        colors: {
          fill: '#f1f8e9',
          stroke: '#689f38',
          text: '#33691e'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '手动任务'
        }
      },
      preview: {
        thumbnail: 'manual-task-thumb.svg',
        description: '需要人工手动执行的操作任务',
        examples: ['线下操作', '手工处理', '物理操作']
      }
    })

    // === 事件节点模板 ===
    
    // 开始事件
    await this.createTemplate({
      name: '开始事件',
      description: '流程开始的触发事件',
      category: eventCategory,
      icon: 'fas fa-play-circle',
      nodeType: 'bpmn:StartEvent',
      properties: {
        isInterrupting: true
      },
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
          name: '开始'
        }
      },
      preview: {
        thumbnail: 'start-event-thumb.svg',
        description: '流程启动的起始事件',
        examples: ['流程开始', '触发启动', '接收请求']
      }
    })

    // 结束事件
    await this.createTemplate({
      name: '结束事件',
      description: '流程结束的终止事件',
      category: eventCategory,
      icon: 'fas fa-stop-circle',
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
          name: '结束'
        }
      },
      preview: {
        thumbnail: 'end-event-thumb.svg',
        description: '流程正常结束的终止事件',
        examples: ['流程完成', '正常结束', '任务完毕']
      }
    })

    // 中间捕获事件
    await this.createTemplate({
      name: '中间捕获事件',
      description: '等待特定事件发生',
      category: eventCategory,
      icon: 'fas fa-pause-circle',
      nodeType: 'bpmn:IntermediateCatchEvent',
      properties: {
        cancelActivity: true
      },
      uiConfig: {
        shape: 'circle',
        size: { width: 36, height: 36 },
        colors: {
          fill: '#fff3e0',
          stroke: '#ff9800',
          text: '#e65100'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '等待事件'
        }
      },
      preview: {
        thumbnail: 'intermediate-catch-event-thumb.svg',
        description: '等待外部事件或条件的中间事件',
        examples: ['等待定时器', '等待消息', '等待信号']
      }
    })

    // 中间抛出事件
    await this.createTemplate({
      name: '中间抛出事件',
      description: '主动触发事件',
      category: eventCategory,
      icon: 'fas fa-forward',
      nodeType: 'bpmn:IntermediateThrowEvent',
      properties: {},
      uiConfig: {
        shape: 'circle',
        size: { width: 36, height: 36 },
        colors: {
          fill: '#e3f2fd',
          stroke: '#2196f3',
          text: '#0d47a1'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '发送事件'
        }
      },
      preview: {
        thumbnail: 'intermediate-throw-event-thumb.svg',
        description: '主动发送信号或消息的中间事件',
        examples: ['发送信号', '触发通知', '发布消息']
      }
    })

    // === 网关节点模板 ===
    
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

    // 包容网关
    await this.createTemplate({
      name: '包容网关',
      description: '基于条件的多分支选择',
      category: gatewayCategory,
      icon: 'fas fa-circle',
      nodeType: 'bpmn:InclusiveGateway',
      properties: {
        gatewayDirection: 'Diverging'
      },
      uiConfig: {
        shape: 'diamond',
        size: { width: 50, height: 50 },
        colors: {
          fill: '#f3e5f5',
          stroke: '#9c27b0',
          text: '#6a1b9a'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '包容网关'
        }
      },
      preview: {
        thumbnail: 'inclusive-gateway-thumb.svg',
        description: '包容网关，可以同时选择多个符合条件的分支',
        examples: ['多条件判断', '并行分支', '灵活路由']
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

    // 事件网关
    await this.createTemplate({
      name: '事件网关',
      description: '基于事件的路径选择',
      category: gatewayCategory,
      icon: 'fas fa-star',
      nodeType: 'bpmn:EventBasedGateway',
      properties: {
        gatewayDirection: 'Diverging',
        instantiate: false
      },
      uiConfig: {
        shape: 'diamond',
        size: { width: 50, height: 50 },
        colors: {
          fill: '#fce4ec',
          stroke: '#e91e63',
          text: '#ad1457'
        }
      },
      templateConfig: {
        isDefault: true,
        isCustomizable: true,
        requiredFields: ['name'],
        defaultValues: {
          name: '事件网关'
        }
      },
      preview: {
        thumbnail: 'event-based-gateway-thumb.svg',
        description: '基于事件的网关，根据不同事件选择执行路径',
        examples: ['事件路由', '等待多事件', '事件驱动']
      }
    })

    console.log('完整的默认模板库创建完成 - 共13个标准BPMN模板')
  }
}

// 导出单例实例
export const templateManager = new TemplateManager()