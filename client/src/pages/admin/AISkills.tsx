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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  GraduationCap,
  RefreshCcw,
  Zap,
  Target,
  Sparkles,
  Star,
  Medal,
  Trophy,
  Users,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SkillLevel = 'beginner' | 'intermediate' | 'pro';

interface ProductSkillData {
  productId: string;
  productName: string;
  productNameEt: string;
  price: number;
  category: string;
  skillLevel: SkillLevel;
  skillReason: string;
  skillReasonEt: string;
  features: string[];
  recommendedFor: string;
  recommendedForEt: string;
}

interface SkillLevelGroup {
  level: SkillLevel;
  labelEn: string;
  labelEt: string;
  descriptionEn: string;
  descriptionEt: string;
  products: ProductSkillData[];
  priceRange: { min: number; max: number };
  topPick?: ProductSkillData;
}

interface SkillAnalysis {
  timestamp: string;
  totalProducts: number;
  categorizedProducts: number;
  skillGroups: SkillLevelGroup[];
  insights: string[];
  categoryBreakdown: { category: string; beginner: number; intermediate: number; pro: number }[];
}

export default function AISkills() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>('beginner');

  const { data: analysis, isLoading } = useQuery<SkillAnalysis>({
    queryKey: ['/api/admin/ai/skills'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/skills/analyze');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/skills'] });
      toast({
        title: language === 'et' ? 'Analüüs lõpetatud!' : 'Analysis complete!',
        description: language === 'et' 
          ? 'Oskustasemete analüüs on tehtud' 
          : 'Skill level analysis has been performed',
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

  const getSkillIcon = (level: SkillLevel) => {
    switch (level) {
      case 'beginner': return <Star className="h-5 w-5" />;
      case 'intermediate': return <Medal className="h-5 w-5" />;
      case 'pro': return <Trophy className="h-5 w-5" />;
    }
  };

  const getSkillColor = (level: SkillLevel) => {
    switch (level) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'pro': return 'text-purple-500';
    }
  };

  const getSkillBg = (level: SkillLevel) => {
    switch (level) {
      case 'beginner': return 'bg-green-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'pro': return 'bg-purple-500';
    }
  };

  const beginnerGroup = analysis?.skillGroups.find(g => g.level === 'beginner');
  const intermediateGroup = analysis?.skillGroups.find(g => g.level === 'intermediate');
  const proGroup = analysis?.skillGroups.find(g => g.level === 'pro');

  const selectedGroup = analysis?.skillGroups.find(g => g.level === selectedLevel);

  return (
    <AdminLayout title={language === 'et' ? 'Oskustasemed' : 'Skill Levels'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-skills-title">
                {language === 'et' ? 'Oskustaseme Soovitused' : 'Skill Level Recommendations'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Toodete kategoriseerimine kogemustaseme järgi' 
                  : 'Categorize products by experience level'}
              </p>
            </div>
          </div>

          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            data-testid="button-analyze-skills"
          >
            {analyzeMutation.isPending ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {language === 'et' ? 'Analüüsi tooteid' : 'Analyze Products'}
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
            <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Analüüsi pole veel tehtud' : 'No analysis performed yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Analüüsi tooteid" kategoriseerimiseks'
                : 'Click "Analyze Products" to categorize by skill level'}
            </p>
            <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Analüüsi tooteid' : 'Analyze Products'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-categorized">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Kategoriseeritud' : 'Categorized'}
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.categorizedProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    / {analysis.totalProducts} {language === 'et' ? 'toodet' : 'products'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-green-500/20" data-testid="card-beginner">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
                    {language === 'et' ? 'Algaja' : 'Beginner'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-500">
                    {beginnerGroup?.products.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {beginnerGroup && beginnerGroup.priceRange.min > 0 
                      ? `${formatPrice(beginnerGroup.priceRange.min)} - ${formatPrice(beginnerGroup.priceRange.max)}`
                      : '-'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-yellow-500/20" data-testid="card-intermediate">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Medal className="h-4 w-4 text-yellow-500" />
                    {language === 'et' ? 'Keskmine' : 'Intermediate'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-500">
                    {intermediateGroup?.products.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {intermediateGroup && intermediateGroup.priceRange.min > 0 
                      ? `${formatPrice(intermediateGroup.priceRange.min)} - ${formatPrice(intermediateGroup.priceRange.max)}`
                      : '-'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-purple-500/20" data-testid="card-pro">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-purple-500" />
                    {language === 'et' ? 'Profi' : 'Pro'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-500">
                    {proGroup?.products.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {proGroup && proGroup.priceRange.min > 0 
                      ? `${formatPrice(proGroup.priceRange.min)} - ${formatPrice(proGroup.priceRange.max)}`
                      : '-'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as SkillLevel)}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="beginner" className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      {language === 'et' ? 'Algaja' : 'Beginner'}
                    </TabsTrigger>
                    <TabsTrigger value="intermediate" className="flex items-center gap-2">
                      <Medal className="h-4 w-4" />
                      {language === 'et' ? 'Keskmine' : 'Intermediate'}
                    </TabsTrigger>
                    <TabsTrigger value="pro" className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {language === 'et' ? 'Profi' : 'Pro'}
                    </TabsTrigger>
                  </TabsList>

                  {['beginner', 'intermediate', 'pro'].map((level) => {
                    const group = analysis.skillGroups.find(g => g.level === level);
                    return (
                      <TabsContent key={level} value={level} className="mt-4">
                        {group && (
                          <Card>
                            <CardHeader>
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", getSkillBg(level as SkillLevel))}>
                                  {getSkillIcon(level as SkillLevel)}
                                </div>
                                <div>
                                  <CardTitle>
                                    {language === 'et' ? group.labelEt : group.labelEn}
                                  </CardTitle>
                                  <CardDescription>
                                    {language === 'et' ? group.descriptionEt : group.descriptionEn}
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <ScrollArea className="h-[350px]">
                                <div className="space-y-3">
                                  {group.products.slice(0, 20).map((product) => (
                                    <div 
                                      key={product.productId}
                                      className={cn(
                                        "p-3 rounded-lg border",
                                        product.productId === group.topPick?.productId && "bg-primary/5 border-primary/30"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                              {language === 'et' ? product.productNameEt : product.productName}
                                            </span>
                                            {product.productId === group.topPick?.productId && (
                                              <Badge className="bg-primary">
                                                {language === 'et' ? 'Parim valik' : 'Top Pick'}
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-sm text-muted-foreground mb-2">
                                            {language === 'et' ? product.skillReasonEt : product.skillReason}
                                          </p>
                                          {product.features.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {product.features.map((feature, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                  {feature}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold">{formatPrice(product.price)}</p>
                                          <p className="text-xs text-muted-foreground">{product.category}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </CardContent>
                          </Card>
                        )}
                      </TabsContent>
                    );
                  })}
                </Tabs>
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
                    <ScrollArea className="h-[150px]">
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

                <Card data-testid="card-distribution">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      {language === 'et' ? 'Jaotus' : 'Distribution'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Star className="h-4 w-4 text-green-500" />
                            {language === 'et' ? 'Algaja' : 'Beginner'}
                          </span>
                          <span className="text-sm font-medium">
                            {beginnerGroup?.products.length || 0}
                          </span>
                        </div>
                        <Progress 
                          value={((beginnerGroup?.products.length || 0) / analysis.categorizedProducts) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Medal className="h-4 w-4 text-yellow-500" />
                            {language === 'et' ? 'Keskmine' : 'Intermediate'}
                          </span>
                          <span className="text-sm font-medium">
                            {intermediateGroup?.products.length || 0}
                          </span>
                        </div>
                        <Progress 
                          value={((intermediateGroup?.products.length || 0) / analysis.categorizedProducts) * 100} 
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-purple-500" />
                            {language === 'et' ? 'Profi' : 'Pro'}
                          </span>
                          <span className="text-sm font-medium">
                            {proGroup?.products.length || 0}
                          </span>
                        </div>
                        <Progress 
                          value={((proGroup?.products.length || 0) / analysis.categorizedProducts) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-categories">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {language === 'et' ? 'Kategooriad' : 'Categories'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {analysis.categoryBreakdown.slice(0, 8).map((cat, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                            <span className="text-sm font-medium truncate">{cat.category}</span>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-green-500">{cat.beginner}</span>
                              <span className="text-yellow-500">{cat.intermediate}</span>
                              <span className="text-purple-500">{cat.pro}</span>
                            </div>
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
