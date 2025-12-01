import OpenAI from 'openai';
import { storage } from '../storage';
import type { Product } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BundleProduct {
  productId: string;
  productName: string;
  productNameEt: string;
  price: number;
  category: string;
}

interface GeneratedBundle {
  id: string;
  nameEn: string;
  nameEt: string;
  descriptionEn: string;
  descriptionEt: string;
  products: BundleProduct[];
  originalPrice: number;
  bundlePrice: number;
  discountPercent: number;
  targetAudience: string;
  targetAudienceEt: string;
  confidence: 'high' | 'medium' | 'low';
  createdAt: Date;
}

interface BundleAnalysis {
  timestamp: Date;
  bundlesGenerated: number;
  bundles: GeneratedBundle[];
  insights: string[];
}

// Category mappings for intelligent bundling
const categoryGroups = {
  console_main: ['PlayStation', 'Xbox', 'Nintendo', 'Gaming Consoles'],
  console_accessories: ['Controllers', 'Headsets', 'Charging', 'Storage'],
  vr: ['VR Headsets', 'VR Accessories', 'VR Games'],
  pc: ['Gaming Mice', 'Gaming Keyboards', 'Monitors', 'PC Components'],
  audio: ['Headsets', 'Speakers', 'Microphones'],
  streaming: ['Webcams', 'Capture Cards', 'Lighting', 'Microphones'],
};

