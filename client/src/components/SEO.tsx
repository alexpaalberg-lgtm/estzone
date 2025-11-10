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
  }, [fullTitle, description, keywords, ogImage, ogType, currentUrl, siteUrl, article, product]);

  return null; // This component doesn't render anything
}
