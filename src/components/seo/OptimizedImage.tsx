import React from 'react';
import { transformImg } from '../../lib/img';

interface OptimizedImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  productName?: string;
  productPrice?: number;
  productCategory?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  title,
  className = '',
  width,
  height,
  loading = 'lazy',
  priority = false,
  productName,
  productPrice,
  productCategory
}) => {
  // Generate comprehensive alt text for SEO
  const generateAltText = () => {
    if (alt) return alt;
    
    if (productName) {
      return `${productName} - Premium nail care product by BLOM Cosmetics${productPrice ? ` - R${productPrice}` : ''}${productCategory ? ` - ${productCategory}` : ''}`;
    }
    
    return 'BLOM Cosmetics - Premium nail care products and professional training South Africa';
  };

  // Generate title for better SEO
  const generateTitle = () => {
    if (title) return title;
    if (productName) return `${productName} - Shop at BLOM Cosmetics`;
    return 'BLOM Cosmetics - Premium Nail Care Products South Africa';
  };

  // Ensure proper image URL (respect current origin at runtime, fallback to Netlify URL)
  const site =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://cute-stroopwafel-203cac.netlify.app';
  
  // Handle missing src
  const safeSrc = src || '/blom_logo.webp'; // Fallback to logo or placeholder
  
  // Apply SAFE optimization (adds f_auto,q_auto without changing cloud account)
  const optimizedSrc = transformImg(safeSrc, 'f_auto,q_auto');
  
  const imageUrl = optimizedSrc.startsWith('http') ? optimizedSrc : `${site}${optimizedSrc}`;

  // Cloudinary can resize on the fly, so offer width variants capped at 2x the rendered size
  const isCloudinary = optimizedSrc.includes('res.cloudinary.com') && optimizedSrc.includes('/upload/');
  const maxVariant = width ? width * 2 : 0;
  const variantWidths = [200, 400, 600, 800, 1000, 1200].filter((w) => w <= maxVariant);
  const srcSet = isCloudinary && variantWidths.length > 0
    ? variantWidths
        .map((w) => `${optimizedSrc.replace('/upload/', `/upload/w_${w},c_limit/`)} ${w}w`)
        .join(', ')
    : undefined;

  if (!src) {
    console.warn('OptimizedImage: src is missing for', alt);
  }

  return (
    <>
      <img
        src={imageUrl}
        srcSet={srcSet}
        alt={generateAltText()}
        title={generateTitle()}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : loading}
        decoding="async"
        // Hint browser for above-the-fold media to improve LCP
        fetchPriority={priority ? 'high' : 'auto'}
        // Provide generic responsive sizing to reduce layout shifts
        sizes="(max-width: 768px) 100vw, 50vw"
        style={{
          maxWidth: '100%'
        }}
        // Add structured data attributes for better indexing
        data-product-name={productName}
        data-product-price={productPrice}
        data-product-category={productCategory}
        // Add schema.org microdata
        itemProp="image"
      />
      
      {/* Add structured data for the image if it's a product */}
      {productName && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ImageObject",
              "contentUrl": imageUrl,
              "name": productName,
              "description": generateAltText(),
              "thumbnailUrl": imageUrl,
              "caption": `${productName} - Premium nail care product`,
              "keywords": [
                productName,
                "nail care",
                "beauty products",
                "BLOM Cosmetics",
                "South Africa",
                productCategory || "nail supplies"
              ].filter(Boolean),
              "license": "https://blom-cosmetics.co.za",
              "creator": {
                "@type": "Organization",
                "name": "BLOM Cosmetics"
              }
            })
          }}
        />
      )}
    </>
  );
};
