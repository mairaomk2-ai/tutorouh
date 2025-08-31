import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { MapPin, Navigation, User, School } from "lucide-react";
import { VerifiedBadge } from "./verified-badge";
import { apiRequest } from "@/lib/queryClient";

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    profileImage?: string;
    class?: string;
    schoolName?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    isVerified?: boolean;
    latitude?: string;
    longitude?: string;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

export function StudentCard({ student, userLocation }: StudentCardProps) {
  const { toast } = useToast();
  const [isDirectionLoading, setIsDirectionLoading] = useState(false);

  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', `/api/user/request`, {
        receiverId: student.id,
        message: "Hi, I would like to offer my teaching services. Please let me know if you're interested.",
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent Successfully!",
        description: "Your teaching offer has been sent to the student.",
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
    if (!student.latitude || !student.longitude) {
      toast({
        title: "Location Not Available",
        description: "This student has not provided their location.",
        variant: "destructive",
      });
      return;
    }

    setIsDirectionLoading(true);

    try {
      // Request user's current location permission
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            
            // Calculate distance
            const distance = calculateDistance(
              latitude,
              longitude,
              parseFloat(student.latitude!),
              parseFloat(student.longitude!)
            );

            // Open directions in Google Maps
            const mapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${student.latitude},${student.longitude}`;
            window.open(mapsUrl, '_blank');

            toast({
              title: "Directions Opened", 
              description: `Distance: ${distance.toFixed(1)} km away`,
            });
            setIsDirectionLoading(false);
          },
          (error) => {
            console.error("Geolocation error:", error);
            setIsDirectionLoading(false);
            
            // Show specific error messages based on error code
            let errorMessage = "Please enable location permissions to get directions.";
            if (error.code === error.PERMISSION_DENIED) {
              errorMessage = "Location access denied. Please allow location permissions in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Location information is unavailable. Please check your GPS settings.";
            } else if (error.code === error.TIMEOUT) {
              errorMessage = "Location request timed out. Please try again.";
            }
            
            toast({
              title: "Location Error",
              description: errorMessage,
              variant: "destructive",
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      } else {
        setIsDirectionLoading(false);
        toast({
          title: "Geolocation Not Supported",
          description: "Your browser doesn't support location services.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Direction error:", error);
      setIsDirectionLoading(false);
      toast({
        title: "Error",
        description: "Failed to get directions",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-xl border-0 transform hover:scale-105 hover:shadow-2xl transition-all duration-300 border-l-4 border-l-primary" style={{ boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.2)' }}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Profile Image */}
          <div className="relative">
            <img
              src={student.profileImage || "/attached_assets/images (2)_1754294016411.jpeg"}
              alt={student.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <div className="absolute -top-1 -right-1">
              <VerifiedBadge isVerified={student.isVerified || false} size="lg" showNotVerified={!student.isVerified} />
            </div>
          </div>

          {/* Student Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {student.name}
              </h3>
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {student.class && (
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Class: {student.class}</span>
                </div>
              )}
              
              {student.schoolName && (
                <div className="flex items-center space-x-1">
                  <School className="w-4 h-4" />
                  <span>{student.schoolName}</span>
                </div>
              )}

              {(student.city || student.state) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>
                      {[student.city, student.state].filter(Boolean).join(", ")}
                    </span>
                  </div>
                  {userLocation && student.latitude && student.longitude && (
                    <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg">
                      <Navigation className="w-3 h-3 mr-1 text-green-600" />
                      <span className="text-green-600 font-medium text-xs">
                        {calculateDistance(
                          userLocation.latitude,
                          userLocation.longitude,
                          parseFloat(student.latitude),
                          parseFloat(student.longitude)
                        ).toFixed(1)} km
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => sendRequestMutation.mutate()}
                disabled={sendRequestMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {sendRequestMutation.isPending ? "Sending..." : "Send Teaching Offer"}
              </Button>

              <Button
                variant="outline"
                onClick={handleDirection}
                disabled={isDirectionLoading}
                className="flex-1"
              >
                <Navigation className="w-4 h-4 mr-1" />
                {isDirectionLoading ? "Loading..." : "Direction"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}