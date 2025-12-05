import React from 'react';
import { Bell, Menu } from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, showMenuButton = false }) => {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 fixed top-0 left-0 right-0 z-50">
      {/* Left: Menu + Brand */}
      <div className="flex items-center space-x-3">
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
            PT
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg text-gray-800 tracking-tight leading-none">
              图片翻译
            </h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-wide">
              PICTURE TRANSLATE
            </p>
          </div>
        </div>
      </div>

      {/* Center: Welcome Message */}
      <div className="hidden md:block text-center">
        <span className="text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
          祝贺各位内测老板发财大卖
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors p-2">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
        </button>
      </div>
    </header>
  );
};
