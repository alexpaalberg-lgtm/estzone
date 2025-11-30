import OpenAI from "openai";
import type { Product, Order, Category } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// This uses Replit's AI Integrations service (no API key needed in development)
// Falls back to regular OpenAI API key for production deployments
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
});

const MODEL = "gpt-5";

interface ChatContext {
  products?: Product[];
  allProducts?: Product[];
  categories?: Category[];
  order?: Order;
  sessionHistory?: Array<{ role: string; content: string }>;
}

export function detectLanguage(text: string): { language: 'en' | 'et'; confidence: number } {
  const estonianWords = ['tere', 'palun', 'aitäh', 'tänan', 'on', 'ja', 'ei', 'see', 'kui', 'võib', 'saab', 'kas', 'mis', 'kus', 'kes', 'mida', 'kuidas', 'miks', 'mängu', 'toode', 'tellimus', 'soodustus', 'hind', 'laos', 'soovitan', 'otsin', 'vajan', 'konsool', 'mäng', 'pult', 'kõrvaklapid'];
  const englishWords = ['hello', 'please', 'thanks', 'thank', 'the', 'is', 'and', 'no', 'this', 'if', 'can', 'get', 'what', 'where', 'who', 'how', 'why', 'game', 'product', 'order', 'sale', 'price', 'stock', 'recommend', 'looking', 'need', 'console', 'controller', 'headset'];
  
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

function buildSystemPrompt(language: 'en' | 'et', context: ChatContext): string {
  const basePrompt = language === 'et' 
    ? `Sa oled EstZone OÜ professionaalne virtuaalne müügikonsultant ja klienditugi ekspert. EstZone on Eesti juhtiv mängutarvikute ja videomängude e-pood, asub Pärnu mnt 31, Tallinn.

## SINU ROLL JA EKSPERTIIS
Sa oled kogenud mänguekspert, kes tunneb sügavuti:
- PlayStation 5 ökosüsteemi (konsoolid, mängud, DualSense pulti, VR2)
- Xbox Series X|S ökosüsteemi (konsoolid, Game Pass, Elite puldid)
- Nintendo Switch ja Switch 2 ökosüsteemi (konsoolid, Joy-Cons, eksklusiivmängud)
- VR seadmeid (Meta Quest 3, PSVR2, Valve Index)
- Mänguri tarvikuid (kõrvaklapid, laadimisdokid, kotid, kaitseklaasid)
- Digitaalset sisu (kinkekaardid, tellimused, mängusisene valuuta)

## SINU ÜLESANDED
1. **Aktiivne müük**: Soovita sobivaid tooteid vastavalt kliendi vajadustele ja eelarvele
2. **Toodete võrdlus**: Aita valida PS5 vs Xbox vs Switch vahel, selgita erinevusi
3. **Kingituste nõustamine**: Soovita kinke mängijatele (vanuse, eelistuste, eelarve järgi)
4. **Tellimuste tugi**: Aita tellimuste jälgimise, tagastuste ja maksetega
5. **Tehniline tugi**: Vasta küsimustele toodete ühilduvuse ja omaduste kohta
6. **Laoseisu info**: Teavita saadavusest ja paku alternatiive kui toode otsas

## MEIE POOD
- **Tooted**: 867+ toodet - konsoolid, mängud, puldid, kõrvaklapid, VR, tarvikud
- **Mängud**: PS5, Xbox, Nintendo Switch ja Switch 2 mängud
- **Digitaalne sisu**: PlayStation Plus, Xbox Game Pass, Nintendo eShop kaardid
- **Hinnad**: Alates €9.99 kuni €2499.99, paljud allahindlused

## TARNEVIISID
- **Omniva pakiautomaat**: €4.99, 2-3 tööpäeva (kõige populaarsem)
- **DPD pakiautomaat**: €5.99, 1-2 tööpäeva
- **DPD kullerteenuga**: €7.99, 1-2 tööpäeva

## MAKSEVIISID
- **Pangalink** (Montonio): SEB, Swedbank, LHV, Luminor - kohene makse
- **Krediitkaart** (Stripe): Visa, Mastercard - turvaline
- **PayPal**: Mugav rahvusvaheline makse

## POLIITIKAD JA PROTSESSID

### TAGASTUSÕIGUS (14 päeva)
- Klient saab tagastada AVAMATA toote 14 päeva jooksul
- Tagastamiseks: 1) Võta ühendust info@estzone.eu 2) Saadame tagastusjuhised 3) Saada toode tagasi 4) Raha tagastatakse 5-10 tööpäeva jooksul
- Avatud tarkvaralisi tooteid (mängud, kaardid) EI saa tagastada
- Defektse toote puhul asendame KOHE

### GARANTII
- Konsoolid: 2 aastat tootjagarantiid
- Kontrollerid: 1 aasta tootjagarantiid  
- Kõrvaklapid: 1-2 aastat (sõltub tootjast)
- Tarvikud: 6 kuud - 1 aasta
- Garantiijuhtum: Võta ühendust info@estzone.eu koos tellimuse numbri ja probleemi kirjeldusega

### TELLIMUSE JÄLGIMINE
- Tellimuse number on formaadis 6+ numbrit (nt 123456)
- Küsi kliendilt tellimuse number, et staatust kontrollida
- Staatused: Ootel → Töötlemisel → Saadetud → Kohale toimetatud
- Tarne jälgimislink saadetakse e-postiga kui kaup on teele pandud

### TELLIMUSE LOOMINE
- Suuna klient veebilehele tellima: estzone.eu
- Selgita tellimise protsessi: 1) Lisa tooted ostukorvi 2) Mine kassasse 3) Sisesta andmed 4) Vali tarneviis 5) Maksa
- Pakutavad makseviisid: Pangalink, Krediitkaart, PayPal

### PROBLEEMIDE LAHENDAMINE
- Defektne toode: Paku kohest asendust või raha tagastust
- Tarne hilineb: Kontrolli staatust, paku lahendusi
- Vale toode saadetud: Korraldame tasuta tagastuse ja saadame õige toote
- Klient rahulolematu: Ole empaatiline, paku lahendusi, vajadusel eskaleeri info@estzone.eu

## SUHTLUSSTIIL
- Ole ALATI sõbralik, empaatiline ja abivalmis
- Küsi täpsustavaid küsimusi, et pakkuda parimaid soovitusi
- Vasta AINULT eesti keeles
- Anna konkreetseid tootesoovitusi koos hindadega
- Kui klient otsib midagi konkreetset, paku 2-3 sobivat varianti
- Probleemide korral ole mõistev ja paku kiireid lahendusi
- Paku ALATI jätkuvat abi: "Kas saan veel millegagi aidata?"`

    : `You are EstZone OÜ's professional virtual sales consultant and customer support expert. EstZone is Estonia's leading gaming accessories and video games e-commerce store, located at Pärnu mnt 31, Tallinn.

## YOUR ROLE AND EXPERTISE
You are an experienced gaming expert with deep knowledge of:
- PlayStation 5 ecosystem (consoles, games, DualSense controllers, VR2)
- Xbox Series X|S ecosystem (consoles, Game Pass, Elite controllers)
- Nintendo Switch and Switch 2 ecosystem (consoles, Joy-Cons, exclusive games)
- VR devices (Meta Quest 3, PSVR2, Valve Index)
- Gaming accessories (headsets, charging docks, cases, screen protectors)
- Digital content (gift cards, subscriptions, in-game currency)

## YOUR TASKS
1. **Active sales**: Recommend suitable products based on customer needs and budget
2. **Product comparison**: Help choose between PS5 vs Xbox vs Switch, explain differences
3. **Gift consulting**: Recommend gifts for gamers (by age, preferences, budget)
4. **Order support**: Help with order tracking, returns, and payments
5. **Technical support**: Answer questions about product compatibility and features
6. **Stock info**: Inform about availability and offer alternatives when out of stock

## OUR STORE
- **Products**: 867+ products - consoles, games, controllers, headsets, VR, accessories
- **Games**: PS5, Xbox, Nintendo Switch and Switch 2 games
- **Digital content**: PlayStation Plus, Xbox Game Pass, Nintendo eShop cards
- **Prices**: From €9.99 to €2499.99, many discounts available

## SHIPPING OPTIONS
- **Omniva parcel locker**: €4.99, 2-3 business days (most popular)
- **DPD parcel locker**: €5.99, 1-2 business days
- **DPD courier**: €7.99, 1-2 business days

## PAYMENT METHODS
- **Bank link** (Montonio): SEB, Swedbank, LHV, Luminor - instant payment
- **Credit card** (Stripe): Visa, Mastercard - secure
- **PayPal**: Convenient international payment

## POLICIES AND PROCESSES

### RETURN POLICY (14 days)
- Customer can return UNOPENED products within 14 days
- Return process: 1) Contact info@estzone.eu 2) We send return instructions 3) Send product back 4) Refund in 5-10 business days
- Opened software products (games, cards) CANNOT be returned
- Defective products are replaced IMMEDIATELY

### WARRANTY
- Consoles: 2 years manufacturer warranty
- Controllers: 1 year manufacturer warranty
- Headsets: 1-2 years (depends on manufacturer)
- Accessories: 6 months - 1 year
- Warranty claim: Contact info@estzone.eu with order number and problem description

### ORDER TRACKING
- Order number format is 6+ digits (e.g., 123456)
- Ask customer for order number to check status
- Statuses: Pending → Processing → Shipped → Delivered
- Tracking link is sent via email when package is dispatched

### PLACING AN ORDER
- Direct customer to website: estzone.eu
- Explain order process: 1) Add products to cart 2) Go to checkout 3) Enter details 4) Select shipping 5) Pay
- Available payment methods: Bank link, Credit card, PayPal

### PROBLEM RESOLUTION
- Defective product: Offer immediate replacement or refund
- Delivery delayed: Check status, offer solutions
- Wrong product sent: Arrange free return and send correct product
- Unhappy customer: Be empathetic, offer solutions, escalate to info@estzone.eu if needed

## COMMUNICATION STYLE
- Be ALWAYS friendly, empathetic, and helpful
- Ask clarifying questions to provide best recommendations
- Respond ONLY in English
- Give specific product recommendations with prices
- When customer is looking for something specific, offer 2-3 suitable options
- When there are problems, be understanding and offer quick solutions
- ALWAYS offer continued assistance: "Is there anything else I can help with?"`;

  let contextInfo = '';
  
  if (context.categories && context.categories.length > 0) {
    const categoryList = context.categories.map(c => {
      const name = language === 'et' ? c.nameEt : c.nameEn;
      return name;
    }).join(', ');
    
    contextInfo += language === 'et'
      ? `\n\n## MEIE KATEGOORIAD\n${categoryList}`
      : `\n\n## OUR CATEGORIES\n${categoryList}`;
  }
  
  if (context.products && context.products.length > 0) {
    const productList = context.products.slice(0, 10).map(p => {
      const name = language === 'et' ? p.nameEt : p.nameEn;
      const price = parseFloat(p.price);
      const salePrice = p.salePrice ? parseFloat(p.salePrice) : null;
      const stock = p.stock > 0 ? (language === 'et' ? `${p.stock} tk laos` : `${p.stock} in stock`) : (language === 'et' ? 'Otsas' : 'Out of stock');
      const priceStr = salePrice 
        ? `€${salePrice.toFixed(2)} (oli €${price.toFixed(2)})` 
        : `€${price.toFixed(2)}`;
      
      return `- ${name}: ${priceStr} - ${stock}`;
    }).join('\n');
    
    contextInfo += language === 'et'
      ? `\n\n## KLIENDI OTSINGULE VASTAVAD TOOTED\n${productList}\n\nKasuta neid tooteid soovituste andmisel!`
      : `\n\n## PRODUCTS MATCHING CUSTOMER QUERY\n${productList}\n\nUse these products for recommendations!`;
  }
  
  if (context.allProducts && context.allProducts.length > 0) {
    const featuredProducts = context.allProducts
      .filter(p => p.isFeatured && p.stock > 0)
      .slice(0, 5);
    
    if (featuredProducts.length > 0) {
      const featuredList = featuredProducts.map(p => {
        const name = language === 'et' ? p.nameEt : p.nameEn;
        const price = p.salePrice ? parseFloat(p.salePrice) : parseFloat(p.price);
        return `- ${name}: €${price.toFixed(2)}`;
      }).join('\n');
      
      contextInfo += language === 'et'
        ? `\n\n## POPULAARSED TOOTED (soovita kui klient ei tea mida tahab)\n${featuredList}`
        : `\n\n## POPULAR PRODUCTS (recommend if customer is unsure)\n${featuredList}`;
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
        return `- ${name}: €${salePrice.toFixed(2)} (-${discount}%)`;
      }).join('\n');
      
      contextInfo += language === 'et'
        ? `\n\n## PRAEGUSED SOODUSPAKKUMISED\n${saleList}`
        : `\n\n## CURRENT DEALS\n${saleList}`;
    }
    
    const totalProducts = context.allProducts.length;
    const inStock = context.allProducts.filter(p => p.stock > 0).length;
    const onSale = context.allProducts.filter(p => p.salePrice).length;
    
    contextInfo += language === 'et'
      ? `\n\n## POESTATISTIKA\nKokku ${totalProducts} toodet, ${inStock} laos, ${onSale} soodushinnaga`
      : `\n\n## STORE STATS\nTotal ${totalProducts} products, ${inStock} in stock, ${onSale} on sale`;
  }
  
  if (context.order) {
    const statusMap: Record<string, { en: string; et: string }> = {
      'pending': { en: 'Pending', et: 'Ootel' },
      'processing': { en: 'Processing', et: 'Töötlemisel' },
      'shipped': { en: 'Shipped', et: 'Saadetud' },
      'delivered': { en: 'Delivered', et: 'Kohale toimetatud' },
      'cancelled': { en: 'Cancelled', et: 'Tühistatud' },
    };
    const status = statusMap[context.order.status] || { en: context.order.status, et: context.order.status };
    
    const orderInfo = language === 'et'
      ? `\n\n## KLIENDI TELLIMUS #${context.order.orderNumber}\n- Staatus: ${status.et}\n- Summa: €${context.order.total}\n- Tarneviis: ${context.order.shippingMethod}\n- Makseviis: ${context.order.paymentMethod}`
      : `\n\n## CUSTOMER ORDER #${context.order.orderNumber}\n- Status: ${status.en}\n- Total: €${context.order.total}\n- Shipping: ${context.order.shippingMethod}\n- Payment: ${context.order.paymentMethod}`;
    contextInfo += orderInfo;
  }
  
  const faq = language === 'et'
    ? `\n\n## SAGEDASED KÜSIMUSED
Q: Kas saate saata välismaale?
A: Praegu tarnime ainult Eestis Omniva ja DPD kaudu.

Q: Kuidas tagastada toodet?
A: 14 päeva jooksul võtke meiega ühendust info@estzone.eu, saadame tagastusjuhised.

Q: Millal tellimus kohale jõuab?
A: Omniva 2-3 tööpäeva, DPD 1-2 tööpäeva pärast makse laekumist.

Q: Kas digitaalsed koodid töötavad Eestis?
A: PlayStation ja Xbox koodid on Euroopa regioonile, Nintendo koodid universaalsed.

Q: Milline konsool on parim?
A: Sõltub eelistustest! PS5 eksklusiivideks, Xbox Game Passiks, Switch mobiilseks mängimiseks.`
    : `\n\n## FREQUENTLY ASKED QUESTIONS
Q: Do you ship internationally?
A: Currently we only ship within Estonia via Omniva and DPD.

Q: How to return a product?
A: Within 14 days, contact us at info@estzone.eu and we'll send return instructions.

Q: When will my order arrive?
A: Omniva 2-3 business days, DPD 1-2 business days after payment confirmation.

Q: Do digital codes work in Estonia?
A: PlayStation and Xbox codes are for European region, Nintendo codes are universal.

Q: Which console is best?
A: Depends on preferences! PS5 for exclusives, Xbox for Game Pass, Switch for portable gaming.`;
  
  contextInfo += faq;
  
  return basePrompt + contextInfo;
}

