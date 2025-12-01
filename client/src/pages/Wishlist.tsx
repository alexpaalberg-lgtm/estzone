import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Heart, Trash2, ShoppingCart, Bell, BellOff, PackageCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/hooks/useAuth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Wishlist as WishlistType, Product } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

export default function Wishlist() {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: wishlistItems, isLoading } = useQuery<WishlistType[]>({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    staleTime: 5 * 60 * 1000,
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => 
      apiRequest('DELETE', `/api/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: language === 'et' ? 'Eemaldatud' : 'Removed',
        description: language === 'et' ? 'Toode eemaldati soovinimekirjast' : 'Product removed from wishlist',
      });
    },
  });

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: language === 'et' ? product.nameEt : product.nameEn,
      price: product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price),
      image: product.images?.[0] || '',
    }, 1);
    toast({
      title: language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart',
      description: language === 'et' ? product.nameEt : product.nameEn,
    });
  };

  const wishlistProducts = wishlistItems?.map(item => {
    const product = products?.find(p => p.id === item.productId);
    return { ...item, product };
  }).filter(item => item.product) || [];

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <SEO 
          title={language === 'et' ? 'Soovinimekiri - EstZone' : 'Wishlist - EstZone'}
          description={language === 'et' ? 'Salvesta oma lemmiktooted hilisemaks' : 'Save your favorite products for later'}
        />
        <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-4">
          {language === 'et' ? 'Logi sisse' : 'Sign In'}
        </h1>
        <p className="text-muted-foreground mb-6">
          {language === 'et' 
            ? 'Soovinimekirja kasutamiseks pead sisse logima' 
            : 'Sign in to use your wishlist'}
        </p>
        <a href="/api/login">
          <Button data-testid="button-login-wishlist">
            {language === 'et' ? 'Logi sisse' : 'Sign In'}
          </Button>
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={language === 'et' ? 'Soovinimekiri - EstZone' : 'Wishlist - EstZone'}
        description={language === 'et' ? 'Sinu salvestatud lemmiktooted' : 'Your saved favorite products'}
      />
      
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-back-home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          {language === 'et' ? 'Soovinimekiri' : 'Wishlist'}
          {wishlistProducts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {wishlistProducts.length}
            </Badge>
          )}
        </h1>
      </div>

      {wishlistProducts.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent>
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {language === 'et' ? 'Soovinimekiri on tühi' : 'Your wishlist is empty'}
            </p>
            <p className="text-muted-foreground mb-6">
              {language === 'et' 
                ? 'Lisa tooteid soovinimekirja, et neid hiljem leida' 
                : 'Add products to your wishlist to find them later'}
            </p>
            <Link href="/products">
              <Button data-testid="button-browse-products">
                {language === 'et' ? 'Sirvi tooteid' : 'Browse Products'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wishlistProducts.map(({ product, notifyOnSale, notifyOnRestock }) => {
            if (!product) return null;
            const name = language === 'et' ? product.nameEt : product.nameEn;
            const originalPrice = parseFloat(product.price);
            const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
            const isOnSale = salePrice && salePrice < originalPrice;
            const isOutOfStock = product.stock === 0;

            return (
              <Card key={product.id} className="overflow-hidden" data-testid={`card-wishlist-${product.id}`}>
                <Link href={`/product/${product.id}`}>
                  <div className="relative aspect-square bg-muted">
                    {product.images?.[0] && (
                      <img 
                        src={product.images[0]} 
                        alt={name}
                        className="w-full h-full object-contain p-4"
                      />
                    )}
                    {isOnSale && (
                      <Badge variant="destructive" className="absolute top-2 left-2">
                        {language === 'et' ? 'ALLAHINDLUS' : 'SALE'}
                      </Badge>
                    )}
                    {isOutOfStock && (
                      <Badge variant="secondary" className="absolute top-2 right-2">
                        {language === 'et' ? 'Otsas' : 'Out of Stock'}
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-medium mb-2 line-clamp-2 hover:text-primary transition-colors">
                      {name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-4">
                    {isOnSale ? (
                      <>
                        <span className="font-bold text-lg text-primary">
                          {formatPrice(salePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(originalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-bold text-lg">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between gap-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {notifyOnSale ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                      <span>{language === 'et' ? 'Hinnateade' : 'Price Alert'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {notifyOnRestock ? <PackageCheck className="h-4 w-4" /> : null}
                      <span>{language === 'et' ? 'Laohoiatus' : 'Stock Alert'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1" 
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      data-testid={`button-add-cart-${product.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {language === 'et' ? 'Lisa korvi' : 'Add to Cart'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => removeFromWishlistMutation.mutate(product.id)}
                      disabled={removeFromWishlistMutation.isPending}
                      data-testid={`button-remove-wishlist-${product.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
