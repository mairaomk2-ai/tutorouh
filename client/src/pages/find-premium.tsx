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
  Search, Filter, MapPin, Star, Users, MessageCircle,
  Phone, Video, Heart, Eye, Navigation, Shield,
  Clock, Award, TrendingUp, BookOpen, GraduationCap,
  CheckCircle, X, Plus
} from "lucide-react";
import { VerifiedBadge } from "@/components/verified-badge";
import { NearbyUsers } from "@/components/nearby-users";

interface ProfileCard {
  id: string;
  name: string;
  profileImage?: string;
  isVerified?: boolean;
  userType: string;
  subjects?: string[];
  class?: string;
  qualification?: string;
  experience?: number;
  rating?: number;
  reviewCount?: number;
  city?: string;
  state?: string;
  distance?: number;
  monthlyFee?: number;
  budgetMin?: number;
  budgetMax?: number;
  schoolName?: string;
  preferredSubjects?: string[];
  isOnline?: boolean;
  responseTime?: string;
  bio?: string;
  successRate?: number;
  latitude?: string | number;
  longitude?: string | number;
}

export default function FindPremium() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isStudent = user?.userType === 'student';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [sortBy, setSortBy] = useState("distance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50); // Fixed 50km for nearest
  const [activeTab, setActiveTab] = useState<"nearest" | "all">("nearest");

  // Use different queries based on active tab - only one at a time
  const { data: nearbyProfiles = [], isLoading: nearbyLoading } = useQuery<ProfileCard[]>({
    queryKey: ['/api/nearby-users', 50], // Fixed 50km radius
    enabled: activeTab === "nearest" && !!user,
  });

  const { data: allProfiles = [], isLoading: allLoading, error } = useQuery<ProfileCard[]>({
    queryKey: [`/api/search/${isStudent ? 'teachers' : 'students'}`, searchQuery, locationFilter, subjectFilter, verificationFilter, priceRange, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (locationFilter) params.set('location', locationFilter);
      if (subjectFilter && subjectFilter !== 'all') params.set('subjects', subjectFilter);
      if (verificationFilter && verificationFilter !== 'all') params.set('verified', verificationFilter === 'verified' ? 'true' : 'false');
      
      const url = `/api/search/${isStudent ? 'teachers' : 'students'}?${params.toString()}`;
      console.log('Fetching profiles from:', url);
      
      const response = await apiRequest('GET', url);
      const data = await response.json();
      console.log('Profiles response:', data);
      return data;
    },
    enabled: activeTab === "all" && !!user, // Only enable when "all" tab is active
  });

  const profiles: ProfileCard[] = activeTab === "nearest" ? (nearbyProfiles || []) : (allProfiles || []);
  const isLoading = activeTab === "nearest" ? nearbyLoading : allLoading;
  
  // Only show loading when data is being fetched and no cached data exists
  const showLoading = isLoading && profiles.length === 0;

  // Check if user is nearby to allow direct messaging
  const isUserNearby = (profile: ProfileCard) => {
    return profile.distance && profile.distance <= searchRadius;
  };

  // Send request mutation for non-nearby users
  const connectMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest("POST", "/api/user/request", {
        receiverId: profileId,
        message: `Hi! I found your profile and would like to connect. I'm a ${user?.userType} looking for a ${isStudent ? 'teacher' : 'student'}.`
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Sent!",
        description: "Your connection request has been sent. You can message once they accept.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/search/${isStudent ? 'teachers' : 'students'}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/requests/sent"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send connection request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Like profile mutation
  const likeMutation = useMutation({
    mutationFn: async (profileId: string) => {
      return apiRequest("POST", `/api/profile/${profileId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/search/${isStudent ? 'teachers' : 'students'}`] });
    },
  });

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setSubjectFilter("");
    setVerificationFilter("");
    setPriceRange("");
    setSortBy("relevance");
  };

  const handleDirections = (profile: ProfileCard) => {
    if (!profile.city) {
      toast({
        title: "Location not available",
        description: "This user hasn't provided their location.",
        variant: "destructive",
      });
      return;
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const mapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${profile.city}`;
          window.open(mapsUrl, '_blank');
        },
        () => {
          toast({
            title: "Location access denied",
            description: "Please enable location permissions to get directions.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleGetDirections = async (profile: ProfileCard) => {
    console.log("Direction requested for profile:", profile);
    console.log("Profile location data:", {
      latitude: profile.latitude,
      longitude: profile.longitude,
      city: profile.city,
      name: profile.name
    });

    // Check if profile has real GPS coordinates
    if (!profile.latitude || !profile.longitude) {
      toast({
        title: "Location Not Available", 
        description: `${profile.name} hasn't provided precise GPS location. Please ask them to update their location.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { openDirections } = await import("@/lib/location-utils");
      
      // Get current location with high accuracy first
      const { getCurrentLocationEnhanced } = await import("@/lib/location-utils");
      
      toast({
        title: "Getting Your Location",
        description: "Getting your precise location for accurate directions...",
      });

      const userLocation = await getCurrentLocationEnhanced({
        enableHighAccuracy: true,
        showAccuracyWarning: true,
        timeout: 15000,
      });

      console.log("User location:", userLocation);
      console.log("Target location:", profile.latitude, profile.longitude);

      // Calculate distance using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(profile.latitude.toString()),
        parseFloat(profile.longitude.toString())
      );

      console.log("Calculated distance:", distance);

      // Open directions using real GPS coordinates
      await openDirections(profile.latitude, profile.longitude);

      toast({
        title: "Directions Opened",
        description: `Distance to ${profile.name}: ${distance.toFixed(1)} km away`,
      });

    } catch (error: any) {
      console.error("Direction error:", error);
      toast({
        title: "Direction Error",
        description: error.message || "Failed to get directions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ProfileCardComponent = ({ profile }: { profile: ProfileCard }) => (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Header with Name and Rating */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile.profileImage} />
              <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                {profile.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{profile.name}</h3>
              {profile.rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-gray-600">{profile.rating}</span>
                </div>
              )}
            </div>
          </div>
          {profile.isVerified && <VerifiedBadge isVerified={true} size="sm" />}
        </div>

        {/* Location */}
        <div className="flex items-center space-x-1 mb-3">
          <MapPin className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-600">{profile.city || "Location not set"}</span>
        </div>

        {/* Subjects Display for Teachers */}
        {profile.userType === "teacher" && profile.subjects && profile.subjects.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {profile.subjects.slice(0, 3).map((subject: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                  {subject}
                </Badge>
              ))}
              {profile.subjects.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1">
                  +{profile.subjects.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Class Display for Students */}
        {profile.userType === "student" && profile.class && (
          <div className="mb-3">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {profile.class}
            </Badge>
          </div>
        )}

        {/* Fee Display for Teachers */}
        {profile.userType === "teacher" && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900">
              ₹{profile.monthlyFee || 5000}/month
            </div>
          </div>
        )}

        {/* Budget Display for Students */}
        {profile.userType === "student" && profile.budgetMin && profile.budgetMax && (
          <div className="mb-4">
            <div className="text-sm font-semibold text-gray-900">
              Budget: ₹{profile.budgetMin}-₹{profile.budgetMax}/month
            </div>
          </div>
        )}

        {/* Distance Display - Only for nearest tab */}
        {activeTab === "nearest" && (
          <div className="mb-2 text-center">
            {profile.distance !== undefined && (
              <div className="text-xs text-gray-500 mb-1">
                {profile.distance < 1 
                  ? `${Math.round(profile.distance * 1000)}m away`
                  : `${profile.distance.toFixed(1)}km away`
                }
              </div>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-2">
          {activeTab === "nearest" ? (
            <>
              <a
                href={`/messages/${profile.id}`}
                className="w-full"
              >
                <Button
                  size="sm"
                  className="w-full bg-green-500 hover:bg-green-600 text-sm py-2"
                >
                  <MessageCircle className="w-3 h-3 mr-2" />
                  Message
                </Button>
              </a>
              <Button
                size="sm"
                onClick={() => handleGetDirections(profile)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-sm py-2"
                data-testid="button-view-direction"
              >
                <Navigation className="w-3 h-3 mr-2" />
                View Direction
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => connectMutation.mutate(profile.id)}
              disabled={connectMutation.isPending}
              className="w-full bg-blue-500 hover:bg-blue-600 text-sm py-2"
            >
              <MessageCircle className="w-3 h-3 mr-2" />
              Send Request
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

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
                Find {isStudent ? 'Teachers' : 'Students'}
              </h1>
              <p className="text-gray-600">
                Discover perfect {isStudent ? 'tutors' : 'students'} for your needs
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  List
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">


        {/* Tab Navigation for Nearest vs All */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Find {isStudent ? 'Teachers' : 'Students'}
                </h2>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("nearest")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "nearest"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <MapPin className="w-4 h-4 inline mr-2" />
                Nearest (50km)
              </button>
              <button
                onClick={() => setActiveTab("all")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                All {isStudent ? 'Teachers' : 'Students'}
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mt-3">
              {activeTab === "nearest" 
                ? `Find nearby ${isStudent ? 'tutors' : 'students'} within 50km radius` 
                : `Browse all ${isStudent ? 'tutors' : 'students'} and send connection requests`
              }
            </p>
          </div>
        </div>

        {/* Search interface - only show filters for "all" tab */}
        <div className={`grid gap-6 ${activeTab === "all" ? 'lg:grid-cols-4' : 'lg:grid-cols-1'}`}>
          {/* Filters Sidebar - Only for "all" tab */}
          {activeTab === "all" && (
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="sticky top-28 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-blue-600" />
                    Filters
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Show radius info for nearest tab only */}
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Location Based Search</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Showing users within 50km of your location
                  </p>
                </div>
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium mb-2">Search</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                    <Input
                      placeholder={`Search ${isStudent ? 'teachers' : 'students'}...`}
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

                {/* Subject/Class Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {isStudent ? 'Subject' : 'Class'}
                  </label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger className="border-0 bg-gray-100 focus:bg-white">
                      <SelectValue placeholder={`Select ${isStudent ? 'subject' : 'class'}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {isStudent ? 'Subjects' : 'Classes'}</SelectItem>
                      {isStudent ? (
                        <>
                          <SelectItem value="mathematics">Mathematics</SelectItem>
                          <SelectItem value="physics">Physics</SelectItem>
                          <SelectItem value="chemistry">Chemistry</SelectItem>
                          <SelectItem value="biology">Biology</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="class-1">Class 1</SelectItem>
                          <SelectItem value="class-2">Class 2</SelectItem>
                          <SelectItem value="class-3">Class 3</SelectItem>
                          <SelectItem value="class-4">Class 4</SelectItem>
                          <SelectItem value="class-5">Class 5</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verification */}
                <div>
                  <label className="block text-sm font-medium mb-2">Verification</label>
                  <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                    <SelectTrigger className="border-0 bg-gray-100 focus:bg-white">
                      <SelectValue placeholder="All users" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium mb-2">Price Range</label>
                  <Select value={priceRange} onValueChange={setPriceRange}>
                    <SelectTrigger className="border-0 bg-gray-100 focus:bg-white">
                      <SelectValue placeholder="Any price" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Price</SelectItem>
                      <SelectItem value="0-500">₹0 - ₹500</SelectItem>
                      <SelectItem value="500-1000">₹500 - ₹1000</SelectItem>
                      <SelectItem value="1000-2000">₹1000 - ₹2000</SelectItem>
                      <SelectItem value="2000+">₹2000+</SelectItem>
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
                      <SelectItem value="distance">Nearest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="experience">Most Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            </div>
          )}

          {/* Results */}
          <div className={activeTab === "all" ? "lg:col-span-3" : "lg:col-span-1"}>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Found {profiles.length} {isStudent ? 'teacher' : 'student'}{profiles.length !== 1 ? 's' : ''}
                {activeTab === "nearest" && " within 50km"}
                {error && <span className="text-red-500 ml-2">(Error loading)</span>}
              </p>
              {activeTab === "all" && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="distance">Nearest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="experience">Most Experienced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Results Grid */}
            {profiles.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No {isStudent ? 'teachers' : 'students'} found
                    {activeTab === "nearest" && " nearby"}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === "nearest" 
                      ? `Try enabling location sharing or switch to "All ${isStudent ? 'Teachers' : 'Students'}" tab to find more options.`
                      : `Try adjusting your search criteria to find more ${isStudent ? 'tutors' : 'students'}.`
                    }
                  </p>
                  <Button onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className={viewMode === "grid" ? "grid md:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}>
                {profiles.map((profile: ProfileCard) => (
                  <ProfileCardComponent key={profile.id} profile={profile} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}