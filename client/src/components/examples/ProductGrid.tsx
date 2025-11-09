import ProductGrid from '../ProductGrid';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';

export default function ProductGridExample() {
  return (
    <LanguageProvider>
      <CartProvider>
        <ProductGrid />
      </CartProvider>
    </LanguageProvider>
  );
}
