
export type ProjectStatus = 'processing' | 'completed' | 'failed' | 'queued';

export type ProcessStage = 'ocr' | 'classifying' | 'translating' | 'inpainting' | 'done';

export interface Project {
  id: string;
  name: string;
  thumbnail: string;
  status: ProjectStatus;
  currentStage?: ProcessStage;
  sourceLang: string;
  targetLang: string;
  domain: string;
  createTime: string;
  itemCount: number;
}

export interface TextLayer {
  id: string;
  originalText: string;
  translatedText: string;
  translationEngine?: 'google' | 'aliyun' | 'gpt4' | 'deepl';
  
  // Positioning (Percentages)
  x: number; 
  y: number; 
  width: number; 
  height: number; 

  // Typography
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string; // For text background
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  alignment: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;

  isVisible: boolean;
  type?: 'text'; // Simplified to just text as rect is removed
}

export type ViewState = 'dashboard' | 'history' | 'settings' | 'editor';

export type ToolType = 'select' | 'text' | 'eraser' | 'resize' | 'help';
