import { storage } from '../storage';
import { db } from '../db';
import * as schema from '@shared/schema';
import { sendWishlistPriceAlert } from './automationEmails';

interface PriceHistory {
  productId: string;
  prices: Array<{
    price: number;
    salePrice?: number;
    timestamp: Date;
  }>;
}

interface WishlistAlertResult {
  checked: number;
  alertsSent: number;
  errors: string[];
}

export async function checkWishlistPriceDrops(): Promise<WishlistAlertResult> {
  const result: WishlistAlertResult = {
    checked: 0,
    alertsSent: 0,
    errors: [],
  };

  try {
    const allWishlists = await db.select().from(schema.wishlists);
    const userIds = [...new Set(allWishlists.map(w => w.userId))];
    
    const products = await storage.getProducts();
    const productMap = new Map(products.map(p => [p.id, p]));
    
    const priceHistoryData = await storage.getAIReport('product-price-history') || { history: {} };
    const priceHistory: Record<string, PriceHistory> = priceHistoryData.history || {};
    const lastAlertsSent = await storage.getAIReport('wishlist-alerts-sent') || { alerts: {} };
    const alertsSent: Record<string, Record<string, number>> = lastAlertsSent.alerts || {};

    for (const userId of userIds) {
      const user = await storage.getUser(userId);
      if (!user || !user.email) continue;

      const userWishlist = allWishlists.filter(w => w.userId === userId);
      if (userWishlist.length === 0) continue;

      result.checked++;
      
      const priceDropProducts: Array<{
        product: any;
        oldPrice: number;
        newPrice: number;
        discount: number;
      }> = [];

      for (const wishlistItem of userWishlist) {
        const productId = wishlistItem.productId;
        const product = productMap.get(productId);
        if (!product || !product.isActive) continue;

        const currentPrice = parseFloat(product.salePrice || product.price);
        const history = priceHistory[productId];
        
        if (!history || history.prices.length === 0) {
          if (!priceHistory[productId]) {
            priceHistory[productId] = { productId, prices: [] };
          }
          priceHistory[productId].prices.push({
            price: parseFloat(product.price),
            salePrice: product.salePrice ? parseFloat(product.salePrice) : undefined,
            timestamp: new Date(),
          });
          continue;
        }

        const previousEntry = history.prices[history.prices.length - 1];
        const previousPrice = previousEntry.salePrice || previousEntry.price;
        
        if (currentPrice < previousPrice) {
          const discount = Math.round(((previousPrice - currentPrice) / previousPrice) * 100);
          
          if (discount >= 5) {
            const userAlerts = alertsSent[user.id] || {};
            const lastAlertTime = userAlerts[productId] || 0;
            const hoursSinceLastAlert = (Date.now() - lastAlertTime) / (1000 * 60 * 60);
            
            if (hoursSinceLastAlert >= 24) {
              priceDropProducts.push({
                product,
                oldPrice: previousPrice,
                newPrice: currentPrice,
                discount,
              });
            }
          }
        }

        priceHistory[productId].prices.push({
          price: parseFloat(product.price),
          salePrice: product.salePrice ? parseFloat(product.salePrice) : undefined,
          timestamp: new Date(),
        });
        
        if (priceHistory[productId].prices.length > 30) {
          priceHistory[productId].prices = priceHistory[productId].prices.slice(-30);
        }
      }

      if (priceDropProducts.length > 0) {
        try {
          const language = (user as any).preferredLanguage === 'et' ? 'et' : 'en';
          const userName = user.firstName || user.username || 'Gamer';
          
          await sendWishlistPriceAlert(user.email, userName, priceDropProducts, language);
          
          if (!alertsSent[user.id]) {
            alertsSent[user.id] = {};
          }
          for (const item of priceDropProducts) {
            alertsSent[user.id][item.product.id] = Date.now();
          }
          
          result.alertsSent++;
          console.log(`[WISHLIST] Sent price drop alert to ${user.email} for ${priceDropProducts.length} products`);
        } catch (error: any) {
          result.errors.push(`Failed to send alert to ${user.email}: ${error.message}`);
        }
      }
    }

    await storage.saveAIReport('product-price-history', { history: priceHistory, lastUpdated: new Date() });
    await storage.saveAIReport('wishlist-alerts-sent', { alerts: alertsSent, lastUpdated: new Date() });

    console.log(`[WISHLIST] Checked ${result.checked} users, sent ${result.alertsSent} alerts`);
    
  } catch (error: any) {
    result.errors.push(error.message);
    console.error('[WISHLIST] Error checking price drops:', error);
  }

  return result;
}

export async function recordPriceChange(productId: string, oldPrice: number, newPrice: number): Promise<void> {
  const priceHistoryData = await storage.getAIReport('product-price-history') || { history: {} };
  const priceHistory: Record<string, PriceHistory> = priceHistoryData.history || {};
  
  if (!priceHistory[productId]) {
    priceHistory[productId] = { productId, prices: [] };
  }

  priceHistory[productId].prices.push({
    price: newPrice,
    timestamp: new Date(),
  });

  if (priceHistory[productId].prices.length > 30) {
    priceHistory[productId].prices = priceHistory[productId].prices.slice(-30);
  }

  await storage.saveAIReport('product-price-history', { history: priceHistory, lastUpdated: new Date() });
}

export async function getProductPriceHistory(productId: string): Promise<PriceHistory | null> {
  const priceHistoryData = await storage.getAIReport('product-price-history') || { history: {} };
  return priceHistoryData.history[productId] || null;
}
