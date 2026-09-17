import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, ChevronUp, ChevronDown, X } from 'lucide-react';

interface StickyCartProps {
  productName: string;
  productImage: string;
  productPrice: number;
  quantity: number;
  onQuantityChange: (newQuantity: number) => void;
  onAddToCart: () => void;
  isVisible: boolean;
}

const formatPrice = (price: number) => `R${price.toFixed(2)}`;

export const StickyCart: React.FC<StickyCartProps> = ({
  productName,
  productImage,
  productPrice,
  quantity,
  onQuantityChange,
  onAddToCart,
  isVisible
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setHasScrolled(scrollPosition > 400);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isVisible || !hasScrolled || isCollapsed) return;

    // Start shake animation after 8 seconds, then repeat every 10 seconds
    const initialTimeout = setTimeout(() => {
      setShouldShake(true);
      setTimeout(() => setShouldShake(false), 600);
      
      // Set up recurring shake every 10 seconds
      const interval = setInterval(() => {
        if (!isCollapsed && hasScrolled && isVisible) {
          setShouldShake(true);
          setTimeout(() => setShouldShake(false), 600);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }, 8000);

    return () => clearTimeout(initialTimeout);
  }, [isVisible, hasScrolled, isCollapsed]);

  if (!isVisible || !hasScrolled) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 transition-all duration-300 ${
        isCollapsed ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-t-2xl px-6 py-3 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-lg"
        aria-label={isCollapsed ? "Show cart" : "Hide cart"}
      >
        {isCollapsed ? (
          <ChevronUp className="h-6 w-6 text-gray-600" />
        ) : (
          <ChevronDown className="h-6 w-6 text-gray-600" />
        )}
      </button>

      {/* Cart Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Product Info - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
              <img
                src={productImage}
                alt={productName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 text-base truncate">{productName}</h4>
              <p className="text-pink-400 font-bold text-lg">{formatPrice(productPrice)}</p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-full bg-gray-50 border border-gray-300 overflow-hidden">
              <button
                onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4 text-gray-600" />
              </button>
              <span className="px-4 min-w-[48px] text-center font-bold text-lg text-gray-900 select-none">
                {quantity}
              </span>
              <button
                onClick={() => onQuantityChange(quantity + 1)}
                className="h-10 w-10 flex items-center justify-center hover:bg-gray-100 active:scale-95 transition"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={onAddToCart}
            className={`flex items-center justify-center gap-2 px-6 sm:px-8 py-3 rounded-full font-bold text-sm sm:text-base uppercase tracking-wide bg-pink-400 text-white hover:bg-pink-500 shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 ${
              shouldShake ? 'animate-subtle-shake' : ''
            }`}
          >
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
};