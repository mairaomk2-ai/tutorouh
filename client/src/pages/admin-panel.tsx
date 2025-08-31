import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Users, GraduationCap, BookOpen, MessageCircle,
  Shield, Ban, CheckCircle2, XCircle, ArrowLeft,
  Search, Filter, MoreVertical, Eye, UserX, UserCheck,
  Phone, Mail, MapPin, IndianRupee, Star, Calendar,
  Award, Clock, User, Trash2
} from 'lucide-react';

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'student' | 'teacher'>('all');

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

  const { data: allUsers = [], isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users'],
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

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/admin/conversations'],
    enabled: !!user,
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User banned',
        description: 'User has been banned successfully',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to ban user',
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to unban user');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: 'User unbanned',
        description: 'User has been unbanned successfully',
      });
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to unban user',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate all admin-related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/support-messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/conversations'] });
      
      // Force refresh after 1 second to ensure data is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/admin/users'] });
        queryClient.refetchQueries({ queryKey: ['/api/admin/teachers'] });
      }, 1000);
      
      toast({
        title: 'User deleted',
        description: data.message || 'User account deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete user',
      });
    },
  });

  const handleBanUser = (userId: string, userName: string) => {
    const reason = prompt(`Enter reason for banning ${userName}:`);
    if (reason && reason.trim()) {
      banUserMutation.mutate({ userId, reason: reason.trim() });
    }
  };

  const handleUnbanUser = (userId: string) => {
    if (confirm('Are you sure you want to unban this user?')) {
      unbanUserMutation.mutate(userId);
    }
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to permanently delete ${userName}'s account? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Type assertion with safety check
  const allUsersArray = Array.isArray(allUsers) ? allUsers : [];
  
  const filteredUsers = allUsersArray.filter((user: any) => {
    const matchesSearch = searchTerm === '' || 
                         `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || user.userType === filterType;
    return matchesSearch && matchesFilter;
  });

  // Debug log
  console.log('Admin Panel Debug:', {
    allUsersLength: allUsersArray.length,
    filteredUsersLength: filteredUsers.length,
    filterType,
    searchTerm,
    usersLoading,
    usersError
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center space-x-2"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-gray-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Control Panel</h1>
                <p className="text-sm text-gray-500">Complete platform management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{(allUsers as any[]).length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Teachers</p>
                  <p className="text-2xl font-bold">{(teachers as any[]).length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Support Messages</p>
                  <p className="text-2xl font-bold">{(supportMessages as any[]).length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conversations</p>
                  <p className="text-2xl font-bold">{(conversations as any[]).length}</p>
                </div>
                <MessageCircle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Management Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>User Management</span>
            </CardTitle>
            <CardDescription>
              Manage all platform users - students, teachers, and administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  className="flex items-center space-x-2"
                  data-testid="button-filter-all"
                >
                  <Users className="w-4 h-4" />
                  <span>All</span>
                </Button>
                <Button
                  variant={filterType === 'student' ? 'default' : 'outline'}
                  onClick={() => setFilterType('student')}
                  className="flex items-center space-x-2"
                  data-testid="button-filter-students"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Students</span>
                </Button>
                <Button
                  variant={filterType === 'teacher' ? 'default' : 'outline'}
                  onClick={() => setFilterType('teacher')}
                  className="flex items-center space-x-2"
                  data-testid="button-filter-teachers"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Teachers</span>
                </Button>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-6">
              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading users...</p>
                </div>
              ) : usersError ? (
                <div className="text-center py-8 text-red-500">
                  <p className="text-lg font-medium">Error loading users</p>
                  <p className="text-sm">{String(usersError)}</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No users found</p>
                  <p className="text-sm">Total users in system: {allUsersArray.length}</p>
                  <p className="text-sm">Filter: {filterType}, Search: "{searchTerm}"</p>
                  {allUsersArray.length > 0 && (
                    <Button 
                      onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                      className="mt-4"
                      variant="outline"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                filteredUsers.map((user: any) => (
                <Card key={user.id} className="border-2 hover:border-blue-200 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* User Photo and Basic Info */}
                      <div className="flex items-center space-x-4">
                        <img
                          src={user.profileImage || '/default-avatar.jpg'}
                          alt={user.firstName}
                          className="w-20 h-20 rounded-full border-4 border-gray-200 object-cover"
                        />
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {user.firstName} {user.lastName}
                          </h3>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge
                              variant={user.userType === 'teacher' ? 'default' : 'secondary'}
                              className="text-sm px-3 py-1"
                            >
                              {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                            </Badge>
                            {user.isLocationVerified ? (
                              <Badge variant="outline" className="text-sm text-green-600 px-3 py-1">
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-sm text-gray-500 px-3 py-1">
                                <XCircle className="w-4 h-4 mr-1" />
                                Unverified
                              </Badge>
                            )}
                            {user.email.includes('_BANNED') ? (
                              <Badge variant="destructive" className="text-sm px-3 py-1">
                                <Ban className="w-4 h-4 mr-1" />
                                Banned
                              </Badge>
                            ) : user.isOnline ? (
                              <Badge variant="outline" className="text-sm text-green-600 px-3 py-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-sm text-gray-500 px-3 py-1">
                                Offline
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="font-medium">Email:</span>
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                          {user.mobile && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Phone className="w-4 h-4 text-green-600" />
                              <span className="font-medium">Mobile:</span>
                              <span className="text-gray-700">{user.mobile}</span>
                            </div>
                          )}
                          {(user.city || user.state) && (
                            <div className="flex items-center space-x-2 text-sm">
                              <MapPin className="w-4 h-4 text-red-600" />
                              <span className="font-medium">Location:</span>
                              <span className="text-gray-700">
                                {[user.city, user.state].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-sm">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="font-medium">Joined:</span>
                            <span className="text-gray-700">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Profile-specific Information */}
                        <div className="space-y-3">
                          {user.userType === 'teacher' && user.profile && (
                            <>
                              {user.profile.subjects && user.profile.subjects.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">Subjects:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.profile.subjects.map((subject: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {user.profile.qualification && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Award className="w-4 h-4 text-yellow-600" />
                                  <span className="font-medium">Qualification:</span>
                                  <span className="text-gray-700">{user.profile.qualification}</span>
                                </div>
                              )}
                              {user.profile.experience && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Clock className="w-4 h-4 text-indigo-600" />
                                  <span className="font-medium">Experience:</span>
                                  <span className="text-gray-700">{user.profile.experience}</span>
                                </div>
                              )}
                              {user.profile.monthlyFee && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <IndianRupee className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">Monthly Fee:</span>
                                  <span className="text-gray-700 font-semibold">₹{user.profile.monthlyFee}</span>
                                </div>
                              )}
                              {user.profile.rating && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <Star className="w-4 h-4 text-yellow-500" />
                                  <span className="font-medium">Rating:</span>
                                  <span className="text-gray-700">{user.profile.rating}/5</span>
                                </div>
                              )}
                            </>
                          )}
                          
                          {user.userType === 'student' && user.profile && (
                            <>
                              {user.profile.class && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <GraduationCap className="w-4 h-4 text-blue-600" />
                                  <span className="font-medium">Class:</span>
                                  <span className="text-gray-700">{user.profile.class}</span>
                                </div>
                              )}
                              {user.profile.schoolName && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <BookOpen className="w-4 h-4 text-purple-600" />
                                  <span className="font-medium">School:</span>
                                  <span className="text-gray-700">{user.profile.schoolName}</span>
                                </div>
                              )}
                              {user.profile.preferredSubjects && user.profile.preferredSubjects.length > 0 && (
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">Preferred Subjects:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {user.profile.preferredSubjects.map((subject: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {(user.profile.budgetMin || user.profile.budgetMax) && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <IndianRupee className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">Budget:</span>
                                  <span className="text-gray-700">
                                    ₹{user.profile.budgetMin || 0} - ₹{user.profile.budgetMax || 0}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 min-w-[120px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/admin/user/${user.id}`)}
                          data-testid={`button-view-user-${user.id}`}
                          className="w-full"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        {user.email.includes('_BANNED') ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(user.id)}
                            className="w-full text-green-600 border-green-200 hover:bg-green-50"
                            data-testid={`button-unban-user-${user.id}`}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unban User
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBanUser(user.id, `${user.firstName} ${user.lastName}`)}
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                            data-testid={`button-ban-user-${user.id}`}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Ban User
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                          className="w-full text-white bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
                          data-testid={`button-delete-user-${user.id}`}
                          disabled={deleteUserMutation.isPending}
                        >
                          {deleteUserMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <Trash2 className="w-4 h-4 mr-2" />
                          )}
                          {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Account'}
                        </Button>
                      </div>
                    </div>



                    {/* Additional Bio for Teachers */}
                    {user.userType === 'teacher' && user.profile?.bio && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Bio:</span>
                          <p className="text-gray-700 mt-1 italic">"{user.profile.bio}"</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation('/admin/teachers')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Manage Teachers</h3>
                  <p className="text-sm text-gray-600 mt-1">View detailed teacher information</p>
                </div>
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation('/admin/support')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Support Messages</h3>
                  <p className="text-sm text-gray-600 mt-1">Monitor and respond to user support</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation('/admin/conversations')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Chat Monitoring</h3>
                  <p className="text-sm text-gray-600 mt-1">View all platform conversations</p>
                </div>
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}