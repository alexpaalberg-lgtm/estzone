import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Euro, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  RefreshCcw, 
  Filter, 
  Receipt,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/AdminLayout';
import { format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface FinancialOverview {
  totalRevenue: number;
  totalRefunds: number;
  totalFees: number;
  netRevenue: number;
  totalVat: number;
  transactionCount: number;
  orderCount: number;
  averageOrderValue: number;
  byGateway: { gateway: string; revenue: number; count: number }[];
  byStatus: { status: string; count: number }[];
}

interface PaymentTransaction {
  id: string;
  orderId: string | null;
  externalId: string | null;
  gateway: string;
  type: string;
  status: string;
  amount: string;
  currency: string;
  amountEur: string;
  fee: string | null;
  netAmount: string | null;
  vatAmount: string | null;
  customerEmail: string | null;
  customerName: string | null;
  description: string | null;
  metadata: any;
  processedAt: string | null;
  createdAt: string;
}

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
  gateway: string;
}

const GATEWAY_COLORS: Record<string, string> = {
  stripe: '#6366F1',
  paypal: '#0070BA',
  montonio: '#00BFA5',
  paysera: '#8B5CF6',
};

const GATEWAY_LABELS: Record<string, string> = {
  stripe: 'Stripe',
  paypal: 'PayPal',
  montonio: 'Montonio',
  paysera: 'Paysera',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'failed':
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getTypeBadgeVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (type) {
    case 'payment':
      return 'default';
    case 'refund':
      return 'destructive';
    case 'chargeback':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export default function AdminFinance() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<string>('30');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery<FinancialOverview>({
    queryKey: ['/api/admin/finance/overview'],
  });
  
  const { data: transactions, isLoading: transactionsLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/admin/finance/transactions', gatewayFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (gatewayFilter !== 'all') params.set('gateway', gatewayFilter);
      if (typeFilter !== 'all') params.set('type', typeFilter);
      params.set('limit', '100');
      const response = await fetch(`/api/admin/finance/transactions?${params.toString()}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
  });
  
  const { data: trends, isLoading: trendsLoading } = useQuery<RevenueTrend[]>({
    queryKey: ['/api/admin/finance/trends', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/finance/trends?days=${dateRange}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch trends');
      return response.json();
    },
  });
  
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/finance/sync');
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Sync Complete',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/finance'] });
      refetchOverview();
    },
    onError: (error: any) => {
      toast({
        title: 'Sync Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const aggregatedTrends = trends?.reduce((acc, trend) => {
    const existing = acc.find(t => t.date === trend.date);
    if (existing) {
      existing.revenue += trend.revenue;
      existing.orders += trend.orders;
      if (!existing.byGateway) existing.byGateway = {};
      existing.byGateway[trend.gateway] = (existing.byGateway[trend.gateway] || 0) + trend.revenue;
    } else {
      acc.push({
        date: trend.date,
        revenue: trend.revenue,
        orders: trend.orders,
        byGateway: { [trend.gateway]: trend.revenue },
      });
    }
    return acc;
  }, [] as { date: string; revenue: number; orders: number; byGateway: Record<string, number> }[]) || [];

  const chartData = aggregatedTrends.map(t => ({
    date: format(new Date(t.date), 'dd MMM'),
    fullDate: t.date,
    revenue: t.revenue,
    orders: t.orders,
    stripe: t.byGateway?.stripe || 0,
    paypal: t.byGateway?.paypal || 0,
    montonio: t.byGateway?.montonio || 0,
    paysera: t.byGateway?.paysera || 0,
  }));
  
  const pieData = overview?.byGateway?.map(g => ({
    name: GATEWAY_LABELS[g.gateway] || g.gateway,
    value: g.revenue,
    count: g.count,
    color: GATEWAY_COLORS[g.gateway] || '#888888',
  })) || [];

  return (
    <AdminLayout title="Financial Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight" data-testid="text-finance-title">
              Financial Dashboard
            </h2>
            <p className="text-muted-foreground">
              Unified view of all payment gateway transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-32" data-testid="select-date-range">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              data-testid="button-sync-payments"
            >
              <RefreshCcw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              Sync Orders
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-total-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(overview?.totalRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overview?.orderCount || 0} orders
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-refunds">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Refunds</CardTitle>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(overview?.totalRefunds || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Processing fees: {formatCurrency(overview?.totalFees || 0)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-net-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(overview?.netRevenue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After refunds & fees
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-vat">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VAT Collected</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(overview?.totalVat || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    24% VAT rate
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card data-testid="card-transactions">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {overview?.transactionCount || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-avg-order">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {formatCurrency(overview?.averageOrderValue || 0)}
                </div>
              )}
            </CardContent>
          </Card>

          {overview?.byGateway?.slice(0, 2).map((gateway) => (
            <Card key={gateway.gateway} data-testid={`card-gateway-${gateway.gateway}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {GATEWAY_LABELS[gateway.gateway] || gateway.gateway}
                </CardTitle>
                <CreditCard className="h-4 w-4" style={{ color: GATEWAY_COLORS[gateway.gateway] }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(gateway.revenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {gateway.count} transactions
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart" data-testid="tab-chart">Revenue Chart</TabsTrigger>
            <TabsTrigger value="gateways" data-testid="tab-gateways">By Gateway</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>
                  Daily revenue breakdown by payment gateway for the last {dateRange} days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trendsLoading ? (
                  <div className="h-[400px] flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                    No transaction data available for this period
                  </div>
                ) : (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="date" 
                          className="text-xs" 
                          tick={{ fill: 'currentColor' }}
                        />
                        <YAxis 
                          className="text-xs" 
                          tick={{ fill: 'currentColor' }}
                          tickFormatter={(value) => `€${value}`}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Area 
                          type="monotone" 
                          dataKey="stripe" 
                          name="Stripe"
                          stackId="1"
                          stroke={GATEWAY_COLORS.stripe} 
                          fill={GATEWAY_COLORS.stripe}
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="paypal" 
                          name="PayPal"
                          stackId="1"
                          stroke={GATEWAY_COLORS.paypal} 
                          fill={GATEWAY_COLORS.paypal}
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="montonio" 
                          name="Montonio"
                          stackId="1"
                          stroke={GATEWAY_COLORS.montonio} 
                          fill={GATEWAY_COLORS.montonio}
                          fillOpacity={0.6}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="paysera" 
                          name="Paysera"
                          stackId="1"
                          stroke={GATEWAY_COLORS.paysera} 
                          fill={GATEWAY_COLORS.paysera}
                          fillOpacity={0.6}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gateways" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Gateway</CardTitle>
                  <CardDescription>
                    Distribution of revenue across payment providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Skeleton className="h-[200px] w-[200px] rounded-full" />
                    </div>
                  ) : pieData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No gateway data available
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gateway Performance</CardTitle>
                  <CardDescription>
                    Transaction count and revenue comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Skeleton className="h-full w-full" />
                    </div>
                  ) : pieData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No gateway data available
                    </div>
                  ) : (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pieData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            type="number" 
                            tickFormatter={(value) => `€${value}`}
                            tick={{ fill: 'currentColor' }}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="name" 
                            width={80}
                            tick={{ fill: 'currentColor' }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => [
                              name === 'value' ? formatCurrency(value) : value,
                              name === 'value' ? 'Revenue' : 'Transactions'
                            ]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="value" name="Revenue">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Gateway Details</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gateway</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Avg Transaction</TableHead>
                      <TableHead className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview?.byGateway?.map((gateway) => {
                      const avgTransaction = gateway.count > 0 ? gateway.revenue / gateway.count : 0;
                      const share = overview.totalRevenue > 0 
                        ? (gateway.revenue / overview.totalRevenue * 100).toFixed(1) 
                        : '0';
                      return (
                        <TableRow key={gateway.gateway}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: GATEWAY_COLORS[gateway.gateway] || '#888' }}
                              />
                              <span className="font-medium">
                                {GATEWAY_LABELS[gateway.gateway] || gateway.gateway}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(gateway.revenue)}
                          </TableCell>
                          <TableCell className="text-right">
                            {gateway.count}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(avgTransaction)}
                          </TableCell>
                          <TableCell className="text-right">
                            {share}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(!overview?.byGateway || overview.byGateway.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No gateway data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                      All payment transactions across gateways
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
                      <SelectTrigger className="w-32" data-testid="select-gateway-filter">
                        <SelectValue placeholder="Gateway" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Gateways</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="montonio">Montonio</SelectItem>
                        <SelectItem value="paysera">Paysera</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-32" data-testid="select-type-filter">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                        <SelectItem value="refund">Refunds</SelectItem>
                        <SelectItem value="chargeback">Chargebacks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Gateway</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsLoading ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        </TableRow>
                      ))
                    ) : transactions?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No transactions found. Click "Sync Orders" to import existing order payments.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions?.map((tx) => (
                        <TableRow key={tx.id} data-testid={`row-transaction-${tx.id}`}>
                          <TableCell className="text-sm">
                            {format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: GATEWAY_COLORS[tx.gateway] || '#888' }}
                              />
                              <span className="text-sm">
                                {GATEWAY_LABELS[tx.gateway] || tx.gateway}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTypeBadgeVariant(tx.type)}>
                              {tx.type === 'payment' && <ArrowUpRight className="h-3 w-3 mr-1" />}
                              {tx.type === 'refund' && <ArrowDownRight className="h-3 w-3 mr-1" />}
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(tx.status)}>
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {tx.customerName || tx.customerEmail || '-'}
                            </div>
                            {tx.customerName && tx.customerEmail && (
                              <div className="text-xs text-muted-foreground">
                                {tx.customerEmail}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={tx.type === 'refund' ? 'text-red-600' : ''}>
                              {tx.type === 'refund' ? '-' : ''}
                              {formatCurrency(parseFloat(tx.amountEur))}
                            </span>
                            {tx.fee && parseFloat(tx.fee) > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Fee: {formatCurrency(parseFloat(tx.fee))}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {tx.orderId ? (
                              <a 
                                href={`/admin/orders?id=${tx.orderId}`}
                                className="text-primary hover:underline text-sm"
                              >
                                #{tx.orderId.slice(0, 8)}
                              </a>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
