import Footer from '../Footer';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function FooterExample() {
  return (
    <LanguageProvider>
      <Footer />
    </LanguageProvider>
  );
}
