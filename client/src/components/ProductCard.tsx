import { ShoppingCart, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  isNew?: boolean;
  salePrice?: number;
}

export default function ProductCard({
  id,
  name,
  price,
  image,
  stock,
  isNew,
  salePrice,
}: ProductCardProps) {
  const { t } = useLanguage();
  const { addItem } = useCart();

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

  const handleAddToCart = () => {
    addItem({ id, name, price: salePrice || price, image });
  };

  return (
    <Card className="group overflow-hidden hover-elevate" data-testid={`card-product-${id}`}>
      <div className="relative aspect-square overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          {isNew && (
            <Badge variant="default" className="text-xs" data-testid="badge-new">
              {t.product.newArrival}
            </Badge>
          )}
          {salePrice && (
            <Badge className="bg-destructive text-destructive-foreground text-xs" data-testid="badge-sale">
              {t.product.sale}
            </Badge>
          )}
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
          data-testid="button-wishlist"
        >
          <Heart className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2" data-testid="text-product-name">
          {name}
        </h3>
        <div className="flex items-center gap-2 mb-3">
          {salePrice ? (
            <>
              <span className="text-xl font-bold text-primary" data-testid="text-sale-price">
                €{salePrice.toFixed(2)}
              </span>
              <span className="text-sm text-muted-foreground line-through" data-testid="text-original-price">
                €{price.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-foreground" data-testid="text-price">
              €{price.toFixed(2)}
            </span>
          )}
        </div>
        <Badge className={`mb-3 ${stockColors[stock]}`} data-testid="badge-stock">
          {stockLabels[stock]}
        </Badge>
        <Button
          className="w-full"
          disabled={stock === 'out_of_stock'}
          onClick={handleAddToCart}
          data-testid="button-add-to-cart"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {t.product.addToCart}
        </Button>
      </div>
    </Card>
  );
}
