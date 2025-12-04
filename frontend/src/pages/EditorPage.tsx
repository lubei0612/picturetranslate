import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ZoomIn, ZoomOut, MousePointer2, Type, Eraser } from 'lucide-react';
import { Button } from '@/shared/components';

export const EditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">退出</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800">
            图片精修 - {id}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button className="p-1.5 hover:bg-white rounded-md text-gray-600">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs w-10 text-center font-mono text-gray-700">100%</span>
            <button className="p-1.5 hover:bg-white rounded-md text-gray-600">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          <Button variant="primary" icon={<Download className="w-4 h-4" />}>
            下载结果
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <aside className="w-20 bg-white border-r border-gray-200 flex flex-col py-4 items-center space-y-4">
          <ToolButton icon={MousePointer2} label="选择" active />
          <ToolButton icon={Type} label="文字" />
          <ToolButton icon={Eraser} label="消除笔" />
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex items-center justify-center bg-[#F3F4F6]">
          <div className="text-center text-gray-400">
            <p className="text-lg mb-2">编辑器画布</p>
            <p className="text-sm">待 Phase 4 填充 - Editor 组件拆解</p>
          </div>
        </main>

        {/* Right Panel */}
        <aside className="w-[360px] bg-white border-l border-gray-200 p-4">
          <div className="text-center text-gray-400 py-8">
            右侧面板 - 图层设置
          </div>
        </aside>
      </div>
    </div>
  );
};

const ToolButton: React.FC<{ icon: React.ElementType; label: string; active?: boolean }> = ({
  icon: Icon,
  label,
  active = false,
}) => (
  <button
    className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all ${
      active ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
    }`}
  >
    <Icon className={`w-5 h-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default EditorPage;
