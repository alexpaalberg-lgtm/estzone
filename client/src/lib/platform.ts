export type Platform = 'ps5' | 'xbox' | 'nintendo' | 'pc' | 'multi' | null;

export interface PlatformInfo {
  platform: Platform;
  label: string;
  labelEt: string;
  color: string;
  bgColor: string;
}

export const platformStyles: Record<NonNullable<Platform>, PlatformInfo> = {
  ps5: {
    platform: 'ps5',
    label: 'PS5',
    labelEt: 'PS5',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
  },
  xbox: {
    platform: 'xbox',
    label: 'Xbox',
    labelEt: 'Xbox',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
  },
  nintendo: {
    platform: 'nintendo',
    label: 'Switch',
    labelEt: 'Switch',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
  },
  pc: {
    platform: 'pc',
    label: 'PC',
    labelEt: 'PC',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20 border-gray-500/30',
  },
  multi: {
    platform: 'multi',
    label: 'Multi',
    labelEt: 'Multi',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
  },
};

export function detectPlatform(sku: string, name?: string, categoryId?: string): Platform {
  const skuUpper = sku.toUpperCase();
  const nameUpper = (name || '').toUpperCase();
  
  if (skuUpper.startsWith('PS5-') || skuUpper.includes('-PS5-') || skuUpper.endsWith('-PS')) {
    return 'ps5';
  }
  if (skuUpper.startsWith('XBX-') || skuUpper.includes('-XBX-') || skuUpper.endsWith('-XB')) {
    return 'xbox';
  }
  if (skuUpper.startsWith('NSW-') || skuUpper.includes('-NSW-') || skuUpper.endsWith('-NI')) {
    return 'nintendo';
  }
  
  if (skuUpper.startsWith('GAME-')) {
    if (skuUpper.includes('-PL')) return 'ps5';
    if (skuUpper.includes('-XB')) return 'xbox';
    if (skuUpper.includes('-NI')) return 'nintendo';
  }
  
  if (nameUpper.includes('PS5') || nameUpper.includes('PLAYSTATION 5') || nameUpper.includes('DUALSENSE')) {
    return 'ps5';
  }
  if (nameUpper.includes('PS4') || nameUpper.includes('PLAYSTATION 4') || nameUpper.includes('DUALSHOCK')) {
    return 'ps5';
  }
  if (nameUpper.includes('PSVR') || nameUpper.includes('PLAYSTATION VR')) {
    return 'ps5';
  }
  
  if (nameUpper.includes('XBOX') || nameUpper.includes('SERIES X') || nameUpper.includes('SERIES S')) {
    return 'xbox';
  }
  
  if (nameUpper.includes('NINTENDO') || nameUpper.includes('SWITCH') || 
      nameUpper.includes('JOY-CON') || nameUpper.includes('JOYCON') ||
      nameUpper.includes('MARIO') || nameUpper.includes('ZELDA') || 
      nameUpper.includes('POKEMON') || nameUpper.includes('POKÉMON')) {
    return 'nintendo';
  }
  
  if (nameUpper.includes('META QUEST') || nameUpper.includes('OCULUS') || 
      nameUpper.includes('VALVE INDEX') || nameUpper.includes('HTC VIVE')) {
    return 'multi';
  }
  
  return null;
}

export function getPlatformInfo(sku: string, name?: string): PlatformInfo | null {
  const platform = detectPlatform(sku, name);
  if (!platform) return null;
  return platformStyles[platform];
}

export function isGameProduct(sku: string): boolean {
  const skuUpper = sku.toUpperCase();
  return skuUpper.startsWith('PS5-') || 
         skuUpper.startsWith('XBX-') || 
         skuUpper.startsWith('NSW-') || 
         skuUpper.startsWith('GAME-');
}
