import React from 'react';
import { Globe, Save } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FA] pl-64">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-8">系统设置</h1>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm divide-y divide-gray-100">
          
          {/* Preferences Section */}
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Globe className="w-5 h-5 mr-2 text-blue-600" />
              全局偏好设置
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">默认目标语言</label>
                <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border">
                  <option>中文 (简体)</option>
                  <option>英语 (English)</option>
                  <option>西班牙语 (Español)</option>
                  <option>日语 (日本語)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">新建项目时默认选中的翻译目标语言。</p>
              </div>
              
              <div className="flex items-center justify-between py-2">
                 <div>
                    <h3 className="text-sm font-medium text-gray-900">自动背景修复</h3>
                    <p className="text-xs text-gray-500">翻译文字后自动使用 AI 填充原文字背景区域。</p>
                 </div>
                 <button className="bg-blue-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2">
                    <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                 </button>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
            <button className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <Save className="w-4 h-4 mr-2" />
              保存更改
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};