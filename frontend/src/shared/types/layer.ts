/**
 * 文字图层相关类型定义
 * @description 定义图片中识别出的文字图层数据结构
 */

/** 边界框类型 [x, y, width, height] */
export type BoundingBox = [number, number, number, number];

/** 图层样式 */
export interface LayerStyle {
  /** 字体家族 */
  fontFamily: string;
  /** 字体大小 (px) */
  fontSize: number;
  /** 字体颜色 (hex) */
  fontColor: string;
  /** 背景颜色 (hex, 可选) */
  backgroundColor?: string;
  /** 旋转角度 (度) */
  rotation: number;
}

/** 文字图层 */
export interface TextLayer {
  /** 图层唯一标识 */
  id: string;
  /** 关联的翻译记录 ID */
  translationId: string;
  /** 边界框 [x, y, w, h] */
  bbox: BoundingBox;
  /** 原文 */
  originalText: string;
  /** 译文 */
  translatedText: string;
  /** 样式配置 */
  style: LayerStyle;
  /** 版本号 (乐观锁) */
  version: number;
}

/** 图层更新请求 */
export interface TextLayerUpdateRequest {
  /** 译文 */
  translatedText?: string;
  /** 样式配置 */
  style?: Partial<LayerStyle>;
  /** 当前版本号 (必须) */
  version: number;
}

/** 图层批量更新请求 */
export interface TextLayerBatchUpdateRequest {
  /** 关联的翻译记录 ID */
  translationId: string;
  /** 图层更新列表 */
  layers: Array<{
    id: string;
    translatedText?: string;
    style?: Partial<LayerStyle>;
    version: number;
  }>;
}

/** 默认样式 */
export const DEFAULT_LAYER_STYLE: LayerStyle = {
  fontFamily: 'Arial',
  fontSize: 14,
  fontColor: '#000000',
  rotation: 0,
};
