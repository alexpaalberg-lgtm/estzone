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

  // GA4 Consent Mode v2 - GDPR compliant with anonymous data modeling
  // This allows Google to collect anonymized, cookieless pings for modeling
  // while still respecting user consent for full tracking
  gtag('consent', 'default', {
    'analytics_storage': 'denied',
    'ad_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  
  // Enable URL passthrough for better attribution without cookies
  gtag('set', 'url_passthrough', true);
  
  // Enable ads data redaction when consent is denied (extra privacy)
  gtag('set', 'ads_data_redaction', true);

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

// Update consent when user changes preferences (Consent Mode v2)
export const updateGAConsent = (analyticsAllowed: boolean, marketingAllowed: boolean) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('consent', 'update', {
    'analytics_storage': analyticsAllowed ? 'granted' : 'denied',
    'ad_storage': marketingAllowed ? 'granted' : 'denied',
    'ad_user_data': marketingAllowed ? 'granted' : 'denied',
    'ad_personalization': marketingAllowed ? 'granted' : 'denied'
  });
};

// E-commerce: View item (product page)
export const trackViewItem = (
  itemId: string,
  itemName: string,
  price: number,
  category?: string
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'view_item', {
    currency: 'EUR',
    value: price,
    items: [{
      item_id: itemId,
      item_name: itemName,
      price: price,
      item_category: category
    }]
  });
};

// E-commerce: View cart
export const trackViewCart = (items: any[], totalValue: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'view_cart', {
    currency: 'EUR',
    value: totalValue,
    items: items
  });
};

// E-commerce: Begin checkout
export const trackBeginCheckout = (items: any[], totalValue: number) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'begin_checkout', {
    currency: 'EUR',
    value: totalValue,
    items: items
  });
};

// E-commerce: Add shipping info
export const trackAddShippingInfo = (items: any[], totalValue: number, shippingMethod: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'add_shipping_info', {
    currency: 'EUR',
    value: totalValue,
    shipping_tier: shippingMethod,
    items: items
  });
};

// E-commerce: Add payment info
export const trackAddPaymentInfo = (items: any[], totalValue: number, paymentMethod: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'add_payment_info', {
    currency: 'EUR',
    value: totalValue,
    payment_type: paymentMethod,
    items: items
  });
};

// E-commerce: Remove from cart
export const trackRemoveFromCart = (
  itemId: string,
  itemName: string,
  price: number,
  quantity: number = 1
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'remove_from_cart', {
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

// Initialize Microsoft Clarity for heatmaps and session recordings
export const initClarity = () => {
  const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID;
  
  if (!clarityId) {
    console.warn('Missing VITE_CLARITY_PROJECT_ID - Clarity heatmaps disabled');
    return;
  }
  
  // Clarity tracking script
  (function(c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
    c[a] = c[a] || function() { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", clarityId);
};

// Track custom Clarity events
export const trackClarityEvent = (eventName: string) => {
  if (typeof window === 'undefined' || !(window as any).clarity) return;
  (window as any).clarity('set', eventName, 'true');
};
