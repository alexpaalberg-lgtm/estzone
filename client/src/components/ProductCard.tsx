import { ShoppingCart, Heart, Truck, Sparkles, Star, Scale } from 'lucide-react';
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
import { RatingBadge } from '@/components/ProductReviews';
import { useCompare } from '@/contexts/CompareContext';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { addToCompare, removeFromCompare, isInCompare, canAddMore } = useCompare();
  
  const name = language === 'et' ? product.nameEt : product.nameEn;
  const price = parseFloat(product.price);
  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
  
  const stock = !inStock ? 'out_of_stock' : lowStock ? 'low_stock' : 'in_stock';
  
  const stockStatus = (product as any).stockStatus || 'in_stock';
  const deliveryMin = (product as any).deliveryDaysMin || 2;
  const deliveryMax = (product as any).deliveryDaysMax || 4;
  const isPreOrder = stockStatus === 'pre_order';
  
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
  
  const inCompare = isInCompare(product.id);
  
  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inCompare) {
      removeFromCompare(product.id);
      toast({
        title: language === 'et' ? 'Eemaldatud võrdlusest' : 'Removed from compare',
        description: name,
      });
    } else {
      const added = addToCompare(product.id);
      if (added) {
        toast({
          title: language === 'et' ? 'Lisatud võrdlusesse' : 'Added to compare',
          description: name,
        });
      } else {
        toast({
          title: language === 'et' ? 'Võrdlus on täis' : 'Compare list is full',
          description: language === 'et' ? 'Maksimaalselt 4 toodet' : 'Maximum 4 products',
          variant: 'destructive',
        });
      }
    }
  };
  
  const stockLabels = {
    in_stock: t.product.inStock,
    low_stock: t.product.lowStock,
    out_of_stock: t.product.outOfStock,
    pre_order: language === 'et' ? 'Tellimisel' : 'Pre-order',
  };

  const stockColors = {
    in_stock: 'bg-green-500/20 text-green-400',
    low_stock: 'bg-amber-500/20 text-amber-400',
    out_of_stock: 'bg-muted text-muted-foreground',
    pre_order: 'bg-blue-500/20 text-blue-400',
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock && !isPreOrder) return;
    
    addItem({
      id: product.id,
      name,
      price: salePrice || price,
      image: product.images?.[0] || '',
      sku: product.sku,
      platform: platformInfo?.label,
    });
    
    toast({
      title: isPreOrder 
        ? (language === 'et' ? 'Eeltellimus lisatud' : 'Pre-order added')
        : (language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart'),
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
          <div className="absolute bottom-2 left-2 right-2 flex justify-between">
            <Button
              size="icon"
              variant="ghost"
              className={`bg-background/80 backdrop-blur-sm transition-colors ${isInWishlist ? 'text-red-500 hover:text-red-600' : 'hover:text-red-500'}`}
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
            <Button
              size="icon"
              variant="ghost"
              className={`bg-background/80 backdrop-blur-sm transition-colors ${inCompare ? 'text-primary' : 'hover:text-primary'}`}
              onClick={handleCompareClick}
              data-testid={`button-compare-${product.id}`}
              title={inCompare 
                ? (language === 'et' ? 'Eemalda võrdlusest' : 'Remove from compare')
                : (language === 'et' ? 'Lisa võrdlusesse' : 'Add to compare')
              }
            >
              <Scale className={`h-4 w-4 ${inCompare ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-1 bg-gradient-to-t from-card via-card to-transparent">
          <h3 className="font-bold text-sm sm:text-base leading-tight mb-1 line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] group-hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {name}
          </h3>
          
          <div className="mb-1">
            <RatingBadge productId={product.id} compact />
          </div>
          
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
            <Badge className={`${isPreOrder ? stockColors.pre_order : stockColors[stock]} text-xs`} data-testid={`badge-stock-${product.id}`}>
              {isPreOrder ? stockLabels.pre_order : stockLabels[stock]}
            </Badge>
            {(inStock || isPreOrder) && (
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {language === 'et' ? `${deliveryMin}-${deliveryMax} päeva` : `${deliveryMin}-${deliveryMax} days`}
              </span>
            )}
          </div>
          
          <Button
            className="w-full text-xs sm:text-sm"
            size="sm"
            disabled={!inStock && !isPreOrder}
            onClick={handleAddToCart}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
            {isPreOrder 
              ? (language === 'et' ? 'Eeltelli' : 'Pre-order') 
              : t.product.addToCart}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
