import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check } from "lucide-react";
import { useState } from "react";
import estonianPoster from "@assets/generated_images/estonian_estzone_gaming_store_poster.png";
import englishPoster from "@assets/generated_images/english_poster_with_more_text.png";
import facebookCover from "@assets/generated_images/estzone_facebook_cover_wider_version.png";

const googleAdsEt = [
  {
    headline1: "EstZone - Mängurid",
    headline2: "PS5, Xbox, VR Prillid",
    headline3: "Kiire Tarne Eestis",
    description1: "Osta mängukonsoolid, VR-prillid ja kontrollerid. 800+ toodet, 1-aastane garantii. Tasuta tarne üle 100€!",
    description2: "Premium gaming pood Eestis. PlayStation 5, Xbox Series X, Nintendo Switch, Meta Quest. Turvalised maksed.",
  },
  {
    headline1: "PS5 & Xbox Eestis",
    headline2: "VR Prillid Laos",
    headline3: "-30% Allahindlus",
    description1: "PlayStation 5, Xbox Series X laos! Kiire tarne Omniva ja DPD-ga. Maksa järelmaksuga või kaardiga.",
    description2: "Meta Quest 3, PSVR2 ja rohkem. Eesti usaldusväärne gaming pood. Registrikood: 16236733.",
  },
  {
    headline1: "Gaming Tarvikud",
    headline2: "Kontrollerid, Toolid",
    headline3: "Soodne Hind",
    description1: "Razer, SteelSeries, Logitech kontrollerid ja peakomplektid. Gaming toolid profidele. Osta kohe!",
    description2: "800+ gaming toodet. VIP kliendiprogramm. Koguge punkte ja saage allahindlusi. EstZone.eu",
  }
];

const googleAdsEn = [
  {
    headline1: "EstZone Gaming",
    headline2: "PS5, Xbox, VR Headsets",
    headline3: "Fast Delivery Estonia",
    description1: "Shop gaming consoles, VR headsets & controllers. 800+ products, 1-year warranty. Free shipping over €100!",
    description2: "Premium gaming store in Estonia. PlayStation 5, Xbox Series X, Nintendo Switch, Meta Quest. Secure payments.",
  },
  {
    headline1: "PS5 & Xbox In Stock",
    headline2: "VR Headsets Available",
    headline3: "Up to -30% Off",
    description1: "PlayStation 5, Xbox Series X in stock! Fast delivery with Omniva & DPD. Pay with card or installments.",
    description2: "Meta Quest 3, PSVR2 and more. Estonia's trusted gaming store. Business reg: 16236733.",
  },
  {
    headline1: "Gaming Accessories",
    headline2: "Controllers & Chairs",
    headline3: "Best Prices",
    description1: "Razer, SteelSeries, Logitech controllers & headsets. Gaming chairs for pros. Shop now at EstZone!",
    description2: "800+ gaming products. VIP loyalty program. Earn points and get discounts. Visit EstZone.eu",
  }
];

export default function Downloads() {
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const formatAdText = (ad: typeof googleAdsEt[0]) => {
    return `Pealkiri 1: ${ad.headline1}
Pealkiri 2: ${ad.headline2}
Pealkiri 3: ${ad.headline3}
Kirjeldus 1: ${ad.description1}
Kirjeldus 2: ${ad.description2}`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">EstZone Materjalid / Assets</h1>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Google Ads Tekstid</h2>
        
        <h3 className="text-lg font-medium text-muted-foreground">Eestikeelsed reklaamid</h3>
        <div className="grid gap-4 mb-6">
          {googleAdsEt.map((ad, index) => (
            <Card key={`et-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  Reklaam {index + 1} (ET)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(formatAdText(ad), `et-${index}`)}
                    data-testid={`button-copy-ad-et-${index}`}
                  >
                    {copiedIndex === `et-${index}` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Pealkiri 1:</span> {ad.headline1}</div>
                <div><span className="font-semibold text-primary">Pealkiri 2:</span> {ad.headline2}</div>
                <div><span className="font-semibold text-primary">Pealkiri 3:</span> {ad.headline3}</div>
                <div className="pt-2 border-t">
                  <span className="font-semibold text-muted-foreground">Kirjeldus 1:</span> {ad.description1}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Kirjeldus 2:</span> {ad.description2}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-lg font-medium text-muted-foreground">English Ads</h3>
        <div className="grid gap-4 mb-8">
          {googleAdsEn.map((ad, index) => (
            <Card key={`en-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  Ad {index + 1} (EN)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(formatAdText(ad), `en-${index}`)}
                    data-testid={`button-copy-ad-en-${index}`}
                  >
                    {copiedIndex === `en-${index}` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Headline 1:</span> {ad.headline1}</div>
                <div><span className="font-semibold text-primary">Headline 2:</span> {ad.headline2}</div>
                <div><span className="font-semibold text-primary">Headline 3:</span> {ad.headline3}</div>
                <div className="pt-2 border-t">
                  <span className="font-semibold text-muted-foreground">Description 1:</span> {ad.description1}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground">Description 2:</span> {ad.description2}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold">Sotsiaalmeedia / Social Media</h2>
        <Card>
          <CardHeader>
            <CardTitle>Facebook kaanefoto / Cover Photo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <img 
              src={facebookCover} 
              alt="Facebook Cover" 
              className="w-full rounded-lg border"
            />
            <Button 
              className="w-full" 
              onClick={() => handleDownload(facebookCover, 'estzone_facebook_cover.png')}
              data-testid="button-download-facebook-cover"
            >
              <Download className="mr-2 h-4 w-4" />
              Lae alla / Download
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-xl font-semibold mt-8">Plakatid / Posters</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Eestikeelne plakat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={estonianPoster} 
                alt="Estonian Poster" 
                className="w-full rounded-lg border"
              />
              <Button 
                className="w-full" 
                onClick={() => handleDownload(estonianPoster, 'estzone_plakat_eesti.png')}
                data-testid="button-download-estonian"
              >
                <Download className="mr-2 h-4 w-4" />
                Lae alla
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>English Poster</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <img 
                src={englishPoster} 
                alt="English Poster" 
                className="w-full rounded-lg border"
              />
              <Button 
                className="w-full" 
                onClick={() => handleDownload(englishPoster, 'estzone_poster_english.png')}
                data-testid="button-download-english"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
