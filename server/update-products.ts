import { db } from './db';
import { products, categories } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Image mapping by category
const categoryImages: Record<string, string> = {
  'PlayStation Consoles': '/stock_images/playstation_5_consol_e3df6bbf.jpg',
  'Xbox Consoles': '/stock_images/xbox_series_x_consol_b6ad1d6a.jpg',
  'Nintendo Consoles': '/stock_images/nintendo_switch_cons_ce96ec42.jpg',
  'Consoles': '/stock_images/playstation_5_consol_b51080e6.jpg',
  'Retro & Other Consoles': '/stock_images/nintendo_switch_cons_8499cca2.jpg',
  'PlayStation Controllers': '/stock_images/gaming_controller_pr_9dc40508.jpg',
  'Xbox Controllers': '/stock_images/gaming_controller_pr_fb245052.jpg',
  'Nintendo Controllers': '/stock_images/gaming_controller_pr_26298898.jpg',
  'Universal Controllers': '/stock_images/gaming_controller_pr_ce77f9d2.jpg',
  'Controllers': '/stock_images/gaming_controller_pr_d4543739.jpg',
  'Wireless Headsets': '/stock_images/wireless_gaming_head_3bc6f077.jpg',
  'Wired Headsets': '/stock_images/wireless_gaming_head_805fbf66.jpg',
  'Gaming Earbuds': '/stock_images/wireless_gaming_head_42c853c7.jpg',
  'Headsets': '/stock_images/wireless_gaming_head_b893cbdf.jpg',
  'Meta Quest VR': '/stock_images/vr_headset_meta_ques_0c50c600.jpg',
  'PlayStation VR': '/stock_images/vr_headset_meta_ques_a67f7bf3.jpg',
  'PC VR Systems': '/stock_images/vr_headset_meta_ques_60077fb6.jpg',
  'VR & AR Headsets': '/stock_images/vr_headset_meta_ques_b75887fa.jpg',
  'Cables & Chargers': '/stock_images/usb-c_charging_cable_7403ab8b.jpg',
  'Cases & Protection': '/stock_images/usb-c_charging_cable_a06e10d6.jpg',
  'Stands & Mounts': '/stock_images/usb-c_charging_cable_abc1f1ec.jpg',
  'Accessories': '/stock_images/usb-c_charging_cable_e9f021a5.jpg',
  'PS5 Games': '/stock_images/video_game_box_cover_255da8d2.jpg',
  'Xbox Games': '/stock_images/video_game_box_cover_8a97b524.jpg',
  'Switch Games': '/stock_images/video_game_box_cover_1a4a057c.jpg',
  'Games': '/stock_images/video_game_box_cover_f33350e5.jpg',
};

