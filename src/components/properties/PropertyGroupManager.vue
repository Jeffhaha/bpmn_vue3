<template>
  <div class="property-group-manager">
    <!-- 分组管理工具栏 -->
    <div class="group-toolbar">
      <div class="toolbar-left">
        <button class="btn-small" @click="expandAllGroups" title="展开所有分组">
          <i class="fas fa-expand-arrows-alt"></i>
        </button>
        <button class="btn-small" @click="collapseAllGroups" title="收起所有分组">
          <i class="fas fa-compress-arrows-alt"></i>
        </button>
        <button class="btn-small" @click="resetGroupLayout" title="重置布局">
          <i class="fas fa-undo"></i>
        </button>
      </div>
      <div class="toolbar-right">
        <button class="btn-small" @click="showGroupConfig = !showGroupConfig" :class="{ active: showGroupConfig }" title="分组配置">
          <i class="fas fa-cog"></i>
        </button>
      </div>
    </div>

    <!-- 分组配置面板 -->
    <div v-if="showGroupConfig" class="group-config-panel">
      <div class="config-header">
        <h4>分组配置</h4>
        <button @click="showGroupConfig = false" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="config-content">
        <div class="config-section">
          <h5>显示设置</h5>
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="layoutConfig.showIcons" @change="updateLayout">
              显示图标
            </label>
          </div>
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="layoutConfig.showDescriptions" @change="updateLayout">
              显示描述
            </label>
          </div>
          <div class="config-item">
            <label>
              <input type="checkbox" v-model="layoutConfig.compactMode" @change="updateLayout">
              紧凑模式
            </label>
          </div>
        </div>
        
        <div class="config-section">
          <h5>分组管理</h5>
          <div class="group-list">
            <div 
              v-for="group in managedGroups" 
              :key="group.key"
              class="group-item"
              :class="{ disabled: !group.visible }"
            >
              <div class="group-drag-handle" @mousedown="startDragGroup(group)">
                <i class="fas fa-grip-vertical"></i>
              </div>
              <div class="group-info">
                <i v-if="group.icon" :class="group.icon"></i>
                <span>{{ group.label }}</span>
              </div>
              <div class="group-actions">
                <button 
                  class="visibility-btn" 
                  @click="toggleGroupVisibility(group)"
                  :title="group.visible ? '隐藏分组' : '显示分组'"
                >
                  <i :class="group.visible ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
                </button>
                <button 
                  class="collapse-btn" 
                  @click="toggleGroupCollapse(group)"
                  :title="group.collapsed ? '展开分组' : '收起分组'"
                >
                  <i :class="group.collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-down'"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div class="config-section">
          <h5>自定义分组</h5>
          <div class="custom-group-actions">
            <button class="btn-primary" @click="showCreateGroupDialog = true">
              <i class="fas fa-plus"></i>
              创建分组
            </button>
            <button class="btn-secondary" @click="importGroups">
              <i class="fas fa-download"></i>
              导入配置
            </button>
            <button class="btn-secondary" @click="exportGroups">
              <i class="fas fa-upload"></i>
              导出配置
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 分组内容 -->
    <div class="group-content" :class="{ 'compact-mode': layoutConfig.compactMode }">
      <div 
        v-for="group in visibleGroups" 
        :key="group.key" 
        class="property-group"
        :class="{ 
          collapsed: group.collapsed,
          'has-validation-errors': hasGroupValidationErrors(group),
          'is-custom': group.isCustom
        }"
      >
        <!-- 分组头部 -->
        <div 
          class="group-header" 
          @click="toggleGroupCollapse(group)"
          @contextmenu.prevent="showGroupContextMenu(group, $event)"
        >
          <div class="header-left">
            <i v-if="layoutConfig.showIcons && group.icon" :class="group.icon"></i>
            <span class="group-title">{{ group.label }}</span>
            <span v-if="hasGroupValidationErrors(group)" class="error-indicator" title="此分组有验证错误">
              <i class="fas fa-exclamation-triangle"></i>
            </span>
          </div>
          <div class="header-right">
            <span v-if="group.properties.length > 0" class="property-count">{{ group.properties.length }}</span>
            <button class="group-menu-btn" @click.stop="showGroupMenu(group, $event)">
              <i class="fas fa-ellipsis-h"></i>
            </button>
            <i class="fas fa-chevron-down toggle-icon" :class="{ rotated: group.collapsed }"></i>
          </div>
        </div>
        
        <!-- 分组描述 -->
        <div v-if="layoutConfig.showDescriptions && group.description && !group.collapsed" class="group-description">
          {{ group.description }}
        </div>
        
        <!-- 分组属性 -->
        <div v-if="!group.collapsed" class="group-properties">
          <slot 
            name="group-content" 
            :group="group"
            :properties="getGroupProperties(group)"
            :layout="layoutConfig"
          >
            <!-- 默认属性显示 -->
            <div v-for="property in group.properties" :key="property.key" class="property-placeholder">
              {{ property.label }} ({{ property.type }})
            </div>
          </slot>
        </div>
      </div>
    </div>

    <!-- 创建分组对话框 -->
    <div v-if="showCreateGroupDialog" class="dialog-overlay" @click.self="showCreateGroupDialog = false">
      <div class="create-group-dialog">
        <div class="dialog-header">
          <h4>创建自定义分组</h4>
          <button @click="showCreateGroupDialog = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>分组名称</label>
            <input v-model="newGroup.label" type="text" placeholder="输入分组名称">
          </div>
          
          <div class="form-group">
            <label>分组键</label>
            <input v-model="newGroup.key" type="text" placeholder="输入分组键">
          </div>
          
          <div class="form-group">
            <label>图标</label>
            <input v-model="newGroup.icon" type="text" placeholder="fas fa-icon">
          </div>
          
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="newGroup.description" placeholder="输入分组描述"></textarea>
          </div>
          
          <div class="form-group">
            <label>显示顺序</label>
            <input v-model.number="newGroup.order" type="number" min="1">
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="btn-secondary" @click="showCreateGroupDialog = false">取消</button>
          <button class="btn-primary" @click="createCustomGroup">创建</button>
        </div>
      </div>
    </div>

    <!-- 分组右键菜单 -->
    <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle">
      <div class="menu-item" @click="duplicateGroup(contextMenu.group)">
        <i class="fas fa-copy"></i>
        复制分组
      </div>
      <div class="menu-item" @click="editGroup(contextMenu.group)">
        <i class="fas fa-edit"></i>
        编辑分组
      </div>
      <div v-if="contextMenu.group.isCustom" class="menu-item danger" @click="deleteGroup(contextMenu.group)">
        <i class="fas fa-trash"></i>
        删除分组
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item" @click="moveGroupUp(contextMenu.group)">
        <i class="fas fa-arrow-up"></i>
        上移
      </div>
      <div class="menu-item" @click="moveGroupDown(contextMenu.group)">
        <i class="fas fa-arrow-down"></i>
        下移
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { PropertyGroup, PropertyConfig } from '@/types/property.types'

