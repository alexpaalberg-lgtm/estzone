import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

function detectProductType(name: string): string {
  const n = name.toLowerCase();
  
  // Check for VR charging accessories FIRST (most specific)
  if ((n.includes('charging') || n.includes('dock') || n.includes('station') || n.includes('charger')) && 
      (n.includes('psvr') || n.includes('quest') || n.includes('vr'))) {
    return 'vr_accessory';
  }
  
  // Check for headset ACCESSORIES (before generic headset check)
  if (n.includes('headset stand') || n.includes('headphone stand')) {
    return 'headset_stand';
  }
  
  // Check for specific headsets/earbuds (before checking for "ps5" or "playstation")
  if (n.includes('pulse elite') || n.includes('pulse 3d') || n.includes('pulse wireless')) {
    return 'playstation_headset';
  }
  if (n.includes('earbuds') || n.includes('earbud') || n.includes('in-ear')) {
    return 'earbuds';
  }
  if (n.includes('inzone')) {
    return 'inzone_headset';
  }
  if (n.includes('arctis') || (n.includes('steelseries') && n.includes('headset'))) {
    return 'steelseries_headset';
  }
  // Generic headset check - only after specific accessories/headsets
  if (n.includes('headset') || n.includes('headphone')) {
    return 'gaming_headset';
  }
  
  // Check for controller charging accessories (after VR charging)
  if (n.includes('charging') || n.includes('dock') || n.includes('station') || n.includes('charger')) {
    if (n.includes('dualsense') || n.includes('playstation') || n.includes('ps5') || n.includes('ps4') || n.includes('dualshock')) {
      return 'dualsense_charging_station';
    }
    if (n.includes('xbox')) {
      return 'battery_pack'; // Xbox charging kit
    }
  }
  
  // Controllers - check specific colors
  if (n.includes('dualsense')) {
    if (n.includes('red') || n.includes('cosmic red')) return 'dualsense_red';
    if (n.includes('black') || n.includes('midnight black')) return 'dualsense_black';
    return 'dualsense_white';
  }
  
  if (n.includes('dualshock')) {
    return 'dualsense_white'; // Use DualSense image for PS4 controller (similar design)
  }
  
  if (n.includes('xbox') && (n.includes('controller') || n.includes('gamepad'))) {
    if (n.includes('elite')) return 'xbox_elite_controller';
    if (n.includes('red') || n.includes('pulse red')) return 'xbox_red_controller';
    if (n.includes('blue') || n.includes('shock blue')) return 'xbox_blue_controller';
    if (n.includes('yellow') || n.includes('electric volt')) return 'xbox_yellow_controller';
    return 'xbox_black_controller';
  }
  
  if (n.includes('joy-con') || n.includes('joycon')) {
    return 'joycon_controllers';
  }
  if (n.includes('pro controller') && n.includes('nintendo')) {
    return 'nintendo_pro_controller';
  }
  
  // VR Controllers
  if (n.includes('psvr') && (n.includes('controller') || n.includes('sense controller'))) {
    return 'psvr2_controllers';
  }
  
  // Consoles - check AFTER controllers/accessories
  if (n.includes('playstation 5') || n.includes('ps5')) {
    if (n.includes('digital')) return 'ps5_digital';
    return 'ps5_console';
  }
  if (n.includes('xbox series x')) return 'xbox_series_x';
  if (n.includes('xbox series s')) return 'xbox_series_s';
  if (n.includes('nintendo switch')) return 'nintendo_switch';
  if (n.includes('steam deck')) return 'steam_deck';
  
  // VR Accessories - CHECK BEFORE VR headsets! (works with or without "vr" keyword)
  if (n.includes('lens protector') || n.includes('lens protection')) return 'vr_lens_protector';
  if (n.includes('face cover') || n.includes('silicone cover') || n.includes('facial interface')) return 'vr_accessory';
  // Quest/PSVR accessories (even without "vr" keyword)
  if ((n.includes('quest') || n.includes('psvr')) && (n.includes('strap') || n.includes('elite strap') || n.includes('head strap'))) return 'vr_accessory';
  if ((n.includes('quest') || n.includes('psvr')) && (n.includes('grip') || n.includes('controller grip'))) return 'vr_accessory';
  if ((n.includes('quest') || n.includes('psvr')) && (n.includes('cable') || n.includes('link cable'))) return 'cable';
  if ((n.includes('quest') || n.includes('psvr')) && (n.includes('case') || n.includes('carrying case'))) return 'controller_case';
  // Generic VR accessories (with "vr" keyword)
  if (n.includes('vr') && (n.includes('strap') || n.includes('head strap') || n.includes('elite strap'))) return 'vr_accessory';
  if (n.includes('vr') && (n.includes('cable') || n.includes('link cable'))) return 'cable';
  if (n.includes('vr') && (n.includes('grip') || n.includes('controller grip'))) return 'vr_accessory';
  if (n.includes('vr') && (n.includes('case') || n.includes('carrying case'))) return 'controller_case';
  
  // VR Headsets - NOW check for headsets
  if (n.includes('meta quest 3') || n.includes('quest 3')) return 'meta_quest_3';
  if (n.includes('meta quest 2') || n.includes('quest 2')) return 'meta_quest_2';
  if (n.includes('playstation vr') || n.includes('psvr2')) return 'psvr2_headset';
  if (n.includes('valve index')) return 'valve_index';
  if (n.includes('htc vive')) return 'htc_vive';
  if (n.includes('vr headset') || n.includes('virtual reality headset')) return 'generic_vr';
  
  // Other Accessories
  if (n.includes('charging') && n.includes('cable')) return 'usb_cable';
  if (n.includes('hdmi')) return 'hdmi_cable';
  if (n.includes('stand') && n.includes('ps5')) return 'ps5_stand';
  if (n.includes('case') || n.includes('cover')) {
    if (n.includes('controller')) return 'controller_case';
    return 'protective_case';
  }
  if (n.includes('battery') || n.includes('rechargeable')) return 'battery_pack';
  if (n.includes('thumb grip') || n.includes('thumbstick')) return 'thumb_grips';
  if (n.includes('cable') || n.includes('charger')) return 'cable';
  if (n.includes('kishi') || n.includes('razer')) return 'razer_kishi';
  
  // Games
  if (n.includes('simulator') || n.includes('horizon') || n.includes('spider') ||
      n.includes('halo') || n.includes('mario') || n.includes('zelda') ||
      n.includes('god of war') || n.includes('gran turismo') || n.includes('call of duty') ||
      n.includes('fifa') || n.includes('forza') || n.includes('uncharted') ||
      n.includes('ghost') || n.includes('last of us') || n.includes('assassin') ||
      n.includes('resident evil') || n.includes('final fantasy') || n.includes('pokemon') ||
      n.includes('kena') || n.includes('ratchet') || n.includes('returnal') ||
      n.includes('deathloop') || n.includes('demon') || n.includes('baldur') ||
      n.includes('elden ring') || n.includes('control') || n.includes('game')) {
    return 'game';
  }
  
  return 'default';
}

