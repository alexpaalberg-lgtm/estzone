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
  Euro,
  BarChart3,
  Layers,
  Boxes,
  Target,
  Zap
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
  salesAnalysis?: {
    peakHours: Array<{ hour: number; orders: number }>;
    bestDays: Array<{ day: string; orders: number; revenue: string }>;
    frequentlyBoughtTogether: Array<{ product1: string; product2: string; count: number }>;
  };
  customerBehavior?: {
    topCategories: Array<{ id: string; name: string; orders: number; revenue: string }>;
    weeklyOrderCount: number;
    weeklyRevenue: string;
  };
  inventoryAnalysis?: {
    criticalStock: Array<{ id: string; name: string; stock: number; sku: string }>;
    slowMoving: Array<{ id: string; name: string; stock: number; price: string }>;
    totalLowStock: number;
    totalProducts: number;
  };
  financialForecast?: {
    weeklyRevenue: Array<{ date: string; revenue: number }>;
    avgDailyRevenue: string;
    forecastNextWeek: string;
    forecastNextMonth: string;
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

            {/* MÜÜGIANALÜÜS */}
            {report.salesAnalysis && (
              <Card data-testid="card-sales-analysis">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'Müügianalüüs' : 'Sales Analysis'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' ? 'Tipptunnid, parimad päevad ja koos ostetud tooted' : 'Peak hours, best days and frequently bought together'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {language === 'et' ? 'Tipptunnid' : 'Peak Hours'}
                      </h4>
                      <div className="space-y-2">
                        {(report.salesAnalysis.peakHours || []).map((h, i) => (
                          <div key={i} data-testid={`row-peak-hour-${i}`} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="font-medium">{h.hour}:00 - {h.hour + 1}:00</span>
                            <Badge variant="secondary">{h.orders} {language === 'et' ? 'tellimust' : 'orders'}</Badge>
                          </div>
                        ))}
                        {(!report.salesAnalysis.peakHours || report.salesAnalysis.peakHours.length === 0) && (
                          <p className="text-sm text-muted-foreground">{language === 'et' ? 'Andmeid pole' : 'No data'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {language === 'et' ? 'Parimad päevad' : 'Best Days'}
                      </h4>
                      <div className="space-y-2">
                        {(report.salesAnalysis.bestDays || []).map((d, i) => (
                          <div key={i} data-testid={`row-best-day-${i}`} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <span className="font-medium">{d.day}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatPrice(parseFloat(d.revenue || '0'))}</div>
                              <div className="text-xs text-muted-foreground">{d.orders} {language === 'et' ? 'tellimust' : 'orders'}</div>
                            </div>
                          </div>
                        ))}
                        {(!report.salesAnalysis.bestDays || report.salesAnalysis.bestDays.length === 0) && (
                          <p className="text-sm text-muted-foreground">{language === 'et' ? 'Andmeid pole' : 'No data'}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4" />
                        {language === 'et' ? 'Koos ostetud' : 'Bought Together'}
                      </h4>
                      <div className="space-y-2">
                        {(report.salesAnalysis.frequentlyBoughtTogether || []).length > 0 ? (
                          (report.salesAnalysis.frequentlyBoughtTogether || []).map((pair, i) => (
                            <div key={i} data-testid={`row-fbt-${i}`} className="p-2 bg-muted/30 rounded text-sm">
                              <span className="font-medium">{pair.product1}</span>
                              <span className="text-muted-foreground"> + </span>
                              <span className="font-medium">{pair.product2}</span>
                              <Badge variant="outline" className="ml-2">{pair.count}x</Badge>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">{language === 'et' ? 'Andmeid pole piisavalt' : 'Not enough data'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* KLIENDIKÄITUMINE */}
            {report.customerBehavior && (
              <Card data-testid="card-customer-behavior">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'Kliendikäitumine' : 'Customer Behavior'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' ? 'Kategooriate müük ja nädala statistika' : 'Category sales and weekly statistics'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-3">{language === 'et' ? 'Populaarsed kategooriad (7 päeva)' : 'Top Categories (7 days)'}</h4>
                      <div className="space-y-2">
                        {(report.customerBehavior.topCategories || []).map((cat, i) => (
                          <div key={cat.id} data-testid={`row-category-${cat.id}`} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">#{i + 1}</Badge>
                              <span className="font-medium">{cat.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatPrice(parseFloat(cat.revenue || '0'))}</div>
                              <div className="text-xs text-muted-foreground">{cat.orders} {language === 'et' ? 'toodet' : 'items'}</div>
                            </div>
                          </div>
                        ))}
                        {(!report.customerBehavior.topCategories || report.customerBehavior.topCategories.length === 0) && (
                          <p className="text-sm text-muted-foreground">{language === 'et' ? 'Andmeid pole' : 'No data'}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div data-testid="stat-weekly-orders" className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-3xl font-bold text-primary">{report.customerBehavior.weeklyOrderCount || 0}</div>
                        <div className="text-sm text-muted-foreground">{language === 'et' ? 'Tellimust (7 päeva)' : 'Orders (7 days)'}</div>
                      </div>
                      <div data-testid="stat-weekly-revenue" className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-3xl font-bold text-primary">{formatPrice(parseFloat(report.customerBehavior.weeklyRevenue || '0'))}</div>
                        <div className="text-sm text-muted-foreground">{language === 'et' ? 'Tulu (7 päeva)' : 'Revenue (7 days)'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* LAOSTATISTIKA */}
            {report.inventoryAnalysis && (
              <Card data-testid="card-inventory-analysis">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'Laostatistika' : 'Inventory Analysis'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' ? 'Kriitilised tooted ja aeglaselt liikuv kaup' : 'Critical stock and slow-moving products'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        {language === 'et' ? 'Kriitiline laoseis (0-3 tk)' : 'Critical Stock (0-3 items)'}
                      </h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                          {(report.inventoryAnalysis.criticalStock || []).length > 0 ? (
                            (report.inventoryAnalysis.criticalStock || []).map((p) => (
                              <div key={p.id} data-testid={`row-critical-${p.id}`} className="flex justify-between items-center p-2 bg-red-500/10 border border-red-500/20 rounded">
                                <div>
                                  <div className="font-medium text-sm">{p.name}</div>
                                  <div className="text-xs text-muted-foreground">SKU: {p.sku}</div>
                                </div>
                                <Badge variant="destructive">{p.stock} tk</Badge>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{language === 'et' ? 'Kriitilisi tooteid pole' : 'No critical products'}</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2 text-yellow-500">
                        <Clock className="h-4 w-4" />
                        {language === 'et' ? 'Aeglaselt liikuv kaup' : 'Slow-Moving Products'}
                      </h4>
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-2 pr-4">
                          {(report.inventoryAnalysis.slowMoving || []).length > 0 ? (
                            (report.inventoryAnalysis.slowMoving || []).map((p) => (
                              <div key={p.id} data-testid={`row-slow-${p.id}`} className="flex justify-between items-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                <div className="font-medium text-sm truncate max-w-[200px]">{p.name}</div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold">{formatPrice(parseFloat(p.price || '0'))}</div>
                                  <div className="text-xs text-muted-foreground">{p.stock} tk laos</div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{language === 'et' ? 'Kõik tooted liiguvad hästi' : 'All products moving well'}</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                    <div data-testid="stat-low-stock" className="text-center p-3 bg-muted/30 rounded">
                      <div className="text-2xl font-bold">{report.inventoryAnalysis.totalLowStock || 0}</div>
                      <div className="text-sm text-muted-foreground">{language === 'et' ? 'Madala laoseisuga toodet' : 'Low stock products'}</div>
                    </div>
                    <div data-testid="stat-total-products" className="text-center p-3 bg-muted/30 rounded">
                      <div className="text-2xl font-bold">{report.inventoryAnalysis.totalProducts || 0}</div>
                      <div className="text-sm text-muted-foreground">{language === 'et' ? 'Aktiivset toodet kokku' : 'Total active products'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* FINANTSPROGNOOS */}
            {report.financialForecast && (
              <Card data-testid="card-financial-forecast">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'Finantsprognoos' : 'Financial Forecast'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'et' ? 'Käibe trend ja ennustused' : 'Revenue trend and predictions'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-2">
                      <h4 className="font-semibold mb-3">{language === 'et' ? 'Viimase 7 päeva käive' : 'Last 7 Days Revenue'}</h4>
                      <div className="space-y-2">
                        {(report.financialForecast.weeklyRevenue || []).map((day) => {
                          const maxRevenue = Math.max(...(report.financialForecast?.weeklyRevenue || []).map(d => d.revenue || 0), 1);
                          return (
                            <div key={day.date} data-testid={`row-revenue-${day.date}`} className="flex items-center gap-3">
                              <span className="text-sm w-24 text-muted-foreground">{day.date}</span>
                              <div className="flex-1 bg-muted/30 rounded-full h-6 overflow-hidden">
                                <div 
                                  className="bg-primary h-full rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min(100, ((day.revenue || 0) / maxRevenue) * 100)}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm font-medium w-20 text-right">{formatPrice(day.revenue || 0)}</span>
                            </div>
                          );
                        })}
                        {(!report.financialForecast.weeklyRevenue || report.financialForecast.weeklyRevenue.length === 0) && (
                          <p className="text-sm text-muted-foreground">{language === 'et' ? 'Andmeid pole' : 'No data'}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div data-testid="stat-avg-daily" className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="text-sm text-muted-foreground mb-1">{language === 'et' ? 'Keskmine päevatulu' : 'Avg Daily Revenue'}</div>
                        <div className="text-2xl font-bold text-primary">{formatPrice(parseFloat(report.financialForecast.avgDailyRevenue || '0'))}</div>
                      </div>
                      <div data-testid="stat-forecast-week" className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {language === 'et' ? 'Ennustus: järgmine nädal' : 'Forecast: Next Week'}
                        </div>
                        <div className="text-2xl font-bold text-green-600">{formatPrice(parseFloat(report.financialForecast.forecastNextWeek || '0'))}</div>
                      </div>
                      <div data-testid="stat-forecast-month" className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
                        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {language === 'et' ? 'Ennustus: järgmine kuu' : 'Forecast: Next Month'}
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{formatPrice(parseFloat(report.financialForecast.forecastNextMonth || '0'))}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
