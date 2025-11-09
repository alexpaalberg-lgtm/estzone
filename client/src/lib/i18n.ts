export const translations = {
  en: {
    nav: {
      consoles: 'Consoles',
      controllers: 'Controllers',
      headsets: 'Headsets',
      accessories: 'Accessories',
      blog: 'Blog',
      cart: 'Cart',
      account: 'Account',
    },
    hero: {
      title: 'Level Up Your Gaming',
      subtitle: 'Premium consoles and accessories with exclusive deals',
      cta: 'Shop Now',
      learnMore: 'Learn More',
    },
    product: {
      addToCart: 'Add to Cart',
      inStock: 'In Stock',
      lowStock: 'Low Stock',
      outOfStock: 'Out of Stock',
      newArrival: 'New',
      sale: 'Sale',
    },
    footer: {
      newsletter: 'Subscribe to our newsletter',
      emailPlaceholder: 'Enter your email',
      subscribe: 'Subscribe',
      categories: 'Categories',
      support: 'Support',
      company: 'Company',
      paymentMethods: 'Payment Methods',
      shipping: 'Shipping Partners',
    },
  },
  et: {
    nav: {
      consoles: 'Konsoolid',
      controllers: 'Kontrollerid',
      headsets: 'Kõrvaklapid',
      accessories: 'Tarvikud',
      blog: 'Blogi',
      cart: 'Ostukorv',
      account: 'Konto',
    },
    hero: {
      title: 'Vii Oma Mängimine Uuele Tasemele',
      subtitle: 'Preemium konsoolid ja tarvikud eksklusiivsete pakkumistega',
      cta: 'Osta Nüüd',
      learnMore: 'Uuri Lähemalt',
    },
    product: {
      addToCart: 'Lisa Ostukorvi',
      inStock: 'Laos',
      lowStock: 'Vähe Laos',
      outOfStock: 'Otsas',
      newArrival: 'Uus',
      sale: 'Soodustus',
    },
    footer: {
      newsletter: 'Telli meie uudiskiri',
      emailPlaceholder: 'Sisesta oma e-post',
      subscribe: 'Telli',
      categories: 'Kategooriad',
      support: 'Tugi',
      company: 'Ettevõte',
      paymentMethods: 'Makseviisid',
      shipping: 'Tarneviisid',
    },
  },
};

export type Language = 'en' | 'et';
export type Translations = typeof translations.en;
