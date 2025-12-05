# Design Document: 图片翻译系统升级

## Overview

基于方案 A（轻量级 SQLite 全栈）实现图片翻译系统升级，支持 100 用户（10 并发）。核心特性：批量翻译、Mask 区域选择、文字编辑、历史记录、H5 响应式。

**Codex 审查修订版本**: v2.0 (2024-12-04)

## Steering Document Alignment

### Technical Standards
- 后端：FastAPI 分层架构（api/services/core/utils）
- 前端：React 19 + TypeScript + Tailwind CSS
- 存储：文件系统 + SQLite 路径索引
- 部署：Dokploy Docker 单容器

### Project Structure
```
picturetranslate/
├── api/                    # FastAPI 路由层
│   ├── routes/
│   │   ├── translate.py    # 翻译 API（升级）
│   │   ├── jobs.py         # 批量任务 API（新增）
│   │   ├── history.py      # 历史记录 API（新增）
│   │   └── health.py
│   └── dependencies.py
├── services/               # 业务逻辑层
│   ├── translator.py       # 翻译服务（升级）
│   ├── job_queue.py        # 任务队列服务（新增）
│   ├── storage.py          # 文件存储服务（新增）
│   ├── history.py          # 历史管理服务（新增）
│   ├── cleanup.py          # 定时清理服务（新增）
│   └── sse_manager.py      # SSE 事件管理（新增）
├── core/
│   ├── config.py
│   ├── database.py         # SQLite 连接池（新增）
│   ├── sentry.py           # Sentry 初始化（新增）
│   └── exceptions.py
├── models/                 # 数据模型（新增）
│   ├── job.py
│   └── translation.py
├── frontend/src/
│   ├── components/
│   │   ├── Dashboard.tsx   # 升级：批量上传
│   │   ├── Editor.tsx      # 升级：Mask + TextLayer
│   │   ├── MaskCanvas.tsx  # 新增：画笔组件
│   │   ├── TextEditor.tsx  # 新增：文字编辑
│   │   └── History.tsx     # 新增：历史页面
│   ├── hooks/
│   │   ├── useTranslation.ts
│   │   ├── useJobQueue.ts  # 新增：任务队列
│   │   └── useHistory.ts   # 新增：历史记录
│   ├── api/
│   │   └── client.ts       # 升级：新 API
│   └── sentry.ts           # Sentry React 初始化（新增）
└── storage/                # 文件存储目录（新增）
    └── {job_id}/
        └── {image_uuid}/   # 每张图片独立目录
            ├── original.png
            ├── mask.webp
            └── result.png
```

## Code Reuse Analysis

### Existing Components to Leverage
- **processor.py**: 核心翻译逻辑保持不变
- **services/translator.py**: 升级支持 Mask 参数
- **services/cache.py**: LRU 缓存继续使用
- **utils/image.py**: 图片验证复用
- **utils/retry.py**: 重试装饰器复用
- **frontend/api/translateClient.ts**: 升级为多 API 支持

