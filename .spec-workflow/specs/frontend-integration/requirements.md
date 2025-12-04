# Requirements Document: 图片翻译系统升级

## Introduction

将现有 MVP 图片翻译系统升级为支持 100 用户（10 并发）的完整产品。PC 端提供专业 Editor（Mask 绘制、文字编辑、批量翻译），移动端 H5 提供简化翻译流程。

## Alignment with Product Vision

- **目标用户**: 跨境电商卖家（内测群约 100 人）
- **核心价值**: 专业图片翻译 + 区域选择 + 批量处理
- **部署方式**: Dokploy Docker + Cloudflare DNS

## Requirements

### Requirement 1: 批量翻译

**User Story:** 作为卖家，我想一次上传多张图片批量翻译，以便提高工作效率。

#### Acceptance Criteria

1. WHEN 用户上传 1-5 张图片 THEN 系统 SHALL 创建批量任务并返回任务 ID
2. WHEN 任务处理中 THEN 系统 SHALL 通过 SSE 实时推送每张图的进度
3. IF 单张图片翻译失败 THEN 系统 SHALL 继续处理其他图片并标记失败原因
4. WHEN 批量任务完成 THEN 系统 SHALL 支持一键打包下载所有结果

### Requirement 2: Mask 区域选择（PC 端）

**User Story:** 作为卖家，我想手动选择需要翻译的区域，以便精确控制翻译范围。

#### Acceptance Criteria

1. WHEN 用户选择画笔工具 THEN 系统 SHALL 允许在图片上绘制 Mask 区域
2. WHEN 用户选择擦除工具 THEN 系统 SHALL 允许擦除已绘制的 Mask
3. WHEN 提交翻译 THEN 系统 SHALL 仅翻译 Mask 覆盖区域的文字
4. IF Mask 为空 THEN 系统 SHALL 翻译整张图片（默认行为）

### Requirement 3: 文字图层编辑（PC 端）

**User Story:** 作为卖家，我想编辑翻译后的文字内容和样式，以便优化翻译结果。

#### Acceptance Criteria

1. WHEN 翻译完成 THEN 系统 SHALL 显示可编辑的文字图层列表
2. WHEN 用户修改文字内容 THEN 系统 SHALL 实时更新预览
3. WHEN 用户调整字体/大小/颜色 THEN 系统 SHALL 应用样式到对应图层
4. WHEN 用户拖拽文字 THEN 系统 SHALL 更新文字位置

### Requirement 4: 历史记录

**User Story:** 作为卖家，我想查看和管理历史翻译记录，以便重复使用或对比结果。

#### Acceptance Criteria

1. WHEN 翻译完成 THEN 系统 SHALL 自动保存到历史记录
2. WHEN 用户访问历史页面 THEN 系统 SHALL 显示翻译列表（缩略图、时间、语言）
3. WHEN 用户点击历史记录 THEN 系统 SHALL 加载原图和译图预览
4. IF 记录超过 90 天 THEN 系统 SHALL 自动清理（每日凌晨执行）

### Requirement 5: 移动端 H5 简化流程

**User Story:** 作为卖家，我想在手机上快速翻译单张图片，无需复杂操作。

#### Acceptance Criteria

1. WHEN 用户在移动端访问 THEN 系统 SHALL 显示简化 UI（无 Editor/Mask）
2. WHEN 用户上传图片 THEN 系统 SHALL 仅显示语言选择和翻译按钮
3. WHEN 翻译完成 THEN 系统 SHALL 显示结果并提供下载/分享选项
4. WHEN 屏幕宽度 < 768px THEN 系统 SHALL 自动切换为移动端布局

### Requirement 6: 错误监控

**User Story:** 作为运维，我需要监控系统错误，以便及时发现和修复问题。

#### Acceptance Criteria

1. WHEN 后端发生异常 THEN 系统 SHALL 上报到 Sentry（含上下文）
2. WHEN 前端发生错误 THEN 系统 SHALL 上报到 Sentry（含用户操作路径）
3. IF API 调用失败率 > 10% THEN Sentry SHALL 触发告警

## Non-Functional Requirements

### Code Architecture and Modularity

- **后端**: FastAPI 分层架构（api/services/core/utils）
- **前端**: React 组件化 + Hooks + Services 分离
- **存储**: 文件系统存图片，SQLite 存路径和元数据
- **队列**: SQLite 状态机（pending→processing→done→failed）

### Performance

| 指标 | 目标值 |
|------|--------|
| 单图翻译 | < 7 秒 |
| 5 图批量 | < 25 秒 |
| 并发用户 | 10 人同时 |
| 峰值 QPS | 2 QPS |
| Mask 压缩 | < 500KB (WebP) |

### Security

- CORS 白名单（仅允许前端域名）
- 环境变量存储敏感信息
- 无用户认证（完全开放）
- 文件上传限制 10MB

### Reliability

- 翻译失败自动重试（3 次，指数退避）
- 队列任务持久化（重启不丢失）
- 健康检查端点 /health
- 错误上报 Sentry

### Usability

- 响应式设计（PC/Tablet/Mobile）
- 拖拽上传支持
- 实时进度反馈（SSE）
- 触控友好（PointerEvents）

## Technical Constraints

| 约束 | 值 |
|------|-----|
| 后端框架 | FastAPI + SQLite |
| 前端框架 | React 19 + TypeScript + Tailwind |
| 图片限制 | 10MB, 8192x8192 |
| 批量上限 | 5 张/次 |
| 历史保留 | 90 天 |
| 并发处理 | ThreadPoolExecutor (max_workers=6) |
| 部署 | Dokploy Docker |
| 监控 | Sentry |
| 备份 | rclone → Cloudflare R2 |

## Out of Scope

| 不做 | 原因 |
|------|------|
| 用户注册/登录 | 完全开放，无需认证 |
| 付费计费 | 后续迭代 |
| 多翻译引擎 | UI 预留，当前仅 Aliyun |
| 实时协作 | 非必需 |
| 原生 App | H5 响应式足够 |
