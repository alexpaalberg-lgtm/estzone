// Google Analytics integration - from blueprint:javascript_google_analytics
// Define the gtag function globally
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics with proper consent mode and cross-domain tracking
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Initialize dataLayer first
  window.dataLayer = window.dataLayer || [];
  
  // Define gtag function
  function gtag(...args: any[]) {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;

  // Set default consent to denied (GDPR compliance) - this allows GA to load but not track until consent
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'wait_for_update': 500
  });

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag with cross-domain tracking for www and non-www
  gtag('js', new Date());
  gtag('config', measurementId, {
    // Cross-domain tracking - treat www.estzone.eu and estzone.eu as same site
    'linker': {
      'domains': ['estzone.eu', 'www.estzone.eu']
    },
    // Exclude self-referrals between www and non-www
    'referral_exclusion_list': ['estzone.eu', 'www.estzone.eu'],
    // Cookie domain - use root domain so both www and non-www share cookies
    'cookie_domain': 'estzone.eu',
    // Enable enhanced measurement
    'send_page_view': true,
    // Allow Google signals for demographics
    'allow_google_signals': true,
    // Allow ad personalization (if consent given)
    'allow_ad_personalization_signals': true
  });

  // Check if user already gave consent (from localStorage)
  const consent = localStorage.getItem('estzone_cookie_consent');
  const preferences = localStorage.getItem('estzone_cookie_preferences');
  
  if (consent && preferences) {
    try {
      const prefs = JSON.parse(preferences);
      gtag('consent', 'update', {
        'analytics_storage': prefs.analytics ? 'granted' : 'denied',
        'ad_storage': prefs.marketing ? 'granted' : 'denied'
      });
    } catch (e) {
      console.warn('Failed to parse cookie preferences');
    }
  }
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url,
    page_location: window.location.href
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Track e-commerce events
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'EUR',
  items?: any[]
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: currency,
    items: items
  });
};

// Track add to cart
export const trackAddToCart = (
  itemId: string,
  itemName: string,
  price: number,
  quantity: number = 1
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'add_to_cart', {
    currency: 'EUR',
    value: price * quantity,
    items: [{
      item_id: itemId,
      item_name: itemName,
      price: price,
      quantity: quantity
    }]
  });
};

// Update consent when user changes preferences
export const updateGAConsent = (analyticsAllowed: boolean, marketingAllowed: boolean) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('consent', 'update', {
    'analytics_storage': analyticsAllowed ? 'granted' : 'denied',
    'ad_storage': marketingAllowed ? 'granted' : 'denied'
  });
};
