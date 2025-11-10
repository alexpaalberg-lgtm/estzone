import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductGrid from "@/components/ProductGrid";
import ProductFilters from "@/components/ProductFilters";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { Product, Category } from "@shared/schema";

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest';

export default function Products() {
  const [, params] = useRoute("/products/:categorySlug?");
  const { language } = useLanguage();
  
  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  const category = categories?.find(c => c.slug === params?.categorySlug);
  
  const queryKey = params?.categorySlug && category?.id 
    ? `/api/products?categoryId=${category.id}`
    : '/api/products';
    
  const { data: allProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [queryKey],
    enabled: !params?.categorySlug || (!!category && !categoriesLoading),
  });
  
  const isLoading = categoriesLoading || productsLoading;
  
  // Extract unique brands from products
  const brands = useMemo(() => {
    if (!allProducts) return [];
    const brandSet = new Set<string>();
    allProducts.forEach(product => {
      const name = product.nameEn;
      // Extract brand from product name (first word usually)
      const brand = name.split(' ')[0];
      if (brand && brand.length > 2) {
        brandSet.add(brand);
      }
    });
    return Array.from(brandSet).sort();
  }, [allProducts]);
  
  // Filter and sort products
  const products = useMemo(() => {
    if (!allProducts) return [];
    
    let filtered = allProducts.filter(product => {
      const price = parseFloat(product.salePrice || product.price);
      
      // Price filter
      if (price < priceRange[0] || price > priceRange[1]) return false;
      
      // Brand filter
      if (selectedBrands.length > 0) {
        const productBrand = product.nameEn.split(' ')[0];
        if (!selectedBrands.includes(productBrand)) return false;
      }
      
      // Stock filter
      if (inStockOnly && product.stock <= 0) return false;
      
      // Sale filter
      if (onSaleOnly && !product.salePrice) return false;
      
      return true;
    });
    
    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parseFloat(a.salePrice || a.price) - parseFloat(b.salePrice || b.price);
        case 'price-desc':
          return parseFloat(b.salePrice || b.price) - parseFloat(a.salePrice || a.price);
        case 'name-asc':
          return a.nameEn.localeCompare(b.nameEn);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        case 'featured':
        default:
          return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
    });
    
    return filtered;
  }, [allProducts, priceRange, selectedBrands, inStockOnly, onSaleOnly, sortBy]);
  
  const categoryName = category 
    ? (language === 'et' ? category.nameEt : category.nameEn)
    : (language === 'et' ? 'Kõik tooted' : 'All Products');
    
  const categoryDescription = category
    ? (language === 'et' ? category.descriptionEt : category.descriptionEn)
    : '';
  
  const handleClearFilters = () => {
    setPriceRange([0, 3000]);
    setSelectedBrands([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
  };
  
  const t = {
    sortBy: language === 'et' ? 'Sorteeri' : 'Sort By',
    featured: language === 'et' ? 'Esiletoodud' : 'Featured',
    priceAsc: language === 'et' ? 'Hind: Madal-Kõrge' : 'Price: Low-High',
    priceDesc: language === 'et' ? 'Hind: Kõrge-Madal' : 'Price: High-Low',
    nameAsc: language === 'et' ? 'Nimi: A-Z' : 'Name: A-Z',
    newest: language === 'et' ? 'Uusimad' : 'Newest',
    filters: language === 'et' ? 'Filtrid' : 'Filters',
    productsCount: language === 'et' ? `${products.length} toodet` : `${products.length} products`,
  };
  
  const FiltersContent = (
    <ProductFilters
      categories={categories}
      selectedCategory={params?.categorySlug}
      priceRange={priceRange}
      maxPrice={3000}
      onPriceChange={setPriceRange}
      brands={brands}
      selectedBrands={selectedBrands}
      onBrandToggle={(brand) => {
        setSelectedBrands(prev =>
          prev.includes(brand)
            ? prev.filter(b => b !== brand)
            : [...prev, brand]
        );
      }}
      inStockOnly={inStockOnly}
      onInStockToggle={() => setInStockOnly(!inStockOnly)}
      onSaleOnly={onSaleOnly}
      onOnSaleToggle={() => setOnSaleOnly(!onSaleOnly)}
      onClearFilters={handleClearFilters}
    />
  );
  
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
        
        {/* Products with Filters */}
        <div className="container mx-auto px-4 py-12">
          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              {FiltersContent}
            </aside>
            
            {/* Products Area */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  {/* Mobile Filters Button */}
                  <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="lg:hidden" data-testid="button-mobile-filters">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        {t.filters}
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 overflow-y-auto">
                      {FiltersContent}
                    </SheetContent>
                  </Sheet>
                  
                  <span className="text-sm text-muted-foreground" data-testid="text-product-count">
                    {t.productsCount}
                  </span>
                </div>
                
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-48" data-testid="select-sort">
                    <SelectValue placeholder={t.sortBy} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured" data-testid="option-featured">{t.featured}</SelectItem>
                    <SelectItem value="price-asc" data-testid="option-price-asc">{t.priceAsc}</SelectItem>
                    <SelectItem value="price-desc" data-testid="option-price-desc">{t.priceDesc}</SelectItem>
                    <SelectItem value="name-asc" data-testid="option-name-asc">{t.nameAsc}</SelectItem>
                    <SelectItem value="newest" data-testid="option-newest">{t.newest}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Products Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
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
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
