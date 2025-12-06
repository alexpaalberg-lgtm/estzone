import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

const generateSessionId = (): string => {
  const stored = sessionStorage.getItem('estzone_session_id');
  if (stored) return stored;
  
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('estzone_session_id', newId);
  return newId;
};

interface TrackPageViewParams {
  productId?: string;
  categoryId?: string;
}

export const trackPageView = async (path: string, params: TrackPageViewParams = {}) => {
  try {
    const sessionId = generateSessionId();
    
    await fetch('/api/track/pageview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        sessionId,
        productId: params.productId || null,
        categoryId: params.categoryId || null,
      }),
    });
  } catch (error) {
    // Silent fail - tracking errors shouldn't affect user experience
  }
};

export const usePageTracking = () => {
  const [location] = useLocation();
  const lastTrackedPath = useRef<string>('');
  
  useEffect(() => {
    // Avoid tracking the same path multiple times in a row
    if (location === lastTrackedPath.current) return;
    lastTrackedPath.current = location;
    
    // Don't track admin pages
    if (location.startsWith('/admin')) return;
    
    // Track the page view
    trackPageView(location);
  }, [location]);
};
