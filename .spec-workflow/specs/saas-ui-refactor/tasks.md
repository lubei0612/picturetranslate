# Tasks: SaaS UI 重构与后端增强

## 概述
采用 **方案 B + C 混合**：渐进式迁移 + 外部设计稿 Staging 清洗
严格遵循 AGENTS.md 迭代式开发：骨架 → 主流程 → 填充 → 优化

---

## Phase 0: 契约先行 (Interface/Type 定义)

### Task 0.1: 前端共享类型定义
- [x] 0.1.1 创建 `frontend/src/shared/types/project.ts` - Project Interface
- [x] 0.1.2 创建 `frontend/src/shared/types/layer.ts` - TextLayer/LayerStyle Interface
- [x] 0.1.3 创建 `frontend/src/shared/types/api.ts` - ApiResponse/JobResponse/ErrorCode
- [x] 0.1.4 创建 `frontend/src/shared/types/index.ts` - 统一导出

**执行模型**: Claude
**预估耗时**: 30 min
**_Requirements**: REQ-1.2, REQ-5.1
**_Prompt**:
```
Role: TypeScript 类型系统专家
Task: 根据 design.md 中的 Interface 定义，创建前端共享类型文件
Restrictions: 严格遵循 design.md 字段定义，使用 const enum 优化 bundle
Success: 所有 Interface 无编译错误，类型完整覆盖 Project/TextLayer/ApiResponse
```

---

### Task 0.2: 后端 Pydantic Schema 定义
- [ ] 0.2.1 创建 `api/schemas/layer.py` - TextLayerCreate/Update/Response
- [ ] 0.2.2 创建 `api/schemas/engine.py` - EngineInfo/EngineListResponse
- [ ] 0.2.3 创建 `api/schemas/job.py` - JobCreate/JobStatus/JobResponse
- [ ] 0.2.4 更新 `api/schemas/__init__.py` - 统一导出

**执行模型**: Codex
**预估耗时**: 30 min
**_Requirements**: REQ-4.3, REQ-5.1, REQ-6
**_Prompt**:
```
Role: FastAPI/Pydantic 后端开发专家
Task: 创建 API Schema 定义，确保与前端 Interface 字段 1:1 映射
Restrictions: 使用 Pydantic V2 语法，添加字段校验 (bbox 长度=4, version>=1)
Success: Schema 定义完整，OpenAPI 文档自动生成
```

---

### Task 0.3: 契约双重确认 (Critical Checkpoint)
- [ ] 0.3.1 Claude 审查：前端 Interface 是否覆盖所有 UI 场景
- [ ] 0.3.2 Codex 审查：后端 Schema 是否可高效实现
- [ ] 0.3.3 确认字段映射一致性
- [ ] 0.3.4 锁定 Interface，禁止后续随意修改

**执行模型**: Claude + Codex
**预估耗时**: 20 min
**_Requirements**: Section 15.4
**_Prompt**:
```
Role: 架构审查员
Task: 双方确认 Interface/Schema 契约
Output: Status: INTERFACE_LOCKED 或 提出修改意见
```

---

### Task 0.4: Phase 0 存档
- [ ] 0.4.1 Git add + commit: `feat(contract): 定义前后端接口契约`
- [ ] 0.4.2 确保代码可运行

**执行模型**: Claude
**预估耗时**: 5 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 0 → Phase 1)
**建议执行模型切换**: `/model codex`
**Codex 需关注**: 后端策略模式实现、数据库设计、性能优化

---

## Phase 1: 后端骨架 (Skeleton)

### Task 1.1: 翻译引擎抽象层
- [x] 1.1.1 创建 `core/engines/__init__.py`
- [x] 1.1.2 创建 `core/engines/base.py` - TranslateEngine ABC + TranslateResult
- [x] 1.1.3 创建 `core/engines/registry.py` - EngineRegistry 单例 + 熔断逻辑
- [x] 1.1.4 创建 `core/engines/retry.py` - 重试装饰器 (指数退避)

