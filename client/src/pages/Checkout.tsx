import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { calculateVatBreakdown } from "@/lib/vat";
import { ShoppingBag, Package, CreditCard, MapPin, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Address } from "@shared/schema";

const platformColors: Record<string, string> = {
  'PS5': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Xbox': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Switch': 'bg-red-500/20 text-red-400 border-red-500/30',
  'PC': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Multi': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(1, "Phone is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().default("Estonia"),
  shippingMethod: z.enum(["omniva_terminal", "omniva_courier", "dhl_pickup", "dhl_courier"]),
  paymentMethod: z.enum(["stripe", "paypal", "paysera", "montonio"]),
});

const shippingOptions = [
  { id: 'omniva_terminal', name: 'Omniva Pakiautomaat', nameEn: 'Omniva Parcel Terminal', price: 2.99, days: '2-4' },
  { id: 'omniva_courier', name: 'Omniva Kuller', nameEn: 'Omniva Courier', price: 4.99, days: '1-2' },
  { id: 'dhl_pickup', name: 'DHL Pakipunkt', nameEn: 'DHL Service Point', price: 3.49, days: '2-3' },
  { id: 'dhl_courier', name: 'DHL Kuller', nameEn: 'DHL Express', price: 6.99, days: '1-2' },
] as const;

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { language } = useLanguage();
  const { currency, formatPrice, formatDualPrice, toDisplay } = useCurrency();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Track shipping cost based on selected method
  const [shippingCost, setShippingCost] = useState(2.99);
  const [saveAddress, setSaveAddress] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Fetch saved addresses for authenticated users
  const { data: savedAddresses } = useQuery<Address[]>({
    queryKey: ['/api/addresses'],
    enabled: isAuthenticated,
  });
  
  // Mutation to save address after order
  const saveAddressMutation = useMutation({
    mutationFn: async (addressData: Partial<Address>) => {
      return apiRequest('POST', '/api/addresses', addressData);
    },
  });
  
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
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      country: "Estonia",
      shippingMethod: "omniva_terminal",
      paymentMethod: "stripe",
    },
  });

  // Auto-fill from saved address when selected
  const handleAddressSelect = (addressId: string) => {
    if (addressId === 'new') {
      setSelectedAddressId(null);
      form.setValue('address', '');
      form.setValue('city', '');
      form.setValue('postalCode', '');
      form.setValue('country', 'Estonia');
      return;
    }
    
    const address = savedAddresses?.find(a => a.id === addressId);
    if (address) {
      setSelectedAddressId(addressId);
      form.setValue('firstName', address.firstName);
      form.setValue('lastName', address.lastName);
      form.setValue('address', address.street);
      form.setValue('city', address.city);
      form.setValue('postalCode', address.postalCode);
      form.setValue('country', address.country);
      if (address.phone) form.setValue('phone', address.phone);
    }
  };

  // Auto-select default address on load
  useEffect(() => {
    if (savedAddresses && savedAddresses.length > 0) {
      const defaultAddress = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
      if (defaultAddress && !selectedAddressId) {
        handleAddressSelect(defaultAddress.id);
      }
    }
  }, [savedAddresses]);

  // Pre-fill email from user
  useEffect(() => {
    if (user?.email && !form.getValues('email')) {
      form.setValue('email', user.email);
    }
    if (user?.firstName && !form.getValues('firstName')) {
      form.setValue('firstName', user.firstName);
    }
    if (user?.lastName && !form.getValues('lastName')) {
      form.setValue('lastName', user.lastName);
    }
  }, [user]);
  
  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const orderData = {
        customerEmail: data.email,
        customerName: `${data.firstName} ${data.lastName}`,
        shippingMethod: data.shippingMethod,
        shippingFirstName: data.firstName,
        shippingLastName: data.lastName,
        shippingStreet: data.address,
        shippingCity: data.city,
        shippingPostalCode: data.postalCode,
        shippingCountry: data.country,
        shippingPhone: data.phone,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'pending',
        subtotal: itemsVat.subtotalExVat.toFixed(2),
        shippingCost: shippingVat.subtotalExVat.toFixed(2),
        vatAmount: totalVat.vatAmount.toFixed(2),
        total: grandTotal.toFixed(2),
        currency: 'EUR',
        status: 'pending',
      };
      
      const orderItems = items.map(item => ({
        productId: item.id,
        productNameEn: item.name,
        productNameEt: item.name,
        sku: `SKU-${item.id}`,
        quantity: item.quantity,
        price: item.price.toFixed(2),
        subtotal: (item.price * item.quantity).toFixed(2),
      }));
      
      return await apiRequest('POST', '/api/orders', { order: orderData, items: orderItems, language });
    },
    onSuccess: () => {
      clearCart();
      toast({
        title: language === 'et' ? 'Tellimus edastatud!' : 'Order placed!',
        description: language === 'et' ? 'Saadame teile kinnituskirja' : 'We will send you a confirmation email',
      });
      setLocation('/');
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: language === 'et' ? 'Viga' : 'Error',
        description: error.message || (language === 'et' ? 'Tellimuse esitamine ebaõnnestus' : 'Failed to place order'),
      });
    },
  });
  
  const onSubmit = async (data: CheckoutFormData) => {
    // Save address if checkbox is checked and user is authenticated
    if (saveAddress && isAuthenticated && !selectedAddressId) {
      try {
        await saveAddressMutation.mutateAsync({
          firstName: data.firstName,
          lastName: data.lastName,
          street: data.address,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          isDefault: !savedAddresses || savedAddresses.length === 0,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      } catch (error) {
        console.error('Failed to save address:', error);
      }
    }
    
    createOrderMutation.mutate(data);
  };
  
  const seoTitle = language === 'et' ? 'Kassa' : 'Checkout';
  const seoDescription = language === 'et' 
    ? 'Vormista tellimus turvaliselt. Aktsepteerime pangalinke, kaardimakseid ja PayPali.'
    : 'Complete your order securely. We accept bank links, card payments and PayPal.';

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEO title={seoTitle} description={seoDescription} />
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
      <SEO title={seoTitle} description={seoDescription} />
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
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <MapPin className="h-6 w-6" />
                      {language === 'et' ? 'Tarneaadress' : 'Shipping Address'}
                    </h2>
                    
                    {/* Saved Addresses Selector */}
                    {isAuthenticated && savedAddresses && savedAddresses.length > 0 && (
                      <div className="mb-6">
                        <Label className="text-sm font-medium mb-2 block">
                          {language === 'et' ? 'Vali salvestatud aadress' : 'Select saved address'}
                        </Label>
                        <Select 
                          value={selectedAddressId || 'new'} 
                          onValueChange={handleAddressSelect}
                        >
                          <SelectTrigger data-testid="select-saved-address">
                            <SelectValue placeholder={language === 'et' ? 'Vali aadress' : 'Select address'} />
                          </SelectTrigger>
                          <SelectContent>
                            {savedAddresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id}>
                                {addr.street}, {addr.city} {addr.postalCode}
                                {addr.isDefault && ` - ${language === 'et' ? 'Vaikimisi' : 'Default'}`}
                              </SelectItem>
                            ))}
                            <SelectItem value="new">
                              <span className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                {language === 'et' ? 'Lisa uus aadress' : 'Add new address'}
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
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
                      
                      {/* Save address checkbox for authenticated users */}
                      {isAuthenticated && !selectedAddressId && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                          <Checkbox
                            id="save-address"
                            checked={saveAddress}
                            onCheckedChange={(checked) => setSaveAddress(checked === true)}
                            data-testid="checkbox-save-address"
                          />
                          <Label htmlFor="save-address" className="text-sm cursor-pointer">
                            {language === 'et' 
                              ? 'Salvesta see aadress järgmisteks tellimusteks' 
                              : 'Save this address for future orders'}
                          </Label>
                        </div>
                      )}
                    </div>
                  </Card>
                  
                  {/* Shipping Method */}
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <Package className="h-6 w-6" />
                      {language === 'et' ? 'Tarneviis' : 'Shipping Method'}
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
                                const option = shippingOptions.find(o => o.id === value);
                                if (option) setShippingCost(option.price);
                              }}
                              value={field.value}
                              className="space-y-3"
                            >
                              {shippingOptions.map((option) => (
                                <div 
                                  key={option.id}
                                  className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" 
                                  data-testid={`option-${option.id}`}
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value={option.id} id={option.id} />
                                    <Label htmlFor={option.id} className="cursor-pointer flex flex-col">
                                      <span className="font-semibold">
                                        {language === 'et' ? option.name : option.nameEn}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {option.days} {language === 'et' ? 'tööpäeva' : 'business days'}
                                      </span>
                                    </Label>
                                  </div>
                                  <span className="font-semibold">{formatPrice(option.price)}</span>
                                </div>
                              ))}
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
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-stripe">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="stripe" id="stripe" />
                                  <Label htmlFor="stripe" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">Stripe</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'Krediitkaart' : 'Credit Card'}</span>
                                  </Label>
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-4 border rounded-md hover-elevate cursor-pointer" data-testid="option-paypal">
                                <div className="flex items-center gap-3">
                                  <RadioGroupItem value="paypal" id="paypal" />
                                  <Label htmlFor="paypal" className="cursor-pointer flex flex-col">
                                    <span className="font-semibold">PayPal</span>
                                    <span className="text-sm text-muted-foreground">{language === 'et' ? 'PayPal konto' : 'PayPal Account'}</span>
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                              {item.platform && platformColors[item.platform] && (
                                <Badge 
                                  className={`text-xs border shrink-0 ${platformColors[item.platform]}`}
                                >
                                  {item.platform}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {language === 'et' ? 'Kogus' : 'Qty'}: {item.quantity}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">{formatDualPrice(item.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Tooted (ilma KM-ta)' : 'Products (ex VAT)'}</span>
                        <span data-testid="text-subtotal-ex-vat" className="text-xs">{formatDualPrice(itemsVat.subtotalExVat)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'KM 24%' : 'VAT 24%'}</span>
                        <span data-testid="text-vat-items" className="text-xs">{formatDualPrice(itemsVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{language === 'et' ? 'Vahesumma (koos KM-ga)' : 'Subtotal (incl VAT)'}</span>
                        <span data-testid="text-subtotal" className="text-sm">{formatDualPrice(totalPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Kohaletoimetamine (ilma KM-ta)' : 'Shipping (ex VAT)'}</span>
                        <span className="text-xs">{formatDualPrice(shippingVat.subtotalExVat)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{language === 'et' ? 'Tarne KM 24%' : 'Shipping VAT 24%'}</span>
                        <span className="text-xs">{formatDualPrice(shippingVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{language === 'et' ? 'Kohaletoimetamine (koos KM-ga)' : 'Shipping (incl VAT)'}</span>
                        <span data-testid="text-shipping" className="text-sm">{formatDualPrice(shippingCost)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-semibold">
                        <span>{language === 'et' ? 'Kokku KM 24%' : 'Total VAT 24%'}</span>
                        <span data-testid="text-total-vat" className="text-sm">{formatDualPrice(totalVat.vatAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>{language === 'et' ? 'Kokku (koos KM-ga)' : 'Total (incl VAT)'}</span>
                        <span data-testid="text-total" className="text-base">{formatDualPrice(grandTotal)}</span>
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
