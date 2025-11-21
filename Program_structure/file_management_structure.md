# Agent工作流文件管理结构

## 概述

本文档定义了Prompt1、Prompt2、Prompt3、Prompt4、Prompt5五个Agent的完整文件管理结构，确保从需求提取到测试代码生成的全流程增量开发和文件复用管理。

## 目录结构

```
project_root/
├── .extracts/                    # Prompt1 输出
│   ├── requirements.md           # 需求提取结果
│   ├── functional_requirements.md # 功能需求
│   ├── non_functional_requirements.md # 非功能需求
│   └── extraction_history.md     # 提取历史记录
├── .requirements/                # Prompt2 输出
│   ├── user_stories.md           # 用户故事
│   ├── acceptance_criteria.md    # 验收标准
│   ├── requirements_history.md   # 需求历史记录
│   └── validation_results.md     # 验证结果
├── .artifacts/                   # Prompt3 输出
│   ├── test_scenarios.md         # 测试场景文档
│   ├── architecture_design.md    # 架构设计
│   ├── database_design.md        # 数据库设计
│   ├── ui_mockups.md             # UI设计稿
│   └── design_history.md         # 设计历史记录
├── .interfaces/                  # Prompt4 输出
│   ├── api_design.md             # API接口设计
│   ├── data_models.md            # 数据模型定义
│   ├── interface_specifications.md # 接口规范
│   └── interface_history.md      # 接口历史记录
├── .ui_design/                   # Prompt4.5 输出
│   ├── ui_structure.yml          # 界面结构设计（页面架构、组件库、用户流程）
│   ├── design_system.yml         # 设计系统规范（颜色、字体、间距、动画等）
│   ├── asset_requirements.yml    # 素材需求清单（图片、图标、字体及获取指导）
│   ├── implementation_guide.md   # 开发实现指导（技术选型、文件结构、优先级）
│   └── design_history.md         # UI设计历史记录
├── backend/                      # Prompt5 输出 - 后端代码和测试
│   ├── src/                      # 源代码（代码骨架）
│   │   ├── controllers/          # API控制器
│   │   ├── services/             # 业务逻辑层
│   │   ├── models/               # 数据模型定义
│   │   ├── middleware/           # 中间件
│   │   ├── routes/               # 路由定义
│   │   ├── utils/                # 工具函数
│   │   └── types/                # TypeScript类型定义
│   ├── test/                     # 后端测试文件
│   │   ├── unit/                 # 单元测试
│   │   ├── integration/          # 集成测试（包括前后端协同）
│   │   └── api/                  # API测试
│   ├── prisma/                   # 数据库schema和种子数据
│   └── uploads/                  # 用户上传文件存储
├── frontend/                     # Prompt5 输出 - 前端代码和测试
│   ├── src/                      # 源代码（代码骨架）
│   │   ├── components/           # 可复用React组件
│   │   ├── pages/                # 页面组件
│   │   ├── hooks/                # 自定义React hooks
│   │   ├── services/             # API调用服务
│   │   ├── stores/               # Zustand状态管理
│   │   ├── utils/                # 工具函数
│   │   ├── styles/               # 样式文件
│   │   └── types/                # TypeScript类型定义
│   ├── test/                     # 前端测试文件
│   │   ├── unit/                 # 单元测试
│   │   ├── integration/          # 集成测试（用户流程、API-UI映射）
│   │   └── components/           # 组件测试
│   ├── public/                   # 静态资源
│   └── dist/                     # 构建输出目录
├── test/                         # Prompt5 输出 - 全局测试
│   └── e2e/                      # 端到端测试
├── shared/                       # Prompt5 输出 - 共享代码
│   ├── types/                    # 前后端共享类型
│   └── constants/                # 共享常量
├── docs/                         # 项目文档
├── Prompt/                       # Agent提示词文件
│   ├── Prompt1.txt               # 需求提取Agent
│   ├── Prompt2.txt               # 需求分析Agent
│   ├── Prompt3.txt               # 架构设计Agent
│   ├── Prompt4.txt               # 接口设计Agent
│   ├── Prompt4.5.txt             # UI设计Agent (新增)
│   ├── Prompt5.txt               # 测试自动化Agent (新增)
│   └── Prompt6.txt               # 代码实现Agent (新增)
└── file_management_structure.md  # 本文档
```

