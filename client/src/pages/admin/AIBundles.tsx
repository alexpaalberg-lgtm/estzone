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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  RefreshCcw,
  Zap,
  Target,
  Sparkles,
  Gift,
  TrendingDown,
  Users,
  ShoppingBag,
  Gamepad2,
  Headphones,
  Monitor,
  Video
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface BundleProduct {
  productId: string;
  productName: string;
  productNameEt: string;
  price: number;
  category: string;
}

interface GeneratedBundle {
  id: string;
  nameEn: string;
  nameEt: string;
  descriptionEn: string;
  descriptionEt: string;
  products: BundleProduct[];
  originalPrice: number;
  bundlePrice: number;
  discountPercent: number;
  targetAudience: string;
  targetAudienceEt: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: string;
}

interface BundleAnalysis {
  timestamp: string;
  bundlesGenerated: number;
  bundles: GeneratedBundle[];
  insights: string[];
}

export default function AIBundles() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();

  const { data: analysis, isLoading } = useQuery<BundleAnalysis>({
    queryKey: ['/api/admin/ai/bundles'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/bundles/generate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/bundles'] });
      toast({
        title: language === 'et' ? 'Komplektid loodud!' : 'Bundles generated!',
        description: language === 'et' 
          ? 'AI on loonud uued tootepaketid' 
          : 'AI has created new product bundles',
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

  const getBundleIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('vr')) return <Headphones className="h-6 w-6" />;
    if (lowerName.includes('stream')) return <Video className="h-6 w-6" />;
    if (lowerName.includes('pc') || lowerName.includes('peripheral')) return <Monitor className="h-6 w-6" />;
    return <Gamepad2 className="h-6 w-6" />;
  };

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

  const totalSavings = analysis?.bundles.reduce((sum, b) => sum + (b.originalPrice - b.bundlePrice), 0) || 0;
  const avgDiscount = analysis && analysis.bundles.length > 0
    ? analysis.bundles.reduce((sum, b) => sum + b.discountPercent, 0) / analysis.bundles.length
    : 0;

  return (
    <AdminLayout title={language === 'et' ? 'AI Komplektid' : 'AI Bundles'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-bundles-title">
                {language === 'et' ? 'AI Tootepaketid' : 'AI Product Bundles'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Automaatselt genereeritud tootepaketid' 
                  : 'Automatically generated product bundles'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            data-testid="button-generate-bundles"
          >
            {generateMutation.isPending ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {language === 'et' ? 'Genereeri komplektid' : 'Generate Bundles'}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !analysis ? (
          <Card className="p-12 text-center">
            <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Komplekte pole veel loodud' : 'No bundles generated yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Genereeri komplektid" AI soovituste saamiseks'
                : 'Click "Generate Bundles" to get AI recommendations'}
            </p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Genereeri komplektid' : 'Generate Bundles'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-bundles-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Komplekte' : 'Bundles'}
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.bundlesGenerated}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'genereeritud' : 'generated'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-discount">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Keskmine allahindlus' : 'Avg. Discount'}
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{avgDiscount.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'soodustust' : 'savings'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-total-savings">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Kogusääst' : 'Total Savings'}
                  </CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">{formatPrice(totalSavings)}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'klientidele' : 'for customers'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-products-in-bundles">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Tooteid komplektides' : 'Products in Bundles'}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {analysis.bundles.reduce((sum, b) => sum + b.products.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'kaasatud' : 'included'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  {language === 'et' ? 'Genereeritud komplektid' : 'Generated Bundles'}
                </h3>

                <ScrollArea className="h-[500px]">
                  <div className="space-y-4 pr-4">
                    {analysis.bundles.map((bundle) => (
                      <Card key={bundle.id} className="overflow-hidden" data-testid={`card-bundle-${bundle.id}`}>
                        <CardHeader className="bg-primary/5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-background rounded-lg">
                                {getBundleIcon(bundle.nameEn)}
                              </div>
                              <div>
                                <CardTitle className="text-lg">
                                  {language === 'et' ? bundle.nameEt : bundle.nameEn}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {language === 'et' ? bundle.descriptionEt : bundle.descriptionEn}
                                </CardDescription>
                              </div>
                            </div>
                            {getConfidenceBadge(bundle.confidence)}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex flex-wrap gap-2">
                              {bundle.products.map((product, idx) => (
                                <Badge key={idx} variant="outline" className="py-1">
                                  {language === 'et' ? product.productNameEt : product.productName}
                                  <span className="ml-2 text-muted-foreground">
                                    {formatPrice(product.price)}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                            
                            <Separator />
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'et' ? 'Algne hind' : 'Original Price'}
                                  </p>
                                  <p className="text-lg line-through text-muted-foreground">
                                    {formatPrice(bundle.originalPrice)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    {language === 'et' ? 'Komplekti hind' : 'Bundle Price'}
                                  </p>
                                  <p className="text-xl font-bold text-green-500">
                                    {formatPrice(bundle.bundlePrice)}
                                  </p>
                                </div>
                                <Badge className="bg-green-500">
                                  -{bundle.discountPercent}%
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>
                                {language === 'et' ? bundle.targetAudienceEt : bundle.targetAudience}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-6">
                <Card data-testid="card-insights">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'Turunduse ülevaated' : 'Marketing Insights'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-3">
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
                      {language === 'et' ? 'Soovitused' : 'Recommendations'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Avalehele' : 'Homepage Feature'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Lisa komplektid avalehe esiletõstetud sektsiooni'
                            : 'Add bundles to homepage featured section'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Emaili kampaaniad' : 'Email Campaigns'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Saada komplektide pakkumised uudiskirja tellijatele'
                            : 'Send bundle offers to newsletter subscribers'}
                        </p>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg">
                        <p className="font-medium mb-1">
                          {language === 'et' ? 'Sotsiaalmeedias' : 'Social Media'}
                        </p>
                        <p className="text-muted-foreground">
                          {language === 'et' 
                            ? 'Jaga komplekte sotsiaalmeedia kanalites'
                            : 'Share bundles on social media channels'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-timestamp">
                  <CardContent className="pt-6">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>{language === 'et' ? 'Viimane genereerimine' : 'Last generated'}</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(analysis.timestamp), 'dd.MM.yyyy HH:mm', { 
                          locale: language === 'et' ? et : enGB 
                        })}
                      </p>
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
