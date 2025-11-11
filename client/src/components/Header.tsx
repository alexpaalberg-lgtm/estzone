import { Link } from 'wouter';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import SearchBar from './SearchBar';
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
import gamingHeaderImage from '@assets/generated_images/Gaming_controller_illustration_header_1c4ec04d.png';
import { useMemo, useState } from 'react';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems, setIsOpen } = useCart();
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  
  const { data: categories, isLoading, isError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000,
  });
  
  const { parentCategories, subcategoriesByParent, visibleCategories, moreCategories } = useMemo(() => {
    if (!categories) return { parentCategories: [], subcategoriesByParent: {}, visibleCategories: [], moreCategories: [] };
    
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
    
    const prioritySlugs = ['consoles', 'games', 'headsets', 'vr-headsets', 'accessories'];
    const visible = parents
      .filter(c => prioritySlugs.includes(c.slug))
      .sort((a, b) => prioritySlugs.indexOf(a.slug) - prioritySlugs.indexOf(b.slug));
    const more = parents.filter(c => !prioritySlugs.includes(c.slug));
    
    return { parentCategories: parents, subcategoriesByParent: subMap, visibleCategories: visible, moreCategories: more };
  }, [categories]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md cursor-pointer" data-testid="link-home">
              <img src={logoImage} alt="EstZone" className="h-8 w-auto" />
              <span className="font-bold text-xl">
                <span className="text-foreground">Est</span>
                <span className="text-primary">Zone</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                {visibleCategories.map((parent) => {
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
                              {parentName}
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
                
                {moreCategories.length > 0 && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger 
                      className="h-9 px-3 text-sm"
                      data-testid="dropdown-more-categories"
                    >
                      {language === 'et' ? 'Rohkem' : 'More'}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-[300px] gap-1 p-4">
                        {moreCategories.map((cat) => {
                          const catName = language === 'et' ? cat.nameEt : cat.nameEn;
                          return (
                            <Link key={cat.id} href={`/products/${cat.slug}`}>
                              <div
                                className="block px-4 py-2 rounded-md hover-elevate active-elevate-2"
                                data-testid={`link-more-category-${cat.slug}`}
                              >
                                {catName}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}
                
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

          <div className="flex items-center gap-2 ml-auto">
            <SearchBar className="hidden lg:block w-64" />

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSearchSheetOpen(true)}
              data-testid="button-search-mobile"
            >
              <Search className="h-5 w-5" />
            </Button>

            <Sheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen}>
              <SheetContent 
                side="top" 
                className="h-auto pt-16"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={() => setSearchSheetOpen(false)}
              >
                <SearchBar 
                  className="w-full" 
                  isMobile 
                  onNavigate={() => setSearchSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>

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
                <div className="mb-6 -mx-6 -mt-6 h-32 overflow-hidden rounded-b-lg">
                  <img 
                    src={gamingHeaderImage} 
                    alt="Gaming" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <nav className="flex flex-col gap-2">
                  {visibleCategories.map((parent) => {
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
