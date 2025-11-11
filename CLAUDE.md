# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a BPMN.js modeler frontend extension project built with Vue 3. The project aims to create a comprehensive business process modeling tool with enhanced UI, custom node properties, templates, and attachment management capabilities.

## Project Structure & Organization

- **tests/**: All test code should be placed in this directory
- **docs/**: Project planning and documentation files
- **BPMN_Modeler_Planning.md**: Contains the complete technical architecture and implementation plan

## Technical Architecture

This project follows a layered architecture approach:

1. **UI Layer**: Vue 3 components with Element Plus
2. **Business Logic Layer**: Custom business rules and workflows  
3. **BPMN Adapter Layer**: Integration with BPMN.js 17.x
4. **Data Management Layer**: Pinia for state management
5. **Utils Layer**: Shared utilities and services

### Technology Stack
- **Frontend**: Vue 3.4+ with Composition API
- **UI Framework**: Element Plus
- **BPMN Engine**: bpmn-js 17.x
- **State Management**: Pinia
- **Router**: Vue Router 4.x
- **Build Tool**: Vite 5.x
- **Language**: TypeScript
- **Styling**: SCSS/Less

## Core Modules

1. **Modeler Core**: BPMN.js integration and extensions
2. **Node Management**: Custom nodes and property systems
3. **UI Components**: Unified interface components
4. **Template System**: Node templates and process templates with version control
5. **Attachment System**: File and resource management with multiple storage providers
6. **Configuration Management**: System settings and user preferences

## Key Development Guidelines

### Development Requirements
- **No mock data, placeholders, or fallbacks allowed** - All functionality must be fully implemented
- All features must have complete, working implementations
- Use real data structures and actual API integrations
- Implement genuine error handling and validation logic

### Component Architecture
- Use Vue 3 Composition API consistently
- Follow the established component structure in `src/components/`
- Implement unified node rendering through custom BPMN.js providers
- Maintain separation between Vue components and BPMN.js DOM manipulation

### Node System
- All custom nodes must extend the base node configuration interface
- Properties are stored in BPMN XML with custom namespaces
- UI configuration is separate from business logic properties
- Support for template inheritance and version management

### Data Management
- Use Pinia stores for application state
- Implement reactive data binding between Vue components and BPMN models
- Ensure proper synchronization between UI state and BPMN model state
- Handle property validation and transformation through extension managers

### Template System
- Node templates support categorization, versioning, and reuse
- Process templates can be instantiated with customization options
- Both systems support drag-and-drop functionality
- Version history and rollback capabilities are required

### Attachment Management
- Support multiple file types with appropriate preview generation
- Implement storage adapters for local, cloud, and database storage
- Maintain metadata and version control for all attachments
- Link attachments to specific nodes within BPMN processes

## Development Notes

### Vue 3 + BPMN.js Integration
- Use Teleport and custom directives to handle Vue/BPMN DOM coordination
- Implement provider pattern for BPMN.js extensions
- Use event bus pattern for communication between layers
- Apply virtual scrolling and lazy loading for performance optimization

### Performance Considerations
- Implement incremental rendering for large process diagrams
- Use virtual scrolling for attachment lists and template galleries
- Apply lazy loading for node properties and attachments
- Optimize bundle size through code splitting

### Extension Points
- Custom node renderers can be registered through NodeRenderer class
- Property extensions use PropertyExtensionManager for validation and transformation
- Template system supports custom instantiation logic
- Attachment system allows custom storage providers

## Project Status

This project is currently in the planning phase. The implementation follows a phased approach:

1. **Phase 1**: Basic Vue 3 + BPMN.js integration
2. **Phase 2**: Node UI unification and component development
3. **Phase 3**: Custom property system implementation
4. **Phase 4**: Template and reuse functionality
5. **Phase 5**: Attachment management system
6. **Phase 6**: Process template system
7. **Phase 7**: Integration testing and optimization

Refer to `BPMN_Modeler_Planning.md` for detailed implementation plans and technical specifications for each phase.