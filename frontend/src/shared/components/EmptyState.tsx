import React from 'react';
import { FileQuestion, FolderOpen, Image, Search } from 'lucide-react';
import { Button } from './Button';

type EmptyStateVariant = 'default' | 'search' | 'folder' | 'image';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

const defaultIcons: Record<EmptyStateVariant, React.ReactNode> = {
  default: <FileQuestion className="w-12 h-12 text-gray-300" />,
  search: <Search className="w-12 h-12 text-gray-300" />,
  folder: <FolderOpen className="w-12 h-12 text-gray-300" />,
  image: <Image className="w-12 h-12 text-gray-300" />,
};

const defaultTitles: Record<EmptyStateVariant, string> = {
  default: '暂无数据',
  search: '未找到结果',
  folder: '文件夹为空',
  image: '暂无图片',
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  title,
  description,
  action,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4">
        {icon ?? defaultIcons[variant]}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-1">
        {title ?? defaultTitles[variant]}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};
