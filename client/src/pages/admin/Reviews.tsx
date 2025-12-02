import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Check, X, Loader2, Search, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';

interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  isVerifiedPurchase: boolean;
  createdAt: string;
  product?: {
    nameEn: string;
    nameEt: string;
  };
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-primary text-primary'
              : 'fill-muted text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  
  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['/api/admin/reviews'],
  });
  
  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('PATCH', `/api/admin/reviews/${id}`, { isApproved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: 'Review approved' });
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest('DELETE', `/api/admin/reviews/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: 'Review deleted' });
    },
  });
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const filteredReviews = reviews?.filter(review => {
    const matchesSearch = 
      review.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product?.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'pending' && !review.isApproved) ||
      (filterStatus === 'approved' && review.isApproved);
    
    return matchesSearch && matchesStatus;
  }) || [];
  
  const pendingCount = reviews?.filter(r => !r.isApproved).length || 0;
  
  return (
    <AdminLayout title="Reviews">
      <div className="space-y-6" data-testid="page-admin-reviews">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reviews</h1>
            <p className="text-muted-foreground">Moderate product reviews</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm" data-testid="badge-pending-count">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {pendingCount} pending
            </Badge>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reviews?.filter(r => r.isApproved).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reviews..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-reviews"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  data-testid="button-filter-all"
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                  data-testid="button-filter-pending"
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === 'approved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('approved')}
                  data-testid="button-filter-approved"
                >
                  Approved
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredReviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id} data-testid={`row-review-${review.id}`}>
                      <TableCell>
                        <div className="max-w-[200px] truncate font-medium">
                          {review.product?.nameEn || 'Unknown Product'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StarRating rating={review.rating} />
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px]">
                          {review.title && (
                            <div className="font-medium text-sm truncate">{review.title}</div>
                          )}
                          {review.comment && (
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {review.comment}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {review.isApproved ? (
                            <Badge className="bg-green-500/20 text-green-500">Approved</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                          {review.isVerifiedPurchase && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {!review.isApproved && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-500"
                              onClick={() => approveMutation.mutate(review.id)}
                              disabled={approveMutation.isPending}
                              data-testid={`button-approve-${review.id}`}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => rejectMutation.mutate(review.id)}
                            disabled={rejectMutation.isPending}
                            data-testid={`button-delete-${review.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
