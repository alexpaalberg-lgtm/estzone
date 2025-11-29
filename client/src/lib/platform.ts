export type Platform = 'ps5' | 'xbox' | 'nintendo' | 'pc' | 'multi' | 'steam' | 'digital' | null;

export interface PlatformInfo {
  platform: Platform;
  label: string;
  labelEt: string;
  color: string;
  bgColor: string;
  iconName: 'playstation' | 'xbox' | 'nintendo-switch' | 'steam' | 'gamepad' | 'pc';
}

export const platformStyles: Record<NonNullable<Platform>, PlatformInfo> = {
  ps5: {
    platform: 'ps5',
    label: 'PS5',
    labelEt: 'PS5',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    iconName: 'playstation',
  },
  xbox: {
    platform: 'xbox',
    label: 'Xbox',
    labelEt: 'Xbox',
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    iconName: 'xbox',
  },
  nintendo: {
    platform: 'nintendo',
    label: 'Switch',
    labelEt: 'Switch',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    iconName: 'nintendo-switch',
  },
  pc: {
    platform: 'pc',
    label: 'PC',
    labelEt: 'PC',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20 border-gray-500/30',
    iconName: 'pc',
  },
  steam: {
    platform: 'steam',
    label: 'Steam',
    labelEt: 'Steam',
    color: 'text-slate-300',
    bgColor: 'bg-slate-500/20 border-slate-500/30',
    iconName: 'steam',
  },
  digital: {
    platform: 'digital',
    label: 'Digital',
    labelEt: 'Digitaalne',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20 border-cyan-500/30',
    iconName: 'gamepad',
  },
  multi: {
    platform: 'multi',
    label: 'Multi',
    labelEt: 'Multi',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/30',
    iconName: 'gamepad',
  },
};

export function detectPlatform(sku: string, name?: string, categoryId?: string): Platform {
  const skuUpper = sku.toUpperCase();
  const nameUpper = (name || '').toUpperCase();
  
  // Digital content detection by SKU prefix
  if (skuUpper.startsWith('DIG-')) {
    if (skuUpper.includes('PSN') || skuUpper.includes('PSP')) return 'ps5';
    if (skuUpper.includes('XBX') || skuUpper.includes('XGP')) return 'xbox';
    if (skuUpper.includes('NIN') || skuUpper.includes('NSO')) return 'nintendo';
    if (skuUpper.includes('STM')) return 'steam';
    if (skuUpper.includes('EAP') || skuUpper.includes('BNT')) return 'pc';
    // In-game currencies are multi-platform
    if (skuUpper.includes('VBK') || skuUpper.includes('FCP') || 
        skuUpper.includes('COD') || skuUpper.includes('RBX') ||
        skuUpper.includes('GEN') || skuUpper.includes('MNC')) return 'multi';
  }
  
  // Simulator products are PC/Multi
  if (skuUpper.startsWith('SIM-')) {
    // Logitech G29 is for PS4/PS5/PC, G920 is for Xbox/PC
    if (skuUpper.includes('G29') || skuUpper.includes('T300')) return 'ps5';
    if (skuUpper.includes('G920') || skuUpper.includes('TX')) return 'xbox';
    return 'pc';
  }
  
  // Game SKU patterns
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
  
  // PlayStation products
  if (nameUpper.includes('PS5') || nameUpper.includes('PLAYSTATION 5') || nameUpper.includes('DUALSENSE')) {
    return 'ps5';
  }
  if (nameUpper.includes('PS4') || nameUpper.includes('PLAYSTATION 4') || nameUpper.includes('DUALSHOCK')) {
    return 'ps5';
  }
  if (nameUpper.includes('PSVR') || nameUpper.includes('PLAYSTATION VR') || nameUpper.includes('PLAYSTATION STORE') || nameUpper.includes('PLAYSTATION PLUS')) {
    return 'ps5';
  }
  
  // Xbox products
  if (nameUpper.includes('XBOX') || nameUpper.includes('SERIES X') || nameUpper.includes('SERIES S') || nameUpper.includes('GAME PASS')) {
    return 'xbox';
  }
  
  // Nintendo products
  if (nameUpper.includes('NINTENDO') || nameUpper.includes('SWITCH') || 
      nameUpper.includes('JOY-CON') || nameUpper.includes('JOYCON') ||
      nameUpper.includes('MARIO') || nameUpper.includes('ZELDA') || 
      nameUpper.includes('POKEMON') || nameUpper.includes('POKÉMON') ||
      nameUpper.includes('ESHOP')) {
    return 'nintendo';
  }
  
  // Steam/PC products
  if (nameUpper.includes('STEAM')) {
    return 'steam';
  }
  
  // PC peripherals
  if (nameUpper.includes('LOGITECH') || nameUpper.includes('THRUSTMASTER') || 
      nameUpper.includes('FANATEC') || nameUpper.includes('HONEYCOMB') ||
      nameUpper.includes('VKB') || nameUpper.includes('PLAYSEAT') ||
      nameUpper.includes('NEXT LEVEL')) {
    return 'pc';
  }
  
  // VR products are multi-platform
  if (nameUpper.includes('META QUEST') || nameUpper.includes('OCULUS') || 
      nameUpper.includes('VALVE INDEX') || nameUpper.includes('HTC VIVE') ||
      nameUpper.includes('VR HEADSET')) {
    return 'multi';
  }
  
  // Game currencies are multi-platform
  if (nameUpper.includes('V-BUCKS') || nameUpper.includes('VBUCKS') ||
      nameUpper.includes('ROBUX') || nameUpper.includes('FIFA POINTS') ||
      nameUpper.includes('FC POINTS') || nameUpper.includes('COD POINTS') ||
      nameUpper.includes('GENESIS CRYSTALS') || nameUpper.includes('PRIMOGEMS') ||
      nameUpper.includes('MINECOINS')) {
    return 'multi';
  }
  
  // EA Play and Battle.net are PC
  if (nameUpper.includes('EA PLAY') || nameUpper.includes('BATTLE.NET')) {
    return 'pc';
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
