# Tasks: Frontend Integration

## Overview

将 picturetranslate 重构为 FastAPI + React 前后端分离架构。

## Task Breakdown

### Phase 1: 后端基础设施

#### Task 1.1: 核心配置模块
- [x] 1.1.1 创建 `core/__init__.py`
- [x] 1.1.2 创建 `core/config.py` - pydantic-settings 环境变量管理
- [x] 1.1.3 创建 `core/exceptions.py` - 自定义异常和处理器

_Requirements: REQ-1_
_Estimate: 30 min_

#### Task 1.2: 工具层
- [x] 1.2.1 创建 `utils/__init__.py`
- [x] 1.2.2 创建 `utils/image.py` - 图片验证、hash 计算
- [x] 1.2.3 创建 `utils/retry.py` - 重试装饰器

_Requirements: REQ-1_
_Estimate: 30 min_

#### Task 1.3: 服务层
- [x] 1.3.1 创建 `services/__init__.py`
- [x] 1.3.2 创建 `services/translator.py` - 封装 processor.ImageTranslator
- [x] 1.3.3 创建 `services/cache.py` - LRU 缓存服务

_Requirements: REQ-1_
_Estimate: 45 min_

### Phase 2: API 层

#### Task 2.1: FastAPI 应用入口
- [x] 2.1.1 创建 `api/__init__.py`
- [x] 2.1.2 创建 `api/main.py` - FastAPI 应用、CORS、生命周期
- [x] 2.1.3 创建 `api/dependencies.py` - 依赖注入

_Requirements: REQ-1_
_Estimate: 30 min_

#### Task 2.2: 健康检查路由
- [x] 2.2.1 创建 `api/routes/__init__.py`
- [x] 2.2.2 创建 `api/routes/health.py` - GET /health

_Requirements: REQ-1_
_Estimate: 15 min_

