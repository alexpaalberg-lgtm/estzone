import OpenAI from 'openai';
import { storage } from '../storage';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type CampaignType = 'email' | 'social' | 'banner' | 'push';
type CampaignGoal = 'sales' | 'awareness' | 'retention' | 'winback';

interface CampaignContent {
  type: CampaignType;
  titleEn: string;
  titleEt: string;
  bodyEn: string;
  bodyEt: string;
  ctaEn: string;
  ctaEt: string;
  hashtagsEn?: string[];
  hashtagsEt?: string[];
}

interface GeneratedCampaign {
  id: string;
  name: string;
  goal: CampaignGoal;
  targetAudience: string;
  targetAudienceEt: string;
  contents: CampaignContent[];
  productIds?: string[];
  productNames?: string[];
  estimatedReach: number;
  suggestedBudget?: number;
  suggestedDuration: string;
  createdAt: Date;
}

interface CampaignAnalysis {
  timestamp: Date;
  campaignsGenerated: number;
  campaigns: GeneratedCampaign[];
  tips: string[];
  bestPractices: string[];
}

interface CampaignRequest {
  goal: CampaignGoal;
  productIds?: string[];
  occasion?: string;
  discount?: number;
  customPrompt?: string;
}

export async function generateCampaigns(request: CampaignRequest): Promise<CampaignAnalysis> {
  const campaigns: GeneratedCampaign[] = [];

  try {
    // Get featured products if no specific products requested
    let products = await storage.getProducts();
    if (request.productIds && request.productIds.length > 0) {
      products = products.filter(p => request.productIds!.includes(p.id));
    } else {
      products = products.filter(p => p.isFeatured && p.isActive).slice(0, 5);
    }

    // Generate campaign based on goal
    let campaign: GeneratedCampaign;

    switch (request.goal) {
      case 'sales':
        campaign = await generateSalesCampaign(products, request);
        break;
      case 'awareness':
        campaign = await generateAwarenessCampaign(products, request);
        break;
      case 'retention':
        campaign = await generateRetentionCampaign(products, request);
        break;
      case 'winback':
        campaign = await generateWinbackCampaign(products, request);
        break;
      default:
        campaign = await generateSalesCampaign(products, request);
    }

    campaigns.push(campaign);

    // Generate tips and best practices
    const tips = await generateCampaignTips(request.goal);

    const analysis: CampaignAnalysis = {
      timestamp: new Date(),
      campaignsGenerated: campaigns.length,
      campaigns,
      tips,
      bestPractices: getGoalBestPractices(request.goal),
    };

    // Save analysis
    await storage.saveAIReport(`campaigns-${new Date().toISOString().split('T')[0]}`, analysis);

    return analysis;
  } catch (error) {
    console.error('Campaign generation error:', error);
    // Return fallback analysis instead of throwing
    return {
      timestamp: new Date(),
      campaignsGenerated: 0,
      campaigns: [],
      tips: [
        'AI generation unavailable - using fallback mode / AI genereerimine pole saadaval - kasutatakse varuvariant',
        'Create compelling subject lines that highlight value / Loo veenvaid teemaridu, mis tõstavad väärtust esile',
        'Use urgency tactically for limited-time offers / Kasuta kiireloomulisust taktikaliselt piiratud aja pakkumistel',
        'Personalize messaging based on customer segments / Isikupärasta sõnumeid kliendisegmentide põhjal',
        'Check OpenAI API connectivity / Kontrolli OpenAI API ühendust',
      ],
      bestPractices: [
        'Test different messaging variations / Testi erinevaid sõnumivaratsioone',
        'Optimize send times for your audience / Optimeeri saatmisaegu oma publikule',
        'Include clear calls-to-action / Lisa selged üleskutsed tegevusele',
        'Maintain consistent brand voice across channels / Hoia ühtlast brändi häält kõigil kanalitel',
      ],
    };
  }
}

