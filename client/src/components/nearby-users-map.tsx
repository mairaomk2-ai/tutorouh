import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, Users, MessageCircle, Navigation, Crown,
  Clock, BookOpen, Star, Zap, CheckCircle
} from "lucide-react";
import { VerifiedBadge } from "./verified-badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function NearbyUsersMap() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRadius, setSelectedRadius] = useState(5);

  // Get nearby users based on current user type
  const { data: nearbyUsers = [], isLoading } = useQuery({
    queryKey: ["/api/nearby/users", user?.userType, selectedRadius],
    queryFn: () => 
      fetch(`/api/nearby/users?userType=${user?.userType === 'student' ? 'teacher' : 'student'}&radius=${selectedRadius}`)
        .then(res => res.json()),
    enabled: !!user?.id,
  });

  // Send connection request
  const sendRequestMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      return apiRequest("POST", "/api/user/send-request", { teacherId });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "Your connection request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/requests"] });
    },
    onError: () => {
      toast({
        title: "Failed to Send Request",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Start conversation
  const startConversationMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", "/api/conversations", { 
        participants: [user?.id, userId] 
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Conversation Started",
        description: "You can now chat with this user.",
      });
      // Navigate to messages or conversation
      window.location.href = `/messages/${data.conversationId}`;
    },
    onError: () => {
      toast({
        title: "Failed to Start Conversation",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = (targetUserId: string) => {
    // Always send requests for nearby users, regardless of user type
    sendRequestMutation.mutate(targetUserId);
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 1) return "text-green-600";
    if (distance < 3) return "text-yellow-600";
    return "text-gray-600";
  };

  const radiusOptions = [1, 3, 5, 10, 25];

  return (
    <div className="space-y-4">
      {/* Header with Radius Selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Nearby {user?.userType === 'student' ? 'Teachers' : 'Students'}
            </CardTitle>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {nearbyUsers.length}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Search Radius:</span>
            <div className="flex gap-1">
              {radiusOptions.map((radius) => (
                <Button
                  key={radius}
                  variant={selectedRadius === radius ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedRadius(radius)}
                  className="text-xs"
                >
                  {radius}km
                </Button>
              ))}
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
            📍 Showing verified {user?.userType === 'student' ? 'teachers' : 'students'} within {selectedRadius}km of your location
          </div>
        </CardContent>
      </Card>

      {/* Map-like View of Users */}
      <div className="grid grid-cols-1 gap-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-gray-600">Finding nearby users...</p>
            </CardContent>
          </Card>
        ) : nearbyUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center space-y-3">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto" />
              <div>
                <p className="font-medium text-gray-700">No {user?.userType === 'student' ? 'teachers' : 'students'} nearby</p>
                <p className="text-sm text-gray-500">Try increasing the search radius</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          nearbyUsers.map((nearbyUser: any) => (
            <Card key={nearbyUser.id} className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* User Avatar with Verification */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                      <AvatarImage src={nearbyUser.profileImage} alt={nearbyUser.firstName} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
                        {nearbyUser.firstName?.charAt(0)}{nearbyUser.lastName?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1">
                      <VerifiedBadge isVerified={Boolean(nearbyUser.isLocationVerified)} size="sm" />
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {nearbyUser.firstName} {nearbyUser.lastName}
                      </h3>
                      {nearbyUser.isLocationVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      )}
                      {nearbyUser.isPremium && (
                        <Crown className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>

                    {/* User Type & Experience */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {nearbyUser.userType}
                      </Badge>
                      {nearbyUser.experience && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {nearbyUser.experience}
                        </Badge>
                      )}
                    </div>

                    {/* Subjects/Interests */}
                    {nearbyUser.subjects && nearbyUser.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {nearbyUser.subjects.slice(0, 3).map((subject: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <BookOpen className="h-3 w-3 mr-1" />
                            {subject}
                          </Badge>
                        ))}
                        {nearbyUser.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{nearbyUser.subjects.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Location Details with Full Address */}
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-1 text-sm">
                        <Navigation className={`h-3 w-3 ${getDistanceColor(nearbyUser.distance)}`} />
                        <span className={`font-medium ${getDistanceColor(nearbyUser.distance)}`}>
                          {nearbyUser.distance?.toFixed(1)}km away
                        </span>
                      </div>
                      
                      {/* Full Address Display */}
                      <div className="bg-gray-50 p-2 rounded text-xs">
                        <div className="flex items-start gap-1">
                          <MapPin className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            {nearbyUser.fullAddress ? (
                              <div>
                                <div className="font-medium text-gray-800">
                                  {nearbyUser.currentLocation?.city || nearbyUser.city}, {nearbyUser.currentLocation?.state || nearbyUser.state}
                                </div>
                                <div className="text-gray-600 text-xs leading-relaxed">
                                  {nearbyUser.fullAddress}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium text-gray-800">
                                  {nearbyUser.currentLocation?.city || nearbyUser.city}, {nearbyUser.currentLocation?.state || nearbyUser.state}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  Lat: {parseFloat(nearbyUser.latitude).toFixed(4)}, Lng: {parseFloat(nearbyUser.longitude).toFixed(4)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {nearbyUser.lastLocationUpdate && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last seen: {new Date(nearbyUser.lastLocationUpdate).toLocaleTimeString()}
                        </div>
                      )}
                    </div>

                    {/* Rating if available */}
                    {nearbyUser.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{nearbyUser.rating}</span>
                        <span className="text-xs text-gray-500">({nearbyUser.reviewCount} reviews)</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSendRequest(nearbyUser.id)}
                      disabled={sendRequestMutation.isPending || startConversationMutation.isPending}
                      className="text-xs"
                    >
                      {sendRequestMutation.isPending ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      ) : (
                        <MessageCircle className="h-3 w-3 mr-1" />
                      )}
                      Send Request
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Live Update Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full text-xs text-green-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live updating every 30 seconds
        </div>
      </div>
    </div>
  );
}