import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { et, enGB } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Percent,
  RefreshCcw,
  Zap,
  Users,
  Sparkles,
  UserPlus,
  UserCheck,
  Crown,
  Star,
  Clock,
  Target,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CustomerSegment {
  id: string;
  nameEn: string;
  nameEt: string;
  descriptionEn: string;
  descriptionEt: string;
  customerCount: number;
  avgOrderValue: number;
  recommendedDiscount: number;
}

interface PersonalizedCoupon {
  id: string;
  code: string;
  userId?: string;
  userName?: string;
  segmentId: string;
  segmentName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  maxUses: number;
  validDays: number;
  reasonEn: string;
  reasonEt: string;
  created: boolean;
  createdAt?: string;
}

interface CouponAnalysis {
  timestamp: string;
  totalCustomers: number;
  eligibleCustomers: number;
  segments: CustomerSegment[];
  generatedCoupons: PersonalizedCoupon[];
  insights: string[];
  projectedRevenue: number;
}

export default function AICoupons() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [autoCreate, setAutoCreate] = useState(false);

  const { data: analysis, isLoading } = useQuery<CouponAnalysis>({
    queryKey: ['/api/admin/ai/coupons'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/coupons/generate', { autoCreate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/coupons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/coupons'] });
      toast({
        title: language === 'et' ? 'Kupongid genereeritud!' : 'Coupons generated!',
        description: language === 'et' 
          ? 'AI on loonud personaalsed kupongid' 
          : 'AI has created personalized coupons',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message,
      });
    },
  });

  const getSegmentIcon = (segmentId: string) => {
    switch (segmentId) {
      case 'new_customer': return <UserPlus className="h-4 w-4" />;
      case 'returning_customer': return <UserCheck className="h-4 w-4" />;
      case 'loyal_customer': return <Crown className="h-4 w-4" />;
      case 'high_value': return <Star className="h-4 w-4" />;
      case 'dormant': return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const createdCoupons = analysis?.generatedCoupons.filter(c => c.created) || [];
  const pendingCoupons = analysis?.generatedCoupons.filter(c => !c.created) || [];

  return (
    <AdminLayout title={language === 'et' ? 'AI Kupongid' : 'AI Coupons'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Percent className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-coupons-title">
                {language === 'et' ? 'Personaalsed Kupongid' : 'Personalized Coupons'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'AI genereerib sooduskoode segmentide põhjal' 
                  : 'AI generates discount codes based on segments'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-create"
                checked={autoCreate}
                onCheckedChange={setAutoCreate}
              />
              <Label htmlFor="auto-create" className="text-sm">
                {language === 'et' ? 'Loo automaatselt' : 'Auto-create coupons'}
              </Label>
            </div>
            
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate-coupons"
            >
              {generateMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {language === 'et' ? 'Genereeri' : 'Generate'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !analysis ? (
          <Card className="p-12 text-center">
            <Percent className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Kuponge pole veel genereeritud' : 'No coupons generated yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Genereeri" personaalsete kupongide loomiseks'
                : 'Click "Generate" to create personalized coupons'}
            </p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Genereeri' : 'Generate'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-customers">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Kliente' : 'Customers'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.totalCustomers}</div>
                  <p className="text-xs text-muted-foreground">
                    {analysis.eligibleCustomers} {language === 'et' ? 'sobivad' : 'eligible'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-segments">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Segmente' : 'Segments'}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.segments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'aktiivset' : 'active'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-coupons-created">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Loodud' : 'Created'}
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{createdCoupons.length}</div>
                  <p className="text-xs text-muted-foreground">
                    / {analysis.generatedCoupons.length} {language === 'et' ? 'kupongi' : 'coupons'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-projected-revenue">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Potentsiaalne tulu' : 'Projected Revenue'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">
                    {formatPrice(analysis.projectedRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'hinnanguline' : 'estimated'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card data-testid="card-segments-breakdown">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {language === 'et' ? 'Kliendisegmendid' : 'Customer Segments'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'et' 
                        ? 'Segmendid ja soovituslikud allahindlused'
                        : 'Segments and recommended discounts'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.segments.map((segment) => (
                        <div key={segment.id} className="p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-background rounded-lg">
                                {getSegmentIcon(segment.id)}
                              </div>
                              <div>
                                <h4 className="font-medium">
                                  {language === 'et' ? segment.nameEt : segment.nameEn}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {language === 'et' ? segment.descriptionEt : segment.descriptionEn}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-primary mb-1">
                                -{segment.recommendedDiscount}%
                              </Badge>
                              <p className="text-sm font-bold">{segment.customerCount}</p>
                              <p className="text-xs text-muted-foreground">
                                {language === 'et' ? 'klienti' : 'customers'}
                              </p>
                            </div>
                          </div>
                          {segment.avgOrderValue > 0 && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {language === 'et' ? 'Keskmine tellimus:' : 'Avg order:'} {formatPrice(segment.avgOrderValue)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-coupons-list">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="h-5 w-5" />
                      {language === 'et' ? 'Genereeritud kupongid' : 'Generated Coupons'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'et' ? 'Kood' : 'Code'}</TableHead>
                            <TableHead>{language === 'et' ? 'Segment' : 'Segment'}</TableHead>
                            <TableHead className="text-center">{language === 'et' ? 'Allahindlus' : 'Discount'}</TableHead>
                            <TableHead className="text-center">{language === 'et' ? 'Kehtib' : 'Valid'}</TableHead>
                            <TableHead>{language === 'et' ? 'Staatus' : 'Status'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.generatedCoupons.map((coupon) => (
                            <TableRow key={coupon.id}>
                              <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getSegmentIcon(coupon.segmentId)}
                                  <span className="text-sm">{coupon.segmentName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge>{coupon.discountValue}%</Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {coupon.validDays} {language === 'et' ? 'päeva' : 'days'}
                              </TableCell>
                              <TableCell>
                                {coupon.created ? (
                                  <Badge variant="outline" className="text-green-500 border-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {language === 'et' ? 'Loodud' : 'Created'}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    {language === 'et' ? 'Ootel' : 'Pending'}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card data-testid="card-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'Ülevaated' : 'Insights'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {analysis.insights.map((insight, i) => (
                          <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card data-testid="card-tips">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      {language === 'et' ? 'Näpunäited' : 'Tips'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Testimine' : 'Testing'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Esmalt genereeri kupongid ilma automaatse loomiseta, et vaadata tulemusi'
                            : 'First generate without auto-create to review results'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Parim aeg' : 'Best Timing'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Saada kupongid enne nädalavahetust parima efekti saavutamiseks'
                            : 'Send coupons before weekends for best effect'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Jälgimine' : 'Tracking'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Jälgi kupongide kasutamist Kupongid lehel'
                            : 'Track coupon usage in the Coupons page'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