#### Task 2.3: 翻译路由
- [x] 2.3.1 创建 `api/routes/translate.py` - POST /api/translate`
- [x] 2.3.2 实现 multipart/form-data 上传
- [x] 2.3.3 实现 ThreadPoolExecutor 异步执行
- [x] 2.3.4 集成缓存服务

_Requirements: REQ-1, REQ-4_
_Estimate: 60 min_

### Phase 3: 部署配置

#### Task 3.1: 依赖更新
- [x] 3.1.1 更新 `requirements.txt` - 添加 fastapi, uvicorn, pydantic-settings, python-multipart

_Requirements: REQ-1_
_Estimate: 10 min_

#### Task 3.2: Dockerfile 更新
- [x] 3.2.1 更新 `Dockerfile` - 改用 uvicorn 启动
- [x] 3.2.2 更新 `docker-compose.yml` - 端口映射 8000

_Requirements: REQ-1_
_Estimate: 15 min_

### Phase 4: 测试验证

#### Task 4.1: 单元测试
- [x] 4.1.1 创建 `tests/test_utils.py` - 测试图片验证、hash
- [x] 4.1.2 创建 `tests/test_services.py` - 测试缓存服务

_Requirements: REQ-1_
_Estimate: 30 min_

#### Task 4.2: API 集成测试
- [x] 4.2.1 创建 `tests/test_api.py` - 测试 /health, /api/translate
- [x] 4.2.2 添加 pytest, httpx 测试依赖

_Requirements: REQ-1, REQ-4_
_Estimate: 45 min_

#### Task 4.3: 本地验证
- [x] 4.3.1 启动 FastAPI 服务并测试健康检查端点
- [x] 4.3.2 测试翻译接口
- [x] 4.3.3 验证错误处理

_Requirements: REQ-1, REQ-4_
_Estimate: 20 min_

### Phase 5: 前端集成

#### Task 5.1: API Client
- [x] 5.1.1 创建 `src/api/translateClient.ts`
- [x] 5.1.2 实现 translateImage 函数（含 protect_product 参数支持）

_Requirements: REQ-2_
_Estimate: 20 min_

#### Task 5.2: React Hook
- [x] 5.2.1 创建 `src/hooks/useTranslation.ts`
- [x] 5.2.2 实现状态管理和错误处理

_Requirements: REQ-2, REQ-4_
_Estimate: 30 min_

#### Task 5.3: Dashboard 集成
- [x] 5.3.1 修改 Dashboard 组件，接入 useTranslation hook
- [x] 5.3.2 实现上传、语言选择、翻译按钮

_Requirements: REQ-2_
_Estimate: 45 min_

#### Task 5.4: Editor 集成
- [x] 5.4.1 修改 Editor 组件，显示翻译结果
- [x] 5.4.2 实现下载功能

_Requirements: REQ-3_
_Estimate: 30 min_

### Phase 6-7: 批量任务与历史记录 (后端)

#### Task 6.1: 数据层
- [x] 6.1.1 创建 `core/database.py` - SQLite + WAL + 连接池
- [x] 6.1.2 创建 `models/job.py` - Job ORM 模型
- [x] 6.1.3 创建 `models/translation.py` - Translation ORM 模型

#### Task 6.2: 服务层
- [x] 6.2.1 创建 `services/storage.py` - 文件存储服务
- [x] 6.2.2 创建 `services/sse_manager.py` - SSE Pub/Sub 管理
- [x] 6.2.3 创建 `services/job_queue.py` - 任务队列 + 后台 Worker

#### Task 6.3: API 路由
- [x] 6.3.1 创建 `api/routes/jobs.py` - POST /api/jobs + GET /api/jobs/{id}/sse

#### Task 7.1: 历史与清理
- [x] 7.1.1 创建 `services/history.py` - 历史记录 CRUD
- [x] 7.1.2 创建 `services/cleanup.py` - APScheduler 90天清理
- [x] 7.1.3 创建 `api/routes/history.py` - 历史 API 端点

### Phase 8: 前端高级组件

#### Task 8.1: API Client 扩展
- [x] 8.1.1 扩展 `translateClient.ts` - 添加 Jobs API (createJob, subscribeJobEvents)
- [x] 8.1.2 扩展 `translateClient.ts` - 添加 History API (fetchHistory, deleteHistoryItem)

_Requirements: REQ-2_
_Estimate: 30 min_

#### Task 8.2: Hooks
- [x] 8.2.1 创建 `src/hooks/useJobQueue.ts` - SSE 订阅 + 批量任务状态管理
- [x] 8.2.2 创建 `src/hooks/useHistory.ts` - 历史记录 CRUD

_Requirements: REQ-2_
_Estimate: 45 min_

#### Task 8.3: MaskCanvas 组件
- [x] 8.3.1 创建 `src/components/MaskCanvas.tsx` - PointerEvents 画布
- [x] 8.3.2 实现画笔/橡皮工具切换
- [x] 8.3.3 实现 WebP 优先 + PNG 回退导出

_Requirements: REQ-3_
_Estimate: 60 min_

#### Task 8.4: History 页面
- [x] 8.4.1 创建 `src/components/History.tsx` - 历史记录列表
- [x] 8.4.2 实现分页、删除、下载功能

_Requirements: REQ-2_
_Estimate: 45 min_

#### Task 8.5: Dashboard 升级
- [x] 8.5.1 升级 Dashboard 支持批量上传 (最多5张)
- [x] 8.5.2 集成 MaskCanvas 编辑器模态框
- [x] 8.5.3 实现批量翻译结果展示

_Requirements: REQ-2, REQ-3_
_Estimate: 60 min_

#### Task 8.6: 应用结构
- [x] 8.6.1 更新 `App.tsx` - 添加标签页导航 (翻译/历史)
- [x] 8.6.2 创建 `src/sentry.ts` - 可选 Sentry 集成
- [x] 8.6.3 更新 `index.css` - 新组件样式

_Requirements: REQ-2_
_Estimate: 30 min_

## Acceptance Criteria

- [x] 99.1 `GET /health` 返回 200 + JSON
- [x] 99.2 `POST /api/translate` 接受图片，返回 PNG
- [x] 99.3 错误响应符合 API Contract
- [x] 99.4 所有单元测试通过（12/12 passed）
- [x] 99.5 Docker 构建成功
- [x] 99.6 前端可正常调用后端 API
- [x] 99.7 批量上传功能正常 (最多5张)
- [x] 99.8 Mask 绘制导出正常 (WebP/PNG)
- [x] 99.9 历史记录列表、删除功能正常
- [x] 99.10 前端构建成功 (~160KB gzip)
