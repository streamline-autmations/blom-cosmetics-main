import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { cartStore, CartState } from '../../lib/cart';

interface CartButtonProps {
  onClick?: () => void;
  className?: string;
}

export const CartButton: React.FC<CartButtonProps> = ({ onClick, className = '' }) => {
  const [cartState, setCartState] = useState<CartState>(cartStore.getState());
  const [itemCount, setItemCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Initialize count
    setItemCount(cartStore.getItemCount());

    const unsubscribe = cartStore.subscribe((newState) => {
      setCartState(newState);
      const newCount = cartStore.getItemCount();
      
      // Trigger animation when items are added or removed
      if (newCount !== itemCount) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);
      }
      
      setItemCount(newCount);
    });
    
    return unsubscribe;
  }, [itemCount]);

  return (
    <button
      onClick={(e) => {
        if (onClick) return onClick();
        // Fallback: open the global cart drawer if present
        const trigger = document.getElementById('cart-drawer-trigger');
        if (trigger) (trigger as HTMLDivElement).click();
      }}
      className={`p-2.5 text-gray-700 hover:text-pink-400 transition-all duration-200 relative ${className}`}
    >
      <ShoppingCart
        className={`h-6 w-6 transition-all duration-200 ${
          isAnimating ? 'scale-110' : ''
        }`}
        strokeWidth={2}
      />
    </button>
  );
};