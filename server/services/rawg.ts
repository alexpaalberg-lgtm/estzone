const RAWG_API_KEY = process.env.RAWG_API_KEY;
const RAWG_BASE_URL = 'https://api.rawg.io/api';

export interface RawgGame {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  released: string;
  rating: number;
  metacritic: number | null;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string; slug: string } }[];
  description_raw?: string;
  short_screenshots?: { id: number; image: string }[];
}

export interface RawgSearchResult {
  count: number;
  results: RawgGame[];
}

export async function searchGames(query: string, pageSize: number = 10): Promise<RawgGame[]> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG_API_KEY not configured');
    return [];
  }

  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}&page_size=${pageSize}`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data: RawgSearchResult = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching RAWG games:', error);
    return [];
  }
}

export async function getGameDetails(gameId: number): Promise<RawgGame | null> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG_API_KEY not configured');
    return null;
  }

  try {
    const response = await fetch(
      `${RAWG_BASE_URL}/games/${gameId}?key=${RAWG_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting game details:', error);
    return null;
  }
}

export async function getPopularGames(platform?: string, pageSize: number = 20): Promise<RawgGame[]> {
  if (!RAWG_API_KEY) {
    console.warn('RAWG_API_KEY not configured');
    return [];
  }

  try {
    let url = `${RAWG_BASE_URL}/games?key=${RAWG_API_KEY}&ordering=-rating&page_size=${pageSize}`;
    
    if (platform) {
      const platformIds: Record<string, number> = {
        'playstation': 187,
        'ps5': 187,
        'xbox': 186,
        'xbox-series-x': 186,
        'nintendo': 7,
        'switch': 7,
        'pc': 4,
      };
      
      const platformId = platformIds[platform.toLowerCase()];
      if (platformId) {
        url += `&platforms=${platformId}`;
      }
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`RAWG API error: ${response.status}`);
    }
    
    const data: RawgSearchResult = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error getting popular games:', error);
    return [];
  }
}

export function getPlatformCategory(game: RawgGame): 'playstation' | 'xbox' | 'nintendo' | 'pc' | null {
  const platforms = game.platforms?.map(p => p.platform.slug) || [];
  
  if (platforms.some(p => p.includes('playstation-5') || p.includes('playstation5'))) {
    return 'playstation';
  }
  if (platforms.some(p => p.includes('xbox-series'))) {
    return 'xbox';
  }
  if (platforms.some(p => p.includes('nintendo-switch'))) {
    return 'nintendo';
  }
  if (platforms.some(p => p === 'pc')) {
    return 'pc';
  }
  
  return null;
}

export function generateEstonianName(englishName: string): string {
  const commonTranslations: Record<string, string> = {
    'The': '',
    'of': '',
    'and': 'ja',
    'Edition': 'Väljaanne',
    'Game': 'Mäng',
    'Deluxe': 'Deluxe',
    'Ultimate': 'Ultimate',
    'Standard': 'Standard',
  };
  
  return englishName;
}

export function generateGameDescription(game: RawgGame, lang: 'en' | 'et'): string {
  const genres = game.genres?.map(g => g.name).join(', ') || 'Action';
  const platforms = game.platforms?.map(p => p.platform.name).slice(0, 3).join(', ') || '';
  const rating = game.rating ? `${game.rating}/5` : '';
  const metacritic = game.metacritic ? `Metacritic: ${game.metacritic}` : '';
  
  if (lang === 'en') {
    return `${game.name} is an exciting ${genres.toLowerCase()} game${platforms ? ` available on ${platforms}` : ''}. ${rating ? `Rated ${rating} by players.` : ''} ${metacritic}`.trim();
  } else {
    return `${game.name} on põnev ${genres.toLowerCase()} mäng${platforms ? `, saadaval platvormidel ${platforms}` : ''}. ${rating ? `Mängijate hinnang ${rating}.` : ''} ${metacritic}`.trim();
  }
}
