# MVP 技术规格文档

> 创建时间: 2025-12-03
> 状态: Decision 阶段完成，待实现确认
> 版本: v0.3

---

## 一、需求概述

### 产品目标
跨境电商商品图自动翻译 MVP，核心是翻译背景营销文字，同时绝对保护商品主体。

### 目标用户
亚马逊卖家，需将中文商品图翻译成英/日/德等语言。

### MVP 范围

| 包含 | 不包含 |
|------|--------|
| 单图上传翻译 | 批量处理 |
| 中→英翻译 | 用户账户系统 |
| 左右对比预览 | 历史记录 |
| 结果下载 | 图层手动编辑 |

---

## 二、核心技术方案：三明治法

```
┌─────────────────────────────────────────────────────────────┐
│                      用户上传原图                            │
└─────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│  阿里云翻译 API        │           │  rembg 本地抠图        │
│  alibabacloud_alimt   │           │  模型: u2netp (4.7MB) │
│  → Layer 1 (底层)     │           │  + 1px 边缘羽化        │
└───────────────────────┘           │  → Layer 2 (顶层)     │
            │                       └───────────────────────┘
            └─────────────────┬─────────────────┘
                              ▼
                    ┌─────────────────┐
                    │  PIL 图层合成    │
                    │  alpha_composite │
                    └─────────────────┘
                              │
                              ▼
              最终图：背景已翻译 + 商品主体完好
```

### 为什么用这个方案
- 阿里云看到完整上下文，翻译排版更自然
- 虽然会误翻 Logo，但被 rembg 抠出的主体覆盖
- 低成本高质量，适合 MVP 验证

---

## 三、技术栈

| 层级 | 技术选型 | 说明 |
|------|----------|------|
| 界面 | Streamlit | 快速原型，单体应用 |
| 抠图 | rembg + u2netp | 轻量模型，4GB 内存友好 |
| 翻译 | 阿里云 alimt API | GetImageTranslate 接口 |
| 合成 | Pillow (PIL) | alpha_composite |
| 部署 | Docker + Dokploy | 容器化部署 |

### 依赖清单
```
streamlit
rembg[cpu]
pillow
alibabacloud_alimt20181012
alibabacloud_tea_openapi
watchdog
requests
```

---

## 四、项目结构

```
/picturetranslate/
├── .spec-workflow/          # 规格文档
├── app.py                   # Streamlit 主入口
├── processor.py             # ImageTranslator 类
├── requirements.txt         # Python 依赖
├── Dockerfile               # 容器构建
├── .env.example             # 环境变量模板
├── AGENTS.md                # 开发规范
└── PROJECT_SPEC.md          # 原始需求
```

---

## 五、API 设计

### ImageTranslator 类 (processor.py)

```python
class ImageTranslator:
    def __init__(self, access_key_id: str, access_key_secret: str):
        """初始化阿里云客户端"""
    
    def remove_background(self, image: PIL.Image) -> PIL.Image:
        """rembg 抠图，返回 RGBA 透明背景"""
    
    def translate_background(self, image_bytes: bytes) -> PIL.Image:
        """调用阿里云翻译，返回翻译后的图片"""
    
    def composite(self, bg: PIL.Image, subject: PIL.Image) -> PIL.Image:
        """合成：subject 覆盖到 bg"""
    
    def process(self, image: PIL.Image) -> PIL.Image:
        """完整流程：翻译 + 抠图 + 合成"""
```

---

## 六、部署配置

### Dockerfile 关键点
- 基础镜像: `python:3.10-slim`
- 系统依赖: `libgl1`, `libglib2.0-0` (rembg 需要)
- 端口: `8501`
- 环境变量: `U2NET_HOME=/root/.u2net`
- 预下载模型: 避免运行时下载

### 环境变量
```env
ALI_ACCESS_KEY_ID=xxx
ALI_ACCESS_KEY_SECRET=xxx
U2NET_HOME=/root/.u2net
```

---

## 七、Codex 审查结果 ✅

| 问题 | 结论 | 落地措施 |
|------|------|----------|
| 1. 阿里云 URL 下载 | ✅ 同步可行，1-2 并发延迟 ~1-2s | `requests.get(stream=True, timeout=5)` + 重试 |
| 2. 内存与尺寸 | ⚠️ 4GB 需封顶 | 上传 ≤12MB、长边 ≤2048px、强制 RGB、rembg 前 thumbnail |
| 3. Streamlit 生产 | ⚠️ 需配置参数 | `--server.maxUploadSize=10 --server.enableXsrfProtection=true`，限 2 workers |
| 4. Dockerfile | ⚠️ 需预热 | 构建时下载 u2netp.onnx 到 `/root/.u2net/`，安装 libgl1-mesa libglib2.0-0 |
| 5. 边缘羽化 | ⚠️ 可优化 | 改用 cv2.GaussianBlur 或形态学膨胀，效果更可控 |
| 6. 额外风险 | ⚠️ 多项 | 添加 token bucket、超时回退原图、启动预热模型、增加日志 |

