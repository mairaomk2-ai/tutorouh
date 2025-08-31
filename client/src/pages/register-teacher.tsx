import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const teacherRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  subjects: z.array(z.string()).min(1, "Please select at least one subject").default([]),
  bio: z.string().optional(),
  qualification: z.string().min(1, "Qualification is required"),
  experience: z.string().min(1, "Experience is required"),
});

export default function RegisterTeacher() {
  const { toast } = useToast();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(teacherRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      mobile: "",
      subjects: [],
      bio: "",
      qualification: "",
      experience: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teacherRegisterSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        subjects: data.subjects, // Keep as array for backend
        userType: "teacher",
      }, { timeout: 10000 }); // 10 second timeout for registration
      return response;
    },
    onSuccess: async (data: any) => {
      // Store token immediately
      login(data.token);
      
      // Invalidate auth queries to refresh user data
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Show success message
      toast({
        title: "Registration Successful!",
        description: "Welcome to Tutoro! You're now logged in.",
      });
      
      // Quick redirect
      setLocation("/");
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof teacherRegisterSchema>) => {
    registerMutation.mutate(data);
  };

  const subjectOptions = [
    "Mathematics",
    "Physics", 
    "Chemistry",
    "Biology",
    "English",
    "Hindi",
    "History",
    "Geography",
    "Computer Science",
    "Economics",
    "Accountancy",
    "Business Studies",
    "Political Science",
    "Psychology",
    "Sociology",
    "Philosophy",
    "Statistics",
    "Physical Education",
    "Art & Craft",
    "Music"
  ];

  const selectedSubjects = form.watch("subjects") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/20 to-secondary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-secondary">Join as Teacher</CardTitle>
          <p className="text-gray-600">Create your teacher account</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your mobile number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects You Can Teach</FormLabel>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                      {subjectOptions.map((subject) => (
                        <FormItem
                          key={subject}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={(field.value as string[] || []).includes(subject)}
                              onCheckedChange={(checked) => {
                                const currentValue = field.value as string[] || [];
                                if (checked) {
                                  field.onChange([...currentValue, subject]);
                                } else {
                                  field.onChange(currentValue.filter((value) => value !== subject));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            {subject}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      Selected: {selectedSubjects.length} subjects
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., B.Tech, M.A." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5 years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about your teaching style and approach..." 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 touch-manipulation min-h-[48px]"
                disabled={registerMutation.isPending}
                data-testid="button-register-teacher"
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Teacher Account"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? {" "}
              <Link href="/login">
                <Button variant="link" className="text-secondary p-0">
                  Sign in here
                </Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}