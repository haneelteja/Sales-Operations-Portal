import { useState, lazy, Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2 } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy load route components for code splitting
const Dashboard = lazy(() => import("@/components/dashboard/Dashboard"));
const OrderManagement = lazy(() => import("@/components/order-management/OrderManagement"));
const SalesEntry = lazy(() => import("@/components/sales/SalesEntry"));
const FactoryPayables = lazy(() => import("@/components/factory/FactoryPayables"));
const TransportExpenses = lazy(() => import("@/components/transport/TransportExpenses"));
const Labels = lazy(() => import("@/components/labels/Labels"));
const Reports = lazy(() => import("@/components/reports/Reports"));
const UserManagement = lazy(() => import("@/components/user-management/UserManagement"));
const ApplicationConfigurationTab = lazy(() => import("@/components/user-management/ApplicationConfigurationTab"));
const WhatsAppConfigurationTab = lazy(() => import("@/components/user-management/WhatsAppConfigurationTab"));
const ReceivablesManagement = lazy(() => import("@/components/receivables/ReceivablesManagement"));
const ReceivablesTrackingView = lazy(() => import("@/components/receivables-tracking/ReceivablesTrackingView"));
const Profitability = lazy(() => import("@/components/profitability/Profitability"));
const AuditLogs = lazy(() => import("@/components/logs/AuditLogs"));

// Loading component for route transitions
const RouteLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Dashboard />
            </Suspense>
          </ErrorBoundary>
        );
      case "order-management":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <OrderManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case "receivables-tracking":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <ReceivablesTrackingView />
            </Suspense>
          </ErrorBoundary>
        );
      case "receivables-management":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <ReceivablesManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case "client-transactions":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <SalesEntry />
            </Suspense>
          </ErrorBoundary>
        );
      case "factory":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <FactoryPayables />
            </Suspense>
          </ErrorBoundary>
        );
      case "transport":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <TransportExpenses />
            </Suspense>
          </ErrorBoundary>
        );
      case "labels":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Labels />
            </Suspense>
          </ErrorBoundary>
        );
      case "reports":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Reports />
            </Suspense>
          </ErrorBoundary>
        );
      case "profitability":
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Profitability />
            </Suspense>
          </ErrorBoundary>
        );
      case "audit-logs":
        if (profile?.role !== 'manager') {
          return (
            <Alert className="m-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access denied. Audit Logs are only available to managers.
                Your current role: {profile?.role || 'Unknown'}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <AuditLogs />
            </Suspense>
          </ErrorBoundary>
        );
      case "user-management":
        // Only allow managers to access user management
        if (profile?.role !== 'manager') {
          return (
            <Alert className="m-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access denied. The User Management tab is only available to users with Manager role.
                Your current role: {profile?.role || 'Unknown'}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <UserManagement />
            </Suspense>
          </ErrorBoundary>
        );
      case "application-configuration":
        // Only allow managers to access application configuration
        if (profile?.role !== 'manager') {
          return (
            <Alert className="m-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access denied. The Application Configuration tab is only available to users with Manager role.
                Your current role: {profile?.role || 'Unknown'}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <ApplicationConfigurationTab />
            </Suspense>
          </ErrorBoundary>
        );
      case "whatsapp-configuration":
        // Only allow managers to access WhatsApp configuration
        if (profile?.role !== 'manager') {
          return (
            <Alert className="m-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access denied. The WhatsApp Configuration tab is only available to users with Manager role.
                Your current role: {profile?.role || 'Unknown'}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <WhatsAppConfigurationTab />
            </Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary>
            <Suspense fallback={<RouteLoader />}>
              <Dashboard />
            </Suspense>
          </ErrorBoundary>
        );
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activeView={activeView} setActiveView={setActiveView} />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-card px-4">
            <SidebarTrigger className="mr-4" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Sales Operations Portal - Aamodha Enterprises
              </h1>
            </div>
          </header>
          <main className="flex-1 p-4 bg-background min-w-0 overflow-x-hidden">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
