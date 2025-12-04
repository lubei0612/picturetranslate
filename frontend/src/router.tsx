import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/layouts';
import { DashboardPage } from '@/features/dashboard';
import { EditorPage } from '@/features/editor';
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
    path: '/editor/:id',
    element: <EditorPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
