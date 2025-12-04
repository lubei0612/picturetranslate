/**
 * 项目相关类型定义
 * @description 定义翻译项目的数据结构
 */

/** 项目阶段枚举 */
export const enum ProjectStage {
  Translating = 'translating',
  Editing = 'editing',
  Completed = 'completed',
}

/** 项目信息 */
export interface Project {
  /** 项目唯一标识 */
  id: string;
  /** 项目名称 */
  name: string;
  /** 缩略图 URL */
  thumbnail: string;
  /** 当前阶段 */
  currentStage: ProjectStage | 'translating' | 'editing' | 'completed';
  /** 进度百分比 0-100 */
  progress: number;
  /** 创建时间 ISO 字符串 */
  createdAt: string;
  /** 更新时间 ISO 字符串 */
  updatedAt: string;
  /** 是否为 Demo 数据 */
  isDemo?: boolean;
}

/** 项目列表查询参数 */
export interface ProjectListParams {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 阶段筛选 */
  stage?: ProjectStage;
  /** 搜索关键词 */
  search?: string;
}

/** 项目列表响应 */
export interface ProjectListResponse {
  /** 项目列表 */
  items: Project[];
  /** 总数 */
  total: number;
  /** 当前页 */
  page: number;
  /** 每页数量 */
  pageSize: number;
}
