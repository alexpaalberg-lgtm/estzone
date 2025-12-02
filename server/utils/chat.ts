import OpenAI from "openai";
import type { Product, Order, Category, User, Wishlist, Address, RecurringOrder } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-4o-mini";

interface LoyaltyInfo {
  tierName: string;
  tierNameEt: string;
  currentPoints: number;
  expiringPoints: number;
  expiringDays: number;
  discountPercent: number;
  pointsMultiplier: number;
  totalSpent: string;
  nextTierName?: string;
  nextTierNameEt?: string;
  spendToNextTier?: string;
}

interface ChatContext {
  products?: Product[];
  allProducts?: Product[];
  categories?: Category[];
  order?: Order;
  sessionHistory?: Array<{ role: string; content: string }>;
  baseUrl?: string;
  personaName?: string;
  user?: User | null;
  wishlist?: Wishlist[];
  addresses?: Address[];
  recurringOrders?: RecurringOrder[];
  loyalty?: LoyaltyInfo;
}

interface Persona {
  name: string;
  gender: 'male' | 'female';
  language: 'et' | 'en';
  personality: string;
  style: string;
  greeting: string;
}

const PERSONAS: Persona[] = [
  // Estonian personas (2 female, 2 male)
  {
    name: 'Kadri',
    gender: 'female',
    language: 'et',
    personality: 'Soe ja abivalmis klienditeenindaja. Väga kannatlik ja põhjalik.',
    style: 'Selgitab asju rahulikult ja samm-sammult. Professionaalne aga sõbralik.',
    greeting: 'Tere! Mina olen Kadri ja aitan sind rõõmuga.'
  },
  {
    name: 'Liisa',
    gender: 'female',
    language: 'et',
    personality: 'Energiline ja nooruslik, kirglik mängur. Teab kõiki uusimaid trende.',
    style: 'Entusiastlik ja kiire. Kasutab nooruslikku keelt.',
    greeting: 'Tere! Liisa siin! Mis mängu täna otsime?'
  },
  {
    name: 'Karl',
    gender: 'male',
    language: 'et',
    personality: 'Rahulik ekspert, kes teab iga mängu iga detaili. Usaldusväärne ja aus.',
    style: 'Tasakaalustatud ja professionaalne, aga sõbralik. Jagab eksperditeadmisi.',
    greeting: 'Tere! Karl siin, EstZone mänguekspert. Kuidas saan aidata?'
  },
  {
    name: 'Martin',
    gender: 'male',
    language: 'et',
    personality: 'Humoorikas ja lõbus, teeb nalja aga teab oma asja. Armastab retromänge.',
    style: 'Kasutab huumorit ja kultuuriviiteid. Teeb vestluse lõbusaks.',
    greeting: 'Tervist! Martin siinpool. Räägime mängudest!'
  },
  // English personas (2 female, 2 male)
  {
    name: 'Emma',
    gender: 'female',
    language: 'en',
    personality: 'Warm and helpful customer service representative. Patient and thorough.',
    style: 'Uses friendly phrases like "no worries" and "happy to help". Explains things step by step.',
    greeting: "Hello! I'm Emma, happy to help you find what you need!"
  },
  {
    name: 'Sophie',
    gender: 'female',
    language: 'en',
    personality: 'Energetic and youthful, passionate gamer. Knows all the latest trends and releases.',
    style: 'Uses casual language. Enthusiastic and quick.',
    greeting: "Hi! Sophie here! What game are we looking for today?"
  },
  {
    name: 'James',
    gender: 'male',
    language: 'en',
    personality: 'Calm expert who knows every detail about every game. Trustworthy and honest.',
    style: 'Balanced and professional but friendly. Shares expert knowledge.',
    greeting: "Hello! James here, EstZone gaming expert. How can I help you?"
  },
  {
    name: 'Alex',
    gender: 'male',
    language: 'en',
    personality: 'Humorous and fun, makes jokes but knows their stuff. Loves retro games.',
    style: 'Uses humor and pop culture references. Makes the conversation enjoyable.',
    greeting: "Hey! Alex here. Let's talk games!"
  }
];

export function getRandomPersona(language: 'en' | 'et'): Persona {
  const languagePersonas = PERSONAS.filter(p => p.language === language);
  const randomIndex = Math.floor(Math.random() * languagePersonas.length);
  return languagePersonas[randomIndex];
}

export function getPersonaByName(name: string): Persona | undefined {
  return PERSONAS.find(p => p.name.toLowerCase() === name.toLowerCase());
}

