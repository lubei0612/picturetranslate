import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutGrid, History, Settings } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

const bottomNavItems = [
  { path: '/', label: '工作台', icon: LayoutGrid },
  { path: '/history', label: '历史', icon: History },
  { path: '/settings', label: '设置', icon: Settings },
];

export const MobileLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-16">
      <Navbar 
        showMenuButton 
        onMenuClick={() => setSidebarOpen(true)} 
      />
      
      <Sidebar 
        isMobile 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      <main className="pt-16 px-4">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around z-40">
        {bottomNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `
              flex flex-col items-center justify-center py-2 px-4 transition-colors
              ${isActive ? 'text-blue-600' : 'text-gray-500'}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
