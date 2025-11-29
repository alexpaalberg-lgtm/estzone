import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, ShoppingCart, ChevronRight } from "lucide-react";
import { useState } from "react";
import { getPlatformInfo, isGameProduct } from "@/lib/platform";
import type { Product, Category } from "@shared/schema";

export default function ProductDetail() {
  const [match, params] = useRoute("/product/:id");
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  
  // Guard: only fetch product if we have a valid route match and ID
  const productId = params?.id;
  const { data: product, isLoading } = useQuery<Product>({
    queryKey: productId ? [`/api/products/${productId}`] : ['/api/products/null'],
    enabled: match && !!productId, // Only run query if route matches and ID exists
  });
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
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
      ? `Osta ${productName} EstZone-st. ${inStock ? 'Laos saadaval' : 'Otsas'}. Kiire kohaletoimetamine Eestis.`
      : `Buy ${productName} from EstZone. ${inStock ? 'In stock' : 'Out of stock'}. Fast delivery in Estonia.`);
  
  const platformInfo = getPlatformInfo(product.sku, product.nameEn);
  const isGame = isGameProduct(product.sku);
  
  const handleAddToCart = () => {
    if (!inStock) return;
    
    addItem({
      id: product.id,
      name: productName,
      price: salePrice || price,
      image: product.images?.[0] || '',
      sku: product.sku,
      platform: platformInfo?.label,
    }, quantity);
    
    toast({
      title: language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart',
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
          availability: inStock ? 'in stock' : 'out of stock',
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
            {/* Product Image */}
            <div className="rounded-md border border-border overflow-hidden bg-card">
              <img
                src={product.images?.[0] || '/images/placeholder.jpg'}
                alt={productName}
                className="w-full aspect-square object-cover"
                data-testid="img-product"
              />
            </div>
            
            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold" data-testid="text-product-name">
                    {productName}
                  </h1>
                  {platformInfo && isGame && (
                    <Badge 
                      className={`text-sm border ${platformInfo.bgColor} ${platformInfo.color}`}
                      data-testid="badge-platform"
                    >
                      {platformInfo.label}
                    </Badge>
                  )}
                </div>
                
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
                
                <div className="flex items-center gap-2">
                  {inStock ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-500" data-testid="badge-in-stock">
                      {language === 'et' ? 'Laos' : 'In Stock'} ({product.stock})
                    </Badge>
                  ) : (
                    <Badge variant="destructive" data-testid="badge-out-of-stock">
                      {language === 'et' ? 'Otsas' : 'Out of Stock'}
                    </Badge>
                  )}
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
                    disabled={!inStock}
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
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={!inStock}
                    data-testid="button-increase-quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Add to Cart */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={!inStock}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {language === 'et' ? 'Lisa ostukorvi' : 'Add to Cart'}
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{language === 'et' ? 'SKU:' : 'SKU:'} <span className="text-foreground" data-testid="text-sku">{product.sku}</span></p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