---

## 八、Options 阶段 - 三套方案

### 方案 A：最小可行版 (Minimal)
```
特点: 同步处理、基础错误处理、PIL 羽化
优点: 实现最快 (~2h)、依赖最少
缺点: 边缘效果一般、无频控保护、无日志
适用: 内部演示、快速验证
```

### 方案 B：优化生产版 (Optimized) ⭐ 推荐
```
特点: cv2 边缘处理、token bucket 频控、预热模型、结构化日志
优点: 边缘效果好、生产可用、资源限制完善
缺点: 实现稍复杂 (~4h)、依赖 opencv-python-headless
适用: MVP 上线、小规模用户验证
```

### 方案 C：健壮企业版 (Robust)
```
特点: 异步队列、Redis 缓存、Prometheus 监控、多 worker
优点: 高并发、可观测性强、企业级稳定
缺点: 实现复杂 (~8h+)、需额外基础设施
适用: 后期扩展、高流量场景
```

---

## 九、Review 阶段 - 风险识别

### 综合风险矩阵

| 风险 | 等级 | 概率 | 影响 | 方案 B 应对 |
|------|------|------|------|-------------|
| 4GB OOM | 高 | 中 | 服务崩溃 | 12MB/2048px 硬限制 + thumbnail 预处理 |
| 阿里云频控 (5 QPS) | 中 | 低 | 请求失败 | token bucket 限流 + 指数退避重试 |
| 网络超时 | 中 | 中 | 用户等待 | 5s timeout + 回退原图 |
| rembg 首次下载阻塞 | 高 | 一次性 | 首请求 30s+ | Dockerfile 预下载 + 启动脚本触发 |
| 边缘锯齿 | 中 | 中 | 效果差 | cv2 羽化 + 可调半径 (3-5px) |
| 无日志/监控 | 低 | - | 难排查 | logging 模块 + 结构化输出 |

### 架构审查结论

1. **内存安全**：方案 B 的双重限制 (12MB + 2048px) 确保峰值 <2GB，留足余量
2. **延迟可接受**：单图处理 3-8s (抠图 ~2s + 翻译 ~3s + 合成 ~0.5s)
3. **并发能力**：2-core 限制下支持 1-2 并发用户，符合 MVP 预期
4. **边缘质量**：cv2 方案经 Codex 确认优于 PIL，值得额外依赖

---

## 十、Decision 阶段 - 最终决策

### 选定方案：B - 优化生产版

**决策理由：**
1. **平衡点最优**：4h 实现周期 vs 生产级稳定性
2. **Codex 建议全覆盖**：6 项风险点均有对应措施
3. **扩展性预留**：结构化代码便于后续升级到方案 C
4. **用户体验**：cv2 边缘处理显著优于 PIL

### 实现清单 (方案 B)

| 文件 | 核心功能 |
|------|----------|
| `app.py` | Streamlit UI + 12MB/2048px 校验 + 左右对比 |
| `processor.py` | ImageTranslator + cv2 羽化 + token bucket |
| `Dockerfile` | python:3.11-slim + 预下载 u2netp + 系统依赖 |
| `requirements.txt` | 锁定版本 + opencv-python-headless |
| `startup.sh` | 模型预热脚本 |

### 技术约束 (硬性)

```python
MAX_UPLOAD_SIZE = 12 * 1024 * 1024  # 12MB
MAX_DIMENSION = 2048                 # 长边限制
FEATHER_RADIUS = 3                   # 羽化半径
API_TIMEOUT = 5                      # 秒
RETRY_COUNT = 3                      # 重试次数
```

---

## 十一、审批记录

| 阶段 | 状态 | 审批人 | 时间 |
|------|------|--------|------|
| Clarify | ✅ 完成 | Claude | 2025-12-03 |
| Codex Review | ✅ 完成 | Codex | 2025-12-03 |
| Options | ✅ 完成 | Claude | 2025-12-03 |
| Review | ✅ 完成 | Claude | 2025-12-03 |
| Decision | ✅ 完成 | Claude | 2025-12-03 |
| Implementation | ⏳ 待用户确认 | - | - |

---

*文档版本: v0.3 - Decision 阶段完成*
