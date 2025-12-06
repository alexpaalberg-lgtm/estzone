import OpenAI from 'openai';
import { storage } from '../storage';
import { Product } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SeoRecommendation {
  productId: string;
  productName: string;
  currentTitleEn?: string;
  currentTitleEt?: string;
  suggestedTitleEn: string;
  suggestedTitleEt: string;
  currentDescEn?: string;
  currentDescEt?: string;
  suggestedDescEn: string;
  suggestedDescEt: string;
  keywords: string[];
  keywordsEt: string[];
  score: number;
  improvements: string[];
  improvementsEt: string[];
}

interface SeoAnalysis {
  timestamp: Date;
  productsAnalyzed: number;
  avgSeoScore: number;
  recommendations: SeoRecommendation[];
  topKeywords: { keyword: string; count: number }[];
  topKeywordsEt: { keyword: string; count: number }[];
  generalTips: string[];
  generalTipsEt: string[];
}

export async function analyzeSeo(productIds?: string[]): Promise<SeoAnalysis> {
  try {
    let products = await storage.getProducts();
    
    if (productIds && productIds.length > 0) {
      products = products.filter(p => productIds.includes(p.id));
    } else {
      // Analyze up to 20 products, prioritizing those with missing SEO
      products = products
        .filter(p => p.isActive)
        .sort((a, b) => {
          const aScore = calculateBasicSeoScore(a);
          const bScore = calculateBasicSeoScore(b);
          return aScore - bScore; // Lowest scores first
        })
        .slice(0, 20);
    }

    const recommendations: SeoRecommendation[] = [];
    let totalScore = 0;

    for (const product of products) {
      const recommendation = await generateProductSeoRecommendation(product);
      recommendations.push(recommendation);
      totalScore += recommendation.score;
    }

    // Extract keywords from recommendations
    const keywordCounts = new Map<string, number>();
    const keywordCountsEt = new Map<string, number>();

    for (const rec of recommendations) {
      for (const kw of rec.keywords) {
        keywordCounts.set(kw, (keywordCounts.get(kw) || 0) + 1);
      }
      for (const kw of rec.keywordsEt) {
        keywordCountsEt.set(kw, (keywordCountsEt.get(kw) || 0) + 1);
      }
    }

    const topKeywords = Array.from(keywordCounts.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topKeywordsEt = Array.from(keywordCountsEt.entries())
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const analysis: SeoAnalysis = {
      timestamp: new Date(),
      productsAnalyzed: products.length,
      avgSeoScore: products.length > 0 ? Math.round(totalScore / products.length) : 0,
      recommendations,
      topKeywords,
      topKeywordsEt,
      generalTips: getGeneralSeoTips(),
      generalTipsEt: getGeneralSeoTipsEt(),
    };

    // Save analysis
    await storage.saveAIReport(`seo-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('SEO analysis error:', error);
    // Return fallback analysis instead of throwing
    return {
      timestamp: new Date(),
      productsAnalyzed: 0,
      avgSeoScore: 0,
      recommendations: [],
      topKeywords: [
        { keyword: 'gaming', count: 0 },
        { keyword: 'controller', count: 0 },
        { keyword: 'headset', count: 0 },
        { keyword: 'console', count: 0 },
        { keyword: 'VR', count: 0 },
      ],
      topKeywordsEt: [
        { keyword: 'mängimine', count: 0 },
        { keyword: 'kontroller', count: 0 },
        { keyword: 'peakomplekt', count: 0 },
        { keyword: 'konsool', count: 0 },
        { keyword: 'VR', count: 0 },
      ],
      generalTips: [
        'AI analysis unavailable - using fallback mode',
        'Ensure product titles include brand and key features',
        'Use descriptive, keyword-rich product descriptions',
        'Check OpenAI API connectivity',
        'Add alt text to all product images',
      ],
      generalTipsEt: [
        'AI analüüs pole saadaval - kasutatakse varuvariant',
        'Veendu, et toote pealkirjad sisaldavad brändi ja põhiomadusi',
        'Kasuta kirjeldavaid, märksõnarohkeid tootekirjeldusi',
        'Kontrolli OpenAI API ühendust',
        'Lisa kõigile tootepiltidele alt tekst',
      ],
    };
  }
}

function calculateBasicSeoScore(product: Product): number {
  let score = 0;
  
  // Check English fields
  if (product.nameEn && product.nameEn.length >= 20) score += 20;
  if (product.descriptionEn && product.descriptionEn.length >= 100) score += 30;
  if (product.descriptionEn && product.descriptionEn.length >= 200) score += 10;
  
  // Check Estonian fields
  if (product.nameEt && product.nameEt.length >= 20) score += 20;
  if (product.descriptionEt && product.descriptionEt.length >= 100) score += 20;

  return score;
}

async function generateProductSeoRecommendation(product: Product): Promise<SeoRecommendation> {
  const baseScore = calculateBasicSeoScore(product);
  
  try {
    const prompt = `You are an SEO expert for a gaming e-commerce store (EstZone) in Estonia.
Analyze this product and suggest SEO improvements in BOTH English and Estonian:

Product: ${product.nameEn}
Category: ${product.categoryId || 'Gaming'}
Current Description EN: ${product.descriptionEn?.substring(0, 200) || 'None'}
Current Description ET: ${product.descriptionEt?.substring(0, 200) || 'None'}
Price: €${product.price}

Return JSON:
{
  "suggestedTitleEn": "SEO optimized title in English (50-60 chars)",
  "suggestedTitleEt": "SEO optimized title in Estonian (50-60 chars)",
  "suggestedDescEn": "Meta description in English (150-160 chars)",
  "suggestedDescEt": "Meta description in Estonian (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "keywordsEt": ["võtmesõna1", "võtmesõna2", "võtmesõna3", "võtmesõna4", "võtmesõna5"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "improvementsEt": ["parandus1", "parandus2", "parandus3"]
}

Focus on gaming-related search terms and Estonian market. Include brand names where relevant.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Calculate improved score based on suggestions
    let improvedScore = baseScore;
    if (response.suggestedTitleEn) improvedScore += 10;
    if (response.suggestedDescEn) improvedScore += 10;
    if (response.keywords?.length >= 3) improvedScore += 10;

    return {
      productId: product.id,
      productName: product.nameEn,
      currentTitleEn: product.nameEn,
      currentTitleEt: product.nameEt,
      suggestedTitleEn: response.suggestedTitleEn || `${product.nameEn} | EstZone Gaming Store`,
      suggestedTitleEt: response.suggestedTitleEt || `${product.nameEt || product.nameEn} | EstZone Mängupood`,
      currentDescEn: product.descriptionEn?.substring(0, 160) || undefined,
      currentDescEt: product.descriptionEt?.substring(0, 160) || undefined,
      suggestedDescEn: response.suggestedDescEn || getDefaultMetaDesc(product, 'en'),
      suggestedDescEt: response.suggestedDescEt || getDefaultMetaDesc(product, 'et'),
      keywords: response.keywords || getDefaultKeywords(product, 'en'),
      keywordsEt: response.keywordsEt || getDefaultKeywords(product, 'et'),
      score: Math.min(improvedScore, 100),
      improvements: response.improvements || getDefaultImprovements('en'),
      improvementsEt: response.improvementsEt || getDefaultImprovements('et'),
    };
  } catch (error) {
    console.error('SEO recommendation error for product:', product.id, error);
    return {
      productId: product.id,
      productName: product.nameEn,
      suggestedTitleEn: `${product.nameEn} | EstZone Gaming Store`,
      suggestedTitleEt: `${product.nameEt || product.nameEn} | EstZone Mängupood`,
      suggestedDescEn: getDefaultMetaDesc(product, 'en'),
      suggestedDescEt: getDefaultMetaDesc(product, 'et'),
      keywords: getDefaultKeywords(product, 'en'),
      keywordsEt: getDefaultKeywords(product, 'et'),
      score: baseScore,
      improvements: getDefaultImprovements('en'),
      improvementsEt: getDefaultImprovements('et'),
    };
  }
}

function getDefaultMetaDesc(product: Product, lang: 'en' | 'et'): string {
  const price = `€${product.price}`;
  if (lang === 'et') {
    return `Osta ${product.nameEt || product.nameEn} hinnaga ${price}. Kiire kohaletoimetamine Eestis. Kvaliteetsed mängutooted EstZone poest.`;
  }
  return `Buy ${product.nameEn} for ${price}. Fast delivery in Estonia. Quality gaming products from EstZone store.`;
}

function getDefaultKeywords(product: Product, lang: 'en' | 'et'): string[] {
  const name = product.nameEn.toLowerCase();
  if (lang === 'et') {
    return ['mängud', 'gaming', name, 'eesti', 'osta'];
  }
  return ['gaming', 'buy', name, 'estonia', 'shop'];
}

function getDefaultImprovements(lang: 'en' | 'et'): string[] {
  if (lang === 'et') {
    return [
      'Lisa pikemad tootekirjeldused',
      'Kasuta rohkem võtmesõnu',
      'Optimeeri pildid alt-tekstidega',
    ];
  }
  return [
    'Add longer product descriptions',
    'Include more relevant keywords',
    'Optimize images with alt text',
  ];
}

function getGeneralSeoTips(): string[] {
  return [
    'Use descriptive, keyword-rich product titles',
    'Write unique meta descriptions for each product',
    'Include customer reviews for user-generated content',
    'Optimize product images with descriptive file names and alt text',
    'Create category pages with relevant content',
    'Use internal linking between related products',
    'Ensure mobile-friendly product pages',
    'Add structured data (schema markup) for products',
  ];
}

function getGeneralSeoTipsEt(): string[] {
  return [
    'Kasuta kirjeldavaid, võtmesõnadega rikastatud tootenimesid',
    'Kirjuta igale tootele unikaalne meta kirjeldus',
    'Lisa klientide arvustused kasutajate loodud sisu jaoks',
    'Optimeeri tootepiledid kirjeldavate failinimedega',
    'Loo asjakohase sisuga kategoorialehed',
    'Kasuta sisemisi linke seotud toodete vahel',
    'Taga mobiilisõbralikud tootelehed',
    'Lisa toodetele struktureeritud andmed',
  ];
}

export async function applySeoRecommendation(productId: string, recommendation: Partial<SeoRecommendation>): Promise<boolean> {
  try {
    const product = await storage.getProduct(productId);
    if (!product) return false;

    // Store the recommendation in AI reports for future reference
    // Product SEO fields would need to be added to the schema for direct application
    console.log('SEO recommendation stored for product:', productId, recommendation);
    
    // Save recommendation to AI reports
    await storage.saveAIReport(`seo-applied-${productId}`, {
      productId,
      recommendation,
      appliedAt: new Date(),
    });

    return true;
  } catch (error) {
    console.error('Error applying SEO recommendation:', error);
    return false;
  }
}

export async function getLatestSeoAnalysis(): Promise<SeoAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`seo-${today}`);
}

