import Header from '../Header';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';

export default function HeaderExample() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Header />
      </CartProvider>
    </LanguageProvider>
  );
}
