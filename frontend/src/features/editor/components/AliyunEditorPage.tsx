import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Button, useToast } from '@/shared/components';
import { useIsMobile } from '@/shared/hooks';
import { historyApi, EditorData } from '@/features/history/api/historyApi';
import { MobilePreviewPage } from './MobilePreviewPage';

export const AliyunEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const isMobile = useIsMobile();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    
    const fetchEditorData = async () => {
      try {
        setLoading(true);
        const data = await historyApi.getEditorData(id);
        setEditorData(data);
        
        if (!data.editor_data) {
          setError('该翻译没有编辑器数据，可能是旧版本翻译或翻译失败');
        }
      } catch (err) {
        console.error('Failed to fetch editor data:', err);
        setError('加载编辑器数据失败');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEditorData();
  }, [id]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.type) return;
      
      try {
        const postData = JSON.parse(event.data);
        const { type, data } = postData;
        
        switch (type) {
          case 'base64':
            handleDownload(data);
            break;
          case 'submit':
            toast.success('编辑完成');
            break;
          case 'autoHeight':
            if (iframeRef.current && data.editorHeight) {
              iframeRef.current.style.height = `${data.editorHeight}px`;
            }
            break;
          default:
            break;
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('message', handleMessage, true);
    return () => window.removeEventListener('message', handleMessage, true);
  }, [toast]);

  useEffect(() => {
    if (!iframeReady || !editorData?.editor_data || !iframeRef.current) return;

    try {
      const parsed = JSON.parse(editorData.editor_data);
      const templateJson = Array.isArray(parsed) ? parsed : [parsed];

      const payload = {
        sourceLang: editorData.source_lang,
        targetLang: editorData.target_lang,
        templateJson,
        locale: 'zh-cn',
        downloadable: true,
      };

      iframeRef.current.contentWindow?.postMessage(JSON.stringify(payload), '*');
    } catch (err) {
      console.error('Failed to parse editor data:', err);
      setError('编辑器数据解析失败');
    }
  }, [iframeReady, editorData]);

  const handleIframeLoad = () => {
    setIframeReady(true);
  };

  const handleDownload = (base64Data: string) => {
    try {
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = `translated_${id}_edited.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('下载完成');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('下载失败');
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  // 手机端显示简化的预览页面（必须在所有 hooks 之后）
  if (isMobile) {
    return <MobilePreviewPage />;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">加载编辑器...</p>
        </div>
      </div>
    );
  }

  if (error || !editorData?.editor_data) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm">
          <button 
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">返回</span>
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-4">{error || '编辑器数据不可用'}</p>
            <p className="text-gray-400 text-sm mb-6">
              请尝试重新翻译图片，或使用基础编辑器
            </p>
            <div className="space-x-4">
              <Button variant="secondary" onClick={handleBack}>
                返回首页
              </Button>
              <Button variant="primary" onClick={() => navigate(`/editor/${id}`)}>
                使用基础编辑器
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm shrink-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleBack}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 flex items-center"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">返回</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800">
            CrossBorder AI 图片编辑器
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">
            {editorData.source_lang} → {editorData.target_lang}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          src="https://www.alifanyi.com/erp/imageTrans.html"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};

export default AliyunEditorPage;
