import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/components/ui/sidebar';
import OrderManagement from '@/components/order-management/OrderManagement';

const queryClient = new QueryClient();

/**
 * Use this component as the entry point for embedding OrderManagement
 * in any external app or micro-frontend scenario. It ensures all required
 * providers are present in the render tree.
 */
export default function EmbeddedOrderManagement() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SidebarProvider>
          <OrderManagement />
        </SidebarProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
