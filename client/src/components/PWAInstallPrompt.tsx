import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export default function PWAInstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  
  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }
    
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };
  
  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null;
  }
  
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full transition-colors"
            aria-label="Dismiss"
            data-testid="button-dismiss-pwa-prompt"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                {language === 'et' ? 'Lisa rakendus' : 'Install App'}
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                {language === 'et' 
                  ? 'Lisa EstZone oma avakuvale kiireks ligipääsuks ja offline-režiimiks'
                  : 'Add EstZone to your home screen for quick access and offline mode'}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="flex-1"
                  data-testid="button-install-pwa"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {language === 'et' ? 'Paigalda' : 'Install'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  data-testid="button-later-pwa"
                >
                  {language === 'et' ? 'Hiljem' : 'Later'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
