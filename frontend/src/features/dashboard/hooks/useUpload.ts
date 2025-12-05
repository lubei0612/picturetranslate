import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/projectApi';
import { useToast } from '@/shared/components';
import type { UploadOptions } from '../types';

interface UseUploadResult {
  isUploading: boolean;
  progress: number;
  statusText: string;
  upload: (file: File, options: UploadOptions) => Promise<void>;
  uploadFromUrl: (url: string, options: UploadOptions) => Promise<void>;
}

export function useUpload(): UseUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  const waitForJobComplete = useCallback((jobId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      setStatusText('翻译处理中...');
      
      eventSourceRef.current = projectApi.subscribeJob(jobId, (event, data) => {
        if (event === 'progress') {
          const progressData = data as { progress?: number; message?: string };
          if (progressData.progress) {
            setProgress(progressData.progress);
          }
          if (progressData.message) {
            setStatusText(progressData.message);
          }
        } else if (event === 'complete') {
          const completeData = data as { translation_id?: string; translations?: Array<{ id: string }> };
          const translationId = completeData.translation_id || completeData.translations?.[0]?.id;
          if (translationId) {
            resolve(translationId);
          } else {
            reject(new Error('未获取到翻译结果'));
          }
        } else if (event === 'error') {
          reject(new Error('翻译任务失败'));
        }
      });
    });
  }, []);

  const upload = useCallback(async (file: File, options: UploadOptions) => {
    if (isUploading) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('文件大小不能超过 10MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('仅支持 JPG、PNG、WebP 格式');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setStatusText('正在上传...');

    try {
      const job = await projectApi.create(file, options.sourceLang, options.targetLang);
      toast.success('上传成功，开始翻译');
      
      const translationId = await waitForJobComplete(job.job_id);
      toast.success('翻译完成');
      navigate(`/editor/${translationId}`);
    } catch (err) {
      toast.error('翻译失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setProgress(0);
      setStatusText('');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [isUploading, navigate, toast, waitForJobComplete]);

  const uploadFromUrl = useCallback(async (url: string, options: UploadOptions) => {
    if (isUploading) return;

    if (!url.trim()) {
      toast.error('请输入图片链接');
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setStatusText('正在下载图片...');

    try {
      const job = await projectApi.createFromUrl(url, options.sourceLang, options.targetLang);
      toast.success('导入成功，开始翻译');
      
      const translationId = await waitForJobComplete(job.job_id);
      toast.success('翻译完成');
      navigate(`/editor/${translationId}`);
    } catch (err) {
      toast.error('导入失败，请检查链接是否有效');
      console.error('URL import error:', err);
    } finally {
      setIsUploading(false);
      setProgress(0);
      setStatusText('');
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, [isUploading, navigate, toast, waitForJobComplete]);

  return {
    isUploading,
    progress,
    statusText,
    upload,
    uploadFromUrl,
  };
}
