import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateVatBreakdown } from "@/lib/vat";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const { language } = useLanguage();
  const { formatDualPrice } = useCurrency();
  
  // Calculate VAT on base EUR amount
  // Keep in EUR - formatPrice() will handle conversion to display currency
  const vatBreakdown = calculateVatBreakdown(totalPrice);
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4" data-testid="text-empty-cart">
            {language === 'et' ? 'Teie ostukorv on tühi' : 'Your cart is empty'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {language === 'et' ? 'Lisage tooteid ostlemise jätkamiseks' : 'Add products to continue shopping'}
          </p>
          <Link href="/">
            <Button size="lg" data-testid="button-continue-shopping">
              {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2" data-testid="text-cart-title">
              {language === 'et' ? 'Ostukorv' : 'Shopping Cart'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'et' ? `${items.length} toodet` : `${items.length} item${items.length > 1 ? 's' : ''}`}
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="p-4" data-testid={`cart-item-${item.id}`}>
                  <div className="flex gap-4">
                    <img
                      src={item.image || '/placeholder.png'}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-md border border-border"
                      data-testid={`img-cart-item-${item.id}`}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1" data-testid={`text-cart-item-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="text-base font-bold text-primary mb-3" data-testid={`text-cart-item-price-${item.id}`}>
                        {formatDualPrice(item.price)}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            data-testid={`button-decrease-${item.id}`}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-12 text-center font-medium" data-testid={`text-quantity-${item.id}`}>
                            {item.quantity}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            data-testid={`button-increase-${item.id}`}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id)}
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-base font-bold" data-testid={`text-cart-item-total-${item.id}`}>
                        {formatDualPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
              
              <Button
                variant="outline"
                onClick={clearCart}
                className="w-full"
                data-testid="button-clear-cart"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'et' ? 'Tühjenda ostukorv' : 'Clear Cart'}
              </Button>
            </div>
            
            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-4" data-testid="card-order-summary">
                <h2 className="text-2xl font-bold mb-6">
                  {language === 'et' ? 'Tellimuse kokkuvõte' : 'Order Summary'}
                </h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{language === 'et' ? 'Vahesumma (ilma KM-ta)' : 'Subtotal (ex VAT)'}</span>
                    <span data-testid="text-subtotal-ex-vat" className="text-xs">{formatDualPrice(vatBreakdown.subtotalExVat)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{language === 'et' ? 'KM 24%' : 'VAT 24%'}</span>
                    <span data-testid="text-vat" className="text-xs">{formatDualPrice(vatBreakdown.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{language === 'et' ? 'Vahesumma (koos KM-ga)' : 'Subtotal (incl VAT)'}</span>
                    <span data-testid="text-subtotal-incl-vat" className="text-sm">{formatDualPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{language === 'et' ? 'Kohaletoimetamine' : 'Shipping'}</span>
                    <span className="text-xs">{language === 'et' ? 'Arvutatakse kassas' : 'Calculated at checkout'}</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>{language === 'et' ? 'Kokku' : 'Total'}</span>
                      <span data-testid="text-total" className="text-base">{formatDualPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
                
                <Link href="/checkout">
                  <Button className="w-full" size="lg" data-testid="button-checkout">
                    {language === 'et' ? 'Edasi kassasse' : 'Proceed to Checkout'}
                  </Button>
                </Link>
                
                <Link href="/">
                  <Button variant="outline" className="w-full mt-3" data-testid="button-continue-shopping">
                    {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
