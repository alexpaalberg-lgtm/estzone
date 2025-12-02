import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { X, ArrowLeft, Trash2, Plus, ShoppingCart, Star, Truck, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCompare } from '@/contexts/CompareContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getPlatformInfo } from '@/lib/platform';
import PlatformIcon from '@/components/PlatformIcon';
import type { Product } from '@shared/schema';

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare, MAX_COMPARE_ITEMS } = useCompare();
  const { language, t } = useLanguage();
  const { formatPrice } = useCurrency();
  const { addItem } = useCart();
  const { toast } = useToast();
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products/compare', compareItems.join(',')],
    queryFn: async () => {
      if (compareItems.length === 0) return [];
      const response = await fetch(`/api/products/compare?ids=${compareItems.join(',')}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json();
    },
    enabled: compareItems.length > 0,
  });
  
  const handleAddToCart = (product: Product) => {
    const name = language === 'et' ? product.nameEt : product.nameEn;
    const price = product.salePrice ? parseFloat(product.salePrice) : parseFloat(product.price);
    const platformInfo = getPlatformInfo(product.sku, product.nameEn);
    
    addItem({
      id: product.id,
      name,
      price,
      image: product.images?.[0] || '',
      sku: product.sku,
      platform: platformInfo?.label,
    });
    
    toast({
      title: language === 'et' ? 'Lisatud ostukorvi' : 'Added to cart',
      description: name,
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }
  
  const emptySlots = MAX_COMPARE_ITEMS - (products?.length || 0);
  
  return (
    <div className="container mx-auto px-4 py-8" data-testid="page-compare">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/shop">
            <Button variant="ghost" size="sm" data-testid="button-back-shop">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'et' ? 'Tagasi poodi' : 'Back to Shop'}
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {language === 'et' ? 'Toodete võrdlus' : 'Compare Products'}
          </h1>
        </div>
        
        {products && products.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearCompare}
            data-testid="button-clear-compare"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {language === 'et' ? 'Tühjenda võrdlus' : 'Clear All'}
          </Button>
        )}
      </div>
      
      {(!products || products.length === 0) ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground mb-4">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">
              {language === 'et' ? 'Võrdlus on tühi' : 'Compare list is empty'}
            </h2>
            <p>
              {language === 'et' 
                ? 'Lisa tooteid võrdlusesse, et neid kõrvuti näha.'
                : 'Add products to compare them side by side.'}
            </p>
          </div>
          <Link href="/shop">
            <Button data-testid="button-browse-products">
              {language === 'et' ? 'Sirvi tooteid' : 'Browse Products'}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-separate border-spacing-4">
            <thead>
              <tr>
                <th className="w-32"></th>
                {products.map(product => {
                  const name = language === 'et' ? product.nameEt : product.nameEn;
                  const platformInfo = getPlatformInfo(product.sku, product.nameEn);
                  
                  return (
                    <th key={product.id} className="align-top" data-testid={`compare-product-${product.id}`}>
                      <Card className="relative p-4">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute top-2 right-2 h-6 w-6"
                          onClick={() => removeFromCompare(product.id)}
                          data-testid={`button-remove-compare-${product.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        
                        <Link href={`/product/${product.id}`}>
                          <div className="aspect-square bg-black/40 rounded-lg mb-3 overflow-hidden hover:opacity-80 transition-opacity">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </div>
                        </Link>
                        
                        {platformInfo && (
                          <div className="mb-2">
                            <PlatformIcon platformInfo={platformInfo} size="sm" />
                          </div>
                        )}
                        
                        <Link href={`/product/${product.id}`}>
                          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
                            {name}
                          </h3>
                        </Link>
                      </Card>
                    </th>
                  );
                })}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <th key={`empty-${i}`} className="align-top">
                    <Link href="/shop">
                      <Card className="p-4 h-full min-h-[200px] flex flex-col items-center justify-center text-muted-foreground hover-elevate cursor-pointer">
                        <Plus className="h-8 w-8 mb-2" />
                        <span className="text-sm">
                          {language === 'et' ? 'Lisa toode' : 'Add Product'}
                        </span>
                      </Card>
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-medium text-muted-foreground text-sm">
                  {language === 'et' ? 'Hind' : 'Price'}
                </td>
                {products.map(product => {
                  const price = parseFloat(product.price);
                  const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
                  
                  return (
                    <td key={product.id} className="text-center" data-testid={`compare-price-${product.id}`}>
                      <Card className="p-3">
                        {salePrice ? (
                          <div className="space-y-1">
                            <span className="text-lg font-bold text-primary">{formatPrice(salePrice)}</span>
                            <div className="text-sm text-muted-foreground line-through">{formatPrice(price)}</div>
                            <Badge variant="destructive" className="text-xs">
                              -{Math.round((1 - salePrice / price) * 100)}%
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-primary">{formatPrice(price)}</span>
                        )}
                      </Card>
                    </td>
                  );
                })}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`empty-price-${i}`}><Card className="p-3 text-center text-muted-foreground">-</Card></td>
                ))}
              </tr>
              
              <tr>
                <td className="font-medium text-muted-foreground text-sm">
                  {language === 'et' ? 'Saadavus' : 'Availability'}
                </td>
                {products.map(product => {
                  const inStock = product.stock > 0;
                  const lowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 10);
                  
                  return (
                    <td key={product.id} className="text-center" data-testid={`compare-stock-${product.id}`}>
                      <Card className="p-3">
                        {inStock ? (
                          <div className="flex items-center justify-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span className={lowStock ? 'text-amber-500' : 'text-green-500'}>
                              {lowStock 
                                ? (language === 'et' ? 'Vähe laos' : 'Low Stock')
                                : (language === 'et' ? 'Laos' : 'In Stock')
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="text-red-500">
                            {language === 'et' ? 'Otsas' : 'Out of Stock'}
                          </span>
                        )}
                      </Card>
                    </td>
                  );
                })}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`empty-stock-${i}`}><Card className="p-3 text-center text-muted-foreground">-</Card></td>
                ))}
              </tr>
              
              <tr>
                <td className="font-medium text-muted-foreground text-sm">
                  {language === 'et' ? 'Tarne' : 'Delivery'}
                </td>
                {products.map(product => (
                  <td key={product.id} className="text-center" data-testid={`compare-delivery-${product.id}`}>
                    <Card className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {product.stock > 0 
                            ? (language === 'et' ? '1-3 tööpäeva' : '1-3 business days')
                            : '-'
                          }
                        </span>
                      </div>
                    </Card>
                  </td>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`empty-delivery-${i}`}><Card className="p-3 text-center text-muted-foreground">-</Card></td>
                ))}
              </tr>
              
              <tr>
                <td className="font-medium text-muted-foreground text-sm">SKU</td>
                {products.map(product => (
                  <td key={product.id} className="text-center" data-testid={`compare-sku-${product.id}`}>
                    <Card className="p-3">
                      <code className="text-xs">{product.sku}</code>
                    </Card>
                  </td>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`empty-sku-${i}`}><Card className="p-3 text-center text-muted-foreground">-</Card></td>
                ))}
              </tr>
              
              <tr>
                <td></td>
                {products.map(product => (
                  <td key={product.id} className="text-center" data-testid={`compare-actions-${product.id}`}>
                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                      data-testid={`button-add-cart-compare-${product.id}`}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {language === 'et' ? 'Lisa korvi' : 'Add to Cart'}
                    </Button>
                  </td>
                ))}
                {Array.from({ length: emptySlots }).map((_, i) => (
                  <td key={`empty-action-${i}`}></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
