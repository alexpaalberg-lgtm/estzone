import { db } from './db';
import * as schema from '@shared/schema';

async function seed() {
  console.log('Seeding database...');
  
  // Categories
  const categories = [
    {
      nameEn: 'Gaming Consoles',
      nameEt: 'M ängukonsolid',
      slug: 'consoles',
      descriptionEn: 'Latest gaming consoles including PlayStation, Xbox, and Nintendo',
      descriptionEt: 'Uusimad mängukonsolid, sealhulgas PlayStation, Xbox ja Nintendo',
      sortOrder: 1,
    },
    {
      nameEn: 'Controllers & Accessories',
      nameEt: 'Kontrollerid ja Tarvikud',
      slug: 'controllers',
      descriptionEn: 'Premium gaming controllers, charging stations, and controller accessories',
      descriptionEt: 'Preemium mängukontrollerid, laadimisj aamad ja kontrolleri tarvikud',
      sortOrder: 2,
    },
    {
      nameEn: 'Gaming Headsets',
      nameEt: 'Mängukõrvaklapid',
      slug: 'headsets',
      descriptionEn: 'Immersive gaming headsets with surround sound and noise cancellation',
      descriptionEt: 'Kaasahaaravad mängukõrvaklapid Surround-heliga ja müravähendusega',
      sortOrder: 3,
    },
    {
      nameEn: 'Virtual Reality',
      nameEt: 'Virtuaalreaalsus',
      slug: 'vr',
      descriptionEn: 'VR headsets and accessories including Meta Quest, PlayStation VR, and more',
      descriptionEt: 'VR-kõrvaklapid ja tarvikud, sealhulgas Meta Quest, PlayStation VR jne',
      sortOrder: 4,
    },
    {
      nameEn: 'Gaming Keyboards & Mice',
      nameEt: 'Mänguklaviatuurid ja Hiired',
      slug: 'keyboards-mice',
      descriptionEn: 'Mechanical keyboards and precision gaming mice',
      descriptionEt: 'Mehaanilised klaviatuurid ja täppisosa mänguhiired',
      sortOrder: 5,
    },
    {
      nameEn: 'Gaming Chairs',
      nameEt: 'Mängutoolid',
      slug: 'chairs',
      descriptionEn: 'Ergonomic gaming chairs for maximum comfort',
      descriptionEt: 'Ergonoomilised mängutoolid maksimaalse mugavuse tagamiseks',
      sortOrder: 6,
    },
    {
      nameEn: 'Monitors & Displays',
      nameEt: 'Monitorid ja Ekraanid',
      slug: 'monitors',
      descriptionEn: 'High-refresh gaming monitors and displays',
      descriptionEt: 'Kõrge värskendussagedusega mängumonitorid ja ekraanid',
      sortOrder: 7,
    },
    {
      nameEn: 'Gaming Storage',
      nameEt: 'Mängude Salvestus',
      slug: 'storage',
      descriptionEn: 'External drives and storage expansion for gaming consoles',
      descriptionEt: 'Välised kettad ja salvestusruumi laiendused mängukonsolidele',
      sortOrder: 8,
    },
    {
      nameEn: 'PC Gaming',
      nameEt: 'Arvutimängud',
      slug: 'pc-gaming',
      descriptionEn: 'Gaming PCs, components, and upgrades',
      descriptionEt: 'Mänguarvutid, komponendid ja täiustused',
      sortOrder: 9,
    },
    {
      nameEn: 'Gaming Merchandise',
      nameEt: 'Mängukaubad',
      slug: 'merchandise',
      descriptionEn: 'Gaming apparel, collectibles, and merchandise',
      descriptionEt: 'Mänguriided, kollektsioneeritavad esemed ja kaubad',
      sortOrder: 10,
    },
  ];
  
  for (const category of categories) {
    try {
      await db.insert(schema.categories).values(category).onConflictDoNothing();
      console.log(`Created category: ${category.nameEn}`);
    } catch (error) {
      console.log(`Category already exists: ${category.nameEn}`);
    }
  }
  
  console.log('Database seeded successfully!');
}

seed()
  .catch(console.error)
  .finally(() => process.exit());