### Integration Points
- **Aliyun API**: 继续使用现有集成
- **Docker**: 升级 Dockerfile 添加 Volume
- **Sentry**: 新增集成

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React + Tailwind)                                    │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │  Dashboard   │ │    Editor    │ │   History    │            │
│  │  - 批量上传   │ │  - MaskCanvas│ │  - 列表筛选   │            │
│  │  - 进度显示   │ │  - TextEditor│ │  - 预览下载   │            │
│  │  - 响应式    │ │  - Split View│ │              │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│         │                │                │                     │
│  ┌──────────────────────────────────────────────────┐          │
│  │  Hooks: useTranslation, useJobQueue, useHistory  │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    REST API + SSE
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FastAPI Backend                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Routes                                                  │   │
│  │  POST /api/jobs           创建批量任务                    │   │
│  │  GET  /api/jobs/{id}      获取任务状态                    │   │
│  │  GET  /api/jobs/{id}/sse  SSE 进度推送                    │   │
│  │  GET  /api/history        历史列表                        │   │
│  │  GET  /api/history/{id}   历史详情                        │   │
│  │  DELETE /api/history/{id} 删除记录                        │   │
│  │  GET  /health             健康检查                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Services                                                │   │
│  │  ├─ JobQueueService      SQLite 状态机队列               │   │
│  │  ├─ TranslatorService    翻译执行 + Mask 支持            │   │
│  │  ├─ StorageService       文件存储 + 路径管理             │   │
│  │  ├─ HistoryService       历史 CRUD                       │   │
│  │  └─ CleanupService       90天定时清理                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                              │   │
│  │  ├─ SQLite (translations.db)                            │   │
│  │  │   ├─ jobs (id, status, created_at, images_count)     │   │
│  │  │   ├─ translations (id, job_id, paths, params, ...)   │   │
│  │  │   └─ cleanup_log (id, deleted_at, count)             │   │
│  │  └─ File Storage (./storage/)                           │   │
│  │      └─ {job_id}/original.png, mask.webp, result.png    │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. JobQueueService (services/job_queue.py)
- **Purpose**: SQLite 状态机队列管理
- **Interfaces**:
  ```python
  create_job(images: List[UploadFile], params: TranslateParams) -> Job
  get_job(job_id: str) -> Job
  update_status(job_id: str, status: JobStatus) -> None
  get_pending_jobs() -> List[Job]
  ```
- **Dependencies**: SQLite, StorageService
- **状态流**: pending → processing → done/failed

#### 2. StorageService (services/storage.py)
- **Purpose**: 文件存储和路径管理（支持批量图片）
- **Interfaces**:
  ```python
  save_original(job_id: str, image_uuid: str, image: bytes) -> str
  save_mask(job_id: str, image_uuid: str, mask: bytes, mime_type: str) -> str
  save_result(job_id: str, image_uuid: str, result: bytes) -> str
  get_file(path: str) -> bytes
  delete_job_files(job_id: str) -> None
  ```
- **Dependencies**: 文件系统
- **路径格式**: `./storage/{job_id}/{image_uuid}/{filename}`

#### StorageService 实现示例

```python
import os
import uuid
from pathlib import Path
from PIL import Image
import io

class StorageService:
    def __init__(self, base_path: str = "./storage"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    def _get_image_dir(self, job_id: str, image_uuid: str) -> Path:
        """获取图片存储目录：storage/{job_id}/{image_uuid}/"""
        path = self.base_path / job_id / image_uuid
        path.mkdir(parents=True, exist_ok=True)
        return path
    
    def save_original(self, job_id: str, image_uuid: str, image: bytes) -> str:
        """保存原图"""
        dir_path = self._get_image_dir(job_id, image_uuid)
        file_path = dir_path / "original.png"
        file_path.write_bytes(image)
        return str(file_path.relative_to(self.base_path))
    
    def save_mask(self, job_id: str, image_uuid: str, mask: bytes, mime_type: str) -> str:
        """
        保存 Mask 图片
        - 验证 MIME 类型
        - WebP/PNG 直接保存，其他格式转 PNG
        """
        allowed_types = {"image/webp", "image/png"}
        if mime_type not in allowed_types:
            # 不支持的格式，转换为 PNG
            img = Image.open(io.BytesIO(mask))
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            mask = buffer.getvalue()
            ext = "png"
        else:
            ext = "webp" if mime_type == "image/webp" else "png"
        
        dir_path = self._get_image_dir(job_id, image_uuid)
        file_path = dir_path / f"mask.{ext}"
        file_path.write_bytes(mask)
        return str(file_path.relative_to(self.base_path))
    
    def delete_job_files(self, job_id: str) -> None:
        """删除整个任务的所有文件"""
        import shutil
        job_path = self.base_path / job_id
        if job_path.exists():
            shutil.rmtree(job_path)
```

#### 3. HistoryService (services/history.py)
- **Purpose**: 历史记录 CRUD
- **Interfaces**:
  ```python
  list_history(page: int, limit: int, filters: dict) -> List[Translation]
  get_history(id: str) -> Translation
  delete_history(id: str) -> None
  ```
