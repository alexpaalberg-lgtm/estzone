import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles,
  RefreshCcw,
  Zap,
  Home,
  Gamepad2,
  Bed,
  Briefcase,
  Video,
  Sun,
  Lightbulb,
  Copy,
  Check,
  Image
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Product } from '@shared/schema';

type RoomType = 'living_room' | 'gaming_room' | 'bedroom' | 'office' | 'studio';
type LightingStyle = 'natural' | 'ambient' | 'gaming_rgb' | 'warm' | 'cool';

interface ProductVisualization {
  id: string;
  productId: string;
  productName: string;
  roomType: RoomType;
  promptEn: string;
  promptEt: string;
  description: string;
  descriptionEt: string;
  suggestionsEn: string[];
  suggestionsEt: string[];
  createdAt: string;
}

interface VisualizationResponse {
  visualization: ProductVisualization;
  tips: { en: string[]; et: string[] };
}

export default function AIProductViz() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [roomType, setRoomType] = useState<RoomType>('gaming_room');
  const [lightingStyle, setLightingStyle] = useState<LightingStyle>('natural');
  const [additionalContext, setAdditionalContext] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastVisualization, setLastVisualization] = useState<VisualizationResponse | null>(null);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const generateMutation = useMutation({
    mutationFn: async (): Promise<VisualizationResponse> => {
      const response = await apiRequest('POST', '/api/admin/ai/visualize', { 
        productId: selectedProductId,
        roomType,
        lightingStyle,
        additionalContext: additionalContext || undefined,
      });
      return response as unknown as VisualizationResponse;
    },
    onSuccess: (data) => {
      setLastVisualization(data);
      toast({
        title: language === 'et' ? 'Visualiseering loodud!' : 'Visualization created!',
        description: language === 'et' 
          ? 'AI on loonud toote visualiseeringu' 
          : 'AI has created product visualization',
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

  const getRoomIcon = (room: RoomType) => {
    switch (room) {
      case 'living_room': return <Home className="h-4 w-4" />;
      case 'gaming_room': return <Gamepad2 className="h-4 w-4" />;
      case 'bedroom': return <Bed className="h-4 w-4" />;
      case 'office': return <Briefcase className="h-4 w-4" />;
      case 'studio': return <Video className="h-4 w-4" />;
    }
  };

  const roomLabels: Record<RoomType, { en: string; et: string }> = {
    living_room: { en: 'Living Room', et: 'Elutuba' },
    gaming_room: { en: 'Gaming Room', et: 'Mängutuba' },
    bedroom: { en: 'Bedroom', et: 'Magamistuba' },
    office: { en: 'Home Office', et: 'Kodukontor' },
    studio: { en: 'Streaming Studio', et: 'Voogesituse stuudio' },
  };

  const lightingLabels: Record<LightingStyle, { en: string; et: string }> = {
    natural: { en: 'Natural Daylight', et: 'Looduslik päevavalgus' },
    ambient: { en: 'Soft Ambient', et: 'Pehme ümbertav' },
    gaming_rgb: { en: 'RGB Gaming', et: 'RGB mängu' },
    warm: { en: 'Warm Cozy', et: 'Soe hubane' },
    cool: { en: 'Cool Modern', et: 'Jahe moodne' },
  };

  const featuredProducts = products?.filter(p => p.isFeatured && p.isActive).slice(0, 20) || [];

  return (
    <AdminLayout title={language === 'et' ? 'AR Tootevaade' : 'AR Product View'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Image className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-viz-title">
                {language === 'et' ? 'AI Toote Visualiseerimine' : 'AI Product Visualization'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Genereeri toote paigutuse prompte ruumides' 
                  : 'Generate product placement prompts for rooms'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1" data-testid="card-viz-builder">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {language === 'et' ? 'Visualiseeringu ehitaja' : 'Visualization Builder'}
              </CardTitle>
              <CardDescription>
                {language === 'et' 
                  ? 'Vali toode ja ruumi seaded'
                  : 'Select product and room settings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{language === 'et' ? 'Toode' : 'Product'}</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger data-testid="select-product">
                    <SelectValue placeholder={language === 'et' ? 'Vali toode...' : 'Select product...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {featuredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nameEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Ruumi tüüp' : 'Room Type'}</Label>
                <Select value={roomType} onValueChange={(v) => setRoomType(v as RoomType)}>
                  <SelectTrigger data-testid="select-room">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roomLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {getRoomIcon(key as RoomType)}
                          {language === 'et' ? label.et : label.en}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Valgustus' : 'Lighting'}</Label>
                <Select value={lightingStyle} onValueChange={(v) => setLightingStyle(v as LightingStyle)}>
                  <SelectTrigger data-testid="select-lighting">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(lightingLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {key === 'natural' ? <Sun className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />}
                          {language === 'et' ? label.et : label.en}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Lisa kontekst (valikuline)' : 'Additional Context (optional)'}</Label>
                <Textarea
                  placeholder={language === 'et' ? 'nt valge laud, minimalistlik stiil...' : 'e.g. white desk, minimalist style...'}
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="resize-none"
                  rows={3}
                  data-testid="textarea-context"
                />
              </div>

              <Button
                className="w-full"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || !selectedProductId}
                data-testid="button-generate"
              >
                {generateMutation.isPending ? (
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {language === 'et' ? 'Genereeri visualiseering' : 'Generate Visualization'}
              </Button>
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            {!lastVisualization ? (
              <Card className="h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <Image className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'et' ? 'Visualiseeringut pole veel' : 'No visualization yet'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'et' 
                      ? 'Vali toode ja genereeri visualiseering'
                      : 'Select a product and generate visualization'}
                  </p>
                </div>
              </Card>
            ) : (
              <Card data-testid="card-viz-result">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getRoomIcon(lastVisualization.visualization.roomType)}
                        {lastVisualization.visualization.productName}
                      </CardTitle>
                      <CardDescription>
                        {language === 'et' 
                          ? lastVisualization.visualization.descriptionEt 
                          : lastVisualization.visualization.description}
                      </CardDescription>
                    </div>
                    <Badge>
                      {language === 'et' 
                        ? roomLabels[lastVisualization.visualization.roomType].et 
                        : roomLabels[lastVisualization.visualization.roomType].en}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>English Prompt</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(lastVisualization.visualization.promptEn, 'prompt-en')}
                        >
                          {copiedId === 'prompt-en' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm max-h-[200px] overflow-y-auto">
                        {lastVisualization.visualization.promptEn}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Eesti Prompt</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(lastVisualization.visualization.promptEt, 'prompt-et')}
                        >
                          {copiedId === 'prompt-et' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/30 rounded-lg text-sm max-h-[200px] overflow-y-auto">
                        {lastVisualization.visualization.promptEt}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'et' ? 'Paigutuse soovitused' : 'Placement Suggestions'}</Label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {(language === 'et' 
                        ? lastVisualization.visualization.suggestionsEt 
                        : lastVisualization.visualization.suggestionsEn
                      ).map((suggestion, i) => (
                        <div key={i} className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-sm">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {lastVisualization && (
          <Card data-testid="card-room-tips">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                {language === 'et' ? 'Ruumi näpunäited' : 'Room Tips'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[150px]">
                <div className="grid gap-2 md:grid-cols-2">
                  {(language === 'et' ? lastVisualization.tips.et : lastVisualization.tips.en).map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {tip}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
