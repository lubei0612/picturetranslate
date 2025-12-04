import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryTableProps {
  items: HistoryItem[];
  onItemClick?: (item: HistoryItem) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ items, onItemClick }) => {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              时间
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              项目/文件
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              操作类型
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              结果
            </th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
              详情
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">
                {formatDate(item.date)}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {item.projectName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {item.action}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`
                    inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                    ${item.result === 'success'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                    }
                  `}
                >
                  {item.result === 'success' ? '成功' : `失败${item.resultMessage ? ` (${item.resultMessage})` : ''}`}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                {item.projectId && (
                  <button
                    onClick={() => onItemClick?.(item)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <div className="py-12 text-center text-gray-400 text-sm">
          暂无历史记录
        </div>
      )}
    </div>
  );
};
