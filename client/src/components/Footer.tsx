import { Link } from 'wouter';
import { Gamepad2, Mail } from 'lucide-react';
import { SiStripe, SiVisa, SiMastercard } from 'react-icons/si';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { language, setLanguage, t } = useLanguage();

  const categories = [
    { label: t.nav.consoles, href: '/consoles' },
    { label: t.nav.controllers, href: '/controllers' },
    { label: t.nav.headsets, href: '/headsets' },
    { label: t.nav.accessories, href: '/accessories' },
  ];

  const support = [
    { label: t.footer.faq, href: '/faq' },
    { label: t.footer.contact, href: '/contact' },
    { label: t.footer.shippingInfo, href: '/shipping' },
    { label: t.footer.returns, href: '/returns' },
  ];

  const company = [
    { label: t.footer.aboutUs, href: '/about' },
    { label: t.nav.blog, href: '/blog' },
    { label: t.footer.careers, href: '/careers' },
    { label: t.footer.privacy, href: '/privacy' },
  ];

  return (
    <footer className="border-t bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <Link href="/">
              <div className="flex items-center gap-2 mb-4 cursor-pointer">
                <Gamepad2 className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">EstZone</span>
              </div>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {t.footer.description}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Pärnu mnt 31, Tallinn, Estonia
            </p>
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
              {categories.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
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
                  <Link href={item.href}>
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
                  <Link href={item.href}>
                    <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.footer.paymentMethods}</p>
              <div className="flex items-center gap-4">
                <SiStripe className="h-6 w-6 text-primary" />
                <SiVisa className="h-6 w-6 text-muted-foreground" />
                <SiMastercard className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">Paysera</span>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">{t.footer.shipping}</p>
              <div className="flex items-center gap-4">
                <span className="text-xs font-semibold text-muted-foreground">Omniva</span>
                <span className="text-xs font-semibold text-muted-foreground">DPD</span>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              {t.footer.copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
