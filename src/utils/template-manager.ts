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

    // 用户任务模板
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

    // 服务任务模板
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

    // 排他网关模板
    await this.createTemplate({
      name: '排他网关',
      description: '基于条件的分支选择',
      category: gatewayCategory,
      icon: 'fas fa-diamond',
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

    console.log('默认模板创建完成')
  }
}

// 导出单例实例
export const templateManager = new TemplateManager()