- **Dependencies**: SQLite

#### 4. CleanupService (services/cleanup.py)
- **Purpose**: 90 天自动清理
- **Interfaces**:
  ```python
  schedule_cleanup() -> None  # APScheduler 每日 3:00
  run_cleanup() -> int        # 返回删除数量
  ```
- **Dependencies**: SQLite, StorageService, APScheduler

#### CleanupService 实现（单实例保证 + misfire 处理）

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.pool import ThreadPoolExecutor
import logging

logger = logging.getLogger(__name__)

class CleanupService:
    def __init__(self, db_url: str, storage_service: StorageService):
        self.storage = storage_service
        self.db_url = db_url
        self.scheduler: Optional[AsyncIOScheduler] = None
    
    def schedule_cleanup(self):
        """
        配置 APScheduler：
        - SQLite JobStore 保证任务持久化和单实例
        - misfire_grace_time: 错过执行窗口后仍执行（最多延迟1小时）
        - coalesce: 合并错过的多次执行为一次
        """
        jobstores = {
            'default': SQLAlchemyJobStore(url=self.db_url)
        }
        executors = {
            'default': ThreadPoolExecutor(1)  # 单线程执行清理
        }
        job_defaults = {
            'coalesce': True,           # 错过多次只执行一次
            'max_instances': 1,          # 同一任务最多一个实例
            'misfire_grace_time': 3600,  # 1小时内仍可执行
        }
        
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone='Asia/Shanghai'
        )
        
        # 每天凌晨 3:00 执行清理
        self.scheduler.add_job(
            self.run_cleanup,
            'cron',
            hour=3,
            minute=0,
            id='daily_cleanup',
            replace_existing=True  # 重启时替换已有任务
        )
        
        self.scheduler.start()
        logger.info("Cleanup scheduler started")
    
    async def run_cleanup(self) -> int:
        """执行 90 天清理"""
        # 实现略...
        pass
    
    def shutdown(self):
        if self.scheduler:
            self.scheduler.shutdown(wait=True)
```

#### 备选方案：外部 Cron（推荐多实例部署）

如果部署多个 Worker 实例，建议使用外部 Cron 代替 APScheduler：

```bash
# /etc/cron.d/picturetranslate-cleanup
# 每天凌晨 3:00 执行，通过 API 触发（需认证）
0 3 * * * curl -X POST http://localhost:8000/api/internal/cleanup \
  -H "X-Internal-Token: ${CLEANUP_TOKEN}" \
  >> /var/log/cleanup.log 2>&1
```

```python
# api/routes/internal.py
@router.post("/internal/cleanup")
async def trigger_cleanup(x_internal_token: str = Header(...)):
    if x_internal_token != settings.CLEANUP_TOKEN:
        raise HTTPException(403, "Invalid token")
    count = await cleanup_service.run_cleanup()
    return {"deleted": count}
```

### Frontend Components

#### 1. MaskCanvas (components/MaskCanvas.tsx)
- **Purpose**: Mask 绘制画布
- **Props**:
  ```typescript
  interface MaskCanvasProps {
    imageUrl: string;
    width: number;
    height: number;
    onMaskChange: (maskBlob: Blob, mimeType: string) -> void;
    brushSize?: number;
    tool?: 'brush' | 'eraser';
  }
  ```
- **Features**: PointerEvents, WebP 压缩导出 + PNG 回退

#### MaskCanvas 导出实现（WebP 优先 + PNG 回退）

```typescript
// components/MaskCanvas.tsx
const exportMask = async (canvas: HTMLCanvasElement): Promise<{blob: Blob, mimeType: string}> => {
  // 检测 WebP 支持
  const supportsWebP = await checkWebPSupport();
  
  return new Promise((resolve, reject) => {
    if (supportsWebP) {
      // 优先使用 WebP（压缩率更高）
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, mimeType: 'image/webp' });
          } else {
            // WebP 失败，回退到 PNG
            fallbackToPNG(canvas, resolve, reject);
          }
        },
        'image/webp',
        0.8  // 80% 质量
      );
    } else {
      // 不支持 WebP，使用 PNG
      fallbackToPNG(canvas, resolve, reject);
    }
  });
};

