import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MapPin, Navigation, Users, MessageCircle, 
  UserPlus, Clock, Target, Loader2,
  Navigation2, RefreshCw
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { VerifiedBadge } from "@/components/verified-badge";
import { Link } from "wouter";

interface NearbyUser {
  id: string;
  firstName: string;
  lastName: string;
  userType: "student" | "teacher";
  profileImage?: string;
  latitude: string;
  longitude: string;
  fullAddress?: string;
  city?: string;
  state?: string;
  distance: number;
  liveLocationUpdatedAt: string;
  isLocationVerified: boolean;
}

export function NearbyUsers() {
  const { user } = useAuth();
  const [radius, setRadius] = useState(10); // km
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isStudent = user?.userType === 'student';
  const targetUserType = isStudent ? 'teacher' : 'student';

  // Fetch nearby live users with radius parameter
  const { data: nearbyUsers = [], isLoading, refetch } = useQuery<NearbyUser[]>({
    queryKey: ["/api/nearby/live-users", radius],
    enabled: !!user?.id,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getDistanceColor = (distance: number) => {
    if (distance < 1) return "text-green-600";
    if (distance < 5) return "text-yellow-600";
    return "text-orange-600";
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nearby {targetUserType === 'teacher' ? 'Teachers' : 'Students'} Live
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Search Radius:</span>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="text-sm border rounded px-2 py-1"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {targetUserType}s who are actively sharing their location within {radius}km of you.
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-gray-600">Finding nearby users...</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && Array.isArray(nearbyUsers) && nearbyUsers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Nearby {targetUserType === 'teacher' ? 'Teachers' : 'Students'} Found
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              There are currently no {targetUserType}s sharing their live location within {radius}km of you.
            </p>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Try:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Increasing your search radius</li>
                <li>• Checking back later</li>
                <li>• Sharing your location to attract nearby users</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Users List */}
      <div className="space-y-3">
        {Array.isArray(nearbyUsers) && nearbyUsers.map((nearbyUser: NearbyUser) => (
          <Card key={nearbyUser.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={nearbyUser.profileImage} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {nearbyUser.firstName.charAt(0)}{nearbyUser.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {nearbyUser.firstName} {nearbyUser.lastName}
                    </h4>
                    <VerifiedBadge isVerified={nearbyUser.isLocationVerified} size="sm" />
                    <Badge variant={nearbyUser.userType === 'teacher' ? 'default' : 'secondary'}>
                      {nearbyUser.userType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span className={getDistanceColor(nearbyUser.distance)}>
                        {formatDistance(nearbyUser.distance)} away
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeAgo(nearbyUser.liveLocationUpdatedAt)}</span>
                    </div>
                  </div>

                  {nearbyUser.city && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {nearbyUser.city}{nearbyUser.state && `, ${nearbyUser.state}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Direct Message Button Only */}
                <div className="flex flex-col gap-2">
                  <Link href={`/messages/${nearbyUser.id}`}>
                    <Button size="sm" className="text-xs w-full bg-green-600 hover:bg-green-700 text-white">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      if (nearbyUser.latitude && nearbyUser.longitude) {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${nearbyUser.latitude},${nearbyUser.longitude}`;
                        window.open(url, '_blank');
                      }
                    }}
                  >
                    <Navigation2 className="h-3 w-3 mr-1" />
                    Directions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}