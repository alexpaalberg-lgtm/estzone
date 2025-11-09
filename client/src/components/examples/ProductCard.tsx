import ProductCard from '../ProductCard';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import consoleImage from '@assets/generated_images/Premium_gaming_console_product_e6d8d984.png';

export default function ProductCardExample() {
  return (
    <LanguageProvider>
      <CartProvider>
        <div className="p-8 max-w-sm">
          <ProductCard
            id="1"
            name="Premium Gaming Console X1"
            price={499.99}
            salePrice={449.99}
            image={consoleImage}
            stock="in_stock"
            isNew={true}
          />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
