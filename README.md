# BPMN Vue3 建模器

基于 Vue 3 和 BPMN.js 的企业级流程建模器，提供完整的 BPMN 流程设计、节点自定义、模板管理和附件系统。

## 技术栈

- **前端框架**: Vue 3.4+ (Composition API)
- **UI 组件库**: Element Plus
- **BPMN 引擎**: BPMN.js 17.x
- **状态管理**: Pinia
- **路由管理**: Vue Router 4.x
- **构建工具**: Vite 5.x
- **类型检查**: TypeScript
- **样式处理**: SCSS
- **测试框架**: Vitest + Vue Test Utils

## 项目特性

### 🎯 核心功能
- ✅ 基础BPMN建模器集成
- ✅ Vue 3 + BPMN.js 无缝集成
- ✅ TypeScript 类型安全
- ✅ Element Plus UI组件
- ✅ 动态表单属性系统
- ✅ 执行监听器配置
- ✅ 扩展属性管理
- 🚧 节点模板管理
- 🚧 附件管理系统
- 🚧 流程模板系统

### 🛠 开发特性
- ✅ 热模块替换 (HMR)
- ✅ ESLint + Prettier 代码规范
- ✅ 自动导入 Element Plus 组件
- ✅ 完整的 TypeScript 类型定义
- ✅ 单元测试配置

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 [http://localhost:5173](http://localhost:5173) 查看应用。

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

### 运行测试

\`\`\`bash
# 运行测试
npm run test

# 运行测试并生成覆盖率报告
npm run test:coverage
\`\`\`

### 代码检查

\`\`\`bash
# ESLint 检查
npm run lint

# TypeScript 类型检查
npm run type-check
\`\`\`

## 项目结构

\`\`\`
src/
├── components/          # 组件目录
│   ├── bpmn/           # BPMN相关组件
│   ├── properties/     # 属性面板组件
│   ├── templates/      # 模板管理组件
│   └── attachments/    # 附件管理组件
├── stores/             # Pinia状态管理
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── styles/             # 样式文件
├── views/              # 页面组件
└── router/             # 路由配置

tests/                  # 测试文件
├── unit/               # 单元测试
├── integration/        # 集成测试
└── e2e/                # 端到端测试

docs/                   # 📚 文档目录
├── README.md               # 文档导航
├── implementation-plan.md  # 实施计划
├── 属性面板测试指南.md     # 基础功能测试
├── 动态表单功能测试指南.md  # 高级功能测试
└── Vue代理冲突修复说明.md  # 兼容性问题修复
\`\`\`

## 开发指南

### 核心概念

1. **BpmnService**: BPMN.js 服务封装类，负责建模器的初始化、事件管理和API调用
2. **BpmnStore**: Pinia 状态管理，管理流程数据、选中元素和属性信息
3. **BpmnModeler**: 主要的建模器Vue组件，提供完整的建模界面

### 事件系统

建模器使用事件驱动架构：

- `selection.changed`: 元素选择变化
- `elements.changed`: 元素修改
- `element.added`: 元素添加
- `element.removed`: 元素删除

### 自定义开发

参考 `CLAUDE.md` 文件了解详细的开发指南和架构说明。

## 📚 文档中心

完整的项目文档位于 `docs/` 目录：

- **[docs/README.md](./docs/README.md)** - 文档导航中心
- **[docs/属性面板测试指南.md](./docs/属性面板测试指南.md)** - 功能测试指南  
- **[docs/动态表单功能测试指南.md](./docs/动态表单功能测试指南.md)** - 高级功能说明
- **[docs/Vue代理冲突修复说明.md](./docs/Vue代理冲突修复说明.md)** - 技术问题修复

## 开发状态

当前项目已完成Phase 4，具备企业级BPMN建模能力：

- ✅ **Phase 1**: 基础架构搭建 (完成)
  - Vue 3 + TypeScript 项目初始化
  - BPMN.js 集成和封装
  - Element Plus UI 配置
  - 基础建模器组件

- ✅ **Phase 2**: 节点UI统一封装 (完成)
- ✅ **Phase 3**: 自定义属性系统 (完成)
- ✅ **Phase 4**: 属性面板系统 (完成)
  - 动态表单生成
  - 执行监听器配置
  - 扩展属性管理

- 🚧 **Phase 5**: 节点模板系统 (即将开始)
- ⏳ **Phase 6**: 附件管理系统 (计划中)
- ⏳ **Phase 7**: 流程模板系统 (计划中)

详细实施计划请查看 `docs/implementation-plan.md`。

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。