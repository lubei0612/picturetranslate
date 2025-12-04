import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const DesktopLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <Navbar />
      
      <div className="pt-16 flex max-w-[1600px] mx-auto">
        <Sidebar />
        
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
