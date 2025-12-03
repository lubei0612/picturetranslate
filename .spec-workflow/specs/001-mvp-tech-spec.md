# MVP 技术规格文档

> 创建时间: 2025-12-03
> 状态: Clarify 阶段完成，待 Codex 审查
> 版本: v0.1

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

## 七、待审查问题 (Codex Review)

1. **阿里云 API 返回**：URL 需额外下载，延迟影响？
2. **内存预估**：u2netp + 2048x2048 图片，4GB 够用？
3. **Streamlit 并发**：多用户同时处理是否 OOM？
4. **模型预下载**：Dockerfile 是否需要预置 u2netp.onnx？
5. **边缘羽化**：PIL GaussianBlur 是否最佳方案？

---

## 八、风险清单 (初版)

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 4GB OOM | 高 | 强制 u2netp + 限制图片尺寸 |
| 阿里云返回尺寸不一致 | 中 | 合成前 resize 对齐 |
| 模型下载失败 | 中 | Dockerfile 预下载 |
| QPS 限制 (5/s) | 低 | MVP 单用户，暂不限流 |

---

## 九、审批记录

| 阶段 | 状态 | 审批人 | 时间 |
|------|------|--------|------|
| Clarify | ✅ 完成 | Claude | 2025-12-03 |
| Codex Review | ⏳ 待审 | - | - |
| Options | ⏳ 待定 | - | - |
| Final Decision | ⏳ 待定 | - | - |
| Implementation | ⏳ 待批 | - | - |

---

*文档版本: v0.1 - Clarify 阶段*