async function generateSalesCampaign(products: any[], request: CampaignRequest): Promise<GeneratedCampaign> {
  const productNames = products.map(p => p.nameEn).slice(0, 3);
  const discount = request.discount || 15;
  const occasion = request.occasion || 'Special Offer';

  const contents: CampaignContent[] = [];

  // Generate email content
  const emailContent = await generateContent('email', 'sales', {
    productNames,
    discount,
    occasion,
  });
  contents.push(emailContent);

  // Generate social media content
  const socialContent = await generateContent('social', 'sales', {
    productNames,
    discount,
    occasion,
  });
  contents.push(socialContent);

  // Generate push notification
  const pushContent = await generateContent('push', 'sales', {
    productNames,
    discount,
    occasion,
  });
  contents.push(pushContent);

  return {
    id: `campaign-sales-${Date.now()}`,
    name: `${occasion} - ${discount}% Off`,
    goal: 'sales',
    targetAudience: 'All customers and newsletter subscribers',
    targetAudienceEt: 'Kõik kliendid ja uudiskirja tellijad',
    contents,
    productIds: products.map(p => p.id),
    productNames,
    estimatedReach: 5000,
    suggestedBudget: 200,
    suggestedDuration: '7 days',
    createdAt: new Date(),
  };
}

async function generateAwarenessCampaign(products: any[], request: CampaignRequest): Promise<GeneratedCampaign> {
  const productNames = products.map(p => p.nameEn).slice(0, 3);

  const contents: CampaignContent[] = [];

  // Social media focused for awareness
  const socialContent = await generateContent('social', 'awareness', {
    productNames,
    brandName: 'EstZone',
  });
  contents.push(socialContent);

  // Banner ad
  const bannerContent = await generateContent('banner', 'awareness', {
    productNames,
    brandName: 'EstZone',
  });
  contents.push(bannerContent);

  return {
    id: `campaign-awareness-${Date.now()}`,
    name: 'Brand Awareness Campaign',
    goal: 'awareness',
    targetAudience: 'Gaming enthusiasts aged 18-35',
    targetAudienceEt: 'Mänguentusiastid vanuses 18-35',
    contents,
    productIds: products.map(p => p.id),
    productNames,
    estimatedReach: 10000,
    suggestedBudget: 500,
    suggestedDuration: '14 days',
    createdAt: new Date(),
  };
}

async function generateRetentionCampaign(products: any[], request: CampaignRequest): Promise<GeneratedCampaign> {
  const productNames = products.map(p => p.nameEn).slice(0, 3);

  const contents: CampaignContent[] = [];

  // VIP email for retention
  const emailContent = await generateContent('email', 'retention', {
    productNames,
    exclusiveOffer: true,
  });
  contents.push(emailContent);

  return {
    id: `campaign-retention-${Date.now()}`,
    name: 'Customer Loyalty Campaign',
    goal: 'retention',
    targetAudience: 'Customers with 2+ previous orders',
    targetAudienceEt: 'Kliendid 2+ eelmise tellimusega',
    contents,
    productIds: products.map(p => p.id),
    productNames,
    estimatedReach: 1500,
    suggestedDuration: '30 days',
    createdAt: new Date(),
  };
}

async function generateWinbackCampaign(products: any[], request: CampaignRequest): Promise<GeneratedCampaign> {
  const productNames = products.map(p => p.nameEn).slice(0, 3);
  const discount = request.discount || 20;

  const contents: CampaignContent[] = [];

  // Win-back email
  const emailContent = await generateContent('email', 'winback', {
    productNames,
    discount,
  });
  contents.push(emailContent);

  // Push notification
  const pushContent = await generateContent('push', 'winback', {
    productNames,
    discount,
  });
  contents.push(pushContent);

  return {
    id: `campaign-winback-${Date.now()}`,
    name: 'Customer Win-Back Campaign',
    goal: 'winback',
    targetAudience: 'Inactive customers (no purchase in 60+ days)',
    targetAudienceEt: 'Passiivsed kliendid (pole oste 60+ päeva)',
    contents,
    productIds: products.map(p => p.id),
    productNames,
    estimatedReach: 800,
    suggestedDuration: '14 days',
    createdAt: new Date(),
  };
}

