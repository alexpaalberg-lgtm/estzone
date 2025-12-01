import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { et, enGB } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Megaphone,
  RefreshCcw,
  Zap,
  Mail,
  Share2,
  Image,
  Bell,
  Target,
  TrendingUp,
  Users,
  Clock,
  Sparkles,
  Copy,
  Check,
  ShoppingBag,
  Heart,
  UserX
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CampaignGoal = 'sales' | 'awareness' | 'retention' | 'winback';
type CampaignType = 'email' | 'social' | 'banner' | 'push';

interface CampaignContent {
  type: CampaignType;
  titleEn: string;
  titleEt: string;
  bodyEn: string;
  bodyEt: string;
  ctaEn: string;
  ctaEt: string;
  hashtagsEn?: string[];
  hashtagsEt?: string[];
}

interface GeneratedCampaign {
  id: string;
  name: string;
  goal: CampaignGoal;
  targetAudience: string;
  targetAudienceEt: string;
  contents: CampaignContent[];
  productIds?: string[];
  productNames?: string[];
  estimatedReach: number;
  suggestedBudget?: number;
  suggestedDuration: string;
  createdAt: string;
}

interface CampaignAnalysis {
  timestamp: string;
  campaignsGenerated: number;
  campaigns: GeneratedCampaign[];
  tips: string[];
  bestPractices: string[];
}

