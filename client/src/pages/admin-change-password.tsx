import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Shield, Lock, Eye, EyeOff, CheckCircle2
} from 'lucide-react';

export default function AdminChangePassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Password changed successfully!',
      });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setLocation('/admin/dashboard');
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to change password',
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'All fields are required',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New passwords do not match',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New password must be at least 6 characters long',
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-lg shadow-xl border-b border-blue-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setLocation('/admin/dashboard')}
                className="flex items-center space-x-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="border-l border-blue-300 h-6"></div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Change Password</h1>
                <p className="text-sm text-blue-600/70">Update your admin account password</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md mt-16">
        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-lg">
          <CardHeader className="text-center space-y-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Change Admin Password</CardTitle>
              <CardDescription className="text-blue-100 mt-2">
                Secure your admin account with a new password
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Current Password</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="pr-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>New Password</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="Enter your new password"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="pr-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm New Password</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pr-10 border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-3" />
                    <span>Change Password</span>
                  </>
                )}
              </Button>
            </form>

            {/* Security Tips */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">Password Security Tips:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use a strong, unique password</li>
                <li>• Include uppercase, lowercase, numbers, and symbols</li>
                <li>• Avoid using personal information</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}