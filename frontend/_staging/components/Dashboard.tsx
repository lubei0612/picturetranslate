import React from 'react';
import { UploadCloud, Link as LinkIcon, ArrowRight, Loader2, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { MOCK_PROJECTS } from '../constants';
import { Project } from '../types';

interface DashboardProps {
  onOpenEditor: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenEditor }) => {
  return (
    <div className="flex-1 min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-8 overflow-y-auto">
      
      {/* 1. New Project / Upload Area */}
      <div className="max-w-5xl mx-auto mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">开始新任务</h2>
        
        <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-200 overflow-hidden">
          {/* Top Zone: File Upload */}
          <div className="p-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors cursor-pointer border-dashed border-b-2">
             <div className="flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-medium text-gray-900 mb-1">点击或拖拽图片到此处</h3>
                <p className="text-sm text-gray-500 mb-6">支持 JPG, PNG, WebP (最大 10MB)</p>
                
                {/* Quick Settings Inline - Simplified */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="flex items-center space-x-2">
                    <select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2">
                      <option>自动检测语言</option>
                      <option>英语</option>
                      <option>日语</option>
                    </select>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <select className="bg-white border border-blue-500 text-blue-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 font-medium bg-blue-50">
                      <option>中文 (简体)</option>
                      <option>英语</option>
                      <option>西班牙语</option>
                    </select>
                  </div>
                </div>
             </div>
          </div>

          {/* Bottom Zone: URL Import */}
          <div className="px-8 py-4 bg-gray-50/50 flex items-center space-x-4">
            <LinkIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="粘贴图片链接 (例如: https://example.com/product.jpg)" 
              className="flex-1 bg-transparent border-none text-sm text-gray-900 placeholder-gray-400 focus:ring-0"
            />
            <button className="px-4 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm">
              导入链接
            </button>
          </div>
        </div>
      </div>

      {/* 2. Task List */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">近期任务</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">查看全部</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {MOCK_PROJECTS.map((project) => (
            <TaskCard key={project.id} project={project} onClick={onOpenEditor} />
          ))}
        </div>
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ project: Project; onClick: () => void }> = ({ project, onClick }) => {
  return (
    <div 
      onClick={project.status === 'completed' ? onClick : undefined}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group ${project.status === 'completed' ? 'cursor-pointer' : ''}`}
    >
      <div className="p-4 flex space-x-4">
        {/* Thumbnail */}
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
          <img src={project.thumbnail} className="w-full h-full object-cover" alt="Thumbnail" />
          {project.status === 'completed' && (
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white text-xs px-2 py-1 rounded shadow-sm text-gray-800 font-medium">编辑</span>
             </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <div className="flex justify-between items-start">
               <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">{project.name}</h3>
               <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
               <span className="bg-gray-100 px-1.5 py-0.5 rounded">{project.sourceLang} → {project.targetLang}</span>
               <span>•</span>
               <span>{project.createTime}</span>
            </div>
          </div>

          {/* Simple Status Visualization */}
          <div className="mt-3">
            {project.status === 'processing' ? (
              <div className="flex items-center text-blue-600 text-xs mt-2 bg-blue-50/50 p-2 rounded w-fit">
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                <span>正在处理中...</span>
              </div>
            ) : project.status === 'failed' ? (
              <div className="flex items-center text-red-600 text-xs mt-2 bg-red-50 p-2 rounded w-fit">
                 <AlertCircle className="w-3 h-3 mr-1.5" />
                 <span>处理失败: 请重试</span>
              </div>
            ) : (
              <div className="flex items-center text-green-600 text-xs mt-2 bg-green-50/50 p-2 rounded w-fit">
                 <CheckCircle2 className="w-3 h-3 mr-1.5" />
                 <span>翻译完成</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles = {
    processing: 'bg-blue-50 text-blue-700',
    completed: 'bg-green-50 text-green-700',
    failed: 'bg-red-50 text-red-700',
    queued: 'bg-gray-100 text-gray-600',
  };
  
  const labels = {
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    queued: '排队中'
  };

  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof styles]}
    </span>
  );
};
