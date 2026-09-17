// SEO utility functions for dynamic meta tag management

export interface SEOData {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const defaultSEO: SEOData = {
  title: "BLOM Cosmetics - Premium Nail Care Products & Professional Training South Africa",
  description: "Discover BLOM Cosmetics - South Africa's leading provider of premium nail care products, professional acrylic systems, and expert beauty training. Shop cuticle oils, nail files, acrylics, and furniture.",
  keywords: "nail care products, acrylic nails, cuticle oil, nail files, beauty training, nail art, professional cosmetics, South Africa, BLOM, manicure, pedicure, nail salon supplies",
  image: "https://blom-cosmetics.co.za/blom-cosmetics-og-image.webp",
  url: "https://blom-cosmetics.co.za",
  type: "website"
};

export function updateSEO(data: SEOData) {
  const seoData = { ...defaultSEO, ...data };
  
  // Update document title
  if (seoData.title) {
    document.title = seoData.title;
  }
  
  // Update meta description
  updateMetaTag('name', 'description', seoData.description);
  
  // Update meta keywords
  updateMetaTag('name', 'keywords', seoData.keywords);
  
  // Update Open Graph tags
  updateMetaTag('property', 'og:title', seoData.title);
  updateMetaTag('property', 'og:description', seoData.description);
  updateMetaTag('property', 'og:image', seoData.image);
  updateMetaTag('property', 'og:url', seoData.url);
  updateMetaTag('property', 'og:type', seoData.type);
  
  // Update Twitter tags
  updateMetaTag('property', 'twitter:title', seoData.title);
  updateMetaTag('property', 'twitter:description', seoData.description);
  updateMetaTag('property', 'twitter:image', seoData.image);
  updateMetaTag('property', 'twitter:url', seoData.url);
  
  // Update canonical URL
  updateCanonicalURL(seoData.url);
}

function updateMetaTag(attribute: string, value: string, content: string | undefined) {
  if (!content) return;
  
  const existingTag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (existingTag) {
    existingTag.setAttribute('content', content);
  } else {
    const newTag = document.createElement('meta');
    newTag.setAttribute(attribute, value);
    newTag.setAttribute('content', content);
    document.head.appendChild(newTag);
  }
}

function updateCanonicalURL(url: string | undefined) {
  if (!url) return;
  
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (canonical) {
    canonical.href = url;
  } else {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = url;
    document.head.appendChild(canonical);
  }
}

// Product-specific SEO data
export const productSEO = (productName: string, productDescription: string, price: number, image?: string) => ({
  title: `${productName} - Premium Nail Care Product | BLOM Cosmetics`,
  description: `Shop ${productName} at BLOM Cosmetics. ${productDescription} Professional quality nail care products for beauty professionals. Free shipping available.`,
  keywords: `${productName}, nail care, professional cosmetics, beauty products, South Africa, BLOM Cosmetics`,
  image: image || defaultSEO.image,
  url: `https://blom-cosmetics.co.za/products/${productName.toLowerCase().replace(/\s+/g, '-')}`,
  type: "product"
});

// Course-specific SEO data
export const courseSEO = (courseName: string, courseDescription: string, instructor: string) => ({
  title: `${courseName} - Professional Nail Training | BLOM Academy`,
  description: `Learn ${courseName} with expert instructor ${instructor}. Professional nail training course by BLOM Academy. Book your spot today!`,
  keywords: `${courseName}, nail training, beauty course, professional training, nail art, BLOM Academy`,
  url: `https://blom-cosmetics.co.za/courses/${courseName.toLowerCase().replace(/\s+/g, '-')}`,
  type: "course"
});

// Page-specific SEO data
export const pageSEO = (pageName: string, pageDescription: string, path: string) => ({
  title: `${pageName} | BLOM Cosmetics`,
  description: pageDescription,
  url: `https://blom-cosmetics.co.za${path}`,
  type: "website"
});

// Google Analytics event tracking
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

// Track page views
export function trackPageView(pageTitle: string, pageLocation: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', 'G-H9GCB42G9C', {
      page_title: pageTitle,
      page_location: pageLocation
    });
  }
}