**执行模型**: Codex
**预估耗时**: 45 min
**_Requirements**: REQ-4.1
**_Prompt**:
```
Role: Python 后端架构师
Task: 实现翻译引擎策略模式抽象层
Restrictions: TranslateEngine 必须是 ABC，熔断逻辑：连续 3 次失败标记 unhealthy
Success: 新增引擎只需创建文件 + 注册，无需修改核心代码
```

---

### Task 1.2: 阿里云引擎适配
- [x] 1.2.1 创建 `core/engines/aliyun.py` - AliyunEngine 实现
- [x] 1.2.2 迁移 `core/processor.py` 逻辑到新引擎（保留原文件兼容）
- [x] 1.2.3 在 `core/engines/__init__.py` 注册引擎
- [x] 1.2.4 添加健康检查实现

**执行模型**: Codex
**预估耗时**: 60 min
**_Requirements**: REQ-4.2
**_Prompt**:
```
Role: 阿里云 API 集成专家
Task: 将现有 processor.py 的阿里云翻译逻辑封装为策略模式引擎
Restrictions: 保持现有功能完全兼容，不修改 processor.py 原文件
Success: 现有翻译功能不受影响，引擎可通过 Registry 获取
```

---

### Task 1.3: TextLayer 数据模型
- [x] 1.3.1 创建 `models/text_layer.py` - TextLayer ORM
- [x] 1.3.2 更新 `models/translation.py` - 添加 layers relationship
- [x] 1.3.3 创建迁移脚本 `migrations/add_text_layers.sql`
- [x] 1.3.4 更新 `core/database.py` - 注册新模型

**执行模型**: Codex
**预估耗时**: 45 min
**_Requirements**: REQ-5.1
**_Prompt**:
```
Role: SQLAlchemy/数据库设计专家
Task: 创建 text_layers 表并与 translations 表建立关联
Restrictions: 外键 ON DELETE CASCADE，version 字段用于乐观锁，bbox 存储为 JSON
Success: 迁移脚本可重复执行，ORM 关系查询正常
```

---

### Task 1.4: Layer 服务层
- [x] 1.4.1 创建 `services/layer_service.py` - LayerService CRUD
- [x] 1.4.2 实现乐观锁更新逻辑 (version 校验)
- [x] 1.4.3 实现批量更新方法
- [x] 1.4.4 添加单元测试 `tests/test_layer_service.py`

**执行模型**: Codex
**预估耗时**: 60 min
**_Requirements**: REQ-5.2
**_Prompt**:
```
Role: 后端服务层开发专家
Task: 实现 TextLayer CRUD 服务，重点处理并发更新场景
Restrictions: 更新时必须校验 version，不匹配抛出 VersionConflictError
Success: 单元测试覆盖率 > 80%，批量更新原子性验证通过
```

---

### Task 1.5: 后端 API 端点
- [x] 1.5.1 创建 `api/routes/engines.py` - GET /api/engines
- [x] 1.5.2 创建 `api/routes/layers.py` - GET/PATCH/POST 端点
- [x] 1.5.3 修改 `api/routes/translate.py` - 添加 engine 参数
- [x] 1.5.4 注册所有路由到 `api/main.py`
- [x] 1.5.5 添加集成测试

**执行模型**: Codex
**预估耗时**: 90 min
**_Requirements**: REQ-4.3, REQ-5.2
**_Prompt**:
```
Role: FastAPI 路由开发者
Task: 实现所有新增 API 端点
Restrictions: 版本冲突返回 409 + 最新数据，保持向后兼容
Success: 所有端点返回正确响应，Swagger 文档显示正常
```

---

### Task 1.6: Phase 1 QA 交付物
- [x] 1.6.1 输出风险列表（高/中/低）
- [x] 1.6.2 性能分析：引擎切换延迟、数据库索引
- [x] 1.6.3 可能 bug：并发冲突、熔断误判
- [x] 1.6.4 维护难点：多引擎配置管理

