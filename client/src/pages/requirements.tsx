import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Clock, 
  IndianRupee, 
  MessageCircle,
  Filter,
  Search,
  Plus
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import RequirementModal from "@/components/requirement-modal";
import { VerifiedBadge } from "@/components/verified-badge";

export default function Requirements() {
  const { user } = useAuth();
  const filteredUserType = user?.userType === "student" ? "teacher" : "student";
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    userType: filteredUserType,
    subjects: "",
    location: "",
  });

  const { data: requirements, isLoading } = useQuery({
    queryKey: ["/api/requirements", filteredUserType, filters.subjects, filters.location],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('userType', filteredUserType);
      if (filters.subjects) {
        params.append('subjects', filters.subjects);
      }
      if (filters.location) {
        params.append('location', filters.location);
      }

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

  return (
    <div className="min-h-screen bg-tutoro-light pt-8 md:pt-4 pb-20">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4">
        <div className="mb-4 sm:mb-6 px-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {filteredUserType === "teacher" ? "Find Teachers" : "Find Students"}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Discover {filteredUserType}s who match your requirements
              </p>
            </div>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-add-requirement"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post Requirement
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Search by Subject</label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="e.g. Mathematics, Physics"
                    value={filters.subjects}
                    onChange={(e) => setFilters(prev => ({ ...prev, subjects: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="City or area"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Verified Only</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="verified">Verified Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requirements List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 px-2">
            {requirements && (requirements as any).length > 0 ? (
              (requirements as any).map((requirement: any) => (
                <Card key={requirement.id} className="hover:shadow-lg transition-shadow premium-card">
                  <CardContent className="p-4 sm:pt-6">
                    <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={requirement.user?.profileImage || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face`}
                          alt="Profile"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-base sm:text-lg">
                              {requirement.user?.firstName} {requirement.user?.lastName}
                            </h3>
                            <VerifiedBadge isVerified={requirement.user?.isVerified || false} size="md" />
                          </div>
                          <p className="text-sm text-gray-600">
                            {filteredUserType === "teacher" ? "Teacher" : "Student"}
                          </p>
                        </div>
                      </div>
                      <Link href={`/messages/${requirement.userId}`}>
                        <Button size="sm" className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Subjects:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {requirement.subjects?.map((subject: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {requirement.classes && requirement.classes.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Classes:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {requirement.classes.map((className: string, index: number) => (
                              <Badge key={index} variant="outline">
                                {className}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{requirement.location}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{requirement.type === "both" ? "Online & Offline" : requirement.type}</span>
                        </div>
                        {requirement.fee && (
                          <div className="flex items-center text-gray-600">
                            <IndianRupee className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span>₹{requirement.fee} {requirement.feeType?.replace("_", " ")}</span>
                          </div>
                        )}
                      </div>

                      {requirement.description && (
                        <div>
                          <span className="font-medium text-gray-700">Details:</span>
                          <p className="text-gray-600 text-sm mt-1">{requirement.description}</p>
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        Posted {new Date(requirement.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                    No requirements found
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    No {filteredUserType}s have posted requirements yet. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
      
      <RequirementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userType={user?.userType || 'student'}
      />
    </div>
  );
}