import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users,
  RefreshCcw,
  Zap,
  Youtube,
  MessageSquare,
  Instagram,
  Twitter,
  DollarSign,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  Mail,
  Star
} from 'lucide-react';
import { SiTwitch, SiTiktok } from 'react-icons/si';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
type Platform = 'youtube' | 'twitch' | 'instagram' | 'tiktok' | 'twitter';

interface InfluencerProfile {
  id: string;
  name: string;
  platform: Platform;
  tier: InfluencerTier;
  niche: string;
  nicheEt: string;
  estimatedReach: number;
  engagementRate?: number;
  contentType: string;
  contentTypeEt: string;
  relevanceScore: number;
  notes: string;
}

interface OutreachPitch {
  influencerId: string;
  influencerName: string;
  subjectEn: string;
  subjectEt: string;
  messageEn: string;
  messageEt: string;
  proposedCollaboration: string;
  proposedCollaborationEt: string;
  suggestedProducts: string[];
  estimatedValue: number;
}

interface InfluencerAnalysis {
  timestamp: string;
  totalInfluencers: number;
  influencers: InfluencerProfile[];
  pitches: OutreachPitch[];
  strategies: string[];
  strategiesEt: string[];
  budgetRecommendation: {
    min: number;
    max: number;
    breakdown: { tier: string; budget: number }[];
  };
}