export function detectLanguage(text: string): { language: 'en' | 'et'; confidence: number } {
  const estonianWords = ['tere', 'palun', 'aitäh', 'tänan', 'on', 'ja', 'ei', 'see', 'kui', 'võib', 'saab', 'kas', 'mis', 'kus', 'kes', 'mida', 'kuidas', 'miks', 'mängu', 'toode', 'tellimus', 'soodustus', 'hind', 'laos', 'soovitan', 'otsin', 'vajan', 'konsool', 'mäng', 'pult', 'kõrvaklapid', 'tahan', 'tahaks', 'soovin', 'osta', 'korvi'];
  const englishWords = ['hello', 'please', 'thanks', 'thank', 'the', 'is', 'and', 'no', 'this', 'if', 'can', 'get', 'what', 'where', 'who', 'how', 'why', 'game', 'product', 'order', 'sale', 'price', 'stock', 'recommend', 'looking', 'need', 'console', 'controller', 'headset', 'want', 'buy', 'cart'];
  
  const words = text.toLowerCase().split(/\s+/);
  let estonianScore = 0;
  let englishScore = 0;
  
  words.forEach(word => {
    if (estonianWords.some(ew => word.includes(ew))) estonianScore++;
    if (englishWords.some(ew => word.includes(ew))) englishScore++;
  });
  
  const hasEstonianChars = /[õäöü]/i.test(text);
  if (hasEstonianChars) estonianScore += 3;
  
  const total = estonianScore + englishScore;
  if (total === 0) {
    return { language: 'en', confidence: 0.5 };
  }
  
  if (estonianScore > englishScore) {
    return { language: 'et', confidence: Math.min(estonianScore / total, 1) };
  } else {
    return { language: 'en', confidence: Math.min(englishScore / total, 1) };
  }
}

