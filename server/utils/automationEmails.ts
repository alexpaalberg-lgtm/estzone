import type { Product } from '@shared/schema';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'noreply@estzone.eu';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@estzone.eu';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL] Would send to ${to}: ${subject}`);
    console.log(`[EMAIL] Content: ${html.substring(0, 200)}...`);
    return { success: true, messageId: 'mock-' + Date.now() };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `EstZone <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendLowStockAlert(products: Product[]): Promise<EmailResult> {
  const productList = products.map(p => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #333;">${p.nameEn}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333;">${p.sku}</td>
      <td style="padding: 8px; border-bottom: 1px solid #333; color: #e74c3c; font-weight: bold;">${p.stock}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 8px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #d4af37; font-size: 28px; font-weight: bold; }
        .alert { background: #3d2020; border-left: 4px solid #e74c3c; padding: 15px; margin: 20px 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 12px 8px; background: #333; color: #d4af37; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 EstZone</div>
          <p style="color: #888;">Admin Alert / Admini hoiatus</p>
        </div>
        
        <div class="alert">
          <strong>⚠️ Low Stock Alert / Madala laoseisu hoiatus</strong>
          <p>${products.length} products need restocking / ${products.length} toodet vajab täiendamist</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product / Toode</th>
              <th>SKU</th>
              <th>Stock / Laoseis</th>
            </tr>
          </thead>
          <tbody>
            ${productList}
          </tbody>
        </table>

        <div class="footer">
          <p>This is an automated message from EstZone Automation System</p>
          <p>See on automaatne teade EstZone automaatikasüsteemilt</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(ADMIN_EMAIL, `⚠️ Low Stock Alert: ${products.length} products need restocking`, html);
}

export async function sendWishlistPriceAlert(
  userEmail: string,
  userName: string,
  products: Array<{
    product: Product;
    oldPrice: number;
    newPrice: number;
    discount: number;
  }>,
  language: 'en' | 'et' = 'en'
): Promise<EmailResult> {
  const isEt = language === 'et';
  
  const productCards = products.map(item => `
    <div style="background: #333; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 15px;">
        ${item.product.images?.[0] ? `<img src="${item.product.images[0]}" alt="${isEt ? item.product.nameEt : item.product.nameEn}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">` : ''}
        <div style="flex: 1;">
          <h3 style="margin: 0 0 5px 0; color: #fff;">${isEt ? item.product.nameEt : item.product.nameEn}</h3>
          <p style="margin: 0;">
            <span style="text-decoration: line-through; color: #888;">€${item.oldPrice.toFixed(2)}</span>
            <span style="color: #d4af37; font-size: 20px; font-weight: bold; margin-left: 10px;">€${item.newPrice.toFixed(2)}</span>
            <span style="background: #2ecc71; color: #fff; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px;">-${item.discount}%</span>
          </p>
        </div>
      </div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 8px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #d4af37; font-size: 28px; font-weight: bold; }
        .cta { display: inline-block; background: #d4af37; color: #000; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 EstZone</div>
        </div>
        
        <h2>${isEt ? `Tere ${userName}!` : `Hello ${userName}!`}</h2>
        <p>${isEt 
          ? 'Head uudised! Sinu soovide nimekirjas olevad tooted on nüüd soodsamad!' 
          : 'Great news! Items from your wishlist are now on sale!'}</p>

        ${productCards}

        <div style="text-align: center;">
          <a href="https://shop.estzone.eu/wishlist" class="cta">
            ${isEt ? 'Vaata oma soovinimekirja' : 'View Your Wishlist'}
          </a>
        </div>

        <div class="footer">
          <p>${isEt 
            ? 'Said selle teate, kuna lisasid need tooted oma soovinimekirja.' 
            : 'You received this because you added these items to your wishlist.'}</p>
          <p>© ${new Date().getFullYear()} EstZone. ${isEt ? 'Kõik õigused kaitstud.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const subject = isEt 
    ? `💰 Hinnamuutus! ${products.length} toodet sinu soovinimekirjast on soodsamad`
    : `💰 Price Drop! ${products.length} items from your wishlist are on sale`;

  return sendEmail(userEmail, subject, html);
}

export async function sendDailyReportEmail(report: any): Promise<EmailResult> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #2a2a2a; border-radius: 8px; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { color: #d4af37; font-size: 28px; font-weight: bold; }
        .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat { background: #333; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #d4af37; }
        .stat-label { color: #888; font-size: 12px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎮 EstZone</div>
          <p style="color: #888;">Daily Report / Päevaraport</p>
          <p style="color: #d4af37;">${report.date}</p>
        </div>
        
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-value">${report.summary?.totalOrders || 0}</div>
            <div class="stat-label">Orders / Tellimused</div>
          </div>
          <div class="stat">
            <div class="stat-value">€${report.summary?.totalRevenue || '0.00'}</div>
            <div class="stat-label">Revenue / Käive</div>
          </div>
          <div class="stat">
            <div class="stat-value">${report.summary?.lowStockCount || 0}</div>
            <div class="stat-label">Low Stock / Madal laoseis</div>
          </div>
          <div class="stat">
            <div class="stat-value">${report.summary?.activeProducts || 0}</div>
            <div class="stat-label">Active Products / Aktiivsed tooted</div>
          </div>
        </div>

        <div class="footer">
          <p>Automated Daily Report from EstZone</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(ADMIN_EMAIL, `📊 EstZone Daily Report: ${report.date}`, html);
}
