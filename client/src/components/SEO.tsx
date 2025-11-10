import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  product?: {
    price?: string;
    currency?: string;
    availability?: 'in stock' | 'out of stock';
  };
}

export default function SEO({
  title,
  description,
  keywords,
  ogImage = '/og-default.jpg',
  ogType = 'website',
  article,
  product,
}: SEOProps) {
  const fullTitle = `${title} | EstZone - Premium Gaming Store`;
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://estzone.com';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : siteUrl;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Store reference to the script we create
    let structuredDataScript: HTMLScriptElement | null = null;

    // Helper function to set or update meta tag
    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Add structured data (JSON-LD)
    const structuredData: Record<string, any> = {
      "@context": "https://schema.org",
    };

    if (ogType === 'product' && product) {
      structuredData["@type"] = "Product";
      structuredData["name"] = title;
      structuredData["description"] = description;
      structuredData["image"] = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
      structuredData["offers"] = {
        "@type": "Offer",
        "priceCurrency": product.currency || "EUR",
        "price": product.price,
        "availability": product.availability === 'in stock' 
          ? "https://schema.org/InStock" 
          : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "EstZone OÜ"
        }
      };
    } else if (ogType === 'article' && article) {
      structuredData["@type"] = "Article";
      structuredData["headline"] = title;
      structuredData["description"] = description;
      structuredData["image"] = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
      if (article.publishedTime) {
        structuredData["datePublished"] = article.publishedTime;
      }
      structuredData["author"] = {
        "@type": "Person",
        "name": article.author || "EstZone"
      };
    } else {
      structuredData["@type"] = "WebSite";
      structuredData["name"] = "EstZone";
      structuredData["description"] = description;
      structuredData["url"] = siteUrl;
    }

    // Add new structured data script
    structuredDataScript = document.createElement('script');
    structuredDataScript.type = 'application/ld+json';
    structuredDataScript.text = JSON.stringify(structuredData);
    structuredDataScript.setAttribute('data-seo-component', 'true'); // Mark our script for cleanup
    document.head.appendChild(structuredDataScript);

    // Basic meta tags
    setMetaTag('description', description);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    // Open Graph meta tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:url', currentUrl, true);
    setMetaTag('og:image', ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`, true);
    setMetaTag('og:site_name', 'EstZone', true);

    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`);

    // Article-specific meta tags
    if (article && ogType === 'article') {
      if (article.publishedTime) {
        setMetaTag('article:published_time', article.publishedTime, true);
      }
      if (article.modifiedTime) {
        setMetaTag('article:modified_time', article.modifiedTime, true);
      }
      if (article.author) {
        setMetaTag('article:author', article.author, true);
      }
    }

    // Product-specific meta tags
    if (product && ogType === 'product') {
      if (product.price && product.currency) {
        setMetaTag('product:price:amount', product.price, true);
        setMetaTag('product:price:currency', product.currency, true);
      }
      if (product.availability) {
        setMetaTag('product:availability', product.availability, true);
      }
    }

    // Cleanup function to remove only our structured data when component unmounts or re-renders
    return () => {
      if (structuredDataScript && structuredDataScript.parentNode) {
        structuredDataScript.parentNode.removeChild(structuredDataScript);
      }
    };
  }, [fullTitle, description, keywords, ogImage, ogType, currentUrl, siteUrl, article, product, title]);

  return null; // This component doesn't render anything
}
