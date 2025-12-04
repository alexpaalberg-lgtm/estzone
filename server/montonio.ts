import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response } from "express";
import { storage } from "./storage";
import { emailService } from "./utils/email";

/* Montonio Stargate API Integration
 * Documentation: https://docs.montonio.com/api/stargate/
 */

/**
 * Get Montonio config at runtime - checks env vars on each call
 * This ensures secrets added after server start are picked up
 */
function getMontonioConfig() {
  const accessKey = process.env.MONTONIO_ACCESS_KEY;
  const secretKey = process.env.MONTONIO_SECRET_KEY;
  const isEnabled = !!(accessKey && secretKey);
  
  return { accessKey, secretKey, isEnabled };
}

// Log status at startup (but don't cache the result)
const startupConfig = getMontonioConfig();
console.log(`[MONTONIO] Startup check: ${startupConfig.isEnabled ? '✅ Credentials found' : '⚠️ Credentials not configured'}`);
if (!startupConfig.isEnabled) {
  console.log('[MONTONIO] Note: Credentials will be checked again on each request');
}

// Stargate API URLs - Always use production since we have live keys
// Set MONTONIO_USE_SANDBOX=true to use sandbox environment for testing
const MONTONIO_API_URL = process.env.MONTONIO_USE_SANDBOX === "true"
  ? "https://sandbox-stargate.montonio.com/api"
  : "https://stargate.montonio.com/api";

// Montonio payment method types
export type MontonioPaymentMethod = 
  | 'montonio_bank'     // Bank payments (SEB, Swedbank, LHV, etc.)
  | 'montonio_card'     // Card payments (Visa, MC, Apple Pay, Google Pay)
  | 'montonio_bnpl'     // Buy Now Pay Later
  | 'montonio_financing'; // Long-term financing via Inbank

interface MontonioAddress {
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  locality: string;
  region?: string;
  country: string;
  postalCode: string;
}

interface MontonioLineItem {
  name: string;
  quantity: number;
  finalPrice: number;
}

interface MontonioPayment {
  method: string;
  methodDisplay: string;
  amount: number;
  currency: string;
  methodOptions?: {
    paymentDescription?: string;
    preferredCountry?: string;
    preferredProvider?: string;
  };
}

interface MontonioOrderPayload {
  accessKey: string;
  merchantReference: string;
  returnUrl: string;
  notificationUrl: string;
  currency: string;
  grandTotal: number;
  locale: string;
  billingAddress: MontonioAddress;
  shippingAddress: MontonioAddress;
  lineItems: MontonioLineItem[];
  payment: MontonioPayment;
  exp?: number;
}

/**
 * Map frontend payment method to Montonio API payment method
 */
function mapPaymentMethodToMontonio(method: MontonioPaymentMethod): { method: string; display: string } {
  switch (method) {
    case 'montonio_bank':
      return { method: 'paymentInitiation', display: 'Pangalink' };
    case 'montonio_card':
      return { method: 'cardPayments', display: 'Kaardimakse' };
    case 'montonio_bnpl':
      return { method: 'bnpl', display: 'Maksa hiljem' };
    case 'montonio_financing':
      return { method: 'hirePurchase', display: 'Järelmaks' };
    default:
      return { method: 'paymentInitiation', display: 'Pangalink' };
  }
}

/**
 * Create a Montonio order JWT token
 */
function createMontonioOrderToken(payload: MontonioOrderPayload, secretKey: string): string {
  return jwt.sign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '10m'
  });
}

/**
 * Create Montonio payment - API endpoint handler
 */
