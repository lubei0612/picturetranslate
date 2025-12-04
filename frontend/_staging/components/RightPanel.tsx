import React from 'react';
import { ExternalLink } from 'lucide-react';
import { COMMON_QUESTIONS } from '../constants';

export const RightPanel: React.FC = () => {
  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-3.5rem)] sticky top-14 p-6 overflow-y-auto">
      
      {/* FAQ */}
      <div className="mb-10">
        <h3 className="text-base font-medium text-gray-900 mb-4">常见问题</h3>
        <ul className="space-y-4">
          {COMMON_QUESTIONS.map((q, idx) => (
            <li key={idx}>
              <a href="#" className="text-sm text-gray-600 hover:text-blue-600 flex items-start leading-relaxed">
                {q}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* QR Codes */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="text-center">
            <div className="bg-gray-100 w-full aspect-square mb-2 rounded p-1 flex items-center justify-center">
                {/* Mock QR */}
                <div className="w-24 h-24 bg-white border border-gray-300 p-1">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ServiceSupport`} alt="QR" className="w-full h-full" />
                </div>
            </div>
            <p className="text-xs text-gray-600">添加微信客服</p>
        </div>
        <div className="text-center">
            <div className="bg-gray-100 w-full aspect-square mb-2 rounded p-1 flex items-center justify-center">
                 {/* Mock QR */}
                 <div className="w-24 h-24 bg-white border border-gray-300 p-1">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=OfficialAccount`} alt="QR" className="w-full h-full" />
                </div>
            </div>
            <p className="text-xs text-gray-600">关注象寄公众号</p>
        </div>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-100">
          <button className="flex items-center text-xs text-gray-400 hover:text-gray-600 ml-auto">
              <ExternalLink className="w-3 h-3 mr-1" />
              返回旧版
          </button>
      </div>

    </div>
  );
};
