import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Product } from '@shared/schema';
import { useLocation } from 'wouter';

function useLocationChange(callback: () => void) {
  const [location] = useLocation();
  useEffect(() => {
    callback();
  }, [location]);
}

interface SearchBarProps {
  className?: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}

export default function SearchBar({ className, isMobile, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { currency, exchangeRate } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products/search/${debouncedQuery}`],
    enabled: debouncedQuery.length >= 2,
    staleTime: 1000 * 60,
  });

  useLocationChange(() => {
    setIsOpen(false);
    setQuery('');
    onNavigate?.();
  });

  useEffect(() => {
    if (isMobile) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

  const handleResultClick = (productId: string) => {
    setIsOpen(false);
    setQuery('');
    setLocation(`/product/${productId}`);
  };

  const formatPrice = (price: string) => {
    const numPrice = parseFloat(price);
    if (currency === 'USD') {
      return `$${(numPrice / exchangeRate).toFixed(2)}`;
    }
    return `€${numPrice}`;
  };

  const showResults = isOpen && debouncedQuery.length >= 2 && (results.length > 0 || !isLoading);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="search"
        placeholder={language === 'et' ? 'Otsi tooteid...' : 'Search products...'}
        className="pl-9 w-full"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        data-testid="input-search"
      />
      {isLoading && query.length >= 2 && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}

      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground" data-testid="text-no-results">
              {language === 'et' ? 'Tooteid ei leitud' : 'No products found'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((product) => {
                const name = language === 'et' ? product.nameEt : product.nameEn;
                const price = product.salePrice || product.price;
                
                return (
                  <button
                    key={product.id}
                    className="w-full px-4 py-3 flex items-center gap-3 hover-elevate active-elevate-2 text-left"
                    onClick={() => handleResultClick(product.id)}
                    data-testid={`search-result-${product.id}`}
                  >
                    <div className="w-12 h-12 bg-muted rounded-md overflow-hidden flex-shrink-0">
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-sm text-muted-foreground truncate">{product.sku}</div>
                    </div>
                    <div className="text-sm font-medium text-primary flex-shrink-0">
                      {formatPrice(price)}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
