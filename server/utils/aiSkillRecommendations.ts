import OpenAI from 'openai';
import { storage } from '../storage';
import type { Product } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SkillLevel = 'beginner' | 'intermediate' | 'pro';

interface ProductSkillData {
  productId: string;
  productName: string;
  productNameEt: string;
  price: number;
  category: string;
  skillLevel: SkillLevel;
  skillReason: string;
  skillReasonEt: string;
  features: string[];
  recommendedFor: string;
  recommendedForEt: string;
}

interface SkillLevelGroup {
  level: SkillLevel;
  labelEn: string;
  labelEt: string;
  descriptionEn: string;
  descriptionEt: string;
  products: ProductSkillData[];
  priceRange: { min: number; max: number };
  topPick?: ProductSkillData;
}

interface SkillAnalysis {
  timestamp: Date;
  totalProducts: number;
  categorizedProducts: number;
  skillGroups: SkillLevelGroup[];
  insights: string[];
  categoryBreakdown: { category: string; beginner: number; intermediate: number; pro: number }[];
}

// Price thresholds for skill level heuristics (EUR)
const PRICE_THRESHOLDS = {
  budget: 50,
  midRange: 150,
  premium: 300,
};

// Keywords that indicate skill level
const SKILL_INDICATORS = {
  beginner: [
    'starter', 'basic', 'entry', 'simple', 'easy', 'casual', 'lite', 'mini',
    'compact', 'budget', 'affordable', 'standard', 'essential'
  ],
  intermediate: [
    'gaming', 'performance', 'enhanced', 'plus', 'improved', 'advanced',
    'wireless', 'rgb', 'mechanical', 'surround', 'ergonomic'
  ],
  pro: [
    'pro', 'elite', 'tournament', 'esports', 'competition', 'championship',
    'ultimate', 'extreme', 'professional', 'premium', 'flagship', 'max'
  ],
};

