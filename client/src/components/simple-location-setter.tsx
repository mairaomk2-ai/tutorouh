import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MapPin, Target, CheckCircle2, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCompleteLocationData } from "@/lib/location-utils";

interface SimpleLocationSetterProps {
  onClose?: () => void;
}

export function SimpleLocationSetter({ onClose }: SimpleLocationSetterProps) {
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [locationData, setLocationData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Set location mutation
  const setLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest("POST", "/api/user/location", locationData);
    },
    onSuccess: () => {
      toast({
        title: "Location Set Successfully!",
        description: "Your location is now visible to nearby users",
      });
      setLocationSet(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nearby/live-users"] });
    },
    onError: () => {
      toast({
        title: "Failed to Set Location",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSetLocation = async () => {
    setIsSettingLocation(true);
    
    try {
      toast({
        title: "Getting Your Location...",
        description: "Please allow location access",
      });

      // Get complete location data with address details
      const locationData = await getCompleteLocationData({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      console.log('Location data captured:', locationData);
      
      // Validate location data
      if (!locationData.city || !locationData.state) {
        toast({
          title: "Partial Address Found",
          description: `Got coordinates but limited address info. City: ${locationData.city || 'Unknown'}, State: ${locationData.state || 'Unknown'}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Address Found!",
          description: `${locationData.city}, ${locationData.state}${locationData.pinCode ? ', ' + locationData.pinCode : ''}`,
        });
      }

      setLocationData(locationData);
      
      // Save location
      await setLocationMutation.mutateAsync(locationData);
      
    } catch (error: any) {
      console.error('Location setting error:', error);
      toast({
        title: "Location Error",
        description: error.message || "Could not get your location. Please enable GPS and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingLocation(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Set Your Location
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Location Status</span>
          </div>
          <Badge variant={locationSet ? "default" : "secondary"}>
            {locationSet ? "Set" : "Not Set"}
          </Badge>
        </div>

        {/* Location Details */}
        {locationData && (
          <div className="space-y-2 text-sm bg-green-50 p-3 rounded-lg">
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium">{locationData.city || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">State:</span>
              <span className="font-medium">{locationData.state || 'Unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PIN Code:</span>
              <span className="font-medium">{locationData.pinCode || 'Not available'}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Coordinates:</span>
              <span className="text-gray-500">
                {locationData.latitude?.toFixed(6)}, {locationData.longitude?.toFixed(6)}
              </span>
            </div>
          </div>
        )}

        {/* Set Location Button */}
        <Button 
          onClick={handleSetLocation}
          disabled={isSettingLocation}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isSettingLocation ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Getting Location...
            </>
          ) : locationSet ? (
            <>
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Location Set - Update
            </>
          ) : (
            <>
              <Target className="h-5 w-5 mr-2" />
              Set My Location
            </>
          )}
        </Button>

        <div className="text-xs text-center text-gray-500 bg-blue-50 p-2 rounded">
          One-time location setting. Your location will be saved with complete address details and visible to nearby users.
        </div>

        {onClose && (
          <Button variant="outline" onClick={onClose} className="w-full">
            Close
          </Button>
        )}
      </CardContent>
    </Card>
  );
}