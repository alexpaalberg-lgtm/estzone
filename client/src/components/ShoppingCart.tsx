import { X, Minus, Plus, ShoppingBag, Truck, Shield, CreditCard } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'wouter';
import { getPlatformInfo, isGameProduct } from '@/lib/platform';
import { PlatformIconCompact } from '@/components/PlatformIcon';

export default function ShoppingCart() {
  const { items, removeItem, updateQuantity, totalPrice, isOpen, setIsOpen } = useCart();
  const { t, language } = useLanguage();
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
                  {language === 'et' ? 'Ostukorv on tühi' : 'Your cart is empty'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto">
                <div className="space-y-4">
                  {items.map((item) => {
                    const platformInfo = item.sku ? getPlatformInfo(item.sku, item.name) : null;
                    const isGame = item.sku ? isGameProduct(item.sku) : false;
                    
                    return (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
                      data-testid={`cart-item-${item.id}`}
                    >
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="font-semibold text-sm line-clamp-2 flex-1" data-testid="text-item-name">
                            {item.name}
                          </h4>
                        </div>
                        {platformInfo && isGame && (
                          <div className="mb-1">
                            <PlatformIconCompact platformInfo={platformInfo} />
                          </div>
                        )}
                        <p className="text-primary font-bold text-lg" data-testid="text-item-price">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            data-testid="button-decrease-quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium" data-testid="text-quantity">
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
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
                        className="h-6 w-6 shrink-0"
                        onClick={() => removeItem(item.id)}
                        data-testid="button-remove-item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="space-y-2 py-2 px-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-3.5 w-3.5 text-primary" />
                    <span>{language === 'et' ? 'Tasuta transport üle €50 tellimustele' : 'Free shipping on orders over €50'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>{language === 'et' ? '24-kuuline garantii' : '24-month warranty'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-3.5 w-3.5 text-primary" />
                    <span>{language === 'et' ? 'Turvaline makse' : 'Secure payment'}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-xl font-bold">
                  <span>{language === 'et' ? 'Kokku' : 'Total'}</span>
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
                    {language === 'et' ? 'Vormista tellimus' : 'Proceed to Checkout'}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-continue-shopping"
                >
                  {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
