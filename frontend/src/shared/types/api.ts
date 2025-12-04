/**
 * API 通用类型定义
 * @description 定义 API 请求/响应的通用结构
 */

/** 错误码枚举 */
export const enum ErrorCode {
  /** 成功 */
  Success = 'SUCCESS',
  /** 参数校验失败 */
  ValidationError = 'VALIDATION_ERROR',
  /** 资源不存在 */
  NotFound = 'NOT_FOUND',
  /** 版本冲突 (乐观锁) */
  VersionConflict = 'VERSION_CONFLICT',
  /** 翻译引擎不可用 */
  EngineUnavailable = 'ENGINE_UNAVAILABLE',
  /** 请求过于频繁 */
  RateLimited = 'RATE_LIMITED',
  /** 服务器内部错误 */
  InternalError = 'INTERNAL_ERROR',
}

/** 通用 API 响应 */
export interface ApiResponse<T = unknown> {
  /** 响应码 */
  code: string;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data?: T;
  /** 详细信息 (错误时) */
  detail?: unknown;
}

/** Job 状态枚举 */
export const enum JobStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed',
}

/** Job 响应 */
export interface JobResponse {
  /** 任务 ID */
  jobId: string;
  /** 任务状态 */
  status: JobStatus | 'pending' | 'processing' | 'completed' | 'failed';
  /** 进度百分比 0-100 */
  progress?: number;
  /** 任务结果 */
  result?: unknown;
  /** 错误信息 */
  error?: string;
}

/** 翻译引擎信息 */
export interface EngineInfo {
  /** 引擎名称 */
  name: string;
  /** 显示名称 */
  displayName: string;
  /** 是否可用 */
  available: boolean;
}

/** 引擎列表响应 */
export interface EngineListResponse {
  /** 可用引擎列表 */
  engines: string[];
  /** 默认引擎 */
  default: string;
}

/** 分页参数 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/** 分页响应 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 裁剪请求 */
export interface CropRequest {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/** Inpaint (消除笔) 请求 */
export interface InpaintRequest {
  /** Mask 图片 Base64 */
  maskBase64: string;
}
