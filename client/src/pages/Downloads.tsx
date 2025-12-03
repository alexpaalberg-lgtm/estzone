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

const facebookAdsEt = [
  {
    type: "Feed Post",
    title: "PS5, Xbox ja VR prillid nüüd Eestis!",
    text: "Unista uuest mängukonsoolist? EstZone toob sulle parimad gaming tooted otse koju! PlayStation 5, Xbox Series X, Meta Quest 3 ja palju muud. Kiire tarne Omniva ja DPD-ga. 1-aastane garantii kõigile toodetele. Kasuta koodi GAMER10 ja saa -10% esimeselt ostult!",
    cta: "Osta kohe",
    hashtags: "#EstZone #Gaming #PS5 #Xbox #VR #Eesti #Mängud"
  },
  {
    type: "Stories/Reels",
    title: "FLASH SALE!",
    text: "Kuni -30% gaming toodetelt! PS5, Xbox, VR prillid. Kiire tarne üle Eesti. Ära jää maha!",
    cta: "Vaata pakkumisi",
    hashtags: "#FlashSale #Gaming #EstZone"
  },
  {
    type: "Carousel",
    title: "Eesti #1 Gaming Pood",
    text: "800+ toodet laos: Konsoolid | VR prillid | Kontrollerid | Gaming toolid | Peakomplektid. Tasuta tarne üle 100€. VIP programm - kogu punkte ja saa allahindlusi!",
    cta: "Avasta valikut",
    hashtags: "#EstZone #GamingEesti #PlayStation #Xbox #Nintendo"
  }
];

const facebookAdsEn = [
  {
    type: "Feed Post",
    title: "PS5, Xbox & VR Headsets - Now in Estonia!",
    text: "Dreaming of a new gaming console? EstZone brings you the best gaming products delivered to your door! PlayStation 5, Xbox Series X, Meta Quest 3 and much more. Fast delivery with Omniva & DPD. 1-year warranty on all products. Use code GAMER10 for 10% off your first order!",
    cta: "Shop Now",
    hashtags: "#EstZone #Gaming #PS5 #Xbox #VR #Estonia #Gamers"
  },
  {
    type: "Stories/Reels",
    title: "FLASH SALE!",
    text: "Up to -30% on gaming products! PS5, Xbox, VR headsets. Fast delivery across Estonia. Don't miss out!",
    cta: "See Deals",
    hashtags: "#FlashSale #Gaming #EstZone"
  },
  {
    type: "Carousel",
    title: "Estonia's #1 Gaming Store",
    text: "800+ products in stock: Consoles | VR Headsets | Controllers | Gaming Chairs | Headsets. Free shipping over €100. VIP program - earn points and get discounts!",
    cta: "Explore Now",
    hashtags: "#EstZone #GamingEstonia #PlayStation #Xbox #Nintendo"
  }
];

const tiktokAdsEt = [
  {
    type: "Hook Video",
    hook: "POV: Sa leiad Eesti parima gaming poe...",
    text: "EstZone - 800+ toodet, kiire tarne, 1-aastane garantii. PS5 laos! Link bios!",
    hashtags: "#EstZone #GamingEesti #PS5 #Xbox #fyp #eesti"
  },
  {
    type: "Unboxing Style",
    hook: "See tuli täna postiga...",
    text: "Uus PS5 EstZone'ist! Tellisin eile, täna juba käes. Uskumatu!",
    hashtags: "#unboxing #PS5 #EstZone #gaming #eesti #fyp"
  },
  {
    type: "Deal Alert",
    hook: "JOOKSE! Kuni -30% gaming tooted!",
    text: "EstZone flash sale on käimas. VR prillid, kontrollerid, konsoolid. Link bios enne kui lõppeb!",
    hashtags: "#sale #gaming #EstZone #deals #eesti #fyp"
  }
];

const tiktokAdsEn = [
  {
    type: "Hook Video",
    hook: "POV: You just found Estonia's best gaming store...",
    text: "EstZone - 800+ products, fast delivery, 1-year warranty. PS5 in stock! Link in bio!",
    hashtags: "#EstZone #GamingEstonia #PS5 #Xbox #fyp #gaming"
  },
  {
    type: "Unboxing Style",
    hook: "This just arrived in the mail...",
    text: "New PS5 from EstZone! Ordered yesterday, already here. Insane!",
    hashtags: "#unboxing #PS5 #EstZone #gaming #estonia #fyp"
  },
  {
    type: "Deal Alert",
    hook: "RUN! Up to -30% gaming products!",
    text: "EstZone flash sale is live. VR headsets, controllers, consoles. Link in bio before it ends!",
    hashtags: "#sale #gaming #EstZone #deals #estonia #fyp"
  }
];

