import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  School,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import RequirementModal from "@/components/requirement-modal";
import ProfilePhotoUpload from "@/components/profile-photo-upload";
import { LocationSetup } from "@/components/location-setup";
import { VerifiedBadge } from "@/components/verified-badge";
import { useToast } from "@/hooks/use-toast";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  const { data: requirement } = useQuery({
    queryKey: ["/api/requirements", "my"],
    enabled: !!user?.id,
  });

  const handleDeleteRequirement = () => {
    if (window.confirm("Are you sure you want to delete your requirement?")) {
      // Delete requirement mutation would go here
      toast({
        title: "Requirement deleted",
        description: "Your requirement has been deleted successfully.",
      });
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 pt-4 animate-fade-in-up">
      {/* Profile Section */}
      <Card className="mb-4 shadow-lg border transform hover:scale-105 transition-all duration-300">
        <CardContent className="pt-4">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex justify-center sm:justify-start">
                <div className="relative">
                  <ProfilePhotoUpload
                    currentPhoto={user.profileImage}
                    userName={`${user.firstName} ${user.lastName}`}
                  />
                  <div className="absolute -top-2 -right-2">
                    <VerifiedBadge isVerified={Boolean((user as any).isLocationVerified)} size="lg" />
                  </div>
                </div>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start mb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold gradient-text mr-3">
                    {user.firstName} {user.lastName}
                  </h2>
                </div>
                <p className="text-gray-700 mb-4 font-medium text-lg">{profile.class}</p>
                <p className="text-gray-600 text-base sm:text-lg">{user.email}</p>
              </div>
            </div>

            {/* Student Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-base mt-4">
              <div className="flex items-start sm:items-center">
                <User className="w-5 h-5 mr-2 text-gray-500 mt-1 sm:mt-0" />
                <div>
                  <span className="font-medium">Class:</span>
                  <p className="text-gray-600">{profile.class}</p>
                </div>
              </div>
              <div className="flex items-start sm:items-center">
                <School className="w-5 h-5 mr-2 text-gray-500 mt-1 sm:mt-0" />
                <div>
                  <span className="font-medium">School:</span>
                  <p className="text-gray-600 break-words">{profile.schoolName}</p>
                </div>
              </div>
              <div className="flex items-start sm:items-center col-span-1 sm:col-span-2 lg:col-span-1">
                <span className="font-medium">Mobile:</span>
                <span className="text-gray-600 ml-2">{user.mobile || "Not provided"}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Setup */}
      <div className="mb-4">
        <LocationSetup 
          isLocationVerified={Boolean((user as any).isLocationVerified)}
          onLocationSet={() => {
            // Refresh user data
            window.location.reload();
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Button
          onClick={() => setShowRequirementModal(true)}
          className="premium-button w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Post Requirement
        </Button>

        <Button
          onClick={() => window.open('/profile/edit', '_self')}
          variant="outline"
          size="lg"
          className="w-full"
        >
          <User className="w-5 h-5 mr-2" />
          Edit Profile
        </Button>

        <Button
          onClick={handleDeleteRequirement}
          variant="destructive"
          size="lg"
          disabled={!requirement}
          className="w-full"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete Requirement
        </Button>
      </div>

      {/* Current Requirement */}
      {requirement && (
        <Card className="mb-4 shadow-lg">
          <CardHeader>
            <CardTitle className="gradient-text">Your Current Requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Subjects:</span> {(requirement as any).subjects?.join(", ")}</p>
              <p><span className="font-medium">Classes:</span> {(requirement as any).classes?.join(", ")}</p>
              <p><span className="font-medium">Location:</span> {(requirement as any).location}</p>
              <p><span className="font-medium">Type:</span> {(requirement as any).type}</p>
              {(requirement as any).fee && (
                <p><span className="font-medium">Budget:</span> ₹{(requirement as any).fee} {(requirement as any).feeType}</p>
              )}
              {(requirement as any).description && (
                <p><span className="font-medium">Description:</span> {(requirement as any).description}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips for Students */}
      <Card className="shadow-lg mb-20">
        <CardHeader>
          <CardTitle className="gradient-text">Tips for Finding the Best Teacher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h4 className="font-medium text-blue-800">Be specific about your needs</h4>
                  <p className="text-sm text-blue-600">Clearly mention your subjects, class level, and learning goals.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h4 className="font-medium text-purple-800">Check teacher verification</h4>
                  <p className="text-sm text-purple-600">Look for the blue tick to ensure verified teachers.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start space-x-3">
                <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h4 className="font-medium text-orange-800">Read reviews and ratings</h4>
                  <p className="text-sm text-orange-600">Check what other students say about teaching effectiveness.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h4 className="font-medium text-green-800">Communicate clearly</h4>
                  <p className="text-sm text-green-600">Be clear about your availability and learning style.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200 md:col-span-2">
              <div className="flex items-start space-x-3">
                <div className="bg-pink-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <h4 className="font-medium text-pink-800">Set realistic expectations</h4>
                  <p className="text-sm text-pink-600">Discuss your goals, budget, and timeline upfront to ensure both parties are aligned.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requirement Modal */}
      <RequirementModal
        isOpen={showRequirementModal}
        onClose={() => setShowRequirementModal(false)}
        userType="student"
      />
    </div>
  );
}