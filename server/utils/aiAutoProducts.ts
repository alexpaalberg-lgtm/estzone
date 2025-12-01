import OpenAI from 'openai';
import { storage } from '../storage';
import { getPopularGames, getGameDetails, generateGameDescription, getPlatformCategory, type RawgGame } from '../services/rawg';
import type { InsertProduct, Category } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AutoProductSettings {
  enabled: boolean;
  intervalDays: number;
  maxProductsPerRun: number;
  platforms: string[];
  priceRangeMin: number;
  priceRangeMax: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface ProductAdditionResult {
  timestamp: Date;
  productsAdded: number;
  products: Array<{
    nameEn: string;
    nameEt: string;
    platform: string;
    price: number;
    imageUrl: string;
    rawgRating: number;
  }>;
  skipped: number;
  errors: string[];
  demandAnalysis: {
    trendingGenres: string[];
    popularPlatforms: string[];
    recommendations: string[];
    recommendationsEt: string[];
  };
}

const platformCategoryMap: Record<string, string> = {
  playstation: 'playstation-games',
  ps5: 'playstation-games',
  xbox: 'xbox-games',
  'xbox-series-x': 'xbox-games',
  nintendo: 'nintendo-games',
  switch: 'nintendo-games',
  pc: 'pc-games',
};

export async function analyzeDemandAndAddProducts(
  settings: AutoProductSettings
): Promise<ProductAdditionResult> {
  const result: ProductAdditionResult = {
    timestamp: new Date(),
    productsAdded: 0,
    products: [],
    skipped: 0,
    errors: [],
    demandAnalysis: {
      trendingGenres: [],
      popularPlatforms: [],
      recommendations: [],
      recommendationsEt: [],
    },
  };

  try {
    const existingProducts = await storage.getProducts({});
    const existingNames = new Set(existingProducts.map(p => p.nameEn.toLowerCase()));
    
    const orders = await storage.getOrders({});
    const recentOrders = orders.slice(0, 100);
    
    const demandAnalysis = await analyzeMarketDemand(recentOrders, existingProducts);
    result.demandAnalysis = demandAnalysis;

    const categories = await storage.getCategories();
    const gamesToAdd: RawgGame[] = [];
    
    for (const platform of settings.platforms) {
      const games = await getPopularGames(platform, 10);
      
      const newGames = games.filter(game => 
        !existingNames.has(game.name.toLowerCase()) &&
        game.background_image &&
        game.rating >= 3.5
      );
      
      gamesToAdd.push(...newGames.slice(0, Math.ceil(settings.maxProductsPerRun / settings.platforms.length)));
    }

    const sortedGames = gamesToAdd
      .sort((a, b) => (b.metacritic || 0) - (a.metacritic || 0))
      .slice(0, settings.maxProductsPerRun);

    for (const game of sortedGames) {
      try {
        const gameDetails = await getGameDetails(game.id);
        if (!gameDetails) continue;

        const platformCategory = getPlatformCategory(gameDetails);
        if (!platformCategory) {
          result.skipped++;
          continue;
        }

        const categorySlug = platformCategoryMap[platformCategory];
        const category = categories.find(c => c.slug === categorySlug);
        
        if (!category) {
          result.errors.push(`Category not found for ${platformCategory}`);
          result.skipped++;
          continue;
        }

        const price = calculateGamePrice(gameDetails, settings);
        const salePrice = gameDetails.rating >= 4.5 ? undefined : (price * 0.85).toFixed(2);
        
        const highResImage = getHighResolutionImage(gameDetails);

        const sku = generateSKU(gameDetails, platformCategory);
        
        const existingSku = await storage.getProductBySku(sku);
        if (existingSku) {
          result.skipped++;
          continue;
        }

        const descriptionEn = generateGameDescription(gameDetails, 'en');
        const descriptionEt = generateGameDescription(gameDetails, 'et');

        const productData: InsertProduct = {
          categoryId: category.id,
          nameEn: gameDetails.name,
          nameEt: gameDetails.name,
          descriptionEn,
          descriptionEt,
          price: price.toFixed(2),
          salePrice: salePrice,
          sku,
          stock: 50,
          images: [highResImage],
          isActive: true,
          isNew: true,
          isFeatured: gameDetails.rating >= 4.5,
          metaKeywords: generateMetaKeywords(gameDetails),
        };

        await storage.createProduct(productData);
        
        result.productsAdded++;
        result.products.push({
          nameEn: gameDetails.name,
          nameEt: gameDetails.name,
          platform: platformCategory,
          price,
          imageUrl: highResImage,
          rawgRating: gameDetails.rating,
        });

        console.log(`[AI-PRODUCTS] Added: ${gameDetails.name} (${platformCategory}) - €${price}`);
      } catch (error: any) {
        result.errors.push(`Failed to add ${game.name}: ${error.message}`);
      }
    }

    await storage.saveAIReport(`auto-products-${new Date().toISOString().split('T')[0]}`, result);
    await storage.saveAIReport('auto-products-latest', result);
    
    return result;
  } catch (error: any) {
    console.error('Auto product addition error:', error);
    result.errors.push(error.message);
    return result;
  }
}

async function analyzeMarketDemand(orders: any[], products: any[]): Promise<ProductAdditionResult['demandAnalysis']> {
  try {
    const prompt = `Analyze gaming market trends for an e-commerce store. Based on current gaming industry trends, suggest:
1. Top 3 trending game genres right now
2. Most popular gaming platforms to stock
3. 3 recommendations for product additions (in English)
4. Same 3 recommendations in Estonian

Return JSON with: trendingGenres (array), popularPlatforms (array), recommendations (array), recommendationsEt (array)`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      trendingGenres: analysis.trendingGenres || ['Action-Adventure', 'RPG', 'Sports'],
      popularPlatforms: analysis.popularPlatforms || ['PlayStation 5', 'Nintendo Switch', 'Xbox Series X'],
      recommendations: analysis.recommendations || [
        'Add more indie games for variety',
        'Stock new releases promptly',
        'Include collector editions',
      ],
      recommendationsEt: analysis.recommendationsEt || [
        'Lisa rohkem indie mänge mitmekesisuse jaoks',
        'Hoia uusi väljalaskeid kiirelt laos',
        'Kaasa kogujaversioonid',
      ],
    };
  } catch (error) {
    console.error('Demand analysis error:', error);
    return {
      trendingGenres: ['Action-Adventure', 'RPG', 'Sports'],
      popularPlatforms: ['PlayStation 5', 'Nintendo Switch', 'Xbox Series X'],
      recommendations: [
        'Add more indie games for variety / Lisa rohkem indie mänge mitmekesisuse jaoks',
        'Stock new releases promptly / Hoia uusi väljalaskeid kiirelt laos',
        'Include collector editions / Kaasa kogujaversioonid',
      ],
      recommendationsEt: [
        'Lisa rohkem indie mänge mitmekesisuse jaoks',
        'Hoia uusi väljalaskeid kiirelt laos',
        'Kaasa kogujaversioonid',
      ],
    };
  }
}

