import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateVatBreakdown } from "@/lib/vat";
import { ShoppingBag, Package, CreditCard } from "lucide-react";
import { Link } from "wouter";

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default("Estonia"),
  shippingMethod: z.enum(["omniva", "dpd"]),
  paymentMethod: z.enum(["demo", "stripe", "paysera", "montonio"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { language } = useLanguage();
  const { currency, formatPrice, toDisplay } = useCurrency();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Track shipping cost based on selected method (Omniva: 4.99, DPD: 5.99)
  const [shippingCost, setShippingCost] = useState(4.99);
  
  // All cart amounts are in EUR (base currency)
  const baseTotalPrice = totalPrice;  // Cart total is in EUR
  const grandTotal = baseTotalPrice + shippingCost;
  
  // Calculate VAT breakdown on base EUR amounts
  // Keep values in EUR - formatPrice() will handle conversion to display currency
  const itemsVat = calculateVatBreakdown(baseTotalPrice);
  const shippingVat = calculateVatBreakdown(shippingCost);
  const totalVat = calculateVatBreakdown(grandTotal);
  
  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Estonia",
      shippingMethod: "omniva",
      paymentMethod: "demo",
    },
  });
  
  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const requestBody = {
        order: {
          customerEmail: data.email,
          shippingFirstName: data.firstName,
          shippingLastName: data.lastName,
          shippingStreet: data.address,
          shippingCity: data.city,
          shippingPostalCode: data.postalCode,
          shippingCountry: data.country,
          shippingPhone: data.phone,
          shippingMethod: data.shippingMethod,
          paymentMethod: data.paymentMethod,
          subtotal: itemsVat.subtotalExVat.toFixed(2),
          shippingCost: shippingVat.subtotalExVat.toFixed(2),
          vatAmount: totalVat.vatAmount.toFixed(2),
          total: grandTotal.toFixed(2),
          currency: 'EUR',
        },
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price.toFixed(2),
          subtotal: (item.price * item.quantity).toFixed(2),
        })),
        language,
      };
      
      const order = await apiRequest('POST', '/api/orders', requestBody) as any;
      
      // Create payment session based on selected provider
      let paymentUrl: string;
      
      if (data.paymentMethod === 'demo') {
        // Demo payment - instant success redirect
        const payment = await apiRequest('POST', '/api/payments/demo', {
          orderId: order.id,
          amount: grandTotal,
          currency: 'EUR',
        }) as any;
        paymentUrl = payment.paymentUrl;
      } else if (data.paymentMethod === 'stripe') {
        const payment = await apiRequest('POST', '/api/payments/stripe', {
          orderId: order.id,
          amount: grandTotal,
          currency: 'EUR',
        }) as any;
        paymentUrl = payment.url;
      } else if (data.paymentMethod === 'montonio') {
        const payment = await apiRequest('POST', '/api/payments/montonio', {
          orderId: order.id,
          amount: grandTotal,
          currency: 'EUR',
        }) as any;
        paymentUrl = payment.paymentUrl;
      } else if (data.paymentMethod === 'paysera') {
        const payment = await apiRequest('POST', '/api/payments/paysera', {
          orderId: order.id,
          amount: grandTotal,
          currency: 'EUR',
        }) as any;
        paymentUrl = payment.paymentUrl;
      } else {
        throw new Error('Unsupported payment method');
      }
      
      return { order, paymentUrl };
    },
    onSuccess: (data) => {
      clearCart();
      // Redirect to payment provider
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message || (language === 'et' ? 'Tellimuse esitamine ebaõnnestus' : 'Failed to place order'),
      });
    },
  });
  
  const onSubmit = (data: CheckoutFormData) => {
    createOrderMutation.mutate(data);
  };
  
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="h-24 w-24 text-muted-foreground mb-6" />
          <h1 className="text-3xl font-bold mb-4">
            {language === 'et' ? 'Teie ostukorv on tühi' : 'Your cart is empty'}
          </h1>
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
          <h1 className="text-4xl font-bold mb-8" data-testid="text-checkout-title">
            {language === 'et' ? 'Kassa' : 'Checkout'}
          </h1>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Checkout Form */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Customer Info */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{language === 'et' ? 'Kontaktandmed' : 'Contact Information'}</h2>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'et' ? 'E-post' : 'Email'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'et' ? 'Eesnimi' : 'First Name'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'et' ? 'Perekonnanimi' : 'Last Name'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'et' ? 'Telefon' : 'Phone'}</FormLabel>
                            <FormControl>
                              <Input {...field} type="tel" data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </Card>
                  
                  {/* Shipping Address */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6">{language === 'et' ? 'Tarneaadress' : 'Shipping Address'}</h2>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{language === 'et' ? 'Aadress' : 'Address'}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'et' ? 'Linn' : 'City'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{language === 'et' ? 'Postiindeks' : 'Postal Code'}</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </Card>
                  
                  {/* Shipping Method */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Package className="h-6 w-6" />
                      {language === 'et' ? 'Tarnev iis' : 'Shipping Method'}
                    </h2>
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={(value) => {
                                field.onChange(value);
                                setShippingCost(value === 'dpd' ? 5.99 : 4.99);
                              }}
                              value={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-omniva">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="omniva" id="omniva" />
                                  <Label htmlFor="omniva" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">Omniva</span>
                                    <span className="text-sm text-muted-foreground">2-3 {language === 'et' ? 'tööpäeva' : 'business days'}</span>
                                  </Label>
                                </div>
                                <span className="font-semibold">{formatPrice(4.99)}</span>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-dpd">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="dpd" id="dpd" />
                                  <Label htmlFor="dpd" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">DPD</span>
                                    <span className="text-sm text-muted-foreground">1-2 {language === 'et' ? 'tööpäeva' : 'business days'}</span>
                                  </Label>
                                </div>
                                <span className="font-semibold">{formatPrice(5.99)}</span>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                  
                  {/* Payment Method */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <CreditCard className="h-6 w-6" />
                      {language === 'et' ? 'Makseviis' : 'Payment Method'}
                    </h2>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="space-y-3"
                            >
                              <div className="flex items-center justify-between p-4 border-2 border-primary/50 bg-primary/5 rounded-md hover-elevate cursor-pointer" data-testid="option-demo">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="demo" id="demo" />
                                  <Label htmlFor="demo" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold text-primary">Demo Payment ✓</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'Testimiseks (ei vaja API võtmeid)' : 'For Testing (no API keys needed)'}</span>
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-stripe">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="stripe" id="stripe" />
                                  <Label htmlFor="stripe" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">Stripe</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'Krediitkaart' : 'Credit Card'}</span>
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-paysera">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="paysera" id="paysera" />
                                  <Label htmlFor="paysera" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">Paysera</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'Pangalink' : 'Bank Link'}</span>
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-montonio">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="montonio" id="montonio" />
                                  <Label htmlFor="montonio" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">Montonio</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'Baltikumi pangad' : 'Baltic Banks'}</span>
                                  </Label>
                                </div>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Card>
                </div>
                
                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <Card className="p-6 sticky top-4" data-testid="card-order-summary">
                    <h2 className="text-2xl font-bold mb-6">{language === 'et' ? 'Tellimus' : 'Order Summary'}</h2>
                    
                    <div className="space-y-4 mb-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-3" data-testid={`summary-item-${item.id}`}>
                          <img
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            className="w-16 h-16 object-cover rounded-md border border-border"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {language === 'et' ? 'Kogus' : 'Qty'}: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Tooted (ilma KM-ta)' : 'Products (ex VAT)'}</span>
                        <span data-testid="text-subtotal-ex-vat">{formatPrice(itemsVat.subtotalExVat)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'KM 24%' : 'VAT 24%'}</span>
                        <span data-testid="text-vat-items">{formatPrice(itemsVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{language === 'et' ? 'Vahesumma (koos KM-ga)' : 'Subtotal (incl VAT)'}</span>
                        <span data-testid="text-subtotal">{formatPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Kohaletoimetamine (ilma KM-ta)' : 'Shipping (ex VAT)'}</span>
                        <span>{formatPrice(shippingVat.subtotalExVat)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Tarne KM 24%' : 'Shipping VAT 24%'}</span>
                        <span>{formatPrice(shippingVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{language === 'et' ? 'Kohaletoimetamine (koos KM-ga)' : 'Shipping (incl VAT)'}</span>
                        <span data-testid="text-shipping">{formatPrice(shippingCost)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>{language === 'et' ? 'Kokku KM 24%' : 'Total VAT 24%'}</span>
                        <span data-testid="text-total-vat">{formatPrice(totalVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold">
                        <span>{language === 'et' ? 'Kokku (koos KM-ga)' : 'Total (incl VAT)'}</span>
                        <span data-testid="text-total">{formatPrice(grandTotal)}</span>
                      </div>
                    </div>
                    
                    <Button
                      type="submit"
                      className="w-full mt-6"
                      size="lg"
                      disabled={createOrderMutation.isPending}
                      data-testid="button-place-order"
                    >
                      {createOrderMutation.isPending
                        ? (language === 'et' ? 'Töötlemine...' : 'Processing...')
                        : (language === 'et' ? 'Esita tellimus' : 'Place Order')}
                    </Button>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
