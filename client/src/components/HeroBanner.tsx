import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import heroImage from '@assets/generated_images/Gaming_setup_hero_banner_d3d2ad7b.png';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export default function HeroBanner() {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      title: t.hero.title,
      subtitle: t.hero.subtitle,
      image: heroImage,
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center px-4 max-w-4xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground" data-testid="text-hero-title">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-foreground/90" data-testid="text-hero-subtitle">
                {slide.subtitle}
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" className="backdrop-blur-sm" data-testid="button-shop-now">
                  {t.hero.cta}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="backdrop-blur-sm bg-background/20"
                  data-testid="button-learn-more"
                >
                  {t.hero.learnMore}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {slides.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-background/20 backdrop-blur-sm"
            onClick={prevSlide}
            data-testid="button-prev-slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-background/20 backdrop-blur-sm"
            onClick={nextSlide}
            data-testid="button-next-slide"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-primary w-8' : 'bg-foreground/30'
              }`}
              onClick={() => setCurrentSlide(index)}
              data-testid={`button-slide-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
