import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageIcon, Trash2 } from 'lucide-react';
import type { HistoryItem } from '../types';

interface HistoryTableProps {
  items: HistoryItem[];
  onItemClick?: (item: HistoryItem) => void;
  onDelete?: (item: HistoryItem) => void;
  deletingId?: string | null;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ items, onItemClick, onDelete, deletingId }) => {
  const navigate = useNavigate();
  
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

  const isMobile = () => window.innerWidth < 768;

  const handleRowClick = (item: HistoryItem) => {
    if (!item.projectId) return;
    
    if (isMobile()) {
      navigate(`/preview/${item.projectId}`);
    } else {
      navigate(`/editor/${item.projectId}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              时间
            </th>
            <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              项目/文件
            </th>
            <th className="hidden md:table-cell px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              操作类型
            </th>
            {onDelete && (
              <th className="px-4 md:px-6 py-3 md:py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                操作
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr 
              key={item.id} 
              className={`hover:bg-gray-50 transition-colors ${item.projectId ? 'cursor-pointer' : ''}`}
              onClick={() => handleRowClick(item)}
            >
              <td className="px-4 md:px-6 py-3 md:py-4 text-xs md:text-sm text-gray-600 whitespace-nowrap">
                {formatDate(item.date)}
              </td>
              <td className="px-4 md:px-6 py-3 md:py-4">
                <div className="flex items-center gap-3">
                  {/* 缩略图 */}
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.projectName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  {/* 文件信息 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[120px] md:max-w-none">
                        {item.projectName}
                      </span>
                      {item.isDemo && (
                        <span
                          data-testid="history-demo-badge"
                          className="text-[10px] uppercase tracking-wide font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-full"
                        >
                          Demo
                        </span>
                      )}
                    </div>
                    {/* 手机端显示操作类型 */}
                    <div className="md:hidden text-xs text-gray-500 mt-1">
                      {item.action}
                    </div>
                    {/* 状态标签 */}
                    <div className="mt-1">
                      <span
                        className={`
                          inline-flex items-center px-1.5 py-0.5 rounded text-[10px] md:text-xs font-medium
                          ${item.result === 'success'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                          }
                        `}
                      >
                        {item.result === 'success' ? '成功' : `失败${item.resultMessage ? ` (${item.resultMessage})` : ''}`}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                {item.action}
              </td>
              {onDelete && (
                <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                  <button
                    data-testid="history-delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(item);
                    }}
                    disabled={deletingId === item.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              )}
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