function buildSystemPrompt(language: 'en' | 'et', context: ChatContext, persona: Persona): string {
  const baseUrl = context.baseUrl || 'https://www.estzone.eu';
  
  const basePrompt = language === 'et' 
    ? `# ${persona.name.toUpperCase()} - EstZone'i Virtuaalne Mänguekspert

Oled ${persona.name}, EstZone OÜ sõbralik ja kogenud virtuaalne mänguekspert. ${persona.personality}

## SINU ISIKSUS

**Iseloom:**
${persona.personality}
- Suhtled nagu päris inimene, mitte robot. Kasuta loomulikku kõnekeelt
- Oled kirglik mängur ise ja jagad seda entusiasmi
- Oled empaatiline - kui kliendil on probleem, mõistad tema frustratsiooni
- Ära kasuta emotikone

**Suhtlusstiil:**
${persona.style}
- Ütle "sina" mitte "teie" (v.a. kui klient kasutab teietamist)
- Kasuta lühikesi, selgeid lauseid
- Küsi täpsustavaid küsimusi loomulikult
- Tunnista kui ei tea: "Aus olu - seda ma ei tea päris täpselt, aga uurin järele!"

**Euroopa kultuuritundlikkus:**
- Tead Euroopa mänguturu eripärasid (PEGI reitingud, Euroopa digitaalkoodid)
- Mõistad erinevaid riike ja nende mängutraditsioone
- Tunned kohalikke pühi ja võid neid mainida (jõulud, jaanipäev jne)

## SINU VÕIMED JA FUNKTSIOONID

### 1. TOOTED JA LAOSEIS
- Tead KÕIKI meie tooteid reaalajas - hinnad, laoseis, kirjeldused
- Kui soovitad toodet, LISA ALATI LINK: ${baseUrl}/product/[toote-slug]
- Näita hindu alati eurodes koos käibemaksuga (24% VAT sisaldub)
- Kui toode on otsas, paku alternatiive ja ütle millal võiks tagasi tulla

### 2. OSTUKORV JA TELLIMUSED
- Saad aidata tooteid ostukorvi lisada - suuna klient: ${baseUrl}/product/[slug]
- Saad luua jagamislinkid ostukorvidele
- Saad aidata tellimuse vormistamisega samm-sammult
- Saad kontrollida tellimuse staatust tellimuse numbri järgi

**OLULINE - TEGUTSE ALATI VASTUSE SAAMISEL:**
- Kui küsisid kliendilt täpsustavaid küsimusi (nt millist konsooli kasutab, kas tahab füüsilist või digitaalset), 
  PEAD pärast vastuse saamist KOHE soovitama KONKREETSEID tooteid linkidega!
- Ära jää kunagi vaikseks pärast vastuse saamist - alati jätka vestlust toiminguga!
- Näide: "PS5" vastus → näita 3 konkreetset PS5 võidusõidumängu linkidega

### 3. TAGASTUSED JA GARANTII
**Tagastusõigus (14 päeva):**
- AVAMATA tooted - täielik raha tagasi
- Defektne toode - asendame KOHE või raha tagasi
- Avatud tarkvara (mängud, kaardid) - EI saa tagastada (seadus)

**Tagastuse algatamine:**
1. Küsi tellimuse number
2. Kontrolli kas 14 päeva pole möödas
3. Küsi tagastuse põhjus
4. Kinnita et toode on avamata (kui pole defektne)
5. Anna juhised: saada e-kiri info@estzone.eu tellimuse numbriga

**Garantii:**
- Konsoolid: 2 aastat
- Kontrollerid: 1 aasta
- Kõrvaklapid: 1-2 aastat
- Tarvikud: 6-12 kuud

### 4. TELLIMUSE TÜHISTAMINE
- Saab tühistada AINULT kui pole veel saadetud (staatus: "Ootel" või "Töötlemisel")
- Küsi tellimuse number, kontrolli staatust
- Kui juba saadetud - suuna tagastusprotsessile

### 5. MAKSED JA TARNE
**Makseviisid:**
- Pangalink (Montonio): SEB, Swedbank, LHV, Luminor
- Krediitkaart (Stripe): Visa, Mastercard
- PayPal: Rahvusvaheline

**Tarneviisid:**
- Omniva pakiautomaat: €4.99, 2-3 tööpäeva
- DPD pakiautomaat: €5.99, 1-2 tööpäeva  
- DPD kuller: €7.99, 1-2 tööpäeva

### 6. PROBLEEMIDE LAHENDAMINE
- Defektne toode → paku kohest asendust VÕI raha tagasi
- Vale toode → tasuta tagastus + õige toote saatmine
- Tarne hilineb → kontrolli staatust, selgita olukorda, vabanda
- Rahulolematu klient → ole empaatiline, paku lahendusi, vajadusel eskaleeri

## VESTLUSE NÄITED

**Hea vastus tootepäringule:**
"PS5 mänge on meil päris korralik valik! Kui sa armastad action-adventure žanri, siis soovitan kindlasti God of War Ragnarökki (€69.99) - see on lihtsalt meisterlik! Link: ${baseUrl}/product/god-of-war-ragnarok

Aga kui tahad midagi rahulikumat, siis Hogwarts Legacy on ka super valik lastele ja täiskasvanutele (€59.99).

Mis žanr sulle kõige rohkem meeldib?"

**Hea vastus probleemile:**
"See on tõesti ebameeldiv olukord! Ma saan täiesti aru, et see ajab närvi kui toode ei tööta korralikult.

Ära muretse, me lahendame selle kiiresti! Mul on kaks varianti sulle:
1. Saadame kohe uue asemele (tasuta)
2. Tagastame raha täies ulatuses

Kumb sulle sobib paremini?"

## OLULINE MEELDETULETUS

- Vasta AINULT eesti keeles
- Lisa ALATI tootelingid kui mainid tooteid
- Ole aus laoseisu osas - ära luba mida pole
- Küsi alati "Kas saan veel millegagi aidata?" vestluse lõpus
- Kui klient on vihane, ära võta isiklikult - ole professionaalne aga soe`

    : `# ${persona.name.toUpperCase()} - EstZone's Virtual Gaming Expert

You are ${persona.name}, EstZone OÜ's friendly and experienced virtual gaming expert. ${persona.personality}

## YOUR PERSONALITY

**Character:**
${persona.personality}
- You communicate like a real person, not a robot. Use natural conversational language
- You're a passionate gamer yourself and share that enthusiasm
- You're empathetic - when a customer has a problem, you understand their frustration
- Do not use emojis

**Communication Style:**
${persona.style}
- Be casual and friendly, like talking to a friend
- Use short, clear sentences
- Ask clarifying questions naturally
- Admit when you don't know: "Honestly, I'm not 100% sure about that, but I'll find out!"

**European Cultural Awareness:**
- You know European gaming market specifics (PEGI ratings, European digital codes)
- You understand different countries and their gaming traditions
- You're familiar with local holidays and can mention them (Christmas, summer holidays, etc.)

## YOUR CAPABILITIES AND FUNCTIONS

### 1. PRODUCTS AND STOCK
- You know ALL our products in real-time - prices, stock, descriptions
- When recommending a product, ALWAYS ADD A LINK: ${baseUrl}/product/[product-slug]
- Always show prices in euros including VAT (24% VAT included)
- If product is out of stock, offer alternatives and estimate when it might return

### 2. CART AND ORDERS
- You can help add products to cart - direct customer to: ${baseUrl}/product/[slug]
- You can create shareable cart links
- You can help with order placement step-by-step
- You can check order status by order number

**IMPORTANT - ALWAYS TAKE ACTION AFTER GETTING ANSWERS:**
- When you asked clarifying questions (e.g., which console, physical or digital), 
  you MUST immediately recommend SPECIFIC products with links after getting the answer!
- Never go silent after receiving an answer - always continue the conversation with action!
- Example: "PS5" answer → show 3 specific PS5 racing games with links

### 3. RETURNS AND WARRANTY
**Return Policy (14 days):**
- UNOPENED products - full refund
- Defective product - we replace IMMEDIATELY or refund
- Opened software (games, cards) - CANNOT be returned (by law)

**Initiating a Return:**
1. Ask for order number
2. Check if 14 days haven't passed
3. Ask for return reason
4. Confirm product is unopened (if not defective)
5. Give instructions: send email to info@estzone.eu with order number

**Warranty:**
- Consoles: 2 years
- Controllers: 1 year
- Headsets: 1-2 years
- Accessories: 6-12 months

### 4. ORDER CANCELLATION
- Can only cancel if not yet shipped (status: "Pending" or "Processing")
- Ask for order number, check status
- If already shipped - redirect to return process

### 5. PAYMENTS AND SHIPPING
**Payment Methods:**
- Bank link (Montonio): SEB, Swedbank, LHV, Luminor
- Credit card (Stripe): Visa, Mastercard
- PayPal: International

**Shipping Options:**
- Omniva parcel locker: €4.99, 2-3 business days
- DPD parcel locker: €5.99, 1-2 business days
- DPD courier: €7.99, 1-2 business days

### 6. PROBLEM RESOLUTION
- Defective product → offer immediate replacement OR refund
- Wrong product → free return + send correct product
- Delivery delayed → check status, explain situation, apologize
- Unhappy customer → be empathetic, offer solutions, escalate if needed

## CONVERSATION EXAMPLES

**Good response to product inquiry:**
"We have quite a selection of PS5 games! If you love action-adventure, I definitely recommend God of War Ragnarok (€69.99) - it's simply masterful! Link: ${baseUrl}/product/god-of-war-ragnarok

But if you want something more relaxed, Hogwarts Legacy is also a great choice for kids and adults (€59.99).

What genre do you enjoy the most?"

**Good response to a problem:**
"That's really an unpleasant situation! I totally understand that it's frustrating when a product doesn't work properly.

Don't worry, we'll solve this quickly! I have two options for you:
1. We send a new one right away (free)
2. We refund the full amount

Which works better for you?"

## IMPORTANT REMINDERS

- Respond ONLY in English
- ALWAYS add product links when mentioning products
- Be honest about stock - don't promise what we don't have
- Always ask "Is there anything else I can help with?" at end of conversation
- If customer is angry, don't take it personally - be professional but warm`;

  let contextInfo = '';
  
  if (context.categories && context.categories.length > 0) {
    const categoryList = context.categories.map(c => {
      const name = language === 'et' ? c.nameEt : c.nameEn;
      return `${name} (${baseUrl}/products/${c.slug})`;
    }).join(', ');
    
    contextInfo += language === 'et'
      ? `\n\n## MEIE KATEGOORIAD\n${categoryList}`
      : `\n\n## OUR CATEGORIES\n${categoryList}`;
  }
  
  if (context.products && context.products.length > 0) {
    const productList = context.products.slice(0, 12).map(p => {
      const name = language === 'et' ? p.nameEt : p.nameEn;
      const price = parseFloat(p.price);
      const salePrice = p.salePrice ? parseFloat(p.salePrice) : null;
      const stock = p.stock > 0 ? (language === 'et' ? `${p.stock} tk laos` : `${p.stock} in stock`) : (language === 'et' ? 'OTSAS' : 'OUT OF STOCK');
      const priceStr = salePrice 
        ? `€${salePrice.toFixed(2)} (oli €${price.toFixed(2)})` 
        : `€${price.toFixed(2)}`;
      
      const slug = p.sku.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `- **${name}**: ${priceStr} - ${stock}\n  Link: ${baseUrl}/product/${p.id}`;
    }).join('\n');
    
    contextInfo += language === 'et'
      ? `\n\n## KLIENDI OTSINGULE VASTAVAD TOOTED\n${productList}\n\n⚠️ KASUTA NEID TOOTEID SOOVITUSTE ANDMISEL! Lisa alati link!`
      : `\n\n## PRODUCTS MATCHING CUSTOMER QUERY\n${productList}\n\n⚠️ USE THESE PRODUCTS FOR RECOMMENDATIONS! Always add the link!`;
  }
  
  if (context.allProducts && context.allProducts.length > 0) {
    const featuredProducts = context.allProducts
      .filter(p => p.isFeatured && p.stock > 0)
      .slice(0, 5);
    
    if (featuredProducts.length > 0) {
      const featuredList = featuredProducts.map(p => {
        const name = language === 'et' ? p.nameEt : p.nameEn;
        const price = p.salePrice ? parseFloat(p.salePrice) : parseFloat(p.price);
        return `- ${name}: €${price.toFixed(2)} (${baseUrl}/product/${p.id})`;
      }).join('\n');
      
      contextInfo += language === 'et'
        ? `\n\n## TOP TOOTED (soovita kui klient ei tea mida tahab)\n${featuredList}`
        : `\n\n## TOP PRODUCTS (recommend if customer is unsure)\n${featuredList}`;
    }
    
    const saleProducts = context.allProducts
      .filter(p => p.salePrice && p.stock > 0)
      .slice(0, 5);
    
    if (saleProducts.length > 0) {
      const saleList = saleProducts.map(p => {
        const name = language === 'et' ? p.nameEt : p.nameEn;
        const origPrice = parseFloat(p.price);
        const salePrice = parseFloat(p.salePrice!);
        const discount = Math.round((1 - salePrice / origPrice) * 100);
        return `- ${name}: €${salePrice.toFixed(2)} (-${discount}%) 🔥`;
      }).join('\n');
      
      contextInfo += language === 'et'
        ? `\n\n## PRAEGUSED SOODUSPAKKUMISED 🔥\n${saleList}`
        : `\n\n## CURRENT DEALS 🔥\n${saleList}`;
    }
    
    const totalProducts = context.allProducts.length;
    const inStock = context.allProducts.filter(p => p.stock > 0).length;
    const outOfStock = totalProducts - inStock;
    
    contextInfo += language === 'et'
      ? `\n\n## POESTATISTIKA\nKokku ${totalProducts} toodet | Laos: ${inStock} | Otsas: ${outOfStock}`
      : `\n\n## STORE STATS\nTotal ${totalProducts} products | In stock: ${inStock} | Out of stock: ${outOfStock}`;
  }
  
  if (context.order) {
    const statusMap: Record<string, { en: string; et: string }> = {
      'pending': { en: 'Pending - awaiting payment', et: 'Ootel - ootab makset' },
      'paid': { en: 'Paid - processing soon', et: 'Makstud - töötlemisel varsti' },
      'processing': { en: 'Processing - packing your order', et: 'Töötlemisel - pakime sinu tellimust' },
      'shipped': { en: 'Shipped - on the way!', et: 'Saadetud - teel!' },
      'delivered': { en: 'Delivered - enjoy!', et: 'Kohale toimetatud - naudi!' },
      'cancelled': { en: 'Cancelled', et: 'Tühistatud' },
    };
    const status = statusMap[context.order.status] || { en: context.order.status, et: context.order.status };
    const orderDate = new Date(context.order.createdAt);
    const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const canReturn = daysSinceOrder <= 14;
    const canCancel = ['pending', 'paid', 'processing'].includes(context.order.status);
    
    const orderInfo = language === 'et'
      ? `\n\n## 📦 KLIENDI TELLIMUS #${context.order.orderNumber}
- **Staatus**: ${status.et}
- **Summa**: €${context.order.total}
- **Tellitud**: ${orderDate.toLocaleDateString('et-EE')} (${daysSinceOrder} päeva tagasi)
- **Tarne**: ${context.order.shippingMethod}
- **Makse**: ${context.order.paymentMethod}
${context.order.trackingNumber ? `- **Jälgimisnumber**: ${context.order.trackingNumber}` : ''}
- **Tühistamine võimalik**: ${canCancel ? 'JAH ✅' : 'EI ❌ (juba saadetud)'}
- **Tagastus võimalik**: ${canReturn ? 'JAH ✅ (14 päeva pole möödas)' : 'EI ❌ (üle 14 päeva)'}`
      : `\n\n## 📦 CUSTOMER ORDER #${context.order.orderNumber}
- **Status**: ${status.en}
- **Total**: €${context.order.total}
- **Ordered**: ${orderDate.toLocaleDateString('en-GB')} (${daysSinceOrder} days ago)
- **Shipping**: ${context.order.shippingMethod}
- **Payment**: ${context.order.paymentMethod}
${context.order.trackingNumber ? `- **Tracking**: ${context.order.trackingNumber}` : ''}
- **Can cancel**: ${canCancel ? 'YES ✅' : 'NO ❌ (already shipped)'}
- **Can return**: ${canReturn ? 'YES ✅ (within 14 days)' : 'NO ❌ (over 14 days)'}`;
    contextInfo += orderInfo;
  }
  
  // Add authenticated user context
  if (context.user) {
    const userName = context.user.firstName && context.user.lastName 
      ? `${context.user.firstName} ${context.user.lastName}`
      : context.user.firstName || 'Registered Customer';
    
    const userGreeting = language === 'et'
      ? `\n\n## SISSE LOGITUD KASUTAJA
- **Nimi**: ${userName}
- **Email**: ${context.user.email || 'Pole määratud'}
${context.user.phone ? `- **Telefon**: ${context.user.phone}` : ''}

Tervita klienti nimepidi ja paku personaalset teenust!`
      : `\n\n## LOGGED IN USER
- **Name**: ${userName}
- **Email**: ${context.user.email || 'Not set'}
${context.user.phone ? `- **Phone**: ${context.user.phone}` : ''}

Greet the customer by name and offer personalized service!`;
    contextInfo += userGreeting;
    
    // Add wishlist if available with sale notifications
    if (context.wishlist && context.wishlist.length > 0 && context.allProducts) {
      const wishlistData = context.wishlist.map(w => {
        const product = context.allProducts?.find(p => p.id === w.productId);
        if (!product) return null;
        const name = language === 'et' ? product.nameEt : product.nameEn;
        const originalPrice = parseFloat(product.price);
        const salePrice = product.salePrice ? parseFloat(product.salePrice) : null;
        const inStock = product.stock > 0;
        const onSale = !!salePrice;
        const discountPercent = onSale ? Math.round((1 - salePrice / originalPrice) * 100) : 0;
        return { name, originalPrice, salePrice, inStock, onSale, discountPercent };
      }).filter(Boolean);
      
      const itemsOnSale = wishlistData.filter(item => item?.onSale);
      const itemsOutOfStock = wishlistData.filter(item => !item?.inStock);
      
      const wishlistItems = wishlistData.map(item => {
        if (!item) return '';
        if (item.onSale) {
          return `- **${item.name}**: ~~€${item.originalPrice.toFixed(2)}~~ → **€${item.salePrice!.toFixed(2)}** (-${item.discountPercent}% ${language === 'et' ? 'SOODUSHIND!' : 'SALE!'})`;
        }
        return `- ${item.name}: €${item.originalPrice.toFixed(2)} - ${item.inStock ? (language === 'et' ? 'Laos' : 'In Stock') : (language === 'et' ? 'Otsas' : 'Out of Stock')}`;
      }).join('\n');
      
      // Create sale alert section if items are on sale
      let saleAlert = '';
      if (itemsOnSale.length > 0) {
        saleAlert = language === 'et'
          ? `\n\n🔥 **OLULINE TEADE:** ${itemsOnSale.length} toode${itemsOnSale.length > 1 ? 't' : ''} kliendi soovinimekirjas on NÜÜD ALLAHINNATUD!
${itemsOnSale.map(i => `- ${i?.name}: -${i?.discountPercent}%`).join('\n')}
TULETA KLIENDILE KINDLASTI MEELDE, et nende lemmiktooted on soodustusega!`
          : `\n\n🔥 **IMPORTANT NOTICE:** ${itemsOnSale.length} item${itemsOnSale.length > 1 ? 's' : ''} in customer's wishlist ${itemsOnSale.length > 1 ? 'are' : 'is'} NOW ON SALE!
${itemsOnSale.map(i => `- ${i?.name}: -${i?.discountPercent}%`).join('\n')}
MAKE SURE TO NOTIFY the customer that their favorite products are discounted!`;
      }
      
      const wishlistInfo = language === 'et'
        ? `\n\n## KLIENDI SOOVINIMEKIRI (${context.wishlist.length} toodet)
${wishlistItems}${saleAlert}

Sa saad aidata kliendil:
- Vaadata soovinimekirja: ${baseUrl}/wishlist
- Soovitada alternatiive otsas toodetele${itemsOutOfStock.length > 0 ? ` (${itemsOutOfStock.length} toodet otsas!)` : ''}
- ${itemsOnSale.length > 0 ? `TEAVITA SOODUSTUSTEST! ${itemsOnSale.length} toodet on allahinnatud!` : 'Teavita uutest sooduspakkumistest'}`
        : `\n\n## CUSTOMER WISHLIST (${context.wishlist.length} items)
${wishlistItems}${saleAlert}

You can help the customer:
- View their wishlist: ${baseUrl}/wishlist
- Recommend alternatives for out-of-stock items${itemsOutOfStock.length > 0 ? ` (${itemsOutOfStock.length} items out of stock!)` : ''}
- ${itemsOnSale.length > 0 ? `NOTIFY ABOUT SALES! ${itemsOnSale.length} items are discounted!` : 'Notify about new sales on their favorite products'}`;
      contextInfo += wishlistInfo;
    }
    
    // Add saved addresses
    if (context.addresses && context.addresses.length > 0) {
      const defaultAddr = context.addresses.find(a => a.isDefault) || context.addresses[0];
      const addressInfo = language === 'et'
        ? `\n\n## SALVESTATUD AADRESS
- ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.postalCode}

Klient saab kassas kasutada salvestatud aadressi!`
        : `\n\n## SAVED ADDRESS
- ${defaultAddr.street}, ${defaultAddr.city}, ${defaultAddr.postalCode}

Customer can use their saved address at checkout!`;
      contextInfo += addressInfo;
    }
    
    // Add recurring orders
    if (context.recurringOrders && context.recurringOrders.length > 0) {
      const activeOrders = context.recurringOrders.filter(o => o.isActive);
      const pausedOrders = context.recurringOrders.filter(o => !o.isActive);
      
      const recurringInfo = language === 'et'
        ? `\n\n## KORDUVAD TELLIMUSED
- Aktiivseid: ${activeOrders.length}
- Peatatud: ${pausedOrders.length}

Klient saab hallata korduvaid tellimusi: ${baseUrl}/account`
        : `\n\n## RECURRING ORDERS
- Active: ${activeOrders.length}
- Paused: ${pausedOrders.length}

Customer can manage recurring orders at: ${baseUrl}/account`;
      contextInfo += recurringInfo;
    }
    
    // Add loyalty/VIP tier information
    if (context.loyalty) {
      const l = context.loyalty;
      const loyaltyInfo = language === 'et'
        ? `\n\n## VIP LOJAALSUSPROGRAMM
- **VIP Tase**: ${l.tierNameEt} ${l.tierName === 'Gold' ? '(Kuldne VIP!)' : l.tierName === 'Silver' ? '(Hõbedane VIP!)' : ''}
- **Punktide saldo**: ${l.currentPoints.toLocaleString()} punkti
${l.expiringPoints > 0 ? `- **Aeguvad punktid**: ${l.expiringPoints} punkti aegub ${l.expiringDays} päeva pärast! Tuleta kliendile meelde!` : ''}
- **Püsikliendi soodustus**: ${l.discountPercent}% kõigilt ostudelt
- **Punktide boonuskorrutaja**: ${l.pointsMultiplier}x (teenib ${l.pointsMultiplier * 10} punkti iga € kohta)
- **Kogu kulutatud summa**: €${l.totalSpent}
${l.nextTierName ? `- **Järgmine tase**: ${l.nextTierNameEt} - veel €${l.spendToNextTier} ostu vaja!` : '- Klient on juba kõrgeimal tasemel!'}

KASUTA SEDA INFOT:
- Mainig VIP soodustust ("Sinu ${l.discountPercent}% VIP soodustus rakendub automaatselt!")
- Tuleta meelde aeguvaid punkte ("Sul on ${l.expiringPoints} punkti mis aeguvad varsti!")
- Julgusta järgmise taseme saavutamist kui asjakohane
- 100 punkti = €1 soodustus kassas`
        : `\n\n## VIP LOYALTY PROGRAM
- **VIP Tier**: ${l.tierName} ${l.tierName === 'Gold' ? '(Gold VIP!)' : l.tierName === 'Silver' ? '(Silver VIP!)' : ''}
- **Points Balance**: ${l.currentPoints.toLocaleString()} points
${l.expiringPoints > 0 ? `- **Expiring Points**: ${l.expiringPoints} points expire in ${l.expiringDays} days! Remind customer!` : ''}
- **Loyalty Discount**: ${l.discountPercent}% off all purchases
- **Points Multiplier**: ${l.pointsMultiplier}x (earns ${l.pointsMultiplier * 10} points per €)
- **Total Spent**: €${l.totalSpent}
${l.nextTierName ? `- **Next Tier**: ${l.nextTierName} - needs €${l.spendToNextTier} more to reach!` : '- Customer is already at highest tier!'}

USE THIS INFO:
- Mention VIP discount ("Your ${l.discountPercent}% VIP discount applies automatically!")
- Remind about expiring points ("You have ${l.expiringPoints} points expiring soon!")
- Encourage reaching next tier when relevant
- 100 points = €1 discount at checkout`;
      contextInfo += loyaltyInfo;
    }
  }
  
  const quickActions = language === 'et'
    ? `\n\n## KIIRTOIMINGUD (kasuta neid fraase vastustes)
- Ostukorvi link: ${baseUrl}/cart
- Kassasse: ${baseUrl}/checkout
- Kõik tooted: ${baseUrl}/products
- Kontakt: info@estzone.eu | +372 5123 4567
- Aadress: Pärnu mnt 31, Tallinn, Eesti`
    : `\n\n## QUICK ACTIONS (use these in responses)
- Cart link: ${baseUrl}/cart
- Checkout: ${baseUrl}/checkout  
- All products: ${baseUrl}/products
- Contact: info@estzone.eu | +372 5123 4567
- Address: Pärnu mnt 31, Tallinn, Estonia`;
  
  contextInfo += quickActions;
  
  return basePrompt + contextInfo;
}

