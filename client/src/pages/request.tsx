import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, X, User, MessageCircle, Navigation } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Request() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch received requests
  const { data: receivedRequests = [], isLoading: receivedLoading } = useQuery<any[]>({
    queryKey: ['/api/user/requests/received'],
    enabled: !!user,
  });

  // Fetch sent requests
  const { data: sentRequests = [], isLoading: sentLoading } = useQuery<any[]>({
    queryKey: ['/api/user/requests/sent'],
    enabled: !!user,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string, status: string }) => {
      return apiRequest('PATCH', `/api/user/request/${requestId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/requests/received'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/requests/sent'] });
      toast({
        title: "Request Updated",
        description: "The request has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const handleAcceptRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: 'accepted' });
  };

  const handleRejectRequest = (requestId: string) => {
    updateRequestMutation.mutate({ requestId, status: 'rejected' });
  };

  const handleDirection = async (latitude?: string, longitude?: string) => {
    if (!latitude || !longitude) {
      toast({
        title: "Location Not Available",
        description: "This user has not provided their location.",
        variant: "destructive",
      });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: userLat, longitude: userLng } = position.coords;
          const mapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${latitude},${longitude}`;
          window.open(mapsUrl, '_blank');
        },
        () => {
          toast({
            title: "Location Error",
            description: "Please enable location permissions to get directions.",
            variant: "destructive",
          });
        }
      );
    }
  };

  if (receivedLoading || sentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tutoro-light pb-20">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 pt-4 md:pt-2">
        {/* Header */}
        <div className="mb-4 sm:mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Requests</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your connection requests and responses
          </p>
        </div>

        <Tabs defaultValue="received" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-2">
            <TabsTrigger value="received" className="text-xs sm:text-sm">
              Received ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-xs sm:text-sm">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No requests received
                  </h3>
                  <p className="text-gray-600">
                    When someone sends you a connection request, it will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              receivedRequests.map((request: any) => (
                <Card key={request.id} className="premium-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="relative flex justify-center sm:justify-start">
                        {request.senderImage ? (
                          <img
                            src={request.senderImage}
                            alt={request.senderName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <h3 className="text-lg font-semibold text-center sm:text-left truncate">{request.senderName}</h3>
                          <Badge 
                            className="self-center sm:self-auto shrink-0"
                            variant={
                              request.status === 'pending' ? 'default' :
                              request.status === 'accepted' ? 'secondary' : 'destructive'
                            }
                          >
                            {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {request.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {request.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        {request.message && (
                          <p className="text-gray-600 mb-4 text-center sm:text-left">{request.message}</p>
                        )}

                        <p className="text-sm text-gray-500 mb-4 text-center sm:text-left">
                          Received {new Date(request.createdAt).toLocaleDateString()}
                        </p>

                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <Button
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleAcceptRequest(request.id)}
                              disabled={updateRequestMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Accept
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleRejectRequest(request.id)}
                              disabled={updateRequestMutation.isPending}
                            >
                              <X className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto"
                              onClick={() => handleDirection(request.senderLatitude, request.senderLongitude)}
                            >
                              <Navigation className="w-4 h-4 mr-2" />
                              Direction
                            </Button>
                          </div>
                        )}

                        {request.status === 'accepted' && (
                          <Button size="sm" className="w-full sm:w-auto" asChild>
                            <a href={`/messages`}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Start Chatting
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No requests sent
                  </h3>
                  <p className="text-gray-600">
                    Send connection requests to teachers or students from the Find page.
                  </p>
                </CardContent>
              </Card>
            ) : (
              sentRequests.map((request: any) => (
                <Card key={request.id} className="premium-card">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="relative flex justify-center sm:justify-start">
                        {request.receiverImage ? (
                          <img
                            src={request.receiverImage}
                            alt={request.receiverName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                          <h3 className="text-lg font-semibold text-center sm:text-left truncate">{request.receiverName}</h3>
                          <Badge 
                            className="self-center sm:self-auto shrink-0"
                            variant={
                              request.status === 'pending' ? 'default' :
                              request.status === 'accepted' ? 'secondary' : 'destructive'
                            }
                          >
                            {request.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                            {request.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {request.status === 'rejected' && <X className="w-3 h-3 mr-1" />}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                        </div>

                        {request.message && (
                          <p className="text-gray-600 mb-4 text-center sm:text-left">{request.message}</p>
                        )}

                        <p className="text-sm text-gray-500 mb-4 text-center sm:text-left">
                          Sent {new Date(request.createdAt).toLocaleDateString()}
                        </p>

                        {request.status === 'accepted' && (
                          <Button size="sm" className="w-full sm:w-auto" asChild>
                            <a href={`/messages`}>
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Start Chatting
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}