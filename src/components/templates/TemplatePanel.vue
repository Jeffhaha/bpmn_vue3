<template>
  <div class="template-panel" :class="{ collapsed: isCollapsed }">
    <!-- 面板头部 -->
    <div class="panel-header">
      <div class="header-left">
        <h3>节点模板</h3>
        <span class="template-count">{{ totalTemplates }} 个模板</span>
      </div>
      <div class="header-actions">
        <button 
          class="action-btn" 
          @click="showCreateDialog = true"
          title="创建模板"
        >
          <i class="fas fa-plus"></i>
        </button>
        <button 
          class="action-btn" 
          @click="refreshTemplates"
          title="刷新"
        >
          <i class="fas fa-sync-alt"></i>
        </button>
        <button 
          class="collapse-btn" 
          @click="toggleCollapse"
          :title="isCollapsed ? '展开模板面板' : '收起模板面板'"
        >
          <i :class="isCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
        </button>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div v-if="!isCollapsed" class="search-section">
      <div class="search-input">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索模板..."
          @input="handleSearch"
        />
        <i class="fas fa-search search-icon"></i>
      </div>
      
      <div class="filter-options">
        <select v-model="selectedCategory" @change="handleCategoryChange">
          <option value="">所有分类</option>
          <option
            v-for="category in categories"
            :key="category.id"
            :value="category.id"
          >
            {{ category.name }}
          </option>
        </select>
        
        <select v-model="sortBy" @change="handleSortChange">
          <option value="name">按名称</option>
          <option value="usage">按使用量</option>
          <option value="date">按更新时间</option>
        </select>
      </div>
    </div>
    
    <!-- 模板分类列表 -->
    <div v-if="!isCollapsed" class="template-content">
      <div v-if="loading" class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i>
        <span>加载模板中...</span>
      </div>
      
      <div v-else-if="groupedTemplates.length === 0" class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>暂无模板</p>
        <button class="create-template-btn" @click="showCreateDialog = true">
          创建第一个模板
        </button>
      </div>
      
      <div v-else class="template-categories">
        <div
          v-for="group in groupedTemplates"
          :key="group.categoryId"
          class="category-group"
        >
          <!-- 分类头部 -->
          <div 
            class="category-header" 
            @click="toggleCategory(group.categoryId)"
            :class="{ collapsed: collapsedCategories[group.categoryId] }"
          >
            <div class="category-info">
              <i :class="group.icon || 'fas fa-folder'"></i>
              <span class="category-name">{{ group.categoryName }}</span>
              <span class="template-count">({{ group.templates.length }})</span>
            </div>
            <i class="fas fa-chevron-down toggle-icon"></i>
          </div>
          
          <!-- 模板列表 -->
          <div 
            v-if="!collapsedCategories[group.categoryId]" 
            class="template-list"
          >
            <TemplateItem
              v-for="template in group.templates"
              :key="template.id"
              :template="template"
              :draggable="true"
              @drag-start="handleTemplateDragStart"
              @click="handleTemplateClick"
              @edit="handleTemplateEdit"
              @delete="handleTemplateDelete"
              @duplicate="handleTemplateDuplicate"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建模板对话框 -->
    <TemplateCreateDialog
      :visible="showCreateDialog"
      :categories="categories"
      @close="showCreateDialog = false"
      @create="handleTemplateCreate"
    />
    
    <!-- 编辑模板对话框 -->
    <TemplateEditDialog
      :visible="showEditDialog"
      :template="editingTemplate"
      :categories="categories"
      @close="closeEditDialog"
      @save="handleTemplateSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { templateManager } from '@/utils/template-manager'
import TemplateItem from './TemplateItem.vue'
import TemplateCreateDialog from './TemplateCreateDialog.vue'
import TemplateEditDialog from './TemplateEditDialog.vue'
import type { NodeTemplate, TemplateCategory, TemplateQuery, UnifiedDragData } from '@/types'

// Props
interface Props {
  visible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true
})

// Emits
const emit = defineEmits<{
  'template-drag-start': [template: NodeTemplate, event: DragEvent]
  'template-selected': [template: NodeTemplate]
  'template-applied': [template: NodeTemplate]
}>()

