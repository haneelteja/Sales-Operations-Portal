import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

import PortalRouter from "@/components/PortalRouter";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import SupabaseVerify from "./pages/SupabaseVerify";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "@/components/ErrorBoundary";
import EmbeddedOrderManagement from "@/components/order-management/EmbeddedOrderManagement";
import MinimalTest from "@/pages/MinimalTest"; // ✅ MOVED HERE

const queryClient = new QueryClient({ /* unchanged */ });

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify" element={<SupabaseVerify />} />
                  <Route path="/" element={<PortalRouter />} />
                  <Route
                    path="/embedded-order-management"
                    element={
                      <React.Suspense fallback={<div>Loading...</div>}>
                        <EmbeddedOrderManagement />
                      </React.Suspense>
                    }
                  />
                  <Route path="/minimal-test" element={<MinimalTest />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
