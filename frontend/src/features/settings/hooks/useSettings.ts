import { useState, useCallback, useEffect } from 'react';
import type { UserSettings } from '../types';
import { useToast } from '@/shared/components';

const STORAGE_KEY = 'user_settings';

const DEFAULT_SETTINGS: UserSettings = {
  defaultTargetLang: 'zh-CN',
  defaultEngine: 'aliyun',
  autoInpaint: true,
  demoMode: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSetting = useCallback(<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveSettings = useCallback(async () => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      toast.success('设置已保存');
    } catch (err) {
      toast.error('保存失败');
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }, [settings, toast]);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
    toast.info('设置已重置');
  }, [toast]);

  return {
    settings,
    loading,
    saving,
    updateSetting,
    saveSettings,
    resetSettings,
  };
}
