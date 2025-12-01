import OpenAI from 'openai';
import { Resend } from 'resend';
import { storage } from '../storage';
import type { Product, NewsletterSubscriber } from '@shared/schema';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'EstZone <orders@estzone.eu>';
const STORE_URL = 'https://www.estzone.eu';

export interface EmailCampaign {
  id: string;
  name: string;
  subjectEn: string;
  subjectEt: string;
  bodyEn: string;
  bodyEt: string;
  type: 'promotional' | 'newsletter' | 'announcement' | 'winback' | 'abandoned_cart';
  targetAudience: 'all' | 'active' | 'inactive' | 'new';
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  createdAt: Date;
  products?: Product[];
  discount?: number;
}

export interface CampaignGenerationRequest {
  type: 'promotional' | 'newsletter' | 'announcement' | 'winback' | 'abandoned_cart';
  occasion?: string;
  discount?: number;
  productIds?: string[];
  customMessage?: string;
}

export interface EmailSendResult {
  totalSent: number;
  successful: number;
  failed: number;
  errors: string[];
}

const emailStyles = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 40px 30px;',
  header: 'text-align: center; margin-bottom: 40px;',
  logo: 'font-size: 32px; font-weight: bold; color: #DAA520; margin-bottom: 10px;',
  title: 'font-size: 24px; font-weight: 600; color: #ffffff; margin: 0 0 10px 0;',
  subtitle: 'font-size: 16px; color: #a3a3a3; margin: 0;',
  section: 'background-color: #171717; border-radius: 12px; padding: 24px; margin-bottom: 20px;',
  text: 'font-size: 15px; color: #d4d4d4; line-height: 1.6; margin: 0 0 12px 0;',
  highlight: 'color: #ffffff; font-weight: 600;',
  goldText: 'color: #DAA520;',
  button: 'display: inline-block; background-color: #DAA520; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;',
  productCard: 'background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin: 10px 0; display: flex; align-items: center;',
  productImage: 'width: 80px; height: 80px; object-fit: cover; border-radius: 6px; margin-right: 16px;',
  productName: 'color: #ffffff; font-weight: 600; font-size: 14px; margin: 0 0 4px 0;',
  productPrice: 'color: #DAA520; font-weight: bold; font-size: 16px;',
  salePrice: 'color: #ef4444; text-decoration: line-through; font-size: 12px; margin-right: 8px;',
  footer: 'text-align: center; padding-top: 30px; border-top: 1px solid #262626; margin-top: 30px;',
  footerText: 'font-size: 13px; color: #737373; margin: 0 0 8px 0;',
  unsubscribe: 'color: #a3a3a3; font-size: 11px; text-decoration: underline;',
};

