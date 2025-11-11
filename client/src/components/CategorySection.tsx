import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@shared/schema';

const categoryImages: Record<string, string> = {
  'consoles': '/images/category-consoles.png',
  'controllers': '/images/category-controllers.png',
  'headsets': '/images/category-headsets.png',
  'vr-headsets': '/images/category-vr.png',
  'accessories': '/images/category-accessories.png',
};

export default function CategorySection() {
  const { language } = useLanguage();
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const mainCategories = categories?.filter(c => !c.parentId).slice(0, 5) || [];

  if (mainCategories.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center" data-testid="text-categories-title">
          {language === 'et' ? 'Kategooriad' : 'Categories'}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {mainCategories.map((category) => {
            const name = language === 'et' ? category.nameEt : category.nameEn;
            const image = categoryImages[category.slug] || '/images/placeholder.jpg';
            
            return (
              <Link 
                key={category.id} 
                href={`/products/${category.slug}`}
                data-testid={`link-category-${category.slug}`}
                asChild
              >
                <a>
                  <Card 
                    className="group overflow-hidden hover-elevate active-elevate-2 cursor-pointer transition-all duration-300 h-full"
                    data-testid={`card-category-${category.slug}`}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        data-testid={`img-category-${category.slug}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-semibold text-lg text-foreground text-center" data-testid={`text-category-${category.slug}`}>
                          {name}
                        </h3>
                      </div>
                    </div>
                  </Card>
                </a>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
