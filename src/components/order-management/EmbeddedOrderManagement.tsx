import React, { lazy, Suspense } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';

const OrderManagement = lazy(() => import('@/components/order-management/OrderManagement'));

/**
 * Entry point for embedding OrderManagement. Uses parent QueryClientProvider
 * from App when rendered at /embedded-order-management (shared cache).
 */
export default function EmbeddedOrderManagement() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" /></div>}>
          <OrderManagement />
        </Suspense>
      </SidebarProvider>
    </AuthProvider>
  );
}
