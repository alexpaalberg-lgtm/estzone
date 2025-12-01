import { Link, useLocation } from 'wouter';
import { ShoppingCart, Search, User, Menu, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
import type { Category, Wishlist } from '@shared/schema';
import logoImage from '@assets/generated_images/EstZone_company_logo_8c405552.png';
import gamingHeaderImage from '@assets/generated_images/Gaming_controller_illustration_header_1c4ec04d.png';
import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems, setIsOpen } = useCart();
  const [searchSheetOpen, setSearchSheetOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const { data: categories, isLoading, isError } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: wishlistItems } = useQuery<Wishlist[]>({
    queryKey: ['/api/wishlist'],
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
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
    
    const prioritySlugs = ['consoles', 'games', 'headsets', 'vr-headsets', 'accessories', 'digital-content'];
    const visible = parents
      .filter(c => prioritySlugs.includes(c.slug))
      .sort((a, b) => prioritySlugs.indexOf(a.slug) - prioritySlugs.indexOf(b.slug));
    const more = parents.filter(c => !prioritySlugs.includes(c.slug));
    
    return { parentCategories: parents, subcategoriesByParent: subMap, visibleCategories: visible, moreCategories: more };
  }, [categories]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="w-full px-2 sm:px-4 lg:px-6 box-border">
        <div className="flex h-14 lg:h-16 items-center gap-1 lg:gap-2">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate px-2 py-1.5 rounded-md cursor-pointer flex-shrink-0" data-testid="link-home">
              <img src={logoImage} alt="EstZone" className="h-8 sm:h-8 w-auto" />
              <span className="font-bold text-xl sm:text-xl">
                <span className="text-foreground">Est</span>
                <span className="text-primary">Zone</span>
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-0">
                {visibleCategories.map((parent) => {
                  const subcats = subcategoriesByParent[parent.id] || [];
                  const parentName = language === 'et' ? parent.nameEt : parent.nameEn;
                  
                  if (subcats.length === 0) {
                    return (
                      <NavigationMenuItem key={parent.id}>
                        <Link href={`/products/${parent.slug}`}>
                          <Button 
                            variant="ghost" 
                            className="h-8 px-2 text-xs lg:text-sm"
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
                        className="h-8 px-2 text-xs lg:text-sm"
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
                      className="h-8 px-2 text-xs lg:text-sm"
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
                    <Button variant="ghost" className="h-8 px-2 text-xs lg:text-sm" data-testid="link-blog">
                      {t.nav.blog}
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1 ml-auto flex-shrink-0">
            <SearchBar className="hidden xl:block w-72 2xl:w-96" />

            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden h-9 w-9"
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
                <SheetHeader className="sr-only">
                  <SheetTitle>{language === 'et' ? 'Otsing' : 'Search'}</SheetTitle>
                  <SheetDescription>{language === 'et' ? 'Otsi tooteid' : 'Search products'}</SheetDescription>
                </SheetHeader>
                <SearchBar 
                  className="w-full" 
                  isMobile 
                  onNavigate={() => setSearchSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>

            {/* Language toggle - hidden on mobile, shown in menu */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9"
              onClick={() => setLanguage(language === 'en' ? 'et' : 'en')}
              data-testid="button-language-toggle"
              title={language === 'en' ? 'Switch to Estonian' : 'Lülitu inglise keelele'}
            >
              <span className="text-xs font-bold">{language.toUpperCase()}</span>
            </Button>

            {/* Currency toggle - hidden on mobile, shown in menu */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-9 w-9"
              onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
              data-testid="button-currency-toggle"
              title={currency === 'EUR' ? 'Switch to USD' : 'Switch to EUR'}
            >
              <span className="text-xs font-bold">{currency}</span>
            </Button>

            {/* Wishlist - click to go to wishlist or login */}
            {isAuthenticated ? (
              <Link href="/wishlist">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-11 w-11"
                  data-testid="button-wishlist"
                  title={language === 'et' ? 'Soovinimekiri' : 'Wishlist'}
                >
                  <Heart className="h-7 w-7" />
                  {wishlistItems && wishlistItems.length > 0 && (
                    <Badge
                      variant="default"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                      data-testid="badge-wishlist-count"
                    >
                      {wishlistItems.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="relative h-11 w-11"
                data-testid="button-wishlist"
                title={language === 'et' ? 'Logi sisse' : 'Sign in for wishlist'}
                onClick={() => window.location.href = '/api/login'}
              >
                <Heart className="h-7 w-7" />
              </Button>
            )}

            {/* User account / Login */}
            {isAuthenticated ? (
              <Link href="/account">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  data-testid="button-account"
                  title={language === 'et' ? 'Minu konto' : 'My Account'}
                >
                  <User className="h-7 w-7" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                data-testid="button-login"
                title={language === 'et' ? 'Logi sisse' : 'Sign In'}
                onClick={() => window.location.href = '/api/login'}
              >
                <User className="h-7 w-7" />
              </Button>
            )}

            {/* Cart - with margin for spacing before menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-11 w-11 mr-1 lg:mr-0"
              onClick={() => setIsOpen(true)}
              data-testid="button-cart"
            >
              <ShoppingCart className="h-7 w-7" />
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

            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-11 w-11 p-0 border-primary/50" data-testid="button-menu">
                  <Menu className="h-7 w-7 text-primary" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader className="sr-only">
                  <SheetTitle>{language === 'et' ? 'Menüü' : 'Menu'}</SheetTitle>
                  <SheetDescription>{language === 'et' ? 'Navigeeri kategooriate vahel' : 'Navigate categories'}</SheetDescription>
                </SheetHeader>
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
                            onClick={() => {
                              setMobileMenuOpen(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
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
                                    onClick={() => {
                                      setMobileMenuOpen(false);
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
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
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start" 
                      data-testid="mobile-link-blog"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {t.nav.blog}
                    </Button>
                  </Link>
                  
                  {/* Settings section in mobile menu */}
                  <div className="border-t border-border mt-4 pt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setLanguage(language === 'en' ? 'et' : 'en')}
                        data-testid="mobile-button-language"
                      >
                        {language === 'et' ? 'English' : 'Eesti'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setCurrency(currency === 'EUR' ? 'USD' : 'EUR')}
                        data-testid="mobile-button-currency"
                      >
                        {currency === 'EUR' ? 'USD' : 'EUR'}
                      </Button>
                    </div>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
