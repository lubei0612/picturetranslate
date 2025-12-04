import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectApi } from '../api/projectApi';
import { useToast } from '@/shared/components';
import type { UploadOptions } from '../types';

interface UseUploadResult {
  isUploading: boolean;
  progress: number;
  upload: (file: File, options: UploadOptions) => Promise<void>;
  uploadFromUrl: (url: string, options: UploadOptions) => Promise<void>;
}

export function useUpload(): UseUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const toast = useToast();

  const upload = useCallback(async (file: File, options: UploadOptions) => {
    if (isUploading) return;

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
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

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('source_lang', options.sourceLang);
      formData.append('target_lang', options.targetLang);

      const project = await projectApi.create(formData);
      toast.success('上传成功，开始翻译');
      navigate(`/editor/${project.id}`);
    } catch (err) {
      toast.error('上传失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [isUploading, navigate, toast]);

  const uploadFromUrl = useCallback(async (url: string, options: UploadOptions) => {
    if (isUploading) return;

    if (!url.trim()) {
      toast.error('请输入图片链接');
      return;
    }

    setIsUploading(true);

    try {
      const project = await projectApi.createFromUrl(url, options.sourceLang, options.targetLang);
      toast.success('导入成功，开始翻译');
      navigate(`/editor/${project.id}`);
    } catch (err) {
      toast.error('导入失败，请检查链接是否有效');
      console.error('URL import error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, navigate, toast]);

  return {
    isUploading,
    progress,
    upload,
    uploadFromUrl,
  };
}
