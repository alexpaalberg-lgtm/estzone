import { Link } from 'wouter';
import { ShoppingCart, Search, User, Menu, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@shared/schema';
import logoImage from '@assets/generated_images/EstZone_company_logo_8c405552.png';
import { useMemo } from 'react';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems, setIsOpen } = useCart();
  
  const { data: categories, isLoading, isError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000, // Categories are static, cache for 5 minutes
  });
  
  // Group categories by parent
  const { parentCategories, subcategoriesByParent } = useMemo(() => {
    if (!categories) return { parentCategories: [], subcategoriesByParent: {} };
    
    const parents = categories.filter(c => !c.parentId);
    const subMap: Record<string, Category[]> = {};
    
    categories.forEach(cat => {
      if (cat.parentId) {
        if (!subMap[cat.parentId]) {
          subMap[cat.parentId] = [];
        }
        subMap[cat.parentId].push(cat);
      }
    });
    
    return { parentCategories: parents, subcategoriesByParent: subMap };
  }, [categories]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-3 h-24 sm:h-28 items-center gap-4">
          <Link href="/" className="justify-self-start">
            <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md cursor-pointer" data-testid="link-home">
              <img src={logoImage} alt="EstZone" className="h-12 sm:h-14 w-auto" />
            </div>
          </Link>
          
          <div className="justify-self-center">
            <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight whitespace-nowrap">
              <span className="text-foreground">Est</span>
              <span className="text-primary">Zone</span>
            </span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <nav className="hidden md:flex items-center gap-1">
              <NavigationMenu>
                <NavigationMenuList>
                  {parentCategories.map((parent) => {
                  const subcats = subcategoriesByParent[parent.id] || [];
                  const parentName = language === 'et' ? parent.nameEt : parent.nameEn;
                  
                  if (subcats.length === 0) {
                    return (
                      <NavigationMenuItem key={parent.id}>
                        <Link href={`/products/${parent.slug}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            data-testid={`link-category-${parent.slug}`}
                          >
                            {parentName}
                          </Button>
                        </Link>
                      </NavigationMenuItem>
                    );
                  }
                  
                  return (
                    <NavigationMenuItem key={parent.id}>
                      <NavigationMenuTrigger 
                        className="h-9 px-3 text-sm"
                        data-testid={`dropdown-category-${parent.slug}`}
                      >
                        {parentName}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid w-[400px] gap-2 p-4">
                          <Link href={`/products/${parent.slug}`}>
                            <div 
                              className="block px-4 py-2 rounded-md hover-elevate active-elevate-2 font-medium"
                              data-testid={`link-all-${parent.slug}`}
                            >
                              {language === 'et' ? `Kõik ${parentName}` : `All ${parentName}`}
                            </div>
                          </Link>
                          <div className="h-px bg-border" />
                          <div className="grid grid-cols-2 gap-1">
                            {subcats.map((sub) => {
                              const subName = language === 'et' ? sub.nameEt : sub.nameEn;
                              return (
                                <Link key={sub.id} href={`/products/${sub.slug}`}>
                                  <div
                                    className="block px-4 py-2 rounded-md hover-elevate active-elevate-2 text-sm text-muted-foreground"
                                    data-testid={`link-subcategory-${sub.slug}`}
                                  >
                                    {subName}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                })}
                
                <NavigationMenuItem>
                  <Link href="/blog">
                    <Button variant="ghost" size="sm" data-testid="link-blog">
                      {t.nav.blog}
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

            <div className="hidden sm:flex relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={language === 'et' ? 'Otsi tooteid...' : 'Search products...'}
                className="pl-9 w-64"
                data-testid="input-search"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === 'en' ? 'et' : 'en')}
              data-testid="button-language-toggle"
              title={language === 'en' ? 'Switch to Estonian' : 'Lülitu inglise keelele'}
            >
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
              data-testid="button-currency-toggle"
              title={currency === 'EUR' ? 'Switch to USD' : 'Switch to EUR'}
            >
              <span className="text-xs font-bold">{currency}</span>
            </Button>

            <Button variant="ghost" size="icon" data-testid="button-account">
              <User className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setIsOpen(true)}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-cart-count"
                >
                  {totalItems}
                </Badge>
              )}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <nav className="flex flex-col gap-2 mt-8">
                  {parentCategories.map((parent) => {
                    const subcats = subcategoriesByParent[parent.id] || [];
                    const parentName = language === 'et' ? parent.nameEt : parent.nameEn;
                    
                    return (
                      <div key={parent.id} className="space-y-1">
                        <Link href={`/products/${parent.slug}`}>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start font-medium"
                            data-testid={`mobile-link-${parent.slug}`}
                          >
                            {parentName}
                          </Button>
                        </Link>
                        {subcats.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {subcats.map((sub) => {
                              const subName = language === 'et' ? sub.nameEt : sub.nameEn;
                              return (
                                <Link key={sub.id} href={`/products/${sub.slug}`}>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm text-muted-foreground"
                                    data-testid={`mobile-link-${sub.slug}`}
                                  >
                                    {subName}
                                  </Button>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  <Link href="/blog">
                    <Button variant="ghost" className="w-full justify-start" data-testid="mobile-link-blog">
                      {t.nav.blog}
                    </Button>
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
