import { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "@/components/dashboard/Dashboard";
import SalesEntry from "@/components/sales/SalesEntry";
import Receivables from "@/components/receivables/Receivables";
import FactoryPayables from "@/components/factory/FactoryPayables";
import TransportExpenses from "@/components/transport/TransportExpenses";
import LabelPurchases from "@/components/labels/LabelPurchases";
import CustomerManagement from "@/components/customers/CustomerManagement";
import ConfigurationManagement from "@/components/configurations/ConfigurationManagement";
import Reports from "@/components/reports/Reports";
import Adjustments from "@/components/adjustments/Adjustments";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "client-transactions":
        return <SalesEntry />;
      case "client-receivables":
        return <Receivables />;
      case "factory":
        return <FactoryPayables />;
      case "transport":
        return <TransportExpenses />;
      case "labels":
        return <LabelPurchases />;
      case "customers":
        return <CustomerManagement />;
      case "configurations":
        return <ConfigurationManagement />;
      case "reports":
        return <Reports />;
      case "adjustments":
        return <Adjustments />;
      default:
        return <Dashboard />;
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