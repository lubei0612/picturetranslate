import React from 'react';
import { EmptyState } from '@/shared/components';

export const HistoryPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">历史记录</h1>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <EmptyState
            variant="folder"
            title="暂无历史记录"
            description="开始翻译图片后，历史记录将显示在这里"
          />
        </div>
        
        <p className="text-center text-gray-400 text-sm mt-8">
          待 Phase 4 填充 - History 组件拆解
        </p>
      </div>
    </div>
  );
};

export default HistoryPage;
