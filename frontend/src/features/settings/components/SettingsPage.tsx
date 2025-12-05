import React from 'react';
import { Settings, Globe, Cpu, Save, RotateCcw } from 'lucide-react';
import { EngineSelector } from './EngineSelector';
import { useEngines } from '../hooks/useEngines';
import { Button } from '@/shared/components';
import { useGlobalSettings } from '@/shared/context';

const LANGUAGE_OPTIONS = [
  { code: 'zh-CN', name: '中文 (简体)' },
  { code: 'en', name: '英语 (English)' },
  { code: 'ja', name: '日语 (日本語)' },
  { code: 'ko', name: '韩语 (한국어)' },
  { code: 'de', name: '德语 (Deutsch)' },
  { code: 'es', name: '西班牙语 (Español)' },
];

export const SettingsPage: React.FC = () => {
  const { settings, saving, updateSetting, saveSettings, resetSettings } = useGlobalSettings();
  const { engines, loading: enginesLoading } = useEngines({ demoMode: settings.demoMode });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-400" />
          系统设置
        </h1>

        <div className="space-y-6">
          {/* Language Settings */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-600" />
                语言设置
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    默认目标语言
                  </label>
                  <select
                    value={settings.defaultTargetLang}
                    onChange={(e) => updateSetting('defaultTargetLang', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    新建翻译任务时默认选中的目标语言
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Engine Settings */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6">
              <h2 className="text-base font-medium text-gray-900 mb-4 flex items-center">
                <Cpu className="w-4 h-4 mr-2 text-blue-600" />
                翻译引擎
              </h2>

              <EngineSelector
                engines={engines}
                selectedEngine={settings.defaultEngine}
                onSelect={(engine) => updateSetting('defaultEngine', engine)}
                loading={enginesLoading}
              />
            </div>
          </section>

          {/* Feature Toggles */}
          <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <h2 className="text-base font-medium text-gray-900 mb-4">
                功能开关
              </h2>

              {/* Auto Inpaint */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">自动背景修复</h3>
                  <p className="text-xs text-gray-500">
                    翻译后自动使用 AI 填充原文字背景区域
                  </p>
                </div>
                <Toggle
                  checked={settings.autoInpaint}
                  onChange={(v) => updateSetting('autoInpaint', v)}
                />
              </div>

              {/* Demo Mode */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Demo 模式</h3>
                  <p className="text-xs text-gray-500">
                    启用后显示示例数据，不调用真实 API
                  </p>
                </div>
                <Toggle
                  checked={settings.demoMode}
                  onChange={(v) => updateSetting('demoMode', v)}
                />
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" icon={<RotateCcw className="w-4 h-4" />} onClick={resetSettings}>
              重置默认
            </Button>
            <Button variant="primary" icon={<Save className="w-4 h-4" />} onClick={saveSettings} loading={saving}>
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (value: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    onClick={() => onChange(!checked)}
    className={`
      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
      border-2 border-transparent transition-colors duration-200 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
      ${checked ? 'bg-blue-600' : 'bg-gray-200'}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full
        bg-white shadow ring-0 transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);
