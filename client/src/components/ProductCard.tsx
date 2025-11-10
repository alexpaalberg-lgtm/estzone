import { ShoppingCart, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';
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
    });
    
    toast({
      title: language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart',
      description: name,
    });
  };

  return (
    <Link href={`/product/${product.id}`}>
      <Card className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full flex flex-col" data-testid={`card-product-${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images?.[0] || '/images/placeholder.jpg'}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-testid={`img-product-${product.id}`}
          />
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {product.isNew && (
              <Badge variant="default" className="text-xs" data-testid={`badge-new-${product.id}`}>
                {t.product.newArrival}
              </Badge>
            )}
            {salePrice && (
              <Badge className="bg-destructive text-destructive-foreground text-xs" data-testid={`badge-sale-${product.id}`}>
                {t.product.sale}
              </Badge>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            data-testid={`button-wishlist-${product.id}`}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 flex-1" data-testid={`text-product-name-${product.id}`}>
            {name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            {salePrice ? (
              <>
                <span className="text-xl font-bold text-primary" data-testid={`text-sale-price-${product.id}`}>
                  {formatPrice(salePrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${product.id}`}>
                  {formatPrice(price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-foreground" data-testid={`text-price-${product.id}`}>
                {formatPrice(price)}
              </span>
            )}
          </div>
          <Badge className={`mb-3 ${stockColors[stock]}`} data-testid={`badge-stock-${product.id}`}>
            {stockLabels[stock]}
          </Badge>
          <Button
            className="w-full"
            disabled={!inStock}
            onClick={handleAddToCart}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t.product.addToCart}
          </Button>
        </div>
      </Card>
    </Link>
  );
}
