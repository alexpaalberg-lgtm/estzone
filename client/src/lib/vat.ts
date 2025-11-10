// Estonia VAT rate is 24%
export const VAT_RATE = 0.24;

export interface PriceBreakdown {
  subtotalExVat: number;
  vatAmount: number;
  total: number;
}

/**
 * Calculate VAT breakdown for prices that include VAT
 * @param priceInclVat - Price including 24% VAT
 * @returns Object with subtotal (ex VAT), VAT amount, and total
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
 * @param subtotalExVat - Price excluding VAT
 * @returns Total price including VAT
 */
export function addVat(subtotalExVat: number): number {
  return Number((subtotalExVat * (1 + VAT_RATE)).toFixed(2));
}

/**
 * Remove VAT from price to get subtotal
 * @param priceInclVat - Price including VAT
 * @returns Price excluding VAT
 */
export function removeVat(priceInclVat: number): number {
  return Number((priceInclVat / (1 + VAT_RATE)).toFixed(2));
}

/**
 * Calculate cart totals with VAT breakdown
 */
export function calculateCartTotals(items: Array<{ price: number; quantity: number }>, shippingCost: number = 0): PriceBreakdown & { itemsTotal: number; shipping: number } {
  const itemsTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalInclVat = itemsTotal + shippingCost;
  const breakdown = calculateVatBreakdown(totalInclVat);
  
  return {
    ...breakdown,
    itemsTotal,
    shipping: shippingCost,
  };
}
