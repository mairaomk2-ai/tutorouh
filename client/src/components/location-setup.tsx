import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, CheckCircle, AlertTriangle, Crosshair, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface LocationData {
  latitude: number;
  longitude: number;
  fullAddress: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
}

interface LocationSetupProps {
  isLocationVerified: boolean;
  onLocationSet: () => void;
}

export function LocationSetup({ isLocationVerified, onLocationSet }: LocationSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [isHighAccuracyMode, setIsHighAccuracyMode] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const locationMutation = useMutation({
    mutationFn: async (locationData: LocationData) => {
      return apiRequest('POST', `/api/auth/update-location`, locationData);
    },
    onSuccess: () => {
      toast({
        title: "Location Verified Successfully!",
        description: "Your location has been verified and saved.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      onLocationSet();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save location",
        variant: "destructive",
      });
    },
  });

  // Check if user is at current location by watching position changes
  const watchLocationChanges = () => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracy = position.coords.accuracy;
        setLocationAccuracy(accuracy);
        
        // If accuracy is poor, suggest enabling high accuracy mode
        if (accuracy > 100 && !isHighAccuracyMode) {
          toast({
            title: "Location Accuracy Low",
            description: "Consider enabling high accuracy mode for better location precision.",
          });
        }
      },
      (error) => {
        console.log("Watch position error:", error);
      },
      {
        enableHighAccuracy: isHighAccuracyMode,
        maximumAge: 30000,
        timeout: 10000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  useEffect(() => {
    if (!isLocationVerified) {
      const cleanup = watchLocationChanges();
      return cleanup;
    }
  }, [isLocationVerified, isHighAccuracyMode]);

  const getCurrentLocation = async (retryWithHighAccuracy = false) => {
    setIsLoading(true);
    
    try {
      const { getCompleteLocationData, checkLocationPermission, requestLocationPermission } = await import("@/lib/location-utils");
      
      // Check permission status first
      const permissionStatus = await checkLocationPermission();
      
      if (permissionStatus === 'denied') {
        toast({
          title: "लोकेशन एक्सेस की जरूरत",
          description: "कृपया ब्राउज़र सेटिंग्स में लोकेशन एक्सेस को enable करें और page को refresh करें।",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      // Request permission if needed
      if (permissionStatus === 'prompt') {
        try {
          await requestLocationPermission();
          toast({
            title: "धन्यवाद!",
            description: "अब हम आपकी exact location निकाल रहे हैं...",
          });
        } catch (error: any) {
          toast({
            title: "लोकेशन एक्सेस की समस्या",
            description: error.message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
      
      const locationData = await getCompleteLocationData({
        enableHighAccuracy: retryWithHighAccuracy || isHighAccuracyMode,
        timeout: retryWithHighAccuracy ? 30000 : 15000,
        maximumAge: retryWithHighAccuracy ? 0 : 60000,
        showAccuracyWarning: true,
        requireHighAccuracy: false,
      });

      // Update state with received location data
      setLocationAccuracy(locationData.accuracy);
      setCurrentAddress(locationData.fullAddress || `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`);

      // Show accuracy-based feedback
      if (locationData.accuracy > 50) {
        toast({
          title: "Location Accuracy Notice",
          description: `लोकेशन accuracy: ${locationData.accuracy.toFixed(0)}m. बेहतर precision के लिए GPS enable करें और outdoor जाएं।`,
        });
      }

      locationMutation.mutate({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        fullAddress: locationData.fullAddress || `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
        street: locationData.street || '',
        city: locationData.city || '',
        state: locationData.state || '',
        pinCode: locationData.pinCode || '',
      });
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message || "आपकी लोकेशन नहीं मिल सकी",
        variant: "destructive",
      });
      
      // Offer retry with high accuracy if not already enabled
      if (!retryWithHighAccuracy && !isHighAccuracyMode) {
        toast({
          title: "High Accuracy Mode को कोशिश करें?",
          description: "क्या आप बेहतर precision के लिए high accuracy mode के साथ retry करना चाहते हैं?",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLocationVerified) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Location Verified</p>
              <p className="text-sm text-green-700">Your location has been verified successfully</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-orange-900">
          <MapPin className="h-5 w-5" />
          <span>अपनी Location Verify करें</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-orange-200 bg-orange-100">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Important:</strong> Please make sure you are at your home location when setting up your location. 
            This helps us provide accurate distance calculations and better matching with nearby teachers.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            We need your location to help you find teachers nearby and provide accurate directions.
          </p>
          
          {/* Location Accuracy Status */}
          {locationAccuracy && (
            <div className="flex items-center space-x-2 text-sm">
              <Crosshair className="h-4 w-4 text-blue-500" />
              <span className={locationAccuracy < 50 ? "text-green-600" : locationAccuracy < 100 ? "text-yellow-600" : "text-red-600"}>
                Accuracy: {locationAccuracy.toFixed(0)}m 
                {locationAccuracy < 50 ? " (Excellent)" : locationAccuracy < 100 ? " (Good)" : " (Poor)"}
              </span>
            </div>
          )}
          
          {/* Current Address Preview */}
          {currentAddress && (
            <div className="bg-gray-50 p-3 rounded-lg border">
              <p className="text-xs text-gray-500 mb-1">Current Location:</p>
              <p className="text-sm text-gray-700">{currentAddress}</p>
            </div>
          )}
          
          {/* High Accuracy Toggle */}
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">High Accuracy Mode</p>
              <p className="text-xs text-blue-700">Uses GPS for precise location (may take longer)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHighAccuracyMode(!isHighAccuracyMode)}
              className={isHighAccuracyMode ? "bg-blue-100 border-blue-300" : ""}
            >
              {isHighAccuracyMode ? "ON" : "OFF"}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => getCurrentLocation(false)}
              disabled={isLoading || locationMutation.isPending}
              className="flex-1"
            >
              {isLoading || locationMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Location निकाली जा रही है...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-2" />
                  मेरी Location पकड़ें
                </>
              )}
            </Button>
            
            {!isHighAccuracyMode && (
              <Button
                variant="outline"
                onClick={() => getCurrentLocation(true)}
                disabled={isLoading || locationMutation.isPending}
                title="Retry with high accuracy"
              >
                <Crosshair className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>बेहतर परिणाम के लिए Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>जब browser में location permission मांगे तो "Allow" करें</li>
              <li>अपने device में GPS/location services को enable करें</li>
              <li>बेहतर accuracy के लिए बाहर (outdoor) में location निकालें</li>
              <li>सुनिश्चित करें कि आप अपने घर/teaching location पर हैं</li>
            </ul>
            <p>अगर आपने गलती से location access को block कर दिया है, तो address bar में location icon (🔒 या 📍) देखें और उसे click करके permissions enable करें।</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}