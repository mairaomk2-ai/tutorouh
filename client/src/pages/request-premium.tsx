import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Check, X, Clock, MessageCircle, MapPin, Star,
  Phone, Video, Navigation, Eye, Heart, Users,
  Send, ArrowRight, Filter, Search, Calendar,
  CheckCircle, XCircle, AlertCircle, Loader2
} from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";

interface ConnectionRequest {
  id: string;
  fromUser?: {
    id: string;
    name: string;
    profileImage?: string;
    userType: string;
    isVerified?: boolean;
    city?: string;
    rating?: number;
    qualification?: string;
    class?: string;
    subjects?: string[];
  };
  toUser?: {
    id: string;
    name: string;
    profileImage?: string;
    userType: string;
    isVerified?: boolean;
    city?: string;
    rating?: number;
    qualification?: string;
    class?: string;
    subjects?: string[];
  };
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export default function RequestPremium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("received");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch received requests
  const { data: receivedRequests = [], isLoading: receivedLoading, error: receivedError } = useQuery<ConnectionRequest[]>({
    queryKey: ['/api/user/requests/received'],
    enabled: !!user,
  });

  // Fetch sent requests
  const { data: sentRequests = [], isLoading: sentLoading, error: sentError } = useQuery<ConnectionRequest[]>({
    queryKey: ['/api/user/requests/sent'],
    enabled: !!user,
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string, status: string }) => {
      return apiRequest('PATCH', `/api/user/request/${requestId}`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/requests/received'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/requests/sent'] });
      toast({
        title: status === 'accepted' ? "Request Accepted!" : "Request Rejected",
        description: status === 'accepted' 
          ? "You can now start messaging with this user."
          : "The request has been declined.",
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



  const handleDirection = async (latitude?: string, longitude?: string, city?: string) => {
    if (!city && (!latitude || !longitude)) {
      toast({
        title: "Location Not Available",
        description: "This user hasn't provided their location.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { openDirections } = await import("@/lib/location-utils");
      await openDirections(
        latitude, 
        longitude, 
        city,
        {
          enableHighAccuracy: true,
          showAccuracyWarning: true,
          timeout: 20000,
          maximumAge: 300000,
        }
      );
    } catch (error: any) {
      // Error handling is already done in the utility function
      console.error("Direction error:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const RequestCard = ({ request, type }: { request: ConnectionRequest, type: 'received' | 'sent' }) => {
    const otherUser = type === 'received' ? request.fromUser : request.toUser;
    if (!otherUser) return null;

    const isStudent = user?.userType === 'student';
    const isPending = request.status === 'pending';

    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={otherUser.profileImage} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                    {otherUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1">
                  {getStatusIcon(request.status)}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-lg">{otherUser.name}</h3>
                  {otherUser.isVerified && <VerifiedBadge isVerified={true} size="sm" />}
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {isStudent ? otherUser.qualification : otherUser.class}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  {otherUser.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{otherUser.rating}</span>
                    </div>
                  )}
                  {otherUser.city && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{otherUser.city}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeAgo(request.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects/Skills */}
          {otherUser.subjects && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {otherUser.subjects.slice(0, 3).map((subject, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                    {subject}
                  </Badge>
                ))}
                {otherUser.subjects.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{otherUser.subjects.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          {request.message && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 italic">"{request.message}"</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2">
              {type === 'received' && isPending ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                    disabled={updateRequestMutation.isPending}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {updateRequestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id)}
                    disabled={updateRequestMutation.isPending}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {updateRequestMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Accept
                  </Button>
                </>
              ) : request.status === 'accepted' ? (
                <a href={`/messages/${otherUser.id}`}>
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </a>
              ) : request.status === 'rejected' ? (
                <span className="text-sm text-red-600 font-medium">Request Declined</span>
              ) : (
                <span className="text-sm text-yellow-600 font-medium">Waiting for Response</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: 'received' | 'sent' }) => (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
      <CardContent className="p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
          {type === 'received' ? (
            <Send className="w-10 h-10 text-gray-400 transform rotate-180" />
          ) : (
            <Send className="w-10 h-10 text-gray-400" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No {type} requests yet
        </h3>
        <p className="text-gray-600 mb-6">
          {type === 'received' 
            ? "When someone wants to connect with you, their requests will appear here."
            : "Requests you send to other users will appear here."
          }
        </p>
        <Button>
          <Search className="w-4 h-4 mr-2" />
          Find {user?.userType === 'student' ? 'Teachers' : 'Students'}
        </Button>
      </CardContent>
    </Card>
  );

  if (receivedLoading || sentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Connection Requests</h1>
              <p className="text-gray-600">Manage your tutor-student connections</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Users className="w-4 h-4 mr-2" />
                Find People
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-blue-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{receivedRequests.length}</div>
              <div className="text-sm text-blue-100">Received</div>
            </CardContent>
          </Card>
          <Card className="bg-green-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{sentRequests.length}</div>
              <div className="text-sm text-green-100">Sent</div>
            </CardContent>
          </Card>
          <Card className="bg-yellow-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {[...receivedRequests, ...sentRequests].filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-yellow-100">Pending</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {[...receivedRequests, ...sentRequests].filter(r => r.status === 'accepted').length}
              </div>
              <div className="text-sm text-purple-100">Connected</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="received" className="flex items-center">
              <Send className="w-4 h-4 mr-2 transform rotate-180" />
              Received ({receivedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center">
              <Send className="w-4 h-4 mr-2" />
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedRequests.length === 0 ? (
              <EmptyState type="received" />
            ) : (
              receivedRequests.map((request) => (
                <RequestCard key={request.id} request={request} type="received" />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length === 0 ? (
              <EmptyState type="sent" />
            ) : (
              sentRequests.map((request) => (
                <RequestCard key={request.id} request={request} type="sent" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}