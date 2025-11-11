import ProductCard from './ProductCard';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Product } from '@shared/schema';

interface ProductGridProps {
  products: Product[];
  showHeader?: boolean;
}

export default function ProductGrid({ products, showHeader = true }: ProductGridProps) {
  const { language } = useLanguage();
  
  return (
    <div className="w-full">
      {showHeader && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-3xl font-bold" data-testid="text-section-title">
              {language === 'et' ? 'Tooted' : 'Products'}
            </h2>
            <p className="text-muted-foreground" data-testid="text-product-count">
              {language === 'et' ? `${products.length} toodet` : `${products.length} products`}
            </p>
          </div>
          <p className="text-muted-foreground" data-testid="text-section-subtitle">
            {language === 'et' ? 'Avasta meie mängutarvikute valikut' : 'Discover our selection of gaming gear'}
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
