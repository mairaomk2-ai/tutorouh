import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";
import {
  Home, MessageCircle, Search, Users, Settings,
  Bell, Crown, LogOut, User, BookOpen, FileText,
  Menu, X, Plus, Shield
} from "lucide-react";
import { VerifiedBadge } from "./verified-badge";
import SupportNotifications from "./SupportNotifications";
import UserSupportChat from "./UserSupportChat";
import logoPath from "@assets/IMG_20250731_105128_697_1754300950174.jpg";

export default function NavigationPremium() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get real message and request counts
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user?.id,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ['/api/user/requests/received'],
    enabled: !!user?.id,
  });

  // Calculate unread message count
  const unreadMessageCount = (conversations as any[])?.reduce((total: number, conv: any) => {
    return total + (conv.unreadCount || 0);
  }, 0) || 0;

  // Calculate pending request count
  const pendingRequestCount = (receivedRequests as any[])?.filter((req: any) => req.status === 'pending')?.length || 0;

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navigationItems = [
    {
      label: "Home",
      path: "/",
      icon: Home,
      showOnMobile: true,
    },
    {
      label: "Requirements",
      path: "/requirements",
      icon: FileText,
      showOnMobile: true,
    },
    {
      label: "Messages",
      path: "/messages",
      icon: MessageCircle,
      showOnMobile: true,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
    },
    {
      label: "Find",
      path: "/find",
      icon: Search,
      showOnMobile: true,
    },
    {
      label: "Requests",
      path: "/request",
      icon: Users,
      showOnMobile: true,
      badge: pendingRequestCount > 0 ? pendingRequestCount : undefined,
    },
  ];

  const handleLogout = () => {
    logout();
    // The logout function in useAuth now handles the redirect
  };

  const NavItem = ({ item, isMobile = false }: { item: any, isMobile?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <a
        href={item.path}
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group relative ${
          active
            ? "premium-gradient text-white shadow-lg transform scale-105"
            : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 interactive-hover"
        } ${isMobile ? "w-full" : ""}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        {active && (
          <div className="absolute inset-0 premium-gradient opacity-90 rounded-lg -z-10"></div>
        )}
        <div className="relative">
          <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
          {item.badge && (
            <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs pulse-ring">
              {item.badge}
            </Badge>
          )}
        </div>
        <span className={`font-medium ${isMobile ? "text-base" : "hidden xl:block"}`}>
          {item.label}
        </span>
      </a>
    );
  };

  return (
    <>
      {/* Enhanced Desktop Navigation */}
      <nav className="hidden md:flex glass-gradient border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 w-full">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Logo */}
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Tutoro Logo" className="h-10 w-10 rounded-lg hover-lift border-2 border-white/20 shadow-lg" />
              <span className="text-xl font-bold text-black">
                Tutoro
              </span>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center space-x-2">
              {navigationItems.map((item) => (
                <NavItem key={item.path} item={item} />
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              <SupportNotifications />

              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-blue-200">
                      <AvatarImage src={user?.profileImage} alt={user?.firstName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user?.firstName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <VerifiedBadge isVerified={Boolean((user as any)?.isLocationVerified)} size="sm" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs">
                          {user?.userType}
                        </Badge>
                        {(user as any)?.isLocationVerified && (
                          <Badge variant="outline" className="text-xs text-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />

                  <DropdownMenuItem onClick={() => setLocation("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Top Bar */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center space-x-3">
              <img src={logoPath} alt="Tutoro Logo" className="h-8 w-8 rounded-lg border border-white/20" />
              <span className="text-lg font-bold text-black">
                Tutoro
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <SupportNotifications />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="bg-white border-t border-gray-200 shadow-lg">
              <div className="p-4 space-y-2">
                {navigationItems.map((item) => (
                  <NavItem key={item.path} item={item} isMobile />
                ))}
                
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-4 py-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImage} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {user?.firstName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setLocation("/dashboard")}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg hover:bg-gray-100"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                    <span>Dashboard</span>
                  </button>
                  
                  <button
                    onClick={() => setLocation("/settings")}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg hover:bg-gray-100"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                    <span>Settings</span>
                  </button>
                  
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg hover:bg-gray-100 text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Bottom Navigation - Made smaller and positioned lower */}
        <div className="fixed bottom-2 left-2 right-2 glass-gradient border border-white/20 rounded-lg shadow-lg z-50 mobile-bottom-nav">
          <div className="flex items-center justify-around py-1">
            {navigationItems.filter(item => item.showOnMobile).map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg transition-all duration-300 min-w-[56px] ${
                    active
                      ? "premium-gradient text-white shadow-lg scale-105"
                      : "text-gray-600 interactive-hover"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                    {item.badge && (
                      <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-red-500 text-white text-xs pulse-ring">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-white' : 'text-gray-600'}`}>
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* User Support Chat */}
      <UserSupportChat />
    </>
  );
}