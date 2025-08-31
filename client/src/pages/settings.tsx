import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Settings as SettingsIcon, MapPin, Navigation, User, Shield, 
  Clock, Target, CheckCircle, XCircle, Users 
} from "lucide-react";
import { LocationPrompt } from "@/components/location-prompt";
import { LiveLocationShare } from "@/components/live-location-share";
import { LocationPinSetter } from "@/components/location-pin-setter";


export default function Settings() {
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const [showLocationPin, setShowLocationPin] = useState(false);


  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const userData = (user as any)?.user || user;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Location Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Verification Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              {userData?.isLocationVerified ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="font-medium">Location Verification</span>
            </div>
            <Badge variant={userData?.isLocationVerified ? "default" : "secondary"}>
              {userData?.isLocationVerified ? "Verified" : "Not Verified"}
            </Badge>
          </div>

          {/* Current Location Details */}
          {userData?.isLocationVerified && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700">Current Location</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium">{userData.city || 'Not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">State:</span>
                  <span className="font-medium">{userData.state || 'Not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">PIN Code:</span>
                  <span className="font-medium">{userData.pinCode || 'Not set'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium text-right max-w-40 truncate">
                    {userData.fullAddress || 'Not set'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Coordinates:</span>
                  <span>
                    {userData.latitude && userData.longitude 
                      ? `${parseFloat(userData.latitude).toFixed(6)}, ${parseFloat(userData.longitude).toFixed(6)}`
                      : 'Not available'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Map Visibility Status */}
          <Separator />
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Map Visibility</span>
            </div>
            <div className="flex gap-2">
              <Badge variant={userData?.isLocationVerified ? "default" : "secondary"}>
                {userData?.isLocationVerified ? "Visible on Map" : "Not Set"}
              </Badge>
              {userData?.isLocationVerified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  Set
                </Badge>
              )}
            </div>
          </div>

          {/* Main Action Button */}
          <div className="pt-4">
            <Button 
              onClick={() => setShowLocationPin(true)}
              className="w-full h-14 text-base"
              size="lg"
              variant={userData?.isLocationVerified ? "outline" : "default"}
            >
              <MapPin className="h-5 w-5 mr-2" />
              {userData?.isLocationVerified ? "Update Location" : "Set My Location"}
            </Button>
            
            <div className="text-xs text-center text-gray-500 mt-2 bg-blue-50 p-2 rounded">
              One-time location setting with complete address details
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">
                {userData?.firstName} {userData?.lastName}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{userData?.email}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">User Type:</span>
              <Badge variant="secondary" className="capitalize">
                {userData?.userType}
              </Badge>
            </div>
            
            {userData?.mobile && (
              <div className="flex justify-between">
                <span className="text-gray-600">Mobile:</span>
                <span className="font-medium">{userData.mobile}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <div className="font-medium">Location Privacy</div>
                <div className="text-xs text-gray-600 mt-1">
                  Only verified users in your area can see your live location
                </div>
              </div>
              <Badge variant="secondary">Protected</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium">Profile Visibility</div>
                <div className="text-xs text-gray-600 mt-1">
                  Your profile is visible to verified users only
                </div>
              </div>
              <Badge variant="secondary">Secure</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Prompt Dialog */}
      {showLocationPrompt && (
        <LocationPrompt 
          isOpen={showLocationPrompt} 
          onClose={() => setShowLocationPrompt(false)} 
        />
      )}

      {/* Live Location Dialog */}
      {showLiveLocation && (
        <LiveLocationShare onClose={() => setShowLiveLocation(false)} />
      )}

      {/* Location Pin Setter Dialog */}
      {showLocationPin && (
        <LocationPinSetter 
          onClose={() => setShowLocationPin(false)}
          currentLocation={userData}
        />
      )}


    </div>
  );
}