const fallbackToPNG = (
  canvas: HTMLCanvasElement,
  resolve: (value: {blob: Blob, mimeType: string}) => void,
  reject: (reason: Error) => void
) => {
  canvas.toBlob(
    (blob) => {
      if (blob) {
        resolve({ blob, mimeType: 'image/png' });
      } else {
        reject(new Error('Failed to export mask'));
      }
    },
    'image/png'
  );
};

// WebP 支持检测（缓存结果）
let webPSupported: boolean | null = null;
const checkWebPSupport = async (): Promise<boolean> => {
  if (webPSupported !== null) return webPSupported;
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      webPSupported = img.width === 1;
      resolve(webPSupported);
    };
    img.onerror = () => {
      webPSupported = false;
      resolve(false);
    };
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
};

// 使用示例
const handleMaskComplete = async () => {
  const { blob, mimeType } = await exportMask(canvasRef.current);
  onMaskChange(blob, mimeType);
};
```

#### 2. TextEditor (components/TextEditor.tsx)
- **Purpose**: 文字图层编辑
- **Props**:
  ```typescript
  interface TextEditorProps {
    layers: TextLayer[];
    onLayerUpdate: (id: string, updates: Partial<TextLayer>) => void;
    selectedLayerId?: string;
  }
  ```

#### 3. useJobQueue (hooks/useJobQueue.ts)
- **Purpose**: 批量任务状态管理
- **Returns**:
  ```typescript
  {
    jobs: Job[];
    createJob: (files: File[], params: TranslateParams) => Promise<string>;
    subscribeProgress: (jobId: string) => void;
    cancelJob: (jobId: string) => void;
  }
  ```

## Data Models

### SQLite 连接池配置 (core/database.py)

```python
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager

# 连接池配置：SQLite + WAL 模式
DATABASE_URL = "sqlite:///./data/translations.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,  # 允许多线程
        "timeout": 30,               # busy_timeout: 30秒等待锁
    },
    pool_size=5,                     # 连接池大小
    max_overflow=10,                 # 最大溢出连接
    pool_pre_ping=True,              # 连接健康检查
)

# 启用 WAL 模式（并发读优化）
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=30000")  # 30秒
    cursor.execute("PRAGMA synchronous=NORMAL")  # 平衡性能与安全
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Job (SQLite: jobs)
```sql
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  status TEXT CHECK(status IN ('pending','processing','done','failed')),
  images_count INTEGER,
  completed_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_jobs_status ON jobs(status);
```

### Translation (SQLite: translations)
```sql
CREATE TABLE translations (
  id TEXT PRIMARY KEY,            -- UUID
  job_id TEXT REFERENCES jobs(id),
  image_uuid TEXT NOT NULL,       -- 图片独立 UUID，用于存储路径
  original_path TEXT,
  mask_path TEXT,
  result_path TEXT,
  source_lang TEXT,
  target_lang TEXT,
  status TEXT CHECK(status IN ('pending','processing','done','failed')),
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_translations_job ON translations(job_id);
CREATE INDEX idx_translations_status ON translations(status);
CREATE INDEX idx_translations_created ON translations(created_at);
```

### 事务型任务拉取示例 (services/job_queue.py)

```python
from sqlalchemy import text

def pull_pending_translation(db) -> Optional[Translation]:
    """
    事务型任务拉取：防止并发抢占
    使用 SELECT ... FOR UPDATE 语义（SQLite 通过事务实现）
    """
    with db.begin():  # 自动提交/回滚
        # 查找并锁定一条 pending 记录
        result = db.execute(
            text("""
                UPDATE translations 
                SET status = 'processing', updated_at = CURRENT_TIMESTAMP
                WHERE id = (
                    SELECT id FROM translations 
                    WHERE status = 'pending' 
                    ORDER BY created_at ASC 
                    LIMIT 1
                )
                RETURNING *
            """)
        ).fetchone()
        
        if result:
            return Translation(**result._mapping)
        return None
```

