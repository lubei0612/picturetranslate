import type { Project } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: '智能运动手表_主图_CN.jpg',
    thumbnail: 'https://picsum.photos/id/175/300/300',
    status: 'completed',
    stage: 'done',
    sourceLang: '中文(简体)',
    targetLang: '英语',
    createdAt: '2024-12-02T14:20:00Z',
    updatedAt: '2024-12-02T14:25:00Z',
  },
  {
    id: '2',
    name: '全自动咖啡机_详情页_01.png',
    thumbnail: 'https://picsum.photos/id/1060/300/300',
    status: 'processing',
    stage: 'translating',
    sourceLang: '中文(简体)',
    targetLang: '德语',
    createdAt: '2024-12-02T14:15:30Z',
    updatedAt: '2024-12-02T14:15:30Z',
  },
  {
    id: '3',
    name: '女士瑜伽服_尺码表.jpg',
    thumbnail: 'https://picsum.photos/id/1025/300/300',
    status: 'processing',
    stage: 'ocr',
    sourceLang: '中文(简体)',
    targetLang: '日语',
    createdAt: '2024-12-02T14:10:05Z',
    updatedAt: '2024-12-02T14:10:05Z',
  },
  {
    id: '4',
    name: '进口面膜_成分说明.jpg',
    thumbnail: 'https://picsum.photos/id/64/300/300',
    status: 'failed',
    stage: 'ocr',
    sourceLang: '韩语',
    targetLang: '中文(简体)',
    createdAt: '2024-12-01T09:12:00Z',
    updatedAt: '2024-12-01T09:15:00Z',
  },
];

export const DEMO_FLAG = '__demo__';

export function isDemoProject(project: Project): boolean {
  return project.id.startsWith(DEMO_FLAG);
}
