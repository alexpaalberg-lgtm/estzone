import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type InfluencerTier = 'nano' | 'micro' | 'mid' | 'macro' | 'mega';
type Platform = 'youtube' | 'twitch' | 'instagram' | 'tiktok' | 'twitter';

interface InfluencerProfile {
  id: string;
  name: string;
  platform: Platform;
  tier: InfluencerTier;
  niche: string;
  nicheEt: string;
  estimatedReach: number;
  engagementRate?: number;
  contentType: string;
  contentTypeEt: string;
  relevanceScore: number;
  notes: string;
}

interface OutreachPitch {
  influencerId: string;
  influencerName: string;
  subjectEn: string;
  subjectEt: string;
  messageEn: string;
  messageEt: string;
  proposedCollaboration: string;
  proposedCollaborationEt: string;
  suggestedProducts: string[];
  estimatedValue: number;
}

interface InfluencerAnalysis {
  timestamp: Date;
  totalInfluencers: number;
  influencers: InfluencerProfile[];
  pitches: OutreachPitch[];
  strategies: string[];
  strategiesEt: string[];
  budgetRecommendation: {
    min: number;
    max: number;
    breakdown: { tier: string; budget: number }[];
  };
}

interface OutreachRequest {
  targetPlatforms?: Platform[];
  budget?: number;
  productCategory?: string;
  generatePitches?: boolean;
}

