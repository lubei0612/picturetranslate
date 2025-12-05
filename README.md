# 图片翻译 SaaS (PictureTranslate)

跨境电商图片翻译工具，基于阿里云机器翻译 API，支持中英文图片互译到 17 种语言。

## 技术栈

- **后端**: FastAPI + SQLite + 阿里云翻译 API
- **前端**: React + TypeScript + Vite + Tailwind CSS
- **部署**: Docker + Traefik

## 项目结构

```
picturetranslate/
├── api/                    # FastAPI 路由层
│   ├── routes/             # API 端点 (translate, history, jobs, layers)
│   └── schemas/            # Pydantic 数据模型
├── core/                   # 核心业务逻辑
│   ├── engines/            # 翻译引擎 (阿里云)
│   ├── config.py           # 环境配置
│   └── database.py         # 数据库连接
├── services/               # 服务层
│   ├── translator.py       # 翻译服务
│   ├── job_queue.py        # 任务队列
│   └── history.py          # 历史记录
├── models/                 # SQLAlchemy 模型
├── utils/                  # 工具函数
├── tests/                  # 测试用例
├── frontend/               # React 前端
│   ├── src/features/       # 功能模块 (dashboard, editor, settings)
│   └── src/shared/         # 共享组件
├── assets/                 # 静态资源 (字体文件)
├── migrations/             # 数据库迁移
├── storage/                # 翻译结果存储 (gitignore)
├── data/                   # SQLite 数据库 (gitignore)
├── Dockerfile              # 后端容器
├── docker-compose.yml      # 编排配置
└── requirements.txt        # Python 依赖
```

## 快速开始

### 环境变量

```bash
cp .env.example .env
# 编辑 .env 填入阿里云 API Key
```

### 本地开发

```bash
# 后端
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/jobs` | 创建翻译任务 |
| GET | `/api/jobs/{id}/stream` | SSE 任务进度 |
| GET | `/api/history` | 翻译历史 |
| GET | `/api/translations/{id}` | 翻译详情 |
| GET | `/health` | 健康检查 |

## 支持语言

**源语言**: 中文、英语

**目标语言** (17种): 英语、日语、韩语、繁体中文、俄语、西班牙语、法语、德语、意大利语、葡萄牙语、荷兰语、波兰语、土耳其语、泰语、越南语、印尼语、马来语

## License

MIT