function calculateGamePrice(game: RawgGame, settings: AutoProductSettings): number {
  let basePrice = 59.99;
  
  const releaseYear = game.released ? parseInt(game.released.split('-')[0]) : 2023;
  const currentYear = new Date().getFullYear();
  const age = currentYear - releaseYear;
  
  if (age === 0) {
    basePrice = 69.99;
  } else if (age === 1) {
    basePrice = 59.99;
  } else if (age === 2) {
    basePrice = 49.99;
  } else if (age >= 3) {
    basePrice = 39.99 - (age - 3) * 5;
  }
  
  if (game.metacritic && game.metacritic >= 90) {
    basePrice *= 1.1;
  }
  
  basePrice = Math.max(settings.priceRangeMin, Math.min(settings.priceRangeMax, basePrice));
  
  return Math.round(basePrice * 100) / 100;
}

function getHighResolutionImage(game: RawgGame): string {
  if (game.background_image) {
    return game.background_image
      .replace('/media/games/', '/media/resize/1280/-/games/')
      .replace('/media/screenshots/', '/media/resize/1280/-/screenshots/');
  }
  return '/placeholder-game.png';
}

function generateSKU(game: RawgGame, platform: string): string {
  const platformPrefix: Record<string, string> = {
    playstation: 'PS5',
    xbox: 'XBX',
    nintendo: 'NSW',
    pc: 'PCG',
  };
  
  const prefix = platformPrefix[platform] || 'GAM';
  const slug = game.slug.replace(/-/g, '').substring(0, 8).toUpperCase();
  const id = game.id.toString().padStart(5, '0');
  
  return `${prefix}-${slug}-${id}`;
}

function generateMetaKeywords(game: RawgGame): string {
  const keywords: string[] = [game.name];
  
  if (game.genres) {
    keywords.push(...game.genres.map(g => g.name));
  }
  
  if (game.platforms) {
    keywords.push(...game.platforms.map(p => p.platform.name).slice(0, 3));
  }
  
  keywords.push('gaming', 'video game', 'EstZone');
  
  return keywords.join(', ');
}

export function getDefaultSettings(): AutoProductSettings {
  return {
    enabled: false,
    intervalDays: 3,
    maxProductsPerRun: 5,
    platforms: ['playstation', 'xbox', 'nintendo'],
    priceRangeMin: 19.99,
    priceRangeMax: 79.99,
  };
}

let autoProductInterval: NodeJS.Timeout | null = null;

export function startAutoProductScheduler(settings: AutoProductSettings): void {
  if (autoProductInterval) {
    clearInterval(autoProductInterval);
  }

  if (!settings.enabled) {
    console.log('[AI-PRODUCTS] Auto product addition disabled');
    return;
  }

  const intervalMs = settings.intervalDays * 24 * 60 * 60 * 1000;
  
  console.log(`[AI-PRODUCTS] Scheduler started - running every ${settings.intervalDays} days`);
  
  autoProductInterval = setInterval(async () => {
    console.log('[AI-PRODUCTS] Running scheduled product addition...');
    await analyzeDemandAndAddProducts(settings);
  }, intervalMs);
}

export function stopAutoProductScheduler(): void {
  if (autoProductInterval) {
    clearInterval(autoProductInterval);
    autoProductInterval = null;
    console.log('[AI-PRODUCTS] Scheduler stopped');
  }
}
