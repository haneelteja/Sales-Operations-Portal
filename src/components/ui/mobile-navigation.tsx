import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  Home, 
  ShoppingCart, 
  DollarSign, 
  Factory, 
  Truck, 
  Tag, 
  Cog, 
  FileText, 
  Settings, 
  Shield,
  User,
  LogOut
} from 'lucide-react';
import { useMobileDetection, MOBILE_NAV_CONFIG, MOBILE_CLASSES } from '@/lib/mobile-utils';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  disabled?: boolean;
  roles?: string[]; // Optional: restrict to specific roles
}

interface MobileNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  user?: {
    name?: string;
    email?: string;
    role?: string;
  };
  onSignOut?: () => void;
  className?: string;
}

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', title: 'Dashboard', icon: Home },
  { id: 'order-management', title: 'Orders Management', icon: ShoppingCart },
  { id: 'client-transactions', title: 'Transactions', icon: DollarSign },
  { id: 'factory', title: 'Factory', icon: Factory },
  { id: 'transport', title: 'Transport', icon: Truck },
  { id: 'labels', title: 'Labels', icon: Tag },
  { id: 'configurations', title: 'Settings', icon: Cog },
  { id: 'reports', title: 'Reports', icon: FileText },
  { id: 'user-management', title: 'Users', icon: Shield, roles: ['manager'] }, // Only visible to managers
  { id: 'application-configuration', title: 'App Config', icon: Settings, roles: ['manager', 'admin'] }, // Only visible to managers and admins
];

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeView,
  setActiveView,
  user,
  onSignOut,
  className,
}) => {
  const { isMobileDevice } = useMobileDetection();
  const [isOpen, setIsOpen] = useState(false);

  const handleItemClick = (itemId: string) => {
    setActiveView(itemId);
    setIsOpen(false);
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'employee': return 'bg-green-500';
      case 'viewer': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isMobileDevice) {
    // Desktop sidebar - return null as it's handled by AppSidebar
    return null;
  }

  return (
    <div className={cn('fixed top-0 left-0 right-0 z-50 bg-white border-b', className)}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AE</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Aamodha</h1>
            <p className="text-xs text-gray-600">Enterprises</p>
          </div>
        </div>

        {/* Mobile menu button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-80 p-0">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AE</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Aamodha</h2>
                    <p className="text-xs text-gray-600">Enterprises</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User info */}
              {user && (
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                      {user.role && (
                        <Badge 
                          className={cn(
                            'mt-1 text-xs',
                            getRoleColor(user.role)
                          )}
                        >
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation items */}
              <div className="flex-1 overflow-y-auto">
                <nav className="p-4 space-y-1">
                  {navigationItems
                    .filter((item) => {
                      // If item has roles restriction, check if user has required role
                      if (item.roles && user?.role) {
                        return item.roles.includes(user.role);
                      }
                      // If no role restriction, show to all
                      return true;
                    })
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = activeView === item.id;
                      
                      return (
                        <Button
                          key={item.id}
                          variant={isActive ? 'default' : 'ghost'}
                          className={cn(
                            'w-full justify-start h-12 px-3',
                            isActive && 'bg-blue-600 text-white hover:bg-blue-700'
                          )}
                          onClick={() => handleItemClick(item.id)}
                          disabled={item.disabled}
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <span className="flex-1 text-left">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant={isActive ? 'secondary' : 'default'}
                              className="ml-2"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                </nav>
              </div>

              {/* Sign out button */}
              {onSignOut && (
                <div className="p-4 border-t">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-12 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      onSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};