**执行模型**: Codex
**预估耗时**: 15 min
**_Requirements**: Section 5

---

### Task 1.7: Phase 1 存档
- [x] 1.7.1 运行所有后端测试确保通过
- [x] 1.7.2 Git add + commit: `feat(backend): 实现翻译引擎策略模式和 Layer API`
- [x] 1.7.3 验证 Docker 构建

**执行模型**: Codex
**预估耗时**: 10 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 1 → Phase 2)
**建议执行模型切换**: `/model gemini`
**Gemini 需关注**: UI 组件树设计、交互流程、视觉层级

---

## Phase 2: Gemini UI 设计

### Task 2.1: 组件树设计
- [ ] 2.1.1 Dashboard 组件树（ProjectCard/Grid/UploadZone/FilterBar）
- [ ] 2.1.2 Editor 组件树（ImageViewer/LayerList/LayerPanel/Toolbar）
- [ ] 2.1.3 History 组件树（HistoryList/HistoryItem）
- [ ] 2.1.4 Settings 组件树（EngineSelector/LanguageConfig）
- [ ] 2.1.5 Shared 组件树（Button/Modal/Toast/Skeleton/EmptyState）

**执行模型**: Gemini
**预估耗时**: 60 min
**_Requirements**: Section 10.1, 10.2
**_Prompt**:
```
Role: 产品设计师
Task: 基于设计稿输出完整组件树结构
Output: 每个组件的 Props 定义、状态流、父子关系图
Format: Markdown + Mermaid 图
```

---

### Task 2.2: 交互流程设计
- [ ] 2.2.1 上传翻译流程（Happy Path）
- [ ] 2.2.2 图层编辑流程
- [ ] 2.2.3 历史浏览流程
- [ ] 2.2.4 错误状态流程

**执行模型**: Gemini
**预估耗时**: 45 min
**_Requirements**: Section 10.1
**_Prompt**:
```
Role: 交互设计师
Task: 设计核心用户流程
Output: 流程图 + 状态转换图
```

---

### Task 2.3: 响应式布局方案
- [ ] 2.3.1 Desktop 布局（>= 1024px）
- [ ] 2.3.2 Tablet 布局（768px - 1024px）
- [ ] 2.3.3 Mobile 布局（< 768px）
- [ ] 2.3.4 断点切换策略

**执行模型**: Gemini
**预估耗时**: 30 min
**_Requirements**: REQ-3.1
**_Prompt**:
```
Role: 响应式设计专家
Task: 设计三端布局方案
Output: 线框图 + 组件变形规则
```

---

### Task 2.4: Phase 2 存档
- [ ] 2.4.1 将 Gemini 设计输出保存到 `.spec-workflow/specs/saas-ui-refactor/ui-design.md`
- [ ] 2.4.2 Git add + commit: `docs(design): Gemini UI 组件树和交互流程设计`

**执行模型**: Gemini
**预估耗时**: 10 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 2 → Phase 3)
**建议执行模型切换**: `/model claude`
**Claude 需关注**: 外部代码 Staging 清洗、Feature Slicing 目录结构

---

## Phase 3: 前端骨架 + Staging 清洗

### Task 3.1: 目录结构搭建
- [ ] 3.1.1 创建 `frontend/src/features/` 目录结构（空壳）
- [ ] 3.1.2 创建 `frontend/src/shared/` 目录结构
- [ ] 3.1.3 创建 `frontend/src/layouts/` 目录结构
- [ ] 3.1.4 配置 tsconfig.json paths 别名 (@/)

**执行模型**: Claude
**预估耗时**: 20 min
**_Requirements**: REQ-1.1, Section 15.1
**_Prompt**:
```
Role: 前端架构师
Task: 按 Feature Slicing 规范创建目录骨架
Restrictions: 仅创建目录和 index.ts 导出文件，暂不实现具体组件
Success: import @ 别名可用，目录结构符合 AGENTS.md 15.1
```

