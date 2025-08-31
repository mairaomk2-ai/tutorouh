import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Target, CheckCircle, Clock, Navigation,
  Crosshair, RotateCcw, Settings as SettingsIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getCompleteLocationData } from "@/lib/location-utils";

interface LocationPinSetterProps {
  onClose?: () => void;
  currentLocation?: any;
}

export function LocationPinSetter({ onClose, currentLocation }: LocationPinSetterProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(currentLocation);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [isLocationSet, setIsLocationSet] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const setLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest("POST", "/api/auth/update-location", locationData);
    },
    onSuccess: () => {
      toast({
        title: "Location Set Successfully",
        description: "Your location has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setIsLocationSet(true);
      setIsGettingLocation(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Failed to Set Location",
        description: "Please try again",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    },
  });

  const handleGetPreciseLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      toast({
        title: "Getting Complete Location",
        description: "Getting GPS coordinates and address details...",
      });

      // Get complete location data with city, state, pincode
      const locationData = await getCompleteLocationData({
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0, // Force fresh location
      });

      console.log('Complete location from pin setter:', locationData);

      // Automatically set the location after getting it
      setLocationMutation.mutate(locationData);
      
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please try again.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
    }
  };



  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Set Location Pin
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Simple Instructions */}
        <div className="text-center space-y-2">
          <MapPin className="h-8 w-8 text-primary mx-auto" />
          <h3 className="font-medium">Set Your Location</h3>
          <p className="text-sm text-gray-600">
            Click below to automatically get and save your current location
          </p>
        </div>

        {/* One-Click Set Location Button */}
        <Button 
          onClick={handleGetPreciseLocation}
          disabled={isGettingLocation || setLocationMutation.isPending}
          className="w-full h-12 text-base"
          size="lg"
        >
          {isGettingLocation || setLocationMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Setting Location...
            </>
          ) : (
            <>
              <Target className="h-5 w-5 mr-2" />
              Set My Location Now
            </>
          )}
        </Button>

        {/* Success State */}
        {isLocationSet && (
          <div className="text-center space-y-2">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
            <p className="text-sm text-green-600 font-medium">
              Location saved successfully!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}