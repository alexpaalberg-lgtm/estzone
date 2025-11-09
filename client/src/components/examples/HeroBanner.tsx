import HeroBanner from '../HeroBanner';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function HeroBannerExample() {
  return (
    <LanguageProvider>
      <HeroBanner />
    </LanguageProvider>
  );
}
