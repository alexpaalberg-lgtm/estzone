import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { User, Heart, RefreshCw, Package, LogOut, ArrowLeft, Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { RecurringOrder, Product, User as UserType } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';
import { format } from 'date-fns';

export default function Account() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: recurringOrders, isLoading: ordersLoading } = useQuery<RecurringOrder[]>({
    queryKey: ['/api/recurring-orders'],
    enabled: isAuthenticated,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 5 * 60 * 1000,
  });

  const toggleRecurringOrderMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      apiRequest('PATCH', `/api/recurring-orders/${id}`, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-orders'] });
      toast({
        title: language === 'et' ? 'Uuendatud' : 'Updated',
        description: language === 'et' ? 'Korduv tellimus uuendatud' : 'Recurring order updated',
      });
    },
  });

  const deleteRecurringOrderMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest('DELETE', `/api/recurring-orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recurring-orders'] });
      toast({
        title: language === 'et' ? 'Kustutatud' : 'Deleted',
        description: language === 'et' ? 'Korduv tellimus kustutatud' : 'Recurring order deleted',
      });
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO 
          title={language === 'et' ? 'Minu konto - EstZone' : 'My Account - EstZone'}
          description={language === 'et' ? 'Halda oma kontot ja tellimusi' : 'Manage your account and orders'}
        />
        <User className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">
          {language === 'et' ? 'Logi sisse' : 'Sign In'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {language === 'et' 
            ? 'Konto kasutamiseks pead sisse logima' 
            : 'Sign in to access your account'}
        </p>
        <a href="/api/login">
          <Button data-testid="button-login-account">
            {language === 'et' ? 'Logi sisse' : 'Sign In'}
          </Button>
        </a>
      </div>
    );
  }

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={language === 'et' ? 'Minu konto - EstZone' : 'My Account - EstZone'}
        description={language === 'et' ? 'Halda oma kontot ja tellimusi' : 'Manage your account and orders'}
      />
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back-home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {language === 'et' ? 'Minu konto' : 'My Account'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : (language === 'et' ? 'Kasutaja' : 'User')}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/wishlist">
              <Button variant="outline" className="w-full justify-start" data-testid="link-wishlist">
                <Heart className="h-4 w-4 mr-2" />
                {language === 'et' ? 'Soovinimekiri' : 'Wishlist'}
              </Button>
            </Link>
            <a href="/api/logout">
              <Button variant="outline" className="w-full justify-start text-destructive" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-2" />
                {language === 'et' ? 'Logi välja' : 'Sign Out'}
              </Button>
            </a>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="recurring" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="recurring" data-testid="tab-recurring">
                <RefreshCw className="h-4 w-4 mr-2" />
                {language === 'et' ? 'Korduvad tellimused' : 'Recurring Orders'}
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <Package className="h-4 w-4 mr-2" />
                {language === 'et' ? 'Tellimuste ajalugu' : 'Order History'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="recurring" className="mt-6">
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : recurringOrders && recurringOrders.length > 0 ? (
                <div className="space-y-4">
                  {recurringOrders.map(order => {
                    const product = products?.find(p => p.id === order.productId);
                    if (!product) return null;
                    const name = language === 'et' ? product.nameEt : product.nameEn;
                    const price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);

                    return (
                      <Card key={order.id} data-testid={`card-recurring-${order.id}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {product.images?.[0] && (
                              <img 
                                src={product.images[0]} 
                                alt={name}
                                className="w-16 h-16 object-contain rounded bg-muted p-1"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Link href={`/product/${product.id}`}>
                                    <h3 className="font-medium hover:text-primary transition-colors">
                                      {name}
                                    </h3>
                                  </Link>
                                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {language === 'et' ? `Iga ${order.frequencyDays} päeva` : `Every ${order.frequencyDays} days`}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {language === 'et' ? 'Järgmine:' : 'Next:'} {format(new Date(order.nextOrderDate), 'dd.MM.yyyy')}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={order.isActive ? 'default' : 'secondary'}>
                                  {order.isActive 
                                    ? (language === 'et' ? 'Aktiivne' : 'Active')
                                    : (language === 'et' ? 'Peatatud' : 'Paused')}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">
                                    {order.quantity}x {formatPrice(price)} = 
                                  </span>
                                  <span className="font-bold ml-1">
                                    {formatPrice(price * order.quantity)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={order.isActive ?? false}
                                    onCheckedChange={(checked) => 
                                      toggleRecurringOrderMutation.mutate({ id: order.id, isActive: checked })
                                    }
                                    disabled={toggleRecurringOrderMutation.isPending}
                                    data-testid={`switch-recurring-${order.id}`}
                                  />
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => deleteRecurringOrderMutation.mutate(order.id)}
                                    disabled={deleteRecurringOrderMutation.isPending}
                                    data-testid={`button-delete-recurring-${order.id}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">
                      {language === 'et' ? 'Korduvaid tellimusi pole' : 'No recurring orders'}
                    </p>
                    <p className="text-muted-foreground mb-4">
                      {language === 'et' 
                        ? 'Seadista korduvad tellimused oma lemmiktoodetele' 
                        : 'Set up recurring orders for your favorite products'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === 'et' 
                        ? 'Vihje: Kasuta AI assistenti korduvate tellimuste seadistamiseks' 
                        : 'Tip: Use the AI assistant to set up recurring orders'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="orders" className="mt-6">
              <Card className="text-center p-8">
                <CardContent>
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">
                    {language === 'et' ? 'Tellimuste ajalugu tuleb peagi' : 'Order history coming soon'}
                  </p>
                  <p className="text-muted-foreground">
                    {language === 'et' 
                      ? 'Siin näed tulevikus kõiki oma tellimusi' 
                      : 'You will be able to see all your orders here'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
