import { useQuery } from "@tanstack/react-query";
import { NearbyUsersMap } from "@/components/nearby-users-map";
import { SimpleLocationSetter } from "@/components/simple-location-setter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users } from "lucide-react";
import { useLocation } from "wouter";

export default function NearbyMapPage() {
  const [, setLocation] = useLocation();

  const { data: user } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const userData = (user as any)?.user || user;







  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation("/settings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">Set Location & Find Nearby Users</h1>
        </div>
      </div>

      {/* Simple Location Setting */}
      <div className="p-4">
        <div className="mb-4">
          <SimpleLocationSetter />
        </div>

        {/* Nearby Users Map */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Nearby {userData?.userType === 'student' ? 'Teachers' : 'Students'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NearbyUsersMap />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}