export async function generateEmailCampaign(request: CampaignGenerationRequest): Promise<EmailCampaign> {
  try {
    let products: Product[] = [];
    if (request.productIds && request.productIds.length > 0) {
      for (const id of request.productIds) {
        const product = await storage.getProduct(id);
        if (product) products.push(product);
      }
    } else {
      const allProducts = await storage.getProducts({ featured: true });
      products = allProducts.slice(0, 4);
    }

    const productNames = products.map(p => p.nameEn).join(', ');
    const typeDescriptions: Record<string, string> = {
      promotional: 'a sales promotion email with urgency and excitement',
      newsletter: 'an engaging newsletter with gaming news and updates',
      announcement: 'an important announcement about new products or store updates',
      winback: 'a win-back email to re-engage inactive customers',
      abandoned_cart: 'a cart abandonment reminder with incentive to complete purchase',
    };

    const prompt = `Generate a bilingual (English and Estonian) marketing email for EstZone gaming store.

Type: ${typeDescriptions[request.type]}
${request.occasion ? `Occasion: ${request.occasion}` : ''}
${request.discount ? `Discount: ${request.discount}% off` : ''}
${productNames ? `Featured products: ${productNames}` : ''}
${request.customMessage ? `Custom message: ${request.customMessage}` : ''}

Generate JSON with these fields:
- subjectEn: Compelling English subject line (max 60 chars)
- subjectEt: Estonian subject line translation
- headlineEn: Main headline in English
- headlineEt: Main headline in Estonian
- bodyEn: Email body in English (2-3 paragraphs, compelling and action-oriented)
- bodyEt: Email body in Estonian translation
- ctaEn: Call-to-action button text in English
- ctaEt: Call-to-action button text in Estonian

Make it exciting, gaming-focused, and include urgency where appropriate.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');

    return {
      id: `campaign-${Date.now()}`,
      name: content.subjectEn || 'New Campaign',
      subjectEn: content.subjectEn || 'Special offer from EstZone!',
      subjectEt: content.subjectEt || 'Eripakkumine EstZone-ist!',
      bodyEn: buildEmailHtml(content, products, request.discount, 'en'),
      bodyEt: buildEmailHtml(content, products, request.discount, 'et'),
      type: request.type,
      targetAudience: 'all',
      status: 'draft',
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
      createdAt: new Date(),
      products,
      discount: request.discount,
    };
  } catch (error) {
    console.error('Email campaign generation error:', error);
    return generateFallbackCampaign(request);
  }
}

function generateFallbackCampaign(request: CampaignGenerationRequest): EmailCampaign {
  const templates: Record<string, { subjectEn: string; subjectEt: string; headlineEn: string; headlineEt: string; bodyEn: string; bodyEt: string }> = {
    promotional: {
      subjectEn: `${request.discount ? `${request.discount}% OFF` : 'Special Offer'} - Limited Time Only!`,
      subjectEt: `${request.discount ? `${request.discount}% SOODUSTUS` : 'Eripakkumine'} - Ainult piiratud aeg!`,
      headlineEn: 'Exclusive Gaming Deals',
      headlineEt: 'Eksklusiivsed mängupakkumised',
      bodyEn: 'Level up your gaming experience with our exclusive deals! Premium gaming gear at unbeatable prices. Don\'t miss out on these limited-time offers.',
      bodyEt: 'Tõsta oma mängukogemust meie eksklusiivsete pakkumistega! Premium mängutarvikud võitmatu hinnaga. Ära jäta neid piiratud aja pakkumisi kasutamata.',
    },
    newsletter: {
      subjectEn: 'EstZone Gaming News & Updates',
      subjectEt: 'EstZone mängunduse uudised ja uuendused',
      headlineEn: 'What\'s New in Gaming',
      headlineEt: 'Mis on uut mängunduses',
      bodyEn: 'Stay ahead of the game with the latest gaming news, new arrivals, and exclusive insider tips from EstZone.',
      bodyEt: 'Ole mängus ees viimaste mängunduse uudiste, uute toodetega ja EstZone eksklusiivsete näpunäidetega.',
    },
    announcement: {
      subjectEn: 'Big News from EstZone!',
      subjectEt: 'Suured uudised EstZone-ist!',
      headlineEn: 'Exciting Announcement',
      headlineEt: 'Põnev teadaanne',
      bodyEn: 'We have exciting news to share with you! Check out the latest updates from EstZone.',
      bodyEt: 'Meil on põnevaid uudiseid! Vaata EstZone viimaseid uuendusi.',
    },
    winback: {
      subjectEn: 'We Miss You! Here\'s a Special Gift',
      subjectEt: 'Igatseme sind! Siin on eriline kingitus',
      headlineEn: 'Come Back to EstZone',
      headlineEt: 'Tule tagasi EstZone-i',
      bodyEn: 'It\'s been a while since your last visit. We\'ve got amazing new products and a special welcome-back offer just for you!',
      bodyEt: 'On möödas tükk aega sinu viimasest külastusest. Meil on imelised uued tooted ja spetsiaalne tagasituleku pakkumine just sulle!',
    },
    abandoned_cart: {
      subjectEn: 'You Left Something Behind...',
      subjectEt: 'Sa jätsid midagi maha...',
      headlineEn: 'Complete Your Order',
      headlineEt: 'Lõpeta oma tellimus',
      bodyEn: 'Your cart is waiting! Complete your purchase now and don\'t miss out on these awesome gaming products.',
      bodyEt: 'Sinu ostukorv ootab! Lõpeta oma ost kohe ja ära jäta neid imelisi mängutooteid kasutamata.',
    },
  };

  const template = templates[request.type] || templates.promotional;
  
  return {
    id: `campaign-${Date.now()}`,
    name: template.subjectEn,
    subjectEn: template.subjectEn,
    subjectEt: template.subjectEt,
    bodyEn: buildEmailHtml({
      headlineEn: template.headlineEn,
      bodyEn: template.bodyEn,
      ctaEn: 'Shop Now',
    }, [], request.discount, 'en'),
    bodyEt: buildEmailHtml({
      headlineEt: template.headlineEt,
      bodyEt: template.bodyEt,
      ctaEt: 'Osta kohe',
    }, [], request.discount, 'et'),
    type: request.type,
    targetAudience: 'all',
    status: 'draft',
    recipientCount: 0,
    openCount: 0,
    clickCount: 0,
    createdAt: new Date(),
    discount: request.discount,
  };
}

function buildEmailHtml(
  content: any,
  products: Product[],
  discount?: number,
  language: 'en' | 'et' = 'en'
): string {
  const isEt = language === 'et';
  const headline = isEt ? content.headlineEt : content.headlineEn;
  const body = isEt ? content.bodyEt : content.bodyEn;
  const cta = isEt ? (content.ctaEt || 'Osta kohe') : (content.ctaEn || 'Shop Now');

  const productsHtml = products.length > 0 ? `
    <div style="${emailStyles.section}">
      <h2 style="color: #DAA520; font-size: 18px; margin: 0 0 16px 0;">
        ${isEt ? 'Soovitatud tooted' : 'Featured Products'}
      </h2>
      ${products.map(p => {
        const name = isEt ? p.nameEt : p.nameEn;
        const price = parseFloat(p.price);
        const salePrice = p.salePrice ? parseFloat(p.salePrice) : null;
        const finalPrice = discount ? price * (1 - discount / 100) : (salePrice || price);
        const image = p.images?.[0] || '/placeholder.png';
        
        return `
          <div style="background-color: #1a1a1a; border-radius: 8px; padding: 16px; margin: 10px 0;">
            <table style="width: 100%;">
              <tr>
                <td style="width: 80px; vertical-align: top;">
                  <img src="${STORE_URL}${image}" alt="${name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">
                </td>
                <td style="padding-left: 16px; vertical-align: top;">
                  <p style="color: #ffffff; font-weight: 600; font-size: 14px; margin: 0 0 8px 0;">${name}</p>
                  <p style="margin: 0;">
                    ${(salePrice || discount) ? `<span style="color: #ef4444; text-decoration: line-through; font-size: 12px; margin-right: 8px;">€${price.toFixed(2)}</span>` : ''}
                    <span style="color: #DAA520; font-weight: bold; font-size: 16px;">€${finalPrice.toFixed(2)}</span>
                  </p>
                </td>
              </tr>
            </table>
          </div>
        `;
      }).join('')}
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin: 0; padding: 0; background-color: #000000;">
      <div style="${emailStyles.container}">
        
        <div style="${emailStyles.header}">
          <div style="${emailStyles.logo}">EstZone</div>
          <h1 style="${emailStyles.title}">${headline}</h1>
          ${discount ? `<p style="color: #ef4444; font-size: 24px; font-weight: bold; margin: 10px 0;">${discount}% ${isEt ? 'SOODUSTUS' : 'OFF'}</p>` : ''}
        </div>

        <div style="${emailStyles.section}">
          <p style="${emailStyles.text}">${body}</p>
        </div>

        ${productsHtml}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${STORE_URL}" style="${emailStyles.button}">${cta}</a>
        </div>

        <div style="${emailStyles.footer}">
          <p style="${emailStyles.footerText}">
            <strong>AVERING GRUPP OÜ</strong> | Reg. 16236733
          </p>
          <p style="${emailStyles.footerText}">
            ${isEt ? 'Täname, et oled EstZone pere osa!' : 'Thank you for being part of the EstZone family!'}
          </p>
          <p style="${emailStyles.unsubscribe}">
            <a href="${STORE_URL}/unsubscribe" style="color: #a3a3a3;">
              ${isEt ? 'Loobu tellimusest' : 'Unsubscribe'}
            </a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendBulkEmails(
  campaign: EmailCampaign,
  targetAudience: 'all' | 'active' | 'inactive' | 'new' = 'all'
): Promise<EmailSendResult> {
  if (!resend) {
    console.warn('[EMAIL] Resend not configured - emails will be simulated');
    return simulateBulkSend(campaign);
  }

  const subscribers = await storage.getNewsletterSubscribers();
  const activeSubscribers = subscribers.filter(s => s.isActive);

  let recipients: NewsletterSubscriber[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  switch (targetAudience) {
    case 'all':
      recipients = activeSubscribers;
      break;
    case 'active':
      recipients = activeSubscribers;
      break;
    case 'inactive':
      recipients = activeSubscribers;
      break;
    case 'new':
      recipients = activeSubscribers.filter(s => new Date(s.subscribedAt) >= thirtyDaysAgo);
      break;
  }

  const result: EmailSendResult = {
    totalSent: recipients.length,
    successful: 0,
    failed: 0,
    errors: [],
  };

  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (subscriber) => {
      try {
        const isEstonian = subscriber.email.endsWith('.ee') || 
                          subscriber.email.includes('estonian') ||
                          Math.random() > 0.5;
        
        await resend.emails.send({
          from: FROM_EMAIL,
          to: subscriber.email,
          subject: isEstonian ? campaign.subjectEt : campaign.subjectEn,
          html: isEstonian ? campaign.bodyEt : campaign.bodyEn,
        });
        result.successful++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${subscriber.email}: ${error.message}`);
      }
    }));

    if (i + batchSize < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`[EMAIL] Campaign sent: ${result.successful}/${result.totalSent} successful`);
  return result;
}

async function simulateBulkSend(campaign: EmailCampaign): Promise<EmailSendResult> {
  const subscribers = await storage.getNewsletterSubscribers();
  const activeCount = subscribers.filter(s => s.isActive).length;
  
  console.log(`[EMAIL-MOCK] Would send "${campaign.name}" to ${activeCount} subscribers`);
  console.log('⚠️  Set RESEND_API_KEY to enable actual email sending');
  
  return {
    totalSent: activeCount,
    successful: activeCount,
    failed: 0,
    errors: [],
  };
}

export async function getSubscriberStats(): Promise<{
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}> {
  const subscribers = await storage.getNewsletterSubscribers();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return {
    total: subscribers.length,
    active: subscribers.filter(s => s.isActive).length,
    inactive: subscribers.filter(s => !s.isActive).length,
    newThisMonth: subscribers.filter(s => new Date(s.subscribedAt) >= thirtyDaysAgo).length,
  };
}
