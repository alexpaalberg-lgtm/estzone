import { Resend } from 'resend';
import type { Order, OrderItem, Product } from '@shared/schema';

const { RESEND_API_KEY } = process.env;
const FROM_EMAIL = process.env.FROM_EMAIL || 'EstZone <orders@estzone.eu>';
const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL || 'estzone.shop@gmail.com';
const CONTACT_EMAIL = 'estzone.shop@gmail.com';
const STORE_URL = 'https://www.estzone.eu';

export interface LowStockItem {
  product: Product;
  currentStock: number;
  suggestedReorder: number;
}

export interface EmailService {
  sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void>;
  sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void>;
  sendSupplierStockAlert(items: LowStockItem[]): Promise<void>;
  sendReturnRequestNotification(returnRequest: { orderNumber: string; customerName: string; reason: string; description?: string }): Promise<void>;
  sendShippingNotification(order: Order, trackingNumber: string, language: 'en' | 'et'): Promise<void>;
}

const emailStyles = {
  container: 'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; color: #ffffff; padding: 40px 30px;',
  header: 'text-align: center; margin-bottom: 40px;',
  logo: 'font-size: 32px; font-weight: bold; color: #DAA520; margin-bottom: 10px;',
  title: 'font-size: 24px; font-weight: 600; color: #ffffff; margin: 0 0 10px 0;',
  subtitle: 'font-size: 16px; color: #a3a3a3; margin: 0;',
  section: 'background-color: #171717; border-radius: 12px; padding: 24px; margin-bottom: 20px;',
  sectionTitle: 'font-size: 14px; font-weight: 600; color: #DAA520; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;',
  text: 'font-size: 15px; color: #d4d4d4; line-height: 1.6; margin: 0 0 12px 0;',
  highlight: 'color: #ffffff; font-weight: 600;',
  goldText: 'color: #DAA520;',
  table: 'width: 100%; border-collapse: collapse;',
  tableHeader: 'text-align: left; padding: 12px 0; border-bottom: 1px solid #262626; color: #a3a3a3; font-size: 13px; font-weight: 500;',
  tableCell: 'padding: 16px 0; border-bottom: 1px solid #262626; color: #ffffff; font-size: 14px;',
  totalRow: 'font-size: 18px; font-weight: bold; color: #DAA520;',
  button: 'display: inline-block; background-color: #DAA520; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;',
  footer: 'text-align: center; padding-top: 30px; border-top: 1px solid #262626; margin-top: 30px;',
  footerText: 'font-size: 13px; color: #737373; margin: 0 0 8px 0;',
  divider: 'height: 1px; background-color: #262626; margin: 24px 0;',
};

