import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Currency = 'EUR' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRate: number;
  formatPrice: (price: number | string) => string;
  convertPrice: (price: number | string, fromCurrency?: Currency) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

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

  const convertPrice = (price: number | string, fromCurrency: Currency = 'EUR'): number => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (fromCurrency === currency) {
      return numPrice;
    }
    
    if (fromCurrency === 'EUR' && currency === 'USD') {
      return numPrice * exchangeRate;
    }
    
    if (fromCurrency === 'USD' && currency === 'EUR') {
      return numPrice / exchangeRate;
    }
    
    return numPrice;
  };

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    const converted = convertPrice(numPrice, 'EUR');
    
    if (currency === 'EUR') {
      return `€${converted.toFixed(2)}`;
    } else {
      return `$${converted.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ 
      currency, 
      setCurrency, 
      exchangeRate,
      formatPrice,
      convertPrice
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
