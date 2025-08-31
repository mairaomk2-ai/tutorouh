import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Users, GraduationCap, BookOpen, MessageCircle,
  BarChart3, Settings, LogOut, Shield, RefreshCw,
  Eye, Ban, CheckCircle2, XCircle, Trash2, AlertTriangle
} from 'lucide-react';
import logoPath from '@assets/IMG_20250731_105128_697_1754300950174.jpg';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.userType !== 'admin') {
        setLocation('/admin/login');
        return;
      }
      setUser(userData);
    } else {
      setLocation('/admin/login');
    }
  }, [setLocation]);

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    enabled: !!user,
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/admin/teachers'],
    enabled: !!user,
  });

  const { data: supportMessages = [] } = useQuery({
    queryKey: ['/api/admin/support-messages'],
    enabled: !!user,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast({
      title: 'Logged out',
      description: 'You have been logged out successfully',
    });
    // Force immediate redirect to login page
    window.location.href = '/admin/login';
  };

  const handleChangePassword = () => {
    setLocation('/admin/change-password');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statsCards = [
    {
      title: 'Total Users',
      value: (stats as any)?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600'
    },
    {
      title: 'Students',
      value: (stats as any)?.students || 0,
      icon: GraduationCap,
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-600'
    },
    {
      title: 'Teachers',
      value: (stats as any)?.teachers || 0,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600'
    },
    {
      title: 'Messages',
      value: (stats as any)?.totalMessages || 0,
      icon: MessageCircle,
      color: 'from-orange-500 to-orange-600',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img 
                src={logoPath} 
                alt="Tutoro Logo" 
                className="h-10 w-10 rounded-lg border-2 border-blue-200 shadow-lg" 
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">Platform Management</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => refetchStats()}
                className="flex items-center space-x-2"
                data-testid="button-refresh-stats"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleChangePassword}
                className="flex items-center space-x-2"
                data-testid="button-change-password"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 border-red-200 hover:bg-red-50"
                data-testid="button-admin-logout"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.firstName}!
            </h2>
          </div>
          <p className="text-gray-600">
            Manage and monitor the Tutoro platform from your admin dashboard.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                Manage students and teachers on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation('/admin/users')}
                className="w-full mb-3 bg-blue-600 hover:bg-blue-700"
                data-testid="button-manage-users"
              >
                <Eye className="w-4 h-4 mr-2" />
                View All Users
              </Button>
              <Button
                onClick={() => setLocation('/admin/teachers')}
                variant="outline"
                className="w-full"
                data-testid="button-manage-teachers"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Teachers
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="w-5 h-5 text-green-600" />
                <span>Communication</span>
              </CardTitle>
              <CardDescription>
                Monitor messages and support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation('/admin/support-conversations')}
                className="w-full mb-3 bg-green-600 hover:bg-green-700"
                data-testid="button-view-support-conversations"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Support Chat ({(supportMessages as any[])?.length || 0})
              </Button>
              <Button
                onClick={() => setLocation('/admin/chat-monitoring')}
                variant="outline"
                className="w-full"
                data-testid="button-view-chat-monitoring"
              >
                <Eye className="w-4 h-4 mr-2" />
                Monitor Platform Chats
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span>Platform Control</span>
              </CardTitle>
              <CardDescription>
                Advanced platform management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation('/admin/panel')}
                className="w-full mb-3 bg-purple-600 hover:bg-purple-700"
                data-testid="button-admin-panel"
              >
                <Shield className="w-4 h-4 mr-2" />
                Full Admin Panel
              </Button>
              <Button
                variant="outline"
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                data-testid="button-ban-management"
              >
                <Ban className="w-4 h-4 mr-2" />
                Ban Management
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-red-700">Dangerous Actions</span>
              </CardTitle>
              <CardDescription className="text-red-600">
                ⚠️ Permanent actions - use with extreme caution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => setLocation('/admin/panel')}
                className="w-full mb-3 bg-red-600 hover:bg-red-700 text-white"
                data-testid="button-delete-users"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete User Accounts
              </Button>
              <p className="text-xs text-red-500 mt-2 italic">
                Complete account deletion with all data removal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Teacher Registrations</CardTitle>
            <CardDescription>
              Latest teachers who joined the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(teachers as any[])?.slice(0, 5).map((teacher: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                <div className="flex items-center space-x-3">
                  <img
                    src={teacher.profileImage || '/default-avatar.jpg'}
                    alt={teacher.firstName}
                    className="w-10 h-10 rounded-full border-2 border-gray-200"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {teacher.firstName} {teacher.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {teacher.email} • {teacher.subjects?.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {teacher.isVerified ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {teacher.city || 'No Location'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}