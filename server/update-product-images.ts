import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

const imageMapping: Record<string, string[]> = {
  'Consoles': [
    '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png',
    '/generated_images/Xbox_Series_X_console_2537449f.png',
    '/generated_images/Nintendo_Switch_OLED_console_c97915d8.png'
  ],
  'VR & AR Headsets': [
    '/generated_images/Meta_Quest_3_VR_headset_3e6dde53.png',
    '/generated_images/PlayStation_VR2_headset_3b005792.png'
  ],
  'Controllers & Gamepads': [
    '/generated_images/DualSense_PS5_controller_white_3a438492.png',
    '/generated_images/Xbox_wireless_controller_black_a8d34e27.png'
  ],
  'Gaming Headsets': [
    '/generated_images/Gaming_headset_with_microphone_166465ab.png'
  ],
  'Gaming Accessories': [
    '/generated_images/USB-C_charging_cable_f4de5338.png'
  ],
  'Games': [
    '/generated_images/Generic_PS5_game_box_placeholder_60d2d305.png'
  ]
};

async function updateProductImages() {
  try {
    console.log('Starting product image update...');

    const allProducts = await db.select().from(products);
    console.log(`Found ${allProducts.length} products`);

    let updated = 0;

    for (const product of allProducts) {
      let imageUrl = '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png';

      if (product.nameEn.toLowerCase().includes('playstation') || product.nameEn.toLowerCase().includes('ps5')) {
        imageUrl = '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png';
      } else if (product.nameEn.toLowerCase().includes('xbox')) {
        imageUrl = '/generated_images/Xbox_Series_X_console_2537449f.png';
      } else if (product.nameEn.toLowerCase().includes('nintendo') || product.nameEn.toLowerCase().includes('switch')) {
        imageUrl = '/generated_images/Nintendo_Switch_OLED_console_c97915d8.png';
      } else if (product.nameEn.toLowerCase().includes('quest') || product.nameEn.toLowerCase().includes('vr') || product.nameEn.toLowerCase().includes('valve index') || product.nameEn.toLowerCase().includes('vive')) {
        const vrImages = imageMapping['VR & AR Headsets'];
        imageUrl = vrImages[Math.floor(Math.random() * vrImages.length)];
      } else if (product.nameEn.toLowerCase().includes('controller') || product.nameEn.toLowerCase().includes('gamepad') || product.nameEn.toLowerCase().includes('dualsense') || product.nameEn.toLowerCase().includes('joy-con')) {
        const controllerImages = imageMapping['Controllers & Gamepads'];
        imageUrl = controllerImages[Math.floor(Math.random() * controllerImages.length)];
      } else if (product.nameEn.toLowerCase().includes('headset') || product.nameEn.toLowerCase().includes('headphone') || product.nameEn.toLowerCase().includes('earbuds')) {
        imageUrl = '/generated_images/Gaming_headset_with_microphone_166465ab.png';
      } else if (product.nameEn.toLowerCase().includes('cable') || product.nameEn.toLowerCase().includes('charger') || product.nameEn.toLowerCase().includes('adapter') || product.nameEn.toLowerCase().includes('stand') || product.nameEn.toLowerCase().includes('case') || product.nameEn.toLowerCase().includes('grip')) {
        imageUrl = '/generated_images/USB-C_charging_cable_f4de5338.png';
      } else if (product.nameEn.toLowerCase().includes('game') || product.nameEn.toLowerCase().includes('simulator') || product.nameEn.toLowerCase().includes('horizon') || product.nameEn.toLowerCase().includes('spider-man') || product.nameEn.toLowerCase().includes('halo') || product.nameEn.toLowerCase().includes('mario') || product.nameEn.toLowerCase().includes('zelda')) {
        imageUrl = '/generated_images/Generic_PS5_game_box_placeholder_60d2d305.png';
      }

      await db.update(products)
        .set({ images: [imageUrl] })
        .where(eq(products.id, product.id));

      updated++;
      if (updated % 50 === 0) {
        console.log(`Updated ${updated}/${allProducts.length} products...`);
      }
    }

    console.log(`✅ Successfully updated ${updated} products with AI-generated placeholder images`);
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    throw error;
  }
}

updateProductImages();
