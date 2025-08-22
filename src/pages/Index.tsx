import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Dashboard from "@/components/dashboard/Dashboard";
import SalesEntry from "@/components/sales/SalesEntry";
import Receivables from "@/components/receivables/Receivables";
import FactoryPayables from "@/components/factory/FactoryPayables";
import TransportExpenses from "@/components/transport/TransportExpenses";
import LabelPurchases from "@/components/labels/LabelPurchases";
import LabelDesignCosts from "@/components/labels/LabelDesignCosts";
import CustomerManagement from "@/components/customers/CustomerManagement";
import LabelVendorManagement from "@/components/vendors/LabelVendorManagement";
import Reports from "@/components/reports/Reports";
import Adjustments from "@/components/adjustments/Adjustments";
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Factory, 
  Truck, 
  Tag, 
  Palette,
  UserPlus,
  Building,
  FileText,
  Settings
} from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-foreground">
            Sales Operations Portal - Aamodha Enterprises
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized management for sales, receivables, and factory operations
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-11 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Sales
            </TabsTrigger>
            <TabsTrigger value="receivables" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Receivables
            </TabsTrigger>
            <TabsTrigger value="factory" className="flex items-center gap-2">
              <Factory className="w-4 h-4" />
              Factory
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Labels
            </TabsTrigger>
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Design
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Adjustments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales & Receivables Entry</CardTitle>
                <CardDescription>
                  Record customer orders and payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesEntry />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receivables" className="space-y-6">
            <Receivables />
          </TabsContent>

          <TabsContent value="factory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Factory Payables - Elma Industries</CardTitle>
                <CardDescription>
                  Track production costs and payments to Elma Industries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FactoryPayables />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transport" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transport Expenses</CardTitle>
                <CardDescription>
                  Log transport costs and delivery expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransportExpenses />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="labels" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Label Purchases</CardTitle>
                <CardDescription>
                  Track label procurement from vendors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LabelPurchases />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Label Design Costs</CardTitle>
                <CardDescription>
                  Manage design expenses for customer labels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LabelDesignCosts />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <CustomerManagement />
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <LabelVendorManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Reports />
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adjustments</CardTitle>
                <CardDescription>
                  Manual entries for exceptional adjustments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Adjustments />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
