import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import RegisterStudent from "@/pages/register-student";
import RegisterTeacher from "@/pages/register-teacher";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import Requirements from "@/pages/requirements";
import Messages from "@/pages/messages";
import Find from "@/pages/find";
import Request from "@/pages/request";
import NavigationPremium from "@/components/navigation-premium";
import NotFound from "@/pages/not-found";
import ProfileEdit from "@/pages/profile-edit";

// Premium pages
import Home from "@/pages/home";
import MessagesPremium from "@/pages/messages-premium";
import RequirementsPremium from "@/pages/requirements-premium";
import FindPremium from "@/pages/find-premium";
import RequestPremium from "@/pages/request-premium";
import Settings from "@/pages/settings";
import NearbyMapPage from "@/pages/nearby-map";
import SupportButton from "@/components/SupportButton";

// Admin pages
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminPanel from "@/pages/admin-panel";
import AdminSupport from "@/pages/admin-support";
import AdminConversations from "@/pages/admin-conversations";
import AdminSupportConversations from "@/pages/admin-support-conversations";
import AdminChatMonitoring from "@/pages/admin-chat-monitoring";
import AdminChangePassword from "@/pages/admin-change-password";

function Router() {
  const { user, isLoading, token, error } = useAuth();

  // Simple loading check - no complex timeout logic to avoid hooks issues
  if (isLoading && token && !error && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/30 border-t-primary mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register-student" component={RegisterStudent} />
        <Route path="/register-teacher" component={RegisterTeacher} />
        <Route path="/admin" component={AdminLogin} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Admin user routes - no regular navigation
  if ((user as any).userType === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Switch>
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/panel" component={AdminPanel} />
          <Route path="/admin/users" component={AdminPanel} />
          <Route path="/admin/teachers" component={AdminPanel} />
          <Route path="/admin/support" component={AdminSupport} />
          <Route path="/admin/support-conversations" component={AdminSupportConversations} />
          <Route path="/admin/chat-monitoring" component={AdminChatMonitoring} />
          <Route path="/admin/conversations" component={AdminConversations} />
          <Route path="/admin/change-password" component={AdminChangePassword} />
          <Route path="/" component={AdminDashboard} />
          <Route component={AdminDashboard} />
        </Switch>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Switch>
        {/* Chat routes - no navigation */}
        <Route path="/messages/:userId">
          <div className="min-h-screen">
            <MessagesPremium />
          </div>
        </Route>
        
        {/* All other routes - with navigation */}
        <Route>
          {/* Navigation */}
          <div className="fixed top-0 left-0 right-0 z-40">
            <NavigationPremium />
          </div>
          
          {/* Main content with proper spacing */}
          <div className="pt-12 pb-16 md:pb-0">
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/dashboard">
                {user.userType === "student" ? <StudentDashboard /> : <TeacherDashboard />}
              </Route>
              <Route path="/requirements" component={RequirementsPremium} />
              <Route path="/messages" component={MessagesPremium} />
              <Route path="/find" component={FindPremium} />
              <Route path="/request" component={RequestPremium} />
              <Route path="/profile/edit" component={ProfileEdit} />
              <Route path="/settings" component={Settings} />
              <Route path="/nearby-map" component={NearbyMapPage} />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/old/requirements" component={Requirements} />
              <Route path="/old/messages" component={Messages} />
              <Route path="/old/messages/:userId" component={Messages} />
              <Route path="/old/find" component={Find} />
              <Route path="/old/request" component={Request} />
              
              <Route component={NotFound} />
            </Switch>
            
            {/* Support Button - show for students and teachers */}
            {(user.userType === "student" || user.userType === "teacher") && <SupportButton />}
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;