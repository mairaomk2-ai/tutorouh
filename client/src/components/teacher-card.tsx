import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verified-badge";
import { MapPin, Navigation, Send, Star, User } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface TeacherCardProps {
  teacher: {
    id: string;
    name: string;
    profileImage?: string;
    subjects?: string[];
    qualification: string;
    experience: string;
    city?: string;
    state?: string;
    pinCode?: string;
    rating?: string;
    studentCount?: number;
    isVerified?: boolean;
    latitude?: string;
    longitude?: string;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

export function TeacherCard({ teacher, userLocation }: TeacherCardProps) {
  const { toast } = useToast();
  const [isDirectionLoading, setIsDirectionLoading] = useState(false);

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/user/request`, {
        receiverId: teacher.id,
        message: "Hi, I'm interested in learning from you. Please let me know if you're available.",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent Successfully!",
        description: "Your request has been sent to the teacher.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send request",
        variant: "destructive",
      });
    },
  });

  const handleDirection = async () => {
    if (!teacher.latitude || !teacher.longitude) {
      toast({
        title: "Location Not Available",
        description: "This teacher has not provided their location.",
        variant: "destructive",
      });
      return;
    }

    setIsDirectionLoading(true);

    try {
      const { openDirections, calculateDistance } = await import("@/lib/location-utils");
      
      // Get current location with high accuracy first to calculate distance
      const { getCurrentLocationEnhanced } = await import("@/lib/location-utils");
      const userLocation = await getCurrentLocationEnhanced({
        enableHighAccuracy: true,
        showAccuracyWarning: true,
        timeout: 15000,
      });

      // Calculate distance
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(teacher.latitude!),
        parseFloat(teacher.longitude!)
      );

      // Open directions using utility function
      await openDirections(teacher.latitude, teacher.longitude);

      toast({
        title: "Directions Opened",
        description: `Distance: ${distance.toFixed(1)} km away`,
      });

      setIsDirectionLoading(false);
    } catch (error: any) {
      console.error("Direction error:", error);
      setIsDirectionLoading(false);
      toast({
        title: "Direction Error",
        description: error.message || "Failed to get directions",
        variant: "destructive",
      });
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <Card className="premium-card shadow-xl border-0 transform hover:scale-105 hover:shadow-2xl transition-all duration-300" style={{ boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2)' }}>
      <CardContent className="p-6">
        {/* Profile Section */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            {teacher.profileImage ? (
              <img
                src={teacher.profileImage}
                alt={teacher.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
            {/* Verification badge overlayed on profile photo */}
            <div className="absolute -top-1 -right-1">
              <VerifiedBadge isVerified={teacher.isVerified || false} size="lg" showNotVerified={!teacher.isVerified} />
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {teacher.name}
            </h3>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{teacher.rating || "3.0"}</span>
              <span>•</span>
              <span>{teacher.studentCount || 0} students</span>
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Subjects:</p>
          <div className="flex flex-wrap gap-2">
            {teacher.subjects?.map((subject, index) => (
              <div key={index} className="bg-[#0b453a] text-white px-3 py-1 rounded-xl text-xs font-medium">
                {subject}
              </div>
            )) || (
              <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-xl text-xs">No subjects listed</div>
            )}
          </div>
        </div>

        {/* Experience & Qualification */}
        <div className="mb-3 space-y-1">
          <p className="text-sm">
            <span className="font-medium">Experience:</span> {teacher.experience}
          </p>
          <p className="text-sm">
            <span className="font-medium">Qualification:</span> {teacher.qualification}
          </p>
        </div>

        {/* Location & Distance */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{teacher.state}</span>
              {teacher.city && (
                <>
                  <span className="mx-1">•</span>
                  <span>{teacher.city}</span>
                </>
              )}
              {teacher.pinCode && (
                <>
                  <span className="mx-1">•</span>
                  <span>{teacher.pinCode}</span>
                </>
              )}
            </div>
            {userLocation && teacher.latitude && teacher.longitude && (
              <div className="flex items-center bg-blue-50 px-2 py-1 rounded-lg">
                <Navigation className="w-3 h-3 mr-1 text-blue-600" />
                <span className="text-blue-600 font-medium text-xs">
                  {calculateDistance(
                    userLocation.latitude,
                    userLocation.longitude,
                    parseFloat(teacher.latitude),
                    parseFloat(teacher.longitude)
                  ).toFixed(1)} km
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDirection}
            disabled={isDirectionLoading}
            className="flex-1"
          >
            {isDirectionLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                Getting Directions...
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 mr-2" />
                Direction
              </>
            )}
          </Button>
          
          <Button
            size="sm"
            onClick={() => sendRequestMutation.mutate()}
            disabled={sendRequestMutation.isPending}
            className="flex-1"
          >
            {sendRequestMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Request
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}