class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  private getCarrierName(shippingMethod: string | null): string {
    const carriers: Record<string, string> = {
      'omniva': 'Omniva',
      'dpd': 'DPD',
      'dhl': 'DHL',
      'itella': 'Itella SmartPOST',
    };
    return carriers[shippingMethod || ''] || shippingMethod || 'Courier';
  }

  async sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void> {
    const et = language === 'et';
    const orderDate = new Date(order.createdAt).toLocaleDateString(et ? 'et-EE' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const subject = et 
      ? `Teie tellimus #${order.orderNumber} on kinnitatud` 
      : `Your order #${order.orderNumber} has been confirmed`;

    const itemsHtml = items.map(item => {
      const productName = et ? item.productNameEt : item.productNameEn;
      const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
      return `
        <tr>
          <td style="${emailStyles.tableCell}">
            <span style="${emailStyles.highlight}">${productName}</span><br>
            <span style="color: #737373; font-size: 12px;">SKU: ${item.sku}</span>
          </td>
          <td style="${emailStyles.tableCell} text-align: center;">${item.quantity}</td>
          <td style="${emailStyles.tableCell} text-align: right;">€${itemTotal}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">EstZone</div>
            <h1 style="${emailStyles.title}">
              ${et ? 'Täname tellimuse eest!' : 'Thank you for your order!'}
            </h1>
            <p style="${emailStyles.subtitle}">
              ${et ? 'Teie tellimus on vastu võetud ja töötlemisel.' : 'Your order has been received and is being processed.'}
            </p>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Tellimuse info' : 'Order Information'}</h2>
            <table style="${emailStyles.table}">
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Tellimuse number' : 'Order Number'}</td>
                <td style="color: #DAA520; font-weight: 600; text-align: right; padding: 8px 0;">#${order.orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Kuupäev' : 'Date'}</td>
                <td style="color: #ffffff; text-align: right; padding: 8px 0;">${orderDate}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Makse staatus' : 'Payment Status'}</td>
                <td style="color: #22c55e; font-weight: 600; text-align: right; padding: 8px 0;">
                  ${et ? 'Kinnitatud' : 'Confirmed'}
                </td>
              </tr>
            </table>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Tarneaadress' : 'Shipping Address'}</h2>
            <p style="${emailStyles.text}">
              <span style="${emailStyles.highlight}">${order.shippingFirstName} ${order.shippingLastName}</span><br>
              ${order.shippingStreet}<br>
              ${order.shippingPostalCode} ${order.shippingCity}<br>
              ${order.shippingCountry}<br>
              <span style="color: #a3a3a3;">${et ? 'Tel' : 'Phone'}: ${order.shippingPhone}</span>
            </p>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Tellitud tooted' : 'Ordered Products'}</h2>
            <table style="${emailStyles.table}">
              <tr>
                <th style="${emailStyles.tableHeader}">${et ? 'Toode' : 'Product'}</th>
                <th style="${emailStyles.tableHeader} text-align: center;">${et ? 'Kogus' : 'Qty'}</th>
                <th style="${emailStyles.tableHeader} text-align: right;">${et ? 'Hind' : 'Price'}</th>
              </tr>
              ${itemsHtml}
            </table>
            
            <div style="${emailStyles.divider}"></div>
            
            <table style="${emailStyles.table}">
              <tr>
                <td style="color: #a3a3a3; padding: 6px 0;">${et ? 'Vahesumma' : 'Subtotal'}</td>
                <td style="color: #ffffff; text-align: right; padding: 6px 0;">€${order.subtotal}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 6px 0;">${et ? 'Tarne' : 'Shipping'}</td>
                <td style="color: #ffffff; text-align: right; padding: 6px 0;">€${order.shippingCost}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 6px 0;">${et ? 'Käibemaks (24%)' : 'VAT (24%)'}</td>
                <td style="color: #ffffff; text-align: right; padding: 6px 0;">€${order.vatAmount}</td>
              </tr>
              <tr>
                <td style="${emailStyles.totalRow} padding-top: 16px;">${et ? 'KOKKU' : 'TOTAL'}</td>
                <td style="${emailStyles.totalRow} text-align: right; padding-top: 16px;">€${order.total}</td>
              </tr>
            </table>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Mis edasi?' : 'What happens next?'}</h2>
            <p style="${emailStyles.text}">
              ${et 
                ? 'Saadame teile eraldi e-kirja, kui tellimus on välja saadetud koos jälgimisnumbriga. Tavaliselt saadame tellimused välja 1-2 tööpäeva jooksul.'
                : 'We will send you a separate email once your order has been shipped, including a tracking number. Orders are typically dispatched within 1-2 business days.'}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${STORE_URL}" style="${emailStyles.button}">
              ${et ? 'Külasta poodi' : 'Visit Store'}
            </a>
          </div>

          <div style="${emailStyles.footer}">
            <p style="${emailStyles.footerText}">
              ${et 
                ? `Küsimuste korral võtke meiega ühendust: ${CONTACT_EMAIL}`
                : `For any questions, contact us at: ${CONTACT_EMAIL}`}
            </p>
            <p style="${emailStyles.footerText}">
              <strong>AVERING GRUPP OÜ</strong> | Reg. 16236733
            </p>
            <p style="${emailStyles.footerText}">
              ${et ? 'Täname, et valisite EstZone!' : 'Thank you for choosing EstZone!'}
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: order.customerEmail,
        subject,
        html,
      });
      console.log(`[EMAIL] Order confirmation sent to ${order.customerEmail} via Resend`);
    } catch (error) {
      console.error('[EMAIL] Failed to send order confirmation:', error);
      throw error;
    }
  }

  async sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void> {
    const et = language === 'et';
    
    const subject = et 
      ? 'Tere tulemast EstZone perre!' 
      : 'Welcome to the EstZone family!';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">EstZone</div>
            <h1 style="${emailStyles.title}">
              ${et ? 'Tere tulemast!' : 'Welcome aboard!'}
            </h1>
          </div>

          <div style="${emailStyles.section}">
            <p style="${emailStyles.text}">
              ${et 
                ? 'Suur tänu, et liitusid EstZone uudiskirjaga! Oled nüüd meie kogukonna osa.'
                : 'Thank you for subscribing to the EstZone newsletter! You\'re now part of our gaming community.'}
            </p>
            <p style="${emailStyles.text}">
              ${et 
                ? 'Mida saad meilt oodata:'
                : 'Here\'s what you can expect from us:'}
            </p>
            <ul style="color: #d4d4d4; line-height: 2;">
              <li>${et ? 'Eksklusiivsed pakkumised ja allahindlused' : 'Exclusive deals and discounts'}</li>
              <li>${et ? 'Uute toodete esialgne info' : 'Early access to new products'}</li>
              <li>${et ? 'Mängunduse uudised ja soovitused' : 'Gaming news and recommendations'}</li>
              <li>${et ? 'Eripakkumised ainult uudiskirja tellijatele' : 'Special offers for subscribers only'}</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${STORE_URL}" style="${emailStyles.button}">
              ${et ? 'Avasta tooteid' : 'Explore Products'}
            </a>
          </div>

          <div style="${emailStyles.footer}">
            <p style="${emailStyles.footerText}">
              ${et 
                ? 'Kui sa ei soovinud seda uudiskirja, võid selle ignoreerida.'
                : 'If you did not subscribe to this newsletter, you can ignore this email.'}
            </p>
            <p style="${emailStyles.footerText}">
              <strong>AVERING GRUPP OÜ</strong> | Reg. 16236733
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      });
      console.log(`[EMAIL] Newsletter welcome sent to ${email} via Resend`);
    } catch (error) {
      console.error('[EMAIL] Failed to send newsletter welcome:', error);
      throw error;
    }
  }

  async sendShippingNotification(order: Order, trackingNumber: string, language: 'en' | 'et'): Promise<void> {
    const et = language === 'et';
    
    const subject = et 
      ? `Teie tellimus #${order.orderNumber} on teel!` 
      : `Your order #${order.orderNumber} is on its way!`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">EstZone</div>
            <h1 style="${emailStyles.title}">
              ${et ? 'Teie tellimus on teel!' : 'Your order is on its way!'}
            </h1>
            <p style="${emailStyles.subtitle}">
              ${et ? 'Paki saatmise info' : 'Shipment tracking information'}
            </p>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Jälgimisinfo' : 'Tracking Information'}</h2>
            <table style="${emailStyles.table}">
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Tellimuse number' : 'Order Number'}</td>
                <td style="color: #DAA520; font-weight: 600; text-align: right; padding: 8px 0;">#${order.orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Jälgimisnumber' : 'Tracking Number'}</td>
                <td style="color: #ffffff; font-weight: 600; text-align: right; padding: 8px 0;">${trackingNumber}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 8px 0;">${et ? 'Kullerfirma' : 'Carrier'}</td>
                <td style="color: #ffffff; text-align: right; padding: 8px 0;">${this.getCarrierName(order.shippingMethod)}</td>
              </tr>
            </table>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">${et ? 'Tarneaadress' : 'Delivery Address'}</h2>
            <p style="${emailStyles.text}">
              <span style="${emailStyles.highlight}">${order.shippingFirstName} ${order.shippingLastName}</span><br>
              ${order.shippingStreet}<br>
              ${order.shippingPostalCode} ${order.shippingCity}<br>
              ${order.shippingCountry}
            </p>
          </div>

          <div style="${emailStyles.section}">
            <p style="${emailStyles.text}">
              ${et 
                ? 'Pakk peaks kohale jõudma 1-3 tööpäeva jooksul. Kui teil tekib küsimusi, võtke meiega ühendust.'
                : 'Your package should arrive within 1-3 business days. If you have any questions, please don\'t hesitate to contact us.'}
            </p>
          </div>

          <div style="${emailStyles.footer}">
            <p style="${emailStyles.footerText}">
              ${et ? `Küsimuste korral: ${CONTACT_EMAIL}` : `Questions? Contact: ${CONTACT_EMAIL}`}
            </p>
            <p style="${emailStyles.footerText}">
              <strong>AVERING GRUPP OÜ</strong> | Reg. 16236733
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: order.customerEmail,
        subject,
        html,
      });
      console.log(`[EMAIL] Shipping notification sent to ${order.customerEmail} via Resend`);
    } catch (error) {
      console.error('[EMAIL] Failed to send shipping notification:', error);
      throw error;
    }
  }

  async sendSupplierStockAlert(items: LowStockItem[]): Promise<void> {
    if (items.length === 0) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">EstZone</div>
            <h1 style="font-size: 24px; color: #ef4444; margin: 0;">⚠️ Laoseis madal</h1>
            <p style="${emailStyles.subtitle}">
              ${items.length} toodet vajavad täiendamist
            </p>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">Tooted mis vajavad tellimist</h2>
            <table style="${emailStyles.table}">
              <tr>
                <th style="${emailStyles.tableHeader}">Toode</th>
                <th style="${emailStyles.tableHeader} text-align: center;">SKU</th>
                <th style="${emailStyles.tableHeader} text-align: center;">Laos</th>
                <th style="${emailStyles.tableHeader} text-align: center;">Soovitus</th>
              </tr>
              ${items.map(item => `
                <tr>
                  <td style="${emailStyles.tableCell}">${item.product.nameEn}</td>
                  <td style="${emailStyles.tableCell} text-align: center; color: #a3a3a3;">${item.product.sku || 'N/A'}</td>
                  <td style="${emailStyles.tableCell} text-align: center; color: #ef4444; font-weight: 600;">${item.currentStock}</td>
                  <td style="${emailStyles.tableCell} text-align: center; color: #22c55e; font-weight: 600;">${item.suggestedReorder}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div style="${emailStyles.footer}">
            <p style="${emailStyles.footerText}">
              Automaatne teavitus EstZone laohaldussüsteemist
            </p>
            <p style="${emailStyles.footerText}">
              <strong>AVERING GRUPP OÜ</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: SUPPLIER_EMAIL,
        subject: `[KIIRE] Laoseis madal - ${items.length} toodet`,
        html,
      });
      console.log(`[EMAIL] Supplier stock alert sent for ${items.length} items via Resend`);
    } catch (error) {
      console.error('[EMAIL] Failed to send supplier stock alert:', error);
      throw error;
    }
  }

  async sendReturnRequestNotification(returnRequest: { orderNumber: string; customerName: string; reason: string; description?: string }): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin: 0; padding: 0; background-color: #000000;">
        <div style="${emailStyles.container}">
          
          <div style="${emailStyles.header}">
            <div style="${emailStyles.logo}">EstZone</div>
            <h1 style="${emailStyles.title}">Uus tagastustaotlus</h1>
          </div>

          <div style="${emailStyles.section}">
            <h2 style="${emailStyles.sectionTitle}">Taotluse andmed</h2>
            <table style="${emailStyles.table}">
              <tr>
                <td style="color: #a3a3a3; padding: 12px 0; border-bottom: 1px solid #262626;">Tellimuse number</td>
                <td style="color: #DAA520; font-weight: 600; text-align: right; padding: 12px 0; border-bottom: 1px solid #262626;">#${returnRequest.orderNumber}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 12px 0; border-bottom: 1px solid #262626;">Klient</td>
                <td style="color: #ffffff; text-align: right; padding: 12px 0; border-bottom: 1px solid #262626;">${returnRequest.customerName}</td>
              </tr>
              <tr>
                <td style="color: #a3a3a3; padding: 12px 0; border-bottom: 1px solid #262626;">Põhjus</td>
                <td style="color: #ffffff; text-align: right; padding: 12px 0; border-bottom: 1px solid #262626;">${returnRequest.reason}</td>
              </tr>
              ${returnRequest.description ? `
              <tr>
                <td style="color: #a3a3a3; padding: 12px 0;">Kirjeldus</td>
                <td style="color: #ffffff; text-align: right; padding: 12px 0;">${returnRequest.description}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="${emailStyles.section}">
            <p style="${emailStyles.text}">
              Palun vaata see taotlus üle ja töötle admin paneelist.
            </p>
          </div>

          <div style="${emailStyles.footer}">
            <p style="${emailStyles.footerText}">
              Automaatne teavitus EstZone süsteemist
            </p>
            <p style="${emailStyles.footerText}">
              <strong>AVERING GRUPP OÜ</strong>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: CONTACT_EMAIL,
        subject: `[TAGASTUS] Uus taotlus tellimuse #${returnRequest.orderNumber} jaoks`,
        html,
      });
      console.log(`[EMAIL] Return request notification sent for order #${returnRequest.orderNumber}`);
    } catch (error) {
      console.error('[EMAIL] Failed to send return request notification:', error);
      throw error;
    }
  }
}

