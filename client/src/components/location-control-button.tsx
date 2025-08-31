import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, 
  Navigation, 
  Settings,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocationEnhanced } from "@/lib/location-utils";

interface LocationControlButtonProps {
  onLocationSet?: () => void;
  showFullCard?: boolean;
}

export function LocationControlButton({ onLocationSet, showFullCard = false }: LocationControlButtonProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user data
  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Type safe user data
  const userData = (user as any)?.user || user;

  const locationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest('POST', `/api/auth/update-location`, locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onLocationSet?.();
      toast({
        title: "Location Set Successfully",
        description: "Your location has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Location Update Failed",
        description: error.message || "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const detectLocation = async () => {
    try {
      setIsDetecting(true);
      
      toast({
        title: "Getting GPS Location...",
        description: "Please allow location permission on your device.",
      });

      // Get enhanced location with address
      const locationData = await getCurrentLocationEnhanced({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      await locationMutation.mutateAsync(locationData);
    } catch (error: any) {
      toast({
        title: "Location Detection Failed",
        description: error.message || "Could not detect GPS location. Please allow permission manually.",
        variant: "destructive",
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const isLocationSet = userData?.latitude && userData?.longitude;

  if (showFullCard) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="font-medium">Your Location</span>
            </div>
            {isLocationSet && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Set
              </Badge>
            )}
          </div>

          {isLocationSet ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {userData?.fullAddress || `${userData?.latitude}, ${userData?.longitude}`}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={isDetecting || locationMutation.isPending}
                className="w-full"
              >
                {isDetecting ? (
                  <>
                    <Navigation className="h-4 w-4 mr-2 animate-pulse" />
                    Updating Location...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Change Location
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-600 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Location not set</span>
              </div>
              <Button
                onClick={detectLocation}
                disabled={isDetecting || locationMutation.isPending}
                className="w-full"
              >
                {isDetecting ? (
                  <>
                    <Navigation className="h-4 w-4 mr-2 animate-pulse" />
                    Finding GPS Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Set Your Location
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Simple button version
  return (
    <Button
      variant={isLocationSet ? "outline" : "default"}
      size="sm"
      onClick={detectLocation}
      disabled={isDetecting || locationMutation.isPending}
      className="flex items-center gap-2"
    >
      {isDetecting ? (
        <>
          <Navigation className="h-4 w-4 animate-pulse" />
          Detecting...
        </>
      ) : isLocationSet ? (
        <>
          <Settings className="h-4 w-4" />
          Change Location
        </>
      ) : (
        <>
          <MapPin className="h-4 w-4" />
          Set Location
        </>
      )}
    </Button>
  );
}