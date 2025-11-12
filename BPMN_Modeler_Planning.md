# 基于BPMN.js的Vue3流程建模器规划方案

## 1. 总体架构设计

### 1.1 技术栈选择
```
前端框架: Vue 3.4+ (Composition API)
UI组件库: Element Plus / Ant Design Vue
BPMN引擎: bpmn-js 17.x
状态管理: Pinia
路由管理: Vue Router 4.x
构建工具: Vite 5.x
类型检查: TypeScript
样式处理: SCSS/Less
```

### 1.2 整体架构分层
```
┌─────────────────────────────────────┐
│           用户界面层 (UI Layer)        │
├─────────────────────────────────────┤
│         业务逻辑层 (Business Layer)    │
├─────────────────────────────────────┤
│        BPMN适配层 (Adapter Layer)     │
├─────────────────────────────────────┤
│         数据管理层 (Data Layer)        │
├─────────────────────────────────────┤
│         工具服务层 (Utils Layer)       │
└─────────────────────────────────────┘
```

### 1.3 核心模块划分
- **建模器核心 (Modeler Core)**: BPMN.js集成和扩展
- **节点管理 (Node Management)**: 自定义节点和属性
- **UI组件 (UI Components)**: 统一的界面组件
- **模板系统 (Template System)**: 节点复用和流程模板
- **附件管理 (Attachment System)**: 文件和资源管理
- **配置管理 (Configuration)**: 系统设置和用户偏好

## 2. 统一UI封装策略

### 2.1 基础节点UI统一封装方案

#### 2.1.1 节点外观标准化
```typescript
interface NodeUIConfig {
  // 基础样式配置
  shape: 'rectangle' | 'circle' | 'diamond' | 'gateway'
  size: { width: number, height: number }
  colors: {
    fill: string
    stroke: string
    text: string
  }
  // 图标配置
  icon: {
    type: 'svg' | 'font' | 'image'
    content: string
    position: 'center' | 'top-left' | 'top-right'
  }
  // 文本配置
  label: {
    position: 'center' | 'bottom' | 'right'
    maxLength: number
    fontSize: number
  }
}
```

#### 2.1.2 Vue组件封装结构
```
src/components/bpmn-nodes/
├── BaseNode.vue              # 基础节点组件
├── TaskNode.vue              # 任务节点
├── GatewayNode.vue           # 网关节点
├── EventNode.vue             # 事件节点
├── SubProcessNode.vue        # 子流程节点
└── CustomNode.vue            # 自定义节点
```

#### 2.1.3 节点渲染器架构
```typescript
class NodeRenderer {
  // 注册自定义渲染器
  registerRenderer(type: string, renderer: CustomRenderer): void
  
  // 统一渲染入口
  render(element: BpmnElement, context: RenderContext): SVGElement
  
  // 样式应用
  applyStyles(element: SVGElement, config: NodeUIConfig): void
  
  // 图标渲染
  renderIcon(element: SVGElement, iconConfig: IconConfig): void
}
```

### 2.2 属性面板统一设计

#### 2.2.1 属性面板组件结构
```
src/components/properties/
├── PropertyPanel.vue         # 属性面板容器
├── BaseProperty.vue          # 基础属性组件
├── CustomProperty.vue        # 自定义属性组件
├── AttachmentProperty.vue    # 附件属性组件
└── TemplateProperty.vue      # 模板属性组件
```

#### 2.2.2 属性表单配置
```typescript
interface PropertyFormConfig {
  sections: PropertySection[]
  validation: ValidationRules
  layout: 'tabs' | 'accordion' | 'stack'
}

interface PropertySection {
  id: string
  title: string
  icon?: string
  fields: PropertyField[]
  collapsible: boolean
}

interface PropertyField {
  key: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'file' | 'custom'
  label: string
  required: boolean
  validation?: FieldValidation
  options?: SelectOption[]
  component?: string  // 自定义组件名称
}
```

## 3. 自定义节点属性系统架构

