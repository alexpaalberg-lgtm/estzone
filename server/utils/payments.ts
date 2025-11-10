import Stripe from 'stripe';
import type { Request, Response } from 'express';
import { handlePaymentWebhook } from './paymentOrchestrator';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-10-29.clover',
}) : null;

// Payment provider interfaces
export interface PaymentIntent {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  clientSecret?: string;
}

// Stripe Checkout Session Creation
export async function createStripeCheckoutSession(orderId: string, amount: number, currency: string = 'EUR'): Promise<{
  sessionId: string;
  url: string;
}> {
  if (!stripe) {
    throw new Error('Stripe not configured - STRIPE_SECRET_KEY missing');
  }

  const baseUrl = process.env.BASE_URL || 
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: `Order ${orderId}`,
        },
        unit_amount: Math.round(amount * 100), // Convert to cents
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${baseUrl}/payment/success?order_id=${orderId}`,
    cancel_url: `${baseUrl}/payment/cancel?order_id=${orderId}`,
    metadata: {
      orderId,
    },
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

// Stripe Webhook Handler
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe || !stripeWebhookSecret) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      stripeWebhookSecret
    );

    console.log(`[STRIPE] Webhook received: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      
      if (!orderId) {
        console.error('[STRIPE] No orderId in session metadata');
        res.status(400).json({ error: 'Missing orderId' });
        return;
      }

      // Call unified payment handler
      await handlePaymentWebhook({
        provider: 'stripe',
        eventId: event.id,
        eventType: 'checkout.session.completed',
        orderId,
        paymentId: session.payment_intent as string,
        status: 'success',
        amount: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency?.toUpperCase(),
        rawPayload: event,
      });

      res.json({ received: true });
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        await handlePaymentWebhook({
          provider: 'stripe',
          eventId: event.id,
          eventType: 'checkout.session.expired',
          orderId,
          status: 'failed',
          rawPayload: event,
        });
      }
      
      res.json({ received: true });
    } else {
      res.json({ received: true, ignored: true });
    }
  } catch (err: any) {
    console.error('[STRIPE] Webhook error:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}

// Paysera integration
export async function createPayseraPayment(amount: number, orderId: string, currency: string = 'EUR'): Promise<string> {
  // TODO: Implement Paysera API integration
  // Paysera requires project ID and sign password from their merchant account
  console.log(`[PAYSERA] Creating payment for order ${orderId}: ${amount} ${currency}`);
  
  // This would return a payment URL for redirect
  return `https://www.paysera.com/pay?order_id=${orderId}&amount=${amount}`;
}

export async function verifyPayseraCallback(data: any): Promise<boolean> {
  // TODO: Implement Paysera callback verification
  console.log('[PAYSERA] Verifying callback');
  return true;
}
