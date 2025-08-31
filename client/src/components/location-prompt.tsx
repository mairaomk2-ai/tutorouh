import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LocationPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationPrompt({ isOpen, onClose }: LocationPromptProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      return apiRequest("POST", "/api/auth/update-location", locationData);
    },
    onSuccess: () => {
      toast({
        title: "Location Updated",
        description: "Your location has been verified successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Location Update Failed",
        description: "Failed to update location. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGetLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      const { getCurrentLocationEnhanced } = await import("@/lib/location-utils");
      const locationData = await getCurrentLocationEnhanced({
        enableHighAccuracy: true,
        showAccuracyWarning: true,
        timeout: 15000,
        maximumAge: 60000,
      });

      updateLocationMutation.mutate(locationData);
    } catch (error: any) {
      console.log("Location detection failed:", error);
      // Don't show error notification to user for smooth experience
      onClose(); // Just close the dialog quietly
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md premium-card">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">Enable Location</DialogTitle>
          <DialogDescription className="text-gray-600">
            Help us verify your location to connect you with nearby teachers and students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800 font-medium">Get verified badge</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800 font-medium">Find nearby matches</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-800 font-medium">Build trust with others</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isGettingLocation || updateLocationMutation.isPending}
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleGetLocation}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isGettingLocation || updateLocationMutation.isPending}
            >
              {isGettingLocation || updateLocationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isGettingLocation ? "Getting Location..." : "Updating..."}
                </>
              ) : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Enable Location
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}