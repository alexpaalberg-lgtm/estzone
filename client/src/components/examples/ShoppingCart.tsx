import ShoppingCart from '../ShoppingCart';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CartProvider } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import consoleImage from '@assets/generated_images/Premium_gaming_console_product_e6d8d984.png';

function CartDemo() {
  const { addItem, setIsOpen } = useCart();

  const handleAddSample = () => {
    addItem({
      id: '1',
      name: 'Premium Gaming Console X1',
      price: 449.99,
      image: consoleImage,
    });
    setIsOpen(true);
  };

  return (
    <div className="p-8">
      <Button onClick={handleAddSample}>Open Cart with Sample Item</Button>
      <ShoppingCart />
    </div>
  );
}

export default function ShoppingCartExample() {
  return (
    <LanguageProvider>
      <CartProvider>
        <CartDemo />
      </CartProvider>
    </LanguageProvider>
  );
}
