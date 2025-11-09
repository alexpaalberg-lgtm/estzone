import ProductCard from './ProductCard';
import consoleImage from '@assets/generated_images/Premium_gaming_console_product_e6d8d984.png';
import controllerImage from '@assets/generated_images/Premium_gaming_controller_ea9e8551.png';
import headsetImage from '@assets/generated_images/Premium_gaming_headset_97316e1a.png';
import keyboardImage from '@assets/generated_images/Premium_gaming_keyboard_184a2867.png';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  stock: 'in_stock' | 'low_stock' | 'out_of_stock';
  isNew?: boolean;
  salePrice?: number;
}

export default function ProductGrid() {
  //todo: remove mock functionality
  const products: Product[] = [
    {
      id: '1',
      name: 'Premium Gaming Console X1',
      price: 499.99,
      salePrice: 449.99,
      image: consoleImage,
      stock: 'in_stock',
      isNew: true,
    },
    {
      id: '2',
      name: 'Elite Wireless Controller Pro',
      price: 79.99,
      image: controllerImage,
      stock: 'in_stock',
    },
    {
      id: '3',
      name: 'Gaming Headset 7.1 Surround',
      price: 149.99,
      image: headsetImage,
      stock: 'low_stock',
    },
    {
      id: '4',
      name: 'Mechanical RGB Gaming Keyboard',
      price: 129.99,
      salePrice: 99.99,
      image: keyboardImage,
      stock: 'in_stock',
    },
    {
      id: '5',
      name: 'Premium Gaming Console X1 Limited',
      price: 549.99,
      image: consoleImage,
      stock: 'in_stock',
      isNew: true,
    },
    {
      id: '6',
      name: 'Wireless Controller Special Edition',
      price: 89.99,
      image: controllerImage,
      stock: 'low_stock',
    },
    {
      id: '7',
      name: 'Pro Gaming Headset Wireless',
      price: 199.99,
      image: headsetImage,
      stock: 'in_stock',
    },
    {
      id: '8',
      name: 'Compact Gaming Keyboard TKL',
      price: 99.99,
      image: keyboardImage,
      stock: 'in_stock',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2" data-testid="text-section-title">
          Featured Products
        </h2>
        <p className="text-muted-foreground" data-testid="text-section-subtitle">
          Discover our premium selection of gaming gear
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}