// Props
interface Props {
  groups: PropertyGroup[]
  validationErrors?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  validationErrors: () => []
})

// Emits
const emit = defineEmits<{
  'groups-updated': [groups: PropertyGroup[]]
  'group-visibility-changed': [groupKey: string, visible: boolean]
  'group-collapsed-changed': [groupKey: string, collapsed: boolean]
  'layout-updated': [layout: any]
}>()

// 状态
const showGroupConfig = ref(false)
const showCreateGroupDialog = ref(false)
const managedGroups = ref<PropertyGroup[]>([])
const layoutConfig = ref({
  showIcons: true,
  showDescriptions: true,
  compactMode: false,
  animateTransitions: true
})

const newGroup = ref({
  key: '',
  label: '',
  icon: 'fas fa-cog',
  description: '',
  order: 999
})

const contextMenu = ref({
  show: false,
  group: null as PropertyGroup | null,
  x: 0,
  y: 0
})

const dragState = ref({
  isDragging: false,
  dragGroup: null as PropertyGroup | null,
  dragStartY: 0,
  dragCurrentY: 0
})

// 计算属性
const visibleGroups = computed(() => {
  return managedGroups.value
    .filter(group => group.visible !== false)
    .sort((a, b) => (a.order || 999) - (b.order || 999))
})

const contextMenuStyle = computed(() => ({
  left: `${contextMenu.value.x}px`,
  top: `${contextMenu.value.y}px`,
  display: contextMenu.value.show ? 'block' : 'none'
}))

