import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Camera, Save, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const SUBJECTS = [
  "Mathematics", "Science", "English", "Physics", "Chemistry", "Biology",
  "History", "Geography", "Hindi", "Computer Science", "Economics",
  "Political Science", "Accountancy", "Business Studies", "Psychology",
  "Sociology", "Philosophy", "Fine Arts", "Physical Education", "Music"
];

const CLASSES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12",
  "1st Year College", "2nd Year College", "3rd Year College", "4th Year College",
  "Graduate", "Post Graduate"
];

export default function ProfileEdit() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    // Student fields
    class: "",
    schoolName: "",
    budgetMin: "",
    budgetMax: "",
    // Teacher fields
    subjects: [] as string[],
    qualification: "",
    experience: "",
    bio: "",
    monthlyFee: "",
  });

  // Fetch current profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["/api/profile"],
    enabled: !!user,
  });

  // Update form data when profile data is loaded
  useEffect(() => {
    if (profileData) {
      const data = profileData as any;
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        mobile: data.mobile || "",
        class: data.class || "",
        schoolName: data.schoolName || "",
        budgetMin: data.budgetMin || "",
        budgetMax: data.budgetMax || "",
        subjects: data.subjects || [],
        qualification: data.qualification || "",
        experience: data.experience || "",
        bio: data.bio || "",
        monthlyFee: data.monthlyFee || "",
      });
      setSelectedSubjects(data.subjects || []);
    }
  }, [profileData]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('PUT', '/api/profile', data);
    },
    onSuccess: () => {
      // Invalidate all relevant cache keys to refresh user data
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/search/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nearby-users"] });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubjectToggle = (subject: string) => {
    const updated = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    setSelectedSubjects(updated);
    setFormData(prev => ({ ...prev, subjects: updated }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      mobile: formData.mobile,
    };

    if (user?.userType === "student") {
      Object.assign(updateData, {
        class: formData.class,
        schoolName: formData.schoolName,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
      });
    } else if (user?.userType === "teacher") {
      Object.assign(updateData, {
        subjects: selectedSubjects,
        qualification: formData.qualification,
        experience: formData.experience,
        bio: formData.bio,
        monthlyFee: formData.monthlyFee,
      });
    }

    updateProfileMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tutoro-light pt-20 md:pt-6">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Edit Profile</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      data-testid="input-firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      data-testid="input-lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    data-testid="input-mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+91XXXXXXXXXX"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Student-specific fields */}
            {user?.userType === "student" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="class">Class/Year</Label>
                      <Select value={formData.class} onValueChange={(value) => setFormData(prev => ({ ...prev, class: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your class/year" />
                        </SelectTrigger>
                        <SelectContent>
                          {CLASSES.map((cls) => (
                            <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="schoolName">School/College Name</Label>
                      <Input
                        id="schoolName"
                        data-testid="input-schoolName"
                        value={formData.schoolName}
                        onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                        placeholder="Enter your school or college name"
                      />
                    </div>
                    
                    {/* Budget Range for Students */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Monthly Budget Range (₹)</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="budgetMin" className="text-xs text-gray-600">Minimum</Label>
                          <Input
                            id="budgetMin"
                            data-testid="input-budgetMin"
                            type="number"
                            value={formData.budgetMin || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: e.target.value }))}
                            placeholder="Min budget"
                            min="1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="budgetMax" className="text-xs text-gray-600">Maximum</Label>
                          <Input
                            id="budgetMax"
                            data-testid="input-budgetMax"
                            type="number"
                            value={formData.budgetMax || ""}
                            onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: e.target.value }))}
                            placeholder="Max budget"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </>
            )}

            {/* Teacher-specific fields */}
            {user?.userType === "teacher" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Teaching Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Subjects You Teach</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {SUBJECTS.map((subject) => (
                          <div key={subject} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`subject-${subject}`}
                              checked={selectedSubjects.includes(subject)}
                              onChange={() => handleSubjectToggle(subject)}
                              className="rounded"
                            />
                            <Label htmlFor={`subject-${subject}`} className="text-sm">{subject}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="qualification">Qualification</Label>
                        <Input
                          id="qualification"
                          value={formData.qualification}
                          onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                          placeholder="e.g., B.Tech, M.Sc, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Experience</Label>
                        <Input
                          id="experience"
                          value={formData.experience}
                          onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                          placeholder="e.g., 5 years, 2+ years"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio (Optional)</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder="Tell students about yourself, your teaching style, and what makes you unique..."
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="monthlyFee">Monthly Fee (₹)</Label>
                      <Input
                        id="monthlyFee"
                        data-testid="input-monthlyFee"
                        type="number"
                        value={formData.monthlyFee}
                        onChange={(e) => setFormData(prev => ({ ...prev, monthlyFee: e.target.value }))}
                        placeholder="Enter your monthly fee"
                        min="1"
                      />
                    </div>
                  </CardContent>
                </Card>


              </>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-[#0b453a] hover:bg-[#0a3d32]"
              >
                {updateProfileMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}