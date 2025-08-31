import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const studentRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  class: z.string().min(1, "Class is required"),
  schoolName: z.string().min(1, "School name is required"),
});

const teacherRegisterSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  subjects: z.string().min(1, "Subject is required"),
  bio: z.string().optional(),
  qualification: z.string().min(1, "Qualification is required"),
});

interface AuthModalProps {
  isOpen: boolean;
  userType: "student" | "teacher";
  onClose: () => void;
}

export default function AuthModal({ isOpen, userType, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const getDefaultValues = () => ({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobile: "",
    ...(userType === "student" 
      ? { class: "", schoolName: "" }
      : { subjects: "", bio: "", qualification: "" }
    ),
  });

  const registerForm = useForm<any>({
    resolver: zodResolver(userType === "student" ? studentRegisterSchema : teacherRegisterSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Reset forms when modal opens or userType changes
  useEffect(() => {
    if (isOpen) {
      setMode("login");
      loginForm.reset({
        email: "",
        password: "",
      });
      
      const newDefaults = getDefaultValues();
      registerForm.reset(newDefaults);
    }
  }, [isOpen, userType]);

  // Additional effect to ensure proper form reset when switching modes
  useEffect(() => {
    if (mode === "register") {
      const newDefaults = getDefaultValues();
      registerForm.reset(newDefaults);
    }
  }, [mode, userType]);

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: async (data) => {
      login(data.token);
      // Invalidate and refetch user data immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/auth/register", {
        ...data,
        userType,
      });
      return response.json();
    },
    onSuccess: async (data) => {
      login(data.token);
      // Invalidate and refetch user data immediately
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Registration successful",
        description: "Welcome to Tutoro!",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const onLogin = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  const onRegister = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Login" : "Register"} as {userType === "student" ? "Student" : "Teacher"}
          </DialogTitle>
        </DialogHeader>

        {mode === "login" ? (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
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
                control={loginForm.control}
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
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Button 
                variant="link" 
                className="text-primary p-0"
                onClick={() => setMode("register")}
              >
                Register here
              </Button>
            </div>
          </Form>
        ) : (
          <Form {...registerForm} key={`register-${userType}`}>
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <FormField
                control={registerForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your first name" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your email" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
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
                control={registerForm.control}
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

              {userType === "student" ? (
                <>
                  <FormField
                    control={registerForm.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...Array(12)].map((_, i) => (
                              <SelectItem key={i + 1} value={`Class ${i + 1}`}>
                                Class {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="schoolName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>School Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your school name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <>
                  <FormField
                    control={registerForm.control}
                    name="subjects"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="Biology">Biology</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="History">History</SelectItem>
                            <SelectItem value="Geography">Geography</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about yourself" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your qualification" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Button 
                type="submit" 
                className={`w-full ${userType === "student" ? "bg-primary" : "bg-secondary"} hover:opacity-90`}
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Registering..." : `Register as ${userType === "student" ? "Student" : "Teacher"}`}
              </Button>
            </form>
            
            <div className="text-center mt-4">
              <span className="text-sm text-gray-600">Already have an account? </span>
              <Button 
                variant="link" 
                className="text-primary p-0"
                onClick={() => setMode("login")}
              >
                Login here
              </Button>
            </div>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
