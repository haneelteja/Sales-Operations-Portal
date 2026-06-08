import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import PortalRouter from "@/components/PortalRouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import MinimalTest from "@/pages/MinimalTest";

const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SupabaseVerify = lazy(() => import("./pages/SupabaseVerify"));
const NotFound = lazy(() => import("./pages/NotFound"));
const EmbeddedOrderManagement = lazy(() => import("@/components/order-management/EmbeddedOrderManagement"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Persist only lightweight static config queries to localStorage.
// Dynamic data (transactions, receivables) is excluded via shouldDehydrateQuery.
const PERSIST_KEYS = new Set(['customers', 'sku-configurations', 'factory-pricing']);

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'aamodha-ops-qcache-v1',
  throttleTime: 2000,
});

const persistOptions = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: unknown[] }) => {
      const key = query.queryKey[0];
      return typeof key === 'string' && PERSIST_KEYS.has(key);
    },
  },
};

const App = () => (
  <ErrorBoundary>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <AuthProvider>
        <TooltipProvider>
          <SidebarProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center" />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify" element={<SupabaseVerify />} />
                  <Route path="/" element={<PortalRouter />} />
                  <Route path="/embedded-order-management" element={<EmbeddedOrderManagement />} />
                  <Route path="/minimal-test" element={<MinimalTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </SidebarProvider>
        </TooltipProvider>
      </AuthProvider>
    </PersistQueryClientProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </ErrorBoundary>
);

export default App;
