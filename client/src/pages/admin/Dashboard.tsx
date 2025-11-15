import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Package, ShoppingCart, AlertTriangle, Euro, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/components/AdminLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import type { Order, Product } from '@shared/schema';

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  lowStockCount: number;
  totalRevenue: string;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/stats'],
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    refetch();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'processing':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const statsCards = [
    {
      title: t.admin.totalProducts,
      value: stats?.totalProducts ?? 0,
      icon: Package,
      testId: 'stat-total-products',
    },
    {
      title: t.admin.totalOrders,
      value: stats?.totalOrders ?? 0,
      icon: ShoppingCart,
      testId: 'stat-total-orders',
    },
    {
      title: t.admin.lowStock,
      value: stats?.lowStockCount ?? 0,
      icon: AlertTriangle,
      testId: 'stat-low-stock',
    },
    {
      title: t.admin.totalRevenue,
      value: stats?.totalRevenue ? formatPrice(parseFloat(stats.totalRevenue)) : formatPrice(0),
      icon: Euro,
      testId: 'stat-total-revenue',
    },
  ];

  return (
    <AdminLayout title={t.admin.dashboard}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">
            {t.admin.dashboard}
          </h2>
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            variant="outline"
            size="sm"
            data-testid="button-refresh"
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
            {t.admin.refreshData}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <Card key={card.testId} data-testid={card.testId}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div className="text-2xl font-bold" data-testid={`${card.testId}-value`}>
                    {card.value}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-recent-orders">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>{t.admin.recentOrders}</CardTitle>
              <Button asChild variant="outline" size="sm" data-testid="button-view-all-orders">
                <Link href="/admin/orders">{t.admin.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.recentOrders && stats.recentOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.admin.orderNumber}</TableHead>
                      <TableHead>{t.admin.date}</TableHead>
                      <TableHead>{t.admin.total}</TableHead>
                      <TableHead>{t.admin.status}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.recentOrders.map((order) => (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-medium" data-testid={`text-order-number-${order.id}`}>
                          {order.orderNumber}
                        </TableCell>
                        <TableCell data-testid={`text-order-date-${order.id}`}>
                          {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                        </TableCell>
                        <TableCell data-testid={`text-order-total-${order.id}`}>
                          {formatPrice(parseFloat(order.total))}
                        </TableCell>
                        <TableCell data-testid={`badge-order-status-${order.id}`}>
                          <Badge variant={getStatusBadgeVariant(order.status)}>
                            {t.admin[`status${order.status.charAt(0).toUpperCase() + order.status.slice(1)}` as keyof typeof t.admin] || order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-recent-orders">
                  {t.admin.noRecentOrders}
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-low-stock">
            <CardHeader>
              <CardTitle>{t.admin.lowStockAlerts}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t.admin.productName}</TableHead>
                      <TableHead>{t.admin.currentStock}</TableHead>
                      <TableHead>{t.admin.threshold}</TableHead>
                      <TableHead>{t.admin.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.lowStockProducts.map((product) => (
                      <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                        <TableCell className="font-medium" data-testid={`text-product-name-${product.id}`}>
                          {language === 'et' ? product.nameEt : product.nameEn}
                        </TableCell>
                        <TableCell data-testid={`text-product-stock-${product.id}`}>
                          <Badge variant="destructive">{product.stock}</Badge>
                        </TableCell>
                        <TableCell data-testid={`text-product-threshold-${product.id}`}>
                          {product.lowStockThreshold}
                        </TableCell>
                        <TableCell>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            data-testid={`button-edit-product-${product.id}`}
                          >
                            <Link href="/admin/products">{t.admin.edit}</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8" data-testid="text-all-products-in-stock">
                  <div className="text-lg font-medium text-green-600 dark:text-green-400">
                    {t.admin.allProductsInStock}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
