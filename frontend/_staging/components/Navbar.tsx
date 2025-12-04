import React from 'react';
import { Bell } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
          CB
        </div>
        <div>
          <h1 className="font-bold text-xl text-gray-800 tracking-tight leading-none">CrossBorder AI</h1>
          <p className="text-[10px] text-gray-500 font-medium tracking-wide">E-COMMERCE TRANSLATION</p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center space-x-6">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500"></span>
        </button>
      </div>
    </div>
  );
};