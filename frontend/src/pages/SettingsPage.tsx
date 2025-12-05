import React from 'react';
import { Settings } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">设置</h1>
        
        {/* Engine Selection */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Settings className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-medium text-gray-800">翻译引擎</h2>
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="engine" value="aliyun" defaultChecked className="mr-3" />
              <div>
                <div className="font-medium text-gray-800">阿里云翻译</div>
                <div className="text-sm text-gray-500">默认引擎，支持多语言</div>
              </div>
            </label>
            
            <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input type="radio" name="engine" value="google" className="mr-3" />
              <div>
                <div className="font-medium text-gray-800">Google Translate</div>
                <div className="text-sm text-gray-500">支持 100+ 语言</div>
              </div>
            </label>
          </div>
        </section>

        {/* Demo Mode */}
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-medium text-gray-800">Demo 模式</h2>
              <p className="text-sm text-gray-500 mt-1">启用后将显示示例数据</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
            </label>
          </div>
        </section>
        
        <p className="text-center text-gray-400 text-sm mt-8">
          待 Phase 4 填充 - Settings 组件拆解
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
