import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from './UploadZone';
import { ProjectList } from './ProjectList';
import { useProjects } from '../hooks/useProjects';
import { useUpload } from '../hooks/useUpload';
import { PullToRefresh } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks';
import { useGlobalSettings } from '@/shared/context';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { settings } = useGlobalSettings();
  const { projects, loading, refresh } = useProjects({ demoMode: settings.demoMode });
  const { isUploading, upload, uploadFromUrl } = useUpload();

  const handleProjectClick = (project: { id: string; status: string }) => {
    if (project.status === 'completed') {
      navigate(`/editor/${project.id}`);
    }
  };

  const handleViewAll = () => {
    navigate('/history');
  };

  const content = (
    <div className="max-w-5xl mx-auto">
      {/* Upload Section */}
      <section className="mb-6 md:mb-10">
        <h2 className="text-base md:text-lg font-semibold text-gray-800 mb-3 md:mb-4">
          开始新任务
        </h2>
        <UploadZone
          onUpload={upload}
          onUrlImport={uploadFromUrl}
          isUploading={isUploading}
        />
      </section>

      {/* Project List Section */}
      <section>
        <ProjectList
          projects={projects.slice(0, isMobile ? 6 : 4)}
          loading={loading}
          onProjectClick={handleProjectClick}
          onViewAll={handleViewAll}
        />
      </section>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8 overflow-y-auto">
      {isMobile ? (
        <PullToRefresh onRefresh={refresh}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}
    </div>
  );
};