### 3.1 属性数据模型
```typescript
interface NodeProperties {
  // 基础属性
  id: string
  name: string
  type: string
  
  // 扩展属性
  customProperties: Record<string, any>
  
  // 业务属性
  businessData: {
    category: string
    priority: 'high' | 'medium' | 'low'
    assignee?: string
    deadline?: Date
    estimatedTime?: number
  }
  
  // UI属性
  appearance: NodeUIConfig
  
  // 附件属性
  attachments: Attachment[]
  
  // 模板属性
  template?: {
    id: string
    version: string
    inherited: boolean
  }
}
```

### 3.2 属性扩展机制
```typescript
class PropertyExtensionManager {
  // 注册属性扩展
  registerExtension(nodeType: string, extension: PropertyExtension): void
  
  // 获取节点的所有属性定义
  getPropertyDefinitions(nodeType: string): PropertyDefinition[]
  
  // 验证属性值
  validateProperties(nodeType: string, properties: any): ValidationResult
  
  // 属性值转换
  transformProperties(from: string, to: string, properties: any): any
}

interface PropertyExtension {
  properties: PropertyDefinition[]
  validators: PropertyValidator[]
  transformers: PropertyTransformer[]
}
```

### 3.3 属性持久化策略
```typescript
interface PropertyStorage {
  // 保存属性到BPMN XML
  saveToXML(element: BpmnElement, properties: NodeProperties): void
  
  // 从BPMN XML加载属性
  loadFromXML(element: BpmnElement): NodeProperties
  
  // 扩展属性命名空间
  namespace: string
  
  // 属性序列化
  serialize(properties: NodeProperties): string
  deserialize(data: string): NodeProperties
}
```

## 4. 节点复用和模板管理方案

### 4.1 节点模板系统设计

#### 4.1.1 模板数据结构
```typescript
interface NodeTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  
  // 模板基础信息
  metadata: {
    version: string
    author: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
    usageCount: number
  }
  
  // 节点配置
  nodeConfig: {
    type: string
    properties: NodeProperties
    appearance: NodeUIConfig
    defaultConnections?: ConnectionRule[]
  }
  
  // 预览信息
  preview: {
    thumbnail: string
    description: string
    examples: string[]
  }
}
```

#### 4.1.2 模板分类管理
```typescript
interface TemplateCategory {
  id: string
  name: string
  icon: string
  parentId?: string
  children?: TemplateCategory[]
  templates: NodeTemplate[]
  
  // 分类配置
  config: {
    allowCustomNodes: boolean
    defaultTemplate?: string
    sortOrder: 'name' | 'usage' | 'date'
  }
}
```

### 4.2 模板存储和版本管理
```typescript
class TemplateManager {
  // 模板CRUD操作
  createTemplate(template: NodeTemplate): Promise<string>
  updateTemplate(id: string, template: Partial<NodeTemplate>): Promise<void>
  deleteTemplate(id: string): Promise<void>
  getTemplate(id: string): Promise<NodeTemplate>
  
  // 模板查询和搜索
  searchTemplates(query: TemplateQuery): Promise<NodeTemplate[]>
  getTemplatesByCategory(categoryId: string): Promise<NodeTemplate[]>
  getPopularTemplates(limit: number): Promise<NodeTemplate[]>
  
  // 版本管理
  createVersion(templateId: string, changes: TemplateChanges): Promise<string>
  getVersionHistory(templateId: string): Promise<TemplateVersion[]>
  restoreVersion(templateId: string, versionId: string): Promise<void>
}
```

### 4.3 拖拽和实例化机制
```typescript
class TemplateDropHandler {
  // 处理模板拖拽
  onTemplateDrop(template: NodeTemplate, position: Point): void
  
  // 实例化节点
  instantiateNode(template: NodeTemplate): BpmnElement
  
  // 应用模板配置
  applyTemplate(element: BpmnElement, template: NodeTemplate): void
  
  // 更新实例关联
  updateInstanceBinding(elementId: string, templateId: string): void
}
```

## 5. 节点附件系统设计

