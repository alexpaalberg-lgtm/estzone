import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Package, Truck, Shield, Headphones } from "lucide-react";
import backgroundImage from "@assets/stock_images/gaming_controller_vi_e755ad7a.jpg";
import missionOption1 from "@assets/stock_images/team_gaming_friends__f8aa2ef9.jpg";
import missionOption2 from "@assets/stock_images/gaming_success_victo_2f3282b0.jpg";
import missionOption3 from "@assets/stock_images/futuristic_gaming_te_6a65e262.jpg";
import missionOption4 from "@assets/stock_images/gaming_community_mul_6362474b.jpg";
import missionOption5 from "@assets/stock_images/gaming_passion_excit_dd63bb3f.jpg";

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
            {/* Who We Are - Mobile has background, Desktop plain */}
            <section 
              className="relative rounded-md overflow-hidden md:rounded-none"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Mobile overlay */}
              <div className="absolute inset-0 bg-black/70 md:hidden"></div>
              <div className="relative z-10 p-8 md:p-0">
                <h2 className="text-3xl font-bold mb-4 text-white md:text-foreground" data-testid="text-who-we-are">
                  {t.about.whoWeAre}
                </h2>
                <p className="text-white/90 md:text-muted-foreground text-lg leading-relaxed" data-testid="text-who-we-are-content">
                  {t.about.whoWeAreText}
                </p>
              </div>
            </section>
            
            {/* Mission - TEMPORARY GALLERY */}
            <section className="p-6 bg-card border rounded-md">
              <h3 className="text-xl font-bold mb-4 text-primary">Vali Our Mission pilt telefoni jaoks (1-5):</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <p className="font-bold text-primary">1. Team Gaming (Friends)</p>
                  <img src={missionOption1} alt="Option 1" className="w-full h-48 object-cover rounded-md" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-primary">2. Victory Celebration</p>
                  <img src={missionOption2} alt="Option 2" className="w-full h-48 object-cover rounded-md" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-primary">3. Futuristic Gaming Tech</p>
                  <img src={missionOption3} alt="Option 3" className="w-full h-48 object-cover rounded-md" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-primary">4. Gaming Community</p>
                  <img src={missionOption4} alt="Option 4" className="w-full h-48 object-cover rounded-md" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-primary">5. Gaming Passion/Action</p>
                  <img src={missionOption5} alt="Option 5" className="w-full h-48 object-cover rounded-md" />
                </div>
              </div>
            </section>
            
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
