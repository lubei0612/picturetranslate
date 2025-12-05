# Requirements: SaaS UI 重构与后端增强

## 概述
将现有 MVP 前端重构为专业 SaaS 级别界面，同时增强后端多引擎支持、文字图层编辑等功能。

---

## REQ-1: 前端架构重构 (Feature Slicing)
**优先级**: P0

### REQ-1.1 目录结构垂直切分
- 按功能领域组织：`features/dashboard|editor|history|settings`
- 共享层：`shared/components|hooks|utils|types`
- 布局层：`layouts/Desktop|Mobile`

### REQ-1.2 单向依赖规则
- UI 层只调用 Hooks/Service
- Hooks 层处理状态和数据转换
- API 层仅负责 HTTP 通信

---

## REQ-2: UI 复刻设计稿
**优先级**: P0

### REQ-2.1 Dashboard 模块
- 项目卡片网格展示
- 批量上传入口
- 筛选/搜索功能
- 空状态引导

### REQ-2.2 Editor 模块
- 双栏布局（原图/译图）
- 文字图层列表
- 图层属性面板（字体/颜色/大小）
- 裁剪/消除笔工具
- 撤销/重做/保存按钮

### REQ-2.3 History 模块
- 时间线列表
- 缩略图预览
- 批量删除

### REQ-2.4 Settings 模块
- 翻译引擎选择
- 默认语言对配置
- Demo 模式开关

---

## REQ-3: H5 移动端适配
**优先级**: P1

### REQ-3.1 响应式布局
- Breakpoint: 768px
- Mobile 抽屉式导航
- 触摸手势支持

### REQ-3.2 性能优化
- 图片懒加载
- 虚拟滚动（大列表）

---

## REQ-4: 后端多引擎策略模式
**优先级**: P0

### REQ-4.1 引擎抽象层
- `TranslateEngine` 接口定义
- 引擎注册表 + 工厂模式
- 熔断/重试机制

### REQ-4.2 引擎实现
- 阿里云翻译引擎（现有）
- DeepL 引擎（新增）
- Google Translate 引擎（新增）

### REQ-4.3 运行时切换
- `GET /api/engines` 返回可用列表
- 请求级引擎选择
- 自动降级策略

---

## REQ-5: 文字图层 API
**优先级**: P0

### REQ-5.1 数据模型
- `text_layers` 表（外键 → translation）
- bbox、原文、译文、样式 JSON

### REQ-5.2 API 端点
- `GET /api/translations/{id}/layers` 获取图层列表
- `PATCH /api/layers/{id}` 更新单个图层（乐观锁）
- `POST /api/layers/batch` 批量更新

---

## REQ-6: 图像编辑 API
**优先级**: P1

### REQ-6.1 裁剪功能
- `POST /api/images/{id}/crop` 异步裁剪
- 返回 job_id 供轮询

### REQ-6.2 消除笔功能
- `POST /api/images/{id}/inpaint` 异步消除
- Mask 图片上传

---

## REQ-7: Demo 模式
**优先级**: P2

### REQ-7.1 数据混合
- 真实数据 + Demo 数据统一分页
- `isDemo` 标记区分

### REQ-7.2 环境控制
- `DEMO_MODE=true` 环境变量
- 视图/缓存优化

---

## 验收标准
- [ ] 前端通过 Feature Slicing 架构审查
- [ ] 所有 UI 与设计稿像素级对齐
- [ ] 768px 以下正常显示移动端布局
- [ ] 新增 API 100% 单元测试覆盖
- [ ] TextLayer 并发编辑无数据丢失
- [ ] 引擎降级场景可正常回退
