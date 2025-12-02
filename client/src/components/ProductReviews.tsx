import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, User, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

function StarRating({ 
  rating, 
  interactive = false, 
  onRatingChange,
  size = 'md'
}: { 
  rating: number; 
  interactive?: boolean; 
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;
  
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };
  
  return (
    <div 
      className="flex gap-0.5"
      onMouseLeave={() => interactive && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          onClick={() => interactive && onRatingChange?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          data-testid={`star-${star}`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= displayRating
                ? 'fill-primary text-primary'
                : 'fill-muted text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function RatingBadge({ 
  productId, 
  compact = false 
}: { 
  productId: string; 
  compact?: boolean;
}) {
  const { data, isLoading } = useQuery<{ average: number; count: number }>({
    queryKey: [`/api/products/${productId}/rating`],
    staleTime: 1000 * 60 * 5,
  });
  
  if (isLoading || !data || data.count === 0) {
    return null;
  }
  
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground" data-testid="rating-badge">
        <Star className="h-3 w-3 fill-primary text-primary" />
        <span>{data.average.toFixed(1)}</span>
        <span className="text-muted-foreground/60">({data.count})</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2" data-testid="rating-summary">
      <StarRating rating={Math.round(data.average)} size="sm" />
      <span className="text-sm text-muted-foreground">
        {data.average.toFixed(1)} ({data.count})
      </span>
    </div>
  );
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const { language } = useLanguage();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newTitle, setNewTitle] = useState('');
  
  const { data, isLoading } = useQuery<{ reviews: Review[]; average: number; count: number }>({
    queryKey: [`/api/products/${productId}/reviews`],
  });
  
  const submitReviewMutation = useMutation({
    mutationFn: (reviewData: { rating: number; title?: string; comment?: string }) =>
      apiRequest('POST', `/api/products/${productId}/reviews`, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/reviews`] });
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/rating`] });
      setShowForm(false);
      setNewRating(0);
      setNewComment('');
      setNewTitle('');
      toast({
        title: language === 'et' ? 'Arvustus lisatud' : 'Review submitted',
        description: language === 'et' ? 'Täname tagasiside eest!' : 'Thank you for your feedback!',
      });
    },
    onError: (error: any) => {
      toast({
        title: language === 'et' ? 'Viga' : 'Error',
        description: error?.message || (language === 'et' ? 'Arvustuse lisamine ebaõnnestus' : 'Failed to submit review'),
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmitReview = () => {
    if (newRating === 0) {
      toast({
        title: language === 'et' ? 'Viga' : 'Error',
        description: language === 'et' ? 'Palun vali hinne' : 'Please select a rating',
        variant: 'destructive',
      });
      return;
    }
    
    submitReviewMutation.mutate({
      rating: newRating,
      title: newTitle || undefined,
      comment: newComment || undefined,
    });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'et' ? 'et-EE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const reviews = data?.reviews || [];
  const hasReviewed = reviews.some(r => r.userId === user?.id);
  
  return (
    <div className="space-y-6" data-testid="section-reviews">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {language === 'et' ? 'Arvustused' : 'Reviews'}
          </h2>
          {data && data.count > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={Math.round(data.average)} size="md" />
              <span className="text-lg font-medium">{data.average.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({data.count} {language === 'et' ? (data.count === 1 ? 'arvustus' : 'arvustust') : (data.count === 1 ? 'review' : 'reviews')})
              </span>
            </div>
          )}
        </div>
        
        {isAuthenticated && !hasReviewed && !showForm && (
          <Button 
            variant="outline" 
            onClick={() => setShowForm(true)}
            data-testid="button-write-review"
          >
            {language === 'et' ? 'Kirjuta arvustus' : 'Write a Review'}
          </Button>
        )}
      </div>
      
      {showForm && (
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'et' ? 'Sinu hinne' : 'Your Rating'}
            </label>
            <StarRating 
              rating={newRating} 
              interactive 
              onRatingChange={setNewRating}
              size="lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'et' ? 'Pealkiri (valikuline)' : 'Title (optional)'}
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={language === 'et' ? 'Lühike kokkuvõte' : 'Brief summary'}
              className="w-full px-3 py-2 rounded-md border bg-background text-foreground"
              maxLength={100}
              data-testid="input-review-title"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'et' ? 'Arvustus (valikuline)' : 'Review (optional)'}
            </label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={language === 'et' ? 'Kirjuta oma kogemuse kohta...' : 'Share your experience...'}
              rows={3}
              maxLength={1000}
              data-testid="input-review-comment"
            />
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="ghost" 
              onClick={() => {
                setShowForm(false);
                setNewRating(0);
                setNewComment('');
                setNewTitle('');
              }}
              data-testid="button-cancel-review"
            >
              {language === 'et' ? 'Tühista' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSubmitReview}
              disabled={submitReviewMutation.isPending || newRating === 0}
              data-testid="button-submit-review"
            >
              {submitReviewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {language === 'et' ? 'Saada arvustus' : 'Submit Review'}
            </Button>
          </div>
        </Card>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div 
              key={review.id} 
              className="py-4 border-b border-border last:border-0"
              data-testid={`review-${review.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size="sm" />
                      {review.isVerifiedPurchase && (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-500">
                          <CheckCircle2 className="h-3 w-3" />
                          {language === 'et' ? 'Kinnitatud ost' : 'Verified Purchase'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              {review.title && (
                <h4 className="font-medium mt-3" data-testid={`review-title-${review.id}`}>
                  {review.title}
                </h4>
              )}
              
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2" data-testid={`review-comment-${review.id}`}>
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{language === 'et' ? 'Selle toote kohta pole veel arvustusi.' : 'No reviews yet for this product.'}</p>
          {isAuthenticated && !hasReviewed && (
            <p className="text-sm mt-2">
              {language === 'et' ? 'Ole esimene, kes kirjutab arvustuse!' : 'Be the first to write a review!'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
