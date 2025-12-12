import { db } from '../db';
import { products } from '@shared/schema';
import { eq, and, like, isNull, sql, or } from 'drizzle-orm';

const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

interface RawgGame {
  id: number;
  name: string;
  background_image: string | null;
}

async function searchGame(query: string): Promise<RawgGame | null> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG_API_KEY not configured');
    return null;
  }

  try {
    const cleanQuery = query
      .replace(/\s*\(Nintendo Switch\)\s*$/i, '')
      .replace(/\s*-\s*Switch\s*$/i, '')
      .replace(/\s*Switch$/i, '')
      .replace(/Nintendo Switch/i, '')
      .replace(/\s*PS5$/i, '')
      .replace(/\s*Xbox$/i, '')
      .replace(/\s*Edition$/i, '')
      .replace(/\s*Remake$/i, '')
      .replace(/[:\-–]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanQuery)}&page_size=3`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const exactMatch = data.results?.find((g: RawgGame) => 
      g.name.toLowerCase().includes(cleanQuery.toLowerCase().split(' ')[0]) && g.background_image
    );
    
    return exactMatch || data.results?.find((g: RawgGame) => g.background_image) || null;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return null;
  }
}

const NINTENDO_STOCK_IMAGES: Record<string, string> = {
  'switch-oled': 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800',
  'switch-lite': 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=800',
  'joy-con': 'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=800',
  'pro-controller': 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=800',
  'accessory': 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800',
  'merchandise': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'hoodie': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
  'figure': 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=800',
  'bag': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
  'book': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
};

function getStockImageForProduct(nameEn: string): string {
  const name = nameEn.toLowerCase();
  
  if (name.includes('oled')) return NINTENDO_STOCK_IMAGES['switch-oled'];
  if (name.includes('lite')) return NINTENDO_STOCK_IMAGES['switch-lite'];
  if (name.includes('joy-con') || name.includes('joycon')) return NINTENDO_STOCK_IMAGES['joy-con'];
  if (name.includes('pro controller')) return NINTENDO_STOCK_IMAGES['pro-controller'];
  if (name.includes('hoodie') || name.includes('pusa')) return NINTENDO_STOCK_IMAGES['hoodie'];
  if (name.includes('figure') || name.includes('amiibo')) return NINTENDO_STOCK_IMAGES['figure'];
  if (name.includes('bag') || name.includes('case') || name.includes('kott')) return NINTENDO_STOCK_IMAGES['bag'];
  if (name.includes('book') || name.includes('raamat')) return NINTENDO_STOCK_IMAGES['book'];
  if (name.includes('dock') || name.includes('charger') || name.includes('stand') || name.includes('sd')) return NINTENDO_STOCK_IMAGES['accessory'];
  
  return NINTENDO_STOCK_IMAGES['merchandise'];
}

async function updateGoeImages() {
  console.log('Starting GOE product image update...\n');

  const goeGames = await db
    .select({
      id: products.id,
      nameEn: products.nameEn,
      categoryId: products.categoryId,
      images: products.images
    })
    .from(products)
    .where(
      and(
        like(products.id, 'goe-%'),
        or(
          isNull(products.images),
          sql`${products.images} = '{}'`
        )
      )
    );

  console.log(`Found ${goeGames.length} GOE products without images\n`);

  const gameCategoryId = '1cc34181-4255-49c5-9c4e-566631125b89';
  
  let gamesUpdated = 0;
  let hardwareUpdated = 0;
  let failed = 0;

  for (const product of goeGames) {
    if (product.categoryId === gameCategoryId) {
      const rawgGame = await searchGame(product.nameEn);
      
      if (rawgGame?.background_image) {
        await db
          .update(products)
          .set({ images: [rawgGame.background_image] })
          .where(eq(products.id, product.id));

        console.log(`✓ Game: ${product.nameEn}`);
        gamesUpdated++;
      } else {
        console.log(`✗ No image found: ${product.nameEn}`);
        failed++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    } else {
      const stockImage = getStockImageForProduct(product.nameEn);
      
      await db
        .update(products)
        .set({ images: [stockImage] })
        .where(eq(products.id, product.id));

      console.log(`✓ Hardware/Merch: ${product.nameEn}`);
      hardwareUpdated++;
    }
  }

  console.log(`\n========== Summary ==========`);
  console.log(`Games updated with RAWG images: ${gamesUpdated}`);
  console.log(`Hardware/Merch with stock images: ${hardwareUpdated}`);
  console.log(`Failed to find images: ${failed}`);
  console.log(`Total: ${gamesUpdated + hardwareUpdated + failed}`);
}

updateGoeImages().catch(console.error);
