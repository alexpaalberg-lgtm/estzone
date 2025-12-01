import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search,
  RefreshCcw,
  Zap,
  FileText,
  Tag,
  TrendingUp,
  Sparkles,
  Check,
  Copy,
  ExternalLink
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SeoRecommendation {
  productId: string;
  productName: string;
  currentTitleEn?: string;
  currentTitleEt?: string;
  suggestedTitleEn: string;
  suggestedTitleEt: string;
  currentDescEn?: string;
  currentDescEt?: string;
  suggestedDescEn: string;
  suggestedDescEt: string;
  keywords: string[];
  keywordsEt: string[];
  score: number;
  improvements: string[];
  improvementsEt: string[];
}

interface SeoAnalysis {
  timestamp: string;
  productsAnalyzed: number;
  avgSeoScore: number;
  recommendations: SeoRecommendation[];
  topKeywords: { keyword: string; count: number }[];
  topKeywordsEt: { keyword: string; count: number }[];
  generalTips: string[];
  generalTipsEt: string[];
}

export default function AISeo() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: analysis, isLoading } = useQuery<SeoAnalysis>({
    queryKey: ['/api/admin/ai/seo'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/seo/analyze', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/seo'] });
      toast({
        title: language === 'et' ? 'SEO analüüs valmis!' : 'SEO analysis complete!',
        description: language === 'et' 
          ? 'AI on analüüsinud tootelehed' 
          : 'AI has analyzed product pages',
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-500';
    if (score >= 50) return 'bg-yellow-500/10 text-yellow-500';
    return 'bg-red-500/10 text-red-500';
  };

  return (
    <AdminLayout title={language === 'et' ? 'AI SEO' : 'AI SEO'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-seo-title">
                {language === 'et' ? 'Dünaamiline SEO' : 'Dynamic SEO'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Optimeeri tootelehed otsingumootoritele' 
                  : 'Optimize product pages for search engines'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            data-testid="button-analyze"
          >
            {analyzeMutation.isPending ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {language === 'et' ? 'Analüüsi' : 'Analyze'}
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
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'SEO pole veel analüüsitud' : 'SEO not analyzed yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Analüüsi" SEO soovituste saamiseks'
                : 'Click "Analyze" to get SEO recommendations'}
            </p>
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Analüüsi' : 'Analyze'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-products-analyzed">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Tooteid analüüsitud' : 'Products Analyzed'}
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.productsAnalyzed}</div>
                </CardContent>
              </Card>

              <Card data-testid="card-avg-score">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Keskmine skoor' : 'Average Score'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={cn("text-3xl font-bold", getScoreColor(analysis.avgSeoScore))}>
                    {analysis.avgSeoScore}%
                  </div>
                  <Progress value={analysis.avgSeoScore} className="mt-2" />
                </CardContent>
              </Card>

              <Card data-testid="card-keywords-en">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Võtmesõnad (EN)' : 'Keywords (EN)'}
                  </CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.topKeywords.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'populaarsed' : 'popular'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-keywords-et">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Võtmesõnad (ET)' : 'Keywords (ET)'}
                  </CardTitle>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.topKeywordsEt.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'populaarsed' : 'popular'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card data-testid="card-recommendations">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'SEO soovitused' : 'SEO Recommendations'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'et' 
                        ? 'Kliki tootel üksikasjade nägemiseks'
                        : 'Click on a product to see details'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {analysis.recommendations.map((rec) => (
                          <Card key={rec.productId} className="p-4">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h4 className="font-medium">{rec.productName}</h4>
                                <Badge className={cn("mt-1", getScoreBadge(rec.score))}>
                                  {language === 'et' ? 'Skoor' : 'Score'}: {rec.score}%
                                </Badge>
                              </div>
                            </div>

                            <Tabs defaultValue="en" className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="en">English</TabsTrigger>
                                <TabsTrigger value="et">Eesti</TabsTrigger>
                              </TabsList>

                              <TabsContent value="en" className="mt-3 space-y-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Title</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(rec.suggestedTitleEn, `title-en-${rec.productId}`)}
                                    >
                                      {copiedId === `title-en-${rec.productId}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-sm p-2 bg-muted/30 rounded">{rec.suggestedTitleEn}</p>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Meta Description</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(rec.suggestedDescEn, `desc-en-${rec.productId}`)}
                                    >
                                      {copiedId === `desc-en-${rec.productId}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-sm p-2 bg-muted/30 rounded">{rec.suggestedDescEn}</p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Keywords</span>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.keywords.map((kw, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Improvements</span>
                                  <ul className="text-sm space-y-1">
                                    {rec.improvements.map((imp, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        {imp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TabsContent>

                              <TabsContent value="et" className="mt-3 space-y-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Pealkiri</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(rec.suggestedTitleEt, `title-et-${rec.productId}`)}
                                    >
                                      {copiedId === `title-et-${rec.productId}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-sm p-2 bg-muted/30 rounded">{rec.suggestedTitleEt}</p>
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Meta kirjeldus</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(rec.suggestedDescEt, `desc-et-${rec.productId}`)}
                                    >
                                      {copiedId === `desc-et-${rec.productId}` ? (
                                        <Check className="h-3 w-3" />
                                      ) : (
                                        <Copy className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-sm p-2 bg-muted/30 rounded">{rec.suggestedDescEt}</p>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Võtmesõnad</span>
                                  <div className="flex flex-wrap gap-1">
                                    {rec.keywordsEt.map((kw, i) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-xs text-muted-foreground">Parandused</span>
                                  <ul className="text-sm space-y-1">
                                    {rec.improvementsEt.map((imp, i) => (
                                      <li key={i} className="flex items-start gap-2">
                                        <span className="text-primary">•</span>
                                        {imp}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card data-testid="card-top-keywords">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      {language === 'et' ? 'Populaarsed võtmesõnad' : 'Top Keywords'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">English</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysis.topKeywords.slice(0, 8).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw.keyword} ({kw.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Eesti</h4>
                        <div className="flex flex-wrap gap-1">
                          {analysis.topKeywordsEt.slice(0, 8).map((kw, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {kw.keyword} ({kw.count})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-tips">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'SEO näpunäited' : 'SEO Tips'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <ul className="space-y-2">
                        {(language === 'et' ? analysis.generalTipsEt : analysis.generalTips).map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
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
