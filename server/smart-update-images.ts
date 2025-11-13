import { db } from "./db";
import { products } from "@shared/schema";
import { eq } from "drizzle-orm";

function getProductImage(productName: string): string {
  const name = productName.toLowerCase();

  // DualSense Charging Station - CHECK THIS FIRST before controllers
  if (name.includes('dualsense') && (name.includes('charging') || name.includes('station') || name.includes('dock'))) {
    return '/generated_images/DualSense_charging_station_96f0458a.png';
  }

  // DualSense Controllers - check color
  if (name.includes('dualsense')) {
    if (name.includes('red') || name.includes('cosmic red')) {
      return '/generated_images/DualSense_controller_red_d471a021.png';
    } else if (name.includes('black') || name.includes('midnight black')) {
      return '/generated_images/DualSense_controller_black_aac10d34.png';
    } else {
      return '/generated_images/DualSense_PS5_controller_white_3a438492.png';
    }
  }

  // DualShock 4 (PS4 controller) - different from DualSense
  if (name.includes('dualshock')) {
    return '/generated_images/Xbox_wireless_controller_black_a8d34e27.png'; // placeholder until we generate PS4 controller
  }

  // Xbox Controllers - check color
  if (name.includes('xbox') && (name.includes('controller') || name.includes('gamepad'))) {
    if (name.includes('elite')) {
      return '/generated_images/Xbox_Elite_Controller_Series_2_9b2bb236.png';
    } else if (name.includes('red') || name.includes('pulse red')) {
      return '/generated_images/Xbox_controller_red_82099130.png';
    } else if (name.includes('blue') || name.includes('shock blue')) {
      return '/generated_images/Xbox_controller_blue_bfc54153.png';
    } else if (name.includes('yellow') || name.includes('electric volt')) {
      return '/generated_images/Xbox_controller_yellow_1a011ecb.png';
    } else {
      return '/generated_images/Xbox_wireless_controller_black_a8d34e27.png';
    }
  }

  // Nintendo Controllers
  if (name.includes('joy-con') || name.includes('joycon')) {
    return '/generated_images/Nintendo_Joy-Con_red_blue_32ac7461.png';
  }
  if (name.includes('pro controller') && name.includes('nintendo')) {
    return '/generated_images/Nintendo_Pro_Controller_black_6ce38fe0.png';
  }

  // PlayStation Headsets
  if (name.includes('pulse elite') || name.includes('pulse 3d elite')) {
    return '/generated_images/PlayStation_Pulse_Elite_headset_95773763.png';
  }
  if (name.includes('inzone')) {
    return '/generated_images/Sony_INZONE_H9_headset_71430daf.png';
  }

  // Gaming Headsets
  if (name.includes('arctis') || name.includes('steelseries')) {
    return '/generated_images/SteelSeries_Arctis_Nova_Pro_bc771c5b.png';
  }
  if (name.includes('earbuds') || name.includes('earbud')) {
    return '/generated_images/Gaming_earbuds_wireless_772ea2be.png';
  }
  if (name.includes('headset') || name.includes('headphone')) {
    return '/generated_images/Gaming_headset_with_microphone_166465ab.png';
  }

  // PlayStation Consoles
  if (name.includes('playstation 5') || name.includes('ps5')) {
    if (name.includes('digital')) {
      return '/generated_images/PS5_Digital_Edition_77ad1176.png';
    }
    // If it's not a controller/accessory, it's the console
    if (!name.includes('controller') && !name.includes('headset') && !name.includes('cable') && !name.includes('case') && !name.includes('stand') && !name.includes('game')) {
      return '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png';
    }
  }

  // Xbox Consoles
  if (name.includes('xbox series x') && !name.includes('controller')) {
    return '/generated_images/Xbox_Series_X_console_2537449f.png';
  }
  if (name.includes('xbox series s')) {
    return '/generated_images/Xbox_Series_S_white_86bfef60.png';
  }

  // Nintendo Consoles
  if (name.includes('nintendo switch') && !name.includes('controller') && !name.includes('joy-con')) {
    return '/generated_images/Nintendo_Switch_OLED_console_c97915d8.png';
  }

  // Steam Deck
  if (name.includes('steam deck')) {
    return '/generated_images/Steam_Deck_console_1406776a.png';
  }

  // VR Headsets
  if (name.includes('meta quest 3') || name.includes('quest 3')) {
    return '/generated_images/Meta_Quest_3_VR_headset_3e6dde53.png';
  }
  if (name.includes('meta quest 2') || name.includes('quest 2')) {
    return '/generated_images/Meta_Quest_2_headset_7e7c166c.png';
  }
  if (name.includes('playstation vr') || name.includes('psvr')) {
    if (name.includes('controller') || name.includes('sense controller')) {
      return '/generated_images/PSVR2_Sense_controllers_c127ca74.png';
    }
    return '/generated_images/PlayStation_VR2_headset_3b005792.png';
  }
  if (name.includes('valve index')) {
    return '/generated_images/Valve_Index_VR_headset_0d8dcd47.png';
  }
  if (name.includes('htc vive')) {
    return '/generated_images/HTC_Vive_Pro_2_headset_bf275b6a.png';
  }
  if (name.includes('vr') || name.includes('virtual reality')) {
    return '/generated_images/Meta_Quest_3_VR_headset_3e6dde53.png';
  }

  // Accessories
  if (name.includes('charging') && (name.includes('cable') || name.includes('usb'))) {
    return '/generated_images/USB-C_cable_black_braided_2247bec7.png';
  }
  if (name.includes('hdmi')) {
    return '/generated_images/HDMI_2.1_cable_64089b6d.png';
  }
  if (name.includes('stand') && name.includes('ps5')) {
    return '/generated_images/PS5_vertical_stand_3c29a0d1.png';
  }
  if (name.includes('case') || name.includes('cover')) {
    if (name.includes('controller')) {
      return '/generated_images/Controller_carrying_case_15de6f3b.png';
    }
    return '/generated_images/PS5_protective_case_black_bdda1bb5.png';
  }
  if (name.includes('battery') || name.includes('rechargeable pack')) {
    return '/generated_images/Xbox_battery_pack_12c68888.png';
  }
  if (name.includes('thumb grip') || name.includes('thumbstick')) {
    return '/generated_images/Controller_thumb_grips_cf5c2277.png';
  }
  if (name.includes('lens protector')) {
    return '/generated_images/VR_lens_protectors_e6fb2855.png';
  }
  if (name.includes('headset stand') || name.includes('headphone stand')) {
    return '/generated_images/Gaming_headset_stand_RGB_306af9c3.png';
  }
  if (name.includes('cable') || name.includes('charger') || name.includes('adapter')) {
    return '/generated_images/USB-C_charging_cable_f4de5338.png';
  }

  // Razer/Mobile controllers
  if (name.includes('kishi') || name.includes('razer')) {
    return '/generated_images/Razer_Kishi_V2_controller_c1e32d46.png';
  }

  // Games - generic placeholder
  if (name.includes('game') || name.includes('simulator') || name.includes('horizon') || 
      name.includes('spider') || name.includes('halo') || name.includes('mario') || 
      name.includes('zelda') || name.includes('god of war') || name.includes('gran turismo') ||
      name.includes('call of duty') || name.includes('fifa') || name.includes('forza') ||
      name.includes('uncharted') || name.includes('ghost') || name.includes('last of us') ||
      name.includes('assassin') || name.includes('resident evil') || name.includes('final fantasy') ||
      name.includes('pokemon') || name.includes('kena') || name.includes('ratchet') ||
      name.includes('returnal') || name.includes('deathloop') || name.includes('demon')) {
    return '/generated_images/Generic_PS5_game_box_placeholder_60d2d305.png';
  }

  // Default fallback
  return '/generated_images/PlayStation_5_console_white_background_6a8c2a63.png';
}

async function updateProductImagesIntelligently() {
  try {
    console.log('Starting intelligent product image update...');

    const allProducts = await db.select().from(products);
    console.log(`Found ${allProducts.length} products`);

    let updated = 0;

    for (const product of allProducts) {
      const imageUrl = getProductImage(product.nameEn);

      await db.update(products)
        .set({ images: [imageUrl] })
        .where(eq(products.id, product.id));

      updated++;
      if (updated % 50 === 0) {
        console.log(`Updated ${updated}/${allProducts.length} products...`);
      }

      // Log some examples
      if (updated <= 10) {
        console.log(`  "${product.nameEn}" → ${imageUrl.split('/').pop()}`);
      }
    }

    console.log(`✅ Successfully updated ${updated} products with matched images`);
  } catch (error) {
    console.error('❌ Error updating product images:', error);
    throw error;
  }
}

updateProductImagesIntelligently();