export default function AIInfluencers() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [budget, setBudget] = useState(1000);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPitch, setSelectedPitch] = useState<OutreachPitch | null>(null);

  const { data: analysis, isLoading } = useQuery<InfluencerAnalysis>({
    queryKey: ['/api/admin/ai/influencers'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/influencers/generate', { 
        budget,
        generatePitches: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/influencers'] });
      toast({
        title: language === 'et' ? 'Influencerid leitud!' : 'Influencers found!',
        description: language === 'et' 
          ? 'AI on leidnud sobivad influencerid' 
          : 'AI has found suitable influencers',
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

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'youtube': return <Youtube className="h-4 w-4 text-red-500" />;
      case 'twitch': return <SiTwitch className="h-4 w-4 text-purple-500" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-500" />;
      case 'tiktok': return <SiTiktok className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4 text-blue-400" />;
    }
  };

  const getTierBadge = (tier: InfluencerTier) => {
    const colors: Record<InfluencerTier, string> = {
      nano: 'bg-gray-500/10 text-gray-500',
      micro: 'bg-blue-500/10 text-blue-500',
      mid: 'bg-green-500/10 text-green-500',
      macro: 'bg-yellow-500/10 text-yellow-500',
      mega: 'bg-purple-500/10 text-purple-500',
    };
    const labels: Record<InfluencerTier, string> = {
      nano: 'Nano (<10K)',
      micro: 'Micro (10K-50K)',
      mid: 'Mid (50K-500K)',
      macro: 'Macro (500K-1M)',
      mega: 'Mega (>1M)',
    };
    return <Badge className={colors[tier]}>{labels[tier]}</Badge>;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  return (
    <AdminLayout title={language === 'et' ? 'AI Influencerid' : 'AI Influencers'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-influencers-title">
                {language === 'et' ? 'AI Influencer Outreach' : 'AI Influencer Outreach'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Leia mängu-influencereid ja genereeri pitchid' 
                  : 'Find gaming influencers and generate pitches'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="budget" className="text-sm whitespace-nowrap">
                {language === 'et' ? 'Eelarve:' : 'Budget:'}
              </Label>
              <Input
                id="budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                className="w-24"
                min={100}
                data-testid="input-budget"
              />
              <span className="text-sm text-muted-foreground">EUR</span>
            </div>

            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              data-testid="button-generate"
            >
              {generateMutation.isPending ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {language === 'et' ? 'Otsi' : 'Search'}
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
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Influencereid pole veel otsitud' : 'No influencers searched yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Sisesta eelarve ja vajuta "Otsi"'
                : 'Enter a budget and click "Search"'}
            </p>
            <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
              <Zap className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Otsi' : 'Search'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-influencers-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Influencereid' : 'Influencers'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.totalInfluencers}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'leitud' : 'found'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-pitches-count">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Pitchid' : 'Pitches'}
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{analysis.pitches.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'genereeritud' : 'generated'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-budget-min">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Min eelarve' : 'Min Budget'}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(analysis.budgetRecommendation.min)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'soovituslik' : 'recommended'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-budget-max">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Max eelarve' : 'Max Budget'}
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatPrice(analysis.budgetRecommendation.max)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'optimaalne' : 'optimal'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card data-testid="card-influencer-list">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {language === 'et' ? 'Leitud influencerid' : 'Found Influencers'}
                    </CardTitle>
                    <CardDescription>
                      {language === 'et' 
                        ? 'Kliki influenceril pitchi nägemiseks'
                        : 'Click on an influencer to see their pitch'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-3">
                        {analysis.influencers.map((influencer) => {
                          const pitch = analysis.pitches.find(p => p.influencerId === influencer.id);
                          return (
                            <Card 
                              key={influencer.id} 
                              className={cn(
                                "p-4 cursor-pointer transition-colors",
                                "hover:bg-muted/50"
                              )}
                              onClick={() => pitch && setSelectedPitch(pitch)}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-muted rounded-lg">
                                    {getPlatformIcon(influencer.platform)}
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{influencer.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {language === 'et' ? influencer.nicheEt : influencer.niche}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {getTierBadge(influencer.tier)}
                                      <span className="text-xs text-muted-foreground">
                                        {influencer.estimatedReach.toLocaleString()} {language === 'et' ? 'jälgijat' : 'followers'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={cn("flex items-center gap-1", getScoreColor(influencer.relevanceScore))}>
                                    <Star className="h-4 w-4" />
                                    <span className="font-bold">{influencer.relevanceScore}</span>
                                  </div>
                                  {influencer.engagementRate && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {influencer.engagementRate}% {language === 'et' ? 'kaasatus' : 'engagement'}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {influencer.notes && (
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  {influencer.notes}
                                </p>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card data-testid="card-strategies">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {language === 'et' ? 'Strateegiad' : 'Strategies'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[180px]">
                      <ul className="space-y-2">
                        {(language === 'et' ? analysis.strategiesEt : analysis.strategies).map((strategy, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {strategy}
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card data-testid="card-budget-breakdown">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      {language === 'et' ? 'Eelarve jaotus' : 'Budget Breakdown'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.budgetRecommendation.breakdown.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-sm">{item.tier}</span>
                          <Badge variant="outline">{formatPrice(item.budget)}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        <Dialog open={!!selectedPitch} onOpenChange={() => setSelectedPitch(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedPitch && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    {language === 'et' ? 'Pitch:' : 'Pitch:'} {selectedPitch.influencerName}
                  </DialogTitle>
                  <DialogDescription>
                    {language === 'et' ? selectedPitch.proposedCollaborationEt : selectedPitch.proposedCollaboration}
                  </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="en" className="mt-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="en">English</TabsTrigger>
                    <TabsTrigger value="et">Eesti</TabsTrigger>
                  </TabsList>

                  <TabsContent value="en" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Subject</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedPitch.subjectEn, 'subject-en')}
                        >
                          {copiedId === 'subject-en' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {selectedPitch.subjectEn}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Message</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedPitch.messageEn, 'message-en')}
                        >
                          {copiedId === 'message-en' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                        {selectedPitch.messageEn}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="et" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Teema</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedPitch.subjectEt, 'subject-et')}
                        >
                          {copiedId === 'subject-et' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm">
                        {selectedPitch.subjectEt}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Sõnum</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(selectedPitch.messageEt, 'message-et')}
                        >
                          {copiedId === 'message-et' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm whitespace-pre-wrap">
                        {selectedPitch.messageEt}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'et' ? 'Soovitatud tooted:' : 'Suggested products:'}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPitch.suggestedProducts.map((product, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{product}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">
                      {language === 'et' ? 'Hinnanguline väärtus:' : 'Estimated value:'}
                    </span>
                    <Badge className="bg-primary">{formatPrice(selectedPitch.estimatedValue)}</Badge>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
