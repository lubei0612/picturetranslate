import React from 'react';
import { Clock, ExternalLink } from 'lucide-react';

export const History: React.FC = () => {
  const historyData = [
    { id: 1, date: '2023-12-02 14:20', item: '智能运动手表_主图_CN.jpg', action: '翻译 (中 -> 英)', result: '成功' },
    { id: 2, date: '2023-12-02 10:15', item: '车载手机支架_场景图.jpg', action: '翻译 (中 -> 西)', result: '成功' },
    { id: 3, date: '2023-12-01 18:30', item: '宠物喂食器_尺寸图.png', action: '翻译 (中 -> 德)', result: '成功' },
    { id: 4, date: '2023-12-01 16:20', item: '错误文件_测试.txt', action: '上传分析', result: '失败 (格式错误)' },
    { id: 5, date: '2023-11-30 09:00', item: '账户充值', action: '微信支付', result: '成功' },
  ];

  return (
    <div className="flex-1 min-h-screen bg-[#F8F9FA] pl-64">
      <div className="max-w-6xl mx-auto p-8">
        <h1 className="text-2xl font-semibold text-gray-800 mb-8 flex items-center">
          <Clock className="w-6 h-6 mr-3 text-gray-400" />
          公共历史记录
        </h1>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">项目/文件</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">操作类型</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">结果</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {historyData.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-600">{row.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.item}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{row.action}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                       row.result.includes('成功') 
                       ? 'bg-green-50 text-green-700' 
                       : 'bg-red-50 text-red-700'
                     }`}>
                       {row.result}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-blue-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};