function getImageForType(type: string): string {
  const imageMap: Record<string, string> = {
    // Headsets
    'playstation_headset': '/generated_images/PlayStation_Pulse_Elite_headset_95773763.png',
    'inzone_headset': '/generated_images/Sony_INZONE_H9_headset_71430daf.png',
    'steelseries_headset': '/generated_images/SteelSeries_Arctis_Nova_Pro_bc771c5b.png',
    'earbuds': '/generated_images/Gaming_earbuds_wireless_772ea2be.png',
    'gaming_headset': '/generated_images/Gaming_headset_with_microphone_166465ab.png',
    
    // DualSense Controllers
    'dualsense_charging_station': '/generated_images/DualSense_charging_station_96f0458a.png',
    'dualsense_red': '/generated_images/DualSense_controller_red_d471a021.png',
    'dualsense_black': '/generated_images/DualSense_controller_black_aac10d34.png',
    'dualsense_white': '/generated_images/DualSense_PS5_controller_white_3a438492.png',
    'dualshock_controller': '/generated_images/Xbox_wireless_controller_black_a8d34e27.png',
    
    // Xbox Controllers
    'xbox_elite_controller': '/generated_images/Xbox_Elite_Controller_Series_2_9b2bb236.png',
    'xbox_red_controller': '/generated_images/Xbox_controller_red_82099130.png',
    'xbox_blue_controller': '/generated_images/Xbox_controller_blue_bfc54153.png',
    'xbox_yellow_controller': '/generated_images/Xbox_controller_yellow_1a011ecb.png',
    'xbox_black_controller': '/generated_images/Xbox_wireless_controller_black_a8d34e27.png',
    
    // Nintendo Controllers
    'joycon_controllers': '/generated_images/Nintendo_Joy-Con_red_blue_32ac7461.png',
    'nintendo_pro_controller': '/generated_images/Nintendo_Pro_Controller_black_6ce38fe0.png',
    
    // VR Controllers
    'psvr2_controllers': '/generated_images/PSVR2_Sense_controllers_c127ca74.png',
    
    // Consoles
    'ps5_console': '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png',
    'ps5_digital': '/generated_images/PS5_Digital_Edition_77ad1176.png',
    'xbox_series_x': '/generated_images/Xbox_Series_X_console_2537449f.png',
    'xbox_series_s': '/generated_images/Xbox_Series_S_white_86bfef60.png',
    'nintendo_switch': '/generated_images/Nintendo_Switch_OLED_console_c97915d8.png',
    'steam_deck': '/generated_images/Steam_Deck_console_1406776a.png',
    
    // VR Headsets
    'meta_quest_3': '/generated_images/Meta_Quest_3_VR_headset_3e6dde53.png',
    'meta_quest_2': '/generated_images/Meta_Quest_2_headset_7e7c166c.png',
    'psvr2_headset': '/generated_images/PlayStation_VR2_headset_3b005792.png',
    'valve_index': '/generated_images/Valve_Index_VR_headset_0d8dcd47.png',
    'htc_vive': '/generated_images/HTC_Vive_Pro_2_headset_bf275b6a.png',
    'generic_vr': '/generated_images/Meta_Quest_3_VR_headset_3e6dde53.png',
    
    // Accessories
    'vr_accessory': '/generated_images/PS5_protective_case_black_bdda1bb5.png',
    'vr_lens_protector': '/generated_images/VR_lens_protectors_e6fb2855.png',
    'usb_cable': '/generated_images/USB-C_cable_black_braided_2247bec7.png',
    'hdmi_cable': '/generated_images/HDMI_2.1_cable_64089b6d.png',
    'ps5_stand': '/generated_images/PS5_vertical_stand_3c29a0d1.png',
    'controller_case': '/generated_images/Controller_carrying_case_15de6f3b.png',
    'protective_case': '/generated_images/PS5_protective_case_black_bdda1bb5.png',
    'battery_pack': '/generated_images/Xbox_battery_pack_12c68888.png',
    'thumb_grips': '/generated_images/Controller_thumb_grips_cf5c2277.png',
    'headset_stand': '/generated_images/Gaming_headset_stand_RGB_306af9c3.png',
    'cable': '/generated_images/USB-C_charging_cable_f4de5338.png',
    'razer_kishi': '/generated_images/Razer_Kishi_V2_controller_c1e32d46.png',
    
    // Games
    'game': '/generated_images/Generic_PS5_game_box_placeholder_60d2d305.png',
    
    // Default
    'default': '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png'
  };
  
  return imageMap[type] || imageMap['default'];
}

