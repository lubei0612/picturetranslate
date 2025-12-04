import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ToastProvider } from '@/shared/components';

export function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  );
}
