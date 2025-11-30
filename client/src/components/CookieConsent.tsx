import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Link } from 'wouter';
import { X, Cookie, Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'estzone_cookie_consent';
const COOKIE_PREFERENCES_KEY = 'estzone_cookie_preferences';

const translations = {
  en: {
    title: 'We use cookies',
    description: 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking "Accept All", you consent to our use of cookies.',
    acceptAll: 'Accept All',
    rejectAll: 'Reject All',
    customize: 'Customize',
    savePreferences: 'Save Preferences',
    privacyPolicy: 'Privacy Policy',
    necessary: 'Necessary',
    necessaryDesc: 'Essential for the website to function properly. Cannot be disabled.',
    analytics: 'Analytics',
    analyticsDesc: 'Help us understand how visitors interact with our website.',
    marketing: 'Marketing',
    marketingDesc: 'Used to deliver personalized advertisements.',
    cookieSettings: 'Cookie Settings',
    managePreferences: 'Manage your cookie preferences',
  },
  et: {
    title: 'Kasutame küpsiseid',
    description: 'Kasutame küpsiseid sirvimiskogemuse parandamiseks, saidi liikluse analüüsimiseks ja sisu isikupärastamiseks. Klõpsates "Nõustu kõigiga", nõustute meie küpsiste kasutamisega.',
    acceptAll: 'Nõustu kõigiga',
    rejectAll: 'Keeldu kõigist',
    customize: 'Kohanda',
    savePreferences: 'Salvesta eelistused',
    privacyPolicy: 'Privaatsuspoliitika',
    necessary: 'Vajalikud',
    necessaryDesc: 'Veebisaidi nõuetekohaseks toimimiseks hädavajalikud. Ei saa keelata.',
    analytics: 'Analüütika',
    analyticsDesc: 'Aitavad meil mõista, kuidas külastajad meie veebisaidiga suhtlevad.',
    marketing: 'Turundus',
    marketingDesc: 'Kasutatakse isikupärastatud reklaamide edastamiseks.',
    cookieSettings: 'Küpsiste seaded',
    managePreferences: 'Halda oma küpsiste eelistusi',
  },
};

export default function CookieConsent() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = localStorage.getItem(COOKIE_PREFERENCES_KEY);
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
    
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied'
      });
    }
  };
  
  const openSettings = () => {
    setShowSettings(true);
  };
  
  useEffect(() => {
    (window as any).openCookieSettings = openSettings;
    return () => {
      delete (window as any).openCookieSettings;
    };
  }, []);

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  return (
    <>
      {showBanner && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
          data-testid="cookie-consent-banner"
        >
        <Card className="max-w-4xl mx-auto shadow-lg border-primary/20">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:block">
                <Cookie className="h-8 w-8 text-primary flex-shrink-0" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                    <Cookie className="h-5 w-5 text-primary sm:hidden" />
                    {t.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t.description}{' '}
                    <Link href="/privacy">
                      <span className="text-primary hover:underline cursor-pointer">
                        {t.privacyPolicy}
                      </span>
                    </Link>
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={handleAcceptAll}
                    data-testid="button-cookie-accept-all"
                  >
                    {t.acceptAll}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRejectAll}
                    data-testid="button-cookie-reject-all"
                  >
                    {t.rejectAll}
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowSettings(true)}
                    data-testid="button-cookie-customize"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {t.customize}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              {t.cookieSettings}
            </DialogTitle>
            <DialogDescription>
              {t.managePreferences}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">{t.necessary}</Label>
                <p className="text-xs text-muted-foreground">{t.necessaryDesc}</p>
              </div>
              <Switch 
                checked={true} 
                disabled 
                data-testid="switch-cookie-necessary"
              />
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">{t.analytics}</Label>
                <p className="text-xs text-muted-foreground">{t.analyticsDesc}</p>
              </div>
              <Switch 
                checked={preferences.analytics}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, analytics: checked })
                }
                data-testid="switch-cookie-analytics"
              />
            </div>
            
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <Label className="font-medium">{t.marketing}</Label>
                <p className="text-xs text-muted-foreground">{t.marketingDesc}</p>
              </div>
              <Switch 
                checked={preferences.marketing}
                onCheckedChange={(checked) => 
                  setPreferences({ ...preferences, marketing: checked })
                }
                data-testid="switch-cookie-marketing"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowSettings(false)}
            >
              {language === 'et' ? 'Tühista' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleSavePreferences}
              data-testid="button-cookie-save"
            >
              {t.savePreferences}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
