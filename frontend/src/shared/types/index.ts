/**
 * 共享类型统一导出
 */

// Project 相关
export {
  ProjectStage,
  type Project,
  type ProjectListParams,
  type ProjectListResponse,
} from './project';

// Layer 相关
export {
  type BoundingBox,
  type LayerStyle,
  type TextLayer,
  type TextLayerUpdateRequest,
  type TextLayerBatchUpdateRequest,
  DEFAULT_LAYER_STYLE,
} from './layer';

// API 相关
export {
  ErrorCode,
  JobStatus,
  type ApiResponse,
  type JobResponse,
  type EngineInfo,
  type EngineListResponse,
  type PaginationParams,
  type PaginatedResponse,
  type CropRequest,
  type InpaintRequest,
} from './api';
