# 跨境电商图片翻译 MVP - 项目规格文档

> 创建时间: 2025-12-03
> 状态: 待实施

---

## 一、项目目标

开发一个**亚马逊商品图自动翻译服务**，核心功能是**翻译图片中的文字，同时保留商品主体不被破坏**。

### 目标用户
跨境电商卖家，需要将中文商品图快速翻译成英语/日语/德语等目标语言。

### MVP 交付物
1. FastAPI 后端服务（Docker 部署到 Dokploy）
2. React 前端 Dashboard（基于现有 crossborder-ai 项目改造）

---

## 二、核心技术方案：图层三明治法 (Sandwich Strategy)

### 算法流程

```
原始图片
    │
    ├──► [rembg u2netp] ──► 图层 A: 商品主体 (透明背景)
    │
    └──► [阿里云翻译 API] ──► 图层 B: 翻译后的完整图 (主体可能被误改)
                                    │
                                    ▼
                         [PIL alpha_composite]
                                    │
                                    ▼
                    图层 A 覆盖到 图层 B ──► 最终输出
                    (主体完美还原 + 背景已翻译)
```

### 为什么用这个方案
- 阿里云翻译 API 会翻译图片中**所有文字**，包括商品上的品牌名/型号
- 通过 rembg 提取主体，再覆盖回去，可以**保护商品主体不被破坏**
- 简单高效，适合 MVP 快速验证

---

## 三、服务器约束

| 指标 | 限制 |
|------|------|
| CPU | 2 核 |
| 内存 | 4GB |
| 部署方式 | Dokploy (Docker) |

### 内存优化策略
1. **必须使用 `u2netp` 小模型**（4.7MB），不能用默认的 `u2net`（176MB）会 OOM
2. 限制上传图片尺寸：≤ 2048x2048，≤ 5MB
3. 处理完成后主动 `gc.collect()` 释放内存

---

## 四、阿里云 API 调研结论

### GetImageTranslate 接口

| 指标 | 说明 |
|------|------|
| 返回格式 | **图片 URL**（存储在阿里 CDN，有效期 80 天） |
| 输入限制 | 最大 10MB，最大 8192x8192，宽高比 ≤ 10:1 |
| QPS 限制 | **5 次/秒**（账号维度） |
| 计费 | 通用翻译 0.05 元/张，电商翻译 0.06 元/张 |

### SDK 信息
- 包名: `alibabacloud_alimt20181012`
- 需要的环境变量: `ALI_ACCESS_KEY_ID`, `ALI_ACCESS_KEY_SECRET`

---

## 五、前端项目分析

### 项目路径
```
/Users/apple/Downloads/crossborder-ai
```

### 技术栈
- React 18 + TypeScript
- Tailwind CSS
- Vite 构建

### 现有页面结构

| 页面 | 文件 | 功能 |
|------|------|------|
| Dashboard | `Dashboard.tsx` | 上传图片、选语言、任务列表 |
| Editor | `Editor.tsx` | 图片编辑器（原图/译图对比、图层编辑） |
| History | `History.tsx` | 历史记录 |
| Settings | `Settings.tsx` | 系统设置 |

### 核心数据类型 (types.ts)

```typescript
// 处理阶段
type ProcessStage = 'ocr' | 'classifying' | 'translating' | 'inpainting' | 'done';

// 项目状态
type ProjectStatus = 'processing' | 'completed' | 'failed' | 'queued';

// 文字图层（MVP 阶段暂不使用，后期扩展）
interface TextLayer {
  originalText: string;
  translatedText: string;
  x, y, width, height;  // 位置百分比
  fontSize, fontFamily, color...  // 样式
}
```

### MVP 阶段前端改造计划

| 文件 | 改动说明 |
|------|----------|
| `Dashboard.tsx` | 接入真实上传逻辑，调用后端 `/api/translate` |
| `Editor.tsx` | **简化**：只显示原图/译图对比 + 下载，暂不支持图层编辑 |
| `services/translateService.ts` | **新增**：封装后端 API 调用 |
| `types.ts` | 添加 API 响应类型 |

