import { db } from "../db";
import { products, categories } from "@shared/schema";
import { eq } from "drizzle-orm";

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

interface RawgGame {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  released: string;
  rating: number;
  metacritic: number | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string; slug: string } }[];
}

interface RawgSearchResult {
  count: number;
  next: string | null;
  results: RawgGame[];
}

async function fetchGames(platformId: number, page: number = 1, pageSize: number = 40): Promise<RawgGame[]> {
  try {
    const url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&platforms=${platformId}&ordering=-rating,-released&page=${page}&page_size=${pageSize}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data: RawgSearchResult = await response.json();
    return data.results;
  } catch (error) {
    console.error(`Error fetching games for platform ${platformId}:`, error);
    return [];
  }
}

function generateDescription(game: RawgGame, lang: 'en' | 'et'): string {
  const genres = game.genres?.map(g => g.name).join(', ') || 'Action';
  const rating = game.rating ? `${game.rating.toFixed(1)}/5` : '';
  const metacritic = game.metacritic ? `Metacritic: ${game.metacritic}` : '';
  const released = game.released ? new Date(game.released).getFullYear() : '';
  
  if (lang === 'en') {
    return `${game.name} is an exciting ${genres.toLowerCase()} game${released ? ` released in ${released}` : ''}. ${rating ? `Rated ${rating} by players.` : ''} ${metacritic}. Experience incredible gameplay and immersive storytelling.`.trim();
  } else {
    return `${game.name} on põnev ${genres.toLowerCase()} mäng${released ? `, välja antud ${released}` : ''}. ${rating ? `Mängijate hinnang ${rating}.` : ''} ${metacritic}. Koge uskumatut mängukogemust ja kaasahaaravat lugu.`.trim();
  }
}

function generatePrice(game: RawgGame): { price: number; salePrice?: number } {
  const released = game.released ? new Date(game.released) : null;
  const now = new Date();
  const ageInMonths = released ? (now.getTime() - released.getTime()) / (1000 * 60 * 60 * 24 * 30) : 24;
  
  let basePrice: number;
  
  if (ageInMonths < 3) {
    basePrice = 69.99;
  } else if (ageInMonths < 12) {
    basePrice = 59.99;
  } else if (ageInMonths < 24) {
    basePrice = 49.99;
  } else if (ageInMonths < 48) {
    basePrice = 39.99;
  } else {
    basePrice = 29.99;
  }
  
  const hasSale = Math.random() > 0.6;
  if (hasSale && ageInMonths > 6) {
    const discounts = [0.15, 0.20, 0.25, 0.30, 0.40, 0.50];
    const discount = discounts[Math.floor(Math.random() * discounts.length)];
    const salePrice = Math.round((basePrice * (1 - discount)) * 100) / 100;
    return { price: basePrice, salePrice };
  }
  
  return { price: basePrice };
}

async function getCategoryId(slug: string): Promise<string | null> {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
  return category?.id || null;
}

async function addGamesForPlatform(
  platformId: number,
  platformName: string,
  categorySlug: string,
  skuPrefix: string,
  targetCount: number
): Promise<number> {
  console.log(`\n📦 Fetching ${platformName} games...`);
  
  const categoryId = await getCategoryId(categorySlug);
  if (!categoryId) {
    console.log(`  ❌ Category not found: ${categorySlug}`);
    return 0;
  }
  
  let addedCount = 0;
  let page = 1;
  const maxPages = Math.ceil(targetCount / 40) + 2;
  
  while (addedCount < targetCount && page <= maxPages) {
    console.log(`  Fetching page ${page}...`);
    const games = await fetchGames(platformId, page, 40);
    
    if (games.length === 0) {
      console.log(`  No more games found.`);
      break;
    }
    
    for (const game of games) {
      if (addedCount >= targetCount) break;
      
      try {
        const sku = `${skuPrefix}-${game.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)}-${game.id}`;
        
        const existing = await db.select().from(products).where(eq(products.sku, sku));
        if (existing.length > 0) {
          continue;
        }
        
        if (!game.background_image) {
          continue;
        }
        
        const { price, salePrice } = generatePrice(game);
        const descriptionEn = generateDescription(game, 'en');
        const descriptionEt = generateDescription(game, 'et');
        
        const genres = game.genres?.map(g => g.name).join(', ') || '';
        const metaKeywords = `${game.name}, ${genres}, ${platformName}, gaming, video game`;
        
        const released = game.released ? new Date(game.released) : null;
        const isNewGame = released && (new Date().getTime() - released.getTime()) < (180 * 24 * 60 * 60 * 1000);
        
        const product = {
          categoryId,
          nameEn: game.name,
          nameEt: game.name,
          descriptionEn,
          descriptionEt,
          price: price.toString(),
          salePrice: salePrice ? salePrice.toString() : undefined,
          sku,
          stock: Math.floor(Math.random() * 80) + 5,
          images: [game.background_image],
          isNew: isNewGame || false,
          isFeatured: game.rating >= 4.3 && Math.random() > 0.5,
          isActive: true,
          metaKeywords,
        };
        
        await db.insert(products).values(product as any);
        addedCount++;
        
        if (addedCount % 20 === 0) {
          console.log(`  ✅ Added ${addedCount}/${targetCount} ${platformName} games...`);
        }
        
      } catch (error: any) {
        // Skip duplicates silently
      }
    }
    
    page++;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  console.log(`  ✅ Total ${platformName} games added: ${addedCount}`);
  return addedCount;
}

async function addAllGames() {
  console.log("🎮 Starting to add 300 console games from RAWG API...\n");
  console.log("Platforms: PlayStation 5, Xbox Series X, Nintendo Switch");
  console.log("========================================\n");
  
  const platforms = [
    { id: 187, name: "PlayStation 5", slug: "playstation-games", prefix: "PS5", target: 100 },
    { id: 186, name: "Xbox Series X", slug: "xbox-games", prefix: "XBX", target: 100 },
    { id: 7, name: "Nintendo Switch", slug: "nintendo-games", prefix: "NSW", target: 100 },
  ];
  
  let totalAdded = 0;
  
  for (const platform of platforms) {
    const added = await addGamesForPlatform(
      platform.id,
      platform.name,
      platform.slug,
      platform.prefix,
      platform.target
    );
    totalAdded += added;
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log("\n========================================");
  console.log(`🎉 COMPLETED! Total games added: ${totalAdded}`);
  console.log("========================================\n");
  
  const stats = await db.select().from(products).where(eq(products.sku, products.sku));
  console.log(`📊 Total products in database: ${stats.length}`);
}

addAllGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