### TextLayer (Frontend)
```typescript
interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  rotation: number;
}
```

## API Contract

### POST /api/jobs
创建批量翻译任务

**Request:**
```
Content-Type: multipart/form-data

files[]: File[] (1-5 张)
masks[]: File[] (可选，与 files 对应)
source_lang: string (default: "en")
target_lang: string (default: "zh")
protect_product: boolean (default: true)
```

**Response (201):**
```json
{
  "job_id": "uuid-xxx",
  "images_count": 3,
  "status": "pending",
  "sse_url": "/api/jobs/uuid-xxx/sse"
}
```

### GET /api/jobs/{id}/sse
SSE 进度推送（EventSourceResponse + asyncio.Queue Pub/Sub）

**Event Stream:**
```
event: progress
data: {"image_index": 0, "image_uuid": "uuid-xxx", "status": "processing"}

event: progress
data: {"image_index": 0, "image_uuid": "uuid-xxx", "status": "done", "result_url": "/storage/..."}

event: complete
data: {"job_id": "xxx", "completed": 3, "failed": 0}

event: error
data: {"image_index": 1, "image_uuid": "uuid-yyy", "error": "API rate limit"}
```

#### SSE Manager 实现 (services/sse_manager.py)

```python
import asyncio
from typing import Dict, Set
from dataclasses import dataclass, field

@dataclass
class SSEEvent:
    event: str
    data: dict

class SSEManager:
    """
    Pub/Sub 模式的 SSE 事件管理器
    - 每个 job_id 对应一组订阅者队列
    - Worker 完成翻译后 publish 事件
    - SSE 端点 subscribe 获取事件流
    """
    def __init__(self):
        self._subscribers: Dict[str, Set[asyncio.Queue]] = {}
        self._lock = asyncio.Lock()
    
    async def subscribe(self, job_id: str) -> asyncio.Queue:
        """订阅任务进度"""
        queue = asyncio.Queue()
        async with self._lock:
            if job_id not in self._subscribers:
                self._subscribers[job_id] = set()
            self._subscribers[job_id].add(queue)
        return queue
    
    async def unsubscribe(self, job_id: str, queue: asyncio.Queue):
        """取消订阅"""
        async with self._lock:
            if job_id in self._subscribers:
                self._subscribers[job_id].discard(queue)
                if not self._subscribers[job_id]:
                    del self._subscribers[job_id]
    
    async def publish(self, job_id: str, event: SSEEvent):
        """发布事件到所有订阅者"""
        async with self._lock:
            subscribers = self._subscribers.get(job_id, set()).copy()
        for queue in subscribers:
            await queue.put(event)

# 全局单例
sse_manager = SSEManager()
```

#### SSE 路由实现 (api/routes/jobs.py)

```python
from sse_starlette.sse import EventSourceResponse
from services.sse_manager import sse_manager, SSEEvent

@router.get("/jobs/{job_id}/sse")
async def job_progress_sse(job_id: str):
    """SSE 端点：实时推送任务进度"""
    async def event_generator():
        queue = await sse_manager.subscribe(job_id)
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield {
                    "event": event.event,
                    "data": json.dumps(event.data)
                }
                if event.event == "complete":
                    break
        except asyncio.TimeoutError:
            yield {"event": "ping", "data": "{}"}
        finally:
            await sse_manager.unsubscribe(job_id, queue)
    
    return EventSourceResponse(event_generator())
```

#### Worker 发布事件示例

```python
# services/translator.py
async def process_translation(translation: Translation, sse_manager: SSEManager):
    job_id = translation.job_id
    
    # 开始处理
    await sse_manager.publish(job_id, SSEEvent(
        event="progress",
        data={"image_uuid": translation.image_uuid, "status": "processing"}
    ))
    
    try:
        result = await translate_image(...)
        await sse_manager.publish(job_id, SSEEvent(
            event="progress",
            data={
                "image_uuid": translation.image_uuid,
                "status": "done",
                "result_url": result.url
            }
        ))
    except Exception as e:
        await sse_manager.publish(job_id, SSEEvent(
            event="error",
            data={"image_uuid": translation.image_uuid, "error": str(e)}
        ))
```

