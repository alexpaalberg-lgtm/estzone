import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ArrowLeft, 
  Eye, 
  Users, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  TrendingUp,
  RefreshCw,
  Activity,
  ExternalLink
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';

interface TrafficStats {
  totalViews: number;
  uniqueSessions: number;
  realtimeVisitors: number;
  viewsByDay: Array<{ date: string; views: number; sessions: number }>;
  topPages: Array<{ path: string; views: number; unique_visitors: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  referrerBreakdown: Array<{ source: string; count: number }>;
  topProducts: Array<{ product_id: string; name_en: string; name_et: string; views: number }>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const getDeviceIcon = (device: string) => {
  switch (device?.toLowerCase()) {
    case 'mobile': return <Smartphone className="h-4 w-4" />;
    case 'tablet': return <Tablet className="h-4 w-4" />;
    default: return <Monitor className="h-4 w-4" />;
  }
};

export default function AdminTraffic() {
  const [period, setPeriod] = useState('7d');
  
  const { data: stats, isLoading, refetch, isFetching } = useQuery<TrafficStats>({
    queryKey: ['/api/admin/traffic/stats', period],
    refetchInterval: 30000,
  });

  const formatPath = (path: string) => {
    if (path === '/') return 'Avaleht / Home';
    if (path.startsWith('/product/')) return `Toode: ${path.split('/')[2]?.substring(0, 8)}...`;
    if (path.startsWith('/products/')) return `Kategooria: ${path.split('/')[2]}`;
    if (path === '/products') return 'Kõik tooted / All Products';
    if (path === '/cart') return 'Ostukorv / Cart';
    if (path === '/checkout') return 'Maksmine / Checkout';
    if (path === '/blog') return 'Blogi / Blog';
    return path;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" data-testid="button-back-admin">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Liikluse Statistika</h1>
              <p className="text-muted-foreground">100% täpne, serveri-põhine jälgimine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]" data-testid="select-period">
                <SelectValue placeholder="Periood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Viimased 24h</SelectItem>
                <SelectItem value="7d">Viimased 7 päeva</SelectItem>
                <SelectItem value="30d">Viimased 30 päeva</SelectItem>
                <SelectItem value="90d">Viimased 90 päeva</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Värskenda
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Kokku vaatamisi</p>
                      <p className="text-3xl font-bold" data-testid="text-total-views">
                        {stats?.totalViews?.toLocaleString() || 0}
                      </p>
                    </div>
                    <Eye className="h-8 w-8 text-primary opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Unikaalsed külastajad</p>
                      <p className="text-3xl font-bold" data-testid="text-unique-sessions">
                        {stats?.uniqueSessions?.toLocaleString() || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-green-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Praegu lehel</p>
                      <p className="text-3xl font-bold text-green-500" data-testid="text-realtime">
                        {stats?.realtimeVisitors || 0}
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-green-500 animate-pulse" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Lehed/külastaja</p>
                      <p className="text-3xl font-bold" data-testid="text-pages-per-session">
                        {stats?.uniqueSessions ? (stats.totalViews / stats.uniqueSessions).toFixed(1) : '0'}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500 opacity-80" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Külastatavus päevade lõikes</CardTitle>
                  <CardDescription>Vaatamised ja unikaalsed külastajad</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.viewsByDay && stats.viewsByDay.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={[...(stats.viewsByDay || [])].reverse()}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('et-EE', { day: '2-digit', month: '2-digit' })}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString('et-EE', { weekday: 'long', day: 'numeric', month: 'long' })}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Area type="monotone" dataKey="views" name="Vaatamisi" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="sessions" name="Külastajaid" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Andmeid pole veel. Külasta lehte, et alustada jälgimist.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Liikluse allikad</CardTitle>
                  <CardDescription>Kust külastajad tulevad</CardDescription>
                </CardHeader>
                <CardContent>
                  {stats?.referrerBreakdown && stats.referrerBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.referrerBreakdown}
                          dataKey="count"
                          nameKey="source"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        >
                          {stats.referrerBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      Andmeid pole veel
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Seadmed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.deviceBreakdown && stats.deviceBreakdown.length > 0 ? (
                      stats.deviceBreakdown.map((item, index) => {
                        const total = stats.deviceBreakdown.reduce((sum, d) => sum + Number(d.count), 0);
                        const percent = total > 0 ? (Number(item.count) / total * 100).toFixed(1) : 0;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getDeviceIcon(item.device)}
                              <span className="capitalize">{item.device || 'Tundmatu'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{percent}%</Badge>
                              <span className="text-muted-foreground text-sm">{item.count}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Andmeid pole veel</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Brauserid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.browserBreakdown && stats.browserBreakdown.length > 0 ? (
                      stats.browserBreakdown.slice(0, 5).map((item, index) => {
                        const total = stats.browserBreakdown.reduce((sum, b) => sum + Number(b.count), 0);
                        const percent = total > 0 ? (Number(item.count) / total * 100).toFixed(1) : 0;
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4" />
                              <span>{item.browser || 'Tundmatu'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{percent}%</Badge>
                              <span className="text-muted-foreground text-sm">{item.count}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Andmeid pole veel</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Populaarsemad tooted</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                      stats.topProducts.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                          <span className="text-sm truncate flex-1">{item.name_et || item.name_en}</span>
                          <Badge>{item.views} vaatamist</Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">Andmeid pole veel</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Populaarsemad lehed</CardTitle>
                <CardDescription>TOP 20 enim külastatud lehte</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.topPages && stats.topPages.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4">Leht</th>
                          <th className="text-right py-3 px-4">Vaatamisi</th>
                          <th className="text-right py-3 px-4">Unikaalseid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.topPages.map((page, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground w-6">{index + 1}.</span>
                                <span>{formatPath(page.path)}</span>
                                {page.path !== '/' && (
                                  <a 
                                    href={page.path} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </td>
                            <td className="text-right py-3 px-4 font-medium">{page.views}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">{page.unique_visitors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Andmeid pole veel. Jälgimine algas just - külasta lehte, et näha statistikat.
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