export async function generateInfluencerOutreach(request: OutreachRequest = {}): Promise<InfluencerAnalysis> {
  try {
    const products = await storage.getProducts();
    const featuredProducts = products.filter(p => p.isFeatured && p.isActive).slice(0, 10);
    
    // Generate influencer profiles
    const influencers = await generateInfluencerProfiles(request, featuredProducts);
    
    // Generate pitches if requested
    let pitches: OutreachPitch[] = [];
    if (request.generatePitches !== false) {
      pitches = await generatePitches(influencers.slice(0, 5), featuredProducts);
    }

    // Generate strategies
    const strategies = generateStrategies(request.budget);

    // Calculate budget recommendation
    const budgetRecommendation = calculateBudgetRecommendation(influencers, request.budget);

    const analysis: InfluencerAnalysis = {
      timestamp: new Date(),
      totalInfluencers: influencers.length,
      influencers,
      pitches,
      strategies: strategies.en,
      strategiesEt: strategies.et,
      budgetRecommendation,
    };

    // Save analysis
    await storage.saveAIReport(`influencers-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('Influencer outreach error:', error);
    // Return fallback analysis instead of throwing
    return {
      timestamp: new Date(),
      totalInfluencers: 0,
      influencers: [],
      pitches: [],
      strategies: [
        'AI analysis unavailable - using fallback mode',
        'Start with micro-influencers in the Baltic gaming community',
        'Focus on authentic content creators',
        'Check OpenAI API connectivity',
      ],
      strategiesEt: [
        'AI analüüs pole saadaval - kasutatakse varuvariant',
        'Alusta Balti mänguringkonna mikroinfluenceritega',
        'Keskendu autentsete sisuloomijatele',
        'Kontrolli OpenAI API ühendust',
      ],
      budgetRecommendation: {
        min: 500,
        max: 2000,
        breakdown: [
          { tier: 'nano', budget: 100 },
          { tier: 'micro', budget: 300 },
          { tier: 'mid', budget: 600 },
        ],
      },
    };
  }
}

async function generateInfluencerProfiles(request: OutreachRequest, products: any[]): Promise<InfluencerProfile[]> {
  const platforms = request.targetPlatforms || ['youtube', 'twitch', 'instagram', 'tiktok'];
  const productNames = products.map(p => p.nameEn).slice(0, 5).join(', ');

  try {
    const prompt = `You are a gaming influencer marketing expert for EstZone, a gaming e-commerce store in Estonia/Baltic region.

Generate 10 realistic gaming influencer profiles suitable for promoting products like: ${productNames}

For each influencer, include:
- Realistic name (mix of Estonian and international names)
- Platform (${platforms.join(', ')})
- Tier (nano: <10k, micro: 10k-50k, mid: 50k-500k, macro: 500k-1M, mega: >1M)
- Gaming niche (e.g., FPS games, RPGs, hardware reviews, esports)
- Estimated reach (followers count)
- Content type (e.g., reviews, let's plays, tutorials)
- Relevance score (1-100) for gaming gear promotion

Return JSON array:
[{
  "name": "Influencer Name",
  "platform": "youtube",
  "tier": "micro",
  "niche": "FPS gaming and hardware reviews",
  "nicheEt": "FPS mängud ja riistvara ülevaated",
  "estimatedReach": 45000,
  "engagementRate": 4.5,
  "contentType": "Hardware reviews and gameplay",
  "contentTypeEt": "Riistvara ülevaated ja mängimine",
  "relevanceScore": 85,
  "notes": "Good engagement with Baltic audience"
}]

Focus on Baltic region relevance and gaming content creators.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
      temperature: 0.8,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    const influencers = response.influencers || response || [];

    return (Array.isArray(influencers) ? influencers : []).map((inf: any, index: number) => ({
      id: `inf-${Date.now()}-${index}`,
      name: inf.name || `Gaming Creator ${index + 1}`,
      platform: inf.platform || 'youtube',
      tier: inf.tier || 'micro',
      niche: inf.niche || 'Gaming',
      nicheEt: inf.nicheEt || 'Mängimine',
      estimatedReach: inf.estimatedReach || 10000,
      engagementRate: inf.engagementRate,
      contentType: inf.contentType || 'Gaming content',
      contentTypeEt: inf.contentTypeEt || 'Mängusisu',
      relevanceScore: inf.relevanceScore || 70,
      notes: inf.notes || '',
    }));
  } catch (error) {
    console.error('Error generating influencer profiles:', error);
    return getDefaultInfluencers();
  }
}

async function generatePitches(influencers: InfluencerProfile[], products: any[]): Promise<OutreachPitch[]> {
  const pitches: OutreachPitch[] = [];
  const productNames = products.map(p => p.nameEn).slice(0, 3);

  for (const influencer of influencers) {
    try {
      const prompt = `Create an outreach pitch for gaming influencer "${influencer.name}" (${influencer.platform}, ${influencer.niche}) to promote EstZone gaming products: ${productNames.join(', ')}.

Return JSON:
{
  "subjectEn": "Short email subject in English",
  "subjectEt": "Short email subject in Estonian",
  "messageEn": "Personalized outreach message (150 words max) in English",
  "messageEt": "Personalized outreach message (150 words max) in Estonian",
  "proposedCollaboration": "Type of collaboration in English",
  "proposedCollaborationEt": "Type of collaboration in Estonian",
  "suggestedProducts": ["product1", "product2"],
  "estimatedValue": 500
}

Be professional, personalized, and mention specific value propositions.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 800,
        temperature: 0.7,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      
      pitches.push({
        influencerId: influencer.id,
        influencerName: influencer.name,
        subjectEn: response.subjectEn || `Collaboration Opportunity with EstZone`,
        subjectEt: response.subjectEt || `Koostöövõimalus EstZone'iga`,
        messageEn: response.messageEn || getDefaultPitchMessage(influencer, 'en'),
        messageEt: response.messageEt || getDefaultPitchMessage(influencer, 'et'),
        proposedCollaboration: response.proposedCollaboration || 'Product review and giveaway',
        proposedCollaborationEt: response.proposedCollaborationEt || 'Toote ülevaade ja loosimäng',
        suggestedProducts: response.suggestedProducts || productNames,
        estimatedValue: response.estimatedValue || calculateInfluencerValue(influencer),
      });
    } catch (error) {
      console.error('Error generating pitch for:', influencer.name, error);
      pitches.push({
        influencerId: influencer.id,
        influencerName: influencer.name,
        subjectEn: `Collaboration Opportunity with EstZone`,
        subjectEt: `Koostöövõimalus EstZone'iga`,
        messageEn: getDefaultPitchMessage(influencer, 'en'),
        messageEt: getDefaultPitchMessage(influencer, 'et'),
        proposedCollaboration: 'Product review and giveaway',
        proposedCollaborationEt: 'Toote ülevaade ja loosimäng',
        suggestedProducts: productNames,
        estimatedValue: calculateInfluencerValue(influencer),
      });
    }
  }

  return pitches;
}

function getDefaultPitchMessage(influencer: InfluencerProfile, lang: 'en' | 'et'): string {
  if (lang === 'et') {
    return `Tere ${influencer.name}!

Oleme EstZone - juhtiv mängutarvikute e-pood Baltimaades. Meile meeldib väga sinu sisu ${influencer.nicheEt} valdkonnas ja usume, et meie tooted sobivad ideaalselt sinu publikule.

Pakume eksklusiivset koostööd, mis sisaldab tasuta tooteid ülevaatamiseks ja affiliate programmi atraktiivse komisjoniga.

Kas oleksid huvitatud vestlemisest?

Parimate soovidega,
EstZone meeskond`;
  }

  return `Hi ${influencer.name}!

We're EstZone - the leading gaming gear e-shop in the Baltic region. We love your content in the ${influencer.niche} space and believe our products would be a perfect fit for your audience.

We're offering an exclusive collaboration that includes free products for review and an attractive affiliate commission.

Would you be interested in a conversation?

Best regards,
The EstZone Team`;
}