async function generateContent(type: CampaignType, goal: CampaignGoal, context: any): Promise<CampaignContent> {
  try {
    const prompt = buildContentPrompt(type, goal, context);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 800,
      temperature: 0.8,
    });

    const response = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      type,
      titleEn: response.titleEn || getDefaultContent(type, goal).titleEn,
      titleEt: response.titleEt || getDefaultContent(type, goal).titleEt,
      bodyEn: response.bodyEn || getDefaultContent(type, goal).bodyEn,
      bodyEt: response.bodyEt || getDefaultContent(type, goal).bodyEt,
      ctaEn: response.ctaEn || getDefaultContent(type, goal).ctaEn,
      ctaEt: response.ctaEt || getDefaultContent(type, goal).ctaEt,
      hashtagsEn: response.hashtagsEn,
      hashtagsEt: response.hashtagsEt,
    };
  } catch (error) {
    console.error('Content generation error:', error);
    return getDefaultContent(type, goal);
  }
}

function buildContentPrompt(type: CampaignType, goal: CampaignGoal, context: any): string {
  const typeInstructions = {
    email: 'Create an email with subject line and body. Keep body under 150 words.',
    social: 'Create a social media post. Keep under 280 characters. Include 3-5 relevant hashtags.',
    banner: 'Create short banner ad copy. Title under 10 words, body under 20 words.',
    push: 'Create a push notification. Title under 5 words, body under 50 characters.',
  };

  const goalContext = {
    sales: `Promote a ${context.discount || 15}% discount on gaming products. Products: ${context.productNames?.join(', ') || 'gaming gear'}`,
    awareness: `Introduce EstZone as the premier gaming store in Estonia/Baltic region. Highlight: ${context.productNames?.join(', ') || 'premium gaming products'}`,
    retention: 'Thank loyal customers and offer exclusive VIP benefits',
    winback: `Win back inactive customers with a special ${context.discount || 20}% comeback offer`,
  };

  return `You are a marketing copywriter for EstZone, a premium gaming e-commerce store in Estonia.
Create ${type} content in BOTH English and Estonian for a ${goal} campaign.

${typeInstructions[type]}
${goalContext[goal]}

Return JSON:
{
  "titleEn": "English title/subject",
  "titleEt": "Estonian title/subject",
  "bodyEn": "English body text",
  "bodyEt": "Estonian body text",
  "ctaEn": "English call-to-action",
  "ctaEt": "Estonian call-to-action"${type === 'social' ? ',\n  "hashtagsEn": ["hashtag1", "hashtag2"],\n  "hashtagsEt": ["hashtag1", "hashtag2"]' : ''}
}

Make it engaging, gaming-focused, and culturally appropriate for Estonian audience.`;
}

