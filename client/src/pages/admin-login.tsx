import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logoPath from '@assets/IMG_20250731_105128_697_1754300950174.jpg';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        toast({
          title: 'Login successful',
          description: 'Welcome to admin panel',
        });
        
        // Short delay to ensure token is set before navigation
        setTimeout(() => {
          setLocation('/admin/dashboard');
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Invalid response from server' }));
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: errorData.message || 'Invalid credentials',
        });
      }
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: error.message || 'Unable to connect to server. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center justify-center space-x-3">
            <img 
              src={logoPath} 
              alt="Tutoro Logo" 
              className="h-10 w-10 rounded-lg border-2 border-white/20 shadow-lg" 
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Tutoro Admin
            </span>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Login</CardTitle>
          <CardDescription className="text-gray-600">
            Access the admin panel to manage the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Admin email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  data-testid="input-admin-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  data-testid="input-admin-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 touch-manipulation min-h-[48px]"
              disabled={isLoading}
              data-testid="button-admin-login"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Secure admin access only
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}