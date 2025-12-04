import React from 'react';
import { TaskCard } from './TaskCard';
import { SkeletonCard, EmptyState } from '@/shared/components';
import type { ProjectListProps } from '../types';

export const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  loading = false,
  onProjectClick,
  onViewAll,
}) => {
  if (loading && projects.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <EmptyState
          variant="image"
          title="暂无翻译任务"
          description="上传图片开始第一个翻译任务"
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">近期任务</h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            查看全部
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((project) => (
          <TaskCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick?.(project)}
          />
        ))}
      </div>
    </div>
  );
};