export async function createMontonioPayment(req: Request, res: Response) {
  console.log('[MONTONIO] Payment request received');
  
  // Check credentials at runtime
  const config = getMontonioConfig();
  if (!config.isEnabled) {
    console.error('[MONTONIO] Not enabled - missing credentials');
    return res.status(503).json({ 
      error: "Montonio is not configured. Please add MONTONIO_ACCESS_KEY and MONTONIO_SECRET_KEY." 
    });
  }

  try {
    const { 
      amount, 
      currency, 
      orderId, 
      customerEmail, 
      customerName,
      paymentMethod,
      shippingAddress,
      lineItems 
    } = req.body;
    
    console.log('[MONTONIO] Request data:', { orderId, amount, paymentMethod, customerEmail });

    // Validate required fields
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    if (!orderId || !customerEmail || !customerName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate payment method
    const validMethods: MontonioPaymentMethod[] = ['montonio_bank', 'montonio_card', 'montonio_bnpl', 'montonio_financing'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Build base URL
    const baseUrl = process.env.BASE_URL || 
      (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');

    // Parse customer name
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Map country names to ISO codes
    const countryToCode: { [key: string]: string } = {
      'Estonia': 'EE',
      'Latvia': 'LV', 
      'Lithuania': 'LT',
      'Finland': 'FI',
      'Poland': 'PL',
      'Germany': 'DE',
    };
    const countryCode = shippingAddress?.countryCode || 
      countryToCode[shippingAddress?.country] || 'EE';

    // Build address from shipping data or defaults
    const address: MontonioAddress = {
      firstName,
      lastName,
      email: customerEmail,
      addressLine1: shippingAddress?.street || 'N/A',
      locality: shippingAddress?.city || 'Tallinn',
      region: shippingAddress?.region || '',
      country: countryCode,
      postalCode: shippingAddress?.postalCode || '10000'
    };

    // Build line items - finalPrice must be the line total (price * quantity)
    const items: MontonioLineItem[] = lineItems?.length > 0 
      ? lineItems.map((item: any) => ({
          name: item.name || 'Product',
          quantity: item.quantity || 1,
          finalPrice: (parseFloat(item.price) || 0) * (item.quantity || 1)
        }))
      : [{ name: `EstZone Order ${orderId}`, quantity: 1, finalPrice: parseFloat(amount) }];

    // Map payment method
    const { method, display } = mapPaymentMethodToMontonio(paymentMethod);

    // Build payment object
    const payment: MontonioPayment = {
      method,
      methodDisplay: display,
      amount: parseFloat(amount),
      currency: currency || 'EUR',
      methodOptions: {
        paymentDescription: `EstZone tellimus ${orderId}`,
        preferredCountry: countryCode
      }
    };

    // Create the order payload
    const orderPayload: MontonioOrderPayload = {
      accessKey: config.accessKey!,
      merchantReference: orderId,
      returnUrl: `${baseUrl}/api/payments/montonio/return`,
      notificationUrl: `${baseUrl}/api/payments/montonio/webhook`,
      currency: currency || 'EUR',
      grandTotal: parseFloat(amount),
      locale: 'et',
      billingAddress: address,
      shippingAddress: address,
      lineItems: items,
      payment
    };

    // Generate JWT token
    const token = createMontonioOrderToken(orderPayload, config.secretKey!);

    console.log('[MONTONIO] Sending to API:', MONTONIO_API_URL);
    console.log('[MONTONIO] Using BASE_URL:', baseUrl);
    console.log('[MONTONIO] Return URL:', orderPayload.returnUrl);

    // POST to Montonio Stargate API
    const response = await fetch(`${MONTONIO_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data: token })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[MONTONIO] API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `Montonio API error: ${response.status}`,
        details: errorData 
      });
    }

    const data = await response.json();

    if (!data.paymentUrl) {
      console.error('[MONTONIO] No paymentUrl in response:', data);
      return res.status(500).json({ error: "No payment URL received from Montonio" });
    }

    console.log(`[MONTONIO] Order created: ${orderId} -> ${data.uuid || 'pending'}`);

    return res.json({
      success: true,
      paymentUrl: data.paymentUrl,
      provider: 'montonio',
      method: paymentMethod,
      montonioOrderUuid: data.uuid
    });

  } catch (error: any) {
    console.error('[MONTONIO] Payment creation failed:', error);
    return res.status(500).json({ error: error.message || "Failed to create Montonio payment" });
  }
}

/**
 * Handle Montonio webhook - payment status notification
 */
export async function handleMontonioWebhook(req: Request, res: Response) {
  // Check credentials at runtime
  const config = getMontonioConfig();
  if (!config.isEnabled) {
    console.warn('[MONTONIO] Webhook called but Montonio not configured');
    return res.status(503).send("ERROR");
  }

  try {
    const webhookData = req.body;
    const { orderToken } = webhookData;

    if (!orderToken) {
      console.error('[MONTONIO] Webhook missing orderToken');
      return res.status(400).send("ERROR");
    }

    // Decode and verify the token
    let decoded: any;
    try {
      decoded = jwt.verify(orderToken, config.secretKey!, {
        algorithms: ['HS256']
      });
    } catch (jwtError) {
      console.error('[MONTONIO] Invalid webhook token:', jwtError);
      return res.status(401).send("ERROR");
    }

    const { merchantReference, paymentStatus } = decoded;
    console.log(`[MONTONIO] Webhook received for order ${merchantReference}: status=${paymentStatus}`);

    // Update order status based on Montonio status
    try {
      const order = await storage.getOrderByNumber(merchantReference);
      if (!order) {
        console.error(`[MONTONIO] Order not found: ${merchantReference}`);
        return res.status(200).send("OK");
      }

      if (paymentStatus === 'PAID' || paymentStatus === 'AUTHORIZED') {
        await storage.updateOrderStatus(order.id, 'processing', 'completed');
        console.log(`[MONTONIO] Order ${merchantReference} payment confirmed`);
        
        // Send confirmation email
        const orderItems = await storage.getOrderItems(order.id);
        await emailService.sendOrderConfirmation(order, orderItems, 'et');
        console.log(`[MONTONIO] Confirmation email sent for order ${merchantReference}`);
      } else if (paymentStatus === 'VOIDED' || paymentStatus === 'REFUNDED' || paymentStatus === 'ABANDONED') {
        await storage.updateOrderStatus(order.id, 'cancelled', 'failed');
        console.log(`[MONTONIO] Order ${merchantReference} payment ${paymentStatus}`);
      }
    } catch (updateError) {
      console.error(`[MONTONIO] Error updating order ${merchantReference}:`, updateError);
    }

    return res.status(200).send("OK");

  } catch (error: any) {
    console.error('[MONTONIO] Webhook processing failed:', error);
    return res.status(500).send("ERROR");
  }
}

/**
 * Handle customer return after payment
 */
export async function handleMontonioReturn(req: Request, res: Response) {
  // Check credentials at runtime
  const config = getMontonioConfig();
  if (!config.isEnabled) {
    return res.redirect('/checkout?error=payment_failed');
  }

  try {
    const { orderToken } = req.query;

    if (!orderToken || typeof orderToken !== 'string') {
      console.error('[MONTONIO] Return missing orderToken');
      return res.redirect('/checkout?error=missing_token');
    }

    // Decode and verify the token
    let decoded: any;
    try {
      decoded = jwt.verify(orderToken, config.secretKey!, {
        algorithms: ['HS256']
      });
    } catch (jwtError) {
      console.error('[MONTONIO] Invalid return token:', jwtError);
      return res.redirect('/checkout?error=invalid_token');
    }

    const { merchantReference, paymentStatus } = decoded;
    console.log(`[MONTONIO] Customer returned for order ${merchantReference}: status=${paymentStatus}`);

    if (paymentStatus === 'PAID' || paymentStatus === 'AUTHORIZED' || paymentStatus === 'PENDING') {
      return res.redirect(`/order-confirmation?orderId=${merchantReference}`);
    } else {
      return res.redirect(`/checkout?error=payment_${paymentStatus?.toLowerCase() || 'failed'}`);
    }

  } catch (error: any) {
    console.error('[MONTONIO] Return handling failed:', error);
    return res.redirect('/checkout?error=payment_error');
  }
}

/**
 * Check if Montonio is enabled - checks at runtime
 */
export function isMontonioAvailable(): boolean {
  return getMontonioConfig().isEnabled;
}
