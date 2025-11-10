import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { XCircle, ShoppingCart, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function PaymentCancel() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    if (id) {
      setOrderId(id);
    }
  }, []);

  const { data: order, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  }) as any;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <XCircle className="h-20 w-20 text-amber-500 mx-auto mb-6" data-testid="icon-cancel" />
            
            <h1 className="text-3xl font-bold mb-2" data-testid="text-cancel-title">
              {language === 'et' ? 'Makse katkestatud' : 'Payment Cancelled'}
            </h1>
            
            <p className="text-muted-foreground mb-8" data-testid="text-cancel-message">
              {language === 'et' 
                ? 'Teie makse katkestati. Tellimus on salvestatud ja te saate hiljem maksmine lõpetada.' 
                : 'Your payment was cancelled. Your order has been saved and you can complete payment later.'}
            </p>

            {!isLoading && order && (
              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'et' ? 'Tellimuse number:' : 'Order number:'}
                </p>
                <p className="font-semibold text-lg" data-testid="text-order-number">
                  {order.orderNumber}
                </p>
              </div>
            )}

            <div className="mt-8 flex gap-4 justify-center flex-wrap">
              <Link href="/">
                <Button variant="outline" data-testid="button-continue-shopping">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
                </Button>
              </Link>
              
              {order && (
                <Link href="/checkout">
                  <Button data-testid="button-try-again">
                    {language === 'et' ? 'Proovi uuesti' : 'Try Again'}
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