// SEO-optimized description generator
function generateDescription(productName: string, categoryName: string): { en: string; et: string } {
  const baseDescriptionsEN: Record<string, string> = {
    'PlayStation Consoles': `Experience next-generation gaming with this premium PlayStation console. Features cutting-edge graphics, ultra-fast SSD storage, and exclusive games. Perfect for gamers seeking the ultimate entertainment system. Free shipping across Estonia and Europe.`,
    'Xbox Consoles': `Discover powerful gaming with this Xbox console featuring 4K gaming, Game Pass compatibility, and backwards compatibility. Includes premium controllers and advanced cooling. Ships fast via Omniva and DPD.`,
    'Nintendo Consoles': `Enjoy portable and home gaming with this Nintendo console. Perfect for family fun with exclusive titles. Features HD graphics, wireless Joy-Con controllers, and versatile play modes. Fast delivery to Estonia and Baltics.`,
    'Consoles': `Premium gaming console delivering stunning visuals and immersive gameplay. Compatible with the latest games and streaming apps. Includes warranty and fast shipping across Europe.`,
    'Retro & Other Consoles': `Relive classic gaming moments with this retro console. Features built-in games, HDMI output, and authentic controllers. Perfect for collectors and nostalgia enthusiasts. Ships worldwide.`,
    'PlayStation Controllers': `Professional DualSense wireless controller with haptic feedback and adaptive triggers. Enhanced precision, long battery life, and ergonomic design for marathon gaming sessions. Official PlayStation accessory.`,
    'Xbox Controllers': `Premium Xbox wireless controller featuring textured grip, Bluetooth connectivity, and customizable buttons. Compatible with Xbox consoles and Windows PC. Long-lasting battery and responsive controls.`,
    'Nintendo Controllers': `Authentic Nintendo controller with motion controls and HD rumble. Perfect for multiplayer gaming and single-player adventures. Wireless connectivity and rechargeable battery included.`,
    'Universal Controllers': `Versatile gaming controller compatible with PC, PlayStation, Xbox, and Switch. Features programmable buttons, adjustable triggers, and ergonomic design. Perfect for multi-platform gamers.`,
    'Controllers': `High-quality gaming controller with precision analog sticks and responsive buttons. Ergonomic grip for comfortable extended play. Compatible with multiple gaming platforms.`,
    'Wireless Headsets': `Premium wireless gaming headset with 7.1 surround sound, noise-canceling microphone, and 20+ hour battery. Crystal-clear audio, comfortable ear cushions, and RGB lighting. Perfect for competitive gaming.`,
    'Wired Headsets': `Professional wired gaming headset featuring studio-quality sound, detachable microphone, and memory foam padding. Zero latency audio, compatible with all platforms. Durable braided cable.`,
    'Gaming Earbuds': `Compact gaming earbuds with low-latency audio, inline microphone, and comfortable fit. Perfect for mobile gaming and travel. Premium sound quality in portable design.`,
    'Meta Quest VR': `Immersive Meta Quest VR headset with standalone functionality, 6DOF tracking, and wireless design. Access thousands of VR games and experiences. No PC required. Fast charging and premium comfort.`,
    'PlayStation VR': `Official PlayStation VR headset delivering breathtaking virtual reality experiences. Features 120Hz refresh rate, 3D audio, and exclusive VR games. Compatible with PS5 and PS4 consoles.`,
    'PC VR Systems': `Professional PC VR system with high-resolution displays, precise tracking, and room-scale VR. Compatible with SteamVR and Oculus Store. Premium comfort and adjustable optics.`,
    'Cables & Chargers': `Essential gaming accessory for fast charging and data transfer. Durable braided cable with reinforced connectors. Compatible with controllers, headsets, and gaming devices. 1-year warranty.`,
    'PS5 Games': `Exclusive PlayStation 5 game featuring stunning 4K graphics, ray tracing, and immersive gameplay. Experience next-gen gaming with fast loading times and DualSense controller support. Physical disc version.`,
    'Xbox Games': `Premium Xbox game optimized for Series X|S with enhanced graphics and performance. Supports Smart Delivery for best version on your console. Includes exclusive content and achievements.`,
    'Switch Games': `Popular Nintendo Switch game with portable and TV mode support. Family-friendly gameplay, local and online multiplayer. Physical cartridge with authentic Nintendo seal.`,
  };

  const baseDescriptionsET: Record<string, string> = {
    'PlayStation Consoles': `Koge järgmise põlvkonna mängimist selle premium PlayStation konsooliga. Sisaldab tipptasemel graafikat, ülikiire SSD-mälu ja eksklusiivsi mänge. Ideaalne mängijatele, kes otsivad parimat meelelahutustehnoloogiat. Tasuta kohaletoimetamine üle Eesti ja Euroopa.`,
    'Xbox Consoles': `Avasta võimas mängimine selle Xbox konsooliga, mis pakub 4K mängimist, Game Pass ühilduvust ja tagasiühilduvust. Sisaldab premium kontrollereid ja täiustatud jahutust. Kiire saatmine Omniva ja DPD kaudu.`,
    'Nintendo Consoles': `Naudi kaasaskantavat ja kodumängimist selle Nintendo konsooliga. Ideaalne perekonnalõbuks koos eksklusiivste mängudega. Sisaldab HD-graafikat, juhtmevabad Joy-Con kontrollereid ja mitmekülgseid mängurežiime. Kiire kohaletoimetamine Eestisse ja Baltimaadesse.`,
    'Consoles': `Premium mängukonsool, mis pakub vapustavat visuaali ja kaasakiskuvat mängukogemust. Ühilduv uusimate mängude ja voogedastusrakendustega. Sisaldab garantiid ja kiiret kohaletoimetamist üle Euroopa.`,
    'Retro & Other Consoles': `Naudi klassikalisi mängumõnusid selle retrokonsooliga. Sisaldab sisseehitatud mänge, HDMI väljundit ja autentseid kontrollereid. Ideaalne kollektsionääridele ja nostalgiahuvilistele. Saadame üle maailma.`,
    'PlayStation Controllers': `Professionaalne DualSense juhtmeta kontroller koos haptiilse tagasiside ja kohanduvate päästikutega. Täiustatud täpsus, pikk akukestus ja ergonoomiline disain pikaks mängimiseks. Ametlik PlayStation lisatarvik.`,
    'Xbox Controllers': `Premium Xbox juhtmeta kontroller koos tekstuurilise haardega, Bluetooth ühenduvusega ja kohandatavate nuppudega. Ühilduv Xbox konsoolidega ja Windows PC-ga. Pikaealine aku ja reageerivad juhtelemendid.`,
    'Nintendo Controllers': `Autentne Nintendo kontroller koos liikumisandurite ja HD-värinaga. Ideaalne mitme mängija jaoks ja üksiku mängija seiklusteks. Juhtmevaba ühendus ja taaslaetav aku kaasas.`,
    'Universal Controllers': `Mitmekülgne mängukontroller, mis ühildub PC, PlayStation, Xbox ja Switch'iga. Sisaldab programmeeritavaid nuppe, reguleeritavaid päästikuid ja ergonomilist disaini. Ideaalne mitme platvormi mängijatele.`,
    'Controllers': `Kvaliteetne mängukontroller täpsete analoogsete pulgade ja reageerivate nuppudega. Ergonoomiline haare mugavaks pikaks mängimiseks. Ühilduv mitmete mänguplatformidega.`,
    'Wireless Headsets': `Premium juhtmevabad mängukõrvaklapid koos 7.1 ruumilise heli, mürasummutava mikrofoni ja 20+ tunni akuga. Kristallselge heli, mugavad kõrvapadjandid ja RGB-valgustus. Ideaalne võistluslikuks mängimiseks.`,
    'Wired Headsets': `Professionaalsed juhtmega mängukõrvaklapid koos stuudiokvaliteediga heli, eemaldatava mikrofoni ja mäluvahtpolsterdusega. Null-latentsusega heli, ühilduv kõikide platvormidega. Vastupidav punutud kaabel.`,
    'Gaming Earbuds': `Kompaktsed mängukõrvaklappid madala latentsusega heliga, sisselülitatud mikrofoni ja mugava istuvusega. Ideaalne mobiilseks mängimiseks ja reisimiseks. Premium helikvaliteet kaasaskantavas disainis.`,
    'Meta Quest VR': `Kaasakiskuv Meta Quest VR-prillid koos autonoomse toimimise, 6DOF jälgimise ja juhtmevaba disainiga. Ligipääs tuhandetele VR-mängudele ja kogemustele. PC-d pole vaja. Kiire laadimine ja premium mugavus.`,
    'PlayStation VR': `Ametlikud PlayStation VR-prillid, mis pakuvad hengevatvaid virtuaalreaalsuse kogemusi. Sisaldab 120Hz värskendussagedust, 3D-heli ja eksklusiivse VR-mänge. Ühilduv PS5 ja PS4 konsoolidega.`,
    'PC VR Systems': `Professionaalne PC VR süsteem kõrglahutuslikkusega ekraanidega, täpse jälgimisega ja ruumimõõdus VR-iga. Ühilduv SteamVR ja Oculus Store'iga. Premium mugavus ja reguleeritav optika.`,
    'Cables & Chargers': `Hädavajalik mängulisatarvik kiireks laadimiseks ja andmeside. Vastupidav punutud kaabel tugevdatud ühendustega. Ühilduv kontrollerite, kõrvaklappide ja mängulisseadmetega. 1-aastane garantii.`,
    'PS5 Games': `Eksklussiivne PlayStation 5 mäng vapustava 4K graafikaga, kiirgusjälgimisega ja kaasakiskuva mänguga. Koge järgmise põlvkonna mängimist kiirte laadimisaegadega ja DualSense kontrolleri toega. Füüsiline ketasversioon.`,
    'Xbox Games': `Premium Xbox mäng optimeeritud Series X|S jaoks täiustatud graafika ja jõudlusega. Toetab Smart Delivery'd parima versiooni saamiseks su konsoolile. Sisaldab eksklussiivset sisu ja saavutusi.`,
    'Switch Games': `Populaarne Nintendo Switch mäng kaasaskantava ja TV-režiimi toega. Peresõbralik mäng, kohalik ja veebipõhine mitmemäng. Füüsiline kassett autentse Nintendo pitseriga.`,
  };

  const defaultEN = `Premium gaming product featuring high-quality construction and advanced features. Compatible with modern gaming systems, includes warranty and fast shipping across Estonia, Baltics, and Europe via Omniva and DPD. Authentic product from official distributor.`;
  const defaultET = `Premium mänguseade kõrgekvaliteetse ehituse ja täiustatud funktsioonidega. Ühilduv kaasaegsete mängusüsteemidega, sisaldab garantiid ja kiiret kohaletoimetamist üle Eesti, Baltikumi ja Euroopa Omniva ja DPD kaudu. Autentne toode ametlikult levitajalt.`;

  return {
    en: baseDescriptionsEN[categoryName] || defaultEN,
    et: baseDescriptionsET[categoryName] || defaultET,
  };
}

async function updateAllProducts() {
  console.log('Starting product update...');
  
  // Get all categories
  const allCategories = await db.select().from(categories);
  
  let totalUpdated = 0;
  
  for (const category of allCategories) {
    console.log(`\nProcessing category: ${category.nameEn} (${category.id})`);
    
    // Get all products in this category
    const categoryProducts = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, category.id));
    
    console.log(`Found ${categoryProducts.length} products`);
    
    // Get image URL for this category
    const imageUrl = categoryImages[category.nameEn] || '/stock_images/playstation_5_consol_e3df6bbf.jpg';
    
    // Generate description for this category
    const description = generateDescription('Product', category.nameEn);
    
    // Update all products in this category
    for (const product of categoryProducts) {
      await db
        .update(products)
        .set({
          images: [imageUrl],
          descriptionEn: description.en,
          descriptionEt: description.et,
        })
        .where(eq(products.id, product.id));
      
      totalUpdated++;
      
      if (totalUpdated % 50 === 0) {
        console.log(`Updated ${totalUpdated} products...`);
      }
    }
  }
  
  console.log(`\n✅ Successfully updated ${totalUpdated} products!`);
}

updateAllProducts().catch(console.error);