## Agent工作流程与文件交互

### Prompt1 (需求提取Agent)

**输入来源:**
- 用户提供的目标信息（网页URL/软件名称/应用名称）
- `.extracts/extracted_requirements.md` (现有提取基线)
- `.extracts/extraction_history.md` (历史记录)
- MCP工具获取的网页信息
- 搜索引擎获取的软件信息

**输出位置:**
- **主要输出**: `.extracts/extracted_requirements.md`
- **历史记录**: `.extracts/extraction_history.md` (追加模式)

**增量策略:**
- **完全重复** → **复用**: 引用现有提取结果
- **部分重复** → **扩展**: 在现有基础上增加新功能
- **全新目标** → **创建**: 进行完整的需求提取

### Prompt2 (需求细化分析Agent)

**输入来源:**
- 用户提供的简单需求描述
- `.extracts/extracted_requirements.md` (来自Prompt1的提取结果)
- `.requirements/detailed_requirements.md` (现有需求基线)
- `.requirements/requirement_history.md` (历史记录)

**输出位置:**
- **主要输出**: `.requirements/detailed_requirements.md`
- **历史记录**: `.requirements/requirement_history.md` (追加模式)

**增量策略:**
- **完全重复** → **复用**: 引用现有需求分析结果
- **部分重复** → **扩展**: 在现有需求基础上增加新要素
- **全新需求** → **创建**: 进行完整的需求分析

### Prompt3 (需求转换Agent)

**输入来源:**
- `.requirements/detailed_requirements.md` (来自Prompt2)
- `.docs/interface_requirements.md` (现有接口需求基线)
- `.docs/conversion_history.md` (历史记录)

**输出位置:**
- **主要输出**: `.docs/interface_requirements.md`
- **历史记录**: `.docs/conversion_history.md` (追加模式)

**增量策略:**
- **完全重复** → **复用**: 引用现有接口需求文档
- **部分重复** → **扩展**: 在现有文档基础上增加新接口需求
- **全新需求** → **创建**: 进行完整的需求转换

### Prompt4 (接口设计Agent)

**输入来源:**
- `.docs/interface_requirements.md` (来自Prompt3)
- `.artifacts/interface_library.md` (现有接口库)
- `.artifacts/design_history.md` (历史记录)
- `.artifacts/interface_templates/` (接口模板)

**输出位置:**
- **主要输出**: `.artifacts/data_interface.yml`、`.artifacts/api_interface.yml`、`.artifacts/ui_interface.yml`
- **接口库更新**: `.artifacts/interface_library.md` (累积模式)
- **历史记录**: `.artifacts/design_history.md` (追加模式)

**增量策略:**
- **完全重复** → **复用**: 直接引用现有接口
- **部分重复** → **扩展**: 基于现有接口进行扩展
- **全新接口** → **创建**: 设计全新接口

### Prompt4.5 (UI设计Agent)

**输入来源:**
- `.docs/interface_requirements.md` (来自Prompt3)
- `.artifacts/ui_interface.yml`, `.artifacts/api_interface.yml` (来自Prompt4)
- `.requirements/detailed_requirements.md` (项目需求)
- 现有UI设计基线: `.ui_design/ui_structure.yml`, `.ui_design/design_system.yml`
- `.ui_design/design_history.md` (历史记录)
- 项目技术栈信息 (package.json等)

**输出位置:**
- **界面结构**: `.ui_design/ui_structure.yml` (页面架构、组件库、用户流程)
- **设计规范**: `.ui_design/design_system.yml` (颜色、字体、间距、动画等)
- **素材需求**: `.ui_design/asset_requirements.yml` (图片、图标、字体及获取指导)
- **实现指导**: `.ui_design/implementation_guide.md` (技术选型、文件结构、优先级)
- **历史记录**: `.ui_design/design_history.md` (追加模式)

**增量策略:**
- **完全重复** → **复用**: 引用现有UI设计方案
- **部分重复** → **扩展**: 在现有设计基础上增加新界面
- **全新项目** → **创建**: 设计完整的UI方案