export async function analyzeSkillLevels(): Promise<SkillAnalysis> {
  try {
    const products = await storage.getProducts();
    const categories = await storage.getCategories();
    const activeProducts = products.filter(p => p.isActive && p.stock > 0);

    const categorizedProducts: ProductSkillData[] = [];

    // Categorize each product by skill level
    for (const product of activeProducts) {
      const skillData = await categorizeProductBySkill(product, categories);
      if (skillData) {
        categorizedProducts.push(skillData);
      }
    }

    // Group products by skill level
    const skillGroups = createSkillGroups(categorizedProducts);

    // Generate category breakdown
    const categoryBreakdown = generateCategoryBreakdown(categorizedProducts);

    // Generate AI insights
    const insights = await generateSkillInsights(skillGroups, categorizedProducts.length);

    const analysis: SkillAnalysis = {
      timestamp: new Date(),
      totalProducts: products.length,
      categorizedProducts: categorizedProducts.length,
      skillGroups,
      insights,
      categoryBreakdown,
    };

    // Save analysis
    await storage.saveAIReport(`skills-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('Skill analysis error:', error);
    // Return fallback analysis instead of throwing
    return {
      timestamp: new Date(),
      totalProducts: 0,
      categorizedProducts: 0,
      skillGroups: [
        {
          level: 'beginner',
          labelEn: 'Beginner',
          labelEt: 'Algaja',
          descriptionEn: 'Entry-level products for new gamers',
          descriptionEt: 'Algtaseme tooted uutele mängijatele',
          products: [],
          priceRange: { min: 0, max: 50 },
        },
        {
          level: 'intermediate',
          labelEn: 'Intermediate',
          labelEt: 'Keskmine',
          descriptionEn: 'Products for experienced gamers',
          descriptionEt: 'Tooted kogenud mängijatele',
          products: [],
          priceRange: { min: 50, max: 150 },
        },
        {
          level: 'pro',
          labelEn: 'Professional',
          labelEt: 'Professionaal',
          descriptionEn: 'Pro-level equipment for serious gamers',
          descriptionEt: 'Profitaseme varustus tõsistele mängijatele',
          products: [],
          priceRange: { min: 150, max: 500 },
        },
      ],
      insights: [
        'AI analysis unavailable - using fallback mode / AI analüüs pole saadaval - kasutatakse varuvariant',
        'Manual skill categorization recommended / Soovitatav oskuste käsitsi kategoriseerimine',
        'Check OpenAI API connectivity / Kontrolli OpenAI API ühendust',
      ],
      categoryBreakdown: [],
    };
  }
}

async function categorizeProductBySkill(product: Product, categories: any[]): Promise<ProductSkillData | null> {
  try {
    const price = parseFloat(product.price);
    const nameLower = product.nameEn.toLowerCase();
    const descLower = (product.descriptionEn || '').toLowerCase();
    const combined = `${nameLower} ${descLower}`;

    // Determine category name
    const category = categories.find(c => c.id === product.categoryId);
    const categoryName = category?.nameEn || 'Gaming';

    // Heuristic skill level detection
    let skillLevel: SkillLevel = 'intermediate';
    let skillReason = '';
    let skillReasonEt = '';

    // Check for pro indicators
    const hasProIndicator = SKILL_INDICATORS.pro.some(i => combined.includes(i));
    const hasBeginnerIndicator = SKILL_INDICATORS.beginner.some(i => combined.includes(i));
    const hasIntermediateIndicator = SKILL_INDICATORS.intermediate.some(i => combined.includes(i));

    if (hasProIndicator || price >= PRICE_THRESHOLDS.premium) {
      skillLevel = 'pro';
      skillReason = hasProIndicator 
        ? 'Professional-grade features and build quality'
        : 'Premium price point indicates professional quality';
      skillReasonEt = hasProIndicator
        ? 'Professionaalse taseme omadused ja kvaliteet'
        : 'Preemium hinnatase viitab professionaalsele kvaliteedile';
    } else if (hasBeginnerIndicator || price <= PRICE_THRESHOLDS.budget) {
      skillLevel = 'beginner';
      skillReason = hasBeginnerIndicator
        ? 'Designed for newcomers and casual gamers'
        : 'Budget-friendly option perfect for getting started';
      skillReasonEt = hasBeginnerIndicator
        ? 'Mõeldud algajatele ja juhuslikele mängijatele'
        : 'Soodne variant ideaalne alustamiseks';
    } else {
      skillLevel = 'intermediate';
      skillReason = 'Balanced features suitable for regular gamers';
      skillReasonEt = 'Tasakaalustatud omadused sobivad igapäevastele mängijatele';
    }

    // Extract features from description
    const features = extractFeatures(product.descriptionEn || '');

    // Generate recommendation text
    const { recommendedFor, recommendedForEt } = getRecommendationText(skillLevel, categoryName);

    return {
      productId: product.id,
      productName: product.nameEn,
      productNameEt: product.nameEt || product.nameEn,
      price,
      category: categoryName,
      skillLevel,
      skillReason,
      skillReasonEt,
      features,
      recommendedFor,
      recommendedForEt,
    };
  } catch (error) {
    console.error('Product skill categorization error:', error);
    return null;
  }
}

function extractFeatures(description: string): string[] {
  const features: string[] = [];
  const featurePatterns = [
    /(\d+)\s*hz/i,
    /(\d+)\s*dpi/i,
    /wireless/i,
    /rgb/i,
    /mechanical/i,
    /surround\s*sound/i,
    /noise\s*cancell/i,
    /ergonomic/i,
    /(\d+)\s*gb/i,
    /4k/i,
    /hdr/i,
  ];

  for (const pattern of featurePatterns) {
    const match = description.match(pattern);
    if (match) {
      features.push(match[0]);
    }
  }

  return features.slice(0, 5);
}

function getRecommendationText(level: SkillLevel, category: string): { recommendedFor: string; recommendedForEt: string } {
  const texts = {
    beginner: {
      recommendedFor: `Perfect for newcomers to ${category.toLowerCase()} gaming. Easy to use with essential features.`,
      recommendedForEt: `Ideaalne ${category.toLowerCase()} mängude algajatele. Lihtne kasutada oluliste omadustega.`,
    },
    intermediate: {
      recommendedFor: `Great choice for regular gamers who want quality without breaking the bank.`,
      recommendedForEt: `Suurepärane valik tavalistele mängijatele, kes soovivad kvaliteeti mõistliku hinnaga.`,
    },
    pro: {
      recommendedFor: `Designed for competitive players and enthusiasts demanding the best performance.`,
      recommendedForEt: `Mõeldud võistluslikele mängijatele ja entusiastidele, kes nõuavad parimat jõudlust.`,
    },
  };

  return texts[level];
}

function createSkillGroups(products: ProductSkillData[]): SkillLevelGroup[] {
  const groups: SkillLevelGroup[] = [
    {
      level: 'beginner',
      labelEn: 'Beginner',
      labelEt: 'Algaja',
      descriptionEn: 'Perfect for those just starting their gaming journey. Easy to use, affordable, and reliable.',
      descriptionEt: 'Ideaalne neile, kes alles alustavad oma mänguteed. Lihtne kasutada, taskukohane ja usaldusväärne.',
      products: [],
      priceRange: { min: 0, max: 0 },
    },
    {
      level: 'intermediate',
      labelEn: 'Intermediate',
      labelEt: 'Keskmine',
      descriptionEn: 'For regular gamers who want a balance of performance and value.',
      descriptionEt: 'Tavalistele mängijatele, kes soovivad tasakaalu jõudluse ja väärtuse vahel.',
      products: [],
      priceRange: { min: 0, max: 0 },
    },
    {
      level: 'pro',
      labelEn: 'Professional',
      labelEt: 'Professionaalne',
      descriptionEn: 'Top-tier equipment for competitive players and enthusiasts who demand the best.',
      descriptionEt: 'Tipptasemel varustus võistluslikele mängijatele ja entusiastidele, kes nõuavad parimat.',
      products: [],
      priceRange: { min: 0, max: 0 },
    },
  ];

  for (const product of products) {
    const group = groups.find(g => g.level === product.skillLevel);
    if (group) {
      group.products.push(product);
    }
  }

  // Calculate price ranges and find top picks
  for (const group of groups) {
    if (group.products.length > 0) {
      const prices = group.products.map(p => p.price);
      group.priceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };

      // Top pick: best value (mid-range price with good features)
      const sortedByPrice = [...group.products].sort((a, b) => a.price - b.price);
      const midIndex = Math.floor(sortedByPrice.length / 2);
      group.topPick = sortedByPrice[midIndex];
    }
  }

  return groups;
}

function generateCategoryBreakdown(products: ProductSkillData[]): { category: string; beginner: number; intermediate: number; pro: number }[] {
  const breakdown: Record<string, { beginner: number; intermediate: number; pro: number }> = {};

  for (const product of products) {
    if (!breakdown[product.category]) {
      breakdown[product.category] = { beginner: 0, intermediate: 0, pro: 0 };
    }
    breakdown[product.category][product.skillLevel]++;
  }

  return Object.entries(breakdown).map(([category, counts]) => ({
    category,
    ...counts,
  }));
}

async function generateSkillInsights(groups: SkillLevelGroup[], totalProducts: number): Promise<string[]> {
  try {
    const beginnerCount = groups.find(g => g.level === 'beginner')?.products.length || 0;
    const intermediateCount = groups.find(g => g.level === 'intermediate')?.products.length || 0;
    const proCount = groups.find(g => g.level === 'pro')?.products.length || 0;

    const prompt = `Generate 3-4 brief insights for a gaming store's skill-level product categorization:
- Total products: ${totalProducts}
- Beginner products: ${beginnerCount}
- Intermediate products: ${intermediateCount}
- Pro products: ${proCount}

Include insights about product balance, customer targeting, and marketing opportunities.
Format as JSON: {"insights": ["insight1", "insight2", ...]}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    return response.insights || getDefaultInsights(beginnerCount, intermediateCount, proCount);
  } catch (error) {
    console.error('Skill insights generation error:', error);
    return getDefaultInsights(
      groups.find(g => g.level === 'beginner')?.products.length || 0,
      groups.find(g => g.level === 'intermediate')?.products.length || 0,
      groups.find(g => g.level === 'pro')?.products.length || 0
    );
  }
}

function getDefaultInsights(beginner: number, intermediate: number, pro: number): string[] {
  return [
    `Catalog offers ${beginner} beginner-friendly options for newcomers`,
    `${intermediate} products cater to regular gamers seeking value`,
    `${pro} professional-grade items available for competitive players`,
    'Consider creating "Starter Kit" bundles for beginners',
  ];
}

export async function getLatestSkillAnalysis(): Promise<SkillAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`skills-${today}`);
}

// Get recommendations for a specific skill level
export async function getSkillRecommendations(level: SkillLevel, limit: number = 10): Promise<ProductSkillData[]> {
  const analysis = await getLatestSkillAnalysis();
  if (!analysis) return [];

  const group = analysis.skillGroups.find(g => g.level === level);
  if (!group) return [];

  return group.products.slice(0, limit);
}
