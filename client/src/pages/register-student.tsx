import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const studentRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  class: z.string().min(1, "Class is required"),
  schoolName: z.string().min(1, "School name is required"),
});

export default function RegisterStudent() {
  const { toast } = useToast();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(studentRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      mobile: "",
      class: "",
      schoolName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studentRegisterSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        userType: "student",
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

  const onSubmit = (data: z.infer<typeof studentRegisterSchema>) => {
    registerMutation.mutate(data);
  };

  // Extended class options including year-based classes
  const classOptions = [
    ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
    "1st Year College",
    "2nd Year College", 
    "3rd Year College",
    "4th Year College",
    "Graduate",
    "Post Graduate"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Join as Student</CardTitle>
          <p className="text-gray-600">Create your student account</p>
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
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class/Year</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your class or year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School/College Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your institution name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 touch-manipulation min-h-[48px]"
                disabled={registerMutation.isPending}
                data-testid="button-register-student"
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    Creating Account...
                  </div>
                ) : (
                  "Create Student Account"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? {" "}
              <Link href="/login">
                <Button variant="link" className="text-primary p-0">
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