export async function generateBundles(): Promise<BundleAnalysis> {
  const bundles: GeneratedBundle[] = [];
  const insights: string[] = [];

  try {
    const products = await storage.getProducts();
    const categories = await storage.getCategories();
    const activeProducts = products.filter(p => p.isActive && p.stock > 0);

    // Generate different types of bundles
    const consoleBundles = await generateConsoleBundles(activeProducts, categories);
    bundles.push(...consoleBundles);

    const vrBundles = await generateVRBundles(activeProducts, categories);
    bundles.push(...vrBundles);

    const streamingBundles = await generateStreamingBundles(activeProducts, categories);
    bundles.push(...streamingBundles);

    const gamingPCBundles = await generateGamingPCBundles(activeProducts, categories);
    bundles.push(...gamingPCBundles);

    // Get AI-generated insights
    insights.push(...await generateBundleInsights(bundles, activeProducts.length));

    const analysis: BundleAnalysis = {
      timestamp: new Date(),
      bundlesGenerated: bundles.length,
      bundles: bundles.sort((a, b) => b.discountPercent - a.discountPercent),
      insights,
    };

    // Save analysis
    await storage.saveAIReport(`bundles-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('Bundle generation error:', error);
    // Return fallback analysis instead of throwing with bilingual content
    return {
      timestamp: new Date(),
      bundlesGenerated: 0,
      bundles: [],
      insights: [
        'AI bundle generation unavailable - using fallback mode / AI pakettide genereerimine pole saadaval - kasutatakse varuvariant',
        'Manual bundle creation recommended / Soovitatav pakettide käsitsi loomine',
        'Check OpenAI API connectivity / Kontrolli OpenAI API ühendust',
      ],
    };
  }
}

async function generateConsoleBundles(products: Product[], categories: any[]): Promise<GeneratedBundle[]> {
  const bundles: GeneratedBundle[] = [];

  // Find console products
  const consoles = products.filter(p => 
    p.nameEn.toLowerCase().includes('playstation') ||
    p.nameEn.toLowerCase().includes('ps5') ||
    p.nameEn.toLowerCase().includes('xbox') ||
    p.nameEn.toLowerCase().includes('nintendo') ||
    p.nameEn.toLowerCase().includes('switch')
  );

  // Find accessories
  const controllers = products.filter(p => 
    p.nameEn.toLowerCase().includes('controller') ||
    p.nameEn.toLowerCase().includes('dualsense') ||
    p.nameEn.toLowerCase().includes('gamepad')
  );

  const headsets = products.filter(p => 
    p.nameEn.toLowerCase().includes('headset') ||
    p.nameEn.toLowerCase().includes('pulse')
  );

  // Create PS5 Pro Bundle
  const ps5Console = consoles.find(c => c.nameEn.toLowerCase().includes('ps5'));
  if (ps5Console) {
    const ps5Controller = controllers.find(c => 
      c.nameEn.toLowerCase().includes('dualsense') || 
      c.nameEn.toLowerCase().includes('ps5')
    );
    const gamingHeadset = headsets[0];

    if (ps5Controller || gamingHeadset) {
      const bundleProducts: BundleProduct[] = [
        {
          productId: ps5Console.id,
          productName: ps5Console.nameEn,
          productNameEt: ps5Console.nameEt || ps5Console.nameEn,
          price: parseFloat(ps5Console.price),
          category: 'Console',
        },
      ];

      if (ps5Controller) {
        bundleProducts.push({
          productId: ps5Controller.id,
          productName: ps5Controller.nameEn,
          productNameEt: ps5Controller.nameEt || ps5Controller.nameEn,
          price: parseFloat(ps5Controller.price),
          category: 'Controller',
        });
      }

      if (gamingHeadset) {
        bundleProducts.push({
          productId: gamingHeadset.id,
          productName: gamingHeadset.nameEn,
          productNameEt: gamingHeadset.nameEt || gamingHeadset.nameEn,
          price: parseFloat(gamingHeadset.price),
          category: 'Headset',
        });
      }

      const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
      const discountPercent = 12;
      const bundlePrice = originalPrice * (1 - discountPercent / 100);

      bundles.push({
        id: `bundle-ps5-pro-${Date.now()}`,
        nameEn: 'PlayStation 5 Pro Gaming Bundle',
        nameEt: 'PlayStation 5 Pro Mängukomplekt',
        descriptionEn: 'Everything you need to start your PS5 gaming journey. Includes console, premium controller, and immersive headset.',
        descriptionEt: 'Kõik vajalik PS5 mängukogemuse alustamiseks. Sisaldab konsooli, premium kontrollerit ja kaasahaaravat peakomplekti.',
        products: bundleProducts,
        originalPrice,
        bundlePrice: Math.round(bundlePrice * 100) / 100,
        discountPercent,
        targetAudience: 'New PlayStation gamers and gift buyers',
        targetAudienceEt: 'Uued PlayStation mängijad ja kingituse ostjad',
        confidence: 'high',
        createdAt: new Date(),
      });
    }
  }

  // Create Xbox Bundle
  const xboxConsole = consoles.find(c => c.nameEn.toLowerCase().includes('xbox'));
  if (xboxConsole) {
    const xboxController = controllers.find(c => c.nameEn.toLowerCase().includes('xbox'));
    
    if (xboxController) {
      const bundleProducts: BundleProduct[] = [
        {
          productId: xboxConsole.id,
          productName: xboxConsole.nameEn,
          productNameEt: xboxConsole.nameEt || xboxConsole.nameEn,
          price: parseFloat(xboxConsole.price),
          category: 'Console',
        },
        {
          productId: xboxController.id,
          productName: xboxController.nameEn,
          productNameEt: xboxController.nameEt || xboxController.nameEn,
          price: parseFloat(xboxController.price),
          category: 'Controller',
        },
      ];

      const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
      const discountPercent = 10;
      const bundlePrice = originalPrice * (1 - discountPercent / 100);

      bundles.push({
        id: `bundle-xbox-starter-${Date.now()}`,
        nameEn: 'Xbox Gaming Starter Kit',
        nameEt: 'Xbox Mängu Stardikomplekt',
        descriptionEn: 'Start your Xbox gaming adventure with this complete starter kit featuring the console and an extra controller.',
        descriptionEt: 'Alusta Xbox mänguseiklust selle täieliku stardikomplektiga, mis sisaldab konsooli ja lisakontrollerit.',
        products: bundleProducts,
        originalPrice,
        bundlePrice: Math.round(bundlePrice * 100) / 100,
        discountPercent,
        targetAudience: 'Xbox newcomers and multiplayer enthusiasts',
        targetAudienceEt: 'Xbox uustulnukad ja multiplayer entusiastid',
        confidence: 'high',
        createdAt: new Date(),
      });
    }
  }

  return bundles;
}

async function generateVRBundles(products: Product[], categories: any[]): Promise<GeneratedBundle[]> {
  const bundles: GeneratedBundle[] = [];

  const vrHeadsets = products.filter(p => 
    p.nameEn.toLowerCase().includes('vr') ||
    p.nameEn.toLowerCase().includes('quest') ||
    p.nameEn.toLowerCase().includes('virtual reality') ||
    p.nameEn.toLowerCase().includes('psvr')
  );

  if (vrHeadsets.length > 0) {
    const mainVRHeadset = vrHeadsets[0];
    const controllers = products.filter(p => 
      p.nameEn.toLowerCase().includes('controller') && 
      !p.nameEn.toLowerCase().includes('xbox') &&
      !p.nameEn.toLowerCase().includes('playstation')
    );

    const bundleProducts: BundleProduct[] = [
      {
        productId: mainVRHeadset.id,
        productName: mainVRHeadset.nameEn,
        productNameEt: mainVRHeadset.nameEt || mainVRHeadset.nameEn,
        price: parseFloat(mainVRHeadset.price),
        category: 'VR Headset',
      },
    ];

    // Add a compatible accessory if available
    const vrAccessory = products.find(p => 
      (p.nameEn.toLowerCase().includes('strap') ||
       p.nameEn.toLowerCase().includes('stand') ||
       p.nameEn.toLowerCase().includes('case')) &&
      parseFloat(p.price) < parseFloat(mainVRHeadset.price) * 0.3
    );

    if (vrAccessory) {
      bundleProducts.push({
        productId: vrAccessory.id,
        productName: vrAccessory.nameEn,
        productNameEt: vrAccessory.nameEt || vrAccessory.nameEn,
        price: parseFloat(vrAccessory.price),
        category: 'Accessory',
      });
    }

    if (bundleProducts.length >= 1) {
      const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
      const discountPercent = 8;
      const bundlePrice = originalPrice * (1 - discountPercent / 100);

      bundles.push({
        id: `bundle-vr-starter-${Date.now()}`,
        nameEn: 'VR Gaming Starter Bundle',
        nameEt: 'VR Mängu Stardikomplekt',
        descriptionEn: 'Enter the world of virtual reality with this complete VR bundle. Perfect for beginners and VR enthusiasts.',
        descriptionEt: 'Astu virtuaalreaalsuse maailma selle täieliku VR komplektiga. Ideaalne algajatele ja VR entusiastidele.',
        products: bundleProducts,
        originalPrice,
        bundlePrice: Math.round(bundlePrice * 100) / 100,
        discountPercent,
        targetAudience: 'VR beginners and tech enthusiasts',
        targetAudienceEt: 'VR algajad ja tehnikaentusiastid',
        confidence: bundleProducts.length > 1 ? 'high' : 'medium',
        createdAt: new Date(),
      });
    }
  }

  return bundles;
}

async function generateStreamingBundles(products: Product[], categories: any[]): Promise<GeneratedBundle[]> {
  const bundles: GeneratedBundle[] = [];

  const webcams = products.filter(p => 
    p.nameEn.toLowerCase().includes('webcam') ||
    p.nameEn.toLowerCase().includes('camera')
  );

  const microphones = products.filter(p => 
    p.nameEn.toLowerCase().includes('microphone') ||
    p.nameEn.toLowerCase().includes('mic')
  );

  const headsets = products.filter(p => 
    p.nameEn.toLowerCase().includes('headset') ||
    p.nameEn.toLowerCase().includes('headphone')
  );

  if (webcams.length > 0 && (microphones.length > 0 || headsets.length > 0)) {
    const bundleProducts: BundleProduct[] = [
      {
        productId: webcams[0].id,
        productName: webcams[0].nameEn,
        productNameEt: webcams[0].nameEt || webcams[0].nameEn,
        price: parseFloat(webcams[0].price),
        category: 'Webcam',
      },
    ];

    if (microphones.length > 0) {
      bundleProducts.push({
        productId: microphones[0].id,
        productName: microphones[0].nameEn,
        productNameEt: microphones[0].nameEt || microphones[0].nameEn,
        price: parseFloat(microphones[0].price),
        category: 'Microphone',
      });
    }

    if (headsets.length > 0) {
      bundleProducts.push({
        productId: headsets[0].id,
        productName: headsets[0].nameEn,
        productNameEt: headsets[0].nameEt || headsets[0].nameEn,
        price: parseFloat(headsets[0].price),
        category: 'Headset',
      });
    }

    const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const discountPercent = 15;
    const bundlePrice = originalPrice * (1 - discountPercent / 100);

    bundles.push({
      id: `bundle-streamer-${Date.now()}`,
      nameEn: 'Pro Streamer Setup Bundle',
      nameEt: 'Pro Streamer Seadistuskomplekt',
      descriptionEn: 'Everything you need to start streaming like a pro. High-quality webcam, crystal-clear microphone, and premium audio.',
      descriptionEt: 'Kõik vajalik professionaalseks striimimiseks. Kõrge kvaliteediga veebikaamera, kristallselge mikrofon ja premium heli.',
      products: bundleProducts,
      originalPrice,
      bundlePrice: Math.round(bundlePrice * 100) / 100,
      discountPercent,
      targetAudience: 'Content creators, streamers, and remote workers',
      targetAudienceEt: 'Sisuloojad, striimijad ja kaugtöötajad',
      confidence: 'high',
      createdAt: new Date(),
    });
  }

  return bundles;
}

async function generateGamingPCBundles(products: Product[], categories: any[]): Promise<GeneratedBundle[]> {
  const bundles: GeneratedBundle[] = [];

  const mice = products.filter(p => 
    p.nameEn.toLowerCase().includes('mouse') ||
    p.nameEn.toLowerCase().includes('mice')
  );

  const keyboards = products.filter(p => 
    p.nameEn.toLowerCase().includes('keyboard')
  );

  const mousepads = products.filter(p => 
    p.nameEn.toLowerCase().includes('mousepad') ||
    p.nameEn.toLowerCase().includes('mouse pad') ||
    p.nameEn.toLowerCase().includes('desk mat')
  );

  if (mice.length > 0 && keyboards.length > 0) {
    const bundleProducts: BundleProduct[] = [
      {
        productId: mice[0].id,
        productName: mice[0].nameEn,
        productNameEt: mice[0].nameEt || mice[0].nameEn,
        price: parseFloat(mice[0].price),
        category: 'Gaming Mouse',
      },
      {
        productId: keyboards[0].id,
        productName: keyboards[0].nameEn,
        productNameEt: keyboards[0].nameEt || keyboards[0].nameEn,
        price: parseFloat(keyboards[0].price),
        category: 'Gaming Keyboard',
      },
    ];

    if (mousepads.length > 0) {
      bundleProducts.push({
        productId: mousepads[0].id,
        productName: mousepads[0].nameEn,
        productNameEt: mousepads[0].nameEt || mousepads[0].nameEn,
        price: parseFloat(mousepads[0].price),
        category: 'Mousepad',
      });
    }

    const originalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const discountPercent = 10;
    const bundlePrice = originalPrice * (1 - discountPercent / 100);

    bundles.push({
      id: `bundle-pc-peripherals-${Date.now()}`,
      nameEn: 'PC Gaming Peripherals Bundle',
      nameEt: 'PC Mängu Välisseadmete Komplekt',
      descriptionEn: 'Upgrade your PC gaming setup with this premium peripheral bundle. Precision mouse, mechanical keyboard, and gaming mousepad.',
      descriptionEt: 'Uuenda oma PC mänguseadistust selle premium välisseadmete komplektiga. Täpne hiir, mehaaniline klaviatuur ja mänguhiirepad.',
      products: bundleProducts,
      originalPrice,
      bundlePrice: Math.round(bundlePrice * 100) / 100,
      discountPercent,
      targetAudience: 'PC gamers upgrading their setup',
      targetAudienceEt: 'PC mängijad kes uuendavad oma seadistust',
      confidence: 'high',
      createdAt: new Date(),
    });
  }

  return bundles;
}

async function generateBundleInsights(bundles: GeneratedBundle[], totalProducts: number): Promise<string[]> {
  try {
    const totalSavings = bundles.reduce((sum, b) => sum + (b.originalPrice - b.bundlePrice), 0);
    const avgDiscount = bundles.length > 0 
      ? bundles.reduce((sum, b) => sum + b.discountPercent, 0) / bundles.length 
      : 0;

    const prompt = `Generate 3-4 brief marketing insights for gaming e-commerce product bundles:
- ${bundles.length} bundles created
- Average discount: ${avgDiscount.toFixed(1)}%
- Total savings offered: €${totalSavings.toFixed(2)}
- Product catalog: ${totalProducts} products

Include insights about bundle value, customer appeal, and seasonal opportunities.
Format as JSON: {"insights": ["insight1", "insight2", ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response.insights || getDefaultInsights(bundles);
  } catch (error) {
    console.error('Bundle insights generation error:', error);
    return getDefaultInsights(bundles);
  }
}

function getDefaultInsights(bundles: GeneratedBundle[]): string[] {
  return [
    `${bundles.length} curated bundles available for customers`,
    'Bundles offer significant savings compared to individual purchases',
    'Consider featuring top bundles on homepage and category pages',
    'Holiday season is ideal for promoting gaming bundles',
  ];
}

export async function getLatestBundles(): Promise<BundleAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`bundles-${today}`);
}
