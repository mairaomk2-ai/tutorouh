import { Link, useLocation } from "wouter";
import { Home, ClipboardList, MessageCircle, Search, FileText, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logoPath from "@assets/images-removebg-preview_1754209307483.png";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/requirements", icon: ClipboardList, label: "Requirements" },
    { path: "/messages", icon: MessageCircle, label: "Messages" },
    { path: "/find", icon: Search, label: "Find" },
    { path: "/request", icon: FileText, label: "Request" },
  ];

  return (
    <>
      {/* Desktop Top Bar - Only Logo and User Info */}
      <nav className="hidden md:block bg-white shadow-sm fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center">
              <img src={logoPath} alt="Tutoro Logo" className="h-6 w-6 mr-2" />
              <span className="text-lg font-bold text-gray-800">Tutoro</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span className="text-sm font-medium">{user?.firstName}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Both Mobile and Desktop - Made smaller and positioned lower */}
      <nav className="fixed bottom-2 left-2 right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 h-12">
        <div className="max-w-7xl mx-auto h-full">
          <div className="grid grid-cols-5 gap-0 py-1 px-2 h-full">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={`flex flex-col items-center py-1 px-1 h-full w-full text-xs ${
                    location === item.path ? "text-primary bg-primary/10 rounded-lg" : "text-gray-600"
                  }`}
                >
                  <item.icon className="w-4 h-4 mb-1" />
                  <span className="text-[8px] font-medium">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
