import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    fromUserName: string;
    fromUserImage?: string;
  };
  compact?: boolean;
}

export default function ReviewCard({ review, compact = false }: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className={`${compact ? 'border-0 shadow-none bg-gray-50' : 'hover:shadow-md transition-shadow'}`}>
      <CardContent className={compact ? 'p-4' : 'pt-6'}>
        <div className="flex items-start space-x-3">
          <Avatar className={compact ? 'w-8 h-8' : 'w-10 h-10'}>
            <AvatarImage src={review.fromUserImage} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {review.fromUserName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
                {review.fromUserName}
              </h4>
              <span className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
                {formatDate(review.createdAt)}
              </span>
            </div>

            <div className="flex items-center mb-2">
              <div className="star-rating mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${
                      i < review.rating 
                        ? 'fill-current text-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className={`font-medium text-gray-700 ${compact ? 'text-sm' : 'text-base'}`}>
                {review.rating}/5
              </span>
            </div>

            {review.comment && (
              <p className={`text-gray-600 leading-relaxed ${compact ? 'text-sm' : 'text-base'}`}>
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
