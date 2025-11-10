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
    // Step 1: ATOMIC - Try to record event (acts as distributed lock)
    // If event already exists (duplicate webhook), this returns null
    const eventRecord = await storage.recordPaymentEvent({
      orderId: data.orderId,
      provider: data.provider,
      providerEventId: data.eventId,
      eventType: data.eventType,
      payload: data.rawPayload,
      processed: false,
    });

    if (!eventRecord) {
      // Event already exists - check its state
      const existing = await storage.getPaymentEvent(data.eventId);
      
      if (!existing) {
        throw new Error('Unexpected: event insert failed but event not found');
      }
      
      if (existing.processed) {
        console.log(`[PAYMENT] Event ${data.eventId} already processed completely`);
        const order = await storage.getOrder(data.orderId);
        return {
          success: true,
          message: 'Event already processed (idempotent retry)',
          order: order || undefined,
        };
      }
      
      // Event exists but not yet processed - check if it's stale
      const eventAge = Date.now() - existing.createdAt.getTime();
      const STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
      
      if (eventAge > STALE_THRESHOLD) {
        // Event is stale (worker likely crashed) - force retry
        console.warn(`[PAYMENT] Event ${data.eventId} is stale (${Math.round(eventAge/1000)}s old), forcing retry`);
        // Continue processing below
      } else {
        // Event is recent and unprocessed - another worker might be processing it
        // Return error to ensure provider retries (don't acknowledge with 200 OK)
        console.log(`[PAYMENT] Event ${data.eventId} is being processed by another worker (${Math.round(eventAge/1000)}s old) - returning error for retry`);
        return {
          success: false,
          message: 'Event is being processed (concurrent request - retry later)',
        };
      }
    }

    // Step 2: We successfully claimed this event - now process it
    const order = await storage.getOrder(data.orderId);
    if (!order) {
      throw new Error(`Order ${data.orderId} not found`);
    }

    // Step 3: Handle based on payment status (uses ATOMIC transaction methods)
    if (data.status === 'success') {
      console.log(`[PAYMENT] Payment success for order ${order.orderNumber}`);
      
      // ATOMIC: Commit stock + mark processed in single transaction
      await storage.commitReservationWithEvent(
        data.orderId,
        data.paymentId || data.eventId,
        data.eventId
      );

      const updatedOrder = await storage.getOrder(data.orderId);
      return {
        success: true,
        message: 'Payment confirmed and stock committed',
        order: updatedOrder,
      };
      
    } else if (data.status === 'failed') {
      console.log(`[PAYMENT] Payment failed for order ${order.orderNumber}`);
      
      // ATOMIC: Release stock + mark processed in single transaction
      await storage.releaseReservationWithEvent(
        data.orderId,
        'payment_failed',
        data.eventId
      );
      
      const updatedOrder = await storage.getOrder(data.orderId);
      return {
        success: true,
        message: 'Payment failed, stock released',
        order: updatedOrder,
      };
      
    } else {
      // Pending status - do nothing, wait for final status
      console.log(`[PAYMENT] Payment pending for order ${order.orderNumber}`);
      
      // Don't mark as processed - waiting for final status
      return {
        success: true,
        message: 'Payment pending (waiting for final status)',
        order,
      };
    }
    
  } catch (error: any) {
    console.error('[PAYMENT] Webhook processing error:', error);
    // Don't mark as processed on error - allow retry
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
  const reservationExpired = order.reservationExpiresAt ? now > order.reservationExpiresAt : undefined;

  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    status: order.status,
    reservationExpired,
  };
}
