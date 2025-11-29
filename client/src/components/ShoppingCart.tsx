import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Separator } from '@/components/ui/separator';
import { Link } from 'wouter';

const platformColors: Record<string, string> = {
  'PS5': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Xbox': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Switch': 'bg-red-500/20 text-red-400 border-red-500/30',
  'PC': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Multi': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export default function ShoppingCart() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen } = useCart();
  const { t } = useLanguage();
  const { currency, setCurrency, formatPrice } = useCurrency();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="w-full sm:max-w-lg" data-testid="sheet-cart">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t.nav.cart}
            </SheetTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
              data-testid="button-currency-toggle-cart"
              className="h-8 px-2"
            >
              <span className="text-xs flex items-center gap-1">
                <span className={currency === 'EUR' ? 'font-bold text-primary' : 'text-muted-foreground'}>EUR</span>
                <span className="text-muted-foreground">/</span>
                <span className={currency === 'USD' ? 'font-bold text-primary' : 'text-muted-foreground'}>USD</span>
              </span>
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-full mt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-empty-cart">
                  Your cart is empty
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 rounded-md border"
                      data-testid={`cart-item-${item.id}`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold line-clamp-1" data-testid="text-item-name">
                            {item.name}
                          </h4>
                          {item.platform && platformColors[item.platform] && (
                            <Badge 
                              className={`text-xs border shrink-0 ${platformColors[item.platform]}`}
                              data-testid="badge-item-platform"
                            >
                              {item.platform}
                            </Badge>
                          )}
                        </div>
                        <p className="text-primary font-bold" data-testid="text-item-price">
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            data-testid="button-decrease-quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center" data-testid="text-quantity">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            data-testid="button-increase-quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.id)}
                        data-testid="button-remove-item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary" data-testid="text-total-price">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
                <Link href="/checkout">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    data-testid="button-checkout"
                    onClick={() => setIsOpen(false)}
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-continue-shopping"
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
