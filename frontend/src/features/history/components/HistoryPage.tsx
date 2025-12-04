import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw } from 'lucide-react';
import { HistoryTable } from './HistoryTable';
import { useHistory } from '../hooks/useHistory';
import { Button, SkeletonList } from '@/shared/components';
import type { HistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, loading, refresh } = useHistory({ demoMode: true });

  const handleItemClick = (item: HistoryItem) => {
    if (item.projectId) {
      navigate(`/editor/${item.projectId}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-800 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-400" />
            历史记录
          </h1>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={refresh}
          >
            刷新
          </Button>
        </div>

        {/* Content */}
        {loading ? (
          <SkeletonList count={5} />
        ) : (
          <HistoryTable items={items} onItemClick={handleItemClick} />
        )}
      </div>
    </div>
  );
};
