<template>
  <div v-if="visible && template" class="template-edit-dialog">
    <div class="dialog-overlay" @click="handleClose"></div>
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>编辑模板 - {{ template.name }}</h3>
        <button class="close-btn" @click="handleClose">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="dialog-body">
        <form @submit.prevent="handleSubmit" class="template-form">
          <!-- 基础信息 -->
          <div class="form-section">
            <h4>基础信息</h4>
            <div class="form-group">
              <label>模板名称 *</label>
              <input
                v-model="editData.name"
                type="text"
                placeholder="输入模板名称"
                required
              />
            </div>
            
            <div class="form-group">
              <label>模板描述</label>
              <textarea
                v-model="editData.description"
                placeholder="描述模板的用途和特点"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>分类 *</label>
                <select v-model="editData.category" required>
                  <option value="">选择分类</option>
                  <option
                    v-for="category in categories"
                    :key="category.id"
                    :value="category.id"
                  >
                    {{ category.name }}
                  </option>
                </select>
              </div>
              
              <div class="form-group">
                <label>图标</label>
                <input
                  v-model="editData.icon"
                  type="text"
                  placeholder="fas fa-icon"
                />
              </div>
            </div>
          </div>
          
          <!-- 模板配置 -->
          <div class="form-section">
            <h4>模板配置</h4>
            <div class="form-row">
              <div class="form-group checkbox-group">
                <label>
                  <input
                    v-model="editData.templateConfig.isDefault"
                    type="checkbox"
                  />
                  设为默认模板
                </label>
              </div>
              
              <div class="form-group checkbox-group">
                <label>
                  <input
                    v-model="editData.templateConfig.isCustomizable"
                    type="checkbox"
                  />
                  允许自定义
                </label>
              </div>
            </div>
          </div>
          
          <!-- 标签 -->
          <div class="form-section">
            <h4>标签</h4>
            <div class="form-group">
              <label>标签（用逗号分隔）</label>
              <input
                v-model="tagsInput"
                type="text"
                placeholder="例如：任务,审批,自动化"
              />
            </div>
          </div>
        </form>
      </div>
      
      <div class="dialog-footer">
        <button type="button" class="cancel-btn" @click="handleClose">
          取消
        </button>
        <button type="submit" class="confirm-btn" @click="handleSubmit">
          保存更改
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import type { NodeTemplate, TemplateCategory } from '@/types'

// Props
interface Props {
  visible: boolean
  template: NodeTemplate | null
  categories: TemplateCategory[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'close': []
  'save': [template: NodeTemplate]
}>()

// 状态
const editData = reactive<NodeTemplate>({} as NodeTemplate)
const tagsInput = ref('')

// 监听模板变化，更新编辑数据
watch(() => props.template, (newTemplate) => {
  if (newTemplate) {
    Object.assign(editData, JSON.parse(JSON.stringify(newTemplate)))
    tagsInput.value = newTemplate.metadata.tags.join(', ')
  }
}, { immediate: true })

// 计算属性
const isFormValid = computed(() => {
  return editData.name?.trim() !== '' && editData.category !== ''
})

// 方法
function handleClose() {
  emit('close')
}

function handleSubmit() {
  if (!isFormValid.value) {
    alert('请填写必填字段')
    return
  }

  // 处理标签
  const tags = tagsInput.value
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag !== '')

  const updatedTemplate: NodeTemplate = {
    ...editData,
    metadata: {
      ...editData.metadata,
      tags,
      updatedAt: new Date()
    }
  }

  emit('save', updatedTemplate)
}
</script>

<style lang="scss" scoped>
.template-edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .dialog-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
  }
  
  .dialog-content {
    position: relative;
    background: #fff;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
  
  .close-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #909399;
    cursor: pointer;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #f5f7fa;
      color: #606266;
    }
  }
}

.dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.template-form {
  .form-section {
    margin-bottom: 24px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    h4 {
      margin: 0 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  
  .form-group {
    margin-bottom: 16px;
    
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 12px;
      font-weight: 500;
      color: #606266;
    }
    
    input, textarea, select {
      width: 100%;
      padding: 8px 12px;
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
    
    textarea {
      resize: vertical;
      min-height: 60px;
      line-height: 1.4;
    }
    
    &.checkbox-group {
      label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        cursor: pointer;
        margin-bottom: 0;
        
        input[type="checkbox"] {
          width: auto;
          margin: 0;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
  
  .cancel-btn {
    padding: 8px 16px;
    border: 1px solid #dcdfe6;
    background: #fff;
    color: #606266;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      border-color: #c0c4cc;
      color: #409eff;
    }
  }
  
  .confirm-btn {
    padding: 8px 16px;
    border: none;
    background: #409eff;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      background: #337ecc;
    }
    
    &:disabled {
      background: #c0c4cc;
      cursor: not-allowed;
    }
  }
}
</style>