import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package, Truck, Shield, Headphones } from "lucide-react";
import backgroundImage from "@assets/stock_images/gaming_controller_vi_e755ad7a.jpg";
import missionBackgroundMobile from "@assets/stock_images/uncharted_video_game_e46e6a8d.jpg";

export default function About() {
  const { language, t } = useLanguage();
  
  const seoTitle = language === 'et' ? 'Meist - EstZone' : 'About - EstZone';
  const seoDescription = language === 'et'
    ? 'EstZone on Eesti juhtiv preemium mängutarvikute pood. Pakume PlayStation, Xbox, Nintendo konsoolid, VR-prille ja tarvikuid kiire kohaletoimetamisega.'
    : 'EstZone is Estonia\'s leading premium gaming products store. We offer PlayStation, Xbox, Nintendo consoles, VR headsets and accessories with fast delivery.';
  
  const features = [
    {
      icon: Package,
      title: t.about.qualityProducts,
      description: t.about.qualityProductsText,
    },
    {
      icon: Truck,
      title: t.about.fastShipping,
      description: t.about.fastShippingText,
    },
    {
      icon: Shield,
      title: t.about.securePayments,
      description: t.about.securePaymentsText,
    },
    {
      icon: Headphones,
      title: t.about.expertSupport,
      description: t.about.expertSupportText,
    },
  ];
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO 
        title={seoTitle}
        description={seoDescription}
        keywords="about EstZone, gaming store Estonia, PlayStation Estonia, Xbox Estonia, Nintendo Estonia, VR headsets Estonia"
        ogType="website"
      />
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-card border-b border-border">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-about-title">
              {t.about.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-3xl" data-testid="text-about-subtitle">
              {t.about.subtitle}
            </p>
          </div>
        </div>
        
        {/* About Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Desktop: ONE big controller image over both sections, Mobile: Two separate images */}
            <div className="md:relative md:rounded-md md:overflow-hidden bg-transparent">
              {/* Desktop: ONE big controller background for BOTH sections */}
              <div 
                className="hidden md:block md:absolute md:inset-0"
                style={{
                  backgroundImage: `url(${backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              ></div>
              <div className="hidden md:block md:absolute md:inset-0 md:bg-black/70"></div>
              
              <div className="md:relative md:z-10 space-y-8 md:space-y-12 md:p-8 md:py-12">
                {/* Who We Are - Mobile has controller background */}
                <section 
                  className="relative rounded-md overflow-hidden md:rounded-none"
                  style={{
                    backgroundImage: `url(${backgroundImage})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-black/70 md:hidden"></div>
                  <div className="relative z-10 p-8 md:p-0">
                    <h2 className="text-3xl font-bold mb-4 text-white" data-testid="text-who-we-are">
                      {t.about.whoWeAre}
                    </h2>
                    <p className="text-white/90 text-lg leading-relaxed" data-testid="text-who-we-are-content">
                      {t.about.whoWeAreText}
                    </p>
                  </div>
                </section>
                
                {/* Mission - Mobile has Uncharted background */}
                <section className="relative rounded-md overflow-hidden md:rounded-none">
                  <div 
                    className="absolute inset-0 md:hidden"
                    style={{
                      backgroundImage: `url(${missionBackgroundMobile})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-black/70 md:hidden"></div>
                  <div className="relative z-10 p-8 md:p-0">
                    <h2 className="text-3xl font-bold mb-4 text-white" data-testid="text-mission">
                      {t.about.mission}
                    </h2>
                    <p className="text-white/90 text-lg leading-relaxed" data-testid="text-mission-content">
                      {t.about.missionText}
                    </p>
                  </div>
                </section>
              </div>
            </div>
            
            {/* Why Choose Us */}
            <section>
              <h2 className="text-3xl font-bold mb-8 text-center" data-testid="text-why-choose-us">
                {t.about.whyChooseUs}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={index} className="p-6" data-testid={`card-feature-${index}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2" data-testid={`text-feature-title-${index}`}>
                            {feature.title}
                          </h3>
                          <p className="text-muted-foreground" data-testid={`text-feature-description-${index}`}>
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
