import OpenAI from "openai";
import type { Product, Order } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "gpt-5";

interface ChatContext {
  products?: Product[];
  order?: Order;
  sessionHistory?: Array<{ role: string; content: string }>;
}

// Detect language from text
export function detectLanguage(text: string): { language: 'en' | 'et'; confidence: number } {
  const estonianWords = ['on', 'ja', 'ei', 'see', 'kui', 'võib', 'saab', 'kas', 'mis', 'kus', 'kes', 'mida', 'kuidas', 'miks', 'mängu', 'toode', 'tellimus', 'soodustus'];
  const englishWords = ['the', 'is', 'and', 'no', 'this', 'if', 'can', 'get', 'what', 'where', 'who', 'how', 'why', 'game', 'product', 'order', 'sale'];
  
  const words = text.toLowerCase().split(/\s+/);
  let estonianScore = 0;
  let englishScore = 0;
  
  words.forEach(word => {
    if (estonianWords.includes(word)) estonianScore++;
    if (englishWords.includes(word)) englishScore++;
  });
  
  const total = estonianScore + englishScore;
  if (total === 0) {
    // Default to English if no matches
    return { language: 'en', confidence: 0.5 };
  }
  
  if (estonianScore > englishScore) {
    return { language: 'et', confidence: Math.min(estonianScore / total, 1) };
  } else {
    return { language: 'en', confidence: Math.min(englishScore / total, 1) };
  }
}

// Build system prompt for bilingual support
function buildSystemPrompt(language: 'en' | 'et', context: ChatContext): string {
  const basePrompt = language === 'et' 
    ? `Sa oled EstZone OÜ virtuaalne klienditugi assistent. EstZone on Eesti mängutarvikute veebipood, mis asub aadressil Pärnu mnt 31, Tallinn.

Sinu ülesanded:
- Aita kliente toodete leidmisel ja soovitamisel
- Vasta küsimustele tellimuste, tarnete ja makseviiside kohta
- Paku lahendusi ja aita probleemide korral
- Ole sõbralik, professionaalne ja abivalmis
- Vasta ALATI eesti keeles

Meie teenused:
- Tarneviisid: Omniva (2-3 tööpäeva, €4.99) ja DPD (1-2 tööpäeva, €5.99)
- Makseviisid: Stripe (krediitkaart) ja Paysera (pangalink)
- Tagastuspoliitika: 14 päeva tagastusõigus`
    : `You are a virtual customer support assistant for EstZone OÜ. EstZone is an Estonian gaming accessories online store located at Pärnu mnt 31, Tallinn.

Your tasks:
- Help customers find and recommend products
- Answer questions about orders, shipping, and payment methods
- Provide solutions and help with issues
- Be friendly, professional, and helpful
- ALWAYS respond in English

Our services:
- Shipping: Omniva (2-3 business days, €4.99) and DPD (1-2 business days, €5.99)
- Payment methods: Stripe (credit card) and Paysera (bank link)
- Return policy: 14-day return right`;

  let contextInfo = '';
  
  if (context.products && context.products.length > 0) {
    const productList = context.products.slice(0, 5).map(p => {
      const name = language === 'et' ? p.nameEt : p.nameEn;
      const price = parseFloat(p.price);
      const salePrice = p.salePrice ? parseFloat(p.salePrice) : null;
      const stock = p.stock > 0 ? (language === 'et' ? 'Laos' : 'In stock') : (language === 'et' ? 'Otsas' : 'Out of stock');
      
      return `- ${name}: €${salePrice || price} (${stock})`;
    }).join('\n');
    
    contextInfo += language === 'et'
      ? `\n\nAsjakohased tooted:\n${productList}`
      : `\n\nRelevant products:\n${productList}`;
  }
  
  if (context.order) {
    const orderInfo = language === 'et'
      ? `\n\nTellimus #${context.order.orderNumber}:\n- Staatus: ${context.order.status}\n- Kokku: €${context.order.total}\n- Tarne: ${context.order.shippingMethod}`
      : `\n\nOrder #${context.order.orderNumber}:\n- Status: ${context.order.status}\n- Total: €${context.order.total}\n- Shipping: ${context.order.shippingMethod}`;
    contextInfo += orderInfo;
  }
  
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
  
  // Add conversation history (last 10 messages)
  if (context.sessionHistory) {
    const recentHistory = context.sessionHistory.slice(-10);
    messages.push(...recentHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })));
  }
  
  // Add current user message
  messages.push({
    role: "user",
    content: message
  });
  
  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      max_completion_tokens: 1024,
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
      ? 'Vabandust, tekkis tehniline viga. Palun proovi hiljem uuesti.'
      : 'Sorry, a technical error occurred. Please try again later.';
    throw new Error(errorMessage);
  }
}

// Search products by query
export function searchProducts(products: Product[], query: string, language: 'en' | 'et'): Product[] {
  const lowerQuery = query.toLowerCase();
  
  return products.filter(p => {
    const name = (language === 'et' ? p.nameEt : p.nameEn).toLowerCase();
    const desc = (language === 'et' ? p.descriptionEt : p.descriptionEn)?.toLowerCase() || '';
    const sku = p.sku.toLowerCase();
    
    return name.includes(lowerQuery) || desc.includes(lowerQuery) || sku.includes(lowerQuery);
  }).slice(0, 10); // Limit to 10 results
}
