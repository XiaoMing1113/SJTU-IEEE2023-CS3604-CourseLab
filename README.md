# 🚂 12306 网页复现项目 (AI Agent 协作开发版)

本项目旨在利用 AI Agent 工作流与人工协同，对 12306 购票网站的核心功能与前端界面进行高保真复刻。

---

## 📂 项目结构说明

为保持项目整洁，我们将代码进行了分层管理：

- **`core/`**: **[核心工作区]** 项目的主代码库。
  - `frontend/`: 前端 React 项目源码。
  - `backend/`: 后端服务源码。
  - `Implement/` & `Reference/`: AI Agent 的中间产物和参考资料。
- **`_archive/`**: **[归档区]** 存放历史废弃版本、测试脚本及旧的文档。
- **`scripts/`**: 项目辅助工具（如网页解构爬虫）。

---

## 🚀 如何启动项目 (Quick Start)

请按照以下步骤启动前端和后端服务。

### 1. 前端启动 (Frontend)

前端基于 React + Vite + Ant Design 构建。

```bash
# 1. 进入前端目录 (注意：是在 core 目录下)
cd core_1/frontend

# 2. 安装依赖 (初次运行或 package.json 变更时执行)
npm install

# 3. 启动开发服务器
npm run dev
```

启动成功后，请访问终端提示的地址（通常为 `http://localhost:5173`）。

### 2. 后端启动 (Backend)

后端基于 Node. Js + TypeScript + Prisma 构建。

```bash
# 1. 新开一个终端窗口，进入后端目录
cd core_1/backend

# 2. 安装依赖
npm install

# 3. 初始化数据库客户端 (重要！防止报错)
npx prisma generate

# 4. 启动后端服务
npm run dev
```

## 测试驱动

### 测试架构

我们遵循 **测试金字塔** 原则，测试文件按 **页面/功能模块** 进行物理隔离（目前我们已完成前端测试案例规范化，后端尚未完成）：

```text
core_1/frontend/test
├── pages/                  # 按页面分类的前端测试
│   ├── P001_Home/
│   │   ├── unit/           # 单元测试 (纯逻辑/工具函数)
│   │   ├── component/      # 组件测试 (UI渲染与交互)
│   │   └── integration/    # 页面级集成测试
│   └── P003_Login/ ...
├── components/                # 通用组件测试
│   └── modules/ ...
└── e2e/                    # 端到端全链路测试(尚未实现，预期后续进行)
```

### 测试运行

请确保你已进入 frontend (前端测试) 或 backend (后端测试) 目录。

🟢 运行全部测试
执行所有单元、组件和集成测试，生成覆盖率报告。

```bash
npm test
```

🎯 运行指定模块 (推荐)
无需等待所有测试跑完，只运行你正在开发的模块。Vitest 支持模糊匹配路径。

```bash
# 场景：只测 P001 首页的所有内容
npm test P001

# 场景：只测登录页的组件
npm test P003_Login/component

# 场景：只测 Header 组件
npm test Header
```

---

## 🛠 开发与协作规范 (Git Workflow & Issues)

本项目采用 **GitHub Issues** 驱动的开发模式。请严格遵守以下规范以确保任务可追踪。

### 🚫 三大红线 (Don'ts)
1. **禁止** 直接在 `main` 分支上修改代码！`main` 分支应永远保持可运行状态。
2. **禁止** 提交 `node_modules`、`.env` 等配置文件（已配置 .gitignore）。
3. **禁止** 通过复制文件夹（如 `demo_日期`）来备份代码。请使用 Git 提交来保存进度。

### ✅ 正确的开发流程 (Do's)

#### 第一步：领取任务与创建分支
在开始工作前，请先在 GitHub 上创建或认领一个 **Issue**。

```bash
# 确保在主分支并同步最新代码
git checkout main
git pull

# 创建并切换到你的分支
# 推荐命名格式：类型/issue编号-描述
# 示例：feat/issue-12-login-page (对应 12 号 Issue)
git checkout -b feat/issue-编号-简短描述
```

#### 第二步：开发与提交 (关联 Issue)
在分支中进行开发。**提交时请务必关联 Issue**。

```bash
git add .

# 场景 A：常规提交（关联 Issue，但不关闭）
# 语法：Refs #编号
git commit -m "feat: 完成登录框样式布局 (Refs #12)"

# 场景 B：完成任务提交（合并后自动关闭 Issue）
# 语法：Closes #编号 或 Fixes #编号
git commit -m "fix: 修复白屏问题，完成开发 (Closes #12)"
```

*Commit Message 格式建议：`类型: 简短描述 (Refs/Closes #编号)`*

#### 第三步：合并回主分支
确认功能开发完成且测试无误后，将代码合并回主分支：

```bash
# 1. 切回主分支
git checkout main

# 2. 拉取队友可能更新的代码
git pull

# 3. 合并你的分支
git merge feat/issue-编号-简短描述

# 4. 推送到远程仓库 (此时 GitHub 会自动处理 Issue 状态)
git push
```

#### 第四步：清理
合并完成后，删除已无用的功能分支：
```bash
git branch -d feat/issue-编号-简短描述
```

---

## 📝 常用命令速查

- **查看当前分支**：`git branch`
- **查看状态**（有没有没保存的文件）：`git status`
- **放弃本地修改**（慎用）：`git checkout .`