const hinnavaatlusAds = [
  {
    title: "EstZone - Premium Gaming Pood | PS5, Xbox, VR, Kontrollerid",
    text: `EstZone - Eesti usaldusväärne gaming e-pood!

800+ toodet laos:
- Mängukonsoolid (PS5, Xbox Series X/S, Nintendo Switch)
- VR prillid (Meta Quest 3, PSVR2)
- Kontrollerid (DualSense, Xbox, Pro kontrollerid)
- Gaming toolid ja lauad
- Peakomplektid (Razer, SteelSeries, Logitech)
- Tarvikud ja lisaseadmed

Miks valida EstZone?
- 1-aastane garantii kõigile toodetele
- Kiire tarne Omniva ja DPD-ga (1-3 tööpäeva)
- Tasuta tarne üle 100€
- Turvalised maksed (kaart, järelmaks, pangalink)
- VIP kliendiprogramm - kogu punkte ja saa allahindlusi

Veebipood: www.estzone.eu
AVERING GRUPP OÜ | Reg: 16236733 | Pärnu mnt 31, Tallinn`,
    category: "Arvutid ja IT > Mängud"
  },
  {
    title: "PlayStation 5 (PS5) Konsoolid ja Tarvikud | EstZone",
    text: `PlayStation 5 konsoolid ja originaaltarvikud EstZone'ist!

Laos:
- PS5 Digital Edition
- PS5 Disc Edition  
- PS5 Slim versioonid
- DualSense kontrollerid (erinevad värvid)
- PlayStation VR2
- Laadimisalused ja peakomplektid

Kõik tooted 1-aastase garantiiga!
Tarne 1-3 tööpäeva Omniva/DPD-ga.

www.estzone.eu`,
    category: "Arvutid ja IT > Mängukonsoolid"
  }
];