**特殊功能:**
- **素材需求分析**: 明确所需的图片、图标、字体等素材
- **获取指导**: 提供素材来源和获取方法（免费资源推荐）
- **占位符方案**: 为缺失素材提供替代方案
- **响应式设计**: 考虑多设备适配
- **可访问性**: 考虑无障碍访问需求
- **标准化输出**: 采用YAML格式确保结构化和可解析性

### Prompt5 (测试自动化Agent)

**输入来源:**
- `.interfaces/api_design.md` (来自Prompt4)
- `.ui_design/ui_structure.yml` (来自Prompt4.5)
- `.ui_design/design_system.yml` (来自Prompt4.5)
- `.ui_design/asset_requirements.yml` (来自Prompt4.5)
- `.ui_design/implementation_guide.md` (来自Prompt4.5)
- `.artifacts/test_scenarios.md` (来自Prompt3)
- 现有项目代码结构 (backend/, frontend/, shared/)
- 现有测试文件基线 (如果存在)
- `.prompt5_history/test_generation_history.md` (历史记录)

**输出位置:**
- `backend/src/` - 后端代码骨架 (controllers/, services/, models/, etc.)
- `backend/test/` - 后端测试文件 (unit/, integration/, api/)
- `frontend/src/` - 前端代码骨架 (components/, pages/, hooks/, etc.)
- `frontend/test/` - 前端测试文件 (unit/, integration/, components/)
- `test/e2e/` - 端到端测试文件
- `shared/` - 共享类型和常量
- `docs/` - 项目文档
- 项目根目录配置文件 (vitest.config.js, jest.config.js, playwright.config.js等)
- `.prompt5_history/` - 测试生成历史记录 (追加模式)

**增量策略:**
- **完全重复** → **复用**: 引用现有代码结构和测试文件
- **部分重复** → **扩展**: 在现有代码基础上增加新功能和测试
- **全新功能** → **创建**: 生成全新的代码文件和测试文件

**特殊功能:**
- **智能复用**: 分析现有代码结构，复用可重用的代码模式
- **全局集成测试**: 生成前后端协同验证测试
- **UI完整性验证**: 确保每个后端功能都有前端界面
- **多层次测试**: 单元→集成→端到端的完整测试覆盖

## 文件格式规范

### 历史记录文件格式

所有历史记录文件采用统一格式：

```markdown
# [Agent名称] 历史记录

## [YYYY-MM-DD HH:MM:SS] - [操作类型]

**输入摘要**: [简要描述输入内容]
**操作类型**: [复用/扩展/创建]
**主要变更**: [描述主要变更内容]
**影响范围**: [描述影响的功能模块]

---
```

### 测试文件格式规范

#### 测试历史记录格式 (.prompt5_history/test_generation_history.md)

```markdown
# 测试自动化历史记录

## [YYYY-MM-DD HH:MM:SS] - [操作类型]

**输入接口**: [接口文件列表]
**测试场景**: [测试场景文件]
**操作类型**: [复用/扩展/创建]
**生成的代码骨架**: 
- backend/src/: [生成的后端文件列表]
- frontend/src/: [生成的前端文件列表]
- shared/: [生成的共享文件列表]
**生成的测试文件**:
- backend/test/: [后端测试文件列表]
- frontend/test/: [前端测试文件列表]
- test/e2e/: [端到端测试文件列表]
**配置文件**: [生成的配置文件列表]
**UI完整性检查**: [通过/失败 - 详细说明]
**前后端协同验证**: [验证结果说明]

---
```

#### 测试文件命名规范

- **前端单元测试**: `frontend/test/unit/[组件名].test.tsx`
- **前端集成测试**: 
  - `frontend/test/integration/user-flow.test.tsx` (用户流程测试)
  - `frontend/test/integration/api-ui-mapping.test.tsx` (API与UI映射验证)
- **后端单元测试**: `backend/test/unit/[模块名].test.js`
- **后端集成测试**: `backend/test/integration/frontend-backend.test.js` (前后端协同测试)
- **API测试**: `backend/test/api/[接口名].test.js`
- **端到端测试**: `test/e2e/complete-booking.spec.js` (完整业务流程)
- **代码骨架**: 直接生成到项目源码目录，遵循项目文件命名规范

### 版本管理策略