// 状态
const isCollapsed = ref(false)
const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const sortBy = ref<'name' | 'usage' | 'date'>('name')

const templates = ref<NodeTemplate[]>([])
const categories = ref<TemplateCategory[]>([])
const collapsedCategories = ref<Record<string, boolean>>({})

// 对话框状态
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const editingTemplate = ref<NodeTemplate | null>(null)

// 计算属性
const totalTemplates = computed(() => templates.value.length)

const filteredTemplates = computed(() => {
  let result = templates.value

  // 按分类过滤
  if (selectedCategory.value) {
    result = result.filter(t => t.category === selectedCategory.value)
  }

  // 按搜索词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.metadata.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  return result
})

const groupedTemplates = computed(() => {
  const groups: Array<{
    categoryId: string
    categoryName: string
    icon: string
    templates: NodeTemplate[]
  }> = []

  // 按分类分组
  const categoryMap = new Map<string, NodeTemplate[]>()
  
  filteredTemplates.value.forEach(template => {
    if (!categoryMap.has(template.category)) {
      categoryMap.set(template.category, [])
    }
    categoryMap.get(template.category)!.push(template)
  })

  // 构建分组数据
  categoryMap.forEach((templates, categoryId) => {
    const category = categories.value.find(c => c.id === categoryId)
    const categoryName = category?.name || '未分类'
    const icon = category?.icon || 'fas fa-folder'
    
    // 排序模板
    templates.sort((a, b) => {
      switch (sortBy.value) {
        case 'usage':
          return b.metadata.usageCount - a.metadata.usageCount
        case 'date':
          return b.metadata.updatedAt.getTime() - a.metadata.updatedAt.getTime()
        default:
          return a.name.localeCompare(b.name)
      }
    })

    groups.push({
      categoryId,
      categoryName,
      icon,
      templates
    })
  })

  // 按分类排序
  groups.sort((a, b) => {
    const categoryA = categories.value.find(c => c.id === a.categoryId)
    const categoryB = categories.value.find(c => c.id === b.categoryId)
    const orderA = categoryA?.sortOrder || 999
    const orderB = categoryB?.sortOrder || 999
    return orderA - orderB
  })

  return groups
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
async function loadData() {
  loading.value = true
  try {
    // 加载模板和分类
    templates.value = templateManager.getAllTemplates()
    categories.value = templateManager.getAllCategories()
    
    console.log('加载模板数据:', templates.value.length, '个模板,', categories.value.length, '个分类')
  } catch (error) {
    console.error('加载模板数据失败:', error)
  } finally {
    loading.value = false
  }
}

async function refreshTemplates() {
  await loadData()
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function toggleCategory(categoryId: string) {
  collapsedCategories.value[categoryId] = !collapsedCategories.value[categoryId]
}

function handleSearch() {
  // 搜索逻辑已在计算属性中处理
}

function handleCategoryChange() {
  // 分类过滤逻辑已在计算属性中处理
}

function handleSortChange() {
  // 排序逻辑已在计算属性中处理
}

function handleTemplateDragStart(template: NodeTemplate, event: DragEvent) {
  console.log('模板拖拽开始:', template.name)
  
  // 使用统一拖拽数据格式，保持向后兼容
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    
    const dragData: UnifiedDragData = {
      type: 'template',
      source: 'templatePanel',
      nodeInfo: {
        elementType: template.nodeType,
        name: template.name,
        category: template.category,
        icon: template.icon
      },
      template: template
    }
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
  }
  
  emit('template-drag-start', template, event)
}

function handleTemplateClick(template: NodeTemplate) {
  console.log('选中模板:', template.name)
  emit('template-selected', template)
}

async function handleTemplateCreate(templateData: Omit<NodeTemplate, 'id' | 'metadata'>) {
  try {
    const templateId = await templateManager.createTemplate(templateData)
    console.log('模板创建成功:', templateId)
    showCreateDialog.value = false
    await refreshTemplates()
  } catch (error) {
    console.error('创建模板失败:', error)
    alert('创建模板失败: ' + error)
  }
}

function handleTemplateEdit(template: NodeTemplate) {
  editingTemplate.value = { ...template }
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
  editingTemplate.value = null
}

async function handleTemplateSave(template: NodeTemplate) {
  try {
    await templateManager.updateTemplate(template.id, template)
    console.log('模板保存成功:', template.name)
    closeEditDialog()
    await refreshTemplates()
  } catch (error) {
    console.error('保存模板失败:', error)
    alert('保存模板失败: ' + error)
  }
}

async function handleTemplateDelete(template: NodeTemplate) {
  if (confirm(`确定要删除模板 "${template.name}" 吗？`)) {
    try {
      await templateManager.deleteTemplate(template.id)
      console.log('模板删除成功:', template.name)
      await refreshTemplates()
    } catch (error) {
      console.error('删除模板失败:', error)
      alert('删除模板失败: ' + error)
    }
  }
}

async function handleTemplateDuplicate(template: NodeTemplate) {
  try {
    const duplicateData = {
      ...template,
      name: template.name + ' (副本)',
      description: template.description + ' (副本)'
    }
    
    // 移除不应该复制的字段
    delete (duplicateData as any).id
    delete (duplicateData as any).metadata
    
    const templateId = await templateManager.createTemplate(duplicateData)
    console.log('模板复制成功:', templateId)
    await refreshTemplates()
  } catch (error) {
    console.error('复制模板失败:', error)
    alert('复制模板失败: ' + error)
  }
}
</script>

<style lang="scss" scoped>
.template-panel {
  width: 300px;
  height: 100%;
  background: #fff;
  border-right: 1px solid #dcdfe6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  
  &.collapsed {
    width: 40px;
  }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #dcdfe6;
  min-height: 50px;
  
  .header-left {
    flex: 1;
    min-width: 0;
    
    h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .template-count {
      font-size: 12px;
      color: #909399;
      display: block;
      margin-top: 2px;
    }
  }
  
  .header-actions {
    display: flex;
    gap: 4px;
    
    .action-btn, .collapse-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #606266;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #e6f3ff;
        color: #409eff;
      }
      
      i {
        font-size: 12px;
      }
    }
  }
}

