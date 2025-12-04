import React from 'react';
import { useBreakpoint } from '@/shared/hooks';
import { DesktopLayout } from './DesktopLayout';
import { MobileLayout } from './MobileLayout';

export const ResponsiveLayout: React.FC = () => {
  const breakpoint = useBreakpoint();
  
  // Mobile and Tablet use MobileLayout, Desktop uses DesktopLayout
  if (breakpoint === 'mobile' || breakpoint === 'tablet') {
    return <MobileLayout />;
  }
  
  return <DesktopLayout />;
};
