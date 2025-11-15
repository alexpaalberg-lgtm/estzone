import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [, params] = useRoute("/products/:categorySlug?");
  const { language } = useLanguage();
  const [sortBy, setSortBy] = useState<string>("newest");
  
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const category = categories?.find(c => c.slug === params?.categorySlug);
  
  const queryParams = useMemo(() => {
    const params: Record<string, string> = { sort: sortBy };
    if (category?.id) {
      params.categoryId = category.id;
    }
    return params;
  }, [sortBy, category?.id]);
    
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', queryParams],
    enabled: !params?.categorySlug || (!!category && !categoriesLoading),
  });
  
  const isLoading = categoriesLoading || productsLoading;
  
  const categoryName = category 
    ? (language === 'et' ? category.nameEt : category.nameEn)
    : (language === 'et' ? 'Tooted' : 'Products');
    
  const categoryDescription = category
    ? (language === 'et' ? category.descriptionEt : category.descriptionEn)
    : '';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Category Hero */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-category-name">
              {categoryName}
            </h1>
            {categoryDescription && (
              <p className="text-muted-foreground text-lg max-w-3xl" data-testid="text-category-description">
                {categoryDescription}
              </p>
            )}
          </div>
        </div>
        
        {/* Products */}
        <div className="container mx-auto px-4 py-12">
          {/* Sorting Controls */}
          <div className="flex items-center justify-between mb-8">
            <p className="text-muted-foreground" data-testid="text-product-count">
              {products ? (language === 'et' ? `${products.length} toodet` : `${products.length} products`) : ''}
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="text-sm text-muted-foreground">
                {language === 'et' ? 'Järjesta:' : 'Sort by:'}
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort-select" className="w-[200px]" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest" data-testid="option-newest">
                    {language === 'et' ? 'Uuemad enne' : 'Newest first'}
                  </SelectItem>
                  <SelectItem value="oldest" data-testid="option-oldest">
                    {language === 'et' ? 'Vanemad enne' : 'Oldest first'}
                  </SelectItem>
                  <SelectItem value="price_asc" data-testid="option-price-low">
                    {language === 'et' ? 'Hind: madalam enne' : 'Price: Low to High'}
                  </SelectItem>
                  <SelectItem value="price_desc" data-testid="option-price-high">
                    {language === 'et' ? 'Hind: kõrgem enne' : 'Price: High to Low'}
                  </SelectItem>
                  <SelectItem value="name_az" data-testid="option-name-az">
                    {language === 'et' ? 'Nimi: A-Z' : 'Name: A-Z'}
                  </SelectItem>
                  <SelectItem value="name_za" data-testid="option-name-za">
                    {language === 'et' ? 'Nimi: Z-A' : 'Name: Z-A'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <ProductGrid products={products} showHeader={false} />
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg" data-testid="text-no-products">
                {language === 'et' ? 'Tooteid ei leitud' : 'No products found'}
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