.search-section {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  
  .search-input {
    position: relative;
    margin-bottom: 8px;
    
    input {
      width: 100%;
      padding: 6px 12px 6px 32px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-size: 12px;
      box-sizing: border-box;
      
      &:focus {
        outline: none;
        border-color: #409eff;
      }
      
      &::placeholder {
        color: #c0c4cc;
      }
    }
    
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      color: #c0c4cc;
      font-size: 12px;
    }
  }
  
  .filter-options {
    display: flex;
    gap: 8px;
    
    select {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      font-size: 11px;
      background: #fff;
      
      &:focus {
        outline: none;
        border-color: #409eff;
      }
    }
  }
}

.template-content {
  flex: 1;
  overflow-y: auto;
  
  .loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    color: #909399;
    
    i {
      font-size: 24px;
      margin-bottom: 8px;
    }
    
    span {
      font-size: 12px;
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    color: #909399;
    text-align: center;
    
    i {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }
    
    p {
      margin: 0 0 16px;
      font-size: 14px;
    }
    
    .create-template-btn {
      padding: 8px 16px;
      background: #409eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      
      &:hover {
        background: #337ecc;
      }
    }
  }
}

.template-categories {
  .category-group {
    border-bottom: 1px solid #f0f0f0;
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #fafafa;
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background: #f5f5f5;
      }
      
      &.collapsed .toggle-icon {
        transform: rotate(-90deg);
      }
      
      .category-info {
        display: flex;
        align-items: center;
        flex: 1;
        
        i {
          margin-right: 8px;
          color: #409eff;
          font-size: 12px;
          width: 16px;
        }
        
        .category-name {
          font-weight: 500;
          font-size: 13px;
          color: #303133;
        }
        
        .template-count {
          margin-left: 4px;
          font-size: 11px;
          color: #909399;
        }
      }
      
      .toggle-icon {
        color: #909399;
        font-size: 10px;
        transition: transform 0.2s ease;
      }
    }
    
    .template-list {
      max-height: 300px;
      overflow-y: auto;
    }
  }
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>