// 监听
watch(() => props.groups, (newGroups) => {
  managedGroups.value = newGroups.map(group => ({
    ...group,
    visible: group.visible !== false,
    collapsed: group.collapsed || false
  }))
}, { immediate: true, deep: true })

// 点击外部关闭上下文菜单
watch(() => contextMenu.value.show, (show) => {
  if (show) {
    nextTick(() => {
      document.addEventListener('click', hideContextMenu)
    })
  } else {
    document.removeEventListener('click', hideContextMenu)
  }
})

// 方法
function expandAllGroups() {
  managedGroups.value.forEach(group => {
    group.collapsed = false
  })
  emitGroupsUpdate()
}

function collapseAllGroups() {
  managedGroups.value.forEach(group => {
    group.collapsed = true
  })
  emitGroupsUpdate()
}

function resetGroupLayout() {
  managedGroups.value = props.groups.map(group => ({
    ...group,
    visible: true,
    collapsed: false,
    order: group.order
  }))
  
  layoutConfig.value = {
    showIcons: true,
    showDescriptions: true,
    compactMode: false,
    animateTransitions: true
  }
  
  emitGroupsUpdate()
  emit('layout-updated', layoutConfig.value)
}

function updateLayout() {
  emit('layout-updated', layoutConfig.value)
}

function toggleGroupVisibility(group: PropertyGroup) {
  group.visible = !group.visible
  emit('group-visibility-changed', group.key, group.visible)
  emitGroupsUpdate()
}

function toggleGroupCollapse(group: PropertyGroup) {
  group.collapsed = !group.collapsed
  emit('group-collapsed-changed', group.key, group.collapsed)
  emitGroupsUpdate()
}

function hasGroupValidationErrors(group: PropertyGroup): boolean {
  if (!props.validationErrors) return false
  
  const groupPropertyKeys = group.properties.map(p => p.key)
  return props.validationErrors.some(error => 
    groupPropertyKeys.includes(error.property)
  )
}

function getGroupProperties(group: PropertyGroup): PropertyConfig[] {
  return group.properties.filter(property => {
    // 根据布局配置过滤属性
    if (typeof property.visible === 'function') {
      return property.visible({} as any) // 需要传入实际的element
    }
    return property.visible !== false
  })
}

function showGroupContextMenu(group: PropertyGroup, event: MouseEvent) {
  contextMenu.value = {
    show: true,
    group,
    x: event.clientX,
    y: event.clientY
  }
}

function showGroupMenu(group: PropertyGroup, event: MouseEvent) {
  showGroupContextMenu(group, event)
}

function hideContextMenu() {
  contextMenu.value.show = false
}

function duplicateGroup(group: PropertyGroup) {
  const duplicated: PropertyGroup = {
    ...group,
    key: `${group.key}_copy_${Date.now()}`,
    label: `${group.label} (复制)`,
    order: (group.order || 0) + 1,
    isCustom: true
  }
  
  managedGroups.value.push(duplicated)
  emitGroupsUpdate()
  hideContextMenu()
}

function editGroup(group: PropertyGroup) {
  // 打开编辑对话框
  newGroup.value = {
    key: group.key,
    label: group.label,
    icon: group.icon || 'fas fa-cog',
    description: group.description || '',
    order: group.order || 999
  }
  showCreateGroupDialog.value = true
  hideContextMenu()
}

function deleteGroup(group: PropertyGroup) {
  if (group.isCustom) {
    const index = managedGroups.value.findIndex(g => g.key === group.key)
    if (index > -1) {
      managedGroups.value.splice(index, 1)
      emitGroupsUpdate()
    }
  }
  hideContextMenu()
}

function moveGroupUp(group: PropertyGroup) {
  const index = managedGroups.value.findIndex(g => g.key === group.key)
  if (index > 0) {
    const temp = managedGroups.value[index - 1].order
    managedGroups.value[index - 1].order = group.order
    group.order = temp
    emitGroupsUpdate()
  }
  hideContextMenu()
}

function moveGroupDown(group: PropertyGroup) {
  const index = managedGroups.value.findIndex(g => g.key === group.key)
  if (index < managedGroups.value.length - 1) {
    const temp = managedGroups.value[index + 1].order
    managedGroups.value[index + 1].order = group.order
    group.order = temp
    emitGroupsUpdate()
  }
  hideContextMenu()
}

