import { storage } from '../storage';
import type { Order } from '@shared/schema';

/**
 * Unified Payment Webhook Handler
 * Handles payment confirmations from all providers (Stripe, PayPal, Montonio, Paysera)
 * with idempotency protection
 */

export interface PaymentWebhookData {
  provider: 'stripe' | 'paypal' | 'montonio' | 'paysera';
  eventId: string; // Unique event ID from provider
  eventType: string; // payment.success, payment.failed, etc
  orderId: string;
  paymentId?: string;
  status: 'success' | 'failed' | 'pending';
  amount?: number;
  currency?: string;
  rawPayload?: any;
}

export async function handlePaymentWebhook(data: PaymentWebhookData): Promise<{
  success: boolean;
  message: string;
  order?: Order;
}> {
  try {
    // Step 1: Check idempotency - have we processed this event before?
    const alreadyProcessed = await storage.isPaymentEventProcessed(data.eventId);
    if (alreadyProcessed) {
      console.log(`[PAYMENT] Event ${data.eventId} already processed, skipping`);
      return {
        success: true,
        message: 'Event already processed',
      };
    }

    // Step 2: Record the event
    await storage.recordPaymentEvent({
      orderId: data.orderId,
      provider: data.provider,
      providerEventId: data.eventId,
      eventType: data.eventType,
      payload: data.rawPayload,
      processed: false,
    });

    // Step 3: Get the order
    const order = await storage.getOrder(data.orderId);
    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    // Step 4: Handle based on payment status
    if (data.status === 'success') {
      console.log(`[PAYMENT] Payment success for order ${order.orderNumber}`);
      
      // Commit stock reservations and update order
      await storage.commitReservation(data.orderId, data.paymentId || data.eventId);
      
      // Mark event as processed
      const eventRecord = await storage.recordPaymentEvent({
        orderId: data.orderId,
        provider: data.provider,
        providerEventId: data.eventId,
        eventType: data.eventType,
        payload: data.rawPayload,
        processed: true,
      });

      return {
        success: true,
        message: 'Payment confirmed and stock committed',
        order: await storage.getOrder(data.orderId),
      };
      
    } else if (data.status === 'failed') {
      console.log(`[PAYMENT] Payment failed for order ${order.orderNumber}`);
      
      // Release stock reservations
      await storage.releaseReservation(data.orderId, 'payment_failed');
      
      return {
        success: true,
        message: 'Payment failed, stock released',
        order: await storage.getOrder(data.orderId),
      };
      
    } else {
      // Pending status - do nothing, wait for final status
      console.log(`[PAYMENT] Payment pending for order ${order.orderNumber}`);
      
      return {
        success: true,
        message: 'Payment pending',
        order,
      };
    }
    
  } catch (error: any) {
    console.error('[PAYMENT] Webhook processing error:', error);
    return {
      success: false,
      message: error.message || 'Payment processing failed',
    };
  }
}

/**
 * Get order status for frontend polling
 */
export async function getOrderPaymentStatus(orderId: string): Promise<{
  orderNumber: string;
  paymentStatus: string;
  status: string;
  reservationExpired?: boolean;
}> {
  const order = await storage.getOrder(orderId);
  if (!order) {
    throw new Error('Order not found');
  }

  const now = new Date();
  const reservationExpired = order.reservationExpiresAt && now > order.reservationExpiresAt;

  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    status: order.status,
    reservationExpired,
  };
}