// Bulk SEO improvement without AI - fast and free
export async function bulkImproveSeo(): Promise<{ updated: number; avgScore: number }> {
  try {
    const products = await storage.getProducts();
    const activeProducts = products.filter(p => p.isActive);
    let updatedCount = 0;
    let totalScore = 0;

    for (const product of activeProducts) {
      const currentScore = calculateBasicSeoScore(product);
      
      // Skip if already has good SEO (score >= 80)
      if (currentScore >= 80) {
        totalScore += currentScore;
        continue;
      }

      // Generate improved descriptions if needed
      let updatedEn = product.descriptionEn || '';
      let updatedEt = product.descriptionEt || '';
      
      // English description improvements (need 200+ chars for best SEO)
      if (!updatedEn || updatedEn.length < 200) {
        const categoryName = product.categoryId ? await getCategoryName(product.categoryId, 'en') : 'Gaming';
        const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        updatedEn = generateSeoDescription(product.nameEn, categoryName, priceNum, 'en');
      }
      
      // Estonian description improvements (need 200+ chars for best SEO)
      if (!updatedEt || updatedEt.length < 200) {
        const categoryNameEt = product.categoryId ? await getCategoryName(product.categoryId, 'et') : 'Mängimine';
        const priceNum = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
        updatedEt = generateSeoDescription(product.nameEt || product.nameEn, categoryNameEt, priceNum, 'et');
      }

      // Update product if descriptions were improved
      if (updatedEn !== product.descriptionEn || updatedEt !== product.descriptionEt) {
        await storage.updateProduct(product.id, {
          descriptionEn: updatedEn,
          descriptionEt: updatedEt,
        });
        updatedCount++;
      }
      
      totalScore += calculateBasicSeoScore({ ...product, descriptionEn: updatedEn, descriptionEt: updatedEt });
    }

    const avgScore = activeProducts.length > 0 ? Math.round(totalScore / activeProducts.length) : 0;
    
    // Save report
    await storage.saveAIReport('bulk-seo-' + new Date().toISOString().split('T')[0], {
      timestamp: new Date(),
      productsUpdated: updatedCount,
      totalProducts: activeProducts.length,
      avgScore,
    });

    return { updated: updatedCount, avgScore };
  } catch (error) {
    console.error('Bulk SEO improvement error:', error);
    return { updated: 0, avgScore: 0 };
  }
}

