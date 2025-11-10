import { Resend } from 'resend';
import type { Order, OrderItem } from '@shared/schema';

const { RESEND_API_KEY } = process.env;
const FROM_EMAIL = process.env.FROM_EMAIL || 'EstZone <orders@estzone.com>';

export interface EmailService {
  sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void>;
  sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void>;
}

class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void> {
    const isEstonian = language === 'et';
    
    const subject = isEstonian 
      ? `Tellimuse kinnitus #${order.orderNumber}` 
      : `Order Confirmation #${order.orderNumber}`;
    
    const itemsList = items.map(item => {
      const productName = isEstonian ? item.productNameEt : item.productNameEn;
      return `- ${productName} x${item.quantity} - €${item.price}`;
    }).join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #DAA520;">${isEstonian ? 'Täname tellimuse eest!' : 'Thank you for your order!'}</h1>
        <p>${isEstonian ? 'Teie tellimus on vastu võetud ja töötlemisel.' : 'Your order has been received and is being processed.'}</p>
        
        <h2>${isEstonian ? 'Tellimuse detailid' : 'Order Details'}</h2>
        <p><strong>${isEstonian ? 'Tellimuse number' : 'Order Number'}:</strong> ${order.orderNumber}</p>
        <p><strong>${isEstonian ? 'Kuupäev' : 'Date'}:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        
        <h3>${isEstonian ? 'Tellitud tooted' : 'Ordered Products'}</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${itemsList}</pre>
        
        <h3>${isEstonian ? 'Kokku' : 'Total'}</h3>
        <p><strong>${isEstonian ? 'Vahesumma' : 'Subtotal'}:</strong> €${order.subtotal}</p>
        <p><strong>${isEstonian ? 'Käibemaks (24%)' : 'VAT (24%)'}:</strong> €${order.vatAmount}</p>
        <p><strong>${isEstonian ? 'Kohaletoimetamine' : 'Shipping'}:</strong> €${order.shippingCost}</p>
        <p style="font-size: 1.2em;"><strong>${isEstonian ? 'KOKKU' : 'TOTAL'}:</strong> €${order.total}</p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">
          ${isEstonian 
            ? 'Kui teil on küsimusi, võtke meiega ühendust aadressil support@estzone.com' 
            : 'If you have any questions, please contact us at support@estzone.com'}
        </p>
        <p style="color: #666; font-size: 0.9em;">
          <strong>EstZone OÜ</strong><br>
          Pärnu mnt 31, Tallinn, Estonia
        </p>
      </div>
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
    const isEstonian = language === 'et';
    
    const subject = isEstonian 
      ? 'Tere tulemast EstZone uudiskirja!' 
      : 'Welcome to EstZone Newsletter!';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #DAA520;">${isEstonian ? 'Tere tulemast!' : 'Welcome!'}</h1>
        <p>${isEstonian 
          ? 'Täname, et liitusite EstZone uudiskirjaga. Saate esimesena teada uutest toodete ja eripakkumistest.' 
          : 'Thank you for subscribing to EstZone newsletter. You\'ll be the first to know about new products and special offers.'}
        </p>
        
        <p>${isEstonian 
          ? 'Ootame teid meie poes!' 
          : 'We look forward to seeing you in our store!'}
        </p>
        
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">
          <strong>EstZone OÜ</strong><br>
          Pärnu mnt 31, Tallinn, Estonia
        </p>
      </div>
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
}

class MockEmailService implements EmailService {
  async sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Order confirmation would be sent to ${order.customerEmail}`);
    console.log(`Order #${order.orderNumber} | Total: €${order.total} | Items: ${items.length}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }
  
  async sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Newsletter welcome would be sent to ${email} in ${language}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }
}

// Use Resend if API key is available, otherwise use mock service
export const emailService: EmailService = RESEND_API_KEY 
  ? new ResendEmailService(RESEND_API_KEY)
  : new MockEmailService();

if (!RESEND_API_KEY) {
  console.warn('⚠️  Email service not configured. Emails will be logged to console only.');
  console.warn('   To enable email sending, add RESEND_API_KEY to your secrets.');
}
