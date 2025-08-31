import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Login() {
  const { toast } = useToast();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      console.log("Attempting login...");
      const response = await apiRequest("POST", "/api/auth/login", data, { timeout: 8000 });
      return response.json();
    },
    onSuccess: async (data) => {
      console.log("Login successful, token received");
      if (data.token) {
        login(data.token);
        // Clear old queries and fetch fresh user data
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        await queryClient.refetchQueries({ queryKey: ["/api/auth/me"] });
        
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        
        // Quick redirect
        setLocation("/");
      } else {
        throw new Error("No token received");
      }
    },
    onError: (error: any) => {
      console.error("Login failed:", error.message);
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Welcome Back</CardTitle>
          <p className="text-gray-600">Sign in to your Tutoro account</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 min-h-[44px] touch-manipulation"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Signing in...
                  </div>
                ) : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">Don't have an account?</p>
            <div className="flex space-x-4">
              <Link href="/register-student">
                <Button variant="outline" className="flex-1">
                  Register as Student
                </Button>
              </Link>
              <Link href="/register-teacher">
                <Button variant="outline" className="flex-1">
                  Register as Teacher
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}