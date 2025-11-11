import { Link } from 'wouter';
import { ShoppingCart, Search, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import logoImage from '@assets/generated_images/EstZone_company_logo_8c405552.png';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const { totalItems, setIsOpen } = useCart();

  const navItems = [
    { label: t.nav.consoles, href: '/consoles' },
    { label: t.nav.controllers, href: '/controllers' },
    { label: t.nav.headsets, href: '/headsets' },
    { label: t.nav.accessories, href: '/accessories' },
    { label: t.nav.blog, href: '/blog' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <div className="flex items-center gap-2 hover-elevate px-3 py-2 rounded-md cursor-pointer" data-testid="link-home">
              <img src={logoImage} alt="EstZone" className="h-8 w-auto" />
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" size="sm" data-testid={`link-${item.label.toLowerCase()}`}>
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
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
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>{language === 'et' ? 'Menüü' : 'Menu'}</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-4">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button variant="ghost" className="w-full justify-start">
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