function getDefaultContent(type: CampaignType, goal: CampaignGoal): CampaignContent {
  const defaults: Record<CampaignGoal, Record<CampaignType, CampaignContent>> = {
    sales: {
      email: {
        type: 'email',
        titleEn: 'Special Gaming Sale - Save Big!',
        titleEt: 'Eriline mängude allahindlus - Säästa suurelt!',
        bodyEn: 'Don\'t miss our exclusive gaming sale! Top products at unbeatable prices. Limited time offer.',
        bodyEt: 'Ära jäta kasutamata meie eksklusiivset mängude allahindlust! Tipptasemel tooted võitmatu hinnaga. Piiratud pakkumine.',
        ctaEn: 'Shop Now',
        ctaEt: 'Osta kohe',
      },
      social: {
        type: 'social',
        titleEn: 'Game On! 🎮',
        titleEt: 'Mäng käib! 🎮',
        bodyEn: 'Level up your gaming setup! Special deals on premium gear.',
        bodyEt: 'Vii oma mänguseadistus järgmisele tasemele! Eripakkumised premium varustusel.',
        ctaEn: 'Shop Now',
        ctaEt: 'Osta kohe',
        hashtagsEn: ['#Gaming', '#EstZone', '#GamerLife', '#SaleAlert'],
        hashtagsEt: ['#Mängud', '#EstZone', '#Mängijad', '#Allahindlus'],
      },
      banner: {
        type: 'banner',
        titleEn: 'Gaming Sale!',
        titleEt: 'Mängude müük!',
        bodyEn: 'Up to 20% off premium gaming gear',
        bodyEt: 'Kuni 20% soodustust mängutarvetelt',
        ctaEn: 'Shop',
        ctaEt: 'Osta',
      },
      push: {
        type: 'push',
        titleEn: 'Sale Alert! 🔥',
        titleEt: 'Allahindlus! 🔥',
        bodyEn: 'Gaming deals are live now!',
        bodyEt: 'Mängupakkumised on nüüd saadaval!',
        ctaEn: 'View',
        ctaEt: 'Vaata',
      },
    },
    awareness: {
      email: {
        type: 'email',
        titleEn: 'Welcome to EstZone - Premium Gaming',
        titleEt: 'Tere tulemast EstZone - Premium mängimine',
        bodyEn: 'Discover Estonia\'s premier destination for gaming gear.',
        bodyEt: 'Avasta Eesti parim mänguvarustuse sihtkoht.',
        ctaEn: 'Explore',
        ctaEt: 'Avasta',
      },
      social: {
        type: 'social',
        titleEn: 'Level Up With EstZone',
        titleEt: 'Tõuse tasemele EstZone\'iga',
        bodyEn: 'Premium gaming gear, Baltic\'s best prices.',
        bodyEt: 'Premium mänguvarustus, Baltikumi parimad hinnad.',
        ctaEn: 'Learn More',
        ctaEt: 'Loe lisaks',
        hashtagsEn: ['#EstZone', '#Gaming', '#Estonia'],
        hashtagsEt: ['#EstZone', '#Mängud', '#Eesti'],
      },
      banner: {
        type: 'banner',
        titleEn: 'EstZone Gaming',
        titleEt: 'EstZone Mängud',
        bodyEn: 'Your premium gaming destination',
        bodyEt: 'Sinu premium mängude sihtkoht',
        ctaEn: 'Visit',
        ctaEt: 'Külasta',
      },
      push: {
        type: 'push',
        titleEn: 'EstZone 🎮',
        titleEt: 'EstZone 🎮',
        bodyEn: 'Premium gaming gear awaits',
        bodyEt: 'Premium mänguvarustus ootab',
        ctaEn: 'Open',
        ctaEt: 'Ava',
      },
    },
    retention: {
      email: {
        type: 'email',
        titleEn: 'VIP Access: Exclusive Rewards Await',
        titleEt: 'VIP ligipääs: Eksklusiivsed auhinnad ootavad',
        bodyEn: 'Thank you for being a valued customer. Enjoy exclusive VIP benefits.',
        bodyEt: 'Täname, et oled väärtuslik klient. Naudi eksklusiivseid VIP hüvesid.',
        ctaEn: 'Claim Reward',
        ctaEt: 'Lunasta auhind',
      },
      social: {
        type: 'social',
        titleEn: 'VIP Gaming Club',
        titleEt: 'VIP Mänguklubi',
        bodyEn: 'Exclusive rewards for our loyal gamers.',
        bodyEt: 'Eksklusiivsed auhinnad meie lojaalsetele mängijatele.',
        ctaEn: 'Join',
        ctaEt: 'Liitu',
        hashtagsEn: ['#VIP', '#EstZone', '#Loyalty'],
        hashtagsEt: ['#VIP', '#EstZone', '#Lojaalsus'],
      },
      banner: {
        type: 'banner',
        titleEn: 'VIP Rewards',
        titleEt: 'VIP auhinnad',
        bodyEn: 'Exclusive perks for loyal customers',
        bodyEt: 'Eksklusiivsed hüved lojaalsetele',
        ctaEn: 'Claim',
        ctaEt: 'Lunasta',
      },
      push: {
        type: 'push',
        titleEn: 'VIP Reward 🌟',
        titleEt: 'VIP auhind 🌟',
        bodyEn: 'Exclusive offer just for you!',
        bodyEt: 'Eksklusiivne pakkumine just sulle!',
        ctaEn: 'View',
        ctaEt: 'Vaata',
      },
    },
    winback: {
      email: {
        type: 'email',
        titleEn: 'We Miss You! Come Back for 20% Off',
        titleEt: 'Me igatseme sind! Tule tagasi 20% soodsamalt',
        bodyEn: 'It\'s been a while. Here\'s a special comeback offer just for you.',
        bodyEt: 'On möödas tükk aega. Siin on eriline tagasituleku pakkumine just sulle.',
        ctaEn: 'Shop Now',
        ctaEt: 'Osta kohe',
      },
      social: {
        type: 'social',
        titleEn: 'Ready to Game Again?',
        titleEt: 'Valmis jälle mängima?',
        bodyEn: 'Special comeback offer waiting for you!',
        bodyEt: 'Eriline tagasituleku pakkumine ootab sind!',
        ctaEn: 'Claim',
        ctaEt: 'Lunasta',
        hashtagsEn: ['#Comeback', '#Gaming', '#EstZone'],
        hashtagsEt: ['#Tagasitulek', '#Mängud', '#EstZone'],
      },
      banner: {
        type: 'banner',
        titleEn: 'Welcome Back!',
        titleEt: 'Tere tulemast tagasi!',
        bodyEn: '20% off your next order',
        bodyEt: '20% soodsamalt järgmiselt tellimuselt',
        ctaEn: 'Return',
        ctaEt: 'Naase',
      },
      push: {
        type: 'push',
        titleEn: 'Miss Gaming? 🎮',
        titleEt: 'Igatsed mänge? 🎮',
        bodyEn: 'Comeback offer: 20% off!',
        bodyEt: 'Tagasituleku pakkumine: 20% soodsamalt!',
        ctaEn: 'Shop',
        ctaEt: 'Osta',
      },
    },
  };

  return defaults[goal]?.[type] || defaults.sales.email;
}

