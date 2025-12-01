import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { et, enGB } from 'date-fns/locale';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  CalendarIcon, 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  Package, 
  Users, 
  MessageSquare,
  Ticket,
  RefreshCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  Euro
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface DailyReport {
  date: string;
  summary: {
    totalOrders: number;
    totalRevenue: string;
    averageOrderValue: string;
    newCustomers: number;
    returningCustomers: number;
    topProducts: Array<{ id: string; name: string; quantity: number; revenue: string }>;
    lowStockAlerts: number;
    couponsUsed: number;
    couponDiscount: string;
    chatSessions: number;
    conversionRate: string;
  };
  aiInsights: string[];
  recommendations: string[];
  alerts: Array<{ type: 'warning' | 'info' | 'success'; message: string }>;
  trends: {
    revenueChange: number;
    ordersChange: number;
    customersChange: number;
  };
}

export default function AIReports() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: report, isLoading, refetch } = useQuery<DailyReport>({
    queryKey: ['/api/admin/ai/reports', dateStr],
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      return apiRequest('POST', '/api/admin/ai/reports/generate', { date: dateStr });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/reports', dateStr] });
      toast({
        title: language === 'et' ? 'Raport genereeritud!' : 'Report generated!',
        description: language === 'et' ? 'AI analüüs on valmis' : 'AI analysis is complete',
      });
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message,
      });
      setIsGenerating(false);
    },
  });

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const quickDates = [
    { label: language === 'et' ? 'Täna' : 'Today', date: new Date() },
    { label: language === 'et' ? 'Eile' : 'Yesterday', date: subDays(new Date(), 1) },
    { label: language === 'et' ? '7 päeva tagasi' : '7 days ago', date: subDays(new Date(), 7) },
  ];

  return (
    <AdminLayout title={language === 'et' ? 'AI Raportid' : 'AI Reports'}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-ai-reports-title">
                {language === 'et' ? 'AI Päevaraportid' : 'AI Daily Reports'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {language === 'et' 
                  ? 'Automaatsed kokkuvõtted ja soovitused' 
                  : 'Automated summaries and recommendations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {quickDates.map((qd) => (
              <Button
                key={qd.label}
                variant={format(selectedDate, 'yyyy-MM-dd') === format(qd.date, 'yyyy-MM-dd') ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDate(qd.date)}
                data-testid={`button-quick-date-${qd.label}`}
              >
                {qd.label}
              </Button>
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-date-picker">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {format(selectedDate, 'dd.MM.yyyy', { locale: language === 'et' ? et : enGB })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={() => generateReportMutation.mutate()}
              disabled={isGenerating || generateReportMutation.isPending}
              data-testid="button-generate-report"
            >
              {isGenerating ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {language === 'et' ? 'Genereeri raport' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !report ? (
          <Card className="p-12 text-center">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Raportit pole veel' : 'No report yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {language === 'et' 
                ? 'Vajuta "Genereeri raport", et luua AI analüüs sellele kuupäevale'
                : 'Click "Generate Report" to create an AI analysis for this date'}
            </p>
            <Button onClick={() => generateReportMutation.mutate()} disabled={isGenerating}>
              <Sparkles className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Genereeri raport' : 'Generate Report'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-stat-orders">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Tellimused' : 'Orders'}
                  </CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{report.summary.totalOrders}</div>
                    {getTrendIcon(report.trends.ordersChange)}
                    {report.trends.ordersChange !== 0 && (
                      <span className={cn(
                        "text-sm",
                        report.trends.ordersChange > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {report.trends.ordersChange > 0 ? '+' : ''}{report.trends.ordersChange}%
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'võrreldes eelmise päevaga' : 'compared to previous day'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-revenue">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Tulu' : 'Revenue'}
                  </CardTitle>
                  <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                      {formatPrice(parseFloat(report.summary.totalRevenue))}
                    </div>
                    {getTrendIcon(report.trends.revenueChange)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'Keskmine tellimus' : 'Avg order'}: {formatPrice(parseFloat(report.summary.averageOrderValue))}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-customers">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Kliendid' : 'Customers'}
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {report.summary.newCustomers + report.summary.returningCustomers}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.summary.newCustomers} {language === 'et' ? 'uut' : 'new'}, {report.summary.returningCustomers} {language === 'et' ? 'naasvat' : 'returning'}
                  </p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-coupons">
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {language === 'et' ? 'Kupongid' : 'Coupons'}
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{report.summary.couponsUsed}</div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'et' ? 'Soodustused' : 'Discounts'}: {formatPrice(parseFloat(report.summary.couponDiscount))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2" data-testid="card-ai-insights">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'AI Ülevaade' : 'AI Insights'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' ? 'Automaatselt genereeritud analüüs' : 'Automatically generated analysis'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="insights">
                    <TabsList className="mb-4">
                      <TabsTrigger value="insights" data-testid="tab-insights">
                        {language === 'et' ? 'Ülevaade' : 'Insights'}
                      </TabsTrigger>
                      <TabsTrigger value="recommendations" data-testid="tab-recommendations">
                        {language === 'et' ? 'Soovitused' : 'Recommendations'}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="insights">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {report.aiInsights.map((insight, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                              <Brain className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <p className="text-sm">{insight}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="recommendations">
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3">
                          {report.recommendations.map((rec, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card data-testid="card-alerts">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      {language === 'et' ? 'Hoiatused' : 'Alerts'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {report.alerts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {language === 'et' ? 'Hoiatusi pole' : 'No alerts'}
                          </p>
                        ) : (
                          report.alerts.map((alert, i) => (
                            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30">
                              {getAlertIcon(alert.type)}
                              <span className="text-sm">{alert.message}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card data-testid="card-top-products">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      {language === 'et' ? 'Populaarsed tooted' : 'Top Products'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[150px]">
                      <div className="space-y-2">
                        {report.summary.topProducts.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            {language === 'et' ? 'Andmeid pole' : 'No data'}
                          </p>
                        ) : (
                          report.summary.topProducts.map((product, i) => (
                            <div key={product.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                                <span className="text-sm font-medium truncate max-w-[120px]">{product.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold">{formatPrice(parseFloat(product.revenue))}</div>
                                <div className="text-xs text-muted-foreground">{product.quantity} tk</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card data-testid="card-additional-stats">
              <CardHeader>
                <CardTitle>{language === 'et' ? 'Lisastatistika' : 'Additional Statistics'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <MessageSquare className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="text-2xl font-bold">{report.summary.chatSessions}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'et' ? 'Vestlussessiooni' : 'Chat sessions'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                    <div>
                      <div className="text-2xl font-bold">{report.summary.lowStockAlerts}</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'et' ? 'Madala laoseisu hoiatust' : 'Low stock alerts'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-500" />
                    <div>
                      <div className="text-2xl font-bold">{report.summary.conversionRate}%</div>
                      <div className="text-sm text-muted-foreground">
                        {language === 'et' ? 'Konversioonimäär' : 'Conversion rate'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