---

### Task 3.2: 设计稿 Staging 暂存
- [ ] 3.2.1 创建 `frontend/_staging/` 目录
- [ ] 3.2.2 复制设计稿 `crossborder-ai/components/*.tsx` 到 `_staging/`
- [ ] 3.2.3 复制设计稿 `crossborder-ai/types.ts` 到 `_staging/`
- [ ] 3.2.4 复制设计稿 `crossborder-ai/constants.ts` 到 `_staging/`

**执行模型**: Claude
**预估耗时**: 10 min
**_Requirements**: Section 16.1
**_Prompt**:
```
Role: 代码迁移专员
Task: 将外部设计稿代码暂存到 _staging 目录
Restrictions: 不修改任何文件内容，仅复制
```

---

### Task 3.3: Staging 代码审查
- [ ] 3.3.1 分析 _staging 代码结构和依赖
- [ ] 3.3.2 识别需要替换的 fetch/axios 请求
- [ ] 3.3.3 识别需要替换的 hardcoded 样式
- [ ] 3.3.4 输出拆解计划（哪些代码去哪个 feature）

**执行模型**: Claude
**预估耗时**: 30 min
**_Requirements**: Section 16.2
**_Prompt**:
```
Role: 代码审查员
Task: 审查 _staging 代码，输出外科手术拆解计划
Output: 每个文件的目标位置、需要修改的点
```

---

### Task 3.4: 共享组件拆解
- [ ] 3.4.1 从 _staging 提取 Button 样式 → `shared/components/Button.tsx`
- [ ] 3.4.2 创建 `shared/components/Modal.tsx`（新建，参考设计稿样式）
- [ ] 3.4.3 创建 `shared/components/Toast.tsx`（新建，Context 管理）
- [ ] 3.4.4 创建 `shared/components/Skeleton.tsx`
- [ ] 3.4.5 创建 `shared/components/EmptyState.tsx`
- [ ] 3.4.6 替换所有 hardcoded 样式为 Tailwind

**执行模型**: Claude
**预估耗时**: 90 min
**_Requirements**: Section 16.2, REQ-2
**_Prompt**:
```
Role: React 组件重构专家
Task: 从 _staging 提取并清洗共享组件
Restrictions: 使用 Tailwind CSS，组件接受 className prop
Success: 组件样式与设计稿一致，无 hardcoded 样式
```

---

### Task 3.5: 共享 Hooks 和 API Client
- [ ] 3.5.1 创建 `shared/hooks/useBreakpoint.ts`
- [ ] 3.5.2 创建 `shared/hooks/useJobPolling.ts`
- [ ] 3.5.3 创建 `shared/hooks/useOptimisticUpdate.ts`
- [ ] 3.5.4 创建 `shared/api/client.ts` - Axios 实例 + 拦截器
- [ ] 3.5.5 创建 `shared/api/errorHandler.ts`

**执行模型**: Claude
**预估耗时**: 60 min
**_Requirements**: REQ-1.2, Section 15.2
**_Prompt**:
```
Role: React Hooks 专家
Task: 创建共享 Hooks 和统一 API Client
Restrictions: 所有 Hook 需清理副作用，API Client 替换设计稿中的 fetch
Success: Hooks 可独立测试，无内存泄漏
```

---

### Task 3.6: 布局组件
- [ ] 3.6.1 创建 `layouts/DesktopLayout.tsx` - 侧边栏 + 主区域
- [ ] 3.6.2 创建 `layouts/MobileLayout.tsx` - 底部导航 + 抽屉
- [ ] 3.6.3 创建 `layouts/index.ts` - 自动切换逻辑

