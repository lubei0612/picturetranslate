# Design: SaaS UI 重构与后端增强

## 方案对比（三选一）

### 方案 A: 全量重写 + Feature Slicing
**实现方式**：删除现有前端代码，按 Feature Slicing 从零构建

| 优点 | 缺点 |
|------|------|
| 架构最干净 | 工作量最大（~25h） |
| 无历史包袱 | 风险高，需完整回归测试 |
| 完全符合 AGENTS.md | 现有功能暂时不可用 |

**适用场景**：时间充裕、追求长期可维护性

---

### 方案 B: 渐进式迁移 + 外科手术
**实现方式**：保留现有代码运行，新建 features/ 目录，逐个模块迁移

| 优点 | 缺点 |
|------|------|
| 风险可控，随时可回滚 | 过渡期存在两套代码 |
| 现有功能持续可用 | 需要维护兼容层 |
| 可分阶段交付 | 架构过渡期略混乱 |

**适用场景**：生产环境已上线、需要持续交付

---

### 方案 C: 外部设计稿 Staging 清洗
**实现方式**：将设计稿代码放入 _staging/，Claude 外科手术拆解后合并

| 优点 | 缺点 |
|------|------|
| 复用设计稿 UI 加速开发 | 需要大量拆解重构工作 |
| 符合 Section 16 规范 | 设计稿代码质量未知 |
| UI 一致性有保障 | 可能引入设计稿的技术债 |

**适用场景**：有高质量外部设计稿可参考

---

### 推荐选择：方案 B + C 混合
**理由**：
1. 渐进式迁移保证现有功能可用（方案 B）
2. 设计稿 UI 走 Staging 清洗流程（方案 C）
3. 符合 AGENTS.md Section 14.1 迭代式开发 + Section 16 外部代码协议

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    layouts/                              │ │
│  │         DesktopLayout  |  MobileLayout                  │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ features/│ │ features/│ │ features/│ │ features/│        │
│  │dashboard │ │ editor   │ │ history  │ │ settings │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    shared/                               │ │
│  │    components | hooks | utils | types | api              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    api/routes/                           │ │
│  │   translate | jobs | history | layers | engines         │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    services/                             │ │
│  │   translator | job_queue | history | layer_service      │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    core/                                 │ │
│  │        engines/                   models/                │ │
│  │   ┌─────────────────┐      ┌─────────────────┐          │ │
│  │   │ EngineRegistry  │      │  text_layers    │          │ │
│  │   │ AliyunEngine    │      │  translation    │          │ │
│  │   │ DeepLEngine     │      │  job            │          │ │
│  │   │ GoogleEngine    │      └─────────────────┘          │ │
│  │   └─────────────────┘                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 前端设计

### 目录结构
```
frontend/src/
├── features/
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── ProjectGrid.tsx
│   │   │   ├── UploadZone.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── hooks/
│   │   │   └── useProjects.ts
│   │   ├── api/
│   │   │   └── projectApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── editor/
│   │   ├── components/
│   │   │   ├── ImageViewer.tsx
│   │   │   ├── LayerList.tsx
│   │   │   ├── LayerPanel.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── CropTool.tsx
│   │   ├── hooks/
│   │   │   ├── useLayers.ts
│   │   │   └── useEditor.ts
│   │   ├── api/
│   │   │   └── layerApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── history/
│   │   ├── components/
│   │   │   ├── HistoryList.tsx
│   │   │   └── HistoryItem.tsx
│   │   ├── hooks/
│   │   │   └── useHistoryList.ts
│   │   └── index.ts
│   └── settings/
│       ├── components/
│       │   ├── EngineSelector.tsx
│       │   └── LanguageConfig.tsx
│       ├── hooks/
│       │   └── useSettings.ts
│       └── index.ts
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx
│   │   └── EmptyState.tsx
│   ├── hooks/
│   │   ├── useBreakpoint.ts
│   │   ├── useJobPolling.ts
│   │   └── useOptimisticUpdate.ts
│   ├── utils/
│   │   ├── imageValidation.ts
│   │   └── errorHandler.ts
│   ├── types/
│   │   ├── project.ts
│   │   ├── layer.ts
│   │   └── api.ts
│   └── api/
│       └── client.ts
├── layouts/
│   ├── DesktopLayout.tsx
│   ├── MobileLayout.tsx
│   └── index.ts
├── App.tsx
└── main.tsx
```

### 核心 Interface

```typescript
// shared/types/project.ts
interface Project {
  id: string;
  name: string;
  thumbnail: string;
  currentStage: 'translating' | 'editing' | 'completed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

// shared/types/layer.ts
interface TextLayer {
  id: string;
  translationId: string;
  bbox: [number, number, number, number]; // [x, y, w, h]
  originalText: string;
  translatedText: string;
  style: LayerStyle;
  version: number; // 乐观锁
}

interface LayerStyle {
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  backgroundColor?: string;
  rotation: number;
}

// shared/types/api.ts
interface ApiResponse<T> {
  code: string;
  message: string;
  data?: T;
  detail?: unknown;
}

interface JobResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: unknown;
}
```

