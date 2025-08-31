import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search, Filter, MapPin, Clock, User, BookOpen,
  Star, MessageCircle, Plus, Eye, X, Heart,
  TrendingUp, Users, Award, ChevronDown
} from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import RequirementModal from "@/components/requirement-modal";

export default function RequirementsPremium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const filteredUserType = user?.userType === "student" ? "teacher" : "student";
  
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["/api/requirements", filteredUserType, searchQuery, locationFilter, subjectFilter, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('userType', filteredUserType);
      if (searchQuery) params.append('search', searchQuery);
      if (locationFilter) params.append('location', locationFilter);
      if (subjectFilter) params.append('subjects', subjectFilter);
      if (sortBy) params.append('sort', sortBy);

      const response = await fetch(`/api/requirements?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!user,
  });

  const { data: featuredRequirements } = useQuery({
    queryKey: ["/api/requirements/featured", filteredUserType],
    enabled: !!user,
  });

  const { data: myRequirement, isLoading: isMyRequirementLoading } = useQuery({
    queryKey: ["/api/requirements/my"],
    enabled: !!user,
  });

  const contactMutation = useMutation({
    mutationFn: async (requirementId: string) => {
      return apiRequest("POST", `/api/requirements/${requirementId}/contact`, {});
    },
    onSuccess: () => {
      toast({
        title: "Contact request sent!",
        description: "The user will be notified of your interest.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send contact request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/requirements", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requirements/my"] });
      toast({
        title: "Requirement deleted successfully!",
        description: "Your requirement has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete requirement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setSubjectFilter("");
    setSortBy("recent");
  };

  const handleRequirementPosted = () => {
    setShowRequirementModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
    toast({
      title: "Requirement posted successfully!",
      description: "Your requirement is now visible to other users.",
    });
  };

  if (isLoading) {
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
              <h1 className="text-2xl font-bold text-gray-900">
                Find {filteredUserType === "teacher" ? "Teachers" : "Students"}
              </h1>
              <p className="text-gray-600">
                Discover requirements that match your expertise
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden text-xs px-2 py-1"
                size="sm"
              >
                <Filter className="w-3 h-3 mr-1" />
                Filters
              </Button>
              <Button
                onClick={() => setShowRequirementModal(true)}
                className="premium-button text-xs px-3 py-2"
                size="sm"
              >
                <Plus className="w-3 h-3 mr-1" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* My Requirements Section */}
        {myRequirement && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                My Posted Requirement
              </h2>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteRequirementMutation.mutate()}
                disabled={deleteRequirementMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteRequirementMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Delete My Requirement
              </Button>
            </div>
            
            <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-5">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(myRequirement as any)?.subjects?.map((subject: string, index: number) => (
                      <Badge key={index} variant="secondary" className="bg-white/25 text-white border-white/30 font-medium">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-lg text-white mb-4 leading-relaxed">{(myRequirement as any)?.description}</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                      <MapPin className="w-5 h-5 text-blue-200" />
                      <span className="font-medium">{(myRequirement as any)?.location}</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                      <Clock className="w-5 h-5 text-green-200" />
                      <span className="font-medium">{(myRequirement as any)?.type}</span>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-3">
                      <Star className="w-5 h-5 text-yellow-200" />
                      <span className="font-medium">₹{(myRequirement as any)?.fee || "Negotiable"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-28 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-blue-600" />
                    Filters
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Search requirements..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 border-0 bg-gray-100 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2">Location</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder="Enter location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 border-0 bg-gray-100 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="border-0 bg-gray-100 focus:bg-white">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="mathematics">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="chemistry">Chemistry</SelectItem>
                      <SelectItem value="biology">Biology</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="computer-science">Computer Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="border-0 bg-gray-100 focus:bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="nearby">Nearby</SelectItem>
                      <SelectItem value="budget">Budget (Low to High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Featured Requirements */}
            {featuredRequirements && Array.isArray(featuredRequirements) && featuredRequirements.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Featured Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {(featuredRequirements as any[]).slice(0, 2).map((req: any) => (
                      <div key={req.id} className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                        <h3 className="font-semibold mb-2">{req.title}</h3>
                        <p className="text-sm text-blue-100 mb-3">{req.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {req.subject}
                          </Badge>
                          <Button variant="outline" size="sm" className="text-white border-white hover:bg-white hover:text-blue-600">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4 bg-white/80 backdrop-blur-sm border-0">
                <div className="text-2xl font-bold text-blue-600">{requirements?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Requirements</div>
              </Card>
              <Card className="text-center p-4 bg-white/80 backdrop-blur-sm border-0">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <div className="text-sm text-gray-600">Match Rate</div>
              </Card>
              <Card className="text-center p-4 bg-white/80 backdrop-blur-sm border-0">
                <div className="text-2xl font-bold text-purple-600">24h</div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </Card>
            </div>

            {/* Other Users' Requirements */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center mb-4">
                <BookOpen className="w-6 h-6 mr-2 text-green-600" />
                Available Requirements
              </h2>
            </div>

            {/* Requirements List */}
            <div className="space-y-6">
              {requirements && requirements.length > 0 ? (
                requirements.map((requirement: any) => (
                  <Card key={requirement.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={requirement.user?.profileImage} />
                            <AvatarFallback>
                              {requirement.user?.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <h3 className="font-semibold text-gray-900 text-lg">
                                {requirement.user?.isLocationVerified 
                                  ? `${requirement.user.firstName} ${requirement.user.lastName || ''}`.trim()
                                  : 'Anonymous'
                                }
                              </h3>
                              {requirement.user?.isLocationVerified && (
                                <VerifiedBadge isVerified={true} size="sm" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {filteredUserType === "teacher" ? "Looking for a teacher" : "Student looking for help"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          {requirement.user?.isLocationVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${requirement.user.latitude},${requirement.user.longitude}`, '_blank')}
                              className="text-xs"
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              View Direction
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="font-semibold text-lg mb-2">{requirement.title}</h4>
                        <p className="text-gray-700 mb-3">{requirement.description}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {requirement.subjects?.map((subject: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 mb-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{requirement.location || "Location not specified"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{requirement.type || "Flexible timing"}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Star className="w-4 h-4 text-gray-500" />
                          <span>₹{requirement.fee || "Negotiable"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/messages/${requirement.user.id}?autoMessage=I am interested in your requirement`}
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Direct Message
                          </Button>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                  <CardContent className="p-12 text-center">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No requirements found
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Try adjusting your search filters or check back later for new requirements.
                    </p>
                    <Button onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requirement Modal */}
      <RequirementModal
        isOpen={showRequirementModal}
        onClose={() => {
          setShowRequirementModal(false);
          queryClient.invalidateQueries({ queryKey: ["/api/requirements/my"] });
          queryClient.invalidateQueries({ queryKey: ["/api/requirements"] });
        }}
        userType={user?.userType || 'student'}
      />
    </div>
  );
}