**执行模型**: Claude
**预估耗时**: 60 min
**_Requirements**: REQ-3.1
**_Prompt**:
```
Role: 响应式布局专家
Task: 基于 Gemini 设计创建布局组件
Restrictions: 使用 useBreakpoint 自动切换，参考设计稿 Sidebar.tsx 样式
Success: 768px 以下显示 Mobile 布局
```

---

### Task 3.7: 路由骨架 + Happy Path
- [ ] 3.7.1 安装 React Router v6
- [ ] 3.7.2 配置路由：/ (Dashboard), /editor/:id, /history, /settings
- [ ] 3.7.3 创建空壳页面组件（仅显示页面名称）
- [ ] 3.7.4 验证 Happy Path：首页 → 上传 → 跳转编辑器 → 返回

**执行模型**: Claude
**预估耗时**: 30 min
**_Requirements**: Section 14.1 骨架阶段
**_Prompt**:
```
Role: React Router 专家
Task: 配置路由骨架，跑通 Happy Path
Restrictions: 页面组件先用空壳，仅验证路由跳转
Success: 所有路由可访问，Happy Path 流程通畅
```

---

### Task 3.8: Phase 3 QA 交付物
- [ ] 3.8.1 输出风险列表
- [ ] 3.8.2 _staging 清洗完成度检查
- [ ] 3.8.3 未处理的设计稿代码清单

**执行模型**: Claude
**预估耗时**: 15 min
**_Requirements**: Section 5

---

### Task 3.9: Phase 3 存档
- [ ] 3.9.1 运行前端 lint + typecheck
- [ ] 3.9.2 Git add + commit: `feat(frontend): 骨架目录结构 + 共享组件 + 路由`
- [ ] 3.9.3 验证 Happy Path 可运行

**执行模型**: Claude
**预估耗时**: 10 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 3 → Phase 4)
**继续使用模型**: Claude
**Claude 需关注**: 逐个模块填充，先 Dashboard 后 Editor

---

## Phase 4: 前端填充 (Flesh) - 逐模块实现

### Task 4.1: Dashboard 模块拆解合并
- [ ] 4.1.1 从 _staging/Dashboard.tsx 提取 → `features/dashboard/components/`
- [ ] 4.1.2 替换 fetch 为 shared/api/client
- [ ] 4.1.3 替换 hardcoded 样式为 Tailwind
- [ ] 4.1.4 创建 `features/dashboard/hooks/useProjects.ts`
- [ ] 4.1.5 创建 `features/dashboard/api/projectApi.ts`
- [ ] 4.1.6 导出 DashboardPage

**执行模型**: Claude
**预估耗时**: 90 min
**_Requirements**: REQ-2.1, Section 16.1
**_Prompt**:
```
Role: React 前端开发专家
Task: 从 _staging 外科手术拆解 Dashboard 组件
Restrictions: 符合 Feature Slicing，UI 层只调用 Hooks
Success: UI 与设计稿一致，功能正常
```

---

### Task 4.2: Editor 模块拆解合并
- [ ] 4.2.1 从 _staging/Editor.tsx 提取 → `features/editor/components/`
- [ ] 4.2.2 创建 ImageViewer（双栏展示）
- [ ] 4.2.3 创建 LayerList + LayerPanel
- [ ] 4.2.4 创建 Toolbar（裁剪/消除笔/撤销/重做/保存）
- [ ] 4.2.5 创建 `features/editor/hooks/useLayers.ts` - 集成 useOptimisticUpdate
- [ ] 4.2.6 创建 `features/editor/api/layerApi.ts`
- [ ] 4.2.7 导出 EditorPage

**执行模型**: Claude
**预估耗时**: 150 min
**_Requirements**: REQ-2.2, Section 16.1
**_Prompt**:
```
Role: 复杂交互组件开发专家
Task: 从 _staging 外科手术拆解 Editor 组件
Restrictions: 图层编辑集成乐观更新，版本冲突正确提示
Success: 图层编辑实时同步后端
```

---

