import type { Order, OrderItem } from '@shared/schema';

export interface EmailService {
  sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void>;
  sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void>;
}

class MockEmailService implements EmailService {
  async sendOrderConfirmation(order: Order, items: OrderItem[], language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL] Order confirmation sent to ${order.customerEmail}`);
    console.log(`Order #${order.orderNumber}`);
    console.log(`Total: €${order.total}`);
    console.log(`Items: ${items.length}`);
    // In production, this would use SendGrid/Resend integration
  }
  
  async sendNewsletterWelcome(email: string, language: 'en' | 'et'): Promise<void> {
    console.log(`[EMAIL] Newsletter welcome sent to ${email} in ${language}`);
    // In production, this would use SendGrid/Resend integration
  }
}

// TODO: Replace with actual email service integration (SendGrid/Resend)
export const emailService: EmailService = new MockEmailService();
