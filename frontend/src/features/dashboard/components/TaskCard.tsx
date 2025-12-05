import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { LazyImage } from '@/shared/components';
import type { TaskCardProps, Project, ProjectStatus } from '../types';

export const TaskCard: React.FC<TaskCardProps> = ({ project, onClick }) => {
  const isClickable = project.status === 'completed';

  return (
    <div
      data-testid="project-card"
      onClick={isClickable ? onClick : undefined}
      className={`
        relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm
        transition-all duration-200 group
        ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
      `}
    >
      {project.isDemo && (
        <span
          data-testid="project-demo-badge"
          className="absolute top-3 right-3 text-[10px] uppercase tracking-wide font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full"
        >
          Demo
        </span>
      )}
      <div className="p-4 flex space-x-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
          {project.thumbnail ? (
            <LazyImage
              src={project.thumbnail}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-xs">无预览</span>
            </div>
          )}

          {/* Hover overlay for completed projects */}
          {isClickable && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-white text-xs px-2 py-1 rounded shadow-sm text-gray-800 font-medium">
                编辑
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {project.name}
              </h3>
              <StatusBadge status={project.status} />
            </div>

            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1.5 text-xs text-gray-500">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded">
                {project.sourceLang} → {project.targetLang}
              </span>
              <span>•</span>
              <span>{formatTime(project.createdAt)}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-3">
            <StatusMessage status={project.status} stage={project.stage} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  const config: Record<ProjectStatus, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-gray-100', text: 'text-gray-600', label: '排队中' },
    processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: '处理中' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', label: '已完成' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', label: '失败' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${bg} ${text}`}>
      {label}
    </span>
  );
};

const StatusMessage: React.FC<{ status: ProjectStatus; stage?: string }> = ({ status, stage }) => {
  if (status === 'processing') {
    const stageLabels: Record<string, string> = {
      ocr: '文字识别中...',
      translating: '翻译中...',
      inpainting: '图像修复中...',
      rendering: '渲染中...',
    };
    return (
      <div className="flex items-center text-blue-600 text-xs bg-blue-50/50 p-2 rounded w-fit">
        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
        <span>{stage ? stageLabels[stage] || '处理中...' : '处理中...'}</span>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex items-center text-red-600 text-xs bg-red-50 p-2 rounded w-fit">
        <AlertCircle className="w-3 h-3 mr-1.5" />
        <span>处理失败: 请重试</span>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="flex items-center text-green-600 text-xs bg-green-50/50 p-2 rounded w-fit">
        <CheckCircle2 className="w-3 h-3 mr-1.5" />
        <span>翻译完成</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-500 text-xs bg-gray-50 p-2 rounded w-fit">
      <Clock className="w-3 h-3 mr-1.5" />
      <span>等待处理</span>
    </div>
  );
};

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
