import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Snowflake } from 'lucide-react';
import type { SeasonalTheme } from '@shared/schema';

interface SnowflakeItem {
  id: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface ConfettiItem {
  id: number;
  left: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  rotation: number;
}

const SnowflakeEffect = () => {
  const [snowflakes, setSnowflakes] = useState<SnowflakeItem[]>([]);
  
  useEffect(() => {
    const flakes: SnowflakeItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 10 + 8,
      duration: Math.random() * 5 + 8,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.3 + 0.3,
    }));
    setSnowflakes(flakes);
  }, []);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-20px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>
      {snowflakes.map((flake) => (
        <Snowflake
          key={flake.id}
          className="absolute text-white/60"
          style={{
            left: `${flake.left}%`,
            top: '-20px',
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animation: `snowfall ${flake.duration}s linear ${flake.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
};

const ConfettiEffect = ({ colors }: { colors: string[] }) => {
  const [confetti, setConfetti] = useState<ConfettiItem[]>([]);
  
  useEffect(() => {
    const pieces: ConfettiItem[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      duration: Math.random() * 4 + 6,
      delay: Math.random() * 10,
      rotation: Math.random() * 360,
    }));
    setConfetti(pieces);
  }, [colors]);
  
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes confettifall {
          0% {
            transform: translateY(-20px) rotate(0deg) scale(1);
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
      `}</style>
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className="absolute rounded-sm"
          style={{
            left: `${piece.left}%`,
            top: '-20px',
            width: `${piece.size}px`,
            height: `${piece.size * 0.6}px`,
            backgroundColor: piece.color,
            animation: `confettifall ${piece.duration}s linear ${piece.delay}s infinite`,
            transform: `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
};

const SeasonalBanner = ({ 
  theme, 
  language, 
  onClose 
}: { 
  theme: SeasonalTheme; 
  language: string; 
  onClose: () => void;
}) => {
  const bannerText = language === 'et' ? theme.bannerTextEt : theme.bannerTextEn;
  
  if (!bannerText) return null;
  
  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] py-2 px-4 text-center text-white font-medium shadow-lg"
      style={{ backgroundColor: theme.bannerBgColor || '#DC2626' }}
    >
      <div className="container mx-auto flex items-center justify-center gap-4">
        <span className="flex-1 text-center">{bannerText}</span>
        {theme.discountPercent && theme.discountPercent > 0 && (
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
            -{theme.discountPercent}%
          </span>
        )}
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close banner"
          data-testid="button-close-seasonal-banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default function SeasonalThemeDecorations() {
  const { language } = useLanguage();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  const { data: activeTheme } = useQuery<SeasonalTheme | null>({
    queryKey: ['/api/seasonal-theme/active'],
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
  
  const confettiColors = useMemo(() => {
    if (!activeTheme) return ['#FFD700', '#FF6B6B', '#4ECDC4'];
    return [
      activeTheme.primaryColor || '#DC2626',
      activeTheme.secondaryColor || '#15803D',
      '#FFD700',
      '#FFFFFF',
    ];
  }, [activeTheme]);
  
  // Check if banner was previously dismissed in this session
  useEffect(() => {
    if (activeTheme) {
      const dismissed = sessionStorage.getItem(`seasonal_banner_${activeTheme.id}`);
      if (dismissed) {
        setBannerDismissed(true);
      }
    }
  }, [activeTheme]);
  
  const handleCloseBanner = useCallback(() => {
    if (activeTheme) {
      sessionStorage.setItem(`seasonal_banner_${activeTheme.id}`, 'true');
    }
    setBannerDismissed(true);
  }, [activeTheme]);
  
  // Add body padding when banner is shown
  useEffect(() => {
    const bannerText = activeTheme ? (language === 'et' ? activeTheme.bannerTextEt : activeTheme.bannerTextEn) : null;
    const showBanner = activeTheme && bannerText && !bannerDismissed;
    
    if (showBanner) {
      document.body.style.paddingTop = '44px';
    } else {
      document.body.style.paddingTop = '0px';
    }
    
    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [activeTheme, bannerDismissed, language]);
  
  if (!activeTheme) {
    return null;
  }
  
  return (
    <>
      {/* Snowflakes Effect */}
      {activeTheme.showSnowflakes && <SnowflakeEffect />}
      
      {/* Confetti Effect */}
      {activeTheme.showConfetti && <ConfettiEffect colors={confettiColors} />}
      
      {/* Seasonal Banner */}
      {!bannerDismissed && (
        <SeasonalBanner 
          theme={activeTheme} 
          language={language}
          onClose={handleCloseBanner}
        />
      )}
      
      {/* CSS Variables for Theme Colors */}
      <style>{`
        :root {
          --seasonal-primary: ${activeTheme.primaryColor || '#DC2626'};
          --seasonal-secondary: ${activeTheme.secondaryColor || '#15803D'};
        }
      `}</style>
    </>
  );
}