function createCustomGroup() {
  if (!newGroup.value.key || !newGroup.value.label) {
    alert('请填写必要的分组信息')
    return
  }
  
  const customGroup: PropertyGroup = {
    key: newGroup.value.key,
    label: newGroup.value.label,
    icon: newGroup.value.icon,
    description: newGroup.value.description,
    order: newGroup.value.order,
    visible: true,
    collapsed: false,
    isCustom: true,
    properties: []
  }
  
  managedGroups.value.push(customGroup)
  emitGroupsUpdate()
  
  // 重置表单
  newGroup.value = {
    key: '',
    label: '',
    icon: 'fas fa-cog',
    description: '',
    order: 999
  }
  
  showCreateGroupDialog.value = false
}

function importGroups() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    try {
      const content = await file.text()
      const imported = JSON.parse(content)
      
      if (Array.isArray(imported.groups)) {
        managedGroups.value = [...managedGroups.value, ...imported.groups.map((group: any) => ({
          ...group,
          isCustom: true
        }))]
        emitGroupsUpdate()
      }
      
      if (imported.layout) {
        layoutConfig.value = { ...layoutConfig.value, ...imported.layout }
        updateLayout()
      }
    } catch (error) {
      alert('导入失败：' + error)
    }
  }
  
  input.click()
}

function exportGroups() {
  const exportData = {
    groups: managedGroups.value.filter(g => g.isCustom),
    layout: layoutConfig.value,
    exportTime: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `property-groups-${Date.now()}.json`
  link.click()
  
  URL.revokeObjectURL(url)
}

function startDragGroup(group: PropertyGroup) {
  dragState.value = {
    isDragging: true,
    dragGroup: group,
    dragStartY: 0,
    dragCurrentY: 0
  }
  
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
}

function handleDragMove(event: MouseEvent) {
  if (dragState.value.isDragging) {
    dragState.value.dragCurrentY = event.clientY
    // 实现拖拽排序逻辑
  }
}

function handleDragEnd() {
  dragState.value.isDragging = false
  dragState.value.dragGroup = null
  
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
}

function emitGroupsUpdate() {
  emit('groups-updated', [...managedGroups.value])
}

// 暴露方法
defineExpose({
  expandAllGroups,
  collapseAllGroups,
  resetGroupLayout,
  getVisibleGroups: () => visibleGroups.value,
  getLayoutConfig: () => layoutConfig.value
})
</script>

<style lang="scss" scoped>
.property-group-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.group-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    gap: 4px;
  }
  
  .btn-small {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #6c757d;
    border-radius: 3px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #e9ecef;
      color: #495057;
    }
    
    &.active {
      background: #007bff;
      color: white;
    }
    
    i {
      font-size: 11px;
    }
  }
}

.group-config-panel {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  
  .config-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #e9ecef;
    
    h4 {
      margin: 0;
      font-size: 13px;
      font-weight: 600;
      color: #495057;
    }
    
    .close-btn {
      width: 20px;
      height: 20px;
      border: none;
      background: transparent;
      color: #6c757d;
      cursor: pointer;
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: #e9ecef;
      }
    }
  }
  
  .config-content {
    padding: 12px;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .config-section {
    margin-bottom: 16px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h5 {
      margin: 0 0 8px 0;
      font-size: 12px;
      font-weight: 600;
      color: #495057;
    }
  }
  
  .config-item {
    margin-bottom: 6px;
    
    label {
      display: flex;
      align-items: center;
      font-size: 11px;
      color: #6c757d;
      cursor: pointer;
      
      input[type="checkbox"] {
        margin-right: 6px;
      }
    }
  }
  
  .group-list {
    .group-item {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      background: white;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      margin-bottom: 4px;
      
      &.disabled {
        opacity: 0.5;
      }
      
      .group-drag-handle {
        cursor: grab;
        color: #6c757d;
        margin-right: 8px;
        
        &:active {
          cursor: grabbing;
        }
      }
      
      .group-info {
        display: flex;
        align-items: center;
        flex: 1;
        gap: 6px;
        font-size: 11px;
        
        i {
          color: #007bff;
          width: 12px;
        }
      }
      
      .group-actions {
        display: flex;
        gap: 2px;
        
        button {
          width: 20px;
          height: 20px;
          border: none;
          background: transparent;
          color: #6c757d;
          cursor: pointer;
          border-radius: 3px;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &:hover {
            background: #f8f9fa;
          }
          
          i {
            font-size: 10px;
          }
        }
      }
    }
  }
  
  .custom-group-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    
    button {
      padding: 4px 8px;
      border: none;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      
      &.btn-primary {
        background: #007bff;
        color: white;
        
        &:hover {
          background: #0056b3;
        }
      }
      
      &.btn-secondary {
        background: #6c757d;
        color: white;
        
        &:hover {
          background: #545b62;
        }
      }
    }
  }
}

