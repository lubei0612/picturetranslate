import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { ViewState } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onOpenEditor={() => setCurrentView('editor')} />;
      case 'editor':
        return <Editor onBack={() => setCurrentView('dashboard')} />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onOpenEditor={() => setCurrentView('editor')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-900 font-sans">
      
      {/* 1. Global Navbar */}
      <Navbar />

      <div className="pt-16">
        {currentView === 'editor' ? (
           // Full screen editor mode (no sidebar)
           <Editor onBack={() => setCurrentView('dashboard')} />
        ) : (
           // Main Layout with Sidebar
           <div className="flex max-w-[1600px] mx-auto">
              {/* Left Navigation */}
              <div className="flex-shrink-0 z-40">
                  <Sidebar currentView={currentView} onChangeView={setCurrentView} />
              </div>

              {/* Main Content Area */}
              <div className="flex-1 min-w-0">
                  {renderContent()}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default App;
