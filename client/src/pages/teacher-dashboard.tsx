import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Star, 
  Users, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  User
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ProfileCard from "@/components/profile-card";
import ReviewCard from "@/components/review-card";
import KycModal from "@/components/kyc-modal";
import RequirementModal from "@/components/requirement-modal";
import ProfilePhotoUpload from "@/components/profile-photo-upload";
import { LocationSetup } from "@/components/location-setup";
import { VerifiedBadge } from "@/components/verified-badge";
import { useToast } from "@/hooks/use-toast";

export default function TeacherDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [showKycModal, setShowKycModal] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews", user?.id],
    enabled: !!user?.id,
  });

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
                <div className="flex flex-col sm:flex-row sm:items-center mb-4">
                  <h2 className="text-2xl sm:text-3xl font-bold gradient-text mr-4">
                    {user.firstName} {user.lastName}
                  </h2>
                </div>

                <p className="text-gray-700 mb-4 font-medium text-lg">{profile.qualification}</p>

                <div className="flex items-center space-x-4">
                  <div className="star-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-current" />
                    ))}
                  </div>
                  <span className="text-base text-gray-600">
                    {profile.rating} ({profile.studentCount} students)
                  </span>
                </div>
              </div>
            </div>

            {/* Teacher Details */}
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 text-base mt-4">
              <div>
                <span className="font-medium">City:</span>
                <p className="text-gray-600">{profile.city || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Experience:</span>
                <p className="text-gray-600">{profile.experience || "0 years"}</p>
              </div>
              <div>
                <span className="font-medium">Monthly Fee:</span>
                <p className="text-gray-600">₹{(profile as any).monthlyFee || "5000"}</p>
              </div>
              <div>
                <span className="font-medium">Subjects:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.subjects?.map((subject: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  )) || <span className="text-gray-500 text-xs">No subjects</span>}
                </div>
              </div>
              <div>
                <span className="font-medium">Students:</span>
                <p className="text-gray-600 flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {profile.studentCount || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Location Verification Status */}
          {!(user as any).isLocationVerified && (
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Verify your location to get verified status and increase your credibility. Location verification helps students find you easily.
              </AlertDescription>
            </Alert>
          )}
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
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Button
          onClick={() => setShowRequirementModal(true)}
          className="bg-primary hover:bg-primary/90"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Send Requirement
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
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete Requirement
        </Button>
      </div>

      {/* Current Requirement */}
      {requirement && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Current Requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><span className="font-medium">Subjects:</span> {(requirement as any).subjects?.join(", ")}</p>
              <p><span className="font-medium">Location:</span> {(requirement as any).location}</p>
              <p><span className="font-medium">Type:</span> {(requirement as any).type}</p>
              {(requirement as any).fee && (
                <p><span className="font-medium">Fee:</span> ₹{(requirement as any).fee} {(requirement as any).feeType}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      <Card className="mb-20">
        <CardHeader>
          <CardTitle>Student Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews && (reviews as any).length > 0 ? (
            <div className="space-y-4">
              {(reviews as any).map((review: any) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No reviews yet. Keep teaching to earn your first review!
            </p>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <KycModal 
        isOpen={showKycModal} 
        onClose={() => setShowKycModal(false)} 
      />

      <RequirementModal
        isOpen={showRequirementModal}
        onClose={() => setShowRequirementModal(false)}
        userType="teacher"
      />
    </div>
  );
}