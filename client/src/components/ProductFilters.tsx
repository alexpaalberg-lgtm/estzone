import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'wouter';
import { X } from 'lucide-react';
import type { Category } from '@shared/schema';

interface ProductFiltersProps {
  categories?: Category[];
  selectedCategory?: string;
  priceRange: [number, number];
  maxPrice: number;
  onPriceChange: (range: [number, number]) => void;
  brands: string[];
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;
  inStockOnly: boolean;
  onInStockToggle: () => void;
  onSaleOnly: boolean;
  onOnSaleToggle: () => void;
  onClearFilters: () => void;
}

export default function ProductFilters({
  categories,
  selectedCategory,
  priceRange,
  maxPrice,
  onPriceChange,
  brands,
  selectedBrands,
  onBrandToggle,
  inStockOnly,
  onInStockToggle,
  onSaleOnly,
  onOnSaleToggle,
  onClearFilters,
}: ProductFiltersProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();

  const t = {
    filters: language === 'et' ? 'Filtrid' : 'Filters',
    clearAll: language === 'et' ? 'Tühjenda' : 'Clear All',
    priceRange: language === 'et' ? 'Hind' : 'Price Range',
    brands: language === 'et' ? 'Kaubamärk' : 'Brand',
    availability: language === 'et' ? 'Saadavus' : 'Availability',
    inStock: language === 'et' ? 'Ainult laos' : 'In Stock Only',
    onSale: language === 'et' ? 'Ainult soodustusega' : 'On Sale Only',
    categories: language === 'et' ? 'Kategooriad' : 'Categories',
  };

  // Group categories by parent
  const parentCategories = categories?.filter(c => !c.parentId) || [];
  const subcategoriesByParent = categories?.reduce((acc, cat) => {
    if (cat.parentId) {
      if (!acc[cat.parentId]) acc[cat.parentId] = [];
      acc[cat.parentId].push(cat);
    }
    return acc;
  }, {} as Record<string, Category[]>);

  const hasActiveFilters = 
    priceRange[0] > 0 || 
    priceRange[1] < maxPrice || 
    selectedBrands.length > 0 || 
    inStockOnly || 
    onSaleOnly;

  return (
    <div className="space-y-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" data-testid="text-filters-title">{t.filters}</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
            <X className="h-4 w-4 mr-1" />
            {t.clearAll}
          </Button>
        )}
      </div>

      {/* Categories with Subcategories */}
      {categories && categories.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3" data-testid="text-categories-filter">
            {t.categories}
          </h3>
          <div className="space-y-2">
            {parentCategories.map(parent => {
              const subcats = subcategoriesByParent?.[parent.id] || [];
              const categoryName = language === 'et' ? parent.nameEt : parent.nameEn;
              
              return (
                <div key={parent.id} className="space-y-1">
                  <Link
                    href={`/products/${parent.slug}`}
                    className={`block px-3 py-2 rounded-md hover-elevate active-elevate-2 text-sm ${
                      selectedCategory === parent.slug 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-foreground'
                    }`}
                    data-testid={`link-category-${parent.slug}`}
                  >
                    {categoryName}
                  </Link>
                  {subcats.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {subcats.map(sub => {
                        const subName = language === 'et' ? sub.nameEt : sub.nameEn;
                        return (
                          <Link
                            key={sub.id}
                            href={`/products/${sub.slug}`}
                            className={`block px-3 py-1.5 rounded-md hover-elevate active-elevate-2 text-sm ${
                              selectedCategory === sub.slug
                                ? 'bg-primary/10 text-primary font-medium'
                                : 'text-muted-foreground'
                            }`}
                            data-testid={`link-subcategory-${sub.slug}`}
                          >
                            {subName}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Price Range */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4" data-testid="text-price-filter">
          {t.priceRange}
        </h3>
        <div className="space-y-4">
          <Slider
            min={0}
            max={maxPrice}
            step={10}
            value={priceRange}
            onValueChange={(value) => onPriceChange(value as [number, number])}
            className="mb-2"
            data-testid="slider-price-range"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span data-testid="text-min-price">{formatPrice(priceRange[0])}</span>
            <span data-testid="text-max-price">{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </Card>

      {/* Brands */}
      {brands.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3" data-testid="text-brands-filter">
            {t.brands}
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map(brand => (
              <div key={brand} className="flex items-center space-x-2">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => onBrandToggle(brand)}
                  data-testid={`checkbox-brand-${brand}`}
                />
                <Label
                  htmlFor={`brand-${brand}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Availability */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3" data-testid="text-availability-filter">
          {t.availability}
        </h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="in-stock"
              checked={inStockOnly}
              onCheckedChange={onInStockToggle}
              data-testid="checkbox-in-stock"
            />
            <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
              {t.inStock}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="on-sale"
              checked={onSaleOnly}
              onCheckedChange={onOnSaleToggle}
              data-testid="checkbox-on-sale"
            />
            <Label htmlFor="on-sale" className="text-sm font-normal cursor-pointer">
              {t.onSale}
            </Label>
          </div>
        </div>
      </Card>
    </div>
  );
}