### 响应式方案

```typescript
// shared/hooks/useBreakpoint.ts
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof BREAKPOINTS>('desktop');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };
    // ...
  }, []);
  
  return { breakpoint, isMobile: breakpoint === 'mobile' };
}
```

---

## 后端设计

### 策略模式 - 翻译引擎

```python
# core/engines/base.py
from abc import ABC, abstractmethod
from typing import Optional
from pydantic import BaseModel

class TranslateResult(BaseModel):
    translated_image: bytes
    layers: list[dict]
    engine_name: str

class TranslateEngine(ABC):
    name: str
    
    @abstractmethod
    async def translate(
        self, 
        image: bytes, 
        source_lang: str, 
        target_lang: str,
        mask: Optional[bytes] = None
    ) -> TranslateResult:
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        pass


# core/engines/registry.py
from typing import Dict, Type
import asyncio

class EngineRegistry:
    _engines: Dict[str, TranslateEngine] = {}
    _healthy: Dict[str, bool] = {}
    
    @classmethod
    def register(cls, engine: TranslateEngine):
        cls._engines[engine.name] = engine
        cls._healthy[engine.name] = True
    
    @classmethod
    def get(cls, name: str) -> TranslateEngine:
        if name not in cls._engines:
            raise ValueError(f"Engine {name} not found")
        if not cls._healthy.get(name):
            raise RuntimeError(f"Engine {name} is unhealthy")
        return cls._engines[name]
    
    @classmethod
    def list_available(cls) -> list[str]:
        return [k for k, v in cls._healthy.items() if v]
    
    @classmethod
    async def fallback_translate(cls, *args, preferred: str = None, **kwargs):
        """熔断降级：优先使用指定引擎，失败后自动切换"""
        engines = [preferred] if preferred else []
        engines += [e for e in cls._engines if e != preferred]
        
        for engine_name in engines:
            try:
                engine = cls.get(engine_name)
                return await engine.translate(*args, **kwargs)
            except Exception as e:
                cls._healthy[engine_name] = False
                continue
        raise RuntimeError("All engines failed")
```

### 数据库模型

```python
# models/text_layer.py
from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from core.database import Base
import datetime

class TextLayer(Base):
    __tablename__ = "text_layers"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    translation_id = Column(Integer, ForeignKey("translations.id"), nullable=False)
    bbox = Column(JSON, nullable=False)  # [x, y, w, h]
    original_text = Column(String, nullable=False)
    translated_text = Column(String, nullable=False)
    style = Column(JSON, nullable=False)
    version = Column(Integer, default=1)  # 乐观锁
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.datetime.utcnow)
    
    translation = relationship("Translation", back_populates="layers")
```

### API 端点设计

| Method | Path | 描述 | 返回 |
|--------|------|------|------|
| GET | `/api/engines` | 获取可用引擎列表 | `{ engines: string[] }` |
| GET | `/api/translations/{id}/layers` | 获取图层列表 | `{ layers: TextLayer[] }` |
| PATCH | `/api/layers/{id}` | 更新图层（需 version） | `{ layer: TextLayer }` or `409 Conflict` |
| POST | `/api/layers/batch` | 批量更新图层 | `{ layers: TextLayer[] }` |
| POST | `/api/images/{id}/crop` | 异步裁剪 | `{ jobId: string }` |
| POST | `/api/images/{id}/inpaint` | 异步消除笔 | `{ jobId: string }` |

### 错误码规范

```python
# core/exceptions.py
ERROR_CODES = {
    "VALIDATION_ERROR": (400, "请求参数校验失败"),
    "NOT_FOUND": (404, "资源不存在"),
    "VERSION_CONFLICT": (409, "数据已被修改，请刷新后重试"),
    "ENGINE_UNAVAILABLE": (503, "翻译引擎暂不可用"),
    "RATE_LIMITED": (429, "请求过于频繁"),
}
```

---

## 技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 前端路由 | React Router v6 | 多页面结构，支持懒加载 |
| 状态管理 | Zustand | 轻量，Feature Slicing 友好 |
| HTTP Client | Axios | 拦截器、错误处理完善 |
| 后端异步 | Celery + Redis | 成熟方案，替代 ThreadPool |
| 乐观锁 | version 字段 | 简单有效，无需分布式锁 |

---

## 审查共识

### Claude (前端/架构) 确认
- [x] Feature Slicing 目录结构合理
- [x] Interface 定义完整
- [x] 响应式方案可行

### Codex (后端/性能) 确认
- [x] 策略模式 + 熔断降级设计合理
- [x] text_layers 表结构正确
- [x] 乐观锁防并发覆盖
- [x] 异步 Job 避免阻塞

**Status: APPROVED_BY_BOTH**
