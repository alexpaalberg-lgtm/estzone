import { db } from '../db';
import { products } from '@shared/schema';
import { eq, and, like, sql, or } from 'drizzle-orm';

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
      .replace(/\s*-\s*Switch\s*2?$/i, '')
      .replace(/\s*PS5$/i, '')
      .replace(/\s*Xbox$/i, '')
      .replace(/\s*Edition$/i, '')
      .replace(/\s*Remake$/i, '')
      .trim();

    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(cleanQuery)}&page_size=1`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return null;
  }
}

async function updateGameImages() {
  console.log('Starting game image update...');

  const gameCategoryIds = [
    '9100e967-8a60-4f64-843b-a31d3dc2f3c1',
    '8a311dcd-0c58-4e2f-b40d-0d6b7a4e105e',
    '7924b9aa-b874-4493-83f8-fb876881707c'
  ];

  const gamesWithWrongImages = await db
    .select({
      id: products.id,
      nameEn: products.nameEn,
      images: products.images
    })
    .from(products)
    .where(
      and(
        or(
          eq(products.categoryId, gameCategoryIds[0]),
          eq(products.categoryId, gameCategoryIds[1]),
          eq(products.categoryId, gameCategoryIds[2])
        ),
        like(sql`${products.images}[1]`, '/generated_images/%')
      )
    )
    .limit(100);

  console.log(`Found ${gamesWithWrongImages.length} games with wrong images`);

  let updated = 0;
  for (const game of gamesWithWrongImages) {
    const rawgGame = await searchGame(game.nameEn);
    
    if (rawgGame?.background_image) {
      const currentImage = game.images?.[0] || '';
      const newImages = [rawgGame.background_image];
      
      if (currentImage && 
          !currentImage.includes('Xbox_Series_X') && 
          !currentImage.includes('PlayStation_5') &&
          !currentImage.includes('Nintendo_Switch') &&
          !currentImage.includes('gaming_headset')) {
        newImages.push(currentImage);
      }

      await db
        .update(products)
        .set({ images: newImages })
        .where(eq(products.id, game.id));

      console.log(`Updated: ${game.nameEn} -> ${rawgGame.background_image.substring(0, 60)}...`);
      updated++;
    } else {
      console.log(`No image found for: ${game.nameEn}`);
    }

    await new Promise(resolve => setTimeout(resolve, 250));
  }

  console.log(`\nUpdated ${updated} game images`);
}

updateGameImages().catch(console.error);