### 5.1 附件数据模型
```typescript
interface Attachment {
  id: string
  name: string
  type: AttachmentType
  size: number
  mimeType: string
  
  // 存储信息
  storage: {
    provider: 'local' | 'cloud' | 'database'
    path: string
    url?: string
    checksum: string
  }
  
  // 元数据
  metadata: {
    uploadedAt: Date
    uploadedBy: string
    version: number
    description?: string
    tags: string[]
  }
  
  // 预览信息
  preview?: {
    thumbnail?: string
    content?: string  // 文本预览
    pages?: number    // 文档页数
  }
}

enum AttachmentType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  ARCHIVE = 'archive',
  CODE = 'code',
  DATA = 'data',
  OTHER = 'other'
}
```

### 5.2 附件管理器
```typescript
class AttachmentManager {
  // 附件上传
  uploadAttachment(file: File, nodeId: string): Promise<Attachment>
  
  // 附件下载
  downloadAttachment(attachmentId: string): Promise<Blob>
  
  // 附件预览
  generatePreview(attachment: Attachment): Promise<AttachmentPreview>
  
  // 附件关联管理
  linkAttachment(nodeId: string, attachmentId: string): Promise<void>
  unlinkAttachment(nodeId: string, attachmentId: string): Promise<void>
  getNodeAttachments(nodeId: string): Promise<Attachment[]>
  
  // 附件版本管理
  createVersion(attachmentId: string, file: File): Promise<string>
  getVersionHistory(attachmentId: string): Promise<AttachmentVersion[]>
}
```

### 5.3 附件UI组件
```
src/components/attachments/
├── AttachmentPanel.vue       # 附件面板
├── AttachmentUpload.vue      # 文件上传组件
├── AttachmentList.vue        # 附件列表
├── AttachmentPreview.vue     # 附件预览
├── AttachmentEditor.vue      # 附件编辑器
└── AttachmentSelector.vue    # 附件选择器
```

## 6. 流程模板系统

### 6.1 流程模板数据结构
```typescript
interface ProcessTemplate {
  id: string
  name: string
  description: string
  category: string
  
  // 模板信息
  metadata: {
    version: string
    author: string
    organization: string
    createdAt: Date
    updatedAt: Date
    tags: string[]
    complexity: 'simple' | 'medium' | 'complex'
    industry: string[]
  }
  
  // 流程定义
  process: {
    bpmnXml: string
    variables: ProcessVariable[]
    participants: Participant[]
    documentation: string
  }
  
  // 节点模板引用
  nodeTemplates: {
    [elementId: string]: string  // 节点ID -> 模板ID映射
  }
  
  // 配置选项
  configuration: {
    customizable: boolean
    requiredInputs: string[]
    optionalInputs: string[]
    outputs: string[]
  }
}
```

### 6.2 模板实例化引擎
```typescript
class ProcessTemplateEngine {
  // 实例化流程模板
  instantiateTemplate(
    template: ProcessTemplate, 
    config: InstanceConfig
  ): Promise<ProcessInstance>
  
  // 自定义实例化
  customizeTemplate(
    template: ProcessTemplate, 
    customizations: TemplateCustomization[]
  ): ProcessTemplate
  
  // 验证模板完整性
  validateTemplate(template: ProcessTemplate): ValidationResult
  
  // 生成模板预览
  generatePreview(template: ProcessTemplate): TemplatePreview
}
```

## 7. 实施计划

### 阶段一：基础架构搭建 (2-3周) ✅ 已完成
- Vue3项目初始化和BPMN.js集成
- 基础组件架构设计
- 核心模块接口定义
- 开发环境和工具链配置

### 阶段二：节点UI统一封装 (2-3周) ✅ 已完成
- 基础节点渲染器实现
- Vue组件封装
- 样式系统设计
- 图标和主题支持

### 阶段三：属性系统开发 (3-4周) ✅ 已完成
- 属性数据模型实现
- 属性面板组件开发
- 扩展机制实现
- 验证和序列化功能

### 阶段四：模板和复用功能 (3-4周) ✅ 已完成
- 节点模板系统
- 模板管理界面
- 拖拽和实例化功能
- 版本控制实现

### 阶段五：节点系统大幅扩展 (6-8周) 🔄 进行中
#### 5.1 拖拽修复 (1周)
- 统一拖拽数据格式 (TemplatePanel + BpmnPalette)
- 完善SimpleBpmnModeler的drop处理逻辑
- 增强BpmnPalette的元素创建机制