### Task 4.3: History 模块
- [ ] 4.3.1 从现有 components/History.tsx 迁移到 `features/history/`
- [ ] 4.3.2 重构为 Feature Slicing 结构
- [ ] 4.3.3 添加时间线分组显示
- [ ] 4.3.4 导出 HistoryPage

**执行模型**: Claude
**预估耗时**: 45 min
**_Requirements**: REQ-2.3
**_Prompt**:
```
Role: 列表组件开发专家
Task: 迁移并重构 History 模块
Restrictions: 复用现有 useHistory hook，添加时间线分组
Success: 时间线分组正确，批量操作正常
```

---

### Task 4.4: Settings 模块
- [ ] 4.4.1 创建 `features/settings/components/EngineSelector.tsx`
- [ ] 4.4.2 创建 `features/settings/components/LanguageConfig.tsx`
- [ ] 4.4.3 创建 `features/settings/hooks/useSettings.ts`
- [ ] 4.4.4 添加 Demo 模式开关
- [ ] 4.4.5 导出 SettingsPage

**执行模型**: Claude
**预估耗时**: 45 min
**_Requirements**: REQ-2.4
**_Prompt**:
```
Role: 表单组件开发专家
Task: 创建 Settings 模块
Restrictions: 调用 /api/engines 获取引擎列表，设置持久化到 localStorage
Success: 引擎选择、语言配置、Demo 开关均正常工作
```

---

### Task 4.5: 清理 _staging
- [ ] 4.5.1 确认所有 _staging 代码已拆解完成
- [ ] 4.5.2 删除 `frontend/_staging/` 目录
- [ ] 4.5.3 删除旧版 `frontend/src/components/` 目录

**执行模型**: Claude
**预估耗时**: 10 min
**_Requirements**: Section 16.1

---

### Task 4.6: Phase 4 QA 交付物
- [ ] 4.6.1 输出风险列表
- [ ] 4.6.2 性能分析：组件渲染、API 调用频率
- [ ] 4.6.3 可能 bug：状态同步、路由切换
- [ ] 4.6.4 未实现功能清单

**执行模型**: Claude
**预估耗时**: 20 min
**_Requirements**: Section 5

---

### Task 4.7: Phase 4 存档
- [ ] 4.7.1 运行前端 lint + typecheck + build
- [ ] 4.7.2 Git add + commit: `feat(frontend): 完成所有页面模块填充`
- [ ] 4.7.3 验证完整流程可运行

**执行模型**: Claude
**预估耗时**: 15 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 4 → Phase 5)
**继续使用模型**: Claude
**Claude 需关注**: H5 适配、性能优化

---

## Phase 5: 优化 (Refine) - H5 适配 + 性能

### Task 5.1: 移动端 Dashboard 适配
- [ ] 5.1.1 ProjectGrid 单列布局（< 768px）
- [ ] 5.1.2 FilterBar 折叠为图标按钮
- [ ] 5.1.3 添加下拉刷新

**执行模型**: Claude
**预估耗时**: 45 min
**_Requirements**: REQ-3.1

---

### Task 5.2: 移动端 Editor 适配
- [ ] 5.2.1 ImageViewer 改为 Tab 切换（原图/译图）
- [ ] 5.2.2 LayerPanel 改为底部抽屉
- [ ] 5.2.3 添加触摸手势（双指缩放/单指平移）

**执行模型**: Claude
**预估耗时**: 60 min
**_Requirements**: REQ-3.1

---

### Task 5.3: 性能优化
- [ ] 5.3.1 图片懒加载 (IntersectionObserver)
- [ ] 5.3.2 虚拟滚动 (react-window) - 历史列表
- [ ] 5.3.3 Vite manualChunks 分包优化
- [ ] 5.3.4 目标：首屏 < 2s，LCP < 2.5s

**执行模型**: Claude
**预估耗时**: 60 min
**_Requirements**: REQ-3.2

---