.group-content {
  flex: 1;
  overflow-y: auto;
  
  &.compact-mode {
    .property-group .group-header {
      padding: 6px 12px;
    }
    
    .group-properties {
      padding: 8px 12px;
    }
  }
}

.property-group {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.has-validation-errors {
    border-left: 3px solid #dc3545;
    
    .group-header {
      background: #fff5f5;
    }
  }
  
  &.is-custom {
    .group-header {
      background: #f0f8ff;
      border-left: 2px solid #007bff;
    }
  }
  
  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background: #fafafa;
    cursor: pointer;
    user-select: none;
    transition: background-color 0.2s ease;
    
    &:hover {
      background: #f5f5f5;
    }
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
      
      i {
        color: #007bff;
        font-size: 13px;
        width: 14px;
        flex-shrink: 0;
      }
      
      .group-title {
        font-weight: 500;
        font-size: 12px;
        color: #495057;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .error-indicator {
        color: #dc3545;
        font-size: 11px;
        flex-shrink: 0;
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 6px;
      
      .property-count {
        font-size: 10px;
        color: #6c757d;
        background: #e9ecef;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 16px;
        text-align: center;
      }
      
      .group-menu-btn {
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        color: #6c757d;
        cursor: pointer;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        
        &:hover {
          background: #e9ecef;
          color: #495057;
        }
        
        i {
          font-size: 10px;
        }
      }
      
      .toggle-icon {
        color: #6c757d;
        font-size: 11px;
        transition: transform 0.2s ease;
        
        &.rotated {
          transform: rotate(-90deg);
        }
      }
    }
  }
  
  &:hover .group-menu-btn {
    opacity: 1;
  }
  
  .group-description {
    padding: 8px 16px 0;
    font-size: 11px;
    color: #6c757d;
    line-height: 1.4;
  }
  
  .group-properties {
    padding: 12px 16px;
    
    .property-placeholder {
      padding: 4px 0;
      font-size: 11px;
      color: #6c757d;
      border-bottom: 1px solid #f8f9fa;
      
      &:last-child {
        border-bottom: none;
      }
    }
  }
}

// 对话框样式
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.create-group-dialog {
  background: white;
  border-radius: 6px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  
  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e9ecef;
    
    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #495057;
    }
  }
  
  .dialog-content {
    padding: 16px;
    
    .form-group {
      margin-bottom: 12px;
      
      label {
        display: block;
        margin-bottom: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #495057;
      }
      
      input,
      textarea {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #ced4da;
        border-radius: 4px;
        font-size: 12px;
        
        &:focus {
          outline: none;
          border-color: #007bff;
        }
      }
      
      textarea {
        resize: vertical;
        min-height: 60px;
      }
    }
  }
  
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #e9ecef;
    
    button {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      
      &.btn-primary {
        background: #007bff;
        color: white;
        
        &:hover {
          background: #0056b3;
        }
      }
      
      &.btn-secondary {
        background: #6c757d;
        color: white;
        
        &:hover {
          background: #545b62;
        }
      }
    }
  }
}

// 右键菜单样式
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 4px 0;
  z-index: 1001;
  min-width: 120px;
  
  .menu-item {
    padding: 6px 12px;
    font-size: 11px;
    color: #495057;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &.danger {
      color: #dc3545;
      
      &:hover {
        background: #fff5f5;
      }
    }
    
    i {
      width: 12px;
      text-align: center;
    }
  }
  
  .menu-divider {
    height: 1px;
    background: #e9ecef;
    margin: 4px 0;
  }
}
</style>