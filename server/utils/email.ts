import { Resend } from 'resend';
import type { Order, OrderItem, Product } from '@shared/schema';

const { RESEND_API_KEY } = process.env;
const FROM_EMAIL = process.env.FROM_EMAIL || 'EstZone <orders@estzone.eu>';
const SUPPLIER_EMAIL = process.env.SUPPLIER_EMAIL || 'estzone.shop@gmail.com';
const CONTACT_EMAIL = 'estzone.shop@gmail.com';

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
            ? `Kui teil on küsimusi, võtke meiega ühendust aadressil ${CONTACT_EMAIL}` 
            : `If you have any questions, please contact us at ${CONTACT_EMAIL}`}
        </p>
        <p style="color: #666; font-size: 0.9em;">
          <strong>AVERING GRUPP OÜ</strong><br>
          Reg: 16236733
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
          <strong>AVERING GRUPP OÜ</strong><br>
          Reg: 16236733
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

  async sendSupplierStockAlert(items: LowStockItem[]): Promise<void> {
    if (items.length === 0) return;

    const itemsList = items.map(item => 
      `- ${item.product.nameEn} (SKU: ${item.product.sku || 'N/A'})\n  Current: ${item.currentStock}, Suggested Reorder: ${item.suggestedReorder}`
    ).join('\n\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #DC2626;">Low Stock Alert - EstZone</h1>
        <p>The following products are running low on stock and require reordering:</p>
        
        <div style="background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #991B1B; margin-top: 0;">Products Requiring Reorder (${items.length} items)</h3>
          <pre style="white-space: pre-wrap; font-family: monospace; color: #374151;">${itemsList}</pre>
        </div>

        <h3>Reorder Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #F3F4F6;">
            <th style="padding: 10px; text-align: left; border: 1px solid #E5E7EB;">Product</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #E5E7EB;">SKU</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #E5E7EB;">Current</th>
            <th style="padding: 10px; text-align: center; border: 1px solid #E5E7EB;">Reorder</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td style="padding: 10px; border: 1px solid #E5E7EB;">${item.product.nameEn}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #E5E7EB;">${item.product.sku || 'N/A'}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #E5E7EB; color: #DC2626;">${item.currentStock}</td>
              <td style="padding: 10px; text-align: center; border: 1px solid #E5E7EB; color: #059669;">${item.suggestedReorder}</td>
            </tr>
          `).join('')}
        </table>

        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">
          This is an automated notification from EstZone OÜ inventory management system.
        </p>
      </div>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: SUPPLIER_EMAIL,
        subject: `[URGENT] Low Stock Alert - ${items.length} products need reordering`,
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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #DAA520;">New Return Request</h1>
        <p>A new return request has been submitted:</p>
        
        <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order Number:</strong> ${returnRequest.orderNumber}</p>
          <p><strong>Customer:</strong> ${returnRequest.customerName}</p>
          <p><strong>Reason:</strong> ${returnRequest.reason}</p>
          ${returnRequest.description ? `<p><strong>Details:</strong> ${returnRequest.description}</p>` : ''}
        </div>

        <p>Please review and process this return request in the admin panel.</p>

        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 0.9em;">
          <strong>AVERING GRUPP OÜ</strong><br>
          Automated Notification
        </p>
      </div>
    `;

    try {
      await this.resend.emails.send({
        from: FROM_EMAIL,
        to: CONTACT_EMAIL,
        subject: `[RETURN] New return request for order #${returnRequest.orderNumber}`,
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
    console.log(`Order #${order.orderNumber} | Total: €${order.total} | Items: ${items.length}`);
    console.log('⚠️  Email service not configured. Set RESEND_API_KEY to enable email sending.');
  }
  
  async sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL-MOCK] Newsletter welcome would be sent to ${email} in ${language}`);
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

// Use Resend if API key is available, otherwise use mock service
export const emailService: EmailService = RESEND_API_KEY 
  ? new ResendEmailService(RESEND_API_KEY)
  : new MockEmailService();

if (!RESEND_API_KEY) {
  console.warn('⚠️  Email service not configured. Emails will be logged to console only.');
  console.warn('   To enable email sending, add RESEND_API_KEY to your secrets.');
}
