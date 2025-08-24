import { 
  BarChart3, 
  DollarSign, 
  Users, 
  Factory, 
  Truck, 
  Tag, 
  UserPlus,
  Settings,
  FileText,
  Cog
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: BarChart3 },
  { id: "client-transactions", title: "Client Transactions", icon: DollarSign },
  { id: "client-receivables", title: "Client Receivables", icon: Users },
  { id: "factory", title: "Factory Payables", icon: Factory },
  { id: "transport", title: "Transport", icon: Truck },
  { id: "labels", title: "Labels", icon: Tag },
  { id: "customers", title: "Customers", icon: UserPlus },
  { id: "configurations", title: "Configurations", icon: Cog },
  { id: "reports", title: "Reports", icon: FileText },
  { id: "adjustments", title: "Adjustments", icon: Settings },
];

export function AppSidebar({ activeView, setActiveView }: AppSidebarProps) {
  const isActive = (id: string) => activeView === id;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    onClick={() => setActiveView(item.id)}
                    className={isActive(item.id) ? "bg-accent text-accent-foreground" : ""}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}