// TEMPLATE: Furniture Product Detail Page
// File: src/pages/FurnitureProductDetailPage.tsx

import React, { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Container } from '../components/layout/Container';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PaymentMethods } from '../components/payment/PaymentMethods';
import { updateSEO, productSEO, trackPageView } from '../lib/seo';
import { ProductStructuredData } from '../components/seo/ProductStructuredData';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Plus, 
  Minus,
  Check,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Ruler,
  Package,
  Clock,
  MapPin
} from 'lucide-react';

interface FurnitureProductDetailPageProps {
  productSlug: string;
}

export const FurnitureProductDetailPage: React.FC<FurnitureProductDetailPageProps> = ({ productSlug }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'dimensions' | 'materials-finish' | 'production-delivery'>('overview');
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('overview');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Furniture product database
  const furnitureDatabase = {
    'your-furniture-slug': {
      id: '1',
      name: 'Your Furniture Name',
      slug: 'your-furniture-slug',
      category: 'Furniture',
      shortDescription: 'Your furniture short description.',
      overview: 'Detailed furniture overview and description.',
      features: [
        'Feature 1',
        'Feature 2',
        'Feature 3',
        'Feature 4',
        'Feature 5'
      ],
      price: 4500,
      compareAtPrice: null, // or set a higher price for sale
      stock: 'In Stock', // or 'Out of Stock'
      images: [
        '/your-furniture-white.webp',
        '/your-furniture-colorful.webp'
      ],
      dimensions: {
        length: '120cm',
        width: '45cm',
        height: '80cm',
        weight: '25kg',
        additional: 'Additional dimension info if needed'
      },
      materialsFinish: {
        materials: [
          'High-quality MDF construction',
          'Premium laminate finish',
          'Stainless steel hardware',
          'Tempered glass top (where applicable)'
        ],
        finish: [
          'Scratch-resistant surface',
          'Easy to clean and maintain',
          'Professional salon-grade quality',
          'UV-resistant coating'
        ],
        care: [
          'Clean with mild soap and water',
          'Avoid harsh chemicals',
          'Use coasters for hot items',
          'Regular dusting recommended'
        ]
      },
      productionDelivery: {
        production: [
          'Handcrafted by skilled artisans',
          'Quality control at every stage',
          'Made to order for freshness',
          'Customizable options available'
        ],
        delivery: [
          'Free delivery within 50km of Cape Town',
          'Professional installation included',
          'Delivery time: 2-4 weeks',
          'Nationwide shipping available'
        ],
        warranty: [
          '2-year manufacturer warranty',
          'Free repairs for manufacturing defects',
          'Professional after-sales support',
          'Satisfaction guarantee'
        ]
      },
      variants: [
        { name: 'Wooden Top', image: '/your-furniture-wooden.webp' },
        { name: 'Glass Top', image: '/your-furniture-glass.webp' },
        { name: 'Mixed Finish', image: '/your-furniture-mixed.webp' }
      ],
      rating: 4.9,
      reviewCount: 23,
      reviews: []
    }
  };

  useEffect(() => {
    // Find product by slug
    const foundProduct = furnitureDatabase[productSlug as keyof typeof furnitureDatabase];

    if (foundProduct) {
      setProduct(foundProduct);
      const firstVariant = foundProduct.variants[0];
      setSelectedVariant(typeof firstVariant === 'string' ? firstVariant : firstVariant?.name || '');

      // Update SEO with product data
      const seoData = productSEO(
        foundProduct.name,
        foundProduct.shortDescription,
        foundProduct.price,
        foundProduct.images[0]
      );
      updateSEO(seoData);
      
      // Track product page view
      trackPageView(seoData.title || '', seoData.url || '');
    }

    setLoading(false);
  }, [productSlug]);

  useEffect(() => {
    // Check if product is in wishlist
    setIsWishlisted(wishlistStore.isInWishlist(productSlug));
    
    const unsubscribe = wishlistStore.subscribe(() => {
      setIsWishlisted(wishlistStore.isInWishlist(productSlug));
    });

    return unsubscribe;
  }, [productSlug]);

  const handleAddToCart = () => {
    if (!product || product.stock === 'Out of Stock') return;

    const variantImage = product.variants.find((v: any) => v.name === selectedVariant)?.image;
    const finalImage = variantImage || product.images[0];

    cartStore.addItem({
      id: `item_${Date.now()}`,
      productId: product.slug,
      name: `${product.name}${selectedVariant ? ` - ${selectedVariant}` : ''}`,
      price: product.price,
      image: finalImage
    }, quantity);

    showNotification(`${product.name} added to cart!`);
  };

  const handleWishlistToggle = () => {
    if (!product) return;

    const wishlistItem = {
      id: product.slug,
      productId: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      slug: product.slug
    };

    const wasAdded = wishlistStore.toggleItem(wishlistItem);
    showNotification(wasAdded ? 'Added to wishlist!' : 'Removed from wishlist!');
  };

  const handleVariantChange = (variant: string) => {
    setSelectedVariant(variant);
    
    // Find variant image and update main image
    const variantData = product.variants.find((v: any) => v.name === variant);
    if (variantData?.image) {
      setSelectedImage(0); // Reset to first image
      // Update the main product image to show variant
      const variantImageIndex = product.images.findIndex((img: string) => img === variantData.image);
      if (variantImageIndex !== -1) {
        setSelectedImage(variantImageIndex);
      }
    }
  };

  const formatPrice = (price: number) => `R${price.toFixed(2)}`;

  const toggleAccordion = (section: string) => {
    setExpandedAccordion(expandedAccordion === section ? null : section);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header showMobileMenu={true} />
        <main className="section-padding">
          <Container>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product...</p>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header showMobileMenu={true} />
        <main className="section-padding">
          <Container>
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
              <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
              <Button onClick={() => window.location.href = '/shop'}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shop
              </Button>
            </div>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header showMobileMenu={true} />
      
      {/* Structured Data */}
      {product && (
        <ProductStructuredData 
          product={{
            id: product.id,
            name: product.name,
            description: product.shortDescription,
            price: product.price,
            originalPrice: product.compareAtPrice,
            image: product.images[0],
            inStock: product.stock !== 'Out of Stock',
            rating: product.rating,
            reviewCount: product.reviewCount,
            category: product.category,
            brand: 'BLOM Cosmetics'
          }}
        />
      )}

      <main>
        {/* Breadcrumb */}
        <section className="py-4 border-b bg-gray-50">
          <Container>
            <nav className="text-sm text-gray-500">
              <a href="/" className="hover:text-pink-400">Home</a>
              <span className="mx-2">/</span>
              <a href="/shop" className="hover:text-pink-400">Shop</a>
              <span className="mx-2">/</span>
              <a href="/shop?category=furniture" className="hover:text-pink-400">
                Furniture
              </a>
              <span className="mx-2">/</span>
              <span className="text-gray-900">{product.name}</span>
            </nav>
          </Container>
        </section>

        {/* Product Details */}
        <section className="py-8 md:py-12">
          <Container>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnail Images */}
                {product.images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto">
                    {product.images.map((image: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                          selectedImage === index ? 'border-pink-400' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Product Title & Rating */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">
                        {product.rating} ({product.reviewCount} reviews)
                      </span>
                    </div>
                  </div>

                  <p className="text-lg text-gray-600 leading-relaxed">
                    {product.shortDescription}
                  </p>
                </div>

                {/* Price */}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xl text-gray-400 line-through">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                  {product.compareAtPrice && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold">
                      {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                    </span>
                  )}
                </div>

                {/* Variants */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Finish:</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleVariantChange(variant.name)}
                          className={`px-4 py-2 rounded-full border-2 transition-colors ${
                            selectedVariant === variant.name
                              ? 'border-pink-400 bg-pink-50 text-pink-600'
                              : 'border-gray-200 text-gray-700 hover:border-pink-300'
                          }`}
                        >
                          {variant.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-gray-900">Quantity:</span>
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 border-x border-gray-300 min-w-[3rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="p-2 hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={product.stock === 'Out of Stock'}
                      className="flex-1 bg-pink-400 hover:bg-pink-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      {product.stock === 'Out of Stock' ? 'Out of Stock' : 'Add to Cart'}
                    </Button>

                    <Button
                      onClick={handleWishlistToggle}
                      variant="outline"
                      className="px-4 py-4 border-2 border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white transition-all duration-300"
                    >
                      <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Features:</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <span>Free delivery within 50km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <span>2-year warranty</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    <span>Professional installation</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Product Information Tabs */}
        <section className="py-8 bg-gray-50">
          <Container>
            <div className="max-w-4xl mx-auto">
              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-8">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'features', label: 'Features & Benefits' },
                  { id: 'dimensions', label: 'Dimensions' },
                  { id: 'materials-finish', label: 'Materials & Finish' },
                  { id: 'production-delivery', label: 'Production & Delivery' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-full font-semibold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-400 text-white'
                        : 'bg-white text-gray-700 hover:bg-pink-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <Card>
                <CardContent className="p-8">
                  {activeTab === 'overview' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Product Overview</h3>
                      <p className="text-gray-700 leading-relaxed">{product.overview}</p>
                    </div>
                  )}

                  {activeTab === 'features' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Features & Benefits</h3>
                      <ul className="space-y-3">
                        {product.features.map((feature: string, index: number) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeTab === 'dimensions' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Dimensions</h3>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Ruler className="h-5 w-5 text-pink-400" />
                            <div>
                              <span className="text-gray-600">Length:</span>
                              <span className="ml-2 font-semibold text-gray-900">{product.dimensions.length}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Ruler className="h-5 w-5 text-pink-400" />
                            <div>
                              <span className="text-gray-600">Width:</span>
                              <span className="ml-2 font-semibold text-gray-900">{product.dimensions.width}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Ruler className="h-5 w-5 text-pink-400" />
                            <div>
                              <span className="text-gray-600">Height:</span>
                              <span className="ml-2 font-semibold text-gray-900">{product.dimensions.height}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Package className="h-5 w-5 text-pink-400" />
                            <div>
                              <span className="text-gray-600">Weight:</span>
                              <span className="ml-2 font-semibold text-gray-900">{product.dimensions.weight}</span>
                            </div>
                          </div>
                        </div>
                        {product.dimensions.additional && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Additional Information:</h4>
                            <p className="text-gray-700">{product.dimensions.additional}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'materials-finish' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Materials & Finish</h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Materials:</h4>
                          <ul className="space-y-2">
                            {product.materialsFinish.materials.map((material: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{material}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Finish:</h4>
                          <ul className="space-y-2">
                            {product.materialsFinish.finish.map((finish: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{finish}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Care Instructions:</h4>
                          <ul className="space-y-2">
                            {product.materialsFinish.care.map((care: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{care}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'production-delivery' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Production & Delivery</h3>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Production:</h4>
                          <ul className="space-y-2">
                            {product.productionDelivery.production.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Delivery:</h4>
                          <ul className="space-y-2">
                            {product.productionDelivery.delivery.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Truck className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Warranty:</h4>
                          <ul className="space-y-2">
                            {product.productionDelivery.warranty.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <Shield className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-700">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>

        {/* Payment Methods */}
        <PaymentMethods />
      </main>

      <Footer />
    </div>
  );
};
