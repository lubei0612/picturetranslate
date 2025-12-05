import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw } from 'lucide-react';
import { HistoryTable } from './HistoryTable';
import { useHistory } from '../hooks/useHistory';
import { Button, SkeletonList, useToast } from '@/shared/components';
import { useGlobalSettings } from '@/shared/context';
import type { HistoryItem } from '../types';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useGlobalSettings();
  const { items, loading, refresh, deleteItem } = useHistory({ demoMode: settings.demoMode });
  const toast = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleItemClick = (item: HistoryItem) => {
    if (item.projectId) {
      navigate(`/editor/${item.projectId}`);
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    try {
      setDeletingId(item.id);
      await deleteItem(item.id);
      toast.success('记录已删除');
    } catch (err) {
      console.error('Failed to delete history item', err);
      toast.error('删除失败，请重试');
    } finally {
      setDeletingId(null);
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
          <HistoryTable
            items={items}
            onItemClick={handleItemClick}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </div>
    </div>
  );
};
