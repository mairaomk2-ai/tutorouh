import { useAuth } from "@/hooks/useAuth";
import { GetLocationButton } from "@/components/get-location-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  MessageCircle, Users, CheckCircle2
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, profile } = useAuth();
  const isStudent = user?.userType === 'student';

  // Get basic stats for quick overview
  const { data: conversations = [] } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user?.id,
  });

  const { data: receivedRequests = [] } = useQuery({
    queryKey: ['/api/user/requests/received'],
    enabled: !!user?.id,
  });

  // Calculate counts
  const unreadMessageCount = (conversations as any[])?.reduce((total: number, conv: any) => {
    return total + (conv.unreadCount || 0);
  }, 0) || 0;

  const pendingRequestCount = (receivedRequests as any[])?.filter((req: any) => req.status === 'pending')?.length || 0;

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Welcome Message */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            {isStudent 
              ? "Set your location to find qualified teachers nearby" 
              : "Share your location to connect with students in your area"
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto py-6">
        {/* Location Status Card */}
        {(user as any).isLocationVerified && (
          <Card className="mx-4 mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Location Set Successfully</h3>
                  <p className="text-sm text-green-700">
                    {(user as any).city}, {(user as any).state}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Location Getter Component */}
        {!(user as any).isLocationVerified && <GetLocationButton />}

        {/* Quick Stats */}
        <div className="mx-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <Link href="/messages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">
                    {unreadMessageCount}
                  </div>
                  <div className="text-sm text-gray-600">Messages</div>
                  {unreadMessageCount > 0 && (
                    <Badge className="mt-1" variant="destructive">New</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>

            <Link href="/request">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <div className="text-lg font-semibold text-gray-900">
                    {pendingRequestCount}
                  </div>
                  <div className="text-sm text-gray-600">Requests</div>
                  {pendingRequestCount > 0 && (
                    <Badge className="mt-1" variant="destructive">Pending</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Location Status Info */}
        {(user as any).isLocationVerified && (
          <Card className="mx-4">
            <CardHeader>
              <CardTitle className="text-lg">Find Nearby {isStudent ? 'Teachers' : 'Students'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Your location is set and visible to nearby users. You can now:
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Find {isStudent ? 'teachers' : 'students'} near you</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Get accurate distance calculations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Receive connection requests from nearby users</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}