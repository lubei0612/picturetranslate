import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/layouts';
import { DashboardPage } from '@/features/dashboard';
import { AliyunEditorPage, MobilePreviewPage } from '@/features/editor';
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
    // 电脑端编辑器
    path: '/editor/:id',
    element: <AliyunEditorPage />,
  },
  {
    // 手机端预览页
    path: '/preview/:id',
    element: <MobilePreviewPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
