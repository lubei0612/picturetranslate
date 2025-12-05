import type { Project, ProjectStatus } from '@/shared/types';

export type { Project, ProjectStatus };

export interface DashboardProps {
  onOpenEditor?: (projectId: string) => void;
}

export interface UploadZoneProps {
  onUpload: (file: File, options: UploadOptions) => void;
  onUrlImport: (url: string, options: UploadOptions) => void;
  isUploading?: boolean;
}

export interface UploadOptions {
  sourceLang: string;
  targetLang: string;
}

export interface TaskCardProps {
  project: Project;
  onClick?: () => void;
}

export interface ProjectListProps {
  projects: Project[];
  loading?: boolean;
  onProjectClick?: (project: Project) => void;
  onViewAll?: () => void;
}
