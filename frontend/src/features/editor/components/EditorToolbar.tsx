import React from 'react';
import { MousePointer2, Type, Eraser, Ruler, HelpCircle } from 'lucide-react';
import type { EditorToolbarProps, ToolType } from '../types';

interface ToolButtonProps {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}

const ToolButton: React.FC<ToolButtonProps> = ({ active, icon: Icon, label, onClick }) => (
  <button
    onClick={onClick}
    className={`
      w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all
      ${active ? 'bg-blue-50 text-blue-700 shadow-inner' : 'text-gray-500 hover:bg-gray-100'}
    `}
  >
    <Icon className={`w-5 h-5 mb-1 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  activeTool,
  onToolChange,
  onHelpClick,
}) => {
  const tools: Array<{ id: ToolType; icon: React.ElementType; label: string }> = [
    { id: 'select', icon: MousePointer2, label: '选择' },
    { id: 'text', icon: Type, label: '文字' },
    { id: 'eraser', icon: Eraser, label: '消除笔' },
  ];

  return (
    <aside className="w-20 bg-white border-r border-gray-200 flex flex-col py-4 items-center space-y-4 shadow-sm">
      {tools.map((tool) => (
        <ToolButton
          key={tool.id}
          active={activeTool === tool.id}
          icon={tool.icon}
          label={tool.label}
          onClick={() => onToolChange(tool.id)}
        />
      ))}

      <div className="w-10 h-px bg-gray-200" />

      <ToolButton
        active={activeTool === 'resize'}
        icon={Ruler}
        label="尺寸"
        onClick={() => onToolChange('resize')}
      />

      <div className="w-10 h-px bg-gray-200" />

      <ToolButton
        active={false}
        icon={HelpCircle}
        label="说明"
        onClick={() => onHelpClick?.()}
      />
    </aside>
  );
};