1. **主要输出文件**: 每次完全重写，保持最新状态
2. **历史记录文件**: 追加模式，保留完整历史
3. **接口库文件**: 累积模式，只增加不删除，标记废弃状态
4. **测试文件**: 增量模式，新增测试不删除旧测试，标记过期状态
5. **代码骨架**: 覆盖模式，保持与最新接口设计同步

## 复用决策流程

### 1. 读取阶段
每个Agent首先读取相关的现有文件，建立当前基线。

### 2. 比较分析
将新输入与现有内容进行比较，识别重复度。

### 3. 决策执行
- **重复度 > 90%**: 复用现有内容
- **重复度 50-90%**: 扩展现有内容
- **重复度 < 50%**: 创建新内容

### 4. 输出更新
根据决策结果更新相应文件，并记录历史。

## 注意事项

1. **文件路径**: 所有路径均为相对于项目根目录的相对路径
2. **权限管理**: 确保Agent有读写相应目录的权限
3. **备份策略**: 建议定期备份历史记录文件
4. **清理策略**: 历史记录文件过大时可考虑归档处理
5. **并发处理**: 多Agent同时工作时需要考虑文件锁定机制
6. **测试文件管理特殊注意事项**:
   - **测试依赖**: 确保测试配置文件与项目技术栈匹配
   - **代码骨架同步**: 代码骨架必须与最新接口设计保持一致
   - **UI完整性强制检查**: Prompt5必须验证每个后端功能都有前端界面
   - **测试分层**: 严格按照单元→集成→端到端的层次组织测试文件
   - **前后端协同**: 集成测试必须验证前后端接口的正确对接

## 使用示例

### 场景1: 从现有软件提取需求（完整流程）
1. 用户提供目标软件 → Prompt1分析提取 → `.extracts/extracted_requirements.md`
2. Prompt2读取提取结果 → 细化分析 → `.requirements/detailed_requirements.md`
3. Prompt3读取需求文档 → 转换 → `.docs/interface_requirements.md` + `.tests/test_scenarios.md`
4. Prompt4读取接口需求 → 设计 → `.artifacts/data_interface.yml`、`.artifacts/api_interface.yml`、`.artifacts/ui_interface.yml`
5. Prompt5读取接口设计和测试场景 → 生成代码骨架到 `backend/src/`、`frontend/src/`、`shared/` → 生成测试文件到 `backend/test/`、`frontend/test/`、`test/e2e/`

### 场景2: 直接输入简单需求
1. 用户提供简单需求 → Prompt2直接分析 → `.requirements/detailed_requirements.md`
2. Prompt3读取需求文档 → `.docs/interface_requirements.md` + `.tests/test_scenarios.md`
3. Prompt4读取接口需求 → `.artifacts/data_interface.yml`、`.artifacts/api_interface.yml`、`.artifacts/ui_interface.yml`
4. Prompt5读取接口设计和测试场景 → 生成代码骨架到 `backend/src/`、`frontend/src/`、`shared/` → 生成测试文件到 `backend/test/`、`frontend/test/`、`test/e2e/`

### 场景3: 增量开发
1. 用户提供新目标/需求 → Prompt1/Prompt2读取现有文件 → 扩展/复用决策 → 更新文档
2. Prompt3读取更新后的需求 → 扩展/复用决策 → 更新接口需求和测试场景
3. Prompt4读取接口需求和接口库 → 扩展/复用决策 → 更新接口设计
4. Prompt5读取更新后的接口和测试场景 → 扩展/复用决策 → 更新代码骨架 (`backend/src/`、`frontend/src/`、`shared/`) 和测试文件 (`backend/test/`、`frontend/test/`、`test/e2e/`)

### 场景4: 混合输入
1. 用户同时提供目标软件和自定义需求 → Prompt1提取 + 用户需求 → Prompt2整合分析
2. 后续流程同场景1

### 场景5: 仅测试代码生成（Prompt5独立使用）
1. 用户提供接口变更需求 → Prompt5读取现有接口文件和项目结构 → 智能复用决策
2. 基于现有测试场景和接口设计 → 生成增量代码骨架到项目目录 (`backend/src/`、`frontend/src/`、`shared/`)
3. 生成对应的测试文件到测试目录 (`backend/test/`、`frontend/test/`、`test/e2e/`)
4. 重点关注前后端协同和UI完整性验证

这种结构确保了每个Agent都能有效地进行增量开发，避免重复工作，提高开发效率。