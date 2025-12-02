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
import { ShoppingBag, Package, CreditCard, MapPin, Plus, Award, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Link } from "wouter";
import type { Address } from "@shared/schema";

interface LoyaltyStatus {
  id: string;
  userId: string;
  currentTierId: string | null;
  currentPoints: number;
  lifetimePoints: number;
  totalSpend: string;
  currentTier: {
    id: string;
    nameEn: string;
    nameEt: string;
    discountPercent: string;
    pointsMultiplier: string;
    color: string;
  } | null;
  nextTier: {
    id: string;
    nameEn: string;
    nameEt: string;
    minSpend: string;
  } | null;
  nextTierProgress: number;
  spendToNextTier: number;
}

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
  shippingMethod: z.enum(["omniva_terminal", "omniva_courier", "dpd_pickup", "dpd_courier", "dhl_pickup", "dhl_courier", "venipak_pickup", "venipak_courier"]),
  paymentMethod: z.enum(["stripe", "paypal", "paysera", "montonio"]),
});

const shippingOptions = [
  { id: 'omniva_terminal', name: 'Omniva Pakiautomaat', nameEn: 'Omniva Parcel Terminal', price: 2.99, days: '2-4', carrier: 'Omniva' },
  { id: 'omniva_courier', name: 'Omniva Kuller', nameEn: 'Omniva Courier', price: 4.99, days: '1-2', carrier: 'Omniva' },
  { id: 'dpd_pickup', name: 'DPD Pakipunkt', nameEn: 'DPD Pickup Point', price: 3.49, days: '2-3', carrier: 'DPD' },
  { id: 'dpd_courier', name: 'DPD Kuller', nameEn: 'DPD Home Delivery', price: 5.99, days: '1-2', carrier: 'DPD' },
  { id: 'dhl_pickup', name: 'DHL Pakipunkt', nameEn: 'DHL Service Point', price: 3.99, days: '2-3', carrier: 'DHL' },
  { id: 'dhl_courier', name: 'DHL Kuller', nameEn: 'DHL Express', price: 6.99, days: '1-2', carrier: 'DHL' },
  { id: 'venipak_pickup', name: 'Venipak Pakipunkt', nameEn: 'Venipak Pickup Point', price: 2.99, days: '2-3', carrier: 'Venipak' },
  { id: 'venipak_courier', name: 'Venipak Kuller', nameEn: 'Venipak Home Delivery', price: 4.99, days: '1-2', carrier: 'Venipak' },
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
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountPercent: number;
    discountAmount: string;
    descriptionEn?: string;
    descriptionEt?: string;
  } | null>(null);
  
  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardLoading, setGiftCardLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{
    code: string;
    balance: number;
    amountToApply: number;
  } | null>(null);
  
  // Loyalty points state
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [appliedLoyalty, setAppliedLoyalty] = useState<{
    pointsRedeemed: number;
    discountValue: number;
  } | null>(null);
  
  // Fetch user's loyalty status
  const { data: loyaltyStatus, refetch: refetchLoyalty } = useQuery<LoyaltyStatus>({
    queryKey: ['/api/loyalty/status'],
    enabled: isAuthenticated,
  });
  
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
  const couponDiscount = appliedCoupon ? parseFloat(appliedCoupon.discountAmount) : 0;
  
  // Apply discount to products subtotal (discount reduces taxable amount)
  const discountedProductsTotal = Math.max(0, baseTotalPrice - couponDiscount);
  const subtotalWithShipping = discountedProductsTotal + shippingCost;
  
  // Apply loyalty points discount (100 points = €1)
  const loyaltyDiscount = appliedLoyalty ? appliedLoyalty.discountValue : 0;
  const afterLoyaltyDiscount = Math.max(0, subtotalWithShipping - loyaltyDiscount);
  
  // Apply gift card discount (reduces final amount to pay)
  const giftCardAmount = appliedGiftCard ? appliedGiftCard.amountToApply : 0;
  const grandTotal = Math.max(0, afterLoyaltyDiscount - giftCardAmount);
  
  // Calculate VAT breakdown on discounted amounts
  // Keep values in EUR - formatPrice() will handle conversion to display currency
  const itemsVat = calculateVatBreakdown(discountedProductsTotal);
  const shippingVat = calculateVatBreakdown(shippingCost);
  const totalVat = calculateVatBreakdown(grandTotal);
  
  // Validate and apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setCouponLoading(true);
    try {
      const response = await apiRequest('POST', '/api/coupons/validate', {
        code: couponCode.trim(),
        orderTotal: baseTotalPrice,
        customerEmail: form.getValues('email'),
      });
      
      if (response.valid) {
        setAppliedCoupon({
          id: response.coupon.id,
          code: response.coupon.code,
          discountPercent: response.coupon.discountPercent,
          discountAmount: response.discountAmount,
          descriptionEn: response.coupon.descriptionEn,
          descriptionEt: response.coupon.descriptionEt,
        });
        toast({
          title: language === 'et' ? 'Kupong rakendatud!' : 'Coupon applied!',
          description: language === 'et' 
            ? `Soodustus: -${response.coupon.discountPercent}%` 
            : `Discount: -${response.coupon.discountPercent}%`,
        });
      }
    } catch (error: any) {
      toast({
        title: language === 'et' ? 'Vigane kood' : 'Invalid code',
        description: error.message || (language === 'et' ? 'Kupongi kood ei kehti' : 'Coupon code is invalid'),
        variant: 'destructive',
      });
    } finally {
      setCouponLoading(false);
    }
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast({
      title: language === 'et' ? 'Kupong eemaldatud' : 'Coupon removed',
    });
  };
  
  // Validate and apply gift card
  const handleApplyGiftCard = async () => {
    if (!giftCardCode.trim()) return;
    
    setGiftCardLoading(true);
    try {
      const response = await fetch(`/api/gift-cards/check/${giftCardCode.trim().toUpperCase()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Gift card not found');
      }
      
      const balance = parseFloat(data.balance);
      // Calculate how much can be applied (max is the remaining order total after coupons)
      const orderTotalAfterCoupon = discountedProductsTotal + shippingCost;
      const amountToApply = Math.min(balance, orderTotalAfterCoupon);
      
      setAppliedGiftCard({
        code: data.code,
        balance: balance,
        amountToApply: amountToApply,
      });
      
      toast({
        title: language === 'et' ? 'Kinkekaart lisatud!' : 'Gift card applied!',
        description: language === 'et' 
          ? `Jääk: €${balance.toFixed(2)} | Rakendatud: €${amountToApply.toFixed(2)}` 
          : `Balance: €${balance.toFixed(2)} | Applied: €${amountToApply.toFixed(2)}`,
      });
    } catch (error: any) {
      toast({
        title: language === 'et' ? 'Vigane kinkekaart' : 'Invalid gift card',
        description: error.message || (language === 'et' ? 'Kinkekaart ei kehti' : 'Gift card is invalid'),
        variant: 'destructive',
      });
    } finally {
      setGiftCardLoading(false);
    }
  };
  
  const handleRemoveGiftCard = () => {
    setAppliedGiftCard(null);
    setGiftCardCode('');
    toast({
      title: language === 'et' ? 'Kinkekaart eemaldatud' : 'Gift card removed',
    });
  };
  
  // Calculate max loyalty discount based on available points
  const availablePoints = loyaltyStatus?.currentPoints || 0;
  const maxPointsValue = availablePoints / 100; // 100 points = €1
  const maxRedeemablePoints = Math.min(
    availablePoints,
    Math.floor((discountedProductsTotal + shippingCost) * 100) // Can't redeem more than order total
  );
  
  // Apply loyalty points - just calculate locally, actual redemption happens on order creation
  const handleApplyLoyalty = () => {
    if (pointsToRedeem <= 0 || pointsToRedeem > availablePoints) return;
    
    // Calculate discount value locally (100 points = €1)
    const discountValue = pointsToRedeem / 100;
    
    setAppliedLoyalty({
      pointsRedeemed: pointsToRedeem,
      discountValue: discountValue,
    });
    
    toast({
      title: language === 'et' ? 'Punktid rakendatud!' : 'Points applied!',
      description: language === 'et' 
        ? `${pointsToRedeem} punkti = ${formatPrice(discountValue)} allahindlus`
        : `${pointsToRedeem} points = ${formatPrice(discountValue)} discount`,
    });
  };
  
  const handleRemoveLoyalty = () => {
    setAppliedLoyalty(null);
    setPointsToRedeem(0);
    toast({
      title: language === 'et' ? 'Punktid eemaldatud' : 'Points removed',
    });
  };
  
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
        userId: user?.id || null,
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
        discountAmount: appliedCoupon ? appliedCoupon.discountAmount : '0.00',
        loyaltyDiscount: appliedLoyalty ? appliedLoyalty.discountValue.toFixed(2) : '0.00',
        couponCode: appliedCoupon?.code || null,
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
      
      return await apiRequest('POST', '/api/orders', { 
        order: orderData, 
        items: orderItems, 
        language,
        couponId: appliedCoupon?.id || null,
        giftCard: appliedGiftCard ? {
          code: appliedGiftCard.code,
          amountApplied: appliedGiftCard.amountToApply,
        } : null,
        loyaltyPoints: appliedLoyalty ? {
          pointsRedeemed: appliedLoyalty.pointsRedeemed,
          discountValue: appliedLoyalty.discountValue,
        } : null,
      });
    },
    onSuccess: () => {
      clearCart();
      queryClient.invalidateQueries({ queryKey: ['/api/loyalty/status'] });
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
                    
                    {/* Coupon Code Input */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">
                        {language === 'et' ? 'Sooduskood' : 'Discount Code'}
                      </Label>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md border border-primary/20">
                          <div>
                            <span className="font-mono font-semibold text-primary">{appliedCoupon.code}</span>
                            <span className="ml-2 text-sm text-muted-foreground">(-{appliedCoupon.discountPercent}%)</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            data-testid="button-remove-coupon"
                          >
                            {language === 'et' ? 'Eemalda' : 'Remove'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder={language === 'et' ? 'Sisesta kood' : 'Enter code'}
                            className="font-mono"
                            data-testid="input-coupon-code"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponCode.trim()}
                            data-testid="button-apply-coupon"
                          >
                            {couponLoading 
                              ? (language === 'et' ? 'Kontrollin...' : 'Checking...')
                              : (language === 'et' ? 'Rakenda' : 'Apply')}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Gift Card Code Input */}
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">
                        {language === 'et' ? 'Kinkekaart' : 'Gift Card'}
                      </Label>
                      {appliedGiftCard ? (
                        <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-md border border-green-500/20">
                          <div>
                            <span className="font-mono font-semibold text-green-500">{appliedGiftCard.code}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              (-€{appliedGiftCard.amountToApply.toFixed(2)})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveGiftCard}
                            data-testid="button-remove-gift-card"
                          >
                            {language === 'et' ? 'Eemalda' : 'Remove'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            value={giftCardCode}
                            onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                            placeholder={language === 'et' ? 'EZ-XXXX-XXXX-XXXX' : 'EZ-XXXX-XXXX-XXXX'}
                            className="font-mono"
                            data-testid="input-gift-card-code"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyGiftCard}
                            disabled={giftCardLoading || !giftCardCode.trim()}
                            data-testid="button-apply-gift-card"
                          >
                            {giftCardLoading 
                              ? (language === 'et' ? 'Kontrollin...' : 'Checking...')
                              : (language === 'et' ? 'Rakenda' : 'Apply')}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Loyalty Points Redemption - Only for authenticated users with points */}
                    {isAuthenticated && loyaltyStatus && availablePoints > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Award className="h-4 w-4 text-primary" />
                          {language === 'et' ? 'Lojaalsuspunktid' : 'Loyalty Points'}
                        </Label>
                        {appliedLoyalty ? (
                          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md border border-primary/20">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-primary">{appliedLoyalty.pointsRedeemed} {language === 'et' ? 'punkti' : 'points'}</span>
                              <span className="text-sm text-muted-foreground">
                                (-{formatPrice(appliedLoyalty.discountValue)})
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLoyalty}
                              data-testid="button-remove-loyalty"
                            >
                              {language === 'et' ? 'Eemalda' : 'Remove'}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 p-3 bg-muted/50 rounded-md border">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {language === 'et' ? 'Saadaval' : 'Available'}: 
                                <span className="font-semibold text-foreground ml-1">{availablePoints.toLocaleString()}</span> 
                                {language === 'et' ? ' punkti' : ' points'}
                              </span>
                              <span className="text-muted-foreground">
                                = {formatPrice(maxPointsValue)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>{language === 'et' ? 'Kasuta punktid' : 'Use points'}</span>
                                <span className="font-mono font-semibold">
                                  {pointsToRedeem} = {formatPrice(pointsToRedeem / 100)}
                                </span>
                              </div>
                              <Slider
                                value={[pointsToRedeem]}
                                onValueChange={(value) => setPointsToRedeem(value[0])}
                                max={maxRedeemablePoints}
                                step={100}
                                className="w-full"
                                data-testid="slider-loyalty-points"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0</span>
                                <span>{language === 'et' ? 'Max' : 'Max'}: {maxRedeemablePoints.toLocaleString()}</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={handleApplyLoyalty}
                              disabled={loyaltyLoading || pointsToRedeem <= 0}
                              data-testid="button-apply-loyalty"
                            >
                              {loyaltyLoading 
                                ? (language === 'et' ? 'Rakendan...' : 'Applying...')
                                : (language === 'et' ? `Kasuta ${pointsToRedeem} punkti` : `Use ${pointsToRedeem} points`)}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                              {language === 'et' ? `100 punkti = ${formatPrice(1)} allahindlus` : `100 points = ${formatPrice(1)} discount`}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
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
                      {appliedCoupon && (
                        <div className="flex justify-between text-primary font-medium">
                          <span>
                            {language === 'et' ? 'Sooduskood' : 'Discount'} ({appliedCoupon.code})
                          </span>
                          <span data-testid="text-discount" className="text-sm">-{formatDualPrice(couponDiscount)}</span>
                        </div>
                      )}
                      {appliedLoyalty && (
                        <div className="flex justify-between text-primary font-medium">
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {language === 'et' ? 'Lojaalsuspunktid' : 'Loyalty Points'} ({appliedLoyalty.pointsRedeemed})
                          </span>
                          <span data-testid="text-loyalty" className="text-sm">-€{appliedLoyalty.discountValue.toFixed(2)}</span>
                        </div>
                      )}
                      {appliedGiftCard && (
                        <div className="flex justify-between text-green-500 font-medium">
                          <span>
                            {language === 'et' ? 'Kinkekaart' : 'Gift Card'} ({appliedGiftCard.code})
                          </span>
                          <span data-testid="text-gift-card" className="text-sm">-€{appliedGiftCard.amountToApply.toFixed(2)}</span>
                        </div>
                      )}
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