const discordRedditAds = [
  {
    platform: "Discord",
    title: "Eesti Gaming Serveri Sponsorpostitus",
    text: `Tere, mängurid!

Tahtsime tutvustada EstZone'i - Eesti oma gaming e-poodi!

Mida pakume:
- 800+ gaming toodet (konsoolid, VR, kontrollerid, tarvikud)
- PS5, Xbox Series X, Nintendo Switch, Meta Quest laos
- Kiire tarne üle Eesti (1-3 päeva)
- 1-aastane garantii KÕIGELE
- VIP programm - teenite punkte iga ostuga

Serveri liikmetele: Kasutage koodi DISCORD10 ja saate -10% esimeselt ostult!

Link: https://www.estzone.eu

GG ja head mängimist!`
  },
  {
    platform: "Reddit (r/Eesti, r/gaming)",
    title: "[Eesti] Uus gaming e-pood - EstZone.eu",
    text: `Tere r/Eesti!

Avasime hiljuti EstZone.eu - gaming e-poe, mis keskendub Eesti turule.

Mida leiab:
- Mängukonsoolid (PS5, Xbox, Switch)
- VR headsetid (Quest 3, PSVR2)
- Kontrollerid ja tarvikud
- Gaming toolid

Meie plussid:
- Kõik hinnad sisaldavad käibemaksu
- Tarne Omniva/DPD-ga 1-3 päevaga
- 1-aastane garantii
- Eestikeelne tugi

Kui kellelgi küsimusi, vastan hea meelega!

PS: Redditi kasutajatele kood REDDIT10 = -10% esimene ost`
  },
  {
    platform: "Reddit (English)",
    title: "[Estonia] New gaming store - EstZone.eu",
    text: `Hey r/gaming!

Just wanted to share a new gaming store serving the Baltic region - EstZone.eu

What we have:
- Gaming consoles (PS5, Xbox Series X, Switch)
- VR headsets (Quest 3, PSVR2) 
- Controllers and accessories
- Gaming chairs and desks

Why choose us:
- Fast delivery in Estonia/Baltics
- 1-year warranty on everything
- Prices include VAT
- English support available

For Redditors: Use code REDDIT10 for 10% off first order!

Happy to answer any questions.`
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

        <h2 className="text-2xl font-semibold mt-8 mb-4">Facebook / Instagram Reklaamid</h2>
        
        <h3 className="text-lg font-medium text-muted-foreground">Eestikeelsed</h3>
        <div className="grid gap-4 mb-6">
          {facebookAdsEt.map((ad, index) => (
            <Card key={`fb-et-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  {ad.type} (ET)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`${ad.title}\n\n${ad.text}\n\nCTA: ${ad.cta}\n\n${ad.hashtags}`, `fb-et-${index}`)}
                    data-testid={`button-copy-fb-et-${index}`}
                  >
                    {copiedIndex === `fb-et-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Pealkiri:</span> {ad.title}</div>
                <div className="whitespace-pre-wrap">{ad.text}</div>
                <div><span className="font-semibold text-green-500">CTA nupp:</span> {ad.cta}</div>
                <div className="text-blue-400">{ad.hashtags}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-lg font-medium text-muted-foreground">English</h3>
        <div className="grid gap-4 mb-8">
          {facebookAdsEn.map((ad, index) => (
            <Card key={`fb-en-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  {ad.type} (EN)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`${ad.title}\n\n${ad.text}\n\nCTA: ${ad.cta}\n\n${ad.hashtags}`, `fb-en-${index}`)}
                    data-testid={`button-copy-fb-en-${index}`}
                  >
                    {copiedIndex === `fb-en-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Title:</span> {ad.title}</div>
                <div className="whitespace-pre-wrap">{ad.text}</div>
                <div><span className="font-semibold text-green-500">CTA Button:</span> {ad.cta}</div>
                <div className="text-blue-400">{ad.hashtags}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">TikTok Reklaamid</h2>
        
        <h3 className="text-lg font-medium text-muted-foreground">Eestikeelsed</h3>
        <div className="grid gap-4 mb-6">
          {tiktokAdsEt.map((ad, index) => (
            <Card key={`tt-et-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  {ad.type} (ET)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`Hook: ${ad.hook}\n\n${ad.text}\n\n${ad.hashtags}`, `tt-et-${index}`)}
                    data-testid={`button-copy-tt-et-${index}`}
                  >
                    {copiedIndex === `tt-et-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-pink-500">Hook:</span> {ad.hook}</div>
                <div>{ad.text}</div>
                <div className="text-blue-400">{ad.hashtags}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="text-lg font-medium text-muted-foreground">English</h3>
        <div className="grid gap-4 mb-8">
          {tiktokAdsEn.map((ad, index) => (
            <Card key={`tt-en-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  {ad.type} (EN)
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`Hook: ${ad.hook}\n\n${ad.text}\n\n${ad.hashtags}`, `tt-en-${index}`)}
                    data-testid={`button-copy-tt-en-${index}`}
                  >
                    {copiedIndex === `tt-en-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-pink-500">Hook:</span> {ad.hook}</div>
                <div>{ad.text}</div>
                <div className="text-blue-400">{ad.hashtags}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Hinnavaatlus / Kuulutused</h2>
        <div className="grid gap-4 mb-8">
          {hinnavaatlusAds.map((ad, index) => (
            <Card key={`hv-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  Kuulutus {index + 1}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`${ad.title}\n\n${ad.text}\n\nKategooria: ${ad.category}`, `hv-${index}`)}
                    data-testid={`button-copy-hv-${index}`}
                  >
                    {copiedIndex === `hv-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Pealkiri:</span> {ad.title}</div>
                <div className="whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{ad.text}</div>
                <div><span className="font-semibold text-muted-foreground">Kategooria:</span> {ad.category}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Discord / Reddit Postitused</h2>
        <div className="grid gap-4 mb-8">
          {discordRedditAds.map((ad, index) => (
            <Card key={`dr-${index}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between gap-2">
                  {ad.platform}
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => copyToClipboard(`${ad.title}\n\n${ad.text}`, `dr-${index}`)}
                    data-testid={`button-copy-dr-${index}`}
                  >
                    {copiedIndex === `dr-${index}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div><span className="font-semibold text-primary">Pealkiri:</span> {ad.title}</div>
                <div className="whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">{ad.text}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h2 className="text-xl font-semibold">Sotsiaalmeedia Pildid / Social Media Images</h2>
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
