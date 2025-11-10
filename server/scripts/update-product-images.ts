import { db } from '../db';
import { products, categories } from '@shared/schema';
import { sql, inArray, isNull } from 'drizzle-orm';

/**
 * Bulk update product images based on category
 * Adds category-specific placeholder images to products with < 2 images
 */

// Category name to placeholder image mapping
const categoryPlaceholders: Record<string, string[]> = {
  // Consoles
  'PlayStation Consoles': ['/images/products/placeholder-console.png'],
  'Xbox Consoles': ['/images/products/placeholder-console.png'],
  'Nintendo Consoles': ['/images/products/placeholder-console.png'],
  'Retro Consoles': ['/images/products/placeholder-retro.png'],
  'Other Consoles': ['/images/products/placeholder-console.png'],
  
  // Controllers
  'PlayStation Controllers': ['/images/products/placeholder-controller.png'],
  'Xbox Controllers': ['/images/products/placeholder-controller.png'],
  'Nintendo Controllers': ['/images/products/placeholder-controller.png'],
  'Universal Controllers': ['/images/products/placeholder-controller.png'],
  
  // VR & AR
  'Meta Quest': ['/images/products/placeholder-vr.png'],
  'PlayStation VR': ['/images/products/placeholder-vr.png'],
  'PC VR Systems': ['/images/products/placeholder-vr.png'],
  
  // Headsets
  'Wireless Headsets': ['/images/products/placeholder-headset.png'],
  'Wired Headsets': ['/images/products/placeholder-headset.png'],
  'Earbuds': ['/images/products/placeholder-headset.png'],
  
  // Accessories
  'Cables & Adapters': ['/images/products/placeholder-accessory.png'],
  
  // Games
  'PlayStation Games': ['/images/products/placeholder-console.png'],
  'Xbox Games': ['/images/products/placeholder-console.png'],
  'Nintendo Games': ['/images/products/placeholder-console.png'],
};

async function updateProductImages() {
  try {
    console.log('Starting bulk product image update...\n');
    
    // Get all categories
    const allCategories = await db.select().from(categories);
    
    // Build category name to ID mapping
    const categoryNameToId: Record<string, string> = {};
    allCategories.forEach(cat => {
      categoryNameToId[cat.nameEn] = cat.id;
    });
    
    let totalUpdated = 0;
    
    // Process each category
    for (const [categoryName, placeholderImages] of Object.entries(categoryPlaceholders)) {
      const categoryId = categoryNameToId[categoryName];
      
      if (!categoryId) {
        console.log(`⚠️  Category "${categoryName}" not found, skipping...`);
        continue;
      }
      
      // Find products in this category with < 2 images
      const productsToUpdate = await db.query.products.findMany({
        where: (products, { eq, sql }) => eq(products.categoryId, categoryId),
        columns: {
          id: true,
          sku: true,
          nameEn: true,
          images: true,
        }
      });
      
      const needsUpdate = productsToUpdate.filter(p => 
        !p.images || p.images.length < 2
      );
      
      if (needsUpdate.length === 0) {
        console.log(`✓ Category "${categoryName}": No products need update`);
        continue;
      }
      
      // Batch update all products in this category
      for (const product of needsUpdate) {
        const currentImages = product.images || [];
        const newImages = [
          ...currentImages,
          ...placeholderImages.slice(0, 2 - currentImages.length)
        ];
        
        await db.update(products)
          .set({ images: newImages })
          .where(sql`id = ${product.id}`);
        
        totalUpdated++;
      }
      
      console.log(`✓ Category "${categoryName}": Updated ${needsUpdate.length} products`);
    }
    
    console.log(`\n🎉 Successfully updated ${totalUpdated} products!`);
    process.exit(0);
    
  } catch (error) {
    console.error('Error updating product images:', error);
    process.exit(1);
  }
}

// Run the script
updateProductImages();