export default function AICampaigns() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [goal, setGoal] = useState<CampaignGoal>('sales');
  const [occasion, setOccasion] = useState('');
  const [discount, setDiscount] = useState(15);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: analysis, isLoading } = useQuery<CampaignAnalysis>({
    queryKey: ['/api/admin/ai/campaigns'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/campaigns/generate', { 
        goal,
        occasion: occasion || undefined,
        discount: goal === 'sales' || goal === 'winback' ? discount : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/campaigns'] });
      toast({
        title: language === 'et' ? 'Kampaania loodud!' : 'Campaign generated!',
        description: language === 'et' 
          ? 'AI on loonud turunduskampaania' 
          : 'AI has created marketing campaign',
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
    toast({
      title: language === 'et' ? 'Kopeeritud!' : 'Copied!',
    });
  };

  const getGoalIcon = (g: CampaignGoal) => {
    switch (g) {
      case 'sales': return <ShoppingBag className="h-4 w-4" />;
      case 'awareness': return <Megaphone className="h-4 w-4" />;
      case 'retention': return <Heart className="h-4 w-4" />;
      case 'winback': return <UserX className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: CampaignType) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'banner': return <Image className="h-4 w-4" />;
      case 'push': return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: CampaignType) => {
    const labels: Record<CampaignType, { en: string; et: string }> = {
      email: { en: 'Email', et: 'Email' },
      social: { en: 'Social Media', et: 'Sotsiaalmeedia' },
      banner: { en: 'Banner Ad', et: 'Bännerreklaam' },
      push: { en: 'Push Notification', et: 'Teavitus' },
    };
    return labels[type][language];
  };

  const getGoalLabel = (g: CampaignGoal) => {
    const labels: Record<CampaignGoal, { en: string; et: string }> = {
      sales: { en: 'Drive Sales', et: 'Müügi suurendamine' },
      awareness: { en: 'Brand Awareness', et: 'Brändi tuntus' },
      retention: { en: 'Customer Retention', et: 'Kliendi hoidmine' },
      winback: { en: 'Win-Back', et: 'Tagasivõitmine' },
    };
    return labels[g][language];
  };

  const latestCampaign = analysis?.campaigns[0];

  return (
    <AdminLayout title={language === 'et' ? 'AI Kampaaniad' : 'AI Campaigns'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-campaigns-title">
                {language === 'et' ? 'AI Kampaaniageneraator' : 'AI Campaign Generator'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Genereeri turundussisu mõlemas keeles' 
                  : 'Generate marketing content in both languages'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1" data-testid="card-campaign-builder">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {language === 'et' ? 'Kampaania ehitaja' : 'Campaign Builder'}
              </CardTitle>
              <CardDescription>
                {language === 'et' 
                  ? 'Vali eesmärk ja seadista parameetrid'
                  : 'Select goal and configure parameters'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'et' ? 'Eesmärk' : 'Goal'}</Label>
                <Select value={goal} onValueChange={(v) => setGoal(v as CampaignGoal)}>
                  <SelectTrigger data-testid="select-goal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4" />
                        {language === 'et' ? 'Müügi suurendamine' : 'Drive Sales'}
                      </div>
                    </SelectItem>
                    <SelectItem value="awareness">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        {language === 'et' ? 'Brändi tuntus' : 'Brand Awareness'}
                      </div>
                    </SelectItem>
                    <SelectItem value="retention">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {language === 'et' ? 'Kliendi hoidmine' : 'Customer Retention'}
                      </div>
                    </SelectItem>
                    <SelectItem value="winback">
                      <div className="flex items-center gap-2">
                        <UserX className="h-4 w-4" />
                        {language === 'et' ? 'Tagasivõitmine' : 'Win-Back'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(goal === 'sales' || goal === 'winback') && (
                <div className="space-y-2">
                  <Label>{language === 'et' ? 'Allahindlus %' : 'Discount %'}</Label>
                  <Input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                    min={5}
                    max={50}
                    data-testid="input-discount"
                  />
                </div>
              )}

              {goal === 'sales' && (
                <div className="space-y-2">
                  <Label>{language === 'et' ? 'Sündmus (valikuline)' : 'Occasion (optional)'}</Label>
                  <Input
                    placeholder={language === 'et' ? 'nt Black Friday' : 'e.g. Black Friday'}
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    data-testid="input-occasion"
                  />
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {language === 'et' ? 'Genereeri kampaania' : 'Generate Campaign'}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-[400px]" />
            ) : !latestCampaign ? (
              <Card className="h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <Megaphone className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'et' ? 'Kampaaniat pole veel' : 'No campaign yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'et' 
                      ? 'Vali eesmärk ja genereeri oma esimene kampaania'
                      : 'Select a goal and generate your first campaign'}
                  </p>
                </div>
              </Card>
            ) : (
              <Card data-testid="card-campaign-result">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getGoalIcon(latestCampaign.goal)}
                        {latestCampaign.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {latestCampaign.estimatedReach.toLocaleString()} {language === 'et' ? 'kontakti' : 'reach'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {latestCampaign.suggestedDuration}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge>{getGoalLabel(latestCampaign.goal)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue={latestCampaign.contents[0]?.type || 'email'}>
                    <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${latestCampaign.contents.length}, 1fr)` }}>
                      {latestCampaign.contents.map((content) => (
                        <TabsTrigger key={content.type} value={content.type} className="flex items-center gap-2">
                          {getTypeIcon(content.type)}
                          <span className="hidden sm:inline">{getTypeLabel(content.type)}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {latestCampaign.contents.map((content) => (
                      <TabsContent key={content.type} value={content.type} className="mt-4 space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">English</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${content.titleEn}\n\n${content.bodyEn}\n\n${content.ctaEn}`, `en-${content.type}`)}
                              >
                                {copiedId === `en-${content.type}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div>
                              <p className="font-bold text-lg">{content.titleEn}</p>
                              <p className="text-sm text-muted-foreground mt-2">{content.bodyEn}</p>
                              <Button size="sm" className="mt-3">{content.ctaEn}</Button>
                            </div>
                            {content.hashtagsEn && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {content.hashtagsEn.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">Eesti</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(`${content.titleEt}\n\n${content.bodyEt}\n\n${content.ctaEt}`, `et-${content.type}`)}
                              >
                                {copiedId === `et-${content.type}` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            <div>
                              <p className="font-bold text-lg">{content.titleEt}</p>
                              <p className="text-sm text-muted-foreground mt-2">{content.bodyEt}</p>
                              <Button size="sm" className="mt-3">{content.ctaEt}</Button>
                            </div>
                            {content.hashtagsEt && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {content.hashtagsEt.map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {analysis && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card data-testid="card-tips">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {language === 'et' ? 'Näpunäited' : 'Tips'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {analysis.tips.map((tip, i) => (
                      <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <p className="text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card data-testid="card-best-practices">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {language === 'et' ? 'Parimad praktikad' : 'Best Practices'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {analysis.bestPractices.map((practice, i) => (
                      <div key={i} className="p-3 bg-muted/30 rounded-lg flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <p className="text-sm">{practice}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
