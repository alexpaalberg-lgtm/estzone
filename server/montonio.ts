import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Request, Response } from "express";

/* Montonio Payment Gateway Integration */

const { MONTONIO_ACCESS_KEY, MONTONIO_SECRET_KEY } = process.env;

// Make Montonio optional - will be enabled once credentials are provided
const isMontonioEnabled = !!(MONTONIO_ACCESS_KEY && MONTONIO_SECRET_KEY);

if (!isMontonioEnabled) {
  console.warn("⚠️  Montonio credentials not configured. Montonio payments will be disabled.");
}

const MONTONIO_GATEWAY_URL = process.env.NODE_ENV === "production"
  ? "https://gateway.montonio.com"
  : "https://sandbox.montonio.com";

// Replay protection: Track used nonces in memory
// For production, replace with database-backed solution
interface NonceEntry {
  nonce: string;
  expiry: number;
}

const usedNonces = new Map<string, NonceEntry>();

// Cleanup expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(usedNonces.entries());
  for (const [key, entry] of entries) {
    if (entry.expiry < now) {
      usedNonces.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface MontonioPaymentData {
  amount: string;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  notificationUrl: string;
}

interface MontonioJWTPayload {
  access_key: string;
  merchant_reference: string;
  currency: string;
  grand_total: string;
  checkout_email: string;
  checkout_first_name?: string;
  checkout_last_name?: string;
  merchant_return_url: string;
  merchant_notification_url: string;
  payment_information_unstructured?: string;
  preselected_locale?: string;
  exp: number;
  iat: number;
  nonce: string;
}

/**
 * Generate a nonce for replay protection
 */
function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a Montonio payment JWT token with replay protection
 */
export function createMontonioPaymentToken(data: MontonioPaymentData): string {
  if (!isMontonioEnabled || !MONTONIO_ACCESS_KEY || !MONTONIO_SECRET_KEY) {
    throw new Error("Montonio is not configured");
  }

  const now = Math.floor(Date.now() / 1000);
  const [firstName, ...lastNameParts] = data.customerName.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  // Generate unique nonce and track it for replay protection
  const nonce = generateNonce();
  const nonceKey = `${data.orderId}-${nonce}`;
  const expiry = (now + 600) * 1000; // Convert to milliseconds

  // Store nonce with expiry (15 minutes to allow for processing delays)
  usedNonces.set(nonceKey, { nonce, expiry });

  const payload: MontonioJWTPayload = {
    access_key: MONTONIO_ACCESS_KEY,
    merchant_reference: data.orderId,
    currency: data.currency,
    grand_total: data.amount,
    checkout_email: data.customerEmail,
    checkout_first_name: firstName,
    checkout_last_name: lastName,
    merchant_return_url: data.returnUrl,
    merchant_notification_url: data.notificationUrl,
    payment_information_unstructured: `EstZone Order ${data.orderId}`,
    preselected_locale: 'et',
    iat: now,
    exp: now + 600, // 10 minutes expiration (Montonio requirement)
    nonce,
  };

  return jwt.sign(payload, MONTONIO_SECRET_KEY, {
    algorithm: 'HS256',
  });
}

/**
 * Verify Montonio webhook signature (timing-attack safe)
 */
export function verifyMontonioWebhookSignature(payload: string, signature: string): boolean {
  if (!isMontonioEnabled || !MONTONIO_SECRET_KEY) {
    throw new Error("Montonio is not configured");
  }

  const expectedSignature = crypto
    .createHmac('sha256', MONTONIO_SECRET_KEY)
    .update(payload)
    .digest('hex');

  // Check lengths first to prevent timingSafeEqual from throwing
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    // If timingSafeEqual throws for any reason, treat as invalid
    console.error('[MONTONIO] Signature comparison error:', error);
    return false;
  }
}

/**
 * Decode and verify Montonio JWT token with replay protection
 */
export function verifyMontonioToken(token: string): MontonioJWTPayload | null {
  if (!isMontonioEnabled || !MONTONIO_SECRET_KEY) {
    throw new Error("Montonio is not configured");
  }

  try {
    const decoded = jwt.verify(token, MONTONIO_SECRET_KEY, {
      algorithms: ['HS256'],
    }) as MontonioJWTPayload;
    
    // Check for replay attack: verify nonce hasn't been used
    const nonceKey = `${decoded.merchant_reference}-${decoded.nonce}`;
    if (!usedNonces.has(nonceKey)) {
      console.error('[MONTONIO] Token replay detected: nonce not found or already consumed');
      return null;
    }

    // Nonce is valid and exists - it will be removed after webhook processing
    return decoded;
  } catch (error) {
    console.error('[MONTONIO] Token verification failed:', error);
    return null;
  }
}

/**
 * Create Montonio payment - API endpoint handler
 * 
 * TODO: Add rate limiting to prevent abuse (recommended: max 10 requests/minute per IP)
 */
export async function createMontonioPayment(req: Request, res: Response) {
  if (!isMontonioEnabled) {
    return res.status(503).json({ 
      error: "Montonio is not configured. Please add MONTONIO_ACCESS_KEY and MONTONIO_SECRET_KEY." 
    });
  }

  try {
    const { amount, currency, orderId, customerEmail, customerName } = req.body;

    // Validate required fields
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid amount. Amount must be a positive number." });
    }

    if (!currency || !['EUR', 'USD'].includes(currency)) {
      return res.status(400).json({ error: "Invalid currency. Supported currencies: EUR, USD." });
    }

    if (!orderId || !customerEmail || !customerName) {
      return res.status(400).json({ error: "Missing required fields: orderId, customerEmail, customerName." });
    }

    // Build return and notification URLs from configured base URL
    // Never trust Host header to prevent host-header injection attacks
    const baseUrl = process.env.BASE_URL || 
      (process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` : 'http://localhost:5000');

    const paymentData: MontonioPaymentData = {
      amount: parseFloat(amount).toFixed(2),
      currency: currency === 'USD' ? 'EUR' : currency, // Montonio primarily uses EUR
      orderId,
      customerEmail,
      customerName,
      returnUrl: `${baseUrl}/api/payments/montonio/return`,
      notificationUrl: `${baseUrl}/api/payments/montonio/webhook`,
    };

    // Generate JWT token
    const paymentToken = createMontonioPaymentToken(paymentData);

    // Build gateway redirect URL
    const gatewayUrl = `${MONTONIO_GATEWAY_URL}?payment_token=${paymentToken}`;

    console.log(`[MONTONIO] Payment created for order ${orderId}: ${amount} ${currency}`);

    return res.json({
      success: true,
      paymentUrl: gatewayUrl,
      provider: 'montonio',
    });

  } catch (error: any) {
    console.error('[MONTONIO] Payment creation failed:', error);
    return res.status(500).json({ error: error.message || "Failed to create Montonio payment." });
  }
}

/**
 * Handle Montonio webhook - payment status notification
 * Uses raw body captured by global express.json middleware for HMAC verification
 * Implements replay protection by validating and consuming nonces
 */
export async function handleMontonioWebhook(req: Request, res: Response) {
  if (!isMontonioEnabled) {
    console.warn('[MONTONIO] Webhook called but Montonio not configured');
    return res.status(503).send("ERROR");
  }

  try {
    // Get raw body for signature verification (captured by global express.json middleware)
    const rawBody = (req as any).rawBody as Buffer;
    if (!rawBody) {
      console.error('[MONTONIO] Webhook missing raw body - raw body middleware may not be configured');
      return res.status(400).send("ERROR");
    }
    
    const signature = req.headers['x-montonio-signature'] as string;

    if (!signature) {
      console.error('[MONTONIO] Webhook missing signature header');
      return res.status(400).send("ERROR");
    }

    // Verify webhook signature using the exact raw payload (convert Buffer to string)
    const isValid = verifyMontonioWebhookSignature(rawBody.toString('utf8'), signature);
    if (!isValid) {
      console.error('[MONTONIO] Webhook signature verification failed');
      return res.status(401).send("ERROR");
    }

    const webhookData = req.body;
    const { status, merchant_reference, payment_token } = webhookData;

    console.log(`[MONTONIO] Webhook received for order ${merchant_reference}: status=${status}`);

    // Verify and consume the payment token to prevent replay attacks
    if (payment_token) {
      const decoded = verifyMontonioToken(payment_token);
      if (!decoded) {
        console.error('[MONTONIO] Webhook with invalid or replayed payment token');
        return res.status(400).send("ERROR");
      }

      // Consume the nonce to prevent replay
      const nonceKey = `${decoded.merchant_reference}-${decoded.nonce}`;
      usedNonces.delete(nonceKey);
      console.log(`[MONTONIO] Nonce consumed for order ${merchant_reference}`);
    }

    // TODO: Update order status in database based on webhook data
    // This should integrate with your storage layer
    // Example: await storage.updateOrderPaymentStatus(merchant_reference, status);

    // Montonio requires "OK" response for successful webhook processing
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
  if (!isMontonioEnabled) {
    return res.status(503).json({ error: "Montonio is not configured" });
  }

  try {
    const { payment_token } = req.query;

    if (!payment_token || typeof payment_token !== 'string') {
      return res.status(400).json({ error: "Missing payment token" });
    }

    // Verify and decode the JWT token
    const decoded = verifyMontonioToken(payment_token);

    if (!decoded) {
      return res.status(400).json({ error: "Invalid payment token" });
    }

    console.log(`[MONTONIO] Customer returned for order ${decoded.merchant_reference}`);

    // Redirect to order confirmation page
    return res.redirect(`/order-confirmation?orderId=${decoded.merchant_reference}`);

  } catch (error: any) {
    console.error('[MONTONIO] Return handling failed:', error);
    return res.status(500).json({ error: "Failed to process return" });
  }
}