function calculateInfluencerValue(influencer: InfluencerProfile): number {
  const tierValues: Record<InfluencerTier, number> = {
    nano: 100,
    micro: 300,
    mid: 1000,
    macro: 3000,
    mega: 10000,
  };
  return tierValues[influencer.tier] || 500;
}

function generateStrategies(budget?: number): { en: string[]; et: string[] } {
  const baseStrategies = {
    en: [
      'Start with micro-influencers for better engagement and lower costs',
      'Focus on gaming hardware reviewers for product credibility',
      'Offer affiliate codes for performance-based partnerships',
      'Create unboxing and first impression video campaigns',
      'Target Baltic-region creators for local market penetration',
      'Combine sponsored content with giveaways for maximum reach',
      'Build long-term ambassador relationships with top performers',
    ],
    et: [
      'Alusta mikro-influenceritega parema kaasamise ja madalama hinna jaoks',
      'Keskendu mänguriistvara arvustajatele toote usaldusväärsuse jaoks',
      'Paku affiliate koode tulemuspõhiste partnerluste jaoks',
      'Loo unboxing ja esmamulje videokampaaniaid',
      'Sihi Balti piirkonna loojaleid kohaliku turu jaoks',
      'Kombineeri sponsoreeritud sisu loosimängudega maksimaalse ulatuse jaoks',
      'Ehita pikaajalisi saadikusuhteid parimate tegijatega',
    ],
  };

  if (budget && budget < 500) {
    baseStrategies.en.unshift('Focus exclusively on nano and micro-influencers');
    baseStrategies.et.unshift('Keskendu ainult nano ja mikro-influenceritele');
  }

  return baseStrategies;
}

function calculateBudgetRecommendation(
  influencers: InfluencerProfile[],
  requestedBudget?: number
): { min: number; max: number; breakdown: { tier: string; budget: number }[] } {
  const tierCounts = influencers.reduce((acc, inf) => {
    acc[inf.tier] = (acc[inf.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tierBudgets: Record<InfluencerTier, { min: number; max: number }> = {
    nano: { min: 50, max: 150 },
    micro: { min: 200, max: 500 },
    mid: { min: 500, max: 2000 },
    macro: { min: 2000, max: 5000 },
    mega: { min: 5000, max: 20000 },
  };

  let minTotal = 0;
  let maxTotal = 0;
  const breakdown: { tier: string; budget: number }[] = [];

  for (const [tier, count] of Object.entries(tierCounts)) {
    const budgets = tierBudgets[tier as InfluencerTier] || { min: 100, max: 500 };
    minTotal += budgets.min * count;
    maxTotal += budgets.max * count;
    breakdown.push({
      tier: tier.charAt(0).toUpperCase() + tier.slice(1),
      budget: Math.round((budgets.min + budgets.max) / 2 * count),
    });
  }

  return {
    min: requestedBudget ? Math.min(requestedBudget, minTotal) : minTotal,
    max: requestedBudget ? Math.min(requestedBudget * 2, maxTotal) : maxTotal,
    breakdown,
  };
}

function getDefaultInfluencers(): InfluencerProfile[] {
  return [
    {
      id: 'inf-default-1',
      name: 'Martin Gaming EE',
      platform: 'youtube',
      tier: 'micro',
      niche: 'PC gaming and hardware reviews',
      nicheEt: 'PC mängud ja riistvara ülevaated',
      estimatedReach: 35000,
      engagementRate: 4.2,
      contentType: 'Reviews and unboxing',
      contentTypeEt: 'Ülevaated ja avamine',
      relevanceScore: 88,
      notes: 'Strong Estonian following',
    },
    {
      id: 'inf-default-2',
      name: 'Baltic Game Zone',
      platform: 'twitch',
      tier: 'mid',
      niche: 'Live streaming and esports',
      nicheEt: 'Otseülekanded ja esport',
      estimatedReach: 120000,
      engagementRate: 3.8,
      contentType: 'Live gameplay and tournaments',
      contentTypeEt: 'Otsemäng ja turniirid',
      relevanceScore: 82,
      notes: 'Regional esports coverage',
    },
    {
      id: 'inf-default-3',
      name: 'TechReview Tallinn',
      platform: 'youtube',
      tier: 'micro',
      niche: 'Tech and gaming accessories',
      nicheEt: 'Tehnoloogia ja mängutarvikud',
      estimatedReach: 28000,
      engagementRate: 5.1,
      contentType: 'Product reviews',
      contentTypeEt: 'Tooteülevaated',
      relevanceScore: 91,
      notes: 'High engagement rate',
    },
  ];
}

export async function getLatestInfluencerAnalysis(): Promise<InfluencerAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`influencers-${today}`);
}
