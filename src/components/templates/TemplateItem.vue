<template>
  <div 
    class="template-item" 
    :class="{ 
      'is-dragging': isDragging,
      'is-selected': isSelected 
    }"
    :draggable="draggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- 模板图标 -->
    <div class="template-icon">
      <i :class="template.icon || getDefaultIcon(template.nodeType)"></i>
    </div>
    
    <!-- 模板信息 -->
    <div class="template-info">
      <div class="template-name" :title="template.name">
        {{ template.name }}
      </div>
      <div class="template-description" :title="template.description">
        {{ template.description || '暂无描述' }}
      </div>
      <div class="template-meta">
        <span class="usage-count">
          <i class="fas fa-chart-bar"></i>
          {{ template.metadata.usageCount }}
        </span>
        <span class="update-time">
          <i class="fas fa-clock"></i>
          {{ formatTime(template.metadata.updatedAt) }}
        </span>
      </div>
    </div>
    
    <!-- 操作按钮 -->
    <div class="template-actions">
      <button 
        class="action-btn" 
        @click.stop="$emit('edit', template)"
        title="编辑模板"
      >
        <i class="fas fa-edit"></i>
      </button>
      <button 
        class="action-btn" 
        @click.stop="$emit('duplicate', template)"
        title="复制模板"
      >
        <i class="fas fa-copy"></i>
      </button>
      <button 
        class="action-btn delete-btn" 
        @click.stop="$emit('delete', template)"
        title="删除模板"
      >
        <i class="fas fa-trash"></i>
      </button>
    </div>
    
    <!-- 右键菜单 -->
    <div 
      v-if="showContextMenu" 
      class="context-menu"
      :style="contextMenuStyle"
      @click.stop
    >
      <div class="menu-item" @click="handleMenuEdit">
        <i class="fas fa-edit"></i>
        编辑模板
      </div>
      <div class="menu-item" @click="handleMenuDuplicate">
        <i class="fas fa-copy"></i>
        复制模板
      </div>
      <div class="menu-item" @click="handleMenuApply">
        <i class="fas fa-magic"></i>
        应用到画布
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item" @click="handleMenuVersions">
        <i class="fas fa-history"></i>
        版本历史
      </div>
      <div class="menu-item" @click="handleMenuExport">
        <i class="fas fa-download"></i>
        导出模板
      </div>
      <div class="menu-separator"></div>
      <div class="menu-item danger" @click="handleMenuDelete">
        <i class="fas fa-trash"></i>
        删除模板
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { NodeTemplate } from '@/types'

// Props
interface Props {
  template: NodeTemplate
  draggable?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  draggable: false,
  selected: false
})

// Emits
const emit = defineEmits<{
  'drag-start': [template: NodeTemplate, event: DragEvent]
  'click': [template: NodeTemplate]
  'edit': [template: NodeTemplate]
  'delete': [template: NodeTemplate]
  'duplicate': [template: NodeTemplate]
  'apply': [template: NodeTemplate]
  'versions': [template: NodeTemplate]
  'export': [template: NodeTemplate]
}>()

// 状态
const isDragging = ref(false)
const showContextMenu = ref(false)
const contextMenuPosition = ref({ x: 0, y: 0 })

// 计算属性
const isSelected = computed(() => props.selected)

const contextMenuStyle = computed(() => ({
  left: `${contextMenuPosition.value.x}px`,
  top: `${contextMenuPosition.value.y}px`
}))

// 生命周期
onMounted(() => {
  document.addEventListener('click', hideContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu)
})

// 方法
function handleDragStart(event: DragEvent) {
  isDragging.value = true
  emit('drag-start', props.template, event)
}

function handleDragEnd() {
  isDragging.value = false
}

function handleClick() {
  hideContextMenu()
  emit('click', props.template)
}

function handleContextMenu(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  }
  showContextMenu.value = true
}

function hideContextMenu() {
  showContextMenu.value = false
}

function handleMenuEdit() {
  hideContextMenu()
  emit('edit', props.template)
}

function handleMenuDuplicate() {
  hideContextMenu()
  emit('duplicate', props.template)
}

function handleMenuApply() {
  hideContextMenu()
  emit('apply', props.template)
}

function handleMenuVersions() {
  hideContextMenu()
  emit('versions', props.template)
}

function handleMenuExport() {
  hideContextMenu()
  emit('export', props.template)
}

function handleMenuDelete() {
  hideContextMenu()
  emit('delete', props.template)
}

function getDefaultIcon(nodeType: string): string {
  const iconMap: Record<string, string> = {
    'bpmn:UserTask': 'fas fa-user',
    'bpmn:ServiceTask': 'fas fa-cog',
    'bpmn:ScriptTask': 'fas fa-code',
    'bpmn:BusinessRuleTask': 'fas fa-gavel',
    'bpmn:SendTask': 'fas fa-paper-plane',
    'bpmn:ReceiveTask': 'fas fa-inbox',
    'bpmn:ManualTask': 'fas fa-hand-paper',
    'bpmn:StartEvent': 'fas fa-play-circle',
    'bpmn:EndEvent': 'fas fa-stop-circle',
    'bpmn:IntermediateCatchEvent': 'fas fa-pause-circle',
    'bpmn:IntermediateThrowEvent': 'fas fa-forward',
    'bpmn:ExclusiveGateway': 'fas fa-diamond',
    'bpmn:InclusiveGateway': 'fas fa-circle',
    'bpmn:ParallelGateway': 'fas fa-plus',
    'bpmn:EventBasedGateway': 'fas fa-star',
    'bpmn:SubProcess': 'fas fa-folder-open'
  }
  
  return iconMap[nodeType] || 'fas fa-square'
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}
</script>

<style lang="scss" scoped>
.template-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #f8f9fa;
  transition: all 0.2s ease;
  position: relative;
  
  &:hover {
    background: #f5f7fa;
    
    .template-actions {
      opacity: 1;
    }
  }
  
  &.is-dragging {
    opacity: 0.8;
    transform: scale(0.95);
    background: #e6f3ff;
  }
  
  &.is-selected {
    background: #e6f3ff;
    border-color: #409eff;
  }
}

.template-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f9ff;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
  
  i {
    font-size: 14px;
    color: #409eff;
  }
}

.template-info {
  flex: 1;
  min-width: 0;
  
  .template-name {
    font-size: 13px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .template-description {
    font-size: 11px;
    color: #909399;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .template-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 10px;
    color: #c0c4cc;
    
    span {
      display: flex;
      align-items: center;
      gap: 2px;
      
      i {
        font-size: 9px;
      }
    }
  }
}

.template-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .action-btn {
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    color: #909399;
    cursor: pointer;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #e6f3ff;
      color: #409eff;
    }
    
    &.delete-btn:hover {
      background: #fef0f0;
      color: #f56c6c;
    }
    
    i {
      font-size: 10px;
    }
  }
}

.context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  min-width: 140px;
  padding: 4px 0;
  
  .menu-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 12px;
    color: #606266;
    cursor: pointer;
    gap: 8px;
    
    &:hover {
      background: #f5f7fa;
      color: #409eff;
    }
    
    &.danger {
      color: #f56c6c;
      
      &:hover {
        background: #fef0f0;
      }
    }
    
    i {
      width: 12px;
      font-size: 11px;
    }
  }
  
  .menu-separator {
    height: 1px;
    background: #f0f0f0;
    margin: 4px 0;
  }
}
</style>