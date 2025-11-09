import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const [, params] = useRoute("/products/:categorySlug?");
  const { language } = useLanguage();
  
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const category = categories?.find(c => c.slug === params?.categorySlug);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', category?.id],
    enabled: !params?.categorySlug || !!category,
  });
  
  const categoryName = category 
    ? (language === 'et' ? category.nameEt : category.nameEn)
    : (language === 'et' ? 'Kõik tooted' : 'All Products');
    
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
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <ProductGrid products={products} />
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
