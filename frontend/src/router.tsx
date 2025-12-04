import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ResponsiveLayout } from '@/layouts';
import { DashboardPage, EditorPage, HistoryPage, SettingsPage } from '@/pages';

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
