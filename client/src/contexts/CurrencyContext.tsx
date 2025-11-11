import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  formatPrice: (price: number | string) => string;
  formatDualPrice: (price: number | string) => string;
  convertCurrency: (amount: number, from: Currency, to: Currency) => number;
  toDisplay: (amountInEur: number) => number;
  fromDisplay: (amountInDisplayCurrency: number) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Base currency for all storage and calculations
export const BASE_CURRENCY: Currency = 'EUR';

// Exchange rate: 1 EUR = 1.09 USD (configurable)
const EUR_TO_USD_RATE = 1.09;

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved === 'EUR' || saved === 'USD') ? saved : 'EUR';
  });

  const [exchangeRate] = useState(EUR_TO_USD_RATE);

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
  };

  /**
   * Convert amount between any two currencies
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Target currency
   * @returns Converted amount
   */
  const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
    if (from === to) return amount;
    
    if (from === 'EUR' && to === 'USD') {
      return amount * exchangeRate;
    }
    
    if (from === 'USD' && to === 'EUR') {
      return amount / exchangeRate;
    }
    
    return amount;
  };

  /**
   * Convert amount from base currency (EUR) to current display currency
   * @param amountInEur - Amount in EUR (base currency)
   * @returns Amount in current display currency
   */
  const toDisplay = (amountInEur: number): number => {
    return convertCurrency(amountInEur, 'EUR', currency);
  };

  /**
   * Convert amount from current display currency back to base currency (EUR)
   * Use this when persisting displayed amounts to the database
   * @param amountInDisplayCurrency - Amount in current display currency
   * @returns Amount in EUR (base currency)
   */
  const fromDisplay = (amountInDisplayCurrency: number): number => {
    return convertCurrency(amountInDisplayCurrency, currency, 'EUR');
  };

  /**
   * Format a price in EUR for display in current currency
   * @param price - Price in EUR (base currency)
   * @returns Formatted price string with currency symbol
   */
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const displayAmount = toDisplay(numPrice);
    
    if (currency === 'EUR') {
      return `€${displayAmount.toFixed(2)}`;
    } else {
      return `$${displayAmount.toFixed(2)}`;
    }
  };

  /**
   * Format a price showing both EUR and USD for easy comparison
   * @param price - Price in EUR (base currency)
   * @returns Formatted price string with both currencies (e.g., "€99.99 / $109.00")
   */
  const formatDualPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const eurAmount = numPrice;
    const usdAmount = convertCurrency(eurAmount, 'EUR', 'USD');
    
    return `€${eurAmount.toFixed(2)} / $${usdAmount.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      exchangeRate,
      formatPrice,
      formatDualPrice,
      convertCurrency,
      toDisplay,
      fromDisplay
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
