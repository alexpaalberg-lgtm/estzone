import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type RoomType = 'living_room' | 'gaming_room' | 'bedroom' | 'office' | 'studio';
type LightingStyle = 'natural' | 'ambient' | 'gaming_rgb' | 'warm' | 'cool';

interface VisualizationRequest {
  productId: string;
  roomType: RoomType;
  lightingStyle?: LightingStyle;
  additionalContext?: string;
}

interface ProductVisualization {
  id: string;
  productId: string;
  productName: string;
  roomType: RoomType;
  promptEn: string;
  promptEt: string;
  description: string;
  descriptionEt: string;
  suggestionsEn: string[];
  suggestionsEt: string[];
  createdAt: Date;
}

interface VisualizationAnalysis {
  timestamp: Date;
  visualizations: ProductVisualization[];
  roomTips: { en: string[]; et: string[] };
}

export async function generateProductVisualization(request: VisualizationRequest): Promise<ProductVisualization> {
  try {
    const product = await storage.getProduct(request.productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const roomDescriptions: Record<RoomType, { en: string; et: string }> = {
      living_room: { en: 'modern living room', et: 'modernne elutuba' },
      gaming_room: { en: 'dedicated gaming room', et: 'spetsiaalne mängutuba' },
      bedroom: { en: 'cozy bedroom', et: 'hubane magamistuba' },
      office: { en: 'home office', et: 'kodukontor' },
      studio: { en: 'streaming studio', et: 'voogesituse stuudio' },
    };

    const lightingDescriptions: Record<LightingStyle, { en: string; et: string }> = {
      natural: { en: 'natural daylight', et: 'looduslik päevavalgus' },
      ambient: { en: 'soft ambient lighting', et: 'pehme ümbertav valgus' },
      gaming_rgb: { en: 'RGB gaming lighting', et: 'RGB mänguvalgustus' },
      warm: { en: 'warm cozy lighting', et: 'soe hubane valgus' },
      cool: { en: 'cool modern lighting', et: 'jahe moodne valgus' },
    };

    const roomDesc = roomDescriptions[request.roomType];
    const lightingDesc = lightingDescriptions[request.lightingStyle || 'natural'];

    // Generate visualization prompt using AI
    const prompt = await generateVisualizationPrompt(
      product.nameEn,
      product.descriptionEn || '',
      roomDesc.en,
      lightingDesc.en,
      request.additionalContext
    );

    // Generate suggestions for the visualization
    const suggestions = await generateVisualizationSuggestions(
      product.nameEn,
      request.roomType
    );

    const visualization: ProductVisualization = {
      id: `viz-${Date.now()}`,
      productId: request.productId,
      productName: product.nameEn,
      roomType: request.roomType,
      promptEn: prompt.en,
      promptEt: prompt.et,
      description: `${product.nameEn} visualized in a ${roomDesc.en} with ${lightingDesc.en}`,
      descriptionEt: `${product.nameEt || product.nameEn} visualiseeritud ${roomDesc.et}s koos ${lightingDesc.et}`,
      suggestionsEn: suggestions.en,
      suggestionsEt: suggestions.et,
      createdAt: new Date(),
    };

    // Save visualization
    await storage.saveAIReport(`viz-${request.productId}-${Date.now()}`, visualization);

    return visualization;
  } catch (error) {
    console.error('Product visualization error:', error);
    // Return fallback visualization instead of throwing
    const roomDescriptions: Record<RoomType, { en: string; et: string }> = {
      living_room: { en: 'modern living room', et: 'modernne elutuba' },
      gaming_room: { en: 'dedicated gaming room', et: 'spetsiaalne mängutuba' },
      bedroom: { en: 'cozy bedroom', et: 'hubane magamistuba' },
      office: { en: 'home office', et: 'kodukontor' },
      studio: { en: 'streaming studio', et: 'voogesituse stuudio' },
    };
    const roomDesc = roomDescriptions[request.roomType] || roomDescriptions.gaming_room;
    
    return {
      id: `viz-fallback-${Date.now()}`,
      productId: request.productId,
      productName: 'Product',
      roomType: request.roomType,
      promptEn: `A gaming product displayed in a ${roomDesc.en} setting with professional lighting, minimalist modern design, 8K quality, product photography style`,
      promptEt: `Mänguritoode kuvatud ${roomDesc.et}s professionaalse valgustusega, minimalistlik modernne disain, 8K kvaliteet, toote fotograafia stiil`,
      description: 'Fallback visualization - AI unavailable',
      descriptionEt: 'Varuvisualiseerimine - AI pole saadaval',
      suggestionsEn: [
        'Place product as the focal point of the room',
        'Use complementary RGB lighting for gaming aesthetic',
        'Consider cable management for cleaner setup',
      ],
      suggestionsEt: [
        'Aseta toode ruumi fookuspunktiks',
        'Kasuta täiendavat RGB valgustust mänguritunde jaoks',
        'Kaalu kaablite haldamist puhtama ülesehituse jaoks',
      ],
      createdAt: new Date(),
    };
  }
}

async function generateVisualizationPrompt(
  productName: string,
  productDescription: string,
  roomType: string,
  lighting: string,
  additionalContext?: string
): Promise<{ en: string; et: string }> {
  try {
    const prompt = `You are creating a realistic product visualization prompt for AI image generation.

Product: ${productName}
Description: ${productDescription}
Room: ${roomType}
Lighting: ${lighting}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Create a detailed image generation prompt that would visualize this gaming product in the specified room setting.
Focus on:
- Realistic placement in the room
- Proper lighting and shadows
- Gaming/tech aesthetic
- Professional product photography style

Return JSON:
{
  "en": "Detailed English prompt for AI image generation (max 200 words)",
  "et": "Detailed Estonian prompt for AI image generation (max 200 words)"
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 600,
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      en: response.en || getDefaultPrompt(productName, roomType, 'en'),
      et: response.et || getDefaultPrompt(productName, roomType, 'et'),
    };
  } catch (error) {
    console.error('Error generating visualization prompt:', error);
    return {
      en: getDefaultPrompt(productName, roomType, 'en'),
      et: getDefaultPrompt(productName, roomType, 'et'),
    };
  }
}

function getDefaultPrompt(productName: string, roomType: string, lang: 'en' | 'et'): string {
  if (lang === 'et') {
    return `Fotorealistlik renderdus ${productName} tootest ${roomType}s. Professionaalne tootefoto, pehme valgustus, mänguseadistus, puhas moderenne disain, kõrge kvaliteediga detailid, 4K resolutsioon.`;
  }
  return `Photorealistic rendering of ${productName} in a ${roomType}. Professional product photography, soft lighting, gaming setup aesthetic, clean modern design, high-quality details, 4K resolution.`;
}

async function generateVisualizationSuggestions(
  productName: string,
  roomType: RoomType
): Promise<{ en: string[]; et: string[] }> {
  const defaultSuggestions: Record<RoomType, { en: string[]; et: string[] }> = {
    living_room: {
      en: [
        'Place near the TV for an entertainment center setup',
        'Consider cable management for a clean look',
        'Add ambient RGB lighting for gaming atmosphere',
      ],
      et: [
        'Aseta teleri lähedale meelelahutuskeskuse seadistuse jaoks',
        'Kaalu kaablite haldamist puhta ilme saavutamiseks',
        'Lisa ambient RGB valgustus mänguatmosfääri jaoks',
      ],
    },
    gaming_room: {
      en: [
        'Mount peripherals at ergonomic heights',
        'Use RGB lighting to match your setup theme',
        'Consider acoustic panels for better audio',
      ],
      et: [
        'Paigalda lisaseadmed ergonomilisele kõrgusele',
        'Kasuta RGB valgustust oma seadistuse teemaga sobimiseks',
        'Kaalu akustilisi paneele parema heli jaoks',
      ],
    },
    bedroom: {
      en: [
        'Position for comfortable viewing from bed',
        'Use warm lighting for relaxation',
        'Consider wireless options for clean aesthetics',
      ],
      et: [
        'Aseta mugavaks vaatamiseks voodist',
        'Kasuta sooja valgustust lõõgastumiseks',
        'Kaalu traadita valikuid puhta esteetika jaoks',
      ],
    },
    office: {
      en: [
        'Optimize for productivity and comfort',
        'Ensure proper lighting to reduce eye strain',
        'Keep setup minimal and organized',
      ],
      et: [
        'Optimeeri produktiivsuse ja mugavuse jaoks',
        'Taga õige valgustus silmade koormuse vähendamiseks',
        'Hoia seadistus minimaalne ja korras',
      ],
    },
    studio: {
      en: [
        'Position equipment for best camera angles',
        'Use professional lighting for streams',
        'Consider soundproofing for audio quality',
      ],
      et: [
        'Paiguta seadmed parimate kaameranurgade jaoks',
        'Kasuta professionaalset valgustust otseülekannete jaoks',
        'Kaalu heliisolatsiooni helikvaliteedi jaoks',
      ],
    },
  };

  return defaultSuggestions[roomType] || defaultSuggestions.gaming_room;
}

export async function getVisualizationHistory(productId: string): Promise<ProductVisualization[]> {
  try {
    // Get the most recent visualization for this product
    const latestViz = await storage.getAIReport(`viz-${productId}`);
    return latestViz ? [latestViz as ProductVisualization] : [];
  } catch (error) {
    console.error('Error fetching visualization history:', error);
    return [];
  }
}

export function getRoomTips(): { en: string[]; et: string[] } {
  return {
    en: [
      'Gaming room setups benefit most from RGB lighting effects',
      'Living rooms require consideration for family viewing angles',
      'Office setups should prioritize ergonomics and cable management',
      'Bedroom setups work best with wireless peripherals',
      'Streaming studios need proper lighting and acoustic treatment',
      'Consider furniture placement for optimal viewing distance',
      'Use contrasting colors to make products stand out',
    ],
    et: [
      'Mängutoa seadistused saavad kõige rohkem kasu RGB valgustuse efektidest',
      'Elutoad nõuavad perekonna vaatenurkade arvestamist',
      'Kontori seadistused peaksid eelistama ergonoomiat ja kaablite haldamist',
      'Magamistoa seadistused töötavad kõige paremini traadita lisaseadmetega',
      'Voogesituse stuudiod vajavad korralikku valgustust ja akustilist töötlust',
      'Kaalu mööbli paigutust optimaalse vaatamiskauguse jaoks',
      'Kasuta kontrastseid värve toodete esile tõstmiseks',
    ],
  };
}
