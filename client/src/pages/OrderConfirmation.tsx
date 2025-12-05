import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, XCircle, ShoppingBag, Package, Loader2 } from "lucide-react";
import type { Order } from "@shared/schema";

export default function OrderConfirmation() {
  const { language } = useLanguage();
  const { clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const [, setLocation] = useLocation();
  const [cartCleared, setCartCleared] = useState(false);

  // Get order ID and payment URL param from URL
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const paymentUrlParam = urlParams.get('payment');

  // Fetch order details
  const { data: order, isLoading, error } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    enabled: !!orderId,
  });

  // Clear cart only when order payment status is confirmed as completed/paid in the DATABASE
  // This is secure - we don't rely on URL params for cart clearing
  useEffect(() => {
    if (order && !cartCleared) {
      const dbPaymentStatus = order.paymentStatus || 'pending';
      // Only clear cart if the ORDER's payment status from database is confirmed as paid
      if (dbPaymentStatus === 'completed' || dbPaymentStatus === 'paid') {
        clearCart();
        setCartCleared(true);
      }
    }
  }, [order, cartCleared, clearCart]);

  // If payment was cancelled (from URL param), redirect back to checkout with cart intact
  useEffect(() => {
    if (paymentUrlParam === 'cancelled') {
      setLocation('/checkout?payment=cancelled');
    }
  }, [paymentUrlParam, setLocation]);

  const seoTitle = language === 'et' ? 'Tellimuse kinnitus' : 'Order Confirmation';
  const seoDescription = language === 'et' 
    ? 'Teie tellimus on vastu võetud. Vaadake tellimuse üksikasju.'
    : 'Your order has been received. View your order details.';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={seoTitle} description={seoDescription} />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">
            {language === 'et' ? 'Laadime tellimuse andmeid...' : 'Loading order details...'}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // No order found
  if (!orderId || error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={seoTitle} description={seoDescription} />
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <XCircle className="h-24 w-24 text-destructive mb-6" />
          <h1 className="text-3xl font-bold mb-4">
            {language === 'et' ? 'Tellimust ei leitud' : 'Order not found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {language === 'et' 
              ? 'Kahjuks ei leidnud me seda tellimust.' 
              : 'Unfortunately, we could not find this order.'}
          </p>
          <Link href="/">
            <Button size="lg" data-testid="button-continue-shopping">
              {language === 'et' ? 'Tagasi avalehele' : 'Back to Home'}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Determine payment status display
  const getStatusDisplay = () => {
    const status = order.paymentStatus || 'pending';
    
    if (status === 'completed' || status === 'paid') {
      return {
        icon: <CheckCircle className="h-24 w-24 text-green-500 mb-6" />,
        title: language === 'et' ? 'Makse õnnestus!' : 'Payment Successful!',
        description: language === 'et' 
          ? 'Teie tellimus on edukalt vastu võetud ja me alustame selle töötlemisega.' 
          : 'Your order has been successfully received and we will start processing it.',
        color: 'text-green-500'
      };
    } else if (status === 'pending' || status === 'processing') {
      return {
        icon: <Clock className="h-24 w-24 text-amber-500 mb-6" />,
        title: language === 'et' ? 'Makse ootel' : 'Payment Pending',
        description: language === 'et' 
          ? 'Teie makse on veel töötlemisel. Teavitame teid e-postiga, kui makse on kinnitatud.' 
          : 'Your payment is still being processed. We will notify you by email once it is confirmed.',
        color: 'text-amber-500'
      };
    } else {
      return {
        icon: <XCircle className="h-24 w-24 text-destructive mb-6" />,
        title: language === 'et' ? 'Makse ebaõnnestus' : 'Payment Failed',
        description: language === 'et' 
          ? 'Teie makse ei õnnestunud. Palun proovige uuesti.' 
          : 'Your payment was not successful. Please try again.',
        color: 'text-destructive'
      };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO title={seoTitle} description={seoDescription} />
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Status Section */}
          <div className="text-center mb-8">
            {statusDisplay.icon}
            <h1 className="text-3xl font-bold mb-4" data-testid="text-order-status">
              {statusDisplay.title}
            </h1>
            <p className="text-muted-foreground mb-2">
              {statusDisplay.description}
            </p>
            <p className="text-lg font-medium">
              {language === 'et' ? 'Tellimuse number: ' : 'Order number: '}
              <span className="text-primary" data-testid="text-order-number">{order.orderNumber}</span>
            </p>
          </div>

          {/* Order Summary Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {language === 'et' ? 'Tellimuse kokkuvõte' : 'Order Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'Kuupäev' : 'Date'}
                </span>
                <span>{new Date(order.createdAt).toLocaleDateString(language === 'et' ? 'et-EE' : 'en-US')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'E-post' : 'Email'}
                </span>
                <span data-testid="text-order-email">{order.customerEmail}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {language === 'et' ? 'Makseviis' : 'Payment Method'}
                </span>
                <span>{order.paymentMethod}</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{language === 'et' ? 'Kokku' : 'Total'}</span>
                  <span className="text-primary" data-testid="text-order-total">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === 'et' ? 'Mis edasi?' : 'What\'s next?'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                {language === 'et' 
                  ? '1. Saadame teile tellimuse kinnituse e-postiga.' 
                  : '1. We will send you an order confirmation email.'}
              </p>
              <p>
                {language === 'et' 
                  ? '2. Kui makse on kinnitatud, alustame tellimuse ettevalmistamist.' 
                  : '2. Once payment is confirmed, we will prepare your order.'}
              </p>
              <p>
                {language === 'et' 
                  ? '3. Teavitame teid, kui tellimus on teel.' 
                  : '3. We will notify you when your order is on the way.'}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button size="lg" variant="default" className="w-full sm:w-auto" data-testid="button-continue-shopping">
                <ShoppingBag className="h-5 w-5 mr-2" />
                {language === 'et' ? 'Jätka ostlemist' : 'Continue Shopping'}
              </Button>
            </Link>
            <Link href="/account">
              <Button size="lg" variant="outline" className="w-full sm:w-auto" data-testid="button-view-account">
                {language === 'et' ? 'Minu tellimused' : 'My Orders'}
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
