import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ShoppingCart, ChevronRight, Truck, Shield, RotateCcw, CreditCard, Play, Heart, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import ProductReviews, { RatingBadge } from "@/components/ProductReviews";

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    /(?:youtube\.com\/shorts\/)([^"&?\/\s]{11})/i,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}
import { getPlatformInfo, isGameProduct } from "@/lib/platform";
import PlatformIcon from "@/components/PlatformIcon";
import type { Product, Category } from "@shared/schema";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:id");
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [quantity, setQuantity] = useState(1);
  
  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [params?.id]);
  
  // Guard: only fetch product if we have a valid route match and ID
  const productId = params?.id;
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: productId ? [`/api/products/${productId}`] : ['/api/products/null'],
    enabled: match && !!productId, // Only run query if route matches and ID exists
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch related products
  const { data: relatedProducts } = useQuery<Product[]>({
    queryKey: ['/api/recommendations/related', productId],
    enabled: !!productId,
  });
  
  // Fetch frequently bought together products
  const { data: frequentlyBought } = useQuery<Product[]>({
    queryKey: ['/api/products', productId, 'frequently-bought-together'],
    enabled: !!productId,
  });
  
  // Check if product is in wishlist
  const { data: wishlistCheck } = useQuery<{ inWishlist: boolean }>({
    queryKey: ['/api/wishlist/check', productId],
    enabled: isAuthenticated && !!productId,
  });
  
  const addToWishlistMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/wishlist', { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', productId] });
      toast({
        title: language === 'et' ? 'Lisatud soovinimekirja' : 'Added to Wishlist',
        description: language === 'et' ? 'Toode lisati sinu soovinimekirja' : 'Product added to your wishlist',
      });
    },
  });
  
  const removeFromWishlistMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', `/api/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['/api/wishlist/check', productId] });
      toast({
        title: language === 'et' ? 'Eemaldatud' : 'Removed',
        description: language === 'et' ? 'Toode eemaldati soovinimekirjast' : 'Product removed from wishlist',
      });
    },
  });
  
  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      window.location.href = '/api/login';
      return;
    }
    if (wishlistCheck?.inWishlist) {
      removeFromWishlistMutation.mutate();
    } else {
      addToWishlistMutation.mutate();
    }
  };
  
  const category = categories?.find(c => c.id === product?.categoryId);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {language === 'et' ? 'Toodet ei leitud' : 'Product not found'}
          </h1>
          <Link href="/">
            <Button>
              {language === 'et' ? 'Tagasi avalehele' : 'Back to home'}
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }
  
  const productName = language === 'et' ? product.nameEt : product.nameEn;
  const productDescription = language === 'et' ? product.descriptionEt : product.descriptionEn;
  const categoryName = category ? (language === 'et' ? category.nameEt : category.nameEn) : '';
  const price = parseFloat(product.price);
  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
  const inStock = product.stock > 0;
  
  const displayPrice = salePrice || price;
  const productKeywords = product.metaKeywords || `${productName}, ${categoryName}, gaming, Estonia, EstZone`;
  const seoDescription = productDescription || 
    (language === 'et' 
      ? `Osta ${productName} EstZone-st. ${inStock ? 'Laos saadaval' : 'Tellimisel'}. Kiire kohaletoimetamine Eestis.`
      : `Buy ${productName} from EstZone. ${inStock ? 'In stock' : 'Pre-order available'}. Fast delivery in Estonia.`);
  
  const platformInfo = getPlatformInfo(product.sku, product.nameEn);
  const isGame = isGameProduct(product.sku);
  
  const isPreOrder = !inStock;
  const deliveryMin = inStock ? 2 : 5;
  const deliveryMax = inStock ? 4 : 10;
  
  const handleAddToCart = () => {
    
    addItem({
      id: product.id,
      name: productName,
      price: salePrice || price,
      image: product.images?.[0] || '',
      sku: product.sku,
      platform: platformInfo?.label,
    }, quantity);
    
    toast({
      title: isPreOrder 
        ? (language === 'et' ? 'Eeltellimus lisatud' : 'Pre-order added')
        : (language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart'),
      description: `${quantity}x ${productName}`,
    });
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={productName}
        description={seoDescription}
        keywords={productKeywords}
        ogType="product"
        ogImage={product.images?.[0] || '/og-default.jpg'}
        product={{
          price: displayPrice.toString(),
          currency: 'EUR',
          availability: 'in stock',
        }}
      />
      <Header />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8" data-testid="breadcrumb">
            <Link href="/" className="hover:text-foreground">
              {language === 'et' ? 'Avaleht' : 'Home'}
            </Link>
            <ChevronRight className="h-4 w-4" />
            {category && (
              <>
                <Link href={`/products/${category.slug}`} className="hover:text-foreground">
                  {categoryName}
                </Link>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
            <span className="text-foreground">{productName}</span>
          </div>
          
          {/* Product Details */}
          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image and Video */}
            <div className="space-y-4">
              <div className="rounded-md border border-border overflow-hidden bg-card">
                <img
                  src={product.images?.[0] || '/images/placeholder.jpg'}
                  alt={productName}
                  className="w-full aspect-square object-cover"
                  data-testid="img-product"
                />
              </div>
              
              {/* YouTube Trailer Video */}
              {product.videoUrl && getYouTubeVideoId(product.videoUrl) && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    {language === 'et' ? 'Treiler' : 'Trailer'}
                  </h3>
                  <div className="rounded-md border border-border overflow-hidden bg-card aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${getYouTubeVideoId(product.videoUrl)}`}
                      title={`${productName} trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                      data-testid="video-trailer"
                    />
                  </div>
                </div>
              )}
              
              {/* Additional Images */}
              {product.images && product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1, 5).map((img, idx) => (
                    <div key={idx} className="rounded-md border border-border overflow-hidden bg-card aspect-square">
                      <img
                        src={img}
                        alt={`${productName} ${idx + 2}`}
                        className="w-full h-full object-cover"
                        data-testid={`img-product-${idx + 2}`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="text-4xl font-bold" data-testid="text-product-name">
                    {productName}
                  </h1>
                  {platformInfo && isGame && (
                    <PlatformIcon platformInfo={platformInfo} size="md" data-testid="badge-platform" />
                  )}
                </div>
                <RatingBadge productId={product.id} />
                
                <div className="flex items-center gap-4 mb-4">
                  {salePrice ? (
                    <>
                      <span className="text-4xl font-bold text-primary" data-testid="text-sale-price">
                        {formatPrice(salePrice)}
                      </span>
                      <span className="text-2xl text-muted-foreground line-through" data-testid="text-original-price">
                        {formatPrice(price)}
                      </span>
                      <Badge variant="destructive" data-testid="badge-sale">
                        {language === 'et' ? 'Soodustus' : 'Sale'}
                      </Badge>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-primary" data-testid="text-price">
                      {formatPrice(price)}
                    </span>
                  )}
                </div>
                
                {product.isNew && (
                  <Badge variant="secondary" className="mb-4" data-testid="badge-new">
                    {language === 'et' ? 'Uus' : 'New'}
                  </Badge>
                )}
                
                <div className="flex items-center gap-3 flex-wrap">
                  {inStock ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-500" data-testid="badge-in-stock">
                      {language === 'et' ? 'Laos' : 'In Stock'} ({product.stock})
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-500/10 text-blue-500" data-testid="badge-pre-order">
                      {language === 'et' ? 'Tellimisel' : 'Pre-order'}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Truck className="h-4 w-4" />
                    {language === 'et' 
                      ? `Tarne ${deliveryMin}-${deliveryMax} päeva` 
                      : `Delivery ${deliveryMin}-${deliveryMax} days`}
                  </span>
                </div>
              </div>
              
              {productDescription && (
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    {language === 'et' ? 'Kirjeldus' : 'Description'}
                  </h2>
                  <p className="text-muted-foreground" data-testid="text-description">
                    {productDescription}
                  </p>
                </div>
              )}
              
              {/* Quantity Selector */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {language === 'et' ? 'Kogus:' : 'Quantity:'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    data-testid="button-decrease-quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => setQuantity(inStock ? Math.min(product.stock, quantity + 1) : quantity + 1)}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Add to Cart & Wishlist */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isPreOrder 
                    ? (language === 'et' ? 'Eeltelli' : 'Pre-order')
                    : (language === 'et' ? 'Lisa ostukorvi' : 'Add to Cart')}
                </Button>
                <Button
                  size="lg"
                  variant={wishlistCheck?.inWishlist ? "default" : "outline"}
                  onClick={handleWishlistToggle}
                  disabled={addToWishlistMutation.isPending || removeFromWishlistMutation.isPending}
                  data-testid="button-wishlist-toggle"
                  title={language === 'et' ? (wishlistCheck?.inWishlist ? 'Eemalda soovinimekirjast' : 'Lisa soovinimekirja') : (wishlistCheck?.inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist')}
                >
                  <Heart className={`h-5 w-5 ${wishlistCheck?.inWishlist ? 'fill-current' : ''}`} />
                </Button>
              </div>
              
              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-card border">
                  <Truck className="h-5 w-5 text-primary shrink-0" />
                  <span>{language === 'et' ? 'Tasuta transport üle €50' : 'Free shipping over €50'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-card border">
                  <Shield className="h-5 w-5 text-primary shrink-0" />
                  <span>{language === 'et' ? '1-aastane garantii' : '1-year warranty'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-card border">
                  <RotateCcw className="h-5 w-5 text-primary shrink-0" />
                  <span>{language === 'et' ? '14 päeva tagastus' : '14-day returns'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-card border">
                  <CreditCard className="h-5 w-5 text-primary shrink-0" />
                  <span>{language === 'et' ? 'Turvaline makse' : 'Secure payment'}</span>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{language === 'et' ? 'SKU:' : 'SKU:'} <span className="text-foreground" data-testid="text-sku">{product.sku}</span></p>
              </div>
            </div>
          </div>
          
          {/* Reviews Section */}
          <div className="mt-16 border-t pt-8">
            <ProductReviews productId={product.id} />
          </div>
          
          {/* Frequently Bought Together Section */}
          {frequentlyBought && frequentlyBought.length > 0 && (
            <div className="mt-16 border-t pt-8" data-testid="section-frequently-bought">
              <h2 className="text-2xl font-bold mb-6">
                {language === 'et' ? 'Sageli ostetakse koos' : 'Frequently Bought Together'}
              </h2>
              <div className="bg-card border rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {/* Current product */}
                  <div className="text-center">
                    <img
                      src={product.images?.[0] || '/placeholder.png'}
                      alt={language === 'et' ? product.nameEt : product.nameEn}
                      className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
                    />
                    <p className="text-sm font-medium line-clamp-2 max-w-[120px]">
                      {language === 'et' ? product.nameEt : product.nameEn}
                    </p>
                    <p className="text-primary font-semibold">
                      {formatPrice(parseFloat(product.salePrice || product.price))}
                    </p>
                  </div>
                  
                  {/* Plus signs and frequently bought products */}
                  {frequentlyBought.slice(0, 3).map((fbtProduct) => (
                    <div key={fbtProduct.id} className="flex items-center gap-4">
                      <div className="text-2xl text-muted-foreground">+</div>
                      <Link href={`/product/${fbtProduct.id}`}>
                        <div className="text-center hover-elevate cursor-pointer rounded-lg p-2 -m-2">
                          <img
                            src={fbtProduct.images?.[0] || '/placeholder.png'}
                            alt={language === 'et' ? fbtProduct.nameEt : fbtProduct.nameEn}
                            className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
                          />
                          <p className="text-sm font-medium line-clamp-2 max-w-[120px]">
                            {language === 'et' ? fbtProduct.nameEt : fbtProduct.nameEn}
                          </p>
                          <p className="text-primary font-semibold">
                            {formatPrice(parseFloat(fbtProduct.salePrice || fbtProduct.price))}
                          </p>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
                
                {/* Bundle price and add all button */}
                <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-muted-foreground">
                      {language === 'et' ? 'Paketi hind' : 'Bundle Price'}
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(
                        parseFloat(product.salePrice || product.price) +
                        frequentlyBought.slice(0, 3).reduce((sum, p) => sum + parseFloat(p.salePrice || p.price), 0)
                      )}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={() => {
                      addItem({
                        id: product.id,
                        name: language === 'et' ? product.nameEt : product.nameEn,
                        price: parseFloat(product.salePrice || product.price),
                        image: product.images?.[0] || '/placeholder.png',
                      });
                      frequentlyBought.slice(0, 3).forEach((fbtProduct) => {
                        addItem({
                          id: fbtProduct.id,
                          name: language === 'et' ? fbtProduct.nameEt : fbtProduct.nameEn,
                          price: parseFloat(fbtProduct.salePrice || fbtProduct.price),
                          image: fbtProduct.images?.[0] || '/placeholder.png',
                        });
                      });
                      toast({
                        title: language === 'et' ? 'Pakett lisatud' : 'Bundle Added',
                        description: language === 'et' 
                          ? 'Kõik tooted lisati ostukorvi'
                          : 'All products added to cart',
                      });
                    }}
                    data-testid="button-add-bundle"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {language === 'et' ? 'Lisa kõik ostukorvi' : 'Add All to Cart'}
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Related Products Section */}
          {relatedProducts && relatedProducts.length > 0 && (
            <div className="mt-16" data-testid="section-related-products">
              <h2 className="text-2xl font-bold mb-6">
                {language === 'et' ? 'Sarnased tooted' : 'Related Products'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <ProductCard key={relatedProduct.id} product={relatedProduct} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
