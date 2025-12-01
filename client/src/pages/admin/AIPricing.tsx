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
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  RefreshCcw,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Play
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PriceAdjustment {
  productId: string;
  productName: string;
  currentPrice: number;
  suggestedPrice: number;
  adjustmentPercent: number;
  reason: string;
  reasonEt: string;
  confidence: 'high' | 'medium' | 'low';
  applied: boolean;
  appliedAt?: string;
}

interface PricingAnalysis {
  timestamp: string;
  totalProducts: number;
  productsAnalyzed: number;
  adjustmentsMade: number;
  totalRevenuePotential: number;
  adjustments: PriceAdjustment[];
  marketInsights: string[];
  nextReviewDate: string;
}

export default function AIPricing() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [autoApply, setAutoApply] = useState(false);

  const { data: analysis, isLoading } = useQuery<PricingAnalysis>({
    queryKey: ['/api/admin/ai/pricing'],
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/pricing/analyze', { autoApply });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/pricing'] });
      toast({
        title: language === 'et' ? 'Analüüs lõpetatud!' : 'Analysis completed!',
        description: language === 'et' 
          ? 'Hinnaanalüüs on tehtud' 
          : 'Pricing analysis has been performed',
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

  const applyPriceMutation = useMutation({
    mutationFn: async ({ productId, newPrice }: { productId: string; newPrice: number }) => {
      return apiRequest('POST', '/api/admin/ai/pricing/apply', { productId, newPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/pricing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: language === 'et' ? 'Hind muudetud!' : 'Price updated!',
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

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500">{language === 'et' ? 'Kõrge' : 'High'}</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">{language === 'et' ? 'Keskmine' : 'Medium'}</Badge>;
      case 'low':
        return <Badge variant="secondary">{language === 'et' ? 'Madal' : 'Low'}</Badge>;
      default:
        return null;
    }
  };

  const priceIncreases = analysis?.adjustments.filter(a => a.adjustmentPercent > 0) || [];
  const priceDecreases = analysis?.adjustments.filter(a => a.adjustmentPercent < 0) || [];

  return (
    <AdminLayout title={language === 'et' ? 'AI Hinnastamine' : 'AI Pricing'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-pricing-title">
                {language === 'et' ? 'Autonoomne Hinnastamine' : 'Autonomous Pricing'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'AI analüüsib ja optimeerib hindu automaatselt' 
                  : 'AI analyzes and optimizes prices automatically'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-apply"
                checked={autoApply}
                onCheckedChange={setAutoApply}
              />
              <Label htmlFor="auto-apply" className="text-sm">
                {language === 'et' ? 'Rakenda automaatselt' : 'Auto-apply changes'}
              </Label>
            </div>
            
            <Button
              onClick={() => runAnalysisMutation.mutate()}
              disabled={runAnalysisMutation.isPending}
              data-testid="button-run-analysis"
            >
              {runAnalysisMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {language === 'et' ? 'Käivita analüüs' : 'Run Analysis'}
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
            <DollarSign className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Analüüsi pole veel tehtud' : 'No analysis performed yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Käivita analüüs" hindade optimeerimiseks'
                : 'Click "Run Analysis" to optimize prices'}
            </p>
            <Button onClick={() => runAnalysisMutation.mutate()} disabled={runAnalysisMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Käivita analüüs' : 'Run Analysis'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-products-analyzed">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Analüüsitud' : 'Analyzed'}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.productsAnalyzed}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'toodet' : 'products'} / {analysis.totalProducts}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-suggestions">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Soovitusi' : 'Suggestions'}
                  </CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.adjustments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-green-500">{priceIncreases.length} ↑</span>
                    {' '}/{' '}
                    <span className="text-red-500">{priceDecreases.length} ↓</span>
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-applied">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Rakendatud' : 'Applied'}
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{analysis.adjustmentsMade}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'hinnamuudatust' : 'price changes'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-revenue-potential">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Tulu potentsiaal' : 'Revenue Potential'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    analysis.totalRevenuePotential >= 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {analysis.totalRevenuePotential >= 0 ? '+' : ''}{formatPrice(analysis.totalRevenuePotential)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'kuus hinnanguliselt' : 'monthly estimate'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2" data-testid="card-adjustments">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {language === 'et' ? 'Hinnasoovitused' : 'Price Recommendations'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' 
                      ? 'AI genereeritud hinnamuudatused'
                      : 'AI-generated price adjustments'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {analysis.adjustments.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                        <p>{language === 'et' ? 'Hinnad on optimaalsed!' : 'Prices are optimal!'}</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{language === 'et' ? 'Toode' : 'Product'}</TableHead>
                            <TableHead className="text-right">{language === 'et' ? 'Praegune' : 'Current'}</TableHead>
                            <TableHead className="text-right">{language === 'et' ? 'Soovitatud' : 'Suggested'}</TableHead>
                            <TableHead className="text-center">{language === 'et' ? 'Muutus' : 'Change'}</TableHead>
                            <TableHead>{language === 'et' ? 'Usaldusväärsus' : 'Confidence'}</TableHead>
                            <TableHead className="text-right">{language === 'et' ? 'Tegevus' : 'Action'}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.adjustments.map((adj) => (
                            <TableRow key={adj.productId}>
                              <TableCell className="font-medium max-w-[200px] truncate">
                                {adj.productName}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatPrice(adj.currentPrice)}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatPrice(adj.suggestedPrice)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className={cn(
                                  "flex items-center justify-center gap-1",
                                  adj.adjustmentPercent > 0 ? "text-green-500" : "text-red-500"
                                )}>
                                  {adj.adjustmentPercent > 0 ? (
                                    <ArrowUpRight className="h-4 w-4" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4" />
                                  )}
                                  {Math.abs(adj.adjustmentPercent).toFixed(1)}%
                                </div>
                              </TableCell>
                              <TableCell>{getConfidenceBadge(adj.confidence)}</TableCell>
                              <TableCell className="text-right">
                                {adj.applied ? (
                                  <Badge variant="outline" className="text-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {language === 'et' ? 'Rakendatud' : 'Applied'}
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => applyPriceMutation.mutate({ 
                                      productId: adj.productId, 
                                      newPrice: adj.suggestedPrice 
                                    })}
                                    disabled={applyPriceMutation.isPending}
                                    data-testid={`button-apply-${adj.productId}`}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    {language === 'et' ? 'Rakenda' : 'Apply'}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card data-testid="card-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'Turuülevaade' : 'Market Insights'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {analysis.marketInsights.map((insight, i) => (
                          <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-sm">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card data-testid="card-timing">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {language === 'et' ? 'Ajakava' : 'Schedule'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'et' ? 'Viimane analüüs' : 'Last analysis'}
                      </p>
                      <p className="font-medium">
                        {format(new Date(analysis.timestamp), 'dd.MM.yyyy HH:mm', { 
                          locale: language === 'et' ? et : enGB 
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'et' ? 'Järgmine ülevaatus' : 'Next review'}
                      </p>
                      <p className="font-medium">
                        {format(new Date(analysis.nextReviewDate), 'dd.MM.yyyy', { 
                          locale: language === 'et' ? et : enGB 
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-reasons">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {language === 'et' ? 'Peamised põhjused' : 'Top Reasons'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[120px]">
                      <div className="space-y-2">
                        {analysis.adjustments.slice(0, 5).map((adj, i) => (
                          <div key={i} className="p-2 bg-muted/30 rounded-lg text-sm">
                            <span className="font-medium">{adj.productName.substring(0, 20)}...</span>
                            <p className="text-muted-foreground text-xs mt-1">
                              {language === 'et' ? adj.reasonEt : adj.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
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
