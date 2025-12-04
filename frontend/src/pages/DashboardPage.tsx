import React from 'react';
import { UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUpload = () => {
    // 模拟上传后跳转编辑器
    navigate('/editor/demo-1');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Upload Area */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">开始新任务</h2>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div 
              onClick={handleUpload}
              className="p-8 border-b-2 border-dashed border-gray-200 hover:bg-gray-50/50 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">
                  点击或拖拽图片到此处
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  支持 JPG, PNG, WebP (最大 10MB)
                </p>
                
                <Button variant="primary" size="md">
                  选择图片
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Tasks Placeholder */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">近期任务</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              查看全部
            </button>
          </div>
          
          <div className="text-center py-12 text-gray-400">
            待 Phase 4 填充 - Dashboard 组件拆解
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