### GET /api/history
历史记录列表

**Query Params:**
- page: int (default: 1)
- limit: int (default: 20)
- source_lang: string (可选)
- target_lang: string (可选)
- date_from: string (可选)
- date_to: string (可选)

**Response:**
```json
{
  "items": [
    {
      "id": "xxx",
      "thumbnail_url": "/storage/.../thumb.jpg",
      "source_lang": "en",
      "target_lang": "zh",
      "created_at": "2024-12-04T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5
}
```

## Error Handling

### Error Scenarios
1. **批量超限 (>5张)**
   - HTTP 400: `{"error": "BATCH_LIMIT", "message": "最多同时上传5张图片"}`

2. **任务不存在**
   - HTTP 404: `{"error": "JOB_NOT_FOUND", "message": "任务不存在"}`

3. **Aliyun API 限流**
   - 内部重试 3 次，指数退避
   - 最终失败: 标记 translation.status = 'failed'

4. **存储空间不足**
   - HTTP 500: `{"error": "STORAGE_ERROR", "message": "存储空间不足"}`
   - Sentry 告警

### Sentry Integration

#### FastAPI 后端初始化 (core/sentry.py)

```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging

def init_sentry(dsn: str, environment: str):
    """
    在 FastAPI lifespan 中初始化 Sentry
    - 集成 FastAPI 异常捕获
    - 集成 SQLAlchemy 查询追踪
    - 集成 logging 错误上报
    """
    sentry_sdk.init(
        dsn=dsn,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            SqlalchemyIntegration(),
            LoggingIntegration(
                level=logging.INFO,
                event_level=logging.ERROR  # ERROR 及以上上报
            ),
        ],
        traces_sample_rate=0.1,  # 10% 性能采样
        profiles_sample_rate=0.1,
        environment=environment,
        send_default_pii=False,  # 不发送 PII 数据
    )
```

#### FastAPI Lifespan 集成 (api/main.py)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from core.sentry import init_sentry
from core.config import settings
from services.cleanup import cleanup_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if settings.SENTRY_DSN:
        init_sentry(settings.SENTRY_DSN, settings.ENVIRONMENT)
    
    cleanup_service.schedule_cleanup()
    
    yield
    
    # Shutdown
    cleanup_service.shutdown()

app = FastAPI(lifespan=lifespan)
```

#### React 前端初始化 (frontend/src/sentry.ts)

```typescript
import * as Sentry from "@sentry/react";

export function initSentry() {
  // 从环境变量获取 DSN（Vite 构建时注入）
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn("Sentry DSN not configured");
    return;
  }
  
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
```

#### React 入口文件 (frontend/src/main.tsx)

```typescript
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { initSentry } from "./sentry";
import App from "./App";

// 初始化 Sentry
initSentry();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

function ErrorFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600">出错了</h1>
        <p className="text-gray-600 mt-2">请刷新页面重试</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          刷新页面
        </button>
      </div>
    </div>
  );
}
```

#### Vite 环境变量配置

```bash
# .env.production
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_API_BASE_URL=https://api.farmaxbeauty.shop
```

## Mobile Responsive Strategy

### Breakpoints (Tailwind)
```css
/* Mobile: < 768px */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */
```

### Component Visibility
| 组件 | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Dashboard 上传 | 单图 | 批量 | 批量 |
| MaskCanvas | 隐藏 | 显示 | 显示 |
| TextEditor | 隐藏 | 简化 | 完整 |
| Split View | 纵向 | 横向 | 横向 |
| History | 列表 | 卡片 | 卡片 |

### Mobile-Specific UI
```tsx
// Dashboard.tsx
const isMobile = useMediaQuery('(max-width: 768px)');

