import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadZone } from './UploadZone';
import { ProjectList } from './ProjectList';
import { useProjects } from '../hooks/useProjects';
import { useUpload } from '../hooks/useUpload';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, loading, refresh } = useProjects({ demoMode: true });
  const { isUploading, upload, uploadFromUrl } = useUpload();

  const handleProjectClick = (project: { id: string; status: string }) => {
    if (project.status === 'completed') {
      navigate(`/editor/${project.id}`);
    }
  };

  const handleViewAll = () => {
    navigate('/history');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        {/* Upload Section */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">开始新任务</h2>
          <UploadZone
            onUpload={upload}
            onUrlImport={uploadFromUrl}
            isUploading={isUploading}
          />
        </section>

        {/* Project List Section */}
        <section>
          <ProjectList
            projects={projects.slice(0, 4)}
            loading={loading}
            onProjectClick={handleProjectClick}
            onViewAll={handleViewAll}
          />
        </section>
      </div>
    </div>
  );
};
