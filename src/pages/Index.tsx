import { useState, lazy, Suspense } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Loader2 } from "lucide-react";

// Lazy load route components for code splitting
const Dashboard = lazy(() => import("@/components/dashboard/Dashboard"));
const SalesEntry = lazy(() => import("@/components/sales/SalesEntry"));
const FactoryPayables = lazy(() => import("@/components/factory/FactoryPayables"));
const TransportExpenses = lazy(() => import("@/components/transport/TransportExpenses"));
const Labels = lazy(() => import("@/components/labels/Labels"));
const ConfigurationManagement = lazy(() => import("@/components/configurations/ConfigurationManagement"));
const Reports = lazy(() => import("@/components/reports/Reports"));
const Adjustments = lazy(() => import("@/components/adjustments/Adjustments"));
const UserManagement = lazy(() => import("@/components/user-management/UserManagement"));
const OrderManagement = lazy(() => import("@/components/order-management/OrderManagement"));

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
          <Suspense fallback={<RouteLoader />}>
            <Dashboard />
          </Suspense>
        );
      case "order-management":
        return (
          <Suspense fallback={<RouteLoader />}>
            <OrderManagement />
          </Suspense>
        );
      case "client-transactions":
        return (
          <Suspense fallback={<RouteLoader />}>
            <SalesEntry />
          </Suspense>
        );
      case "factory":
        return (
          <Suspense fallback={<RouteLoader />}>
            <FactoryPayables />
          </Suspense>
        );
      case "transport":
        return (
          <Suspense fallback={<RouteLoader />}>
            <TransportExpenses />
          </Suspense>
        );
      case "labels":
        return (
          <Suspense fallback={<RouteLoader />}>
            <Labels />
          </Suspense>
        );
      case "configurations":
        return (
          <Suspense fallback={<RouteLoader />}>
            <ConfigurationManagement />
          </Suspense>
        );
      case "reports":
        return (
          <Suspense fallback={<RouteLoader />}>
            <Reports />
          </Suspense>
        );
      case "adjustments":
        // Only allow managers to access adjustments
        if (profile?.role !== 'manager') {
          return (
            <Alert className="m-6">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Access denied. The Adjustments tab is only available to users with Manager role.
                Your current role: {profile?.role || 'Unknown'}
              </AlertDescription>
            </Alert>
          );
        }
        return (
          <Suspense fallback={<RouteLoader />}>
            <Adjustments />
          </Suspense>
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
          <Suspense fallback={<RouteLoader />}>
            <UserManagement />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<RouteLoader />}>
            <Dashboard />
          </Suspense>
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

          <main className="flex-1 p-6 bg-background">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;