class MockEmailService implements EmailService {
  async sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Order confirmation would be sent to ${order.customerEmail}`);
    console.log(`Order #${order.orderNumber} | Total: €${order.total} | Items: ${items.length} | Language: ${language}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }
  
  async sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Newsletter welcome would be sent to ${email} in ${language}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }

  async sendShippingNotification(order: Order, trackingNumber: string, language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Shipping notification would be sent to ${order.customerEmail}`);
    console.log(`Order #${order.orderNumber} | Tracking: ${trackingNumber} | Language: ${language}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }

  async sendSupplierStockAlert(items: LowStockItem[]): Promise<void> {
    console.log(`[EMAIL-MOCK] Supplier stock alert would be sent for ${items.length} low stock items`);
    items.forEach(item => {
      console.log(`  - ${item.product.nameEn}: ${item.currentStock} in stock, suggest ordering ${item.suggestedReorder}`);
    });
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }

  async sendReturnRequestNotification(returnRequest: { orderNumber: string; customerName: string; reason: string; description?: string }): Promise<void> {
    console.log(`[EMAIL-MOCK] Return request notification for order #${returnRequest.orderNumber}`);
    console.log(`  Customer: ${returnRequest.customerName}, Reason: ${returnRequest.reason}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }
}

export const emailService: EmailService = RESEND_API_KEY 
  ? new ResendEmailService(RESEND_API_KEY)
  : new MockEmailService();

if (!RESEND_API_KEY) {
  console.warn('⚠️  Email service not configured. Emails will be logged to console only.');
  console.warn('   To enable email sending, add RESEND_API_KEY to your secrets.');
}
