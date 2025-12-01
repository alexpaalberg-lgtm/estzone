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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mail,
  Send,
  Users,
  RefreshCcw,
  Zap,
  Target,
  TrendingUp,
  Clock,
  Sparkles,
  Eye,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  ShoppingCart,
  Heart,
  Megaphone
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type CampaignType = 'promotional' | 'newsletter' | 'announcement' | 'winback' | 'abandoned_cart';

interface EmailCampaign {
  id: string;
  name: string;
  subjectEn: string;
  subjectEt: string;
  bodyEn: string;
  bodyEt: string;
  type: CampaignType;
  targetAudience: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

interface CampaignData {
  stats: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  };
  campaigns: EmailCampaign[];
}

export default function AIEmailCampaigns() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [campaignType, setCampaignType] = useState<CampaignType>('promotional');
  const [occasion, setOccasion] = useState('');
  const [discount, setDiscount] = useState(15);
  const [customMessage, setCustomMessage] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<EmailCampaign | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<'en' | 'et'>('en');

  const { data, isLoading } = useQuery<CampaignData>({
    queryKey: ['/api/admin/ai/email-campaigns'],
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/email-campaigns/generate', {
        type: campaignType,
        occasion: occasion || undefined,
        discount: campaignType === 'promotional' || campaignType === 'winback' ? discount : undefined,
        customMessage: customMessage || undefined,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/email-campaigns'] });
      setSelectedCampaign(data as any);
      toast({
        title: language === 'et' ? 'Kampaania loodud!' : 'Campaign generated!',
        description: language === 'et' 
          ? 'AI lõi uue meilikampaania' 
          : 'AI created a new email campaign',
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

  const sendMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      return apiRequest('POST', '/api/admin/ai/email-campaigns/send', {
        campaignId,
        targetAudience: 'all',
      });
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/email-campaigns'] });
      toast({
        title: language === 'et' ? 'Meilid saadetud!' : 'Emails sent!',
        description: language === 'et' 
          ? `Edukalt saadetud ${result.successful}/${result.totalSent} meilile` 
          : `Successfully sent to ${result.successful}/${result.totalSent} recipients`,
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

  const getTypeIcon = (type: CampaignType) => {
    switch (type) {
      case 'promotional': return <Megaphone className="h-4 w-4" />;
      case 'newsletter': return <Mail className="h-4 w-4" />;
      case 'announcement': return <AlertCircle className="h-4 w-4" />;
      case 'winback': return <Heart className="h-4 w-4" />;
      case 'abandoned_cart': return <ShoppingCart className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: CampaignType) => {
    const labels: Record<CampaignType, { en: string; et: string; color: string }> = {
      promotional: { en: 'Promotional', et: 'Kampaania', color: 'bg-amber-500' },
      newsletter: { en: 'Newsletter', et: 'Uudiskiri', color: 'bg-blue-500' },
      announcement: { en: 'Announcement', et: 'Teadaanne', color: 'bg-purple-500' },
      winback: { en: 'Win-back', et: 'Tagasivõit', color: 'bg-pink-500' },
      abandoned_cart: { en: 'Cart Recovery', et: 'Ostukorvi', color: 'bg-orange-500' },
    };
    const label = labels[type];
    return (
      <Badge className={cn(label.color, 'text-white')}>
        {language === 'et' ? label.et : label.en}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500">{language === 'et' ? 'Saadetud' : 'Sent'}</Badge>;
      case 'draft':
        return <Badge variant="secondary">{language === 'et' ? 'Mustand' : 'Draft'}</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">{language === 'et' ? 'Planeeritud' : 'Scheduled'}</Badge>;
      case 'sending':
        return <Badge className="bg-amber-500">{language === 'et' ? 'Saatmisel' : 'Sending'}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                {language === 'et' ? 'AI Meilikampaaniad' : 'AI Email Campaigns'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'et' 
                  ? 'Loo ja saada AI-genereeritud meilikampaaniaid' 
                  : 'Create and send AI-generated email campaigns'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Kokku tellijaid' : 'Total Subscribers'}
                  </p>
                  <p className="text-2xl font-bold">{data?.stats.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Aktiivsed' : 'Active'}
                  </p>
                  <p className="text-2xl font-bold">{data?.stats.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <UserPlus className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Uued sel kuul' : 'New This Month'}
                  </p>
                  <p className="text-2xl font-bold">{data?.stats.newThisMonth || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Send className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Kampaaniaid' : 'Campaigns'}
                  </p>
                  <p className="text-2xl font-bold">{data?.campaigns?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === 'et' ? 'Loo uus kampaania' : 'Create New Campaign'}
              </CardTitle>
              <CardDescription>
                {language === 'et' 
                  ? 'AI genereerib sinu jaoks professionaalse meilikampaania'
                  : 'AI will generate a professional email campaign for you'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'et' ? 'Kampaania tüüp' : 'Campaign Type'}</Label>
                <Select value={campaignType} onValueChange={(v) => setCampaignType(v as CampaignType)}>
                  <SelectTrigger data-testid="select-campaign-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4" />
                        {language === 'et' ? 'Kampaania / Soodustus' : 'Promotional / Sale'}
                      </div>
                    </SelectItem>
                    <SelectItem value="newsletter">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {language === 'et' ? 'Uudiskiri' : 'Newsletter'}
                      </div>
                    </SelectItem>
                    <SelectItem value="announcement">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {language === 'et' ? 'Teadaanne' : 'Announcement'}
                      </div>
                    </SelectItem>
                    <SelectItem value="winback">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        {language === 'et' ? 'Tagasivõit (inaktiivsed)' : 'Win-back (inactive)'}
                      </div>
                    </SelectItem>
                    <SelectItem value="abandoned_cart">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        {language === 'et' ? 'Ostukorvi meeldetuletus' : 'Abandoned Cart'}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(campaignType === 'promotional' || campaignType === 'winback') && (
                <div className="space-y-2">
                  <Label>{language === 'et' ? 'Soodustus %' : 'Discount %'}</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={discount}
                    onChange={(e) => setDiscount(parseInt(e.target.value) || 15)}
                    data-testid="input-discount"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Sündmus / Põhjus (valikuline)' : 'Occasion (optional)'}</Label>
                <Input
                  placeholder={language === 'et' ? 'nt. Jõulud, Must Reede, Suvi' : 'e.g. Christmas, Black Friday, Summer'}
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  data-testid="input-occasion"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Lisasõnum (valikuline)' : 'Custom Message (optional)'}</Label>
                <Textarea
                  placeholder={language === 'et' ? 'Lisa oma sõnum...' : 'Add your custom message...'}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-20"
                  data-testid="input-custom-message"
                />
              </div>

              <Button
                className="w-full"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                data-testid="button-generate-campaign"
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {language === 'et' ? 'Eelvaade' : 'Preview'}
              </CardTitle>
              {selectedCampaign && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewLanguage === 'en' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={previewLanguage === 'et' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewLanguage('et')}
                  >
                    Eesti
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {selectedCampaign ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(selectedCampaign.type)}
                    {getStatusBadge(selectedCampaign.status)}
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      {language === 'et' ? 'Teema:' : 'Subject:'}
                    </p>
                    <p className="font-semibold">
                      {previewLanguage === 'et' ? selectedCampaign.subjectEt : selectedCampaign.subjectEn}
                    </p>
                  </div>

                  <ScrollArea className="h-64 border rounded-lg">
                    <div 
                      className="p-4"
                      dangerouslySetInnerHTML={{ 
                        __html: previewLanguage === 'et' ? selectedCampaign.bodyEt : selectedCampaign.bodyEn 
                      }}
                    />
                  </ScrollArea>

                  {selectedCampaign.status === 'draft' && (
                    <Button
                      className="w-full"
                      onClick={() => sendMutation.mutate(selectedCampaign.id)}
                      disabled={sendMutation.isPending}
                      data-testid="button-send-campaign"
                    >
                      {sendMutation.isPending ? (
                        <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {language === 'et' 
                        ? `Saada ${data?.stats.active || 0} tellijale` 
                        : `Send to ${data?.stats.active || 0} subscribers`}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Mail className="h-12 w-12 mb-4 opacity-50" />
                  <p>{language === 'et' ? 'Genereeri kampaania eelvaateks' : 'Generate a campaign to preview'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'et' ? 'Varasemad kampaaniad' : 'Previous Campaigns'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.campaigns && data.campaigns.length > 0 ? (
              <div className="space-y-3">
                {data.campaigns.map((campaign) => (
                  <div 
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCampaign(campaign)}
                    data-testid={`campaign-${campaign.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getTypeIcon(campaign.type)}
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(campaign.createdAt), 'dd MMM yyyy HH:mm', {
                            locale: language === 'et' ? et : enGB
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(campaign.status)}
                      {campaign.recipientCount > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {campaign.recipientCount} {language === 'et' ? 'saajat' : 'recipients'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{language === 'et' ? 'Kampaaniaid pole veel' : 'No campaigns yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
