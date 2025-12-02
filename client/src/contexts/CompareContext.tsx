import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product } from '@shared/schema';

interface CompareContextType {
  compareItems: string[];
  addToCompare: (productId: string) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  canAddMore: boolean;
  compareCount: number;
  MAX_COMPARE_ITEMS: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;
const STORAGE_KEY = 'estzone_compare';

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareItems, setCompareItems] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compareItems));
    } catch {
    }
  }, [compareItems]);
  
  const addToCompare = useCallback((productId: string): boolean => {
    if (compareItems.length >= MAX_COMPARE_ITEMS) {
      return false;
    }
    if (compareItems.includes(productId)) {
      return true;
    }
    setCompareItems(prev => [...prev, productId]);
    return true;
  }, [compareItems]);
  
  const removeFromCompare = useCallback((productId: string) => {
    setCompareItems(prev => prev.filter(id => id !== productId));
  }, []);
  
  const clearCompare = useCallback(() => {
    setCompareItems([]);
  }, []);
  
  const isInCompare = useCallback((productId: string): boolean => {
    return compareItems.includes(productId);
  }, [compareItems]);
  
  const canAddMore = compareItems.length < MAX_COMPARE_ITEMS;
  const compareCount = compareItems.length;
  
  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      canAddMore,
      compareCount,
      MAX_COMPARE_ITEMS,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
