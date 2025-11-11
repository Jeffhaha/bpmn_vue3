<template>
  <div class="icon-picker-overlay">
    <div class="icon-picker">
      <div class="picker-header">
        <h3>选择图标</h3>
        <button @click="$emit('close')" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="picker-content">
        <div class="search-box">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索图标..."
          />
        </div>
        
        <div class="icon-categories">
          <button
            v-for="category in iconCategories"
            :key="category.name"
            class="category-btn"
            :class="{ active: selectedCategory === category.name }"
            @click="selectedCategory = category.name"
          >
            {{ category.label }}
          </button>
        </div>
        
        <div class="icon-grid">
          <button
            v-for="icon in filteredIcons"
            :key="icon"
            class="icon-btn"
            @click="selectIcon(icon)"
          >
            <i :class="icon"></i>
            <span>{{ icon.split(' ')[1].replace('fa-', '') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Emits
const emit = defineEmits<{
  'select': [icon: string]
  'close': []
}>()

// 状态
const searchQuery = ref('')
const selectedCategory = ref('common')

// 图标数据
const iconCategories = [
  { name: 'common', label: '常用' },
  { name: 'business', label: '业务' },
  { name: 'shapes', label: '形状' },
  { name: 'arrows', label: '箭头' }
]

const icons = {
  common: [
    'fas fa-user', 'fas fa-cog', 'fas fa-tasks', 'fas fa-file',
    'fas fa-folder', 'fas fa-home', 'fas fa-envelope', 'fas fa-phone',
    'fas fa-star', 'fas fa-heart', 'fas fa-check', 'fas fa-times',
    'fas fa-plus', 'fas fa-minus', 'fas fa-edit', 'fas fa-trash'
  ],
  business: [
    'fas fa-briefcase', 'fas fa-chart-bar', 'fas fa-chart-pie', 'fas fa-chart-line',
    'fas fa-calculator', 'fas fa-money-bill', 'fas fa-credit-card', 'fas fa-handshake',
    'fas fa-building', 'fas fa-industry', 'fas fa-truck', 'fas fa-warehouse',
    'fas fa-clipboard', 'fas fa-calendar', 'fas fa-clock', 'fas fa-user-tie'
  ],
  shapes: [
    'fas fa-square', 'fas fa-circle', 'fas fa-triangle', 'fas fa-diamond',
    'fas fa-star', 'fas fa-heart', 'fas fa-hexagon', 'fas fa-octagon',
    'fas fa-cube', 'fas fa-sphere', 'fas fa-cylinder', 'fas fa-pyramid'
  ],
  arrows: [
    'fas fa-arrow-right', 'fas fa-arrow-left', 'fas fa-arrow-up', 'fas fa-arrow-down',
    'fas fa-arrow-circle-right', 'fas fa-arrow-circle-left', 'fas fa-chevron-right', 'fas fa-chevron-left',
    'fas fa-play', 'fas fa-pause', 'fas fa-stop', 'fas fa-forward',
    'fas fa-backward', 'fas fa-step-forward', 'fas fa-step-backward', 'fas fa-fast-forward'
  ]
}

// 计算属性
const filteredIcons = computed(() => {
  let categoryIcons = icons[selectedCategory.value as keyof typeof icons] || []
  
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    categoryIcons = categoryIcons.filter(icon => 
      icon.toLowerCase().includes(query)
    )
  }
  
  return categoryIcons
})

// 方法
function selectIcon(icon: string) {
  emit('select', icon)
}
</script>

<style lang="scss" scoped>
.icon-picker-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-picker {
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

.picker-header {
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

.picker-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

.search-box {
  margin-bottom: 16px;
  
  input {
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
}

.icon-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  
  .category-btn {
    padding: 6px 12px;
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
    
    &.active {
      background: #409eff;
      border-color: #409eff;
      color: #fff;
    }
  }
}

.icon-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  
  .icon-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 12px 8px;
    border: 1px solid #f0f0f0;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: #409eff;
      background: #ecf5ff;
      transform: translateY(-1px);
    }
    
    i {
      font-size: 18px;
      color: #409eff;
    }
    
    span {
      font-size: 10px;
      color: #909399;
      text-align: center;
      word-break: break-all;
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