import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '@/shared/components';
import { SettingsProvider } from '@/shared/context';

export function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <RouterProvider router={router} />
      </SettingsProvider>
    </ToastProvider>
  );
}
