import { ShoppingCart, Heart, Truck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatformInfo, isGameProduct } from '@/lib/platform';
import PlatformIcon from '@/components/PlatformIcon';
import type { Product } from '@shared/schema';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const name = language === 'et' ? product.nameEt : product.nameEn;
  const price = parseFloat(product.price);
  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
  
  const stock = !inStock ? 'out_of_stock' : lowStock ? 'low_stock' : 'in_stock';
  
  const platformInfo = getPlatformInfo(product.sku, product.nameEn);
  const isGame = isGameProduct(product.sku);
  
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
        {platformInfo && isGame && (
          <PlatformIcon platformInfo={platformInfo} size="sm" variant="ribbon" data-testid={`badge-platform-${product.id}`} />
        )}
        
        <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center rounded-t-xl">
          {product.images?.[0] ? (
            <img
              src={product.images[0]}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
            className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 flex flex-col flex-1 bg-gradient-to-t from-card via-card to-transparent">
          <h3 className="font-bold text-lg mb-2 line-clamp-2 flex-1 group-hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {name}
          </h3>
          
          <div className="flex items-baseline gap-2 mb-2">
            {salePrice ? (
              <>
                <span className="text-2xl font-black text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]" data-testid={`text-sale-price-${product.id}`}>
                  {formatPrice(salePrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="text-2xl font-black text-primary" data-testid={`text-price-${product.id}`}>
                {formatPrice(price)}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge className={`${stockColors[stock]}`} data-testid={`badge-stock-${product.id}`}>
              {stockLabels[stock]}
            </Badge>
            {inStock && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Truck className="h-3 w-3" />
                {language === 'et' ? '1-3 päeva' : '1-3 days'}
              </span>
            )}
          </div>
          
          <Button
            className="w-full group/btn relative overflow-hidden"
            disabled={!inStock}
            onClick={handleAddToCart}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              {t.product.addToCart}
            </span>
          </Button>
        </div>
      </Card>
    </Link>
  );
}
