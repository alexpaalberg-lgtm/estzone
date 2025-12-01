import { ShoppingCart, Heart, Truck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { getPlatformInfo } from '@/lib/platform';
import PlatformIcon from '@/components/PlatformIcon';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Product, Wishlist } from '@shared/schema';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const name = language === 'et' ? product.nameEt : product.nameEn;
  const price = parseFloat(product.price);
  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
  
  const stock = !inStock ? 'out_of_stock' : lowStock ? 'low_stock' : 'in_stock';
  
  const platformInfo = getPlatformInfo(product.sku, product.nameEn);
  
  const { data: wishlistItems } = useQuery<Wishlist[]>({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
  
  const isInWishlist = wishlistItems?.some(item => item.productId === product.id) || false;
  
  const addToWishlistMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/wishlist', { productId: product.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: language === 'et' ? 'Lisatud soovinimekirja' : 'Added to wishlist',
        description: name,
      });
    },
  });
  
  const removeFromWishlistMutation = useMutation({
    mutationFn: async () => {
      const wishlistItem = wishlistItems?.find(item => item.productId === product.id);
      if (wishlistItem) {
        return apiRequest('DELETE', `/api/wishlist/${wishlistItem.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      toast({
        title: language === 'et' ? 'Eemaldatud soovinimekirjast' : 'Removed from wishlist',
        description: name,
      });
    },
  });
  
  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      window.location.href = '/auth';
      return;
    }
    
    if (isInWishlist) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };
  
  const stockLabels = {
    in_stock: t.product.inStock,
    low_stock: t.product.lowStock,
    out_of_stock: t.product.outOfStock,
  };

  const stockColors = {
    in_stock: 'bg-green-500/20 text-green-400',
    low_stock: 'bg-amber-500/20 text-amber-400',
    out_of_stock: 'bg-muted text-muted-foreground',
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock) return;
    
    addItem({
      id: product.id,
      name,
      price: salePrice || price,
      image: product.images?.[0] || '',
      sku: product.sku,
      platform: platformInfo?.label,
    });
    
    toast({
      title: language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart',
      description: name,
    });
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group relative hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full flex flex-col" data-testid={`card-product-${product.id}`}>
        {platformInfo && (
          <PlatformIcon platformInfo={platformInfo} size="sm" variant="ribbon" />
        )}
        
        <div className="relative aspect-square overflow-hidden bg-black/40 flex items-center justify-center rounded-t-xl">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={name}
              className="w-full h-full object-contain p-2"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/images/placeholder.svg';
              }}
              data-testid={`img-product-${product.id}`}
            />
          ) : (
            <div className="text-muted-foreground text-sm">No Image</div>
          )}
          
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {product.isNew && (
              <Badge variant="default" className="text-xs bg-primary text-primary-foreground animate-pulse" data-testid={`badge-new-${product.id}`}>
                {t.product.newArrival}
              </Badge>
            )}
            {salePrice && (
              <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-xs font-black animate-pulse border-0 shadow-lg" data-testid={`badge-sale-${product.id}`}>
                <Sparkles className="h-3 w-3 mr-1" />
                -{Math.round((1 - salePrice / price) * 100)}%
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className={`absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm transition-colors ${isInWishlist ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
            onClick={handleWishlistClick}
            disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
            data-testid={`button-wishlist-${product.id}`}
            title={isAuthenticated 
              ? (isInWishlist 
                ? (language === 'et' ? 'Eemalda soovinimekirjast' : 'Remove from wishlist')
                : (language === 'et' ? 'Lisa soovinimekirja' : 'Add to wishlist'))
              : (language === 'et' ? 'Logi sisse soovinimekirja kasutamiseks' : 'Sign in to use wishlist')
            }
          >
            <Heart className={`h-4 w-4 ${isInWishlist ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1 bg-gradient-to-t from-card via-card to-transparent">
          <h3 className="font-bold text-sm sm:text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] group-hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {name}
          </h3>
          
          <div className="flex items-baseline gap-1.5 sm:gap-2 mb-2">
            {salePrice ? (
              <>
                <span className="text-lg sm:text-xl font-black text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" data-testid={`text-sale-price-${product.id}`}>
                  {formatPrice(salePrice)}
                </span>
                <span className="text-xs text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-black text-primary" data-testid={`text-price-${product.id}`}>
                {formatPrice(price)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
            <Badge className={`${stockColors[stock]} text-xs`} data-testid={`badge-stock-${product.id}`}>
              {stockLabels[stock]}
            </Badge>
            {inStock && (
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {language === 'et' ? '1-3 päeva' : '1-3 days'}
              </span>
            )}
          </div>
          
          <Button
            className="w-full text-xs sm:text-sm"
            size="sm"
            disabled={!inStock}
            onClick={handleAddToCart}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
            {t.product.addToCart}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
