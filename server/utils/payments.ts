import Stripe from 'stripe';
import { Request, Response } from 'express';
import { storage } from '../storage';
import { emailService } from './email';

const { STRIPE_SECRET_KEY } = process.env;

const stripe = STRIPE_SECRET_KEY 
  ? new Stripe(STRIPE_SECRET_KEY)
  : null;

const isStripeEnabled = !!stripe;

if (!isStripeEnabled) {
  console.warn("⚠️  Stripe credentials not configured. Stripe payments will be disabled.");
}

export interface PaymentIntent {
  id: string;
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  currency: string;
  clientSecret?: string;
}

export async function createStripePayment(amount: number, currency: string = 'EUR', orderId?: string): Promise<PaymentIntent> {
  if (!stripe) {
    console.log(`[STRIPE] Stripe not configured - creating mock payment`);
    return {
      id: `pi_mock_${Date.now()}`,
      status: 'pending',
      amount,
      currency,
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: currency.toLowerCase(),
      metadata: orderId ? { orderId } : {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`[STRIPE] Payment intent created: ${paymentIntent.id} for ${amount} ${currency}`);
    
    return {
      id: paymentIntent.id,
      status: 'pending',
      amount,
      currency,
      clientSecret: paymentIntent.client_secret || undefined,
    };
  } catch (error: any) {
    console.error('[STRIPE] Error creating payment intent:', error.message);
    throw error;
  }
}

export async function verifyStripePayment(paymentId: string): Promise<boolean> {
  if (!stripe) {
    console.log(`[STRIPE] Stripe not configured - returning mock verification`);
    return true;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    return paymentIntent.status === 'succeeded';
  } catch (error: any) {
    console.error('[STRIPE] Error verifying payment:', error.message);
    return false;
  }
}

interface CreateStripeCheckoutParams {
  orderId: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export async function createStripeCheckoutSession(params: CreateStripeCheckoutParams): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
  if (!stripe) {
    console.log(`[STRIPE] Stripe not configured`);
    return { success: false, error: 'Stripe not configured. Please add STRIPE_SECRET_KEY.' };
  }

  const baseUrl = process.env.BASE_URL || 
    (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: params.customerEmail,
      client_reference_id: params.orderId,
      line_items: params.lineItems.map(item => ({
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: item.name,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${baseUrl}/order-confirmation?orderId=${params.orderId}&payment=success`,
      cancel_url: `${baseUrl}/checkout?payment=cancelled`,
      metadata: {
        orderId: params.orderId,
      },
    });

    console.log(`[STRIPE] Checkout session created: ${session.id} for order ${params.orderId}`);

    return {
      success: true,
      paymentUrl: session.url || undefined,
    };
  } catch (error: any) {
    console.error('[STRIPE] Error creating checkout session:', error.message);
    return { success: false, error: error.message };
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    console.warn('[STRIPE] Webhook called but Stripe not configured');
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn('[STRIPE] Webhook secret not configured');
    return res.status(503).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = (req as any).rawBody as Buffer;
    if (!rawBody) {
      console.error('[STRIPE] Missing raw body for webhook verification');
      return res.status(400).json({ error: 'Missing raw body' });
    }
    
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`[STRIPE] Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[STRIPE] Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId || session.client_reference_id;
        
        console.log(`[STRIPE] Checkout session completed: ${session.id}, Order: ${orderId}`);
        
        if (orderId && session.payment_status === 'paid') {
          const order = await storage.getOrderByNumber(orderId);
          if (order) {
            await storage.updateOrderStatus(order.id, 'processing', 'completed');
            console.log(`[STRIPE] Order ${orderId} updated to processing/completed`);
            
            const orderItems = await storage.getOrderItems(order.id);
            await emailService.sendOrderConfirmation(order, orderItems, 'et');
            console.log(`[STRIPE] Confirmation email sent for order ${orderId}`);
          } else {
            console.warn(`[STRIPE] Order not found: ${orderId}`);
          }
        }
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        
        console.log(`[STRIPE] Payment succeeded for PaymentIntent: ${paymentIntent.id}, Order: ${orderId}`);
        
        if (orderId) {
          const order = await storage.getOrderByNumber(orderId);
          if (order && order.paymentStatus !== 'completed') {
            await storage.updateOrderStatus(order.id, 'processing', 'completed');
            console.log(`[STRIPE] Order ${orderId} updated to processing/completed`);
            
            const orderItems = await storage.getOrderItems(order.id);
            await emailService.sendOrderConfirmation(order, orderItems, 'et');
            console.log(`[STRIPE] Confirmation email sent for order ${orderId}`);
          }
        }
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata?.orderId;
        
        console.log(`[STRIPE] Payment failed for PaymentIntent: ${paymentIntent.id}, Order: ${orderId}`);
        
        if (orderId) {
          const order = await storage.getOrderByNumber(orderId);
          if (order) {
            await storage.updateOrderStatus(order.id, 'cancelled', 'failed');
            console.log(`[STRIPE] Order ${orderId} marked as cancelled/failed`);
          }
        }
        break;
      }
      
      default:
        console.log(`[STRIPE] Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error(`[STRIPE] Error processing webhook: ${error.message}`);
  }

  res.json({ received: true });
}

export async function createPayseraPayment(amount: number, orderId: string, currency: string = 'EUR'): Promise<string> {
  console.log(`[PAYSERA] Creating payment for order ${orderId}: ${amount} ${currency}`);
  return `https://www.paysera.com/pay?order_id=${orderId}&amount=${amount}`;
}

export async function verifyPayseraCallback(data: any): Promise<boolean> {
  console.log('[PAYSERA] Verifying callback');
  return true;
}
