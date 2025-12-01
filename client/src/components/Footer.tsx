import { Link } from 'wouter';
import { Gamepad2, Mail } from 'lucide-react';
import { SiStripe, SiVisa, SiMastercard, SiFacebook, SiInstagram, SiX } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();

  const categories = [
    { label: t.nav.consoles, href: '/products' },
    { label: t.nav.controllers, href: '/products' },
    { label: t.nav.headsets, href: '/products' },
    { label: t.nav.accessories, href: '/products' },
    { label: language === 'et' ? 'Kõik tooted' : 'All Products', href: '/products' },
  ];

  const support = [
    { label: t.footer.faq, href: '/faq' },
    { label: t.footer.shippingInfo, href: '/shipping-policy' },
    { label: t.footer.returns, href: '/returns' },
  ];

  const company = [
    { label: t.footer.aboutUs, href: '/about' },
    { label: t.nav.blog, href: '/blog' },
    { label: t.footer.terms, href: '/terms' },
    { label: t.footer.privacy, href: '/privacy' },
  ];
  
  const handleCookieSettings = () => {
    if ((window as any).openCookieSettings) {
      (window as any).openCookieSettings();
    }
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link href="/" onClick={scrollToTop}>
              <div className="flex items-center gap-2 mb-4 cursor-pointer">
                <Gamepad2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">EstZone</span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t.footer.description}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Pärnu mnt 31, Tallinn, Estonia
            </p>
            <div className="text-xs text-muted-foreground mb-4 space-y-1">
              <p className="font-medium">AVERING GRUPP OÜ</p>
              <p>{language === 'et' ? 'Registrikood' : 'Reg. code'}: 16236733</p>
            </div>
            
            {/* Social Media Links */}
            <div className="flex items-center gap-4 mb-6">
              <a 
                href="https://facebook.com/estzone" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                aria-label="Facebook"
                data-testid="link-facebook"
              >
                <SiFacebook className="h-6 w-6 text-muted-foreground hover:text-foreground" />
              </a>
              <a 
                href="https://instagram.com/estzone" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-6 w-6 text-muted-foreground hover:text-foreground" />
              </a>
              <a 
                href="https://x.com/estzone" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2.5 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                aria-label="X (Twitter)"
                data-testid="link-twitter"
              >
                <SiX className="h-6 w-6 text-muted-foreground hover:text-foreground" />
              </a>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm font-semibold">{t.footer.newsletter}</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t.footer.emailPlaceholder}
                  className="max-w-xs"
                  data-testid="input-newsletter-email"
                />
                <Button data-testid="button-newsletter-subscribe">
                  <Mail className="h-4 w-4 mr-2" />
                  {t.footer.subscribe}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footer.categories}</h3>
            <ul className="space-y-2">
              {categories.map((item, index) => (
                <li key={`cat-${index}`}>
                  <Link href={item.href} onClick={scrollToTop}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footer.support}</h3>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={scrollToTop}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">{t.footer.company}</h3>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={scrollToTop}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={handleCookieSettings}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-left"
                  data-testid="button-cookie-settings"
                >
                  {language === 'et' ? 'Küpsiste seaded' : 'Cookie Settings'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {/* Payment Methods */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{t.footer.paymentMethods}</p>
              <div className="flex items-center gap-4">
                <SiStripe className="h-6 w-6 text-primary" />
                <SiVisa className="h-6 w-6 text-muted-foreground" />
                <SiMastercard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Paysera</span>
              </div>
            </div>

            {/* Shipping Partners */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{t.footer.shipping}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-muted-foreground">Omniva</span>
                <span className="text-xs font-semibold text-muted-foreground">DPD</span>
                <span className="text-xs font-semibold text-muted-foreground">DHL</span>
              </div>
            </div>

            {/* Contact */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">{language === 'et' ? 'Kontakt' : 'Contact'}</p>
              <a 
                href="mailto:estzone.shop@gmail.com" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                data-testid="link-footer-email"
              >
                estzone.shop@gmail.com
              </a>
            </div>

            {/* Copyright */}
            <div className="sm:text-right lg:text-right">
              <p className="text-sm font-medium text-foreground mb-3 invisible">.</p>
              <p className="text-sm text-muted-foreground">
                {t.footer.copyright}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