#### 5.2 标准BPMN节点模板扩展 (3-4周)
- **事件模板**: 从4个扩展到25个 (开始、中间、结束事件全覆盖)
- **任务模板**: 从7个扩展到15个 (包含子流程、事务、调用活动)
- **网关模板**: 从4个扩展到6个 (添加复杂网关、并行事件网关)
- **连接和工件**: 新增8个 (消息流、关联、数据对象等)

#### 5.3 企业级扩展节点开发 (2-3周)
- **集成服务节点** 8个: REST API、数据库、文件、邮件等
- **决策智能节点** 6个: DMN决策、ML预测、规则引擎等
- **业务流程节点** 6个: 审批流、表单、电子签名等
- **系统监控节点** 5个: 性能监控、异常处理、日志等

#### 5.4 模板系统优化 (1-2周)
- 重构分类体系 (按BPMN标准+企业应用)
- 添加搜索过滤功能 (类型、功能、使用频率)
- 模板预览增强 (说明、示例、使用场景)

### 阶段六：附件系统 (2-3周) 📋 待开始
- 附件管理器实现
- 文件上传和预览
- 存储适配器
- 附件UI组件

### 阶段七：流程模板系统 (3-4周) 📋 待开始
- 流程模板引擎
- 模板实例化功能
- 配置和自定义界面
- 模板市场功能

### 阶段八：企业级节点生态 (3-4周) 📋 新增
#### 8.1 节点扩展框架
- BPMN 2.0扩展机制实现
- 自定义节点注册系统
- 扩展属性命名空间管理

#### 8.2 行业模板包
- 金融行业节点包 (风控、合规、审计)
- 制造业节点包 (质检、生产、物流)
- 电商节点包 (订单、支付、库存)
- HR流程节点包 (招聘、考核、培训)

#### 8.3 插件生态系统
- 节点模板市场
- 模板导入/导出功能
- 社区贡献机制

### 阶段九：集成测试和优化 (2-3周) 📋 待开始
- 端到端测试
- 性能优化
- 用户体验改进
- 文档和示例

## 8. 技术挑战和解决方案

### 8.1 BPMN.js扩展挑战
- **挑战**: 深度定制BPMN.js渲染和行为
- **解决方案**: 使用Provider模式和模块化扩展

### 8.2 Vue3集成挑战
- **挑战**: Vue组件与BPMN.js DOM操作的协调
- **解决方案**: 使用Teleport和自定义指令

### 8.3 性能优化挑战
- **挑战**: 大型流程图的渲染性能
- **解决方案**: 虚拟滚动、懒加载和增量渲染

### 8.4 数据同步挑战
- **挑战**: UI状态与BPMN模型的同步
- **解决方案**: 响应式数据绑定和事件总线

## 9. 项目状态总结

### 当前进度 (截至2025年11月)
- **完成阶段**: 阶段1-4 ✅ (基础架构、节点UI、属性系统、模板复用)
- **当前阶段**: 阶段5 🔄 (节点系统大幅扩展)
- **已解决问题**: 调色板隐藏、模板系统基础功能
- **待解决问题**: 元素库拖拽、节点模板数量不足

### 关键成果
1. **Vue3 + BPMN.js完整集成** - 稳定运行的建模器框架
2. **统一的节点属性系统** - 支持动态表单和扩展属性
3. **基础模板管理** - 13个核心模板和版本控制
4. **灵活的面板控制** - 模板、节点库、调色板、属性面板开关

### 下一步重点
1. **立即修复**: 元素库拖拽功能 (预计1周)
2. **重点扩展**: 标准BPMN节点模板到54个 (预计3-4周)
3. **企业增值**: 25个业务场景节点 (预计2-3周)
4. **用户体验**: 搜索、分类、预览优化 (预计1-2周)

### 技术债务管理
- **高优先级**: 拖拽数据格式统一
- **中优先级**: 模板加载性能优化
- **低优先级**: 代码重构和文档完善

这个规划为您提供了一个完整的技术路线图，可以根据具体需求调整实施顺序和重点。目前我们正处于项目的关键扩展阶段，即将从基础功能转向企业级应用支持。