async function generateCampaignTips(goal: CampaignGoal): Promise<string[]> {
  const defaultTips: Record<CampaignGoal, string[]> = {
    sales: [
      'Use urgency in your messaging - limited time offers perform better',
      'A/B test different discount percentages to find optimal conversion',
      'Send sales emails on Thursday evenings for best engagement',
    ],
    awareness: [
      'Focus on visual content and brand storytelling',
      'Partner with gaming influencers for wider reach',
      'Use video content for higher engagement rates',
    ],
    retention: [
      'Personalize messages with customer\'s name and purchase history',
      'Offer exclusive early access to new products',
      'Create a tiered loyalty program for repeat customers',
    ],
    winback: [
      'Start with a gentle reminder before aggressive discounting',
      'Highlight what\'s new since their last visit',
      'Use fear of missing out (FOMO) sparingly but effectively',
    ],
  };

  return defaultTips[goal] || defaultTips.sales;
}

function getGoalBestPractices(goal: CampaignGoal): string[] {
  const practices: Record<CampaignGoal, string[]> = {
    sales: [
      'Clear value proposition in the first line',
      'Mobile-optimized email design',
      'Strong, action-oriented CTA buttons',
      'Include product images for visual impact',
    ],
    awareness: [
      'Consistent branding across all channels',
      'Focus on benefits, not just features',
      'Use social proof and testimonials',
      'Create shareable content',
    ],
    retention: [
      'Recognize and thank loyal customers',
      'Offer genuine value, not just discounts',
      'Create exclusive experiences',
      'Maintain regular communication cadence',
    ],
    winback: [
      'Acknowledge the absence genuinely',
      'Offer a clear incentive to return',
      'Showcase improvements since last visit',
      'Make it easy to re-engage',
    ],
  };

  return practices[goal] || practices.sales;
}

export async function getLatestCampaigns(): Promise<CampaignAnalysis | null> {
  const today = new Date().toISOString().split('T')[0];
  return storage.getAIReport(`campaigns-${today}`);
}