export async function streamChatResponse(
  message: string,
  language: 'en' | 'et',
  context: ChatContext,
  onChunk: (chunk: string) => void,
  persona?: Persona
): Promise<{ response: string; personaName: string }> {
  const selectedPersona = persona || getRandomPersona(language);
  
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildSystemPrompt(language, context, selectedPersona)
    }
  ];
  
  if (context.sessionHistory) {
    const recentHistory = context.sessionHistory.slice(-20);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })));
  }
  
  messages.push({
    role: "user",
    content: message
  });
  
  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      max_completion_tokens: 2048,
    });
    
    let fullResponse = '';
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        onChunk(content);
      }
    }
    
    return { response: fullResponse, personaName: selectedPersona.name };
  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    const errorMessage = language === 'et'
      ? 'Vabandust, tekkis tehniline viga. Palun proovi hiljem uuesti või võta ühendust info@estzone.eu.'
      : 'Sorry, a technical error occurred. Please try again later or contact info@estzone.eu.';
    throw new Error(errorMessage);
  }
}

export { Persona };

export function searchProducts(products: Product[], query: string, language: 'en' | 'et'): Product[] {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
  
  const platformKeywords: Record<string, string[]> = {
    'ps5': ['playstation', 'ps5', 'sony', 'dualsense', 'psvr', 'ps 5'],
    'xbox': ['xbox', 'series x', 'series s', 'microsoft', 'game pass', 'elite'],
    'switch': ['nintendo', 'switch', 'joy-con', 'joycon', 'switch 2'],
    'vr': ['vr', 'virtual reality', 'quest', 'psvr', 'index', 'meta', 'oculus'],
    'headset': ['headset', 'headphones', 'kõrvaklapid', 'audio', 'kuularid'],
    'controller': ['controller', 'pult', 'gamepad', 'joystick', 'mängupult'],
    'game': ['game', 'mäng', 'games', 'mängud'],
  };
  
  let detectedPlatform: string | null = null;
  for (const [platform, keywords] of Object.entries(platformKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      detectedPlatform = platform;
      break;
    }
  }
  
  const scoredProducts = products.map(p => {
    const name = (language === 'et' ? p.nameEt : p.nameEn).toLowerCase();
    const desc = (language === 'et' ? p.descriptionEt : p.descriptionEn)?.toLowerCase() || '';
    const sku = p.sku.toLowerCase();
    
    let score = 0;
    
    for (const word of queryWords) {
      if (name.includes(word)) score += 10;
      if (desc.includes(word)) score += 3;
      if (sku.includes(word)) score += 5;
    }
    
    if (detectedPlatform) {
      const platformKws = platformKeywords[detectedPlatform];
      if (platformKws?.some(kw => name.includes(kw) || sku.includes(kw))) {
        score += 15;
      }
    }
    
    if (p.isFeatured) score += 2;
    if (p.salePrice) score += 3;
    if (p.stock > 0) score += 5;
    
    return { product: p, score };
  });
  
  return scoredProducts
    .filter(sp => sp.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(sp => sp.product);
}

export function generateCartShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function canCancelOrder(order: Order): boolean {
  return ['pending', 'paid', 'processing'].includes(order.status);
}

export function canReturnOrder(order: Order): boolean {
  const orderDate = new Date(order.createdAt);
  const daysSinceOrder = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceOrder <= 14 && order.status === 'delivered';
}

export function getWarrantyPeriod(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes('console') || name.includes('konsool') || name.includes('ps5') || name.includes('xbox') || name.includes('switch')) {
    return '2 years';
  }
  if (name.includes('controller') || name.includes('pult') || name.includes('dualsense') || name.includes('joy-con')) {
    return '1 year';
  }
  if (name.includes('headset') || name.includes('kõrvaklapid') || name.includes('headphone')) {
    return '1-2 years';
  }
  return '6-12 months';
}
