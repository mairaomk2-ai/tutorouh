import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", 
  "Hindi", "History", "Geography", "Computer Science", "Economics"
];

const classes = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
];

const requirementSchema = z.object({
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  classes: z.array(z.string()).optional(),
  location: z.string().min(1, "Location is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  street: z.string().optional(),
  village: z.string().optional(),
  type: z.enum(["online", "offline", "both"]),
  fee: z.string().or(z.number()).optional().transform(val => val ? String(val) : undefined),
  feeType: z.enum(["per_hour", "per_day", "per_month", "per_subject"]).optional(),
  description: z.string().optional(),
});

interface RequirementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: "student" | "teacher";
}

export default function RequirementModal({ isOpen, onClose, userType }: RequirementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof requirementSchema>>({
    resolver: zodResolver(requirementSchema),
    defaultValues: {
      subjects: [],
      classes: userType === "teacher" ? [] : undefined,
      location: "",
      city: "",
      state: "",
      pinCode: "",
      street: "",
      village: "",
      type: "both" as const,
      fee: "",
      feeType: "per_month" as const,
      description: "",
    },
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/requirements", {
        ...data,
        fee: data.fee ? parseFloat(data.fee) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Requirement posted",
        description: "Your requirement has been posted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post requirement",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof requirementSchema>) => {
    createRequirementMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto premium-card dialog-content">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-center">
            {userType === "student" ? "Post Your Learning Requirement" : "Post Your Teaching Requirement"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Subjects */}
            <FormField
              control={form.control}
              name="subjects"
              render={() => (
                <FormItem>
                  <FormLabel>Subjects *</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                      <FormField
                        key={subject}
                        control={form.control}
                        name="subjects"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(subject)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value as string[] || [];
                                  return checked
                                    ? field.onChange([...currentValue, subject])
                                    : field.onChange(
                                        currentValue.filter((value: string) => value !== subject)
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal text-sm">
                              {subject}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Classes (for teachers) */}
            {userType === "teacher" && (
              <FormField
                control={form.control}
                name="classes"
                render={() => (
                  <FormItem>
                    <FormLabel>Classes</FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {classes.map((className) => (
                        <FormField
                          key={className}
                          control={form.control}
                          name="classes"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(className)}
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value as string[] || [];
                                    return checked
                                      ? field.onChange([...currentValue, className])
                                      : field.onChange(
                                          currentValue.filter((value: string) => value !== className)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal text-sm">
                                {className}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />
            )}

            {/* Location Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area/Locality *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your area/locality" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter state" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pin Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pin code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street/Road</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter street/road" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="village"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Village (if applicable)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter village" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="both">Both Online & Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fee */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {userType === "student" ? "Budget" : "Fee"} (₹)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="per_hour">Per Hour</SelectItem>
                        <SelectItem value="per_day">Per Day</SelectItem>
                        <SelectItem value="per_month">Per Month</SelectItem>
                        <SelectItem value="per_subject">Per Subject</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific requirements or preferences..."
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="sticky bottom-0 bg-white pt-4 border-t mt-6">
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRequirementMutation.isPending}
                  className="premium-button"
                >
                  {createRequirementMutation.isPending ? "Posting..." : "Post Requirement"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
