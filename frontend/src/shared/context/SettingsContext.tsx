import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useToast } from '@/shared/components';

const STORAGE_KEY = 'user_settings';

interface UserSettings {
  defaultTargetLang: string;
  defaultEngine: string;
  autoInpaint: boolean;
  demoMode: boolean;
}

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  saving: boolean;
  updateSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultTargetLang: 'zh-CN',
  defaultEngine: 'aliyun',
  autoInpaint: true,
  demoMode: true,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

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
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
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

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      saving,
      updateSetting,
      saveSettings,
      resetSettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useGlobalSettings must be used within SettingsProvider');
  }
  return context;
}