---

## 六、后端设计

### 目录结构

```
/Users/apple/Desktop/picturetranslate/backend/
├── main.py              # FastAPI 入口
├── requirements.txt     # 依赖
├── Dockerfile           # Docker 构建
├── .env.example         # 环境变量模板
└── services/
    ├── rembg_service.py    # 主体提取
    └── aliyun_translate.py # 阿里云翻译
```

### API 设计

```
POST /api/translate
Content-Type: multipart/form-data

Request:
  - file: 图片文件 (必填)
  - target_lang: 目标语言 (默认 "en")
  - source_lang: 源语言 (默认 "auto")

Response:
{
  "success": true,
  "data": {
    "translated_image": "base64...",  // 翻译后图片
    "original_size": { "width": 1000, "height": 800 }
  }
}
```

### 依赖清单 (requirements.txt)

```
fastapi
uvicorn
python-multipart
rembg[cpu]
pillow
alibabacloud_alimt20181012
aiohttp
```

### Dockerfile 关键点

```dockerfile
FROM python:3.10-slim

# 系统依赖 (rembg 需要)
RUN apt-get update && apt-get install -y libgomp1 wget

# 预下载 u2netp 模型 (避免运行时下载失败)
RUN mkdir -p /root/.u2net && \
    wget -O /root/.u2net/u2netp.onnx \
    https://github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx

# 设置环境变量强制使用小模型
ENV U2NET_HOME=/root/.u2net

# pip 安装
COPY requirements.txt .
RUN pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 七、实施步骤 (TODO)

### Phase 1: 后端开发
- [ ] 创建 FastAPI 项目结构
- [ ] 实现 rembg 主体提取（强制 u2netp）
- [ ] 实现阿里云翻译 API 调用
- [ ] 实现图层合成逻辑
- [ ] 添加图片尺寸限制和内存优化
- [ ] 编写 Dockerfile
- [ ] 本地测试

### Phase 2: 前端改造
- [ ] 创建 `translateService.ts`
- [ ] 改造 `Dashboard.tsx` 接入真实上传
- [ ] 简化 `Editor.tsx` 为预览+下载模式
- [ ] 添加加载状态和错误处理
- [ ] 前后端联调

### Phase 3: 部署
- [ ] 推送到 GitHub
- [ ] Dokploy 配置 Docker 部署
- [ ] 配置环境变量 (阿里云 Key)
- [ ] 验证生产环境

---

## 八、风险清单

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 4G 内存 OOM | 高 | 强制 u2netp + 限制图片尺寸 + gc.collect |
| 阿里云翻译尺寸不一致 | 中 | 合成前 resize 对齐 |
| u2netp 抠图边缘粗糙 | 中 | MVP 接受，后期升级服务器 |
| QPS 5/s 限制 | 中 | Semaphore 限流 |
| 模型下载失败 | 中 | Dockerfile 预下载到镜像 |

---

## 九、环境变量

```env
# .env.example
ALI_ACCESS_KEY_ID=your_access_key_id
ALI_ACCESS_KEY_SECRET=your_access_key_secret
U2NET_HOME=/root/.u2net
MAX_IMAGE_SIZE_MB=5
MAX_IMAGE_DIMENSION=2048
```

---

## 十、参考资料

- 阿里云图片翻译 API: https://help.aliyun.com/zh/machine-translation/developer-reference/api-alimt-2018-10-12-translateimage
- rembg GitHub: https://github.com/danielgatis/rembg
- 前端项目: `/Users/apple/Downloads/crossborder-ai`

---

## 十一、待确认事项

1. ~~MVP 方案：三明治法~~ ✅ 已确认
2. 阿里云 Key 是否已准备好？
3. GitHub 仓库是否已创建？
4. Dokploy 服务器信息？

---

*文档结束 - 随时可以继续实施*