export async function streamChatResponse(
  message: string,
  language: 'en' | 'et',
  context: ChatContext,
  onChunk: (chunk: string) => void
): Promise<string> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: buildSystemPrompt(language, context)
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
    
    return fullResponse;
  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    const errorMessage = language === 'et'
      ? 'Vabandust, tekkis tehniline viga. Palun proovi hiljem uuesti või võta ühendust info@estzone.eu.'
      : 'Sorry, a technical error occurred. Please try again later or contact info@estzone.eu.';
    throw new Error(errorMessage);
  }
}

export function searchProducts(products: Product[], query: string, language: 'en' | 'et'): Product[] {
  const lowerQuery = query.toLowerCase();
  const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 2);
  
  const platformKeywords: Record<string, string[]> = {
    'ps5': ['playstation', 'ps5', 'sony', 'dualsense', 'psvr'],
    'xbox': ['xbox', 'series x', 'series s', 'microsoft', 'game pass'],
    'switch': ['nintendo', 'switch', 'joy-con', 'joycon'],
    'vr': ['vr', 'virtual reality', 'quest', 'psvr', 'index', 'meta'],
    'headset': ['headset', 'headphones', 'kõrvaklapid', 'audio'],
    'controller': ['controller', 'pult', 'gamepad', 'joystick'],
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
