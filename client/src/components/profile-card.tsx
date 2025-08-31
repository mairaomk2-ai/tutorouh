import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Star, 
  Users, 
  MapPin, 
  CheckCircle, 
  MessageCircle,
  Calendar
} from "lucide-react";
import { Link } from "wouter";

interface ProfileCardProps {
  user: {
    id: string;
    firstName: string;
    lastName?: string;
    profileImage?: string;
    userType: "student" | "teacher";
  };
  profile: {
    // Teacher profile fields
    subjects?: string[];
    qualification?: string;
    experience?: number;
    city?: string;
    rating?: string;
    studentCount?: number;
    isVerified?: boolean;
    bio?: string;
    monthlyFee?: string;
    // Student profile fields
    class?: string;
    schoolName?: string;
  };
  showMessageButton?: boolean;
  compact?: boolean;
}

export default function ProfileCard({ 
  user, 
  profile, 
  showMessageButton = true, 
  compact = false 
}: ProfileCardProps) {
  const isTeacher = user.userType === "teacher";
  const rating = profile.rating ? parseFloat(profile.rating) : 3.0;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <Card className={`hover:shadow-lg transition-shadow ${compact ? 'p-4' : ''}`}>
      <CardContent className={compact ? 'p-0' : 'pt-6'}>
        <div className="flex items-start space-x-4">
          <Avatar className={compact ? 'w-12 h-12' : 'w-16 h-16'}>
            <AvatarImage src={user.profileImage} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {user.firstName.charAt(0)}{user.lastName?.charAt(0) || ''}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className={`font-semibold text-gray-900 ${compact ? 'text-base' : 'text-lg'}`}>
                {user.firstName} {user.lastName}
              </h3>
              {isTeacher && profile.isVerified && (
                <div className="blue-tick">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {isTeacher ? (
              <>
                <p className="text-gray-600 text-sm mb-2">
                  {profile.qualification}
                </p>

                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <div className="star-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < fullStars 
                              ? 'fill-current text-yellow-400' 
                              : i === fullStars && hasHalfStar
                              ? 'fill-current text-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-1">
                      {rating.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    {profile.studentCount || 0} students
                  </div>
                </div>

                {/* Monthly Fee Display */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-primary">
                    Monthly Fee: ₹{profile.monthlyFee ? parseFloat(profile.monthlyFee).toFixed(0) : '1'}
                  </p>
                </div>

                {!compact && (
                  <>
                    {profile.subjects && profile.subjects.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {profile.subjects.slice(0, 3).map((subject, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {profile.subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.subjects.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1 text-sm text-gray-600">
                      {profile.city && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          {profile.city}
                        </div>
                      )}
                      {profile.experience !== undefined && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          {profile.experience} years experience
                        </div>
                      )}
                    </div>

                    {profile.bio && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Class:</span> {profile.class}</p>
                  <p><span className="font-medium">School:</span> {profile.schoolName}</p>
                </div>
              </>
            )}

            {showMessageButton && (
              <div className="mt-4">
                <Link href={`/messages/${user.id}`}>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
