import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { 
  Package,
  RefreshCcw,
  Zap,
  Settings,
  Clock,
  Play,
  Pause,
  TrendingUp,
  Image,
  Star,
  CheckCircle2,
  AlertTriangle,
  Gamepad2,
  Sparkles
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AutoProductSettings {
  enabled: boolean;
  intervalDays: number;
  maxProductsPerRun: number;
  platforms: string[];
  priceRangeMin: number;
  priceRangeMax: number;
}

interface ProductAdditionResult {
  timestamp: string;
  productsAdded: number;
  products: Array<{
    nameEn: string;
    nameEt: string;
    platform: string;
    price: number;
    imageUrl: string;
    rawgRating: number;
  }>;
  skipped: number;
  errors: string[];
  demandAnalysis: {
    trendingGenres: string[];
    popularPlatforms: string[];
    recommendations: string[];
    recommendationsEt: string[];
  };
}

interface AutoProductData {
  settings: AutoProductSettings;
  lastRun: ProductAdditionResult | null;
}

const platformOptions = [
  { id: 'playstation', label: 'PlayStation', labelEt: 'PlayStation' },
  { id: 'xbox', label: 'Xbox', labelEt: 'Xbox' },
  { id: 'nintendo', label: 'Nintendo Switch', labelEt: 'Nintendo Switch' },
  { id: 'pc', label: 'PC', labelEt: 'PC' },
];

export default function AIAutoProducts() {
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<AutoProductSettings>({
    enabled: false,
    intervalDays: 3,
    maxProductsPerRun: 5,
    platforms: ['playstation', 'xbox', 'nintendo'],
    priceRangeMin: 19.99,
    priceRangeMax: 79.99,
  });
  const [hasInitialized, setHasInitialized] = useState(false);

  const { data, isLoading } = useQuery<AutoProductData>({
    queryKey: ['/api/admin/ai/auto-products'],
  });

  useEffect(() => {
    if (data?.settings && !hasInitialized) {
      setSettings({
        enabled: data.settings.enabled ?? false,
        intervalDays: data.settings.intervalDays ?? 3,
        maxProductsPerRun: data.settings.maxProductsPerRun ?? 5,
        platforms: data.settings.platforms ?? ['playstation', 'xbox', 'nintendo'],
        priceRangeMin: data.settings.priceRangeMin ?? 19.99,
        priceRangeMax: data.settings.priceRangeMax ?? 79.99,
      });
      setHasInitialized(true);
    }
  }, [data?.settings, hasInitialized]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: AutoProductSettings) => {
      return apiRequest('POST', '/api/admin/ai/auto-products/settings', newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/auto-products'] });
      toast({
        title: language === 'et' ? 'Seaded salvestatud!' : 'Settings saved!',
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

  const runNowMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/auto-products/run', settings);
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/auto-products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      toast({
        title: language === 'et' ? 'Tooted lisatud!' : 'Products added!',
        description: language === 'et' 
          ? `Lisatud ${result.productsAdded} uut toodet` 
          : `Added ${result.productsAdded} new products`,
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

  const togglePlatform = (platformId: string) => {
    setSettings(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId],
    }));
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'playstation': return 'bg-blue-500';
      case 'xbox': return 'bg-green-500';
      case 'nintendo': return 'bg-red-500';
      case 'pc': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  const effectiveSettings = data?.settings || settings;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">
                {language === 'et' ? 'AI Automaatne Toodete Lisamine' : 'AI Auto Product Addition'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'et' 
                  ? 'AI lisab automaatselt uusi mänge RAWG API-st premium piltidega' 
                  : 'AI automatically adds new games from RAWG API with premium images'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => runNowMutation.mutate()}
            disabled={runNowMutation.isPending}
            data-testid="button-run-now"
          >
            {runNowMutation.isPending ? (
              <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {language === 'et' ? 'Käivita kohe' : 'Run Now'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    effectiveSettings.enabled ? "bg-green-500/10" : "bg-gray-500/10"
                  )}>
                    {effectiveSettings.enabled ? (
                      <Play className="h-5 w-5 text-green-500" />
                    ) : (
                      <Pause className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {language === 'et' ? 'Staatus' : 'Status'}
                    </p>
                    <p className="font-semibold">
                      {effectiveSettings.enabled 
                        ? (language === 'et' ? 'Aktiivne' : 'Active')
                        : (language === 'et' ? 'Peatatud' : 'Paused')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Intervall' : 'Interval'}
                  </p>
                  <p className="font-semibold">
                    {language === 'et' 
                      ? `Iga ${effectiveSettings.intervalDays} päeva` 
                      : `Every ${effectiveSettings.intervalDays} days`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' ? 'Tooteid korraga' : 'Products per run'}
                  </p>
                  <p className="font-semibold">{effectiveSettings.maxProductsPerRun}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {language === 'et' ? 'Seaded' : 'Settings'}
              </CardTitle>
              <CardDescription>
                {language === 'et' 
                  ? 'Konfigureeri automaatse lisamise seaded'
                  : 'Configure auto addition settings'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{language === 'et' ? 'Automaatne lisamine' : 'Auto Addition'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {language === 'et' 
                      ? 'Luba automaatne toodete lisamine'
                      : 'Enable automatic product addition'}
                  </p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                  data-testid="switch-enabled"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Intervall (päevades)' : 'Interval (days)'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.intervalDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, intervalDays: parseInt(e.target.value) || 3 }))}
                  data-testid="input-interval"
                />
              </div>

              <div className="space-y-2">
                <Label>{language === 'et' ? 'Max tooteid korraga' : 'Max products per run'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settings.maxProductsPerRun}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxProductsPerRun: parseInt(e.target.value) || 5 }))}
                  data-testid="input-max-products"
                />
              </div>

              <div className="space-y-3">
                <Label>{language === 'et' ? 'Platvormid' : 'Platforms'}</Label>
                <div className="space-y-2">
                  {platformOptions.map(platform => (
                    <div key={platform.id} className="flex items-center gap-2">
                      <Checkbox
                        id={platform.id}
                        checked={settings.platforms.includes(platform.id)}
                        onCheckedChange={() => togglePlatform(platform.id)}
                        data-testid={`checkbox-${platform.id}`}
                      />
                      <label htmlFor={platform.id} className="text-sm cursor-pointer">
                        {language === 'et' ? platform.labelEt : platform.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === 'et' ? 'Min hind (€)' : 'Min price (€)'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.priceRangeMin}
                    onChange={(e) => setSettings(prev => ({ ...prev, priceRangeMin: parseFloat(e.target.value) || 19.99 }))}
                    data-testid="input-min-price"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === 'et' ? 'Max hind (€)' : 'Max price (€)'}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={settings.priceRangeMax}
                    onChange={(e) => setSettings(prev => ({ ...prev, priceRangeMax: parseFloat(e.target.value) || 79.99 }))}
                    data-testid="input-max-price"
                  />
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => updateSettingsMutation.mutate(settings)}
                disabled={updateSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                {updateSettingsMutation.isPending ? (
                  <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                {language === 'et' ? 'Salvesta seaded' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === 'et' ? 'Viimane käivitus' : 'Last Run'}
              </CardTitle>
              {data?.lastRun && (
                <CardDescription>
                  {format(new Date(data.lastRun.timestamp), 'dd MMM yyyy HH:mm', {
                    locale: language === 'et' ? et : enGB
                  })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {data?.lastRun ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-green-500">
                        {data.lastRun.productsAdded}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'et' ? 'Lisatud' : 'Added'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-amber-500">
                        {data.lastRun.skipped}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'et' ? 'Vahele jäetud' : 'Skipped'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-500/10 rounded-lg">
                      <p className="text-2xl font-bold text-red-500">
                        {data.lastRun.errors.length}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'et' ? 'Vigu' : 'Errors'}
                      </p>
                    </div>
                  </div>

                  {data.lastRun.products.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">
                        {language === 'et' ? 'Lisatud tooted:' : 'Added products:'}
                      </p>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {data.lastRun.products.map((product, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-3 p-2 border rounded-lg"
                            >
                              <img 
                                src={product.imageUrl} 
                                alt={product.nameEn}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {language === 'et' ? product.nameEt : product.nameEn}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Badge className={cn(getPlatformBadgeColor(product.platform), "text-xs")}>
                                    {product.platform}
                                  </Badge>
                                  <span>€{product.price.toFixed(2)}</span>
                                  <span className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-amber-500" />
                                    {product.rawgRating.toFixed(1)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {data.lastRun.demandAnalysis && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="font-medium text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        {language === 'et' ? 'Turuanalüüs' : 'Market Analysis'}
                      </p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {(language === 'et' 
                          ? data.lastRun.demandAnalysis.recommendationsEt 
                          : data.lastRun.demandAnalysis.recommendations
                        ).map((rec, idx) => (
                          <p key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {rec}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mb-4 opacity-50" />
                  <p>{language === 'et' ? 'Pole veel käivitatud' : 'Not run yet'}</p>
                  <p className="text-sm">{language === 'et' ? 'Klõpsa "Käivita kohe"' : 'Click "Run Now" to start'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