async function getCategoryName(categoryId: string, lang: 'en' | 'et'): Promise<string> {
  try {
    const category = await storage.getCategory(categoryId);
    if (category) {
      return lang === 'et' ? (category.nameEt || category.nameEn) : category.nameEn;
    }
  } catch {}
  return lang === 'et' ? 'Mängimine' : 'Gaming';
}

function generateSeoDescription(productName: string, categoryName: string, price: number, lang: 'en' | 'et'): string {
  const priceStr = `€${price.toFixed(2)}`;
  
  if (lang === 'et') {
    return `Osta ${productName} soodsa hinnaga ${priceStr} EstZone e-poest - Eesti soodsaim mängupood! ` +
      `Kvaliteetne ${categoryName.toLowerCase()} toode kiire tarnega üle Eesti ja Baltimaade. ` +
      `Pakume laia valiku mänguriseadmeid, kontrollereid, peakomplekte ja tarvikuid parimate hindadega. ` +
      `Turvaline maksmine Montonio, Stripe ja PayPaliga. Kiire kohaletoimetamine Omniva ja DPD-ga. ` +
      `Meie hinnad on 15-20% madalamad kui konkurentidel. Tellides EstZone'ist saad kvaliteetse toote kiiresti kätte!`;
  }
  
  return `Buy ${productName} at the best price ${priceStr} from EstZone Gaming Store - The cheapest gaming store in the Baltics! ` +
    `Premium ${categoryName.toLowerCase()} product with fast delivery across Estonia and the Baltic region. ` +
    `We offer a wide selection of gaming gear, controllers, headsets, and accessories at unbeatable prices. ` +
    `Secure payment with Montonio, Stripe, and PayPal. Fast delivery with Omniva and DPD courier services. ` +
    `Our prices are 15-20% lower than competitors. Order from EstZone and get your quality gaming gear delivered fast!`;
}
