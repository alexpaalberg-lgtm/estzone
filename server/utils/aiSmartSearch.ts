import { storage } from '../storage';
import type { Product } from '@shared/schema';

const synonymsEn: Record<string, string[]> = {
  'controller': ['gamepad', 'pad', 'remote', 'joystick', 'joypad'],
  'gamepad': ['controller', 'pad', 'remote', 'joystick', 'joypad'],
  'headset': ['headphones', 'earphones', 'audio', 'hearing'],
  'headphones': ['headset', 'earphones', 'audio'],
  'console': ['gaming system', 'system', 'machine', 'platform'],
  'playstation': ['ps', 'ps5', 'ps4', 'sony', 'play station'],
  'ps5': ['playstation 5', 'playstation5', 'play station 5', 'sony'],
  'ps4': ['playstation 4', 'playstation4', 'play station 4'],
  'xbox': ['xb', 'xbx', 'xsx', 'microsoft'],
  'nintendo': ['switch', 'nsw', 'nin'],
  'switch': ['nintendo switch', 'nintendo', 'nsw'],
  'vr': ['virtual reality', 'vr headset', 'vr set', 'virtual'],
  'keyboard': ['kb', 'keeb', 'keys'],
  'mouse': ['mice', 'gaming mouse'],
  'monitor': ['screen', 'display'],
  'chair': ['gaming chair', 'seat', 'racer'],
  'wheel': ['steering wheel', 'racing wheel', 'sim wheel'],
  'racing': ['sim', 'simulator', 'driving'],
  'wireless': ['bluetooth', 'cordless', 'bt'],
  'wired': ['cable', 'corded'],
  'elite': ['pro', 'premium', 'advanced'],
  'dualsense': ['dual sense', 'ps5 controller', 'playstation controller'],
  'joycon': ['joy-con', 'joy con', 'nintendo controller'],
  'game': ['mäng', 'title'],
  'accessory': ['accessories', 'tarvik', 'tarvikud'],
};

const synonymsEt: Record<string, string[]> = {
  'pult': ['kontroller', 'mängupult', 'gamepad'],
  'kontroller': ['pult', 'mängupult', 'gamepad'],
  'peakomplekt': ['kõrvaklapid', 'headset', 'audio'],
  'kõrvaklapid': ['peakomplekt', 'headset'],
  'konsool': ['mängukonsool', 'console', 'süsteem'],
  'mäng': ['game', 'videomäng'],
  'hiir': ['mouse', 'arvutihiir'],
  'klaviatuur': ['keyboard', 'kb'],
  'ekraan': ['monitor', 'kuvar'],
  'tool': ['mängutool', 'gaming chair'],
  'rool': ['mängurool', 'sõidurool', 'steering wheel'],
  'juhtmevaba': ['traadita', 'bluetooth', 'wireless'],
  'juhtmega': ['kaabliga', 'wired'],
  'tarvik': ['tarvikud', 'accessory', 'lisaseade'],
};

const commonTypos: Record<string, string> = {
  'playstaion': 'playstation',
  'playstaton': 'playstation',
  'plastation': 'playstation',
  'palystation': 'playstation',
  'playsation': 'playstation',
  'xboz': 'xbox',
  'xobx': 'xbox',
  'xbocks': 'xbox',
  'nintedno': 'nintendo',
  'nitendo': 'nintendo',
  'ninteno': 'nintendo',
  'nintndo': 'nintendo',
  'swich': 'switch',
  'swtich': 'switch',
  'switc': 'switch',
  'contorller': 'controller',
  'contoller': 'controller',
  'controler': 'controller',
  'controllr': 'controller',
  'controlelr': 'controller',
  'headsett': 'headset',
  'headest': 'headset',
  'hedset': 'headset',
  'hedaset': 'headset',
  'keybord': 'keyboard',
  'keybaord': 'keyboard',
  'keybard': 'keyboard',
  'keybroad': 'keyboard',
  'mous': 'mouse',
  'moues': 'mouse',
  'mosue': 'mouse',
  'wireles': 'wireless',
  'wirless': 'wireless',
  'wirelss': 'wireless',
  'dulsense': 'dualsense',
  'dualsens': 'dualsense',
  'dualsence': 'dualsense',
  'dualshok': 'dualshock',
  'dualschock': 'dualshock',
  'joycons': 'joycon',
  'joy-cons': 'joycon',
  'vitual': 'virtual',
  'virtal': 'virtual',
  'realitiy': 'reality',
  'realty': 'reality',
  'gamign': 'gaming',
  'gaiming': 'gaming',
  'gmaning': 'gaming',
  'monitr': 'monitor',
  'moniter': 'monitor',
  'monitro': 'monitor',
  'accesorry': 'accessory',
  'accesory': 'accessory',
  'accessorie': 'accessory',
};

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function correctTypo(word: string): string {
  const lower = word.toLowerCase();
  
  if (commonTypos[lower]) {
    return commonTypos[lower];
  }
  
  const allKnownWords = [
    ...Object.keys(synonymsEn),
    ...Object.keys(synonymsEt),
    ...Object.values(commonTypos),
    'playstation', 'xbox', 'nintendo', 'switch', 'controller', 'headset',
    'keyboard', 'mouse', 'monitor', 'wireless', 'gaming', 'dualsense',
    'dualshock', 'joycon', 'virtual', 'reality', 'console', 'accessory',
  ];

  let bestMatch = word;
  let bestDistance = Infinity;

  for (const known of allKnownWords) {
    if (Math.abs(known.length - lower.length) > 2) continue;
    
    const distance = levenshteinDistance(lower, known);
    
    if (distance <= 2 && distance < bestDistance) {
      bestDistance = distance;
      bestMatch = known;
    }
  }

  return bestMatch;
}

