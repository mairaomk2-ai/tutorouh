import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCompleteLocationData } from "@/lib/location-utils";

export function GetLocationButton() {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
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
        description: "You can now find and be found by nearby users",
      });
      setLocationSet(true);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Failed to Set Location",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      toast({
        title: "Getting Your Location...",
        description: "Please allow location access when prompted",
      });

      // Get complete location data with address details
      const locationData = await getCompleteLocationData({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      console.log('Location captured:', locationData);
      
      // Save location
      await setLocationMutation.mutateAsync(locationData);
      
    } catch (error: any) {
      console.error('Location error:', error);
      toast({
        title: "Location Error",
        description: error.message || "Could not get your location. Please enable GPS and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <Card className="mx-4 mb-6">
      <CardContent className="p-6">
        {/* Header Text */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            We need your location to help you find teachers nearby and provide accurate directions.
          </h2>
        </div>

        {/* Large Green Button */}
        <Button 
          onClick={handleGetLocation}
          disabled={isGettingLocation}
          className="w-full h-16 text-xl font-semibold bg-green-600 hover:bg-green-700 text-white rounded-2xl mb-6"
          data-testid="button-get-location"
        >
          {isGettingLocation ? (
            <>
              <Loader2 className="h-6 w-6 mr-3 animate-spin" />
              Getting Location...
            </>
          ) : locationSet ? (
            <>
              <CheckCircle2 className="h-6 w-6 mr-3" />
              Location Set Successfully
            </>
          ) : (
            <>
              <MapPin className="h-6 w-6 mr-3" />
              Get My Location
            </>
          )}
        </Button>

        {/* Step by Step Guide */}
        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-700 mb-3">Step-by-step guide:</h3>
          <ol className="space-y-2 text-gray-600">
            <li className="flex items-start">
              <span className="font-medium mr-2">1.</span>
              <span>Click "Get My Location" button above</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">2.</span>
              <span>When your browser asks for permission, click "Allow"</span>
            </li>
            <li className="flex items-start">
              <span className="font-medium mr-2">3.</span>
              <span>Wait for your location to be detected and saved</span>
            </li>
          </ol>
        </div>

        {/* Troubleshooting */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Troubleshooting:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li className="flex items-center">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 flex-shrink-0"></span>
              <span>If permission was blocked, look for 🔒 or 📍 icon in address bar</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 flex-shrink-0"></span>
              <span>Make sure location services are enabled on your device</span>
            </li>
            <li className="flex items-center">
              <span className="w-2 h-2 bg-yellow-600 rounded-full mr-2 flex-shrink-0"></span>
              <span>Try refreshing the page if it's not working</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}