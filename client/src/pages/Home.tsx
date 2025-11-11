import { useQuery } from "@tanstack/react-query";
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import CategorySection from '@/components/CategorySection';
import ProductGrid from '@/components/ProductGrid';
import ShoppingCart from '@/components/ShoppingCart';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '@shared/schema';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { language } = useLanguage();
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products?featured=true'],
  });

  const seoTitle = language === 'et' 
    ? 'Mängukonsoolid, VR-prillid ja Tarvikud' 
    : 'Gaming Consoles, VR Headsets & Accessories';
  
  const seoDescription = language === 'et'
    ? 'EstZone - Premium mängutarvikud Eestis. PlayStation, Xbox, Nintendo, VR-prillid ja tarvikud. Kiire kohaletoimetamine, Stripe ja PayPal maksed.'
    : 'EstZone - Premium gaming products in Estonia. PlayStation, Xbox, Nintendo, VR headsets & accessories. Fast delivery, Stripe & PayPal payments.';

  return (
    <div className="flex flex-col min-h-screen">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords="gaming, consoles, PlayStation, Xbox, Nintendo, VR headsets, gaming accessories, Estonia, Tallinn, mängukonsoolid, mängutarvikud"
        ogType="website"
      />
      <Header />
      <main className="flex-1">
        <HeroBanner />
        <CategorySection />
        <div className="container mx-auto px-4 py-12">
          {isLoading ? (
            <div>
              <div className="mb-8">
                <Skeleton className="h-10 w-64 mb-2" />
                <Skeleton className="h-6 w-96" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <ProductGrid products={products || []} showHeader={true} />
          )}
        </div>
      </main>
      <Footer />
      <ShoppingCart />
    </div>
  );
}
