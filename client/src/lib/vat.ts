/**
 * VAT (Value Added Tax) Utilities for Estonian E-Commerce
 * 
 * IMPORTANT ASSUMPTIONS:
 * 1. Product prices in the database represent CONSUMER-FACING prices (including 24% VAT)
 *    - This is standard practice in EU e-commerce where prices shown to consumers must include VAT
 *    - Example: A product priced at €99.00 in DB means €99.00 is what the customer pays
 * 
 * 2. Order storage separates VAT for accounting:
 *    - subtotal field: stores the NET amount (excluding VAT)
 *    - vatAmount field: stores the VAT portion (24%)
 *    - total field: stores the GROSS amount (including VAT) = subtotal + vatAmount
 * 
 * 3. All calculations maintain precision with proper rounding
 */

// Estonia VAT rate is 24%
export const VAT_RATE = 0.24;

export interface PriceBreakdown {
  subtotalExVat: number;  // Net price (excluding VAT)
  vatAmount: number;       // VAT portion (24%)
  total: number;           // Gross price (including VAT)
}

/**
 * Calculate VAT breakdown for prices that include VAT
 * 
 * Use this function when you have a consumer-facing price (gross price) and need to
 * extract the net price and VAT amount for accounting purposes.
 * 
 * Formula:
 * - Net price = Gross price / 1.24
 * - VAT amount = Gross price - Net price
 * 
 * @param priceInclVat - Price including 24% VAT (gross price)
 * @returns Object with subtotal (ex VAT), VAT amount, and total
 * 
 * @example
 * calculateVatBreakdown(99.00)
 * // Returns: { subtotalExVat: 79.84, vatAmount: 19.16, total: 99.00 }
 */
export function calculateVatBreakdown(priceInclVat: number): PriceBreakdown {
  const total = priceInclVat;
  const subtotalExVat = total / (1 + VAT_RATE);
  const vatAmount = total - subtotalExVat;
  
  return {
    subtotalExVat: Number(subtotalExVat.toFixed(2)),
    vatAmount: Number(vatAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Calculate total price from subtotal (excluding VAT)
 * 
 * Use this when you have a net price and need to calculate the gross price
 * by adding VAT.
 * 
 * @param subtotalExVat - Price excluding VAT (net price)
 * @returns Total price including VAT (gross price)
 * 
 * @example
 * addVat(79.84)
 * // Returns: 99.00
 */
export function addVat(subtotalExVat: number): number {
  return Number((subtotalExVat * (1 + VAT_RATE)).toFixed(2));
}

/**
 * Remove VAT from price to get subtotal
 * 
 * @param priceInclVat - Price including VAT (gross price)
 * @returns Price excluding VAT (net price)
 * 
 * @example
 * removeVat(99.00)
 * // Returns: 79.84
 */
export function removeVat(priceInclVat: number): number {
  return Number((priceInclVat / (1 + VAT_RATE)).toFixed(2));
}

/**
 * Calculate cart totals with VAT breakdown
 * 
 * Assumes item prices are VAT-inclusive (gross prices)
 * 
 * @param items - Array of cart items with price and quantity
 * @param shippingCost - Shipping cost (assumed to be VAT-inclusive)
 * @returns Complete price breakdown including items total and shipping
 */
export function calculateCartTotals(
  items: Array<{ price: number; quantity: number }>, 
  shippingCost: number = 0
): PriceBreakdown & { itemsTotal: number; shipping: number } {
  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalInclVat = itemsTotal + shippingCost;
  const breakdown = calculateVatBreakdown(totalInclVat);
  
  return {
    ...breakdown,
    itemsTotal,
    shipping: shippingCost,
  };
}
