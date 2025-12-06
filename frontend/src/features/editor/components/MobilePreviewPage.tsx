import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, useToast } from '@/shared/components';
import { historyApi, EditorData } from '@/features/history/api/historyApi';

type ImageTab = 'original' | 'translated';

// 处理图片 URL，确保是完整路径（统一走前端同源）
const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  return url;
};

export const MobilePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EditorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ImageTab>('translated');
  const [scale, setScale] = useState(1);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const editorData = await historyApi.getEditorData(id);
        setData(editorData);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('加载失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleDownload = async () => {
    const url = activeTab === 'original' 
      ? resolveImageUrl(data?.original_url) 
      : resolveImageUrl(data?.result_url);
    if (!url) {
      toast.error('图片不可用');
      return;
    }
    
    try {
      toast.info('正在下载...');
      const response = await fetch(url);
      if (!response.ok) throw new Error('下载失败');
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const suffix = activeTab === 'original' ? 'original' : 'translated';
      link.download = `${id}_${suffix}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('下载完成');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('下载失败');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!confirm('确定要删除这条翻译记录吗？')) return;
    
    try {
      setDeleting(true);
      await historyApi.delete(id);
      toast.success('删除成功');
      navigate('/');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-400">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
        <header className="h-12 bg-gray-900 flex items-center px-3">
          <button onClick={handleBack} className="p-2 text-white/80">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-gray-400 mb-4">{error || '数据不可用'}</p>
            <Button variant="secondary" onClick={handleBack}>返回首页</Button>
          </div>
        </div>
      </div>
    );
  }

  const originalUrl = resolveImageUrl(data.original_url);
  const resultUrl = resolveImageUrl(data.result_url);
  const currentImageUrl = activeTab === 'original' ? originalUrl : resultUrl;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-12 bg-gray-800 flex items-center justify-between px-3 shrink-0">
        <button onClick={handleBack} className="p-2 text-white/80 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-white">翻译预览</span>
        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* Tab Switcher */}
      <div className="flex bg-gray-800 border-t border-gray-700 shrink-0">
        <button
          onClick={() => { setActiveTab('original'); setScale(1); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'original'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400'
          }`}
        >
          原图
        </button>
        <button
          onClick={() => { setActiveTab('translated'); setScale(1); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'translated'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400'
          }`}
        >
          译图
        </button>
      </div>

      {/* Image Viewer */}
      <div className="flex-1 overflow-auto relative bg-gray-900">
        <div 
          className="min-h-full flex items-center justify-center p-4"
          style={{ minHeight: '100%' }}
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt={activeTab === 'original' ? '原图' : '译图'}
              className="max-w-full object-contain rounded-lg transition-transform duration-200"
              style={{ transform: `scale(${scale})` }}
              draggable={false}
            />
          ) : (
            <p className="text-gray-500">图片不可用</p>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-gray-800/90 rounded-full flex items-center justify-center text-white/80 hover:text-white"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-gray-800/90 rounded-full flex items-center justify-center text-white/80 hover:text-white"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-around shrink-0 safe-area-pb">
        <button
          onClick={handleDownload}
          className="flex flex-col items-center text-gray-300 hover:text-white"
        >
          <Download className="w-6 h-6" />
          <span className="text-xs mt-1">下载</span>
        </button>
        
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex flex-col items-center text-red-400 hover:text-red-300 disabled:opacity-50"
        >
          {deleting ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Trash2 className="w-6 h-6" />
          )}
          <span className="text-xs mt-1">删除</span>
        </button>
      </div>
    </div>
  );
};

export default MobilePreviewPage;
