import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { CheckCircle, Package, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function PaymentSuccess() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('order_id');
    if (id) {
      setOrderId(id);
    } else {
      setLocation('/');
    }
  }, [setLocation]);

  const { data: order, isLoading } = useQuery({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  }) as any;

  if (isLoading || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 text-center">
            <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" data-testid="icon-success" />
            
            <h1 className="text-3xl font-bold mb-2" data-testid="text-success-title">
              {language === 'et' ? 'Makse õnnestus!' : 'Payment Successful!'}
            </h1>
            
            <p className="text-muted-foreground mb-8" data-testid="text-success-message">
              {language === 'et' 
                ? 'Täname teid ostu eest. Saadame teile kinnituskirja.' 
                : 'Thank you for your purchase. We will send you a confirmation email.'}
            </p>

            <Separator className="my-6" />

            <div className="text-left space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'Tellimuse number:' : 'Order number:'}
                </span>
                <span className="font-semibold" data-testid="text-order-number">
                  {order.orderNumber}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'Summa:' : 'Total:'}
                </span>
                <span className="font-semibold" data-testid="text-order-total">
                  {formatPrice(parseFloat(order.total))}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'Staatus:' : 'Status:'}
                </span>
                <span className="text-green-600 font-semibold" data-testid="text-order-status">
                  {order.paymentStatus === 'completed' 
                    ? (language === 'et' ? 'Makstud' : 'Paid')
                    : (language === 'et' ? 'Ootel' : 'Pending')}
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-4 justify-center">
              <Link href="/">
                <Button variant="outline" data-testid="button-continue-shopping">
                  {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
                </Button>
              </Link>
              
              <Link href={`/orders/${order.id}`}>
                <Button data-testid="button-view-order">
                  <Package className="mr-2 h-4 w-4" />
                  {language === 'et' ? 'Vaata tellimust' : 'View Order'}
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