function expandWithSynonyms(words: string[]): string[] {
  const expanded = new Set<string>();
  
  for (const word of words) {
    expanded.add(word);
    
    const lower = word.toLowerCase();
    
    if (synonymsEn[lower]) {
      synonymsEn[lower].forEach(syn => expanded.add(syn));
    }
    
    if (synonymsEt[lower]) {
      synonymsEt[lower].forEach(syn => expanded.add(syn));
    }
  }
  
  return Array.from(expanded);
}

export interface SmartSearchResult {
  products: Product[];
  originalQuery: string;
  correctedQuery: string;
  didYouMean: string | null;
  expandedTerms: string[];
  totalResults: number;
}

export async function smartSearch(query: string, limit: number = 20): Promise<SmartSearchResult> {
  const originalQuery = query.trim();
  
  if (!originalQuery) {
    return {
      products: [],
      originalQuery,
      correctedQuery: originalQuery,
      didYouMean: null,
      expandedTerms: [],
      totalResults: 0,
    };
  }

  const words = originalQuery.toLowerCase().split(/\s+/);
  
  const correctedWords = words.map(word => correctTypo(word));
  const correctedQuery = correctedWords.join(' ');
  
  const expandedTerms = expandWithSynonyms(correctedWords);
  
  let allProducts: Product[] = [];
  
  const directResults = await storage.searchProducts(correctedQuery, limit);
  allProducts.push(...directResults);
  
  if (allProducts.length < limit) {
    for (const term of expandedTerms) {
      if (allProducts.length >= limit) break;
      if (term === correctedQuery) continue;
      
      const synonymResults = await storage.searchProducts(term, limit - allProducts.length);
      
      for (const product of synonymResults) {
        if (!allProducts.some(p => p.id === product.id)) {
          allProducts.push(product);
        }
      }
    }
  }

  if (allProducts.length < limit) {
    for (const word of correctedWords) {
      if (allProducts.length >= limit) break;
      
      const wordResults = await storage.searchProducts(word, limit - allProducts.length);
      
      for (const product of wordResults) {
        if (!allProducts.some(p => p.id === product.id)) {
          allProducts.push(product);
        }
      }
    }
  }

  const didYouMean = correctedQuery !== originalQuery.toLowerCase() ? correctedQuery : null;

  return {
    products: allProducts.slice(0, limit),
    originalQuery,
    correctedQuery,
    didYouMean,
    expandedTerms: expandedTerms.slice(0, 10),
    totalResults: allProducts.length,
  };
}

export function suggestCorrection(query: string): string | null {
  const words = query.toLowerCase().split(/\s+/);
  const correctedWords = words.map(word => correctTypo(word));
  const correctedQuery = correctedWords.join(' ');
  
  if (correctedQuery !== query.toLowerCase()) {
    return correctedQuery;
  }
  
  return null;
}

export function getSynonyms(word: string): string[] {
  const lower = word.toLowerCase();
  const synonyms = new Set<string>();
  
  if (synonymsEn[lower]) {
    synonymsEn[lower].forEach(syn => synonyms.add(syn));
  }
  
  if (synonymsEt[lower]) {
    synonymsEt[lower].forEach(syn => synonyms.add(syn));
  }
  
  return Array.from(synonyms);
}
