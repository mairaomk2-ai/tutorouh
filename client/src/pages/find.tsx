import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Star, MessageCircle, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeacherCard } from "@/components/teacher-card";
import { StudentCard } from "@/components/student-card";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Find() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");

  const isStudent = user?.userType === 'student';

  // Query to fetch profiles based on user type
  const { data: profiles = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/search/${isStudent ? 'teachers' : 'students'}`],
    queryFn: () => fetch(`/api/search/${isStudent ? 'teachers' : 'students'}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(res => res.json()),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter profiles based on search criteria and user type
  const filteredProfiles = (profiles || []).filter((profile: any) => {
    const teacherName = isStudent ? `${profile.name} ${profile.lastName || ''}`.trim() : profile.name;
    const matchesSearch = !searchQuery || 
      teacherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.qualification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.schoolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.subjects?.some((subject: string) => 
        subject.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesLocation = !locationFilter || 
      profile.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      profile.state?.toLowerCase().includes(locationFilter.toLowerCase());

    let matchesFilter = true;
    if (subjectFilter && subjectFilter !== "all") {
      if (isStudent) {
        // For students searching teachers - filter by subjects
        matchesFilter = profile.subjects?.some((subject: string) => 
          subject.toLowerCase().includes(subjectFilter.toLowerCase())
        );
      } else {
        // For teachers searching students - filter by class
        matchesFilter = profile.class?.toLowerCase().includes(subjectFilter.toLowerCase());
      }
    }

    // Verification filter
    let matchesVerification = true;
    if (verificationFilter && verificationFilter !== "all") {
      if (verificationFilter === "verified") {
        matchesVerification = profile.isVerified === true;
      } else if (verificationFilter === "not_verified") {
        matchesVerification = !profile.isVerified;
      }
    }

    return matchesSearch && matchesLocation && matchesFilter && matchesVerification;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setSubjectFilter("");
    setVerificationFilter("");
  };

  return (
    <div className="min-h-screen bg-tutoro-light pt-16 md:pt-14 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Find {isStudent ? 'Teachers' : 'Students'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {isStudent 
              ? 'Discover qualified teachers perfect for your learning needs'
              : 'Connect with students looking for your expertise'
            }
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              {/* Search Bar - Full Width */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={`Search ${isStudent ? 'teachers' : 'students'}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {isStudent ? (
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                      <SelectItem value="Biology">Biology</SelectItem>
                      <SelectItem value="History">History</SelectItem>
                      <SelectItem value="Geography">Geography</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="1st">1st Grade</SelectItem>
                      <SelectItem value="2nd">2nd Grade</SelectItem>
                      <SelectItem value="3rd">3rd Grade</SelectItem>
                      <SelectItem value="4th">4th Grade</SelectItem>
                      <SelectItem value="5th">5th Grade</SelectItem>
                      <SelectItem value="6th">6th Grade</SelectItem>
                      <SelectItem value="7th">7th Grade</SelectItem>
                      <SelectItem value="8th">8th Grade</SelectItem>
                      <SelectItem value="9th">9th Grade</SelectItem>
                      <SelectItem value="10th">10th Grade</SelectItem>
                      <SelectItem value="11th">11th Grade</SelectItem>
                      <SelectItem value="12th">12th Grade</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Verification" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">Verified Only</SelectItem>
                    <SelectItem value="not_verified">Not Verified</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button 
                    onClick={clearFilters}
                    variant="outline"
                    className="flex items-center flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button 
                    className="flex items-center flex-1 bg-blue-600 hover:bg-blue-700"
                    data-testid="button-find"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Find
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchQuery || locationFilter || (subjectFilter && subjectFilter !== "all") || (verificationFilter && verificationFilter !== "all")) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {searchQuery}
                    </Badge>
                  )}
                  {locationFilter && (
                    <Badge variant="secondary" className="text-xs">
                      Location: {locationFilter}
                    </Badge>
                  )}
                  {subjectFilter && subjectFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {isStudent ? 'Subject' : 'Class'}: {subjectFilter}
                    </Badge>
                  )}
                  {verificationFilter && verificationFilter !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      {verificationFilter === "verified" ? "Verified Only" : "Not Verified"}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 px-2">
          <p className="text-sm text-gray-600">
            Found {filteredProfiles.length} {isStudent ? 'teacher' : 'student'}{filteredProfiles.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 px-2">
          {filteredProfiles.length === 0 ? (
            <div className="col-span-full text-center py-8 sm:py-12">
              <Search className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                No {isStudent ? 'teachers' : 'students'} found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Try adjusting your search filters to find more results.
              </p>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear All Filters
              </Button>
            </div>
          ) : (
            filteredProfiles.map((profile: any) => (
              isStudent ? (
                <TeacherCard 
                  key={profile.id} 
                  teacher={profile}
                  userLocation={(user as any)?.latitude && (user as any)?.longitude ? {
                    latitude: parseFloat((user as any).latitude),
                    longitude: parseFloat((user as any).longitude)
                  } : undefined}
                />
              ) : (
                <StudentCard 
                  key={profile.id} 
                  student={profile}
                  userLocation={(user as any)?.latitude && (user as any)?.longitude ? {
                    latitude: parseFloat((user as any).latitude),
                    longitude: parseFloat((user as any).longitude)
                  } : undefined}
                />
              )
            ))
          )}
        </div>
      </div>
    </div>
  );
}