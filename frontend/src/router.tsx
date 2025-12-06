import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/layouts';
import { DashboardPage } from '@/features/dashboard';
import { AliyunEditorPage } from '@/features/editor';
import { HistoryPage } from '@/features/history';
import { SettingsPage } from '@/features/settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ResponsiveLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    // 点击任务直接进入阿里云编辑器
    path: '/editor/:id',
    element: <AliyunEditorPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
