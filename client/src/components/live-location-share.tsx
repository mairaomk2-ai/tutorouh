import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MapPin, Navigation, Wifi, WifiOff, 
  Users, Eye, EyeOff, Clock, Target,
  AlertTriangle, CheckCircle2, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getCurrentLocationEnhanced, LocationData } from "@/lib/location-utils";

interface LiveLocationShareProps {
  onClose?: () => void;
}

export function LiveLocationShare({ onClose }: LiveLocationShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewersCount, setViewersCount] = useState(0);
  const [highAccuracy, setHighAccuracy] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOneTimeShare, setIsOneTimeShare] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation to update live location
  const updateLiveLocationMutation = useMutation({
    mutationFn: (locationData: any) => apiRequest("POST", "/api/user/live-location", locationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setLastUpdate(new Date());
      setIsUpdating(false);
    },
    onError: (error: any) => {
      console.log("Live location update failed:", error);
      setIsUpdating(false);
      // Don't show error notification for smooth UX
    },
  });

  // Mutation to stop live location sharing
  const stopLiveLocationMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/user/live-location"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setIsSharing(false);
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
    },
  });

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      return 'prompt'; // Default to prompt if permission API is not available
    }
  };

  const requestLocationPermission = async () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("GPS is not supported on this device"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => {
          let message = "Location access denied. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message += "Please allow location access in your browser settings and try again.";
              break;
            case error.POSITION_UNAVAILABLE:
              message += "Location information is unavailable. Please check your GPS settings.";
              break;
            case error.TIMEOUT:
              message += "Location request timed out. Please try again.";
              break;
            default:
              message += "An unknown error occurred while getting your location.";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  const startLocationSharing = async () => {
    try {
      setIsUpdating(true);
      setError(null); // Clear any previous errors
      
      // Import permission functions
      const { checkLocationPermission, requestLocationPermission } = await import("@/lib/location-utils");
      
      // Check current permission state
      const permissionState = await checkLocationPermission();
      
      if (permissionState === 'denied') {
        toast({
          title: "Location Access Required",
          description: "Please enable location access in your browser settings.",
          variant: "destructive",
        });
        setIsUpdating(false);
        return;
      }

      // Request permission first if needed
      if (permissionState === 'prompt') {
        try {
          await requestLocationPermission();
          toast({
            title: "Permission Granted",
            description: "You can now share your live location.",
          });
        } catch (error: any) {
          toast({
            title: "Location Permission Error",
            description: error.message,
            variant: "destructive",
          });
          setIsUpdating(false);
          return;
        }
      }
      
      // Get initial location with enhanced accuracy
      const locationData = await getCurrentLocationEnhanced({
        enableHighAccuracy: highAccuracy,
        timeout: 15000,
        maximumAge: 30000,
        showAccuracyWarning: true,
        requireHighAccuracy: false,
      });

      setCurrentLocation(locationData);
      setAccuracy(locationData.accuracy);

      // Start live location sharing
      updateLiveLocationMutation.mutate({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy,
        fullAddress: locationData.fullAddress || `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
        isLiveSharing: true,
      });

      // Watch for position changes
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          
          setCurrentLocation(newLocation);
          setAccuracy(position.coords.accuracy);
          
          // Update location if accuracy is acceptable or position changed significantly
          if (position.coords.accuracy < 100 || 
              Math.abs(newLocation.latitude - (currentLocation?.latitude || 0)) > 0.0001 ||
              Math.abs(newLocation.longitude - (currentLocation?.longitude || 0)) > 0.0001) {
            
            setIsUpdating(true);
            updateLiveLocationMutation.mutate({
              latitude: newLocation.latitude,
              longitude: newLocation.longitude,
              accuracy: position.coords.accuracy,
              isLiveSharing: true,
            });
          }
        },
        (error) => {
          console.error("Location watch error:", error);
          toast({
            title: "Location Tracking Error",
            description: "Unable to track your location continuously",
            variant: "destructive",
          });
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 10000,
          maximumAge: 30000,
        }
      );

      setWatchId(id);
      setIsSharing(true);
      
      toast({
        title: "Live Location Started",
        description: "Your location is now being shared in real-time. You can stop anytime.",
      });

    } catch (error: any) {
      setError(error.message || "Unable to start location sharing");
      toast({
        title: "Location Sharing Failed", 
        description: error.message || "Unable to start location sharing",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const stopLocationSharing = () => {
    stopLiveLocationMutation.mutate();
    toast({
      title: "Location Sharing Stopped",
      description: "Your live location is no longer visible to others",
    });
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getAccuracyColor = (acc: number) => {
    if (acc < 10) return "text-green-600";
    if (acc < 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyProgress = (acc: number) => {
    if (acc < 10) return 90;
    if (acc < 50) return 60;
    if (acc < 100) return 30;
    return 10;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Navigation className="h-5 w-5 text-primary" />
            Live Location Share
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isSharing ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <MapPin className="h-4 w-4 text-gray-400" />
            )}
            <span className="text-sm font-medium">
              {isSharing ? "Live Location Active" : "Live Location Inactive"}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge variant={isSharing ? "default" : "secondary"}>
              {isSharing ? "Active" : "Inactive"}
            </Badge>
            {isSharing && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                Set
              </Badge>
            )}
          </div>
        </div>

        {/* Accuracy Settings */}
        <div className="flex items-center justify-between">
          <Label htmlFor="high-accuracy" className="text-sm">
            High Accuracy Mode
          </Label>
          <Switch
            id="high-accuracy"
            checked={highAccuracy}
            onCheckedChange={setHighAccuracy}
            disabled={isSharing}
          />
        </div>

        {/* Current Location Info */}
        {currentLocation && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">GPS Accuracy</span>
              <span className={getAccuracyColor(accuracy)}>
                {accuracy.toFixed(0)}m
              </span>
            </div>
            <Progress 
              value={getAccuracyProgress(accuracy)} 
              className="h-2"
            />
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Coordinates:</span>
              <span>
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </span>
            </div>

            {lastUpdate && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Last Update:</span>
                <span>{lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        )}

        {/* Sharing Status */}
        {isSharing && (
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Visible to nearby users
              </span>
            </div>
            {isUpdating && (
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
            )}
          </div>
        )}

        {/* Error Display with Help */}
        {error && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium mb-2">{error}</p>
                <div className="text-xs text-red-700 space-y-1">
                  <p className="font-medium">To enable location access:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Click the location icon in your browser's address bar</li>
                    <li>Select "Allow" for location permission</li>
                    <li>If blocked, go to browser Settings → Privacy → Location</li>
                    <li>Make sure location services are enabled on your device</li>
                  </ul>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    startLocationSharing();
                  }}
                  className="mt-3 text-red-700 border-red-300 hover:bg-red-100"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Sharing Mode Selection */}
        {!isSharing && (
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Choose Location Sharing:</div>
            <div className="grid grid-cols-1 gap-2">
              <Button 
                onClick={() => {
                  setIsOneTimeShare(true);
                  startLocationSharing();
                }}
                disabled={updateLiveLocationMutation.isPending}
                variant="outline"
                className="text-sm"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Pin Location (Like Maps)
              </Button>
              <Button 
                onClick={() => {
                  setIsOneTimeShare(false);
                  startLocationSharing();
                }}
                disabled={updateLiveLocationMutation.isPending}
                className="text-sm"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Live Tracking
              </Button>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded space-y-1">
              <p>• <strong>Pin Location:</strong> Sets fixed location pin where you are standing</p>
              <p>• <strong>Live Tracking:</strong> Continuously updates your location as you move</p>
            </div>
          </div>
        )}

        {/* Action Buttons for Active Sharing */}
        {isSharing && (
          <div className="space-y-2">
            <Button 
              onClick={stopLocationSharing}
              variant="destructive"
              className="w-full"
              disabled={stopLiveLocationMutation.isPending}
            >
              {stopLiveLocationMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Stop {isOneTimeShare ? 'Location Pin' : 'Live Tracking'}
                </>
              )}
            </Button>
            
            {isOneTimeShare && (
              <div className="text-xs text-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                📍 Your location is pinned at this exact spot
              </div>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium mb-1">Privacy Note:</p>
            <p>Only verified teachers and students in your area can see your live location. You can stop sharing anytime.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}