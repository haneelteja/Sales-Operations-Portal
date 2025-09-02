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
  Cog,
  LogOut,
  User
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  const { profile, signOut } = useAuth();
  const isActive = (id: string) => activeView === id;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

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
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || profile?.email}
                </p>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getRoleColor(profile?.role || 'viewer')} text-white`}
                >
                  {profile?.role}
                </Badge>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}