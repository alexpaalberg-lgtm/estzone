import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Order, OrderItem } from '@shared/schema';
import { Eye } from 'lucide-react';

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

type OrderStatusType = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatusType = 'pending' | 'paid' | 'failed' | 'refunded';

interface UpdateOrderFormData {
  status: OrderStatusType;
  paymentStatus: PaymentStatusType;
  trackingNumber: string;
}

export default function AdminOrders() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  const { data: ordersData, isLoading: ordersLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['/api/admin/orders'],
  });

  const { data: orderItems, isLoading: itemsLoading } = useQuery<OrderItem[]>({
    queryKey: ['/api/admin/orders', selectedOrder?.id, 'items'],
    queryFn: selectedOrder?.id 
      ? () => fetch(`/api/admin/orders/${selectedOrder.id}/items`, { credentials: 'include' }).then(res => res.json())
      : undefined,
    enabled: !!selectedOrder?.id,
  });

  const form = useForm<UpdateOrderFormData>({
    defaultValues: {
      status: 'pending',
      paymentStatus: 'pending',
      trackingNumber: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateOrderFormData) => {
      if (!selectedOrder) throw new Error('No order selected');
      return apiRequest('PUT', `/api/admin/orders/${selectedOrder.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
      toast({
        title: t.admin.orderUpdated,
      });
      setIsSheetOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update order',
      });
    },
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    form.reset({
      status: order.status as OrderStatusType,
      paymentStatus: order.paymentStatus as PaymentStatusType,
      trackingNumber: order.trackingNumber || '',
    });
    setIsSheetOpen(true);
  };

  const onSubmit = (data: UpdateOrderFormData) => {
    updateMutation.mutate(data);
  };

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      paid: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };

    const labels: Record<string, string> = {
      pending: t.admin.paymentPending,
      paid: t.admin.paymentPaid,
      failed: t.admin.paymentFailed,
      refunded: t.admin.paymentRefunded,
    };

    return (
      <Badge variant={variants[status] || 'outline'} data-testid={`badge-payment-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'outline',
      shipped: 'outline',
      delivered: 'default',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      pending: t.admin.statusPending,
      processing: t.admin.statusProcessing,
      shipped: t.admin.statusShipped,
      delivered: t.admin.statusDelivered,
      cancelled: t.admin.statusCancelled,
    };

    return (
      <Badge variant={variants[status] || 'outline'} data-testid={`badge-order-${status}`}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `€${numPrice.toFixed(2)}`;
  };

  const orders = ordersData?.orders || [];

  return (
    <AdminLayout title={t.admin.orders}>
      <div className="space-y-4">
        {ordersLoading ? (
          <div className="text-center py-8" data-testid="text-loading">
            {t.admin.loadingOrders}
          </div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.admin.orderNumber}</TableHead>
                  <TableHead>{t.admin.date}</TableHead>
                  <TableHead>{t.admin.customerEmail}</TableHead>
                  <TableHead>{t.admin.total}</TableHead>
                  <TableHead>{t.admin.paymentStatus}</TableHead>
                  <TableHead>{t.admin.orderStatus}</TableHead>
                  <TableHead>{t.admin.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell data-testid={`text-order-number-${order.id}`}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell data-testid={`text-date-${order.id}`}>
                      {format(new Date(order.createdAt), 'dd.MM.yyyy')}
                    </TableCell>
                    <TableCell data-testid={`text-email-${order.id}`}>
                      {order.customerEmail}
                    </TableCell>
                    <TableCell data-testid={`text-total-${order.id}`}>
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      {getOrderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        data-testid={`button-view-${order.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t.admin.viewDetails}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl" data-testid="sheet-order-details">
          <SheetHeader>
            <SheetTitle>{t.admin.orderDetails}</SheetTitle>
            <SheetDescription>
              {selectedOrder?.orderNumber}
            </SheetDescription>
          </SheetHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.admin.orderInformation}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">{t.admin.orderNumber}:</div>
                    <div data-testid="text-detail-order-number">{selectedOrder.orderNumber}</div>
                    
                    <div className="text-muted-foreground">{t.admin.date}:</div>
                    <div data-testid="text-detail-date">
                      {format(new Date(selectedOrder.createdAt), 'dd.MM.yyyy HH:mm')}
                    </div>
                    
                    <div className="text-muted-foreground">{t.admin.customerEmail}:</div>
                    <div data-testid="text-detail-email">{selectedOrder.customerEmail}</div>
                    
                    <div className="text-muted-foreground">{t.admin.paymentMethod}:</div>
                    <div data-testid="text-detail-payment-method">{selectedOrder.paymentMethod}</div>
                    
                    <div className="text-muted-foreground">{t.admin.paymentStatus}:</div>
                    <div>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                    
                    <div className="text-muted-foreground">{t.admin.orderStatus}:</div>
                    <div>{getOrderStatusBadge(selectedOrder.status)}</div>

                    {selectedOrder.trackingNumber && (
                      <>
                        <div className="text-muted-foreground">{t.admin.trackingNumber}:</div>
                        <div data-testid="text-detail-tracking">{selectedOrder.trackingNumber}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.admin.orderItems}</CardTitle>
                </CardHeader>
                <CardContent>
                  {itemsLoading ? (
                    <div className="text-center py-4">Loading...</div>
                  ) : (
                    <div className="space-y-2">
                      {orderItems?.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center border-b pb-2"
                          data-testid={`item-${item.id}`}
                        >
                          <div className="flex-1">
                            <div className="font-medium" data-testid={`text-item-name-${item.id}`}>
                              {language === 'et' ? item.productNameEt : item.productNameEn}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t.admin.quantity}: {item.quantity} × {formatPrice(item.price)}
                            </div>
                          </div>
                          <div className="font-medium" data-testid={`text-item-subtotal-${item.id}`}>
                            {formatPrice(item.subtotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.admin.total}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t.admin.subtotal}:</span>
                    <span data-testid="text-detail-subtotal">{formatPrice(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t.admin.shippingCost}:</span>
                    <span data-testid="text-detail-shipping">{formatPrice(selectedOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t.admin.tax}:</span>
                    <span data-testid="text-detail-tax">{formatPrice(selectedOrder.vatAmount || selectedOrder.tax || 0)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>{t.admin.total}:</span>
                    <span data-testid="text-detail-total">{formatPrice(selectedOrder.total)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.admin.shippingAddress}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1" data-testid="text-detail-shipping-address">
                    <div>{selectedOrder.shippingFirstName} {selectedOrder.shippingLastName}</div>
                    <div>{selectedOrder.shippingStreet}</div>
                    <div>{selectedOrder.shippingPostalCode} {selectedOrder.shippingCity}</div>
                    <div>{selectedOrder.shippingCountry}</div>
                    {selectedOrder.shippingPhone && <div>{selectedOrder.shippingPhone}</div>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t.admin.updateStatus}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.admin.orderStatus}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-order-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">{t.admin.statusPending}</SelectItem>
                                <SelectItem value="processing">{t.admin.statusProcessing}</SelectItem>
                                <SelectItem value="shipped">{t.admin.statusShipped}</SelectItem>
                                <SelectItem value="delivered">{t.admin.statusDelivered}</SelectItem>
                                <SelectItem value="cancelled">{t.admin.statusCancelled}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.admin.paymentStatus}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-payment-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">{t.admin.paymentPending}</SelectItem>
                                <SelectItem value="paid">{t.admin.paymentPaid}</SelectItem>
                                <SelectItem value="failed">{t.admin.paymentFailed}</SelectItem>
                                <SelectItem value="refunded">{t.admin.paymentRefunded}</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="trackingNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.admin.trackingNumber}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-tracking-number" />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={updateMutation.isPending}
                        data-testid="button-update-status"
                      >
                        {updateMutation.isPending ? 'Updating...' : t.admin.updateStatus}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