return isMobile ? (
  <MobileUpload onUpload={handleSingleUpload} />
) : (
  <BatchUpload onUpload={handleBatchUpload} maxFiles={5} />
);
```

## Performance Optimization

### Backend
- **ThreadPoolExecutor**: max_workers=6
- **SQLite WAL**: 并发读优化
- **LRU Cache**: hash(original+mask+params) 为 key
- **指数退避**: Aliyun API 重试

### Frontend
- **Mask 压缩**: WebP 0.8 quality, < 500KB
- **图片懒加载**: Intersection Observer
- **Canvas 性能**: requestAnimationFrame
- **字体预加载**: `<link rel="preload" href="/fonts/...">`

## Backup Strategy

### Daily Backup (cron 3:00 AM)
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d)
sqlite3 /app/data/translations.db ".backup /app/backups/db-$DATE.sqlite"
rclone sync /app/storage r2:picturetranslate/storage --max-age 7d
find /app/backups -name "*.sqlite" -mtime +7 -delete
```

### Dokploy Volume
```yaml
volumes:
  - ./data:/app/data        # SQLite
  - ./storage:/app/storage  # 图片文件
  - ./backups:/app/backups  # 备份
```

## Testing Strategy

### Unit Testing
- services/job_queue.py: 状态流转测试
- services/storage.py: 文件操作测试
- utils/: 工具函数测试

### Integration Testing
- API 端点测试 (pytest + httpx)
- SSE 流测试
- 数据库事务测试

### E2E Testing (可选)
- 批量上传 → 进度 → 下载流程
- 移动端响应式测试

## Risk Assessment

| 风险 | 等级 | 缓解措施 | Codex 审查状态 |
|------|------|----------|----------------|
| SQLite 写锁竞争 | 中→低 | WAL 模式 + SQLAlchemy 连接池 + busy_timeout 30s + 事务型任务拉取 | ✅ 已解决 |
| SSE 轮询性能 | 中→低 | EventSourceResponse + asyncio.Queue Pub/Sub（非数据库轮询） | ✅ 已解决 |
| 批量存储冲突 | 中→低 | `storage/{job_id}/{image_uuid}/...` 结构 + 数据库 UUID 追踪 | ✅ 已解决 |
| Mask 兼容性 | 低 | 前端 WebP 优先 + PNG 回退 + 后端 MIME 校验转码 | ✅ 已解决 |
| APScheduler 多实例 | 中→低 | SQLite JobStore + coalesce + misfire_grace_time 或外部 Cron | ✅ 已解决 |
| Sentry 初始化时机 | 低 | FastAPI lifespan 初始化 + React @sentry/react ErrorBoundary | ✅ 已解决 |
| 大批量请求积压 | 中 | 队列 + 5 张限制 | - |
| 存储空间增长 | 中 | 90 天清理 + R2 备份 | - |
| Aliyun API 不稳定 | 高 | 重试 + Sentry 告警 | - |

## Decision Log

- **2024-12-04**: 选择方案 A（轻量级 SQLite 全栈）
- **2024-12-04 v2.0 Codex 审查修订**:
  - **SQLite**: 增加 SQLAlchemy 连接池、WAL 模式、busy_timeout、事务型任务拉取示例
  - **SSE**: 从数据库轮询改为 EventSourceResponse + asyncio.Queue Pub/Sub
  - **存储**: 从 `{job_id}/original.png` 改为 `{job_id}/{image_uuid}/...` 支持批量
  - **Mask**: 增加前端 WebP 检测 + PNG 回退，后端 MIME 校验与转码
  - **APScheduler**: 增加 SQLite JobStore、coalesce、misfire_grace_time 配置，提供外部 Cron 备选
  - **Sentry**: 增加 FastAPI lifespan 初始化、React @sentry/react 集成示例
- **队列方案**: SQLite 状态机（非 Redis，减少依赖）
- **存储方案**: 文件系统 + 路径入库（非 BLOB）
- **进度推送**: SSE + Pub/Sub（非 WebSocket，更简单）
- **Mask 格式**: WebP 优先 + PNG 回退（跨浏览器兼容）