### Task 5.4: Phase 5 QA 交付物
- [ ] 5.4.1 性能测试报告（Lighthouse）
- [ ] 5.4.2 移动端兼容性测试
- [ ] 5.4.3 Bundle 大小分析

**执行模型**: Claude
**预估耗时**: 20 min
**_Requirements**: Section 5

---

### Task 5.5: Phase 5 存档
- [ ] 5.5.1 Git add + commit: `perf(frontend): H5 适配 + 性能优化`

**执行模型**: Claude
**预估耗时**: 5 min
**_Requirements**: Section 6.1

---

## 🛑 阶段变更提醒 (Phase 5 → Phase 6)
**建议执行模型切换**: `/model codex`
**Codex 需关注**: Demo 数据、E2E 测试、Docker 部署

---

## Phase 6: 集成测试 + Demo 模式

### Task 6.1: 后端 Demo 数据
- [ ] 6.1.1 创建 `services/demo_service.py`
- [ ] 6.1.2 修改 History API 合并 Demo 数据
- [ ] 6.1.3 添加 DEMO_MODE 环境变量控制

**执行模型**: Codex
**预估耗时**: 45 min
**_Requirements**: REQ-7

---

### Task 6.2: 前端 Demo 标识
- [ ] 6.2.1 ProjectCard 添加 Demo 角标
- [ ] 6.2.2 HistoryItem 添加 Demo 角标
- [ ] 6.2.3 Settings 添加 Demo 开关

**执行模型**: Claude
**预估耗时**: 30 min
**_Requirements**: REQ-7.1

---

### Task 6.3: E2E 测试
- [ ] 6.3.1 配置 Playwright
- [ ] 6.3.2 测试用例：上传 → 翻译 → 编辑图层 → 保存
- [ ] 6.3.3 测试用例：查看历史 → 删除记录
- [ ] 6.3.4 配置 GitHub Actions CI

**执行模型**: Codex
**预估耗时**: 90 min
**_Requirements**: 全部

---

### Task 6.4: 最终集成验证
- [ ] 6.4.1 验证 Docker 构建
- [ ] 6.4.2 全流程手动测试
- [ ] 6.4.3 更新 README.md

**执行模型**: Claude + Codex
**预估耗时**: 60 min
**_Requirements**: 全部

---

### Task 6.5: Phase 6 存档（最终发布）
- [ ] 6.5.1 Git add + commit: `release: SaaS UI 重构完成 v2.0`
- [ ] 6.5.2 创建 Git Tag: `v2.0.0`

**执行模型**: Codex
**预估耗时**: 10 min
**_Requirements**: Section 6.1

---

## 验收清单

- [ ] 7.1 前端 Feature Slicing 架构通过 Claude 审查
- [ ] 7.2 所有 UI 与设计稿一致
- [ ] 7.3 768px 以下正常显示移动端布局
- [ ] 7.4 新增 API 100% 单元测试覆盖
- [ ] 7.5 TextLayer 并发编辑无数据丢失
- [ ] 7.6 引擎降级场景可正常回退
- [ ] 7.7 Demo 模式数据正确显示
- [ ] 7.8 E2E 测试全部通过
- [ ] 7.9 Docker 构建成功
- [ ] 7.10 生产环境部署验证

---

## 时间估算汇总

| Phase | 描述 | 主要模型 | 耗时 |
|-------|------|----------|------|
| 0 | 契约先行 | Claude + Codex | 85 min |
| 1 | 后端骨架 | Codex | 325 min |
| 2 | Gemini UI 设计 | Gemini | 145 min |
| 3 | 前端骨架 + Staging | Claude | 325 min |
| 4 | 前端填充 | Claude | 375 min |
| 5 | H5 + 性能优化 | Claude | 190 min |
| 6 | 集成测试 + Demo | Codex + Claude | 235 min |
| **总计** | | | **~28h** |

---

**Status: READY_FOR_APPROVAL**