async function fixAllProductImages() {
  try {
    console.log('🔧 Starting comprehensive product image fix...');

    const allProducts = await db.select().from(products);
    console.log(`📦 Found ${allProducts.length} products`);

    let updated = 0;
    const examples: Array<{ name: string; type: string; image: string }> = [];

    for (const product of allProducts) {
      const productType = detectProductType(product.nameEn);
      const imageUrl = getImageForType(productType);

      await db.update(products)
        .set({ images: [imageUrl] })
        .where(eq(products.id, product.id));

      updated++;
      
      // Collect examples
      if (examples.length < 20) {
        examples.push({
          name: product.nameEn,
          type: productType,
          image: imageUrl.split('/').pop()!
        });
      }

      if (updated % 50 === 0) {
        console.log(`  ⏳ Updated ${updated}/${allProducts.length} products...`);
      }
    }

    console.log('\n📋 Sample mappings:');
    examples.forEach(ex => {
      console.log(`  "${ex.name}"`);
      console.log(`    → Type: ${ex.type}`);
      console.log(`    → Image: ${ex.image}\n`);
    });

    console.log(`✅ Successfully fixed ${updated} products with correct images!`);
  } catch (error) {
    console.error('❌ Error fixing product images:', error);
    throw error;
  }
}

fixAllProductImages();
