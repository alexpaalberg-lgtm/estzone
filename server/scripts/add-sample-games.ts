import { db } from "../db";
import { products, categories } from "@shared/schema";
import { eq } from "drizzle-orm";
import { searchGames, getGameDetails, generateGameDescription, getPlatformCategory } from "../services/rawg";

interface GameProduct {
  nameEn: string;
  nameEt: string;
  descriptionEn: string;
  descriptionEt: string;
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  images: string[];
  categorySlug: string;
  isNew: boolean;
  isFeatured: boolean;
  metaKeywords: string;
}

const popularGames = [
  { search: "Grand Theft Auto V", platform: "playstation", price: 29.99, salePrice: 19.99 },
  { search: "The Witcher 3 Wild Hunt", platform: "playstation", price: 39.99, salePrice: 24.99 },
  { search: "Red Dead Redemption 2", platform: "playstation", price: 59.99, salePrice: 39.99 },
  { search: "God of War Ragnarok", platform: "playstation", price: 69.99 },
  { search: "Spider-Man 2 PS5", platform: "playstation", price: 69.99 },
  { search: "Horizon Forbidden West", platform: "playstation", price: 69.99, salePrice: 49.99 },
  { search: "Elden Ring", platform: "playstation", price: 59.99 },
  { search: "The Legend of Zelda Tears of the Kingdom", platform: "nintendo", price: 59.99 },
  { search: "Super Mario Bros Wonder", platform: "nintendo", price: 59.99 },
  { search: "Mario Kart 8 Deluxe", platform: "nintendo", price: 59.99, salePrice: 49.99 },
  { search: "Animal Crossing New Horizons", platform: "nintendo", price: 59.99, salePrice: 44.99 },
  { search: "Pokemon Scarlet", platform: "nintendo", price: 59.99 },
  { search: "Halo Infinite", platform: "xbox", price: 59.99, salePrice: 39.99 },
  { search: "Forza Horizon 5", platform: "xbox", price: 59.99 },
  { search: "Starfield", platform: "xbox", price: 69.99 },
];

const categoryMapping: Record<string, string> = {
  playstation: "playstation-games",
  nintendo: "nintendo-games",
  xbox: "xbox-games",
};

async function getCategoryId(slug: string): Promise<string | null> {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
  return category?.id || null;
}

async function addSampleGames() {
  console.log("Starting to add sample games from RAWG API...\n");

  const addedGames: string[] = [];
  const failedGames: string[] = [];

  for (const gameConfig of popularGames) {
    try {
      console.log(`Searching for: ${gameConfig.search}`);
      
      const searchResults = await searchGames(gameConfig.search, 1);
      
      if (searchResults.length === 0) {
        console.log(`  ❌ No results found for "${gameConfig.search}"`);
        failedGames.push(gameConfig.search);
        continue;
      }

      const game = searchResults[0];
      console.log(`  Found: ${game.name} (ID: ${game.id})`);

      const categorySlug = categoryMapping[gameConfig.platform] || "playstation-games";
      const categoryId = await getCategoryId(categorySlug);

      if (!categoryId) {
        console.log(`  ❌ Category not found: ${categorySlug}`);
        failedGames.push(gameConfig.search);
        continue;
      }

      const sku = `GAME-${game.slug.toUpperCase().replace(/-/g, "").slice(0, 15)}-${gameConfig.platform.toUpperCase().slice(0, 2)}`;

      const existingProduct = await db.select().from(products).where(eq(products.sku, sku));
      if (existingProduct.length > 0) {
        console.log(`  ⚠️ Product already exists: ${sku}`);
        continue;
      }

      const gameDetails = await getGameDetails(game.id);
      const fullGame = gameDetails || game;

      const descriptionEn = generateGameDescription(fullGame, 'en');
      const descriptionEt = generateGameDescription(fullGame, 'et');

      const imageUrl = fullGame.background_image || '/generated_images/Generic_PS5_game_box_placeholder_60d2d305.png';

      const genres = fullGame.genres?.map(g => g.name).join(', ') || '';
      const metaKeywords = `${fullGame.name}, ${genres}, gaming, video game, ${gameConfig.platform}`;

      const product = {
        categoryId,
        nameEn: fullGame.name,
        nameEt: fullGame.name,
        descriptionEn,
        descriptionEt,
        price: gameConfig.price.toString(),
        salePrice: gameConfig.salePrice ? gameConfig.salePrice.toString() : undefined,
        sku,
        stock: Math.floor(Math.random() * 50) + 10,
        images: [imageUrl],
        isNew: Math.random() > 0.7,
        isFeatured: Math.random() > 0.6,
        isActive: true,
        metaKeywords,
      };

      await db.insert(products).values(product as any);
      console.log(`  ✅ Added: ${fullGame.name} (${gameConfig.price}€)`);
      addedGames.push(fullGame.name);

      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error: any) {
      console.log(`  ❌ Error adding ${gameConfig.search}: ${error.message}`);
      failedGames.push(gameConfig.search);
    }
  }

  console.log("\n========================================");
  console.log(`✅ Successfully added ${addedGames.length} games:`);
  addedGames.forEach(name => console.log(`   - ${name}`));
  
  if (failedGames.length > 0) {
    console.log(`\n❌ Failed to add ${failedGames.length} games:`);
    failedGames.forEach(name => console.log(`   - ${name}`));
  }
  console.log("========================================\n");
}